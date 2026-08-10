// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\Sidebar.jsx
import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  History, 
  Settings, 
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { api } from '../services/api';

export default function Sidebar({ activeTab, setActiveTab, activeUser, onCloseSidebar, onLogout }) {

  const menuItems = [
    { id: 'dashboard', label: 'Gösterge Paneli', icon: LayoutDashboard, roles: ['Yönetici', 'Kütüphane Görevlisi', 'Personel'] },
    { id: 'search', label: 'Kitap Arama', icon: Search, roles: ['Yönetici', 'Kütüphane Görevlisi', 'Personel'] },
    { id: 'books', label: 'Kitap Yönetimi', icon: BookOpen, roles: ['Yönetici', 'Kütüphane Görevlisi'] },
    { id: 'lend', label: 'Ödünç Verme', icon: ArrowUpRight, roles: ['Yönetici', 'Kütüphane Görevlisi'] },
    { id: 'return', label: 'İade İşlemleri', icon: ArrowDownLeft, roles: ['Yönetici', 'Kütüphane Görevlisi'] },
    { id: 'users', label: 'Üye Yönetimi', icon: Users, roles: ['Yönetici'] },
    { id: 'history', label: 'Hareket Geçmişi', icon: History, roles: ['Yönetici', 'Kütüphane Görevlisi'] },
    { id: 'settings', label: 'Sistem Ayarları', icon: Settings, roles: ['Yönetici'] },
  ];

  // Filter menu items by active user role
  const allowedMenuItems = menuItems.filter(item => 
    item.roles.includes(activeUser ? activeUser.role : 'Personel')
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-header">
          <div className="brand-logo">
            <span>VAN</span>
            <span>TSO</span>
          </div>
          <button className="sidebar-close-btn" onClick={onCloseSidebar} aria-label="Kapat">&times;</button>
        </div>
        <div className="brand-title">Kütüphane Otomasyonu</div>
      </div>

      <nav className="sidebar-nav">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onCloseSidebar) onCloseSidebar();
              }}
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-info">
          <div className="user-profile-main">
            <div className="user-avatar">
              {activeUser ? activeUser.name.charAt(0) : 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{activeUser ? activeUser.name : 'Misafir'}</div>
              <div className="user-role-badge">
                <ShieldCheck size={11} />
                <span>{activeUser ? activeUser.role : 'Personel'}</span>
              </div>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={onLogout} title="Çıkış Yap" aria-label="Çıkış Yap">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
