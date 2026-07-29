// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\Settings.jsx
import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, ShieldCheck, MapPin, Tag } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView() {
  const [settings, setSettings] = useState({
    barcodePrefix: '',
    lendingLimitDays: 15,
    warningBeforeDays: 3,
    categories: [],
    locations: { buildings: [], floors: [], cabinets: [], shelves: [] }
  });

  const [newCategory, setNewCategory] = useState('');
  const [activeUser, setActiveUser] = useState(null);
  
  // Location sub-inputs
  const [newBuilding, setNewBuilding] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [newCabinet, setNewCabinet] = useState('');
  const [newShelf, setNewShelf] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setActiveUser(api.getActiveUser());
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveParameters = async (e) => {
    e.preventDefault();
    try {
      await api.saveSettings(settings, activeUser?.id);
      setSuccessMsg('Genel sistem parametreleri başarıyla güncellendi.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadSettings();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    if (settings.categories.includes(newCategory.trim())) {
      alert('Bu kategori zaten tanımlanmış!');
      return;
    }

    try {
      await api.addCategory(newCategory.trim(), activeUser?.id);
      setNewCategory('');
      setSuccessMsg('Yeni kitap kategorisi eklendi.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadSettings();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (confirm(`"${catName}" kategorisini silmek istediğinizden emin misiniz?`)) {
      try {
        await api.deleteCategory(catName, activeUser?.id);
        setSuccessMsg('Kategori sistemden kaldırıldı.');
        setTimeout(() => setSuccessMsg(''), 4000);
        await loadSettings();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleAddLocationValue = async (type, value, setValue) => {
    if (!value.trim()) return;

    if (settings.locations[type].includes(value.trim())) {
      alert('Bu konum değeri zaten mevcut!');
      return;
    }

    try {
      await api.addLocation(type, value.trim(), activeUser?.id);
      setValue('');
      setSuccessMsg('Fiziksel konum parametresi güncellendi.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadSettings();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteLocationValue = async (type, value) => {
    if (confirm(`"${value}" değerini konum listesinden silmek istediğinizden emin misiniz?`)) {
      try {
        await api.deleteLocation(type, value, activeUser?.id);
        setSuccessMsg('Konum parametresi silindi.');
        setTimeout(() => setSuccessMsg(''), 4000);
        await loadSettings();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="settings-view">
      {successMsg && (
        <div className="alert-success-banner mb-4">
          <ShieldCheck size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="settings-grid-layout">
        {/* Left Column: Parameters and Categories */}
        <div className="settings-left-col">
          {/* General Parameters */}
          <div className="card mb-4">
            <h3 className="card-title-sm mb-3"><Settings size={16} /> Genel Sistem Parametreleri</h3>
            
            <form onSubmit={handleSaveParameters}>
              <div className="form-group">
                <label className="form-label">Varsayılan Barkod Ön Eki (Prefix)</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={settings.barcodePrefix || ''}
                  onChange={(e) => setSettings({ ...settings, barcodePrefix: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ödünç Alma Limit Gün Sayısı</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={settings.lendingLimitDays}
                    onChange={(e) => setSettings({ ...settings, lendingLimitDays: Number(e.target.value) })}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gecikme Uyarı Gün Eşiği</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={settings.warningBeforeDays}
                    onChange={(e) => setSettings({ ...settings, warningBeforeDays: Number(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary">Parametreleri Kaydet</button>
            </form>
          </div>

          {/* Book Categories */}
          <div className="card">
            <h3 className="card-title-sm mb-3"><Tag size={16} /> Kitap Kategorileri Yönetimi</h3>
            
            <form onSubmit={handleAddCategory} className="mb-4">
              <div className="input-group-row">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Yeni kategori adı yazın..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                  <Plus size={16} /> Ekle
                </button>
              </div>
            </form>

            <div className="settings-tags-list">
              {settings.categories.map((cat, i) => (
                <div key={i} className="settings-tag-item">
                  <span>{cat}</span>
                  <button className="delete-tag-btn" onClick={() => handleDeleteCategory(cat)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Locations */}
        <div className="settings-right-col">
          {/* Physical Locations Management */}
          <div className="card">
            <h3 className="card-title-sm mb-3"><MapPin size={16} /> Fiziksel Konum Kütüphanesi</h3>
            
            {/* Buildings */}
            <div className="location-settings-section mb-4">
              <h4>Binalar</h4>
              <div className="input-group-row mb-2">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Bina adı..."
                  value={newBuilding}
                  onChange={(e) => setNewBuilding(e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => handleAddLocationValue('buildings', newBuilding, setNewBuilding)}
                >
                  Ekle
                </button>
              </div>
              <div className="settings-loc-pills">
                {settings.locations.buildings.map((b, i) => (
                  <span key={i} className="loc-pill-item">
                    {b} <button onClick={() => handleDeleteLocationValue('buildings', b)}>&times;</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Floors */}
            <div className="location-settings-section mb-4">
              <h4>Katlar</h4>
              <div className="input-group-row mb-2">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Kat adı..."
                  value={newFloor}
                  onChange={(e) => setNewFloor(e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => handleAddLocationValue('floors', newFloor, setNewFloor)}
                >
                  Ekle
                </button>
              </div>
              <div className="settings-loc-pills">
                {settings.locations.floors.map((f, i) => (
                  <span key={i} className="loc-pill-item">
                    {f} <button onClick={() => handleDeleteLocationValue('floors', f)}>&times;</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Cabinets */}
            <div className="location-settings-section mb-4">
              <h4>Dolaplar</h4>
              <div className="input-group-row mb-2">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Dolap adı..."
                  value={newCabinet}
                  onChange={(e) => setNewCabinet(e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => handleAddLocationValue('cabinets', newCabinet, setNewCabinet)}
                >
                  Ekle
                </button>
              </div>
              <div className="settings-loc-pills">
                {settings.locations.cabinets.map((c, i) => (
                  <span key={i} className="loc-pill-item">
                    {c} <button onClick={() => handleDeleteLocationValue('cabinets', c)}>&times;</button>
                  </span>
                ))}
              </div>
            </div>

            {/* Shelves */}
            <div className="location-settings-section">
              <h4>Raflar</h4>
              <div className="input-group-row mb-2">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Raf adı..."
                  value={newShelf}
                  onChange={(e) => setNewShelf(e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => handleAddLocationValue('shelves', newShelf, setNewShelf)}
                >
                  Ekle
                </button>
              </div>
              <div className="settings-loc-pills">
                {settings.locations.shelves.map((s, i) => (
                  <span key={i} className="loc-pill-item">
                    {s} <button onClick={() => handleDeleteLocationValue('shelves', s)}>&times;</button>
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
