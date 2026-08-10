// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\BookManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, MapPin, Eye, BookOpen, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function BookManagement() {
  const [books, setBooks] = useState([]);
  const [locations, setLocations] = useState({ buildings: [], floors: [], cabinets: [], shelves: [] });
  const [settings, setSettings] = useState({});
  const [activeUser, setActiveUser] = useState(null);
  
  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    barcode: '',
    isbn: '',
    fixtureNo: '',
    author: '',
    publisher: '',
    publishYear: new Date().getFullYear(),
    edition: 1,
    pageCount: '',
    language: 'Türkçe',
    keywords: '',
    summary: '',
    coverImage: '',
    totalCopies: 1,
    status: 'Rafta',
    location: {
      building: '',
      floor: '',
      cabinet: '',
      shelf: '',
      rowNo: 1
    }
  });

  useEffect(() => {
    setActiveUser(api.getActiveUser());
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const booksData = await api.getBooks();
      const settingsData = await api.getSettings();
      
      setBooks(booksData);
      setSettings(settingsData);
      setLocations(settingsData.locations || { buildings: [], floors: [], cabinets: [], shelves: [] });
      
      // Set default locations in form
      setFormData(prev => ({
        ...prev,
        location: {
          building: settingsData.locations?.buildings?.[0] || '',
          floor: settingsData.locations?.floors?.[0] || '',
          cabinet: settingsData.locations?.cabinets?.[0] || '',
          shelf: settingsData.locations?.shelves?.[0] || '',
          rowNo: 1
        }
      }));
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
    }
  };

  const handleOpenAddModal = () => {
    const nextFixNo = `DEM-2026-${String(books.length + 1).padStart(3, '0')}`;
    const nextBarcode = `${settings.barcodePrefix || '8680001'}00${String(books.length + 1).padStart(3, '0')}`;
    
    setEditMode(false);
    setFormData({
      id: '',
      name: '',
      barcode: nextBarcode,
      isbn: '',
      fixtureNo: nextFixNo,
      author: '',
      publisher: '',
      publishYear: new Date().getFullYear(),
      edition: 1,
      pageCount: '',
      language: 'Türkçe',
      keywords: '',
      summary: '',
      coverImage: '',
      totalCopies: 1,
      status: 'Rafta',
      location: {
        building: locations.buildings[0] || '',
        floor: locations.floors[0] || '',
        cabinet: locations.cabinets[0] || '',
        shelf: locations.shelves[0] || '',
        rowNo: 1
      }
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    setEditMode(true);
    setFormData({
      ...book,
      keywords: book.keywords ? book.keywords.join(', ') : '',
      location: { ...book.location }
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Bu kitabı envanterden silmek istediğinize emin misiniz?')) {
      try {
        await api.deleteBook(id, activeUser?.id);
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.author || !formData.barcode || !formData.fixtureNo) {
      alert('Lütfen zorunlu alanları doldurun!');
      return;
    }

    const processedKeywords = formData.keywords
      ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
      : [];

    const bookData = {
      ...formData,
      pageCount: Number(formData.pageCount) || 0,
      publishYear: Number(formData.publishYear) || 2026,
      edition: Number(formData.edition) || 1,
      totalCopies: Number(formData.totalCopies) || 1,
      keywords: processedKeywords,
      location: {
        ...formData.location,
        rowNo: Number(formData.location.rowNo) || 1
      }
    };

    try {
      if (editMode) {
        await api.updateBook(bookData, activeUser?.id);
      } else {
        await api.addBook(bookData, activeUser?.id);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="book-management-view">
      <div className="view-actions-bar mb-4">
        <h2>Kitap Envanter Listesi</h2>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} /> Yeni Kitap Ekle
        </button>
      </div>

      {/* Book Management List */}
      <div className="card p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Demirbaş No</th>
                <th>Kapak / Kitap Adı</th>
                <th>Yazar</th>
                <th>Barkod / ISBN</th>
                <th>Fiziksel Raf Konumu</th>
                <th>Adet</th>
                <th>Durum</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-4">Kayıtlı kitap bulunmamaktadır.</td>
                </tr>
              ) : (
                books.map((book) => (
                  <tr key={book.id}>
                    <td><strong>{book.fixtureNo}</strong></td>
                    <td>
                      <div className="table-book-row">
                        <div className="mini-cover" style={{
                          background: `linear-gradient(135deg, var(--primary-color) 0%, hsl(${book.name.length * 5 % 360}, 45%, 25%) 100%)`
                        }}>
                          <span>{book.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="table-book-title">{book.name}</div>
                          <span className="table-book-details">{book.publisher}</span>
                        </div>
                      </div>
                    </td>
                    <td>{book.author}</td>

                    <td>
                      <div>B: {book.barcode}</div>
                      <div className="text-muted text-xs">I: {book.isbn || '-'}</div>
                    </td>
                    <td>
                      <span className="table-location-text">
                        {book.location.building.substring(0, 3)}. / {book.location.floor} / {book.location.cabinet} / {book.location.shelf}
                      </span>
                    </td>
                    <td>{book.totalCopies}</td>
                    <td>
                      <span className={`badge ${
                        book.status === 'Rafta' ? 'badge-rafta' : 
                        book.status === 'Ödünçte' ? 'badge-oduncte' : 
                        book.status === 'Hasarlı' ? 'badge-hasarli' : 'badge-kayip'
                      }`}>{book.status}</span>
                    </td>
                    <td className="text-center">
                      <div className="action-buttons-cell">
                        <button 
                          onClick={() => handleOpenEditModal(book)} 
                          className="btn btn-outline btn-sm edit-action-btn"
                          title="Kitap Bilgilerini Düzenle"
                        >
                          <Edit2 size={12} /> Düzenle
                        </button>
                        <button 
                          onClick={() => handleDelete(book.id)} 
                          className="btn btn-danger btn-sm"
                          title="Sistemden Kaldır"
                        >
                          <Trash2 size={12} /> Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Book Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h2>{editMode ? 'Kitap Bilgilerini Düzenle' : 'Yeni Kitap Kaydet'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="modal-form-grid">
                  
                  {/* Left Column: General Info */}
                  <div className="form-column-section">
                    <h3 className="form-section-title"><BookOpen size={16} /> Kitap Detayları</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Kitap Adı *</label>
                      <input 
                        type="text" 
                        name="name" 
                        className="form-control" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        required
                        placeholder="Örn: Van Ticaret Sicil Klavuzu"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Yazar *</label>
                        <input 
                          type="text" 
                          name="author" 
                          className="form-control" 
                          value={formData.author} 
                          onChange={handleInputChange} 
                          required
                          placeholder="Örn: Ahmet Uçar"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Yayın Evi</label>
                        <input 
                          type="text" 
                          name="publisher" 
                          className="form-control" 
                          value={formData.publisher} 
                          onChange={handleInputChange}
                          placeholder="Örn: VANTSO Yayınları"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Barkod Numarası *</label>
                        <input 
                          type="text" 
                          name="barcode" 
                          className="form-control" 
                          value={formData.barcode} 
                          onChange={handleInputChange} 
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">ISBN</label>
                        <input 
                          type="text" 
                          name="isbn" 
                          className="form-control" 
                          value={formData.isbn} 
                          onChange={handleInputChange}
                          placeholder="Örn: 978-605-123-456-7"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Demirbaş Numarası *</label>
                        <input 
                          type="text" 
                          name="fixtureNo" 
                          className="form-control" 
                          value={formData.fixtureNo} 
                          onChange={handleInputChange} 
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Basım Yılı</label>
                        <input 
                          type="number" 
                          name="publishYear" 
                          className="form-control" 
                          value={formData.publishYear} 
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Baskı Sayısı</label>
                        <input 
                          type="number" 
                          name="edition" 
                          className="form-control" 
                          value={formData.edition} 
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Sayfa Sayısı</label>
                        <input 
                          type="number" 
                          name="pageCount" 
                          className="form-control" 
                          value={formData.pageCount} 
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Dil</label>
                        <input 
                          type="text" 
                          name="language" 
                          className="form-control" 
                          value={formData.language} 
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Toplam Kopya Adedi</label>
                        <input 
                          type="number" 
                          name="totalCopies" 
                          className="form-control" 
                          value={formData.totalCopies} 
                          onChange={handleInputChange}
                          min="1"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Durum</label>
                        <select 
                          name="status" 
                          className="form-control" 
                          value={formData.status} 
                          onChange={handleInputChange}
                        >
                          <option value="Rafta">Rafta</option>
                          <option value="Ödünçte">Ödünçte</option>
                          <option value="Hasarlı">Hasarlı</option>
                          <option value="Kayıp">Kayıp</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Location & Summary */}
                  <div className="form-column-section">
                    <h3 className="form-section-title"><MapPin size={16} /> Fiziksel Raf Konumu Takibi</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Bina Konumu</label>
                      <select 
                        name="building" 
                        className="form-control" 
                        value={formData.location.building} 
                        onChange={handleLocationChange}
                      >
                        {locations.buildings.map((b, i) => (
                          <option key={i} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Bulunduğu Kat</label>
                        <select 
                          name="floor" 
                          className="form-control" 
                          value={formData.location.floor} 
                          onChange={handleLocationChange}
                        >
                          {locations.floors.map((f, i) => (
                            <option key={i} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Dolap Ünitesi</label>
                        <select 
                          name="cabinet" 
                          className="form-control" 
                          value={formData.location.cabinet} 
                          onChange={handleLocationChange}
                        >
                          {locations.cabinets.map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Raf Bilgisi</label>
                        <select 
                          name="shelf" 
                          className="form-control" 
                          value={formData.location.shelf} 
                          onChange={handleLocationChange}
                        >
                          {locations.shelves.map((s, i) => (
                            <option key={i} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Raf Sıra No</label>
                        <input 
                          type="number" 
                          name="rowNo" 
                          className="form-control" 
                          value={formData.location.rowNo} 
                          onChange={handleLocationChange}
                          min="1"
                        />
                      </div>
                    </div>

                    <h3 className="form-section-title mt-4"><Layers size={16} /> Özet ve Anahtar Kelimeler</h3>
                    
                    <div className="form-group">
                      <label className="form-label">Anahtar Kelimeler (Virgülle ayırın)</label>
                      <input 
                        type="text" 
                        name="keywords" 
                        className="form-control" 
                        value={formData.keywords} 
                        onChange={handleInputChange}
                        placeholder="Örn: Rapor, Van, Kalkınma, Ticaret"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Kitap Kısa Özeti</label>
                      <textarea 
                        name="summary" 
                        rows="4" 
                        className="form-control" 
                        value={formData.summary} 
                        onChange={handleInputChange}
                        placeholder="Kitabın içeriği hakkında kısa bilgi yazın..."
                      ></textarea>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer text-right">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>İptal</button>
                <button type="submit" className="btn btn-primary ml-2">{editMode ? 'Güncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
