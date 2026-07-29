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
  FileBarChart2, 
  Settings, 
  ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api';

export default function Sidebar({ activeTab, setActiveTab, activeUser, onChangeUser }) {
  const [users, setUsers] = React.useState([]);

  React.useEffect(() => {
    api.getUsers().then(setUsers).catch(console.error);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Gösterge Paneli', icon: LayoutDashboard, roles: ['Yönetici', 'Kütüphane Görevlisi', 'Personel'] },
    { id: 'search', label: 'Kitap Arama', icon: Search, roles: ['Yönetici', 'Kütüphane Görevlisi', 'Personel'] },
    { id: 'books', label: 'Kitap Yönetimi', icon: BookOpen, roles: ['Yönetici', 'Kütüphane Görevlisi'] },
    { id: 'lend', label: 'Ödünç Verme', icon: ArrowUpRight, roles: ['Yönetici', 'Kütüphane Görevlisi'] },
    { id: 'return', label: 'İade İşlemleri', icon: ArrowDownLeft, roles: ['Yönetici', 'Kütüphane Görevlisi'] },
    { id: 'users', label: 'Personel Yönetimi', icon: Users, roles: ['Yönetici'] },
    { id: 'history', label: 'Hareket Geçmişi', icon: History, roles: ['Yönetici', 'Kütüphane Görevlisi'] },
    { id: 'reports', label: 'Raporlama', icon: FileBarChart2, roles: ['Yönetici'] },
    { id: 'settings', label: 'Sistem Ayarları', icon: Settings, roles: ['Yönetici'] },
  ];

  // Filter menu items by active user role
  const allowedMenuItems = menuItems.filter(item => 
    item.roles.includes(activeUser ? activeUser.role : 'Personel')
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <span>VAN</span>
          <span>TSO</span>
        </div>
        <div className="brand-title">Kütüphane Otomasyonu</div>
      </div>

      <nav className="sidebar-nav">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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

        <div className="role-selector-wrapper">
          <label htmlFor="role-selector" className="role-selector-label">Aktif Kullanıcı Değiştir (Test):</label>
          <select 
            id="role-selector"
            value={activeUser ? activeUser.id : ''}
            onChange={(e) => {
              const selected = users.find(u => u.id === e.target.value);
              if (selected) onChangeUser(selected);
            }}
            className="role-selector"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}
