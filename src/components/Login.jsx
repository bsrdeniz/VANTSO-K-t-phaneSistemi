import React, { useState } from 'react';
import { Mail, Lock, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await api.login(email, password);
      api.setActiveUser(user);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'E-posta adresi veya şifre hatalı!');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-logo-area">
          <div className="login-logo-badge">
            <span>VAN</span>
            <span>TSO</span>
          </div>
          <h2>VAN TSO KÜTÜPHANESİ</h2>
          <p>Kurumsal Otomasyon Sistemi</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error-banner">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="login-form-group">
            <label className="login-label">E-Posta Adresi</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input
                type="email"
                className="login-input"
                placeholder="admin@vantso.org.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-form-group">
            <label className="login-label">Şifre</label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
