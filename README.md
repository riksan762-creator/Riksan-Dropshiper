<div align="center">

![Header](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=220&section=header&text=Riksan%20Dropship&fontSize=55&fontColor=fff&animation=fadeIn&fontAlignY=38&desc=Toko%20Online%20Realtime%20%2B%20AI%20Shopping%20Assistant&descAlignY=58&descSize=18)

<a href="https://riksan762-creator.github.io/" target="_blank">
  <img src="https://img.shields.io/badge/🔗_LIVE_DEMO-Klik_Disini-E63E7F?style=for-the-badge&labelColor=1B1030" />
</a>

<br><br>

![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=20&pause=1000&color=D4AF37&center=true&vCenter=true&width=600&lines=Static+website+dengan+backend+realtime+Firebase;Panel+admin+lengkap+tanpa+server+sendiri;Ditenagai+AI+%E2%80%94+bukan+sekadar+katalog+biasa+%F0%9F%A4%96)

</div>

<br>

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge&logo=lightning&logoColor=white)

</div>

<br>

> **Zero backend server. Zero build step. 100% realtime.**
> Semua data tersinkron langsung lewat Firestore `onSnapshot` — admin ubah produk di satu HP, ratusan pengunjung lain lihat perubahan detik itu juga, tanpa refresh.

---

## 🤖 Ditenagai AI — Bukan Sekadar Katalog Biasa

Ini bukan template toko online biasa. Riksan Dropship punya **asisten belanja AI bawaan** yang jalan langsung di browser customer, terhubung ke **Groq API** (`openai/gpt-oss-20b`, model super cepat & gratis):

```
🧠 AI dikasih konteks LIVE dari Firestore setiap kali chat dibuka:
   ├─ Seluruh katalog produk (nama, harga, diskon, stok, rating) — realtime
   ├─ Tabel estimasi ongkir per kota/wilayah — realtime
   └─ System prompt & persona yang bisa diatur admin tanpa sentuh kode
```

**Kenapa ini keren, bukan cuma "chatbot tempel":**
- 🎯 **Anti halusinasi** — AI dilarang keras mengarang nama produk/harga/stok yang gak ada di database. Kalau gak tau, AI jujur bilang gak tau.
- 🛒 **Actionable** — AI bisa nyaranin produk lengkap dengan tombol "🛒 Tambah ke Keranjang" langsung di dalam chat, gak cuma teks kosong.
- 💬 **Quick replies pintar** — rekomendasi produk, cek ongkir, cek promo, satu tap tanpa ngetik.
- ⚙️ **Full dikontrol admin** — API key, model, dan persona AI semua diatur dari panel admin, tanpa sentuh satu baris kode pun.
- 🔄 **Selalu up-to-date** — begitu admin ubah stok/harga di panel, AI langsung "tau" perubahan itu di chat berikutnya. Gak ada data basi.

---

## ✨ Fitur Lengkap

<table>
<tr>
<td width="50%" valign="top">

### 🛍️ Storefront
- 📦 Katalog realtime, filter & sort kategori
- 🔍 Pencarian instan
- 🛒 Keranjang per-sesi (`sessionStorage`)
- 💬 Checkout otomatis → pesan WhatsApp terformat rapi
- 🚚 Estimasi ongkir dinamis per wilayah
- ⭐ Testimoni customer per produk
- 🖼️ Banner promo dengan auto-slider
- 🎁 Roda Spin Diskon (*weighted random prize*)
- 👤 Akun customer + riwayat pesanan pribadi
- 🤖 AI Shopping Assistant (lihat di atas)

</td>
<td width="50%" valign="top">

### 🔐 Admin Panel
- 🔑 Login aman via Firebase Auth + verifikasi role
- 📊 Dashboard: total produk, stok, stok kritis, terlaris
- 🧾 Riwayat pesanan masuk otomatis
- 👥 Manajemen user terdaftar
- 🏷️ CRUD produk, kategori, banner, ongkir
- ⭐ Kelola testimoni per produk
- ⚙️ Pengaturan toko: WA, Shopee, banner, AI config
- 🖼️ Upload gambar + kompresi otomatis di klien

</td>
</tr>
</table>

---

## 🧰 Tech Stack

<div align="center">

| Layer | Teknologi |
|:---:|:---:|
| **Frontend** | HTML5 · CSS3 (design tokens) · Vanilla JS (ES Modules) |
| **Database** | Firebase Firestore — realtime sync via `onSnapshot` |
| **Auth** | Firebase Authentication (email/password) |
| **AI Engine** | Groq API — `openai/gpt-oss-20b` |
| **Hosting** | GitHub Pages — 100% statis, zero server |
| **Media** | Base64 + kompresi client-side (hemat kuota, no Storage bucket) |

</div>

Tidak ada framework. Tidak ada `npm install`. Tidak ada build step.
Clone → isi config → push → live. Sesederhana itu.

---

## 📁 Struktur Proyek

```
📦 riksan-dropship
├── 🏠 index.html          → Halaman toko (storefront)
├── ⚡ app.js               → Logic storefront: katalog, cart, checkout, AI chat, akun
├── 🔐 admin.html           → Panel admin
├── ⚙️ admin.js             → Logic admin: CRUD, auth, dashboard
├── 🎨 admin.css            → Styling admin panel
├── 🔑 firebase-config.js   → Konfigurasi project Firebase
└── 🛡️ firestore.rules      → Security rules Firestore
```

---

## 🚀 Cara Deploy Sendiri

```bash
1. Buat project di console.firebase.google.com
2. Aktifkan Firestore Database + Authentication (Email/Password)
3. Tempel config kamu ke firebase-config.js
4. Publish firestore.rules ke Firebase Console → Firestore → Rules
5. Buat akun admin pertama:
   → Authentication → Users → tambah user
   → Firestore → collection "admins" → Document ID = UID user tsb
6. (Opsional) Ambil API key gratis di console.groq.com/keys
   → aktifkan AI chat dari menu Pengaturan Toko
7. Push ke GitHub → aktifkan GitHub Pages → 🎉 live
```

Seed data produk otomatis terisi begitu Firestore masih kosong saat admin panel pertama kali dibuka — gak perlu isi manual satu-satu dari nol.

---

## 🔒 Keamanan (Firestore Rules)

| Collection | Baca | Tulis |
|---|---|---|
| `products`, `banners`, `settings`, `ongkir`, `testimoni` | 🌍 Publik | 🔐 Admin saja |
| `orders` | 🔐 Admin / pemilik pesanan | ✍️ Create publik, edit admin saja |
| `customers` | 🔐 Admin / pemilik akun | 🔐 Pemilik akun saja |
| `admins` | 🔐 Hanya baca dokumen milik sendiri | 🚫 Tidak bisa ditulis dari client |

> ⚠️ Groq API key dipanggil langsung dari browser (arsitektur tanpa backend) — pantau usage secara berkala dan rotate key jika dicurigai disalahgunakan.

---

<div align="center">

### 💡 Dibangun untuk pelaku dropship yang mau toko online cepat, murah, dan pintar — tanpa server, tanpa ribet.

![Footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer)

</div>
