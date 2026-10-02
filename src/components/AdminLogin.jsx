import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  LogIn, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { adminLogin as apiAdminLogin, logActivity } from '../services/apiService';

const AdminLogin = ({ onSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Please enter both admin username and password.');
      return;
    }

    setLoading(true);

    // Check credentials (exact match: Admin035 / Admin@035)
    const isDirectMatch = (trimmedUser === 'Admin035') && (trimmedPass === 'Admin@035');

    // Also attempt backend authentication
    let backendSuccess = false;
    try {
      const res = await apiAdminLogin(trimmedUser, trimmedPass);
      if (res && res.success) {
        backendSuccess = true;
      }
    } catch {
      // Fallback to direct credentials match
    }

    if (isDirectMatch || backendSuccess) {
      if (rememberMe) {
        try { window.localStorage.setItem('tastybite-admin-auth', 'true'); } catch {}
      }
      try { window.sessionStorage.setItem('tastybite-admin-auth', 'true'); } catch {}

      logActivity('Admin user Admin035 logged in to management console', 'admin');
      setLoading(false);
      onSuccess();
    } else {
      setLoading(false);
      setError('Invalid username or password. Please check your credentials.');
    }
  };

  const handleFillDemo = () => {
    setUsername('Admin035');
    setPassword('Admin@035');
    setError('');
  };

  return (
    <div className="admin-login-wrapper">
      <style>{`
        .admin-login-wrapper {
          min-height: 85vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          box-sizing: border-box;
          position: relative;
        }

        .admin-login-card {
          width: 100%;
          max-width: 440px;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
          border-radius: 24px;
          padding: 36px 32px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05);
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 22px;
          backdrop-filter: blur(12px);
          animation: adminFadeIn 0.35s ease-out;
        }

        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .admin-login-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px;
          border-radius: 20px;
          background: rgba(216, 94, 19, 0.12);
          color: #d85e13;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          width: fit-content;
        }

        .admin-login-header h2 {
          margin: 8px 0 6px 0;
          font-size: 1.65rem;
          font-weight: 900;
          color: var(--text-main, #1e293b);
          letter-spacing: -0.5px;
        }

        .admin-login-header p {
          margin: 0;
          font-size: 0.86rem;
          color: var(--text-muted, #64748b);
          line-height: 1.4;
        }

        .admin-login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .admin-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-input-group label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-main, #334155);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .admin-input-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-main, #f8fafc);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 14px;
          padding: 10px 14px;
          transition: all 0.2s ease;
        }

        .admin-input-box:focus-within {
          border-color: #d85e13;
          box-shadow: 0 0 0 3px rgba(216, 94, 19, 0.18);
          background: var(--card-bg, #ffffff);
        }

        .admin-input-box input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
          color: var(--text-main, #0f172a);
          font-family: inherit;
        }

        .admin-input-icon {
          color: var(--text-muted, #94a3b8);
          display: flex;
          align-items: center;
        }

        .toggle-password-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-muted, #94a3b8);
          display: flex;
          align-items: center;
          padding: 2px;
          transition: color 0.15s ease;
        }

        .toggle-password-btn:hover {
          color: var(--text-main, #0f172a);
        }

        .admin-login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #ef4444;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 600;
          animation: adminShake 0.3s ease;
        }

        @keyframes adminShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .admin-login-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-muted, #64748b);
        }

        .admin-remember-me {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
        }

        .admin-remember-me input {
          accent-color: #d85e13;
          cursor: pointer;
        }

        .admin-autofill-btn {
          background: transparent;
          border: none;
          color: #d85e13;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0;
          transition: opacity 0.15s ease;
        }

        .admin-autofill-btn:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .admin-login-submit-btn {
          background: linear-gradient(135deg, #d85e13 0%, #ea580c 100%);
          color: #ffffff;
          border: none;
          padding: 12px 20px;
          border-radius: 14px;
          font-size: 0.92rem;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(216, 94, 19, 0.3);
          margin-top: 4px;
        }

        .admin-login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(216, 94, 19, 0.45);
        }

        .admin-login-submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .admin-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          color: var(--text-muted, #64748b);
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .admin-back-btn:hover {
          border-color: var(--text-main, #334155);
          color: var(--text-main, #334155);
          background: var(--bg-main, #f8fafc);
        }
      `}</style>

      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-badge">
            <ShieldCheck size={14} />
            TastyBite Admin Portal
          </div>
          <h2>Admin Sign In</h2>
          <p>Please enter your authorized administrator credentials to manage kitchen orders, menu and reservations.</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-input-group">
            <label htmlFor="admin-username-input">
              <User size={13} /> Username
            </label>
            <div className="admin-input-box">
              <span className="admin-input-icon"><User size={16} /></span>
              <input
                id="admin-username-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter admin username"
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label htmlFor="admin-password-input">
              <Lock size={13} /> Password
            </label>
            <div className="admin-input-box">
              <span className="admin-input-icon"><Lock size={16} /></span>
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="admin-login-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="admin-login-options">
            <label className="admin-remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>

            {/* <button
              type="button"
              className="admin-autofill-btn"
              onClick={handleFillDemo}
              title="Autofill Admin035 credentials"
            >
              <KeyRound size={12} /> Auto-fill credentials
            </button> */}
          </div>

          <button
            type="submit"
            className="admin-login-submit-btn"
            disabled={loading}
          >
            <LogIn size={16} />
            {loading ? 'Authenticating...' : 'Sign In to Admin Console'}
          </button>

          {onCancel && (
            <button
              type="button"
              className="admin-back-btn"
              onClick={onCancel}
            >
              <ArrowLeft size={14} /> Back to Customer Menu
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
