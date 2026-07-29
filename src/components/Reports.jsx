// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\Reports.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, BarChart3, TrendingUp, Users2, Library } from 'lucide-react';
import { api } from '../services/api';

export default function Reports() {
  const [summary, setSummary] = useState({
    totalBooks: 0,
    categoriesCount: 0,
    rafta: 0,
    oduncte: 0,
    hasarli: 0,
    kayip: 0
  });

  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const [books, records, users, settings] = await Promise.all([
          api.getBooks(),
          api.getLendRecords(),
          api.getUsers(),
          api.getSettings()
        ]);

        // 1. Calculate General Numbers
        const totalBooks = books.reduce((acc, b) => acc + (b.totalCopies || 1), 0);
        const rafta = books.filter(b => b.status === 'Rafta').reduce((acc, b) => acc + (b.totalCopies || 1), 0);
        const oduncte = records.filter(r => r.status === 'Ödünçte').length;
        const hasarli = books.filter(b => b.status === 'Hasarlı').reduce((acc, b) => acc + (b.totalCopies || 1), 0);
        const kayip = books.filter(b => b.status === 'Kayıp').reduce((acc, b) => acc + (b.totalCopies || 1), 0);

        setSummary({
          totalBooks,
          categoriesCount: settings.categories?.length || 0,
          rafta,
          oduncte,
          hasarli,
          kayip
        });

        // 2. Category Distribution details
        const catCounts = {};
        books.forEach(b => {
          catCounts[b.category] = (catCounts[b.category] || 0) + (b.totalCopies || 1);
        });
        const catArray = Object.keys(catCounts).map(name => ({
          name,
          count: catCounts[name],
          percent: Math.round((catCounts[name] / totalBooks) * 100)
        })).sort((a, b) => b.count - a.count);
        setCategoryBreakdown(catArray);

        // 3. User based borrow stats
        const userBorrows = {};
        records.forEach(r => {
          userBorrows[r.userId] = (userBorrows[r.userId] || 0) + 1;
        });
        const usersArray = Object.keys(userBorrows).map(userId => {
          const user = users.find(u => u.id === userId);
          return {
            name: user ? user.name : 'Bilinmeyen Personel',
            department: user ? user.department : 'Bilinmeyen Birim',
            count: userBorrows[userId]
          };
        }).sort((a, b) => b.count - a.count).slice(0, 5);
        setTopUsers(usersArray);

        // 4. Department based borrow stats
        const deptBorrows = {};
        records.forEach(r => {
          const user = users.find(u => u.id === r.userId);
          if (user) {
            deptBorrows[user.department] = (deptBorrows[user.department] || 0) + 1;
          }
        });
        const deptArray = Object.keys(deptBorrows).map(name => ({
          name,
          count: deptBorrows[name]
        })).sort((a, b) => b.count - a.count);
        setDepartmentStats(deptArray);

      } catch (error) {
        console.error('Rapor verileri yüklenirken hata:', error);
      }
    };
    loadReportData();
  }, []);

  const handleAction = (actionType) => {
    if (actionType === 'print') {
      window.print();
    } else {
      setToastMessage('Kurumsal Rapor Hazırlanıyor... PDF formatında indirme simülasyonu başlatıldı.');
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  return (
    <div className="reports-view">
      {toastMessage && (
        <div className="alert-success-banner mb-4">
          <FileText size={20} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Reports Actions Bar */}
      <div className="view-actions-bar mb-4 print-hide">
        <h2>Kütüphane Performans Raporları</h2>
        <div className="report-actions-btns">
          <button className="btn btn-outline" onClick={() => handleAction('print')}>
            <Printer size={14} /> Raporu Yazdır
          </button>
          <button className="btn btn-primary" onClick={() => handleAction('pdf')}>
            <Download size={14} /> PDF Olarak İndir
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="card mb-4">
        <h3 className="card-title-sm mb-3"><Library size={16} /> Genel Envanter Raporu</h3>
        <div className="report-summary-boxes">
          <div className="rep-box">
            <span className="lbl">Toplam Envanter</span>
            <span className="val">{summary.totalBooks} Kitap</span>
            <span className="sub">{summary.categoriesCount} Farklı Kategori</span>
          </div>
          <div className="rep-box">
            <span className="lbl">Raflardaki Kitap</span>
            <span className="val text-success">{summary.rafta}</span>
            <span className="sub">Kullanılabilir Durumda</span>
          </div>
          <div className="rep-box">
            <span className="lbl">Ödünç Verilenler</span>
            <span className="val text-warning">{summary.oduncte}</span>
            <span className="sub">Personelde Olanlar</span>
          </div>
          <div className="rep-box">
            <span className="lbl">Hasarlı Envanter</span>
            <span className="val text-info">{summary.hasarli}</span>
            <span className="sub">Bakımda Olan</span>
          </div>
          <div className="rep-box">
            <span className="lbl">Kayıp Kayıtları</span>
            <span className="val text-danger">{summary.kayip}</span>
            <span className="sub">Envanter Dışı</span>
          </div>
        </div>
      </div>

      {/* Grid: Category Breakdown and Usage Statistics */}
      <div className="reports-grid">
        {/* Category Breakdown Table */}
        <div className="card">
          <h3 className="card-title-sm mb-3"><BarChart3 size={16} /> Kategori Bazlı Dağılım</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kategori Adı</th>
                  <th className="text-center">Kitap Adedi</th>
                  <th className="text-center">Oran</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((cat, i) => (
                  <tr key={i}>
                    <td>{cat.name}</td>
                    <td className="text-center"><strong>{cat.count}</strong></td>
                    <td className="text-center">
                      <div className="percent-indicator-cell">
                        <span>%{cat.percent}</span>
                        <div className="progress-bar-bg mini-bar">
                          <div className="progress-bar-fill" style={{ width: `${cat.percent}%`, backgroundColor: 'var(--primary-color)' }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Borrow Statistics Column */}
        <div className="reports-flex-column">
          {/* Department stats */}
          <div className="card mb-4" style={{ height: 'fit-content' }}>
            <h3 className="card-title-sm mb-3"><Users2 size={16} /> Birim (Departman) Bazlı Okuma Oranları</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Birim Adı</th>
                    <th className="text-center">Ödünç Alma Sayısı</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentStats.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="text-center">Veri bulunmuyor.</td>
                    </tr>
                  ) : (
                    departmentStats.map((dept, i) => (
                      <tr key={i}>
                        <td><strong>{dept.name}</strong></td>
                        <td className="text-center">{dept.count} defa</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User based borrow statistics */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 className="card-title-sm mb-3"><TrendingUp size={16} /> En Çok Okuyan Personeller</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ad Soyad</th>
                    <th>Birim</th>
                    <th className="text-center">Ödünç Adedi</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center">Veri bulunmuyor.</td>
                    </tr>
                  ) : (
                    topUsers.map((user, i) => (
                      <tr key={i}>
                        <td><strong>{user.name}</strong></td>
                        <td>{user.department}</td>
                        <td className="text-center">{user.count} adet</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
