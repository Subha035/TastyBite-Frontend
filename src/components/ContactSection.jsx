import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, ArrowUpRight, Sparkles, Check, AlertCircle } from 'lucide-react';

const contactDetails = [
  { id: 'phone', title: 'Call Direct', value: '+91 98765 43210', href: 'tel:+919876543210', icon: Phone },
  { id: 'email', title: 'Drop a Line', value: 'support@tastybite.com', href: 'mailto:support@tastybite.com', icon: Mail },
  { id: 'location', title: 'Find Us', value: 'Marathahalli, Bengaluru', href: 'https://maps.google.com', icon: MapPin },
  { id: 'hours', title: 'Open Daily', value: '11:00 AM - 11:00 PM', href: null, icon: Clock }
];

const ContactSection = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' }); // 'error' | 'success' | 'loading'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      return setStatus({ type: 'error', text: 'Please complete the expression below.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setStatus({ type: 'error', text: 'That email looks a bit unusual.' });
    }

    setStatus({ type: 'loading', text: 'Sending data...' });

    setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem('contact-messages') || '[]');
        stored.unshift({ id: 'msg_' + Date.now(), name, email, message, createdAt: new Date().toISOString() });
        window.localStorage.setItem('contact-messages', JSON.stringify(stored));
        
        setStatus({ type: 'success', text: 'Received. We will speak soon.' });
        setName(''); setEmail(''); setMessage('');
        setTimeout(() => setStatus({ type: '', text: '' }), 5000);
      } catch {
        setStatus({ type: 'error', text: 'Storage failed. Please try again.' });
      }
    }, 1000);
  };

  return (
    <section className="modern-contact-viewport">
      <style>{`
        .modern-contact-viewport {
          --bg-dark: var(--bg-main, #0a0a0c);
          --panel-bg: var(--card-bg, rgba(20, 20, 25, 0.7));
          --accent: #ff6b35;
          --accent-glow: rgba(255, 107, 53, 0.15);
          --text-bright: var(--text-main, #f3f4f6);
          --text-dim: var(--text-muted, #9ca3af);
          --border: var(--border-color, rgba(255, 255, 255, 0.08));
          
          background-color: var(--bg-main);
          color: var(--text-main);
          min-height: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 4rem 2rem;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Ambient Mesh Background */
        .modern-contact-viewport::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
          top: -10%;
          right: -5%;
          z-index: 0;
          pointer-events: none;
        }

        .modern-layout-box {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1100px;
          background: var(--panel-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 32px;
          display: grid;
          grid-template-columns: 1fr;
        }

        @media (min-width: 992px) {
          .modern-layout-box { grid-template-columns: 1.1fr 0.9fr; }
        }

        /* Brand Column */
        .brand-column {
          padding: 3.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
        }

        @media (min-width: 992px) {
          .brand-column { border-bottom: none; border-right: 1px solid var(--border); }
        }

        .live-status-pill {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-bright);
          letter-spacing: 0.02em;
        }

        .status-pulse-dot {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 12px #10b981;
        }

        .brand-heading {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.04em;
          margin: 2.5rem 0 1.5rem 0;
        }

        .brand-heading span {
          color: transparent;
          -webkit-text-stroke: 1px rgba(255, 255, 255, 0.6);
        }

        .brand-sub {
          font-size: 1.05rem;
          line-height: 1.6;
          color: var(--text-dim);
          max-width: 420px;
          margin-bottom: 3.5rem;
        }

        /* Modern Micro UI Chips */
        .chips-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .interactive-chip {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          padding: 1.2rem;
          border-radius: 20px;
          text-decoration: none;
          color: inherit;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 110px;
        }

        .interactive-chip:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .chip-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--text-dim);
        }

        .chip-val {
          font-size: 0.95rem;
          font-weight: 600;
          margin-top: auto;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Conversational Interactive Form */
        .form-column {
          padding: 3.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .conversational-form {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .input-wrapper label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-dim);
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .clean-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--border);
          padding: 0.5rem 0 0.75rem 0;
          font-size: 1.15rem;
          color: var(--text-bright);
          outline: none;
          transition: all 0.3s;
        }

        .clean-input:focus {
          border-bottom-color: var(--accent);
          box-shadow: 0 1px 0 var(--accent);
        }

        .clean-input::placeholder {
          color: var(--text-muted);
          opacity: 0.5;
        }

        /* Hyper-Minimal Submit Button */
        .neon-submit {
          margin-top: 1rem;
          background: linear-gradient(135deg, #ef4444 0%, #ea580c 100%);
          color: #ffffff;
          border: none;
          padding: 1.2rem;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.25s;
        }

        .neon-submit:hover:not(:disabled) {
          opacity: 0.95;
          transform: scale(1.02);
          box-shadow: 0 10px 25px rgba(239, 68, 68, 0.25);
        }

        .neon-submit:disabled {
          background: var(--border);
          color: var(--text-dim);
          cursor: not-allowed;
        }

        /* Notification Toast Inside Form */
        .toast-banner {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 1rem;
          border-radius: 14px;
          font-size: 0.9rem;
          animation: fadeIn 0.3s ease forwards;
        }

        .toast-error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; }
        .toast-success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #34d399; }
        .toast-loading { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); color: var(--text-bright); }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .modern-contact-viewport {
            padding: 1.5rem 1rem;
            align-items: flex-start;
          }

          .modern-layout-box {
            border-radius: 20px;
          }

          .brand-column, .form-column {
            padding: 2rem 1.5rem;
          }

          .brand-heading {
            font-size: 2.2rem;
            margin: 1.5rem 0 1rem 0;
          }

          .brand-sub {
            margin-bottom: 2rem;
            font-size: 0.95rem;
          }

          .interactive-chip {
            min-height: 90px;
            padding: 1rem;
          }
        }

        @media (max-width: 600px) {
          .modern-contact-viewport {
            padding: 0.75rem 0.5rem;
          }

          .modern-layout-box {
            border-radius: 16px;
          }

          .brand-column, .form-column {
            padding: 1.5rem 1.25rem;
          }

          .brand-heading {
            font-size: 1.6rem;
            margin: 1rem 0 0.75rem 0;
          }

          .brand-sub {
            font-size: 0.88rem;
            margin-bottom: 1.5rem;
          }

          .chips-container {
            grid-template-columns: 1fr 1fr;
            gap: 0.6rem;
          }

          .interactive-chip {
            min-height: 80px;
            padding: 0.8rem;
            border-radius: 14px;
          }

          .chip-val {
            font-size: 0.8rem;
          }

          .conversational-form {
            gap: 1.8rem;
          }

          .clean-input {
            font-size: 1rem;
          }

          .neon-submit {
            padding: 1rem;
            font-size: 0.9rem;
          }
        }

        @media (max-width: 400px) {
          .modern-contact-viewport {
            padding: 0.5rem 0.25rem;
          }

          .modern-layout-box {
            border-radius: 12px;
            border-left: none;
            border-right: none;
            border-radius: 0;
          }

          .brand-column, .form-column {
            padding: 1.2rem 1rem;
          }

          .brand-heading {
            font-size: 1.4rem;
            margin: 0.75rem 0 0.5rem 0;
          }

          .brand-sub {
            font-size: 0.82rem;
            margin-bottom: 1.2rem;
            line-height: 1.5;
          }

          .live-status-pill {
            font-size: 0.7rem;
            padding: 0.35rem 0.7rem;
          }

          .chips-container {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .interactive-chip {
            min-height: auto;
            padding: 0.75rem;
            border-radius: 12px;
            flex-direction: row;
            align-items: center;
            gap: 0.75rem;
          }

          .chip-top {
            flex-shrink: 0;
          }

          .chip-val {
            font-size: 0.78rem;
            margin-top: 0;
          }

          .chip-val div {
            display: none;
          }

          .conversational-form {
            gap: 1.5rem;
          }

          .input-wrapper label {
            font-size: 0.7rem;
          }

          .clean-input {
            font-size: 0.92rem;
            padding: 0.4rem 0 0.6rem 0;
          }

          .clean-input::placeholder {
            font-size: 0.82rem;
          }

          .neon-submit {
            padding: 0.85rem;
            font-size: 0.85rem;
            border-radius: 12px;
          }

          .toast-banner {
            font-size: 0.8rem;
            padding: 0.75rem;
          }
        }
      `}</style>

      <div className="modern-layout-box">
        
        {/* Left Column: Brand Statement & Modern Minimal Cards */}
        <div className="brand-column">
          <div>
            <div className="live-status-pill">
              <span className="status-pulse-dot" />
              <span>Conscious Hospitality</span>
            </div>
            <h2 className="brand-heading">
              Make your next <br />
              visit feel <span>special.</span>
            </h2>
            <p className="brand-sub">
              Drop by for a tailored culinary experience, coordinate upcoming private catering events or secure instant reservations.
            </p>
          </div>

          <div className="chips-container">
            {contactDetails.map((chip) => {
              const Icon = chip.icon;
              const Clickable = chip.href ? 'a' : 'div';
              return (
                <Clickable 
                  key={chip.id} 
                  href={chip.href} 
                  target={chip.id === 'location' ? '_blank' : undefined} 
                  rel="noopener noreferrer"
                  className="interactive-chip"
                >
                  <div className="chip-top">
                    <Icon size={16} strokeWidth={1.5} />
                    {chip.href && <ArrowUpRight size={14} style={{ opacity: 0.6 }} />}
                  </div>
                  <div className="chip-val">
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '2px' }}>{chip.title}</div>
                    {chip.value}
                  </div>
                </Clickable>
              );
            })}
          </div>
        </div>

        {/* Right Column: High-End Interactive Form */}
        <div className="form-column">
          <form className="conversational-form" onSubmit={handleSubmit}>
            
            {status.text && (
              <div className={`toast-banner toast-${status.type}`}>
                {status.type === 'error' && <AlertCircle size={16} />}
                {status.type === 'success' && <Check size={16} />}
                <span>{status.text}</span>
              </div>
            )}

            <div className="input-wrapper">
              <label htmlFor="user-name">Your identity</label>
              <input 
                id="user-name"
                type="text" 
                placeholder="What should we call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="clean-input"
                autoComplete="off"
              />
            </div>

            <div className="input-wrapper">
              <label htmlFor="user-email">Digital Address</label>
              <input 
                id="user-email"
                type="email" 
                placeholder="Where can we send our response?"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="clean-input"
                autoComplete="off"
              />
            </div>

            <div className="input-wrapper">
              <label htmlFor="user-msg">The Intent</label>
              <input 
                id="user-msg"
                type="text" 
                placeholder="Reservations, dietary paths, custom events..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="clean-input"
                autoComplete="off"
              />
            </div>

            <button 
              type="submit" 
              className="neon-submit" 
              disabled={status.type === 'loading'}
            >
              <span>{status.type === 'loading' ? 'Processing Transaction' : 'Initiate Request'}</span>
              {status.type !== 'loading' && <Sparkles size={16} />}
            </button>

          </form>
        </div>

      </div>
    </section>
  );
};

export default ContactSection;