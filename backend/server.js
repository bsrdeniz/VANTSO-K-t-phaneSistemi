// C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi\backend\server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  initDb, 
  queryAll, 
  queryRun, 
  queryGet 
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Initialize Database on Startup
initDb().then(() => {
  console.log('Veritabanı tabloları ve seed veriler hazır.');
}).catch(err => {
  console.error('Veritabanı başlatılamadı:', err);
});

// Helper: Add log to database
const addLog = async (userId, action, details) => {
  const countRow = await queryGet('SELECT count(*) as count FROM system_logs');
  const logId = 'LOG' + String(countRow.count + 1).padStart(3, '0');
  const timestamp = new Date().toISOString();
  await queryRun(
    'INSERT INTO system_logs (id, userId, action, details, timestamp) VALUES (?, ?, ?, ?, ?)',
    [logId, userId || 'Sistem', action, details, timestamp]
  );
};

// Formatting Helper for Books
const formatBook = (b) => ({
  id: b.id,
  name: b.name,
  barcode: b.barcode,
  isbn: b.isbn,
  fixtureNo: b.fixtureNo,
  author: b.author,
  publisher: b.publisher,
  publishYear: b.publishYear,
  edition: b.edition,
  pageCount: b.pageCount,
  language: b.language,
  keywords: b.keywords ? b.keywords.split(',').map(s => s.trim()) : [],
  summary: b.summary,
  coverImage: b.coverImage,
  totalCopies: b.totalCopies,
  status: b.status,
  location: {
    building: b.loc_building,
    floor: b.loc_floor,
    cabinet: b.loc_cabinet,
    shelf: b.loc_shelf,
    rowNo: b.loc_rowNo
  }
});

// ==========================================
// BOOKS API
// ==========================================

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM books');
    const formatted = rows.map(formatBook);
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a book
app.post('/api/books', async (req, res) => {
  try {
    const { 
      name, barcode, isbn, fixtureNo, author, publisher, publishYear, 
      edition, pageCount, language, keywords, summary, 
      coverImage, totalCopies, status, location, userId
    } = req.targetBook = req.body;

    const countRow = await queryGet('SELECT count(*) as count FROM books');
    const bookId = 'B' + String(countRow.count + 1).padStart(3, '0');
    
    const keywordsStr = Array.isArray(keywords) ? keywords.join(', ') : keywords || '';

    await queryRun(`
      INSERT INTO books (
        id, name, barcode, isbn, fixtureNo, author, publisher, publishYear, edition, 
        pageCount, language, keywords, summary, coverImage, totalCopies, 
        status, loc_building, loc_floor, loc_cabinet, loc_shelf, loc_rowNo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bookId, name, barcode, isbn, fixtureNo, author, publisher, publishYear, edition,
      pageCount, language, keywordsStr, summary, coverImage, totalCopies, status,
      location?.building || '', location?.floor || '', location?.cabinet || '', location?.shelf || '', location?.rowNo || 1
    ]);

    await addLog(userId, 'Kitap Ekleme', `"${name}" (Demirbaş: ${fixtureNo}) sisteme eklendi.`);
    res.status(201).json({ id: bookId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a book
app.put('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, barcode, isbn, fixtureNo, author, publisher, publishYear, 
      edition, pageCount, language, keywords, summary, 
      coverImage, totalCopies, status, location, userId
    } = req.body;

    const keywordsStr = Array.isArray(keywords) ? keywords.join(', ') : keywords || '';

    const result = await queryRun(`
      UPDATE books SET 
        name = ?, barcode = ?, isbn = ?, fixtureNo = ?, author = ?, publisher = ?, 
        publishYear = ?, edition = ?, pageCount = ?, language = ?, 
        keywords = ?, summary = ?, coverImage = ?, totalCopies = ?, status = ?, 
        loc_building = ?, loc_floor = ?, loc_cabinet = ?, loc_shelf = ?, loc_rowNo = ?
      WHERE id = ?
    `, [
      name, barcode, isbn, fixtureNo, author, publisher, publishYear, edition,
      pageCount, language, keywordsStr, summary, coverImage, totalCopies, status,
      location?.building || '', location?.floor || '', location?.cabinet || '', location?.shelf || '', location?.rowNo || 1,
      id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Kitap bulunamadı.' });
    }

    await addLog(userId, 'Kitap Güncelleme', `"${name}" kitap bilgileri güncellendi.`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a book
app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // pass userId in query params for logging
    
    const book = await queryGet('SELECT name, fixtureNo FROM books WHERE id = ?', [id]);
    if (!book) {
      return res.status(404).json({ error: 'Kitap bulunamadı.' });
    }

    await queryRun('DELETE FROM books WHERE id = ?', [id]);
    await addLog(userId, 'Kitap Silme', `"${book.name}" (Demirbaş: ${book.fixtureNo}) sistemden silindi.`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// USERS API
// ==========================================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a user
app.post('/api/users', async (req, res) => {
  try {
    const { name, department, role, email, phone, status, type, tcNo, actorId } = req.body;
    const countRow = await queryGet('SELECT count(*) as count FROM users');
    const userId = 'U' + String(countRow.count + 1).padStart(3, '0');

    await queryRun(
      'INSERT INTO users (id, name, department, role, email, phone, status, type, tcNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, name, department || 'Genel', role || 'Personel', email, phone, status || 'Aktif', type || 'Personel', tcNo || '']
    );

    await addLog(actorId, 'Kullanıcı Ekleme', `"${name}" adlı üye sisteme eklendi.`);
    res.status(201).json({ id: userId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, role, email, phone, status, type, tcNo, actorId } = req.body;

    const result = await queryRun(
      'UPDATE users SET name = ?, department = ?, role = ?, email = ?, phone = ?, status = ?, type = ?, tcNo = ? WHERE id = ?',
      [name, department || 'Genel', role || 'Personel', email, phone, status, type || 'Personel', tcNo || '', id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    await addLog(actorId, 'Kullanıcı Güncelleme', `"${name}" üye bilgileri güncellendi.`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { actorId } = req.query;

    const user = await queryGet('SELECT name FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    await queryRun('DELETE FROM users WHERE id = ?', [id]);
    await addLog(actorId, 'Kullanıcı Silme', `"${user.name}" personeli silindi.`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// LEND / RETURN API
// ==========================================

// Get all lend records
app.get('/api/lend', async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM lend_records');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lend a book
app.post('/api/lend', async (req, res) => {
  try {
    const { bookId, userId, dueDate, actorId } = req.body;

    const book = await queryGet('SELECT name, status FROM books WHERE id = ?', [bookId]);
    const user = await queryGet('SELECT name FROM users WHERE id = ?', [userId]);

    if (!book || !user) {
      return res.status(400).json({ error: 'Kitap veya personel bulunamadı.' });
    }

    if (book.status !== 'Rafta') {
      return res.status(400).json({ error: 'Kitap şu anda rafta değil (ödünçte veya kayıp).' });
    }

    const countRow = await queryGet('SELECT count(*) as count FROM lend_records');
    const recordId = 'L' + String(countRow.count + 1).padStart(3, '0');
    const lendDate = new Date().toISOString().split('T')[0];

    // Create lend record
    await queryRun(
      'INSERT INTO lend_records (id, bookId, userId, lendDate, dueDate, returnDate, status, daysUsed) VALUES (?, ?, ?, ?, ?, null, "Ödünçte", null)',
      [recordId, bookId, userId, lendDate, dueDate]
    );

    // Update book status
    await queryRun('UPDATE books SET status = "Ödünçte" WHERE id = ?', [bookId]);

    await addLog(actorId, 'Ödünç Verme', `"${book.name}" kitabı, ${user.name} adlı personele ödünç verildi. (Son Teslim: ${dueDate})`);
    res.status(201).json({ id: recordId, bookId, userId, lendDate, dueDate, status: 'Ödünçte' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Return a book
app.post('/api/return', async (req, res) => {
  try {
    const { recordId, returnStatus, actorId } = req.body; // returnStatus = Rafta, Hasarlı, Kayıp

    const record = await queryGet('SELECT * FROM lend_records WHERE id = ?', [recordId]);
    if (!record) {
      return res.status(404).json({ error: 'Ödünç kaydı bulunamadı.' });
    }

    const book = await queryGet('SELECT name FROM books WHERE id = ?', [record.bookId]);
    const user = await queryGet('SELECT name FROM users WHERE id = ?', [record.userId]);

    const todayStr = new Date().toISOString().split('T')[0];
    const lendDate = new Date(record.lendDate);
    const todayDate = new Date(todayStr);
    const diffTime = Math.abs(todayDate - lendDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Update Lend Record
    await queryRun(
      'UPDATE lend_records SET returnDate = ?, status = "İade Edildi", daysUsed = ? WHERE id = ?',
      [todayStr, diffDays, recordId]
    );

    // Update Book Status
    await queryRun('UPDATE books SET status = ? WHERE id = ?', [returnStatus || 'Rafta', record.bookId]);

    await addLog(actorId, 'İade Alma', `"${book ? book.name : 'Bilinmeyen Kitap'}" kitabı ${user ? user.name : 'Bilinmeyen Personel'} isimli personelden teslim alındı. Durum: ${returnStatus}.`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SYSTEM LOGS API
// ==========================================

app.get('/api/logs', async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT 100');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a specific system log
app.delete('/api/logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await queryRun('DELETE FROM system_logs WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all system logs
app.delete('/api/logs', async (req, res) => {
  try {
    await queryRun('DELETE FROM system_logs');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Force change password (directly, without old password verification)
app.post('/api/settings/force-change-password', async (req, res) => {
  try {
    const { newPassword, actorId } = req.body;
    await queryRun('UPDATE settings SET value = ? WHERE key = "admin_password"', [newPassword]);
    await addLog(actorId, 'Şifre Güncelleme', 'Yönetici giriş şifresi doğrudan güncellendi.');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password to default
app.post('/api/settings/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const emailClean = email.trim().toLowerCase();
    if (emailClean !== 'admin@vantso.org.tr' && emailClean !== 'b.deniz@vantso.org.tr') {
      return res.status(400).json({ error: 'Geçersiz e-posta adresi.' });
    }
    await queryRun('UPDATE settings SET value = "vantso123" WHERE key = "admin_password"');
    await addLog('Sistem', 'Şifre Sıfırlama', 'Yönetici şifresi varsayılan şifreye ("vantso123") sıfırlandı.');
    res.json({ success: true, message: 'Şifreniz başarıyla varsayılan şifre ("vantso123") olarak güncellenmiştir!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SETTINGS API
// ==========================================

// Get all settings, categories and locations as a single object
app.get('/api/settings', async (req, res) => {
  try {
    const settingsRows = await queryAll('SELECT * FROM settings');
    const categoriesRows = await queryAll('SELECT * FROM categories');
    const locationsRows = await queryAll('SELECT * FROM locations');

    const config = {};
    settingsRows.forEach(row => {
      config[row.key] = isNaN(row.value) ? row.value : Number(row.value);
    });

    config.categories = categoriesRows.map(c => c.name);

    config.locations = {
      buildings: locationsRows.filter(l => l.type === 'buildings').map(l => l.value),
      floors: locationsRows.filter(l => l.type === 'floors').map(l => l.value),
      cabinets: locationsRows.filter(l => l.type === 'cabinets').map(l => l.value),
      shelves: locationsRows.filter(l => l.type === 'shelves').map(l => l.value)
    };

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save core settings parameters
app.post('/api/settings', async (req, res) => {
  try {
    const { barcodePrefix, lendingLimitDays, warningBeforeDays, actorId } = req.body;

    if (barcodePrefix !== undefined) {
      await queryRun('INSERT OR REPLACE INTO settings (key, value) VALUES ("barcodePrefix", ?)', [String(barcodePrefix)]);
    }
    if (lendingLimitDays !== undefined) {
      await queryRun('INSERT OR REPLACE INTO settings (key, value) VALUES ("lendingLimitDays", ?)', [String(lendingLimitDays)]);
    }
    if (warningBeforeDays !== undefined) {
      await queryRun('INSERT OR REPLACE INTO settings (key, value) VALUES ("warningBeforeDays", ?)', [String(warningBeforeDays)]);
    }

    await addLog(actorId, 'Ayar Güncelleme', 'Sistem parametreleri ve limit ayarları güncellendi.');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add category
app.post('/api/settings/categories', async (req, res) => {
  try {
    const { name, actorId } = req.body;
    await queryRun('INSERT INTO categories (name) VALUES (?)', [name]);
    await addLog(actorId, 'Kategori Ekleme', `Sisteme yeni "${name}" kategorisi eklendi.`);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete category
app.delete('/api/settings/categories/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { actorId } = req.query;
    await queryRun('DELETE FROM categories WHERE name = ?', [name]);
    await addLog(actorId, 'Kategori Silme', `"${name}" kategorisi sistemden kaldırıldı.`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add location value
app.post('/api/settings/locations', async (req, res) => {
  try {
    const { type, value, actorId } = req.body; // type = buildings, floors, cabinets, shelves
    await queryRun('INSERT INTO locations (type, value) VALUES (?, ?)', [type, value]);
    await addLog(actorId, 'Konum Ekleme', `Konum listesine yeni ${type} değeri "${value}" eklendi.`);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete location value
app.delete('/api/settings/locations', async (req, res) => {
  try {
    const { type, value, actorId } = req.query;
    await queryRun('DELETE FROM locations WHERE type = ? AND value = ?', [type, value]);
    await addLog(actorId, 'Konum Silme', `Konum listesinden ${type} değeri "${value}" kaldırıldı.`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Authentication endpoint (verifies admin login against SQLite/PostgreSQL)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const passRow = await queryGet('SELECT value FROM settings WHERE key = "admin_password"');
    const adminPassword = passRow ? passRow.value : 'vantso123';

    if (password !== adminPassword) {
      return res.status(401).json({ error: 'Hatalı şifre!' });
    }
    
    // Query db for the user with the given email (case-insensitive)
    let user = await queryGet('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND status = "Aktif"', [email.trim()]);
    
    // Güvenlik ve Sıfırlama Koruması: Eğer yönetici e-postaları veritabanında yoksa anında oluştur
    if (!user) {
      const emailClean = email.trim().toLowerCase();
      if (emailClean === 'admin@vantso.org.tr' || emailClean === 'b.deniz@vantso.org.tr') {
        // ID çakışması önleme
        let targetId = emailClean === 'admin@vantso.org.tr' ? 'U001' : 'U005';
        const idCheck = await queryGet('SELECT * FROM users WHERE id = ?', [targetId]);
        if (idCheck) {
          // Find next available user ID
          const countRow = await queryGet('SELECT count(*) as count FROM users');
          let index = countRow.count + 1;
          let check = true;
          while (check) {
            const nextId = 'U' + String(index).padStart(3, '0');
            const exist = await queryGet('SELECT * FROM users WHERE id = ?', [nextId]);
            if (!exist) {
              targetId = nextId;
              check = false;
            }
            index++;
          }
        }

        if (emailClean === 'admin@vantso.org.tr') {
          await queryRun(
            'INSERT INTO users (id, name, department, role, email, phone, status, type, tcNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [targetId, "VAN TSO", "Bilgi İşlem ve Ar-Ge", "Yönetici", "admin@vantso.org.tr", "0555 123 45 67", "Aktif", "Personel", "11111111111"]
          );
          user = await queryGet('SELECT * FROM users WHERE LOWER(email) = ?', ['admin@vantso.org.tr']);
        } else {
          await queryRun(
            'INSERT INTO users (id, name, department, role, email, phone, status, type, tcNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [targetId, "Büşra Deniz", "Bilgi İşlem ve Ar-Ge", "Yönetici", "b.deniz@vantso.org.tr", "0555 123 45 67", "Aktif", "Personel", "11111111111"]
          );
          user = await queryGet('SELECT * FROM users WHERE LOWER(email) = ?', ['b.deniz@vantso.org.tr']);
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Giriş yetkisi bulunmayan e-posta adresi!' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      department: user.department,
      role: user.role,
      email: user.email,
      phone: user.phone,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change admin login password in settings
app.post('/api/settings/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, actorId } = req.body;
    
    const passRow = await queryGet('SELECT value FROM settings WHERE key = "admin_password"');
    const adminPassword = passRow ? passRow.value : 'vantso123';
    
    if (currentPassword !== adminPassword) {
      return res.status(400).json({ error: 'Mevcut şifre hatalı!' });
    }
    
    await queryRun('UPDATE settings SET value = ? WHERE key = "admin_password"', [newPassword]);
    await addLog(actorId, 'Şifre Değiştirme', 'Yönetici giriş şifresi başarıyla güncellendi.');
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static assets from the React frontend build folder (dist)
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to React index.html for single page application routing
app.get('*', (req, res) => {
  // If it's a call to the API that didn't match, return 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Express API sunucusu çalışıyor: http://localhost:${PORT}`);
});
