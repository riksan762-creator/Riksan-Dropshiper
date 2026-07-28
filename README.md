<div align="center">

# 🧾 Riksan Dropship

### Platform E-Commerce Dropship Modern dengan AI Assistant Terintegrasi

*Belanja Sat-Set, Chat Admin, Barang Meluncur* 🚀

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](.)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](.)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](.)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](.)
[![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge&logo=lightning&logoColor=white)](.)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)](.)

**Dibangun & dikembangkan oleh [Riksan](https://github.com/riksan762-creator)**

</div>

---

## 📖 Tentang Project

**Riksan Dropship** adalah platform toko online full-featured yang dirancang khusus buat bisnis dropship di Indonesia. Dibangun 100% dengan stack ringan (vanilla JS + Firebase), tanpa framework berat, tapi punya fitur selevel platform e-commerce modern — lengkap dengan **AI Assistant bertenaga Groq** yang bisa bantu jualan, checkout, sampai analisa bisnis secara otomatis.

> 💡 Static-site architecture (GitHub Pages) + Firebase Firestore realtime database + Firebase Authentication + Groq LLM API — nol biaya hosting, nol server yang perlu di-maintain.

---

## ✨ Fitur Utama

### 🛍️ Storefront (Customer-Facing)

| Fitur | Deskripsi |
|---|---|
| 🎨 **Desain Modern & Responsif** | UI custom "nota kilat" theme, fluid layout, optimized mobile-first |
| 🔍 **Katalog Interaktif** | Filter kategori, sortir (termurah/termahal/rating/terlaris), search real-time |
| 🏆 **Badge Terlaris** | Otomatis muncul di produk dengan penjualan tertinggi |
| 🖼️ **Slider Banner Promo** | Multi-banner dengan auto-slide & navigasi dot |
| 🎡 **Spin Wheel Diskon** | Gamifikasi voucher — sekali putar per sesi, kode otomatis terintegrasi ke checkout |
| 🛒 **Keranjang & Checkout WhatsApp** | Checkout otomatis generate pesan WA lengkap dengan rincian pesanan |
| 👤 **Sistem Akun Customer** | Daftar/masuk (email+password), lupa password, profil tersimpan |
| 📦 **Riwayat Pesanan + Live Tracking** | Status pesanan realtime dengan animasi truk pengiriman ala Shopee |
| ⭐ **Testimoni per Produk** | Review customer tampil di halaman detail produk |
| 🚚 **Estimasi Ongkir Dinamis** | Kalkulasi otomatis berdasarkan wilayah tujuan |
| 🤖 **AI Shopping Assistant** | Chat AI yang bisa jawab pertanyaan produk **dan langsung eksekusi checkout** |

### 👨‍💼 Admin Panel

| Fitur | Deskripsi |
|---|---|
| 📊 **Dashboard Analitik** | Statistik real-time: produk, stok, pendapatan, margin keuntungan |
| 📦 **Kelola Produk** | CRUD lengkap + kompresi gambar otomatis + harga modal rahasia |
| 🖼️ **Kelola Banner** | Manajemen slider promo tanpa sentuh kode |
| 🚚 **Kelola Ongkir** | Atur estimasi ongkir per wilayah |
| ⭐ **Kelola Testimoni** | Kurasi review customer per produk |
| 🧾 **Riwayat Pesanan** | Tracking status pesanan (Menunggu → Dibayar → Dikirim → Selesai) |
| 👥 **Kelola User** | Monitor customer yang terdaftar |
| 🔒 **Sistem Role Admin** | Firestore Security Rules berbasis collection `admins` |
| 📈 **Prediksi Restock Pintar** | Kalkulasi kecepatan jual real dari data pesanan 14 hari terakhir |
| 🤖 **AI Business Advisor** | Analisa bisnis otomatis + rekomendasi actionable dari Groq AI |
| ✨ **AI Generate Deskripsi** | Upload foto produk → AI vision otomatis nulis deskripsi jualan |

### 🤖 AI Capabilities (Powered by Groq)

- **Conversational Commerce** — AI paham konteks katalog, ongkir, dan riwayat pesanan customer secara real-time
- **Agentic Checkout** — AI bukan cuma jawab, tapi bisa **mengeksekusi** (nambah ke keranjang otomatis)
- **Vision AI** — generate deskripsi produk dari foto (model `qwen/qwen3.6-27b`)
- **Business Intelligence** — analisa margin, tren penjualan, dan prediksi stok berbasis data asli

---

## 🛠️ Tech Stack

```
Frontend    : HTML5, CSS3 (Custom Properties), Vanilla JavaScript (ES Modules)
Database    : Firebase Firestore (Realtime NoSQL)
Auth        : Firebase Authentication (Email/Password)
AI Engine   : Groq API (OpenAI-compatible, gpt-oss & qwen models)
Hosting     : GitHub Pages (Static)
```

---

## 📁 Struktur Project

```
riksan-dropship/
├── index.html              # Halaman utama toko (customer)
├── style.css                # Semua styling (CSS variables based)
├── app.js                   # Logic storefront + AI chat + auth customer
├── admin.html               # Halaman admin panel
├── admin.js                 # Logic admin panel + AI advisor
├── admin.css                # Styling admin panel
├── firebase-config.js       # Konfigurasi koneksi Firebase
└── README.md                 # Dokumentasi ini
```

---

## 🔥 Firestore Collections

| Collection | Akses | Keterangan |
|---|---|---|
| `products` | Read: publik / Write: admin | Data produk |
| `productCosts` | Admin only | Harga modal (rahasia margin) |
| `banners` | Read: publik / Write: admin | Slider promo |
| `ongkir` | Read: publik / Write: admin | Estimasi ongkir per wilayah |
| `testimoni` | Read: publik / Write: admin | Review produk |
| `settings` | Read: publik / Write: admin | Konfigurasi toko + AI |
| `orders` | Read: admin/pemilik / Create: publik | Riwayat pesanan |
| `customers` | Read: admin/pemilik | Profil akun customer |
| `admins` | Locked | Whitelist UID admin |

---

## ⚙️ Setup & Instalasi

1. **Clone/download** repository ini
2. Buat project di [Firebase Console](https://console.firebase.google.com), aktifkan:
   - Firestore Database
   - Authentication (Email/Password provider)
3. Copy config Firebase ke `firebase-config.js`
4. Tambahkan UID akun admin ke collection `admins` di Firestore
5. Pasang [Firestore Security Rules](.) sesuai dokumentasi internal
6. (Opsional) Dapatkan API Key gratis di [console.groq.com](https://console.groq.com/keys) buat aktifin fitur AI Chat
7. Deploy ke GitHub Pages — selesai! 🎉

---

## 🔒 Keamanan

- ✅ Role-based access control via Firestore Rules (`isAdmin()` function)
- ✅ Harga modal produk disimpan terpisah, cuma admin yang bisa akses
- ✅ Data pesanan customer terisolasi per akun (`buyerUid` matching)
- ✅ Password reset via Firebase Auth (nggak pernah simpan password mentah)

---

<div align="center">

![Header](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,2,5,30&height=200&section=header&text=RIKSAN&fontSize=80&fontColor=fff&animation=fadeIn&fontAlignY=35&desc=Developer%20%26%20Digital%20Product%20Builder&descAlignY=55&descSize=20)

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=26&duration=3000&pause=800&color=FF4667&center=true&vCenter=true&width=600&lines=Full-Stack+Developer;Firebase+%2B+AI+Integration+Enthusiast;Building+Digital+Products+for+Indonesian+UMKM;Sumedang%2C+Jawa+Barat+%F0%9F%87%AE%F0%9F%87%A9)](https://github.com/riksan762-creator)

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/riksan762-creator)
[![Firebase](https://img.shields.io/badge/Firebase_Expert-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](.)
[![AI](https://img.shields.io/badge/AI_Integration-FF4667?style=for-the-badge&logo=openai&logoColor=white)](.)
[![Indonesia](https://img.shields.io/badge/Made_in-Indonesia-D4A73E?style=for-the-badge&logo=googlemaps&logoColor=white)](.)

*Dibangun dengan ☕, ketekunan, dan sedikit bantuan AI*

![Profile Views](https://komarev.com/ghpvc/?username=riksan762-creator&label=Project%20Views&color=FF4667&style=for-the-badge)

</div>

---

<div align="center">
<sub>© 2026 Riksan Dropship — All rights reserved.</sub>
</div>
