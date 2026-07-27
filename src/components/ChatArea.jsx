import React, { useRef, useEffect } from 'react';
import {
  Paperclip,
  Mic,
  Send,
  Gift,
  CheckCheck
} from 'lucide-react';

const ChatArea = ({
  messages,
  input,
  setInput,
  handleSendMessage,
  isTyping = false,
  onOrderDish
}) => {
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestionPills = [
    { label: 'Pizza Menu', icon: '🍕' },
    { label: 'Veg Options', icon: '🥗' },
    { label: 'Today\'s Offers', icon: '🔥' },
    { label: 'Desserts', icon: '🍰' },
    { label: 'Timing', icon: '📍' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const formatBotText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      return (
        <React.Fragment key={lineIdx}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={partIdx}>{part.slice(1, -1)}</code>;
            }
            return part;
          })}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="chat-panel">
      {/* Top Welcome Header */}
      <header className="chat-header">
        <div className="welcome-info">
          <h2 className="welcome-title">
            👋 Welcome back!
          </h2>
          <span className="welcome-subtitle">How can I help you today?</span>
        </div>
        <div className="header-actions">
          <button
            className="offers-btn"
            onClick={() => handleSendMessage("Tell me about today's offers")}
          >
            <Gift size={16} />
            Today's Offers
          </button>
          {/* <div className="profile-avatar" title="User Profile">
            JD
          </div> */}
        </div>
      </header>

      {/* Chat Messages Log */}
      <div className="chat-history">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-row ${msg.sender === 'user' ? 'user' : 'bot'}`}
          >
            {msg.sender === 'bot' && (
              <div className="bot-avatar-container">
                {/* Custom SVG Robot Face */}
                <svg viewBox="0 0 100 100" className="bot-avatar-svg">
                  <circle cx="50" cy="50" r="48" fill="#121318" />
                  <rect x="25" y="32" width="50" height="36" rx="8" fill="#2d2f39" />
                  <rect x="30" y="37" width="40" height="26" rx="5" fill="#0f1013" />
                  <circle cx="42" cy="50" r="3.5" fill="#d85e13" />
                  <circle cx="58" cy="50" r="3.5" fill="#d85e13" />
                  <circle cx="18" cy="50" r="4" fill="#d85e13" />
                  <circle cx="82" cy="50" r="4" fill="#d85e13" />
                  <rect x="47" y="24" width="6" height="8" fill="#d85e13" />
                  <circle cx="50" cy="22" r="3" fill="#d85e13" />
                  <path d="M43 56 Q50 60 57 56" stroke="#d85e13" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </svg>
              </div>
            )}

            <div className="message-content">
              {msg.sender === 'user' ? (
                <div className="user-bubble">
                  <span>{msg.text}</span>
                  <div className="message-meta">
                    {msg.time} <span className="double-checkmark"><CheckCheck size={12} /></span>
                  </div>
                </div>
              ) : (
                <div className="bot-bubble">
                  {msg.text && <div className="bot-bubble-text">{formatBotText(msg.text)}</div>}

                  {/* Dish recommendation cards list with direct Order Now link */}
                  {msg.pizzaList && (
                    <div className="pizza-recommendations-list">
                      {msg.pizzaList.map((pizza, index) => (
                        <div key={index} className="pizza-card">
                          <img src={pizza.image} alt={pizza.title} className="pizza-card-img" />
                          <div className="pizza-card-details">
                            <div className="pizza-card-title-row">
                              <div className={`veg-indicator ${pizza.isVeg === false ? 'non-veg' : 'veg'}`}></div>
                              <span className="pizza-title">{pizza.title}</span>
                            </div>
                            <p className="pizza-desc">{pizza.desc}</p>
                          </div>
                          <div className="pizza-card-right-action" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <span className="pizza-price">{pizza.price}</span>
                            {onOrderDish && (
                              <button
                                type="button"
                                className="chat-order-btn"
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #ef4444 0%, #ea580c 100%)',
                                  color: '#ffffff',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                                onClick={() => onOrderDish(pizza)}
                              >
                                Order Now
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.subtext && <div className="bot-bubble-subtext">{msg.subtext}</div>}
                  <div className="message-meta" style={{ alignSelf: 'flex-start' }}>{msg.time}</div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message-row bot">
            <div className="bot-avatar-container">
              <svg viewBox="0 0 100 100" className="bot-avatar-svg">
                <circle cx="50" cy="50" r="48" fill="#121318" />
                <rect x="25" y="32" width="50" height="36" rx="8" fill="#2d2f39" />
                <rect x="30" y="37" width="40" height="26" rx="5" fill="#0f1013" />
                <circle cx="42" cy="50" r="3.5" fill="#d85e13" />
                <circle cx="58" cy="50" r="3.5" fill="#d85e13" />
              </svg>
            </div>
            <div className="bot-bubble typing-bubble">
              <style>{`
                @keyframes botTypingBounce {
                  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                  40% { transform: translateY(-6px); opacity: 1; }
                }
                .typing-dots-wrapper {
                  display: inline-flex;
                  align-items: center;
                  gap: 5px;
                  margin-right: 8px;
                }
                .dot-animated {
                  width: 7px;
                  height: 7px;
                  border-radius: 50%;
                  display: inline-block;
                  animation: botTypingBounce 1.3s infinite ease-in-out both;
                }
                .dot-animated.d1 { background: #f59e0b; animation-delay: 0s; }
                .dot-animated.d2 { background: #ef4444; animation-delay: 0.2s; }
                .dot-animated.d3 { background: #10b981; animation-delay: 0.4s; }
                .typing-text-label {
                  font-size: 0.85rem;
                  color: #94a3b8;
                  font-weight: 500;
                }
              `}</style>
              <div className="typing-dots-wrapper">
                <span className="dot-animated d1"></span>
                <span className="dot-animated d2"></span>
                <span className="dot-animated d3"></span>
              </div>
              <span className="typing-text-label">TastyBite Bot is typing...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="suggestion-pills-container">
        {suggestionPills.map((pill, idx) => (
          <button
            key={idx}
            className="suggestion-pill"
            onClick={() => handleSendMessage(pill.label)}
          >
            <span>{pill.icon}</span>
            <span>{pill.label}</span>
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="input-area-container">
        <form onSubmit={handleSubmit} className="input-row">
          <button
            type="button"
            className="attachment-btn"
            title="Attach file"
            onClick={() => alert("Attachment feature coming soon!")}
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            type="button"
            className="voice-btn"
            title="Voice input"
            onClick={() => alert("Voice assistant coming soon!")}
          >
            <Mic size={18} />
          </button>

          <button type="submit" className="send-btn" title="Send message">
            <Send size={16} />
          </button>
        </form>
        <div className="disclaimer-text">
          AI responses may not always be accurate. Please confirm details with the restaurant.
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
