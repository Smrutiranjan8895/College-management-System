import { ok } from '../utils/response.js';

const GEMINI_BASE_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';
const SAFE_ERROR_REPLY = 'Sorry, something went wrong. Please try again.';
const POLITE_ENDING = 'Let me know if you need further assistance 😊';
const MAX_MESSAGE_LENGTH = 1000;
const DEFAULT_TIMEOUT_MS = 7000;

function resolveGeminiConfig() {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.gemini_api_key || '').trim();
  const model = (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();

  return {
    apiKey,
    model,
    endpoint: `${GEMINI_BASE_ENDPOINT}/${encodeURIComponent(model)}:generateContent`,
  };
}

function buildGeminiPrompt(message) {
  return [
    'You are a helpful assistant for a college CMS system.',
    'Answer clearly, politely, and concisely.',
    'Always end your response with:',
    '"Let me know if you need further assistance 😊"',
    '',
    `User question: ${message}`,
  ].join('\n');
}

function ensurePoliteEnding(reply) {
  const normalizedReply = typeof reply === 'string' ? reply.trim() : '';

  if (!normalizedReply) {
    return null;
  }

  if (normalizedReply.includes(POLITE_ENDING)) {
    return normalizedReply;
  }

  return `${normalizedReply}\n\n${POLITE_ENDING}`;
}

function parseBody(event) {
  if (!event?.body) {
    return null;
  }

  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

function extractUserId(event) {
  const claims =
    event?.requestContext?.authorizer?.claims ||
    event?.requestContext?.authorizer?.jwt?.claims ||
    {};

  if (claims.sub) {
    return String(claims.sub).trim();
  }

  if (claims['cognito:username']) {
    return String(claims['cognito:username']).trim();
  }

  return null;
}

function extractGeminiReply(payload) {
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== 'string') {
    return null;
  }

  return text.trim();
}

async function callGemini(message, signal) {
  const { apiKey, endpoint, model } = resolveGeminiConfig();

  if (!apiKey) {
    throw new Error('Missing Gemini API key');
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: buildGeminiPrompt(message) },
        ],
      },
    ],
  };

  const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini API failed (${response.status}) on model ${model}: ${details.slice(0, 300)}`);
  }

  const payload = await response.json();
  const reply = ensurePoliteEnding(extractGeminiReply(payload));

  if (!reply) {
    throw new Error('Gemini API returned empty reply');
  }

  return reply;
}

export const handler = async (event) => {
  if (event?.httpMethod !== 'POST') {
    return ok(405, { reply: SAFE_ERROR_REPLY });
  }

  const userId = extractUserId(event);
  const body = parseBody(event);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    console.warn('chat: rejected invalid message payload', {
      userId,
      hasMessage: Boolean(message),
      messageLength: message.length,
    });
    return ok(400, { reply: SAFE_ERROR_REPLY });
  }

  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

  const { model } = resolveGeminiConfig();

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const reply = await callGemini(message, controller.signal);

    console.log('chat: generated reply', {
      userId,
      model,
      inputLength: message.length,
      replyLength: reply.length,
    });

    return ok(200, { reply });
  } catch (error) {
    console.error('chat: Gemini request failed', {
      userId,
      model,
      timedOut: error?.name === 'AbortError',
      errorName: error?.name || 'UnknownError',
      errorMessage: error?.message || 'No error message',
    });

    return ok(200, { reply: SAFE_ERROR_REPLY });
  } finally {
    clearTimeout(timeoutHandle);
  }
};
