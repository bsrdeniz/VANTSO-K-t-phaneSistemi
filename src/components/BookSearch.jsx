// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\BookSearch.jsx
import React, { useState, useEffect } from 'react';
import { Search, Grid, List, Eye, MapPin, Tag, BookOpen, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function BookSearch() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState({
    Rafta: true,
    Ödünçte: true,
    Hasarlı: true,
    Kayıp: true
  });
  
  const [viewMode, setViewMode] = useState('grid'); // grid or table
  const [selectedBook, setSelectedBook] = useState(null); // for detail modal

  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const [booksData, settingsData] = await Promise.all([
          api.getBooks(),
          api.getSettings()
        ]);
        setBooks(booksData);
        setCategories(settingsData.categories || []);
      } catch (error) {
        console.error('Arama verileri yüklenirken hata:', error);
      }
    };
    loadSearchData();
  }, []);

  const handleStatusChange = (status) => {
    setSelectedStatus(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Filter books
  const filteredBooks = books.filter(book => {
    // 1. Term Match (Name, Author, Barcode, ISBN, Keywords)
    const matchesTerm = 
      book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.barcode.includes(searchTerm) ||
      book.isbn.includes(searchTerm) ||
      (book.keywords && book.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())));

    // 2. Category Match
    const matchesCategory = selectedCategory === '' || book.category === selectedCategory;

    // 3. Status Match
    const matchesStatus = selectedStatus[book.status];

    return matchesTerm && matchesCategory && matchesStatus;
  });

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Rafta': return 'badge-rafta';
      case 'Ödünçte': return 'badge-oduncte';
      case 'Hasarlı': return 'badge-hasarli';
      case 'Kayıp': return 'badge-kayip';
      default: return '';
    }
  };

  return (
    <div className="search-view">
      {/* Filters Bar */}
      <div className="card filter-card mb-4">
        <div className="filter-grid">
          {/* Text Search */}
          <div className="form-group mb-0">
            <label className="form-label">Kitap Adı, Yazar, Barkod, ISBN</label>
            <div className="search-input-wrapper">
              <Search className="search-input-icon" size={16} />
              <input 
                type="text" 
                className="form-control pl-search"
                placeholder="Aramak istediğiniz terimi yazın..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="form-group mb-0">
            <label className="form-label">Kategori</label>
            <select 
              className="form-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* View Mode & Count */}
          <div className="view-mode-selector">
            <span className="results-count"><strong>{filteredBooks.length}</strong> Kitap Listeleniyor</span>
            <div className="toggle-buttons">
              <button 
                onClick={() => setViewMode('grid')}
                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Kart Görünümü"
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                title="Tablo Görünümü"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Checkboxes */}
        <div className="status-filters-row">
          <span className="status-filters-label">Kitap Durumu:</span>
          {Object.keys(selectedStatus).map((status) => (
            <label key={status} className="checkbox-label">
              <input 
                type="checkbox"
                checked={selectedStatus[status]}
                onChange={() => handleStatusChange(status)}
              />
              <span className={`custom-checkbox-text badge ${getStatusBadgeClass(status)}`}>{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Books Display */}
      {filteredBooks.length === 0 ? (
        <div className="card text-center p-5">
          <BookOpen size={48} className="text-muted mb-2" style={{ margin: '0 auto' }} />
          <h3>Kitap Bulunamadı</h3>
          <p className="text-muted">Arama kriterlerinizi değiştirmeyi deneyebilirsiniz.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="books-grid">
          {filteredBooks.map((book) => (
            <div key={book.id} className="card book-card card-interactive">
              {/* Mock Book Cover */}
              <div className="book-cover-mock" style={{
                background: `linear-gradient(135deg, var(--primary-color) 0%, hsl(${book.name.length * 5 % 360}, 45%, 25%) 100%)`
              }}>
                <span className="cover-title">{book.name}</span>
                <span className="cover-author">{book.author}</span>
                <div className="cover-badge-category">{book.category}</div>
              </div>

              <div className="book-card-body">
                <span className={`badge ${getStatusBadgeClass(book.status)}`}>{book.status}</span>
                <h3 className="book-title-text" title={book.name}>{book.name}</h3>
                <p className="book-author-text">{book.author}</p>
                
                <div className="book-card-meta">
                  <div className="meta-row">
                    <Tag size={12} />
                    <span>Demirbaş: {book.fixtureNo}</span>
                  </div>
                  <div className="meta-row">
                    <MapPin size={12} />
                    <span className="location-text">
                      {book.location.building} - {book.location.floor} - Dolap: {book.location.cabinet.replace('Dolap ', '')} - Raf: {book.location.shelf.replace('Raf ', '')}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedBook(book)}
                  className="btn btn-outline btn-block mt-4"
                  style={{ width: '100%' }}
                >
                  <Eye size={14} /> Detayları Gör
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card p-0">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Demirbaş No</th>
                  <th>Kitap Adı</th>
                  <th>Yazar</th>
                  <th>Kategori</th>
                  <th>Barkod / ISBN</th>
                  <th>Fiziksel Konum</th>
                  <th>Durum</th>
                  <th className="text-center">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.id}>
                    <td><strong>{book.fixtureNo}</strong></td>
                    <td>
                      <div className="table-book-title">{book.name}</div>
                      <span className="table-book-details">Baskı: {book.edition} | Dil: {book.language}</span>
                    </td>
                    <td>{book.author}</td>
                    <td>{book.category}</td>
                    <td>
                      <div>B: {book.barcode}</div>
                      <div className="text-muted text-xs">I: {book.isbn}</div>
                    </td>
                    <td>
                      <span className="table-location-text" title={`${book.location.building}, ${book.location.floor}, ${book.location.cabinet}, ${book.location.shelf}, Sıra: ${book.location.rowNo}`}>
                        {book.location.floor}, {book.location.cabinet}, Raf: {book.location.shelf.replace('Raf ', '')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(book.status)}`}>{book.status}</span>
                    </td>
                    <td className="text-center">
                      <button 
                        onClick={() => setSelectedBook(book)}
                        className="btn btn-outline btn-sm"
                      >
                        <Eye size={12} /> Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="modal-overlay">
          <div className="modal-content book-details-modal">
            <div className="modal-header">
              <h2>Kitap Detay Kartı</h2>
              <button className="close-btn" onClick={() => setSelectedBook(null)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="book-modal-layout">
                {/* Left side cover */}
                <div className="book-modal-cover" style={{
                  background: `linear-gradient(135deg, var(--primary-color) 0%, hsl(${selectedBook.name.length * 5 % 360}, 45%, 25%) 100%)`
                }}>
                  <span className="cover-title">{selectedBook.name}</span>
                  <span className="cover-author">{selectedBook.author}</span>
                </div>

                {/* Right side info */}
                <div className="book-modal-info">
                  <span className={`badge ${getStatusBadgeClass(selectedBook.status)} mb-2`}>{selectedBook.status}</span>
                  <h2>{selectedBook.name}</h2>
                  <p className="author-name-sub">Yazar: <strong>{selectedBook.author}</strong></p>
                  
                  <div className="book-specs-grid">
                    <div><strong>Kategori:</strong> {selectedBook.category}</div>
                    <div><strong>Demirbaş No:</strong> {selectedBook.fixtureNo}</div>
                    <div><strong>Barkod No:</strong> {selectedBook.barcode}</div>
                    <div><strong>ISBN:</strong> {selectedBook.isbn}</div>
                    <div><strong>Yayın Evi:</strong> {selectedBook.publisher}</div>
                    <div><strong>Basım Yılı:</strong> {selectedBook.publishYear} ({selectedBook.edition}. Baskı)</div>
                    <div><strong>Sayfa / Dil:</strong> {selectedBook.pageCount} Sayfa / {selectedBook.language}</div>
                    <div><strong>Toplam Kopya:</strong> {selectedBook.totalCopies} adet</div>
                  </div>

                  {selectedBook.keywords && selectedBook.keywords.length > 0 && (
                    <div className="keywords-tags mt-4">
                      <strong>Anahtar Kelimeler:</strong>
                      <div className="tags-container">
                        {selectedBook.keywords.map((tag, i) => (
                          <span key={i} className="tag-pill">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Physical Location Details Section */}
              <div className="card location-details-card mt-4">
                <h3 className="card-title-sm"><MapPin size={16} /> Fiziksel Raf Konum Bilgileri</h3>
                <div className="location-detail-grid">
                  <div className="loc-box">
                    <span>BİNA</span>
                    <strong>{selectedBook.location.building}</strong>
                  </div>
                  <div className="loc-box">
                    <span>KAT</span>
                    <strong>{selectedBook.location.floor}</strong>
                  </div>
                  <div className="loc-box">
                    <span>DOLAP</span>
                    <strong>{selectedBook.location.cabinet}</strong>
                  </div>
                  <div className="loc-box">
                    <span>RAF</span>
                    <strong>{selectedBook.location.shelf}</strong>
                  </div>
                  <div className="loc-box">
                    <span>SIRA NO</span>
                    <strong>{selectedBook.location.rowNo}</strong>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="book-summary-box mt-4">
                <h3><Layers size={16} /> Kitap Özeti / Açıklama</h3>
                <p>{selectedBook.summary || 'Bu kitap için herhangi bir özet açıklaması girilmemiştir.'}</p>
              </div>
            </div>

            <div className="modal-footer mt-4 text-right">
              <button onClick={() => setSelectedBook(null)} className="btn btn-primary">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
