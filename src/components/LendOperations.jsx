// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\LendOperations.jsx
import React, { useState, useEffect } from 'react';
import { Search, Calendar, UserCheck, BookOpen, CheckCircle, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';

export default function LendOperations() {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Search states
  const [bookSearch, setBookSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  // Selection states
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dueDate, setDueDate] = useState('');

  // Status message
  const [successMsg, setSuccessMsg] = useState('');
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    const initLend = async () => {
      try {
        const user = api.getActiveUser();
        setActiveUser(user);
        
        const settings = await api.getSettings();
        const limitDays = settings.lendingLimitDays || 15;
        const defaultDue = new Date();
        defaultDue.setDate(defaultDue.getDate() + limitDays);
        setDueDate(defaultDue.toISOString().split('T')[0]);
        
        await loadData();
      } catch (e) {
        console.error(e);
      }
    };
    initLend();
  }, []);

  const loadData = async () => {
    try {
      const [allBooks, allUsers] = await Promise.all([
        api.getBooks(),
        api.getUsers()
      ]);
      // Only books that are available (status = 'Rafta') can be lent
      setBooks(allBooks.filter(b => b.status === 'Rafta'));
      setUsers(allUsers.filter(u => u.status === 'Aktif'));
    } catch (e) {
      console.error(e);
    }
  };

  // Filter lists
  const filteredBooks = bookSearch.trim() === '' ? [] : books.filter(b => 
    b.name.toLowerCase().includes(bookSearch.toLowerCase()) ||
    b.barcode.includes(bookSearch) ||
    b.fixtureNo.toLowerCase().includes(bookSearch.toLowerCase())
  );

  const filteredUsers = userSearch.trim() === '' ? [] : users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleLend = async (e) => {
    e.preventDefault();

    if (!selectedBook || !selectedUser || !dueDate) {
      alert('Lütfen kitap, personel ve son teslim tarihini seçin!');
      return;
    }

    try {
      const record = await api.lendBook(selectedBook.id, selectedUser.id, dueDate, activeUser?.id);
      
      if (record) {
        setSuccessMsg(`"${selectedBook.name}" kitabı başarıyla {selectedUser.name} adlı personele ödünç verildi!`);
        setSelectedBook(null);
        setSelectedUser(null);
        setBookSearch('');
        setUserSearch('');
        await loadData(); // Reload available books
        
        // Auto clear success message after 5 seconds
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        alert('Kitap ödünç verme işlemi gerçekleştirilemedi.');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="lend-operations-view">
      {successMsg && (
        <div className="alert-success-banner mb-4">
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="lend-grid-layout">
        {/* Left Side: Select Book and User */}
        <div className="lend-selectors-column">
          {/* Book Search and Select */}
          <div className="card mb-4">
            <h3 className="card-title-sm mb-2"><BookOpen size={16} /> 1. Ödünç Verilecek Kitap</h3>
            <div className="search-input-wrapper">
              <Search className="search-input-icon" size={16} />
              <input 
                type="text" 
                className="form-control pl-search" 
                placeholder="Kitap adı, barkod veya demirbaş no ile arayın..."
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
              />
            </div>

            {/* Book Search Results */}
            {filteredBooks.length > 0 && (
              <div className="lend-autocomplete-dropdown">
                {filteredBooks.map((book) => (
                  <div 
                    key={book.id} 
                    className="autocomplete-item"
                    onClick={() => {
                      setSelectedBook(book);
                      setBookSearch('');
                    }}
                  >
                    <div className="item-title">{book.name}</div>
                    <div className="item-meta">Yazar: {book.author} | Demirbaş: {book.fixtureNo} | Raf: {book.location.shelf}</div>
                  </div>
                ))}
              </div>
            )}
            
            {bookSearch.trim() !== '' && filteredBooks.length === 0 && (
              <div className="text-muted mt-2 text-xs">Aradığınız kriterde ödünç verilebilir (Rafta) kitap bulunamadı.</div>
            )}

            {/* Selected Book Show */}
            {selectedBook && (
              <div className="selected-item-display mt-3">
                <div className="display-card-border blue">
                  <div className="display-info">
                    <h4>{selectedBook.name}</h4>
                    <p>Yazar: {selectedBook.author} | Demirbaş: {selectedBook.fixtureNo}</p>
                    <p className="text-muted text-xs">Fiziksel Konum: {selectedBook.location.building} / {selectedBook.location.floor} / {selectedBook.location.shelf}</p>
                  </div>
                  <button className="remove-selection-btn" onClick={() => setSelectedBook(null)}>&times;</button>
                </div>
              </div>
            )}
          </div>

          {/* User Search and Select */}
          <div className="card">
            <h3 className="card-title-sm mb-2"><UserCheck size={16} /> 2. Ödünç Alacak Personel</h3>
            <div className="search-input-wrapper">
              <Search className="search-input-icon" size={16} />
              <input 
                type="text" 
                className="form-control pl-search" 
                placeholder="Personel adı, birimi veya e-postası ile arayın..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            {/* User Search Results */}
            {filteredUsers.length > 0 && (
              <div className="lend-autocomplete-dropdown">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="autocomplete-item"
                    onClick={() => {
                      setSelectedUser(user);
                      setUserSearch('');
                    }}
                  >
                    <div className="item-title">{user.name}</div>
                    <div className="item-meta">Birim: {user.department} | E-posta: {user.email}</div>
                  </div>
                ))}
              </div>
            )}

            {userSearch.trim() !== '' && filteredUsers.length === 0 && (
              <div className="text-muted mt-2 text-xs">Kriterlerinize uygun personel kaydı bulunamadı.</div>
            )}

            {/* Selected User Show */}
            {selectedUser && (
              <div className="selected-item-display mt-3">
                <div className="display-card-border gold">
                  <div className="display-info">
                    <h4>{selectedUser.name}</h4>
                    <p>Birim: {selectedUser.department} | Görev: {selectedUser.role}</p>
                    <p className="text-muted text-xs">E-posta: {selectedUser.email} | Tel: {selectedUser.phone}</p>
                  </div>
                  <button className="remove-selection-btn" onClick={() => setSelectedUser(null)}>&times;</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Lend Process Details */}
        <div className="lend-summary-column">
          <div className="card summary-lend-card">
            <h3 className="card-title">Ödünç Verme Onayı</h3>
            
            <form onSubmit={handleLend}>
              <div className="summary-details-box">
                <div className="summary-row">
                  <span>Seçilen Kitap:</span>
                  <strong>{selectedBook ? selectedBook.name : 'Seçilmedi'}</strong>
                </div>
                <div className="summary-row">
                  <span>Ödünç Alan Personel:</span>
                  <strong>{selectedUser ? selectedUser.name : 'Seçilmedi'}</strong>
                </div>
                <div className="summary-row">
                  <span>Ödünç Verme Tarihi:</span>
                  <strong>{new Date().toLocaleDateString('tr-TR')}</strong>
                </div>
              </div>

              <div className="form-group mt-4">
                <label className="form-label"><Calendar size={14} /> Son Teslim Tarihi</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
                <span className="text-muted text-xs d-block mt-1">Önerilen ödünç süresi varsayılan olarak 15 gündür.</span>
              </div>

              <button 
                type="submit" 
                className="btn btn-secondary btn-block mt-4" 
                style={{ width: '100%', padding: '12px' }}
                disabled={!selectedBook || !selectedUser || !dueDate}
              >
                <ArrowUpRight size={18} /> Ödünç İşlemini Onayla
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
