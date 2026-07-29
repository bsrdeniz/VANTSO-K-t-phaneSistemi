// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\HistoryLogs.jsx
import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Trash2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function HistoryLogs() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const [logsData, usersData] = await Promise.all([
          api.getLogs(),
          api.getUsers()
        ]);
        setLogs(logsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Log verileri yüklenirken hata:', error);
      }
    };
    loadLogs();
  }, []);

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const filteredLogs = logs.filter(log => {
    const matchesTerm = log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === '' || log.action === selectedAction;
    return matchesTerm && matchesAction;
  });

  const getUserName = (userId) => {
    if (userId === 'Sistem') return 'Sistem';
    const user = users.find(u => u.id === userId);
    return user ? `${user.name} (${user.role})` : userId;
  };

  return (
    <div className="history-logs-view">
      {/* Filters Bar */}
      <div className="card filter-card mb-4">
        <div className="filter-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
          <div className="form-group mb-0">
            <label className="form-label">Detay Ara (İçerik, Kitap vb.)</label>
            <div className="search-input-wrapper">
              <Search className="search-input-icon" size={16} />
              <input 
                type="text" 
                className="form-control pl-search"
                placeholder="Log kayıtları içerisinde arayın..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">İşlem Türü Filtresi</label>
            <select 
              className="form-control"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="">Tüm İşlemler</option>
              {uniqueActions.map((action, i) => (
                <option key={i} value={action}>{action}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info Badge */}
      <div className="system-notice-badge mb-4">
        <ShieldAlert size={16} />
        <span>Önemli Not: Sistem logları, kurumsal bilgi ve envanter güvenliği amacıyla **silinemez ve değiştirilemez** şekilde kayıt altına alınmaktadır.</span>
      </div>

      {/* Logs Table */}
      <div className="card p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Zaman Damgası</th>
                <th>İşlem Türü</th>
                <th>İşlemi Yapan</th>
                <th>Detaylar</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-4">Arama kriterlerine uygun sistem hareketi bulunamadı.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <strong>{new Date(log.timestamp).toLocaleDateString('tr-TR')}</strong>{' '}
                      <span className="text-muted text-xs">
                        {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        log.action.includes('Ekle') ? 'badge-rafta' :
                        log.action.includes('Ödünç') ? 'badge-oduncte' :
                        log.action.includes('İade') ? 'badge-hasarli' : 'badge-kayip'
                      }`} style={{ textTransform: 'none' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{getUserName(log.userId)}</td>
                    <td className="text-muted">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
