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
import SettingsView from './components/Settings';
import { api } from './services/api';
import Login from './components/Login';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeUser, setActiveUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Read session user on mount
    setActiveUser(api.getActiveUser());
  }, []);

  // Close sidebar on navigation tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={handleTabChange} />;
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
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard setActiveTab={handleTabChange} />;
    }
  };

  if (!activeUser) {
    return <Login onLoginSuccess={setActiveUser} />;
  }

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        activeUser={activeUser}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onLogout={() => {
          api.logout();
          setActiveUser(null);
        }}
      />

      {/* Main Panel */}
      <div className="main-wrapper">
        <Header 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
