// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\ReturnOperations.jsx
import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, AlertCircle, Calendar, RefreshCcw, Tag } from 'lucide-react';
import { api } from '../services/api';

export default function ReturnOperations() {
  const [activeRecords, setActiveRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [returnStatus, setReturnStatus] = useState('Rafta');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    setActiveUser(api.getActiveUser());
    loadActiveRecords();
  }, []);

  const loadActiveRecords = async () => {
    try {
      const [records, books, users] = await Promise.all([
        api.getLendRecords(),
        api.getBooks(),
        api.getUsers()
      ]);

      const formatted = records
        .filter(r => r.status === 'Ödünçte' && !r.returnDate)
        .map(r => {
          const book = books.find(b => b.id === r.bookId);
          const user = users.find(u => u.id === r.userId);
          
          // Calculate delay
          const today = new Date();
          today.setHours(0,0,0,0);
          const due = new Date(r.dueDate);
          due.setHours(0,0,0,0);
          
          const diffTime = due - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const delayDays = diffDays < 0 ? Math.abs(diffDays) : 0;

          return {
            ...r,
            book,
            user,
            delayDays
          };
        });

      setActiveRecords(formatted);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenReturnModal = (record) => {
    setSelectedRecord(record);
    setReturnStatus('Rafta');
    setIsModalOpen(true);
  };

  const handleReturnConfirm = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      const success = await api.returnBook(selectedRecord.id, returnStatus, activeUser?.id);
      if (success) {
        setIsModalOpen(false);
        setSelectedRecord(null);
        await loadActiveRecords();
      } else {
        alert('İade işlemi kaydedilirken bir hata oluştu.');
      }
    } catch (error) {
      alert(error.message);
    }
  };


  return (
    <div className="return-operations-view">
      <div className="view-actions-bar mb-4">
        <h2>Aktif Ödünçte Olan Kitaplar</h2>
        <span className="results-count">Toplam <strong>{activeRecords.length}</strong> kitap personelde bulunuyor.</span>
      </div>

      {activeRecords.length === 0 ? (
        <div className="card text-center p-5">
          <Calendar size={48} className="text-muted mb-2" style={{ margin: '0 auto' }} />
          <h3>Aktif Ödünç Kaydı Bulunmuyor</h3>
          <p className="text-muted">Tüm kitaplar kütüphane raflarında yer almaktadır.</p>
        </div>
      ) : (
        <div className="card p-0">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Demirbaş No</th>
                  <th>Kitap Adı</th>
                  <th>Ödünç Alan Personel</th>
                  <th>Birim / Görev</th>
                  <th>Ödünç Tarihi</th>
                  <th>Son Teslim Tarihi</th>
                  <th>Gecikme Durumu</th>
                  <th className="text-center">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {activeRecords.map((rec) => (
                  <tr key={rec.id} className={rec.delayDays > 0 ? 'row-delayed-warning' : ''}>
                    <td><strong>{rec.book ? rec.book.fixtureNo : '-'}</strong></td>
                    <td>
                      <div className="table-book-title">{rec.book ? rec.book.name : 'Silinmiş Kitap'}</div>
                      <span className="table-book-details">Yazar: {rec.book ? rec.book.author : ''}</span>
                    </td>
                    <td>
                      <div><strong>{rec.user ? rec.user.name : 'Bilinmeyen Personel'}</strong></div>
                      <span className="table-book-details">{rec.user ? rec.user.email : ''}</span>
                    </td>
                    <td>
                      <div>{rec.user ? rec.user.department : ''}</div>
                      <span className="text-muted text-xs">{rec.user ? rec.user.role : ''}</span>
                    </td>
                    <td>{rec.lendDate}</td>
                    <td>{rec.dueDate}</td>
                    <td>
                      {rec.delayDays > 0 ? (
                        <span className="badge badge-kayip animate-pulse" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          <AlertCircle size={10} /> {rec.delayDays} Gün Gecikti
                        </span>
                      ) : (
                        <span className="badge badge-oduncte">Ödünç Süresinde</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button 
                        onClick={() => handleOpenReturnModal(rec)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}
                      >
                        <ArrowDownLeft size={12} /> İade Al
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Return Confirm Modal */}
      {isModalOpen && selectedRecord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Kitap Teslim Alma Onayı</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleReturnConfirm}>
              <div className="modal-body">
                <div className="summary-details-box mb-4">
                  <div className="summary-row">
                    <span>Kitap Adı:</span>
                    <strong>{selectedRecord.book ? selectedRecord.book.name : 'Bilinmeyen Kitap'}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Demirbaş No:</span>
                    <strong>{selectedRecord.book ? selectedRecord.book.fixtureNo : '-'}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Ödünç Alan:</span>
                    <strong>{selectedRecord.user ? selectedRecord.user.name : 'Bilinmeyen Personel'}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Ödünç Alma Tarihi:</span>
                    <strong>{selectedRecord.lendDate}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Teslim Edilmesi Gereken Tarih:</span>
                    <strong>{selectedRecord.dueDate}</strong>
                  </div>
                  {selectedRecord.delayDays > 0 && (
                    <div className="summary-row text-danger-highlight">
                      <span>Gecikme Süresi:</span>
                      <strong>{selectedRecord.delayDays} Gün Gecikmiş</strong>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label"><RefreshCcw size={14} /> Kitap İade Fiziksel Durumu</label>
                  <select 
                    className="form-control"
                    value={returnStatus}
                    onChange={(e) => setReturnStatus(e.target.value)}
                  >
                    <option value="Rafta">Sağlam (Rafta Kullanılabilir)</option>
                    <option value="Hasarlı">Hasarlı (Bakıma/Tamire Alınacak)</option>
                    <option value="Kayıp">Kayıp (Envanter Dışı Bırakılacak)</option>
                  </select>
                  <span className="text-muted text-xs d-block mt-2">
                    Kitap durumunun güncellenmesiyle envanter durumu otomatik olarak senkronize edilecektir.
                  </span>
                </div>
              </div>

              <div className="modal-footer text-right">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Vazgeç</button>
                <button type="submit" className="btn btn-secondary ml-2">İade Kaydını Tamamla</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
