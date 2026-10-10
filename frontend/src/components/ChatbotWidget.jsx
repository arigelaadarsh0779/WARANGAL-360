import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';

const QUICK_PROMPTS = [
  { label: '📸 How to report?', text: 'How do I report a civic issue?' },
  { label: '🔍 Track complaint', text: 'How do I track my complaint status?' },
  { label: '🚨 Emergency numbers', text: 'What are emergency contact numbers for Warangal?' },
  { label: '📊 Priority system', text: 'How does the AI priority scoring work?' },
];

const INITIAL_MESSAGE = {
  id: 0,
  sender: 'bot',
  text: "👋 **నమస్కారం!** I'm **NAGA**, your WARANGAL 360 AI assistant!\n\nI can help you report civic issues, track complaints, and find emergency numbers. How can I assist you today?",
  time: new Date(),
};

function formatText(text) {
  // Bold
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // New lines
  formatted = formatted.replace(/\n/g, '<br/>');
  return formatted;
}

export default function ChatbotWidget({ lang = 'en' }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pulsing, setPulsing] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (open) setPulsing(false);
  }, [open]);

  async function sendMessage(text) {
    const msgText = text || input.trim();
    if (!msgText) return;

    const userMsg = { id: Date.now(), sender: 'user', text: msgText, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await api.sendChatMessage(msgText);
      const reply = typeof data === 'object' ? data.reply : data;
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: reply || "I'm having trouble responding right now. Please try again.",
        time: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "⚠️ I couldn't connect to the server. Please check your connection and try again.",
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        className={`chatbot-fab ${pulsing ? 'chatbot-fab--pulse' : ''} ${open ? 'chatbot-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open NAGA AI Assistant"
        title="Chat with NAGA — WARANGAL 360 AI Assistant"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="9" cy="10" r="1" fill="currentColor"/>
            <circle cx="12" cy="10" r="1" fill="currentColor"/>
            <circle cx="15" cy="10" r="1" fill="currentColor"/>
          </svg>
        )}
        {!open && messages.length === 1 && (
          <span className="chatbot-fab-badge">AI</span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-avatar">
              <span>N</span>
            </div>
            <div className="chatbot-header-info">
              <h4>NAGA AI</h4>
              <p>WARANGAL 360 Assistant • Online</p>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chatbot-msg chatbot-msg--${msg.sender}`}>
                {msg.sender === 'bot' && (
                  <div className="chatbot-msg-avatar"><span>N</span></div>
                )}
                <div className="chatbot-msg-bubble">
                  <div
                    className="chatbot-msg-text"
                    dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                  />
                  <span className="chatbot-msg-time">
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-msg chatbot-msg--bot">
                <div className="chatbot-msg-avatar"><span>N</span></div>
                <div className="chatbot-msg-bubble">
                  <div className="chatbot-typing">
                    <span/><span/><span/>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && !loading && (
            <div className="chatbot-quick-prompts">
              {QUICK_PROMPTS.map(qp => (
                <button key={qp.text} onClick={() => sendMessage(qp.text)} className="chatbot-quick-btn">
                  {qp.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input-row">
            <textarea
              ref={inputRef}
              className="chatbot-input"
              placeholder={lang === 'te' ? 'మీ సందేశం టైప్ చేయండి...' : 'Ask NAGA anything...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <button
              className="chatbot-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
