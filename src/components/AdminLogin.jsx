import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, ADMIN_EMAIL, ADMIN_PASSWORD } from '../firebaseConfig';
import { adminLogin as apiAdminLogin } from '../services/apiService';

const AdminLogin = ({ onSuccess }) => {
  const [username, setUsername] = useState('TastyAdmin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (username !== 'TastyAdmin' && username !== ADMIN_EMAIL) {
      setError('Username must be TastyAdmin or tastyadmin@tastybite.com.');
      setLoading(false);
      return;
    }

    const passwordToUse = password || ADMIN_PASSWORD;

    // Try Spring Boot Backend REST Auth API first
    try {
      const res = await apiAdminLogin(ADMIN_EMAIL, passwordToUse);
      if (res && res.success) {
        setLoading(false);
        onSuccess();
        return;
      }
    } catch (apiErr) {
      console.warn('Backend admin login API note:', apiErr);
    }

    // Fallback to Firebase Auth
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, passwordToUse);
      setLoading(false);
      onSuccess();
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, passwordToUse);
          setLoading(false);
          onSuccess();
          return;
        } catch (createErr) {
          console.error('Firebase admin account creation error:', createErr);
        }
      }

      setLoading(false);
      setError('Invalid password or unable to sign in.');
      console.error('Firebase admin login error:', err);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h2>Admin Login</h2>
        <p className="admin-login-subtitle">Enter the admin username and password to access the dashboard.</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </label>
          {error && <div className="admin-login-error">{error}</div>}
          <button type="submit" className="admin-login-button" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
