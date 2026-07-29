// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, Clock, AlertTriangle, AlertCircle, Check } from 'lucide-react';
import { api } from '../services/api';

export default function Header({ activeTab, setActiveTab }) {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Load notifications from db
    const loadNotifications = async () => {
      try {
        const [records, books, users, settings] = await Promise.all([
          api.getLendRecords(),
          api.getBooks(),
          api.getUsers(),
          api.getSettings()
        ]);
        const notifs = api.getNotifications(records, books, users, settings.warningBeforeDays);
        setNotifications(notifs);
      } catch (e) {
        console.error('Bildirimler yüklenirken hata:', e);
      }
    };
    loadNotifications();

    // Setup time ticks
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Event listener to close notification dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTab]); // Refresh when tab changes (operations might change notifications)

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Gösterge Paneli';
      case 'search': return 'Kitap Gelişmiş Arama';
      case 'books': return 'Kitap Envanter Yönetimi';
      case 'lend': return 'Ödünç Verme İşlemleri';
      case 'return': return 'İade & Teslim Alma';
      case 'users': return 'Personel Kayıtları';
      case 'history': return 'Kitap Hareket Geçmişi';
      case 'reports': return 'İstatistik ve Raporlama';
      case 'settings': return 'Sistem Ayarları';
      default: return 'Kütüphane Sistemi';
    }
  };

  const handleNotificationClick = (notif) => {
    setShowNotifications(false);
    setActiveTab('return'); // Navigate to return operations
  };

  return (
    <header className="main-header">
      <div className="header-title-section">
        <div className="breadcrumb">VANTSO Kütüphane / {getTitle()}</div>
        <h1>{getTitle()}</h1>
      </div>

      <div className="header-actions">
        {/* Live Date/Time */}
        <div className="header-datetime">
          <div className="datetime-item">
            <Calendar size={14} />
            <span>{currentTime.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="datetime-item">
            <Clock size={14} />
            <span>{currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {/* Notifications Icon */}
        <div className="notifications-dropdown-container" ref={dropdownRef}>
          <button 
            className="notifications-bell-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Bildirimler"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="bell-badge-count animate-pulse">{notifications.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown-menu">
              <div className="dropdown-menu-header">
                <h3>Sistem Bildirimleri</h3>
                <span className="notif-badge">{notifications.length} Uyarı</span>
              </div>
              <div className="dropdown-menu-body">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <Check size={32} className="success-icon" />
                    <p>Harika! Gecikmiş veya teslim tarihi yaklaşan kitap bulunmuyor.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${notif.type === 'danger' ? 'danger' : 'warning'}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notif-icon-wrapper">
                        {notif.type === 'danger' ? (
                          <AlertCircle size={16} />
                        ) : (
                          <AlertTriangle size={16} />
                        )}
                      </div>
                      <div className="notif-content">
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
