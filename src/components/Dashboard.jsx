// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  BookCheck, 
  Clock, 
  AlertOctagon, 
  Plus, 
  Calendar,
  History,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalTitles: 0,
    onShelf: 0,
    onLend: 0,
    overdue: 0
  });

  const [recentLogs, setRecentLogs] = useState([]);
  const [recentLends, setRecentLends] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [monthlyLends, setMonthlyLends] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [books, records, logs, users, settings] = await Promise.all([
          api.getBooks(),
          api.getLendRecords(),
          api.getLogs(),
          api.getUsers(),
          api.getSettings()
        ]);

        // 1. Calculate KPI Stats
        const totalTitles = books.length;
        const totalBooks = books.reduce((acc, b) => acc + (b.totalCopies || 1), 0);
        const onShelf = books.filter(b => b.status === 'Rafta').reduce((acc, b) => acc + (b.totalCopies || 1), 0);
        const onLend = records.filter(r => r.status === 'Ödünçte').length;
        const overdue = api.getNotifications(records, books, users, settings.warningBeforeDays).filter(n => n.type === 'danger').length;

        setStats({ totalBooks, totalTitles, onShelf, onLend, overdue });

        // 2. Recent System Logs
        setRecentLogs(logs.slice(0, 5));

    // 3. Recent Lends
    const sortedLends = [...records]
      .filter(r => r.status === 'Ödünçte')
      .map(r => {
        const book = books.find(b => b.id === r.bookId);
        const user = users.find(u => u.id === r.userId);
        return {
          ...r,
          bookName: book ? book.name : 'Bilinmeyen Kitap',
          userName: user ? user.name : 'Bilinmeyen Personel',
          department: user ? user.department : ''
        };
      })
      .slice(0, 4);
    setRecentLends(sortedLends);

    // 4. Most Borrowed Books
    const borrowCounts = {};
    records.forEach(r => {
      borrowCounts[r.bookId] = (borrowCounts[r.bookId] || 0) + 1;
    });
    const sortedTop = Object.keys(borrowCounts)
      .map(bookId => {
        const book = books.find(b => b.id === bookId);
        return {
          id: bookId,
          name: book ? book.name : 'Bilinmeyen Kitap',
          author: book ? book.author : '',
          count: borrowCounts[bookId]
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    setTopBooks(sortedTop);



        // 6. Monthly Lending Graph Data (Simulated last 6 months)
        const monthNames = ["Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz"];
        const monthCounts = [2, 5, 8, 12, 19, 24]; // simulated stats
        setMonthlyLends(monthNames.map((name, idx) => ({ name, count: monthCounts[idx] })));
      } catch (error) {
        console.error('Dashboard verileri yüklenirken hata:', error);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div className="dashboard-view">
      {/* Quick Action Top Alert if there are overdue books */}
      {stats.overdue > 0 && (
        <div className="dashboard-alert-banner">
          <AlertOctagon size={20} />
          <span>Sistemde teslim tarihi geçmiş <strong>{stats.overdue} adet kitap</strong> bulunmaktadır! Kontrol etmek için lütfen iade işlemlerini ziyaret edin.</span>
          <button onClick={() => setActiveTab('return')} className="btn btn-secondary btn-sm">Kontrolleri Yap</button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <BookOpen size={24} />
          </div>
          <div className="stat-details">
            <h3>Toplam Kitap</h3>
            <p className="stat-number">{stats.totalBooks}</p>
            <span className="stat-subtext">{stats.totalTitles} Farklı Başlık</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <BookCheck size={24} />
          </div>
          <div className="stat-details">
            <h3>Rafta / Kullanılabilir</h3>
            <p className="stat-number">{stats.onShelf}</p>
            <span className="stat-subtext">Hemen Ödünç Verilebilir</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <h3>Ödünç Verilenler</h3>
            <p className="stat-number">{stats.onLend}</p>
            <span className="stat-subtext">Personel Tarafından Okunuyor</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <AlertOctagon size={24} />
          </div>
          <div className="stat-details">
            <h3>Geciken Kitaplar</h3>
            <p className="stat-number">{stats.overdue}</p>
            <span className="stat-subtext">Teslim Tarihi Geçmiş</span>
          </div>
        </div>
      </div>

      {/* Main Charts & History Section */}
      <div className="dashboard-charts-layout">
        {/* Left Side: Graphs */}
        <div className="charts-column">
          {/* Monthly Lending Bar Chart */}
          <div className="card dashboard-card">
            <div className="card-title">
              <span>Aylık Ödünç Alma Hacmi</span>
              <TrendingUp size={16} className="text-muted" />
            </div>
            
            <div className="bar-chart-container">
              <div className="bar-chart-y-axis">
                <span>30</span>
                <span>20</span>
                <span>10</span>
                <span>0</span>
              </div>
              <div className="bar-chart-body">
                {monthlyLends.map((item, idx) => {
                  const barHeight = `${(item.count / 30) * 100}%`;
                  return (
                    <div key={idx} className="bar-chart-col">
                      <div className="bar-wrapper">
                        <div className="bar-value-tooltip">{item.count}</div>
                        <div className="bar-rect" style={{ height: barHeight }}></div>
                      </div>
                      <span className="bar-label">{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>


        </div>

        {/* Right Side: Operations Lists */}
        <div className="lists-column">
          {/* Active Lends */}
          <div className="card dashboard-card">
            <div className="card-title">
              <span>Son Ödünç İşlemleri</span>
              <Calendar size={16} className="text-muted" />
            </div>
            <div className="recent-list">
              {recentLends.length === 0 ? (
                <div className="empty-list text-center">Aktif ödünç işlem bulunmamaktadır.</div>
              ) : (
                recentLends.map((lend) => (
                  <div key={lend.id} className="recent-item">
                    <div className="recent-item-details">
                      <span className="recent-item-title">{lend.bookName}</span>
                      <span className="recent-item-subtitle">{lend.userName} ({lend.department})</span>
                    </div>
                    <div className="recent-item-badge">
                      <span className="badge badge-oduncte">Ödünçte</span>
                      <span className="recent-date">Son Tarih: {lend.dueDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Borrowed Books */}
          <div className="card dashboard-card">
            <div className="card-title">
              <span>En Çok Ödünç Alınan Kitaplar</span>
              <TrendingUp size={16} className="text-muted" />
            </div>
            <div className="top-books-list">
              {topBooks.length === 0 ? (
                <div className="empty-list text-center">Henüz veri yok.</div>
              ) : (
                topBooks.map((book, idx) => (
                  <div key={idx} className="top-book-item">
                    <div className="top-book-rank">#{idx + 1}</div>
                    <div className="top-book-info">
                      <h4>{book.name}</h4>
                      <p>{book.author}</p>
                    </div>
                    <div className="top-book-count">
                      <strong>{book.count}</strong> defa
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Action Logs */}
          <div className="card dashboard-card">
            <div className="card-title">
              <span>Son Sistem Hareketleri</span>
              <History size={16} className="text-muted" />
            </div>
            <div className="logs-timeline">
              {recentLogs.map((log) => (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-action">{log.action}</span>
                      <span className="timeline-time">{new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="timeline-details">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
