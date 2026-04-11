import { useEffect, useRef, useState } from 'react';
import { MessageCircle, SendHorizontal, X } from 'lucide-react';

import api from '../utils/api';
import Spinner from './Spinner';

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

function ChatWidget() {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'bot', text: WELCOME_MESSAGE }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!showChat) {
      return;
    }

    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showChat]);

  async function sendMessage(rawMessage) {
    const message = String(rawMessage || '').trim();
    if (!message || loading) {
      return;
    }

    setMessages((prev) => [...prev, { sender: 'user', text: message }]);
    setLoading(true);

    try {
      const response = await api.post('/chat', { message });
      const reply =
        typeof response?.data?.reply === 'string' && response.data.reply.trim()
          ? response.data.reply.trim()
          : SAFE_ERROR_REPLY;

      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
      console.error('Chat widget request failed:', error);
      setMessages((prev) => [...prev, { sender: 'bot', text: SAFE_ERROR_REPLY }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const message = input;
    setInput('');
    void sendMessage(message);
  }

  function handleQuickMessage(message) {
    void sendMessage(message);
  }

  return (
    <div className={`chat-widget ${showChat ? 'chat-widget--open' : ''}`}>
      <section className="chat-widget__panel" aria-hidden={!showChat}>
        <header className="chat-widget__header">
          <h3 className="chat-widget__title">Chat Assistant</h3>
          <button
            type="button"
            className="chat-widget__icon-btn"
            onClick={() => setShowChat(false)}
            aria-label="Close chat assistant"
          >
            <X size={16} />
          </button>
        </header>

        <div className="chat-widget__quick-actions" aria-label="Quick chat actions">
          {QUICK_MESSAGES.map((item) => (
            <button
              key={item.label}
              type="button"
              className="chat-widget__quick-btn"
              onClick={() => handleQuickMessage(item.message)}
              disabled={loading}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="chat-widget__messages" role="log" aria-live="polite">
          {messages.map((message, index) => (
            <div key={`${message.sender}-${index}`} className={`chat-widget__message chat-widget__message--${message.sender}`}>
              <div className="chat-widget__bubble">{message.text}</div>
            </div>
          ))}

          {loading && (
            <div className="chat-widget__message chat-widget__message--bot">
              <div className="chat-widget__bubble chat-widget__bubble--loading">
                <Spinner size="small" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form className="chat-widget__input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-widget__input"
            placeholder="Ask anything..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={1000}
            disabled={loading}
          />
          <button
            type="submit"
            className="chat-widget__send-btn"
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            <SendHorizontal size={16} />
          </button>
        </form>
      </section>

      <button
        type="button"
        className="chat-widget__toggle"
        onClick={() => setShowChat((prev) => !prev)}
        aria-expanded={showChat}
        aria-label={showChat ? 'Close chat assistant' : 'Open chat assistant'}
      >
        {showChat ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
}

export default ChatWidget;
