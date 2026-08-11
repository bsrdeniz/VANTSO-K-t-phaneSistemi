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

  const handleForgotPassword = async () => {
    const inputEmail = prompt('Şifrenizi varsayılan şifreye ("vantso123") sıfırlamak için lütfen yönetici e-posta adresinizi girin:');
    if (!inputEmail) return;

    if (inputEmail.trim().toLowerCase() !== 'admin@vantso.org.tr') {
      alert('Hata: Girilen e-posta adresi geçerli bir yönetici e-postası değildir!');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.resetPassword(inputEmail.trim().toLowerCase());
      alert(res.message || 'Şifreniz başarıyla varsayılan şifre ("vantso123") olarak güncellenmiştir! Şimdi bu şifreyle giriş yapabilirsiniz.');
    } catch (err) {
      alert(err.message || 'Şifre sıfırlanırken bir hata oluştu.');
    } finally {
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

          {/* Forgot Password Link */}
          <div className="text-right mb-4" style={{ marginTop: '-12px', marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="forgot-password-link"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
                outline: 'none'
              }}
            >
              Şifremi Unuttum
            </button>
          </div>

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
