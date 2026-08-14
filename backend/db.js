import sqlite3 from 'sqlite3';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

export const hashPassword = (password) => {
  if (!password) return '';
  return crypto.createHash('sha256').update(password).digest('hex');
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'database.sqlite');

export const isPg = !!process.env.DATABASE_URL && 
                     (process.env.DATABASE_URL.startsWith('postgres://') || 
                      process.env.DATABASE_URL.startsWith('postgresql://'));
let sqliteDb = null;
let pgPool = null;

if (isPg) {
  console.log('PostgreSQL bağlantısı kuruluyor (Railway)...');
  
  // Sabotaj önleme: pg kütüphanesinin önbelleğe aldığı çevre değişkenlerini sıfırlıyoruz.
  if (pg.defaults) {
    pg.defaults.host = null;
    pg.defaults.port = null;
    pg.defaults.database = null;
    pg.defaults.user = null;
    pg.defaults.password = null;
  }
  
  const dbUrl = process.env.DATABASE_URL;
  let poolConfig = {};
  
  try {
    const parsed = new URL(dbUrl);
    poolConfig = {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      user: parsed.username,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      database: parsed.pathname ? parsed.pathname.slice(1) : undefined,
      ssl: {
        rejectUnauthorized: false
      }
    };
    console.log('PostgreSQL bağlantı parametreleri başarıyla ayrıştırıldı. Host:', poolConfig.host);
  } catch (e) {
    console.error('DATABASE_URL ayrıştırma hatası. Düz metin olarak bağlanılıyor...', e.message);
    poolConfig = {
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      }
    };
  }

  pgPool = new pg.Pool(poolConfig);
} else {
  console.log('SQLite bağlantısı kuruluyor (Local)...');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('SQLite veritabanı bağlantı hatası:', err.message);
    } else {
      console.log('SQLite veritabanına başarıyla bağlanıldı.');
    }
  });
}

// Convert ? SQL placeholders to $1, $2... for PostgreSQL
function convertPlaceholders(sql) {
  if (!isPg) return sql;
  let count = 1;
  return sql.replace(/\?/g, () => `$${count++}`);
}

// Helper utilities to use Promise-based syntax
export const queryAll = async (sql, params = []) => {
  if (isPg) {
    const pgSql = convertPlaceholders(sql);
    const result = await pgPool.query(pgSql, params);
    return result.rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

export const queryRun = async (sql, params = []) => {
  if (isPg) {
    const pgSql = convertPlaceholders(sql);
    const result = await pgPool.query(pgSql, params);
    return { lastID: result.insertId || null, changes: result.rowCount };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

export const queryGet = async (sql, params = []) => {
  if (isPg) {
    const pgSql = convertPlaceholders(sql);
    const result = await pgPool.query(pgSql, params);
    return result.rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

// Initialize database schemas
export const initDb = async () => {
  try {
    // 1. Create Tables
    const locationsSql = isPg
      ? `CREATE TABLE IF NOT EXISTS locations (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL,
          value TEXT NOT NULL,
          UNIQUE(type, value)
        )`
      : `CREATE TABLE IF NOT EXISTS locations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL, -- building, floor, cabinet, shelf
          value TEXT NOT NULL,
          UNIQUE(type, value)
        )`;
    await queryRun(locationsSql);

    await queryRun(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        barcode TEXT UNIQUE NOT NULL,
        isbn TEXT,
        fixtureNo TEXT UNIQUE NOT NULL,
        author TEXT NOT NULL,
        publisher TEXT,
        publishYear INTEGER,
        edition INTEGER,
        pageCount INTEGER,
        language TEXT,
        keywords TEXT, -- stored as comma-separated values
        summary TEXT,
        coverImage TEXT,
        totalCopies INTEGER DEFAULT 1,
        status TEXT DEFAULT 'Rafta', -- Rafta, Ödünçte, Hasarlı, Kayıp
        loc_building TEXT,
        loc_floor TEXT,
        loc_cabinet TEXT,
        loc_shelf TEXT,
        loc_rowNo INTEGER
      )
    `);

    await queryRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        role TEXT NOT NULL, -- Yönetici, Kütüphane Görevlisi, Personel
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        status TEXT DEFAULT 'Aktif', -- Aktif, Pasif
        type TEXT DEFAULT 'Personel', -- Personel, Dış Kullanıcı
        tcNo TEXT
      )
    `);

    await queryRun(`
      CREATE TABLE IF NOT EXISTS lend_records (
        id TEXT PRIMARY KEY,
        bookId TEXT NOT NULL,
        userId TEXT NOT NULL,
        lendDate TEXT NOT NULL,
        dueDate TEXT NOT NULL,
        returnDate TEXT,
        status TEXT DEFAULT 'Ödünçte', -- Ödünçte, İade Edildi, Gecikti
        daysUsed INTEGER,
        FOREIGN KEY(bookId) REFERENCES books(id),
        FOREIGN KEY(userId) REFERENCES users(id)
      )
    `);

    await queryRun(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    await queryRun(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Run Migrations for existing databases
    try {
      await queryRun("ALTER TABLE users ADD COLUMN type TEXT DEFAULT 'Personel'");
      console.log("MIGRATION: 'type' kolonu 'users' tablosuna başarıyla eklendi.");
    } catch (e) {
      // Column already exists
    }

    try {
      await queryRun("ALTER TABLE users ADD COLUMN tcNo TEXT");
      console.log("MIGRATION: 'tcNo' kolonu 'users' tablosuna başarıyla eklendi.");
    } catch (e) {
      // Column already exists
    }

    try {
      await queryRun("ALTER TABLE books DROP COLUMN category");
      console.log("MIGRATION: 'category' kolonu 'books' tablosundan kaldırıldı.");
    } catch (e) {
      // Column already dropped or SQLite version lacks DROP COLUMN support
    }

    // 2. Insert Seed Data if database is newly initialized
    const settingsCheck = await queryGet('SELECT count(*) as count FROM settings');
    if (settingsCheck.count === 0) {
      console.log('Veritabanı boş, örnek veriler yükleniyor...');
      
      // Seed Locations
      const initialLocations = {
        buildings: ["Ana Hizmet Binası", "Ek Hizmet Binası"],
        floors: ["Zemin Kat", "1. Kat", "2. Kat", "3. Kat"],
        cabinets: ["Dolap A", "Dolap B", "Dolap C", "Dolap D", "Dolap E"],
        shelves: ["Raf 1", "Raf 2", "Raf 3", "Raf 4", "Raf 5"]
      };

      for (const type of Object.keys(initialLocations)) {
        for (const val of initialLocations[type]) {
          await queryRun('INSERT INTO locations (type, value) VALUES (?, ?)', [type, val]);
        }
      }

      // Seed Settings
      await queryRun("INSERT INTO settings (key, value) VALUES ('barcodePrefix', '8680001')");
      await queryRun("INSERT INTO settings (key, value) VALUES ('lendingLimitDays', '15')");
      await queryRun("INSERT INTO settings (key, value) VALUES ('warningBeforeDays', '3')");
      await queryRun("INSERT INTO settings (key, value) VALUES ('admin_password', 'vantso123')");

      // Seed Users
      const initialUsers = [
        ["U001", "VAN TSO", "Bilgi İşlem ve Ar-Ge", "Yönetici", "admin@vantso.org.tr", "0555 123 45 67", "Aktif", "Personel", "11111111111"],
        ["U002", "Ahmet Yılmaz", "Genel Sekreterlik", "Kütüphane Görevlisi", "a.yilmaz@vantso.org.tr", "0532 987 65 43", "Aktif", "Personel", "22222222222"],
        ["U003", "Mehmet Kaya", "Ticaret Sicil", "Personel", "m.kaya@vantso.org.tr", "0544 555 66 77", "Aktif", "Personel", "33333333333"],
        ["U004", "Ahmet Arslan", "Kurum Dışı", "Personel", "ahmet.arslan@gmail.com", "0505 111 22 33", "Aktif", "Dış Kullanıcı", "44444444444"]
      ];
      for (const user of initialUsers) {
        await queryRun('INSERT INTO users (id, name, department, role, email, phone, status, type, tcNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', user);
      }

      // Seed Books
      const initialBooks = [
        ["B001", "Van Ticaret ve Sanayi Odası Tarihçesi", "868000100101", "978-605-123-456-7", "DEM-2024-001", "Dr. Selim Uçar", "VANTSO Yayınları", 2018, 1, 180, "Türkçe", "VANTSO, Van, Ticaret, Tarihçe", "Van Ticaret ve Sanayi Odası'nın kuruluşundan günümüze kadar geçen süredeki kurumsal geçmişini ve ekonomik katkılarını inceleyen başvuru kaynağı.", "", 2, "Rafta", "Ana Hizmet Binası", "Zemin Kat", "Dolap A", "Raf 1", 1],
        ["B002", "Bölgesel Kalkınma Raporu: Doğu Anadolu", "868000100102", "978-605-123-789-0", "DEM-2024-002", "VANTSO Araştırma Kurulu", "VANTSO Yayınları", 2021, 1, 250, "Türkçe", "Kalkınma, Ekonomi, Rapor, Van", "Doğu Anadolu bölgesindeki illerin sosyo-ekonomik durum analizlerini ve kalkınma önceliklerini içeren araştırma raporu.", "", 3, "Ödünçte", "Ana Hizmet Binası", "1. Kat", "Dolap B", "Raf 2", 3],
        ["B003", "Urartu Medeniyeti ve Van Kalesi", "868000100103", "978-605-222-333-1", "DEM-2025-012", "Prof. Dr. Kemal Alkan", "Kültür Bakanlığı Yayınları", 2019, 3, 410, "Türkçe", "Urartu, Tarih, Van Kalesi, Arkeoloji", "Urartu krallığının başkenti Tuşpa (Van) ve Van Kalesi çevresindeki arkeolojik kazıları, tarihi yapıyı inceleyen akademik eser.", "", 1, "Ödünçte", "Ana Hizmet Binası", "Zemin Kat", "Dolap A", "Raf 2", 5],
        ["B004", "Dış Ticaret ve Gümrük Mevzuatı", "868000100104", "978-605-444-555-2", "DEM-2025-045", "Av. Caner Baş", "Seçkin Yayıncılık", 2023, 2, 380, "Türkçe", "Dış Ticaret, Gümrük, Mevzuat, Hukuk", "Türkiye gümrük bölgesi giriş çıkış işlemleri, dış ticaret teşvikleri ve ilgili yasal yaptırımlar hakkında rehber niteliğinde çalışma.", "", 1, "Rafta", "Ek Hizmet Binası", "2. Kat", "Dolap C", "Raf 3", 2],
        ["B005", "Girişimcilik ve Küçük İşletme Yönetimi", "868000100105", "978-605-666-777-3", "DEM-2026-003", "Prof. Dr. Leyla Şahin", "Beta Basım Yayım", 2024, 1, 290, "Türkçe", "Girişimcilik, KOBİ, Yönetim, İş Planı", "Yeni girişimlerin kurulması, KOBİ'lerin yönetimi, finansman bulma ve iş planı hazırlama süreçlerini anlatan rehber kitap.", "", 1, "Hasarlı", "Ana Hizmet Binası", "1. Kat", "Dolap B", "Raf 4", 1]
      ];
      for (const book of initialBooks) {
        await queryRun(`
          INSERT INTO books (
            id, name, barcode, isbn, fixtureNo, author, publisher, publishYear, edition, 
            pageCount, language, keywords, summary, coverImage, totalCopies, 
            status, loc_building, loc_floor, loc_cabinet, loc_shelf, loc_rowNo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, book);
      }

      // Seed Lend Records
      const initialLends = [
        ["L001", "B003", "U003", "2026-07-01", "2026-07-15", null, "Ödünçte", null],
        ["L002", "B002", "U004", "2026-07-20", "2026-08-04", null, "Ödünçte", null],
        ["L003", "B001", "U002", "2026-06-10", "2026-06-25", "2026-06-22", "İade Edildi", 12],
        ["L004", "B004", "U003", "2026-05-05", "2026-05-20", "2026-05-18", "İade Edildi", 13]
      ];
      for (const lend of initialLends) {
        await queryRun('INSERT INTO lend_records (id, bookId, userId, lendDate, dueDate, returnDate, status, daysUsed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', lend);
      }

      // Seed Logs
      const initialLogs = [
        ["LOG001", "U001", "Sistem Başlatma", "VANTSO Kütüphane Sistemi veri tabanı SQLite ile başlatıldı.", new Date().toISOString()],
        ["LOG002", "U002", "Ödünç Verme", "'Urartu Medeniyeti ve Van Kalesi' adlı kitap Mehmet Kaya isimli personele ödünç verildi.", "2026-07-01T11:30:00.000Z"],
        ["LOG003", "U002", "İade Alma", "'Van Ticaret ve Sanayi Odası Tarihçesi' adlı kitap Ahmet Yılmaz isimli personelden teslim alındı.", "2026-06-22T15:45:00.000Z"]
      ];
      for (const log of initialLogs) {
        await queryRun('INSERT INTO system_logs (id, userId, action, details, timestamp) VALUES (?, ?, ?, ?, ?)', log);
      }

      console.log('Örnek veriler başarıyla yüklendi.');
    } else {
      console.log('Veritabanında kayıtlı veriler mevcut, yükleme atlandı.');
    }

    // Helper to get unique user ID to prevent constraint collisions
    const getNextUserId = async () => {
      const countRow = await queryGet('SELECT count(*) as count FROM users');
      let index = countRow.count + 1;
      while (true) {
        const checkId = 'U' + String(index).padStart(3, '0');
        const exists = await queryGet('SELECT * FROM users WHERE id = ?', [checkId]);
        if (!exists) return checkId;
        index++;
      }
    };

    // Her durumda admin@vantso.org.tr kullanıcısının veritabanında doğru ve güncel olduğundan emin ol
    const adminCheck1 = await queryGet('SELECT * FROM users WHERE LOWER(email) = ?', ['admin@vantso.org.tr']);
    if (!adminCheck1) {
      const u001Check = await queryGet('SELECT * FROM users WHERE id = "U001"');
      const targetId = u001Check ? await getNextUserId() : "U001";
      await queryRun(
        'INSERT INTO users (id, name, department, role, email, phone, status, type, tcNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [targetId, "VAN TSO", "Bilgi İşlem ve Ar-Ge", "Yönetici", "admin@vantso.org.tr", "0555 123 45 67", "Aktif", "Personel", "11111111111"]
      );
    } else {
      await queryRun('UPDATE users SET name = "VAN TSO", role = "Yönetici", status = "Aktif" WHERE LOWER(email) = ?', ['admin@vantso.org.tr']);
    }

    // Her durumda b.deniz@vantso.org.tr kullanıcısının veritabanında doğru ve güncel olduğundan emin ol
    const adminCheck2 = await queryGet('SELECT * FROM users WHERE LOWER(email) = ?', ['b.deniz@vantso.org.tr']);
    if (!adminCheck2) {
      const u005Check = await queryGet('SELECT * FROM users WHERE id = "U005"');
      const targetId = u005Check ? await getNextUserId() : "U005";
      await queryRun(
        'INSERT INTO users (id, name, department, role, email, phone, status, type, tcNo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [targetId, "Büşra Deniz", "Bilgi İşlem ve Ar-Ge", "Yönetici", "b.deniz@vantso.org.tr", "0555 123 45 67", "Aktif", "Personel", "11111111111"]
      );
    } else {
      await queryRun('UPDATE users SET role = "Yönetici", status = "Aktif" WHERE LOWER(email) = ?', ['b.deniz@vantso.org.tr']);
    }

    // Her durumda varsayılan admin şifresi ayar kaydının olduğundan emin ol ve düz metinleri otomatik hash'le
    const passwordCheck = await queryGet('SELECT * FROM settings WHERE key = "admin_password"');
    if (!passwordCheck) {
      const hashedDefault = hashPassword('vantso123');
      await queryRun("INSERT INTO settings (key, value) VALUES ('admin_password', ?)", [hashedDefault]);
    } else {
      const currentVal = passwordCheck.value;
      const isHash = /^[a-f0-9]{64}$/i.test(currentVal);
      if (!isHash) {
        const hashedVal = hashPassword(currentVal);
        await queryRun("UPDATE settings SET value = ? WHERE key = 'admin_password'", [hashedVal]);
        console.log('Mevcut düz metin yönetici şifresi veritabanı başlangıcında SHA-256 ile hash\'lendi.');
      }
    }
  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error);
  }
};
export default sqliteDb;
