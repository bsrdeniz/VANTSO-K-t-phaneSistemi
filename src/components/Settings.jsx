// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\Settings.jsx
import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Lock } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView() {
  const [activeUser, setActiveUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dbDriver, setDbDriver] = useState('');

  useEffect(() => {
    setActiveUser(api.getActiveUser());

    const fetchDbStatus = async () => {
      try {
        const config = await api.getSettings();
        setDbDriver(config.dbDriver || 'SQLite (Geçici)');
      } catch (err) {
        console.error('Veritabanı bilgisi alınamadı:', err);
      }
    };
    fetchDbStatus();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Lütfen tüm alanları doldurun!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Yeni şifreler eşleşmiyor!');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('Yeni şifre en az 4 karakterden oluşmalıdır!');
      return;
    }

    setIsLoading(true);
    try {
      await api.forceChangePassword(newPassword, activeUser?.id);
      setSuccessMsg('Giriş şifreniz başarıyla güncellendi.');
      
      // Reset inputs
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Şifre güncellenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-view" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <div className="card-header-with-icon" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.05)',
            padding: '10px',
            borderRadius: '8px',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Lock size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'var(--primary-color)', fontSize: '18px', fontWeight: '600' }}>
              Yönetici Giriş Şifresini Değiştir
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Sisteme giriş yaparken kullandığınız şifreyi buradan güncelleyebilirsiniz.
            </span>
          </div>
        </div>

        {/* Database Status Card */}
        {dbDriver && (
          <div style={{
            backgroundColor: dbDriver.includes('PostgreSQL') ? '#f0fdf4' : '#fffbeb',
            border: dbDriver.includes('PostgreSQL') ? '1px solid #bbf7d0' : '1px solid #fef3c7',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Aktif Veritabanı Türü</div>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                color: dbDriver.includes('PostgreSQL') ? '#166534' : '#92400e',
                marginTop: '2px'
              }}>
                {dbDriver}
              </div>
            </div>
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '100px',
              backgroundColor: dbDriver.includes('PostgreSQL') ? '#dcfce7' : '#fee2e2',
              color: dbDriver.includes('PostgreSQL') ? '#15803d' : '#991b1b',
              fontWeight: '600'
            }}>
              {dbDriver.includes('PostgreSQL') ? 'Kalıcı Bağlantı' : 'Geçici Depolama (Veriler Kaybolabilir)'}
            </span>
          </div>
        )}

        {successMsg && (
          <div className="alert-success-banner mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#ecfdf5', color: '#047857', borderRadius: '6px', fontSize: '14px' }}>
            <ShieldCheck size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert-error-banner mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '6px', fontSize: '14px' }}>
            <ShieldAlert size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="form-group mb-4">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              <Lock size={14} /> Yeni Şifre
            </label>
            <input 
              type="password" 
              className="form-control"
              placeholder="Yeni şifrenizi girin"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              <Lock size={14} /> Yeni Şifre (Tekrar)
            </label>
            <input 
              type="password" 
              className="form-control"
              placeholder="Yeni şifrenizi doğrulayın"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            style={{ width: '100%', padding: '12px', fontWeight: '600' }}
            disabled={isLoading}
          >
            {isLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
}
