# VANTSO Kütüphane Sistemi - Proje Teslim Walkthrough

Proje başarıyla geliştirilmiş ve masaüstünüzdeki `C:\Users\BÜŞRA DENİZ\Desktop\VANTSO-KütüphaneSistemi` dizinine yerleştirilmiştir. Bu belgede projenin yapısı, özellikleri ve nasıl çalıştırılacağı özetlenmiştir.

---

## Projeyi Çalıştırma Adımları

Projeyi yerel bilgisayarınızda başlatmak için terminal veya PowerShell üzerinden aşağıdaki adımları izleyebilirsiniz:

1. **Bağımlılıkları Yükleme (İlk Çalıştırma):**
   Masaüstündeki proje klasörünü terminalde açın ve hem ana dizin hem de backend dizini için paketleri yükleyin:
   ```bash
   npm run setup
   ```
   *(Not: Kolaylık olması açısından kök dizine `npm run setup` scripti tanımlanmıştır. Hem frontend hem de backend bağımlılıklarını tek adımda kurar.)*

2. **Uygulamayı Başlatma (Frontend + Backend Concurrently):**
   ```bash
   npm start
   ```
   Bu komut, `concurrently` paketini kullanarak **React + Vite** arayüz sunucusunu (`http://localhost:5173`) ve **Node.js + Express** API sunucusunu (`http://localhost:5001`) aynı anda tek bir terminal penceresinde başlatır.

3. **Uygulamayı Derleme (Build):**
   ```bash
   npm run build
   ```
   Uygulamanın statik dağıtım paketini oluşturur. Projenin hatasız derlendiği doğrulanmıştır.

---

## Proje Klasör Yapısı

```
VANTSO-KütüphaneSistemi/
├── index.html                   # Uygulama ana şablonu (Türkçe ve Kurumsal Başlık)
├── package.json                 # Bağımlılıklar (concurrently, React 19, Vite 8)
├── vite.config.js               # Vite yapılandırması
├── src/
│   ├── main.jsx                 # Giriş noktası scripti
│   ├── index.css                # Lacivert & Altın Sarısı kurumsal tasarıma sahip global CSS
│   ├── App.jsx                  # Sayfa yönetimi ve dinamik modül render mekanizması
│   ├── services/
│   │   └── api.js               # REST API üzerinden Backend/SQLite bağlantısını sağlayan servis
│   └── components/
│       ├── Sidebar.jsx          # Menüler ve Aktif Kullanıcı Simülatörü
│       ├── Header.jsx           # Bildirim Paneli ve Canlı Saat/Takvim
│       ├── Dashboard.jsx        # Gösterge Paneli, SVG Grafikleri ve KPI kartları
│       ├── BookSearch.jsx       # Gelişmiş Arama, Kart/Tablo Görünümü ve Raf Takip Modülü
│       ├── BookManagement.jsx   # Kitap envanteri düzenleme, ekleme ve konum tanımlama
│       ├── LendOperations.jsx   # Kitap Ödünç Verme (Tek ekran form)
│       ├── ReturnOperations.jsx # Kitap İade Alma ve Hasar/Kayıp Durumu Kontrolü
│       ├── UserManagement.jsx   # Personel (Yetki ve Birim) Yönetimi
│       ├── HistoryLogs.jsx      # Silinemez sistem hareket kayıtları (Audit logs)
│       ├── Reports.jsx          # Envanter ve kullanım raporları görsel tablosu
│       └── Settings.jsx         # Raf konumu, kategoriler ve limit tanımlamaları
├── backend/
│   ├── package.json             # API bağımlılıkları (express, sqlite3, cors, nodemon)
│   ├── database.sqlite          # SQLite veritabanı dosyası (Tüm veriler burada saklanır)
│   ├── db.js                    # Veritabanı tablolarını oluşturan ve örnek verileri yükleyen SQL katmanı
│   └── server.js                # Express API sunucusu ve REST API uç noktaları (Endpoints)
```

---

## Geliştirilen Modüller ve Detaylar

1. **Dashboard (Gösterge Paneli):** Toplam kitap, kullanılabilir kitap, ödünçte ve gecikmiş kitap sayılarını içeren KPI kartları bulunur. Kategori dağılımı (dinamik progress çubukları) ve Aylık Ödünç Grafiği (saf SVG sütun grafiği) yer alır.
2. **Gelişmiş Arama:** Kitap adı, yazar, barkod, ISBN veya etiketlere göre anlık arama yapar. Kart görünümü (AI kapak mockup'lı) ile detaylı veri tablosu görünümü arasında tek tıkla geçiş sağlar.
3. **Detay Kartı & Raf Konumu:** Kitap detay penceresinde kitabın fiziksel konumu (Bina, Kat, Dolap, Raf ve Sıra No) görsel kutucuklar ile gösterilir; personel aradığı kitabı saniyeler içinde bulabilir.
4. **Ödünç & İade Döngüsü:** Ödünç verme ekranında kitap ve personel otomatik tamamlama (auto-suggest) ile hızlıca seçilir ve son teslim tarihi belirlenerek durum "Ödünçte" olarak güncellenir. İade alma ekranında teslim tarihi geçmiş kitaplar için kırmızı uyarılar gösterilir. Kitap iade edilirken "Sağlam", "Hasarlı" veya "Kayıp" seçilerek envantere işlenir.
5. **Silinemez Log Sistemi:** Yapılan tüm işlemler (kitap kaydı, personel güncellemesi, ödünç/iade hareketleri vb.) işlemi yapan personelin ID'si ve zaman damgasıyla birlikte sistem loglarına eklenir. Güvenlik gereği bu loglar silinemez.
6. **Güvenli Giriş Ekranı (Login):** Sistem, kurumsal e-posta (`admin@vantso.org.tr`) ve şifre (`vantso123`) doğrulaması ile çalışır. Başarılı giriş sonrasında yetkilendirilmiş kurumsal modüller açılır. Sol alt köşedeki "Çıkış Yap" butonu ile oturum sonlandırılabilir.
7. **Raporlama:** Envanter dağılımı, en çok okunan kitaplar ve birim bazlı okuma istatistikleri sunulur. "Yazdır" butonu kurumsal çıktı formatı sağlar (print-CSS optimizasyonu yapılmıştır).
