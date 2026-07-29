// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\App.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import BookSearch from './components/BookSearch';
import BookManagement from './components/BookManagement';
import LendOperations from './components/LendOperations';
import ReturnOperations from './components/ReturnOperations';
import UserManagement from './components/UserManagement';
import HistoryLogs from './components/HistoryLogs';
import Reports from './components/Reports';
import SettingsView from './components/Settings';
import { api } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    // Read session user on mount
    setActiveUser(api.getActiveUser());
  }, []);

  const handleChangeUser = (newUser) => {
    api.setActiveUser(newUser);
    setActiveUser(newUser);
    
    // Check if the current tab is allowed for the new user, else fallback to dashboard
    const tabPermissions = {
      dashboard: ['Yönetici', 'Kütüphane Görevlisi', 'Personel'],
      search: ['Yönetici', 'Kütüphane Görevlisi', 'Personel'],
      books: ['Yönetici', 'Kütüphane Görevlisi'],
      lend: ['Yönetici', 'Kütüphane Görevlisi'],
      return: ['Yönetici', 'Kütüphane Görevlisi'],
      users: ['Yönetici'],
      history: ['Yönetici', 'Kütüphane Görevlisi'],
      reports: ['Yönetici'],
      settings: ['Yönetici']
    };

    if (!tabPermissions[activeTab]?.includes(newUser.role)) {
      setActiveTab('dashboard');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'search':
        return <BookSearch />;
      case 'books':
        return <BookManagement />;
      case 'lend':
        return <LendOperations />;
      case 'return':
        return <ReturnOperations />;
      case 'users':
        return <UserManagement />;
      case 'history':
        return <HistoryLogs />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        activeUser={activeUser}
        onChangeUser={handleChangeUser}
      />

      {/* Main Panel */}
      <div className="main-wrapper">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
