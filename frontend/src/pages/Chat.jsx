import { useEffect, useRef, useState } from 'react';
import { SendHorizontal, Sparkles } from 'lucide-react';

import api from '../utils/api';
import Spinner from '../components/Spinner';

const SAFE_ERROR_REPLY = 'Sorry, something went wrong. Please try again.';
const WELCOME_MESSAGE = 'Hi 👋, I am your chat assistant. How can I help you today?';
const QUICK_MESSAGES = [
  {
    label: '📚 Ask about courses',
    message: 'Can you help me with course-related information?',
  },
  {
    label: '🧑‍🏫 Contact teacher',
    message: 'How can I contact my teacher?',
  },
  {
    label: '📅 Check schedule',
    message: 'How can I check my class schedule?',
  },
  {
    label: '❓ General help',
    message: 'I need general help using this CMS.',
  },
];

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length > 0) {
        return prev;
      }

      return [{ sender: 'bot', text: WELCOME_MESSAGE }];
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  async function sendMessage(rawMessage) {
    const message = String(rawMessage || '').trim();
    if (!message || isSending) {
      return;
    }

    setMessages((prev) => [...prev, { sender: 'user', text: message }]);
    setIsSending(true);

    try {
      const response = await api.post('/chat', { message });
      const reply =
        typeof response?.data?.reply === 'string' && response.data.reply.trim()
          ? response.data.reply.trim()
          : SAFE_ERROR_REPLY;

      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
      console.error('Chat request failed:', error);
      setMessages((prev) => [...prev, { sender: 'bot', text: SAFE_ERROR_REPLY }]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSend(event) {
    event.preventDefault();
    const message = input;
    setInput('');
    void sendMessage(message);
  }

  function handleQuickMessage(message) {
    void sendMessage(message);
  }

  return (
    <div className="page chat-page">
      <div className="page__header">
        <div>
          <h2 className="page__title">Chat Assistant</h2>
          <p className="chat-page__subtitle">Ask quick questions and get instant help.</p>
        </div>
      </div>

      <section className="chat-card" aria-label="CMS Chat Assistant">
        <div className="chat-quick-actions" aria-label="Quick chat messages">
          {QUICK_MESSAGES.map((item) => (
            <button
              key={item.label}
              type="button"
              className="chat-quick-btn"
              onClick={() => handleQuickMessage(item.message)}
              disabled={isSending}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="chat-messages" role="log" aria-live="polite">
          {messages.map((message, index) => (
            <div key={`${message.sender}-${index}`} className={`chat-message chat-message--${message.sender}`}>
              <div className="chat-bubble">
                {message.sender === 'bot' && index === 0 ? (
                  <span className="chat-bubble__intro">
                    <Sparkles size={14} />
                    <span>{message.text}</span>
                  </span>
                ) : (
                  message.text
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="chat-message chat-message--bot">
              <div className="chat-bubble chat-bubble--loading">
                <Spinner size="small" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            className="form-input chat-input"
            placeholder="Type your question..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={1000}
            disabled={isSending}
          />
          <button type="submit" className="btn btn--primary" disabled={isSending || !input.trim()}>
            <SendHorizontal size={18} />
            <span>Send</span>
          </button>
        </form>
      </section>
    </div>
  );
}

export default Chat;
