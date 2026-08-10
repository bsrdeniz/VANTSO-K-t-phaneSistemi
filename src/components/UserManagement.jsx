// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\src\components\UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, User, Mail, Phone } from 'lucide-react';
import { api } from '../services/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    department: 'Genel',
    role: 'Personel', 
    email: '',
    phone: '',
    status: 'Aktif', 
    type: 'Personel' 
  });

  useEffect(() => {
    setActiveUser(api.getActiveUser());
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await api.getUsers();
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAddModal = () => {
    setEditMode(false);
    setFormData({
      id: '',
      name: '',
      department: 'Genel',
      role: 'Personel',
      email: '',
      phone: '',
      status: 'Aktif',
      type: 'Personel'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditMode(true);
    setFormData({ 
      ...user,
      department: user.department || 'Genel',
      role: user.role || 'Personel',
      type: user.type || 'Personel'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Bu üyeyi sistemden silmek istediğinize emin misiniz?')) {
      try {
        await api.deleteUser(id, activeUser?.id);
        loadUsers();
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      alert('Lütfen tüm zorunlu alanları doldurun!');
      return;
    }

    try {
      if (editMode) {
        await api.updateUser(formData, activeUser?.id);
      } else {
        await api.addUser(formData, activeUser?.id);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="user-management-view">
      <div className="view-actions-bar mb-4">
        <h2>Kütüphane Üye Listesi</h2>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} /> Yeni Üye Ekle
        </button>
      </div>

      {/* Users Table */}
      <div className="card p-0">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Üye ID</th>
                <th>Ad Soyad</th>
                <th>E-posta</th>
                <th>Telefon</th>
                <th>Durum</th>
                <th className="text-center">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.id}</strong></td>
                  <td>
                    <div className="table-user-row">
                      <div className="mini-avatar" style={{
                        backgroundColor: 'var(--primary-color)'
                      }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <strong>{user.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="td-flex-icon"><Mail size={12} /> {user.email}</div>
                  </td>
                  <td>
                    <div className="td-flex-icon"><Phone size={12} /> {user.phone}</div>
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'Aktif' ? 'badge-rafta' : 'badge-kayip'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="action-buttons-cell">
                      <button 
                        onClick={() => handleOpenEditModal(user)}
                        className="btn btn-outline btn-sm edit-action-btn"
                        title="Üye Düzenle"
                      >
                        <Edit2 size={12} /> Düzenle
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="btn btn-danger btn-sm"
                        title="Üye Sil"
                      >
                        <Trash2 size={12} /> Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editMode ? 'Üye Bilgilerini Düzenle' : 'Yeni Üye Kaydet'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                
                <div className="form-group">
                  <label className="form-label"><User size={14} /> Ad Soyad *</label>
                  <input 
                    type="text" 
                    name="name"
                    className="form-control" 
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><Mail size={14} /> E-posta Adresi *</label>
                    <input 
                      type="email" 
                      name="email"
                      className="form-control" 
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Örn: uye@gmail.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><Phone size={14} /> İletişim Telefonu *</label>
                    <input 
                      type="text" 
                      name="phone"
                      className="form-control" 
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="Örn: 0555 123 45 67"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Üye Durumu</label>
                  <select 
                    name="status"
                    className="form-control" 
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Aktif">Aktif (Ödünç kitap alabilir)</option>
                    <option value="Pasif">Pasif (Kitap alımı engellenir)</option>
                  </select>
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
