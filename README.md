<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=800&size=34&duration=2500&pause=800&color=00F5FF&center=true&vCenter=true&width=650&lines=RIKSAN+DROPSHIP" alt="Typing SVG" />

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=15&duration=3000&pause=1200&color=D4AF37&center=true&vCenter=true&width=600&lines=Serverless+%C2%B7+Realtime+%C2%B7+AI-Augmented+Commerce+Engine" />

<br>

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-visit_app-00F5FF?style=for-the-badge&logo=googlechrome&logoColor=white&labelColor=0D0221)](https://riksan762-creator.github.io/Riksan-Dropshiper/)
[![Stars](https://img.shields.io/github/stars/riksan762-creator/Riksan-Dropshiper?style=for-the-badge&color=FFD700&labelColor=0D0221)](https://github.com/riksan762-creator/Riksan-Dropshiper/stargazers)
[![Forks](https://img.shields.io/github/forks/riksan762-creator/Riksan-Dropshiper?style=for-the-badge&color=E63E7F&labelColor=0D0221)](https://github.com/riksan762-creator/Riksan-Dropshiper/network/members)
[![License](https://img.shields.io/badge/LICENSE-MIT-39FF14?style=for-the-badge&labelColor=0D0221)](#-lisensi)

<br>

![Last Commit](https://img.shields.io/github/last-commit/riksan762-creator/Riksan-Dropshiper?style=flat-square&color=00F5FF&labelColor=0D0221)
![Repo Size](https://img.shields.io/github/repo-size/riksan762-creator/Riksan-Dropshiper?style=flat-square&color=D4AF37&labelColor=0D0221)
![Issues](https://img.shields.io/github/issues/riksan762-creator/Riksan-Dropshiper?style=flat-square&color=E63E7F&labelColor=0D0221)
![Status](https://img.shields.io/badge/status-active-39FF14?style=flat-square&labelColor=0D0221)

</div>

<br>

<div align="center">

### 🧩 Dibangun dengan

<img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
<img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
<img src="https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white" />

### 🧠 Didukung AI

<img src="https://img.shields.io/badge/Groq_LLM-F55036?style=for-the-badge&logo=lightning&logoColor=white" />
<img src="https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=anthropic&logoColor=white" />
<img src="https://img.shields.io/badge/ChatGPT-74AA9C?style=for-the-badge&logo=openai&logoColor=white" />
<img src="https://img.shields.io/badge/GPT_OSS_20B-000000?style=for-the-badge&logo=openai&logoColor=white" />

</div>

<br>

> ### ⚡ Filosofi Rancangan
> Proyek ini dibangun di atas premis bahwa **kesederhanaan arsitektur bukan kompromi, melainkan keunggulan kompetitif**. Tanpa server aplikasi, tanpa build pipeline — hanya klien statis yang berbicara langsung dengan lapisan data terkelola. **Konsistensi data realtime dengan biaya operasional seminimal mungkin.**

---

## 📚 Daftar Isi

| | |
|---|---|
| [🔎 Ringkasan](#-ringkasan) | [🏗️ Arsitektur](#️-rancangan-arsitektur) |
| [🧠 Lapisan AI](#-lapisan-kecerdasan-buatan) | [📁 Struktur Proyek](#-anatomi-proyek) |
| [✨ Fitur](#-kapabilitas-sistem) | [🚀 Instalasi](#-provisioning--deployment) |
| [🧰 Tech Stack](#-susunan-teknologi) | [🔒 Keamanan](#-model-keamanan) |
| [🗺️ Roadmap](#️-roadmap) | [📄 Lisensi](#-lisensi) |

---

## 🔎 Ringkasan

**Riksan Dropship** adalah platform e-commerce dropshipping *serverless* untuk pasar Indonesia — menggabungkan storefront publik, panel admin, dan asisten belanja bertenaga AI dalam satu arsitektur tanpa server aplikasi. Dibangun murni dengan HTML/CSS/JS dan Firebase sebagai *backend-as-a-service*, lalu didistribusikan gratis lewat GitHub Pages.

| Aspek | Detail |
|---|---|
| 🎯 Target pengguna | Pelaku dropship & UMKM Indonesia |
| ⚙️ Model arsitektur | Serverless, client-direct-to-database |
| 🧠 Fitur unggulan | Asisten belanja AI dengan grounding data realtime |
| 💸 Biaya infrastruktur | Free tier Firebase + GitHub Pages |

---

## 🧠 Lapisan Kecerdasan Buatan

Riksan Dropship mengintegrasikan **agen percakapan berbasis LLM** (via [Groq](https://groq.com), model `openai/gpt-oss-20b`) yang **di-*ground*-kan langsung pada state database realtime** — bukan pengetahuan statis yang bisa kedaluwarsa.

```mermaid
graph LR
    A[💬 Customer] --> B{🧠 LLM Inference}
    C[(📦 Katalog Produk)] -.realtime.-> B
    D[(🚚 Matriks Ongkir)] -.realtime.-> B
    B --> F[✅ Respons + Aksi Kontekstual]

    style A fill:#0D0221,stroke:#00F5FF,color:#fff
    style B fill:#E63E7F,stroke:#00F5FF,color:#fff
    style C fill:#12897A,stroke:#39FF14,color:#fff
    style D fill:#12897A,stroke:#39FF14,color:#fff
    style F fill:#FFD700,stroke:#0D0221,color:#000
```

| Prinsip | Implementasi |
|---|---|
| 🎯 **Grounding, bukan generasi bebas** | Model dilarang berspekulasi di luar data katalog — tidak ada halusinasi produk/harga. |
| 🛒 **Dari dialog ke aksi** | Rekomendasi produk dirender sebagai tombol interaktif tambah keranjang. |
| ⚙️ **Konfigurasi deklaratif** | Model, API key, dan persona diatur lewat panel admin — tanpa redeploy kode. |
| 🔄 **Konsistensi temporal** | Context window dibangun dari query realtime, jadi tidak ada jeda data. |

---

## ✨ Kapabilitas Sistem

<table>
<tr>
<td width="50%" valign="top">

### 🛍️ Storefront

| Fitur | Status |
|---|:---:|
| Katalog realtime lintas sesi | ✅ |
| Pencarian & filter multi-kriteria | ✅ |
| Keranjang berbasis `sessionStorage` | ✅ |
| Checkout otomatis ke WhatsApp | ✅ |
| Estimasi ongkir per wilayah | ✅ |
| Testimoni produk | ✅ |
| Gamifikasi diskon | ✅ |
| Asisten belanja AI | ✅ |

</td>
<td width="50%" valign="top">

### 🔐 Admin Console

| Fitur | Status |
|---|:---:|
| Autentikasi berlapis | ✅ |
| Dasbor analitik & stok kritis | ✅ |
| Pencatatan transaksi otomatis | ✅ |
| Manajemen pengguna terdaftar | ✅ |
| CRUD produk/kategori/banner/ongkir | ✅ |
| Kurasi testimoni | ✅ |
| Konfigurasi toko & agen AI | ✅ |

</td>
</tr>
</table>

---

## 🧰 Susunan Teknologi

| Lapisan | Teknologi | Rasionalisasi Teknis |
|---|---|---|
| 🎨 **Presentasi** | HTML5 · CSS3 · Vanilla JavaScript (ES Modules) | Ringan, tanpa overhead framework |
| 💾 **Data** | Firebase Firestore | Sinkronisasi push-based (`onSnapshot`) |
| 🔑 **Auth** | Firebase Authentication | Verifikasi peran via security rules |
| 🧠 **AI** | Groq API (`gpt-oss-20b`) | Latensi rendah untuk chat sinkron |
| 🌐 **Hosting** | GitHub Pages | CDN statis global, gratis |
| 🖼️ **Aset** | Base64 + kompresi client-side | Tanpa object storage terpisah |

---

## 🏗️ Rancangan Arsitektur

```mermaid
graph TB
    A[🏠 Storefront] <--sync--> C[(🗄️ Firestore)]
    B[🔐 Admin Console] <--sync--> C
    B <--auth--> D[🔑 Authentication]
    C --dilindungi--> E[🛡️ Security Rules]
    A --context--> F[⚡ Groq AI]
    F --respons--> A

    style A fill:#0D0221,stroke:#00F5FF,color:#fff
    style B fill:#0D0221,stroke:#E63E7F,color:#fff
    style C fill:#FFA000,stroke:#0D0221,color:#000
    style D fill:#FFCA28,stroke:#0D0221,color:#000
    style E fill:#E63E7F,stroke:#0D0221,color:#fff
    style F fill:#F55036,stroke:#0D0221,color:#fff
```

Tidak ada server aplikasi di tengah. Klien publik & admin berbicara **langsung** ke Firebase sebagai *single source of truth* — meminimalkan titik kegagalan sekaligus biaya maintenance.

---

## 📁 Anatomi Proyek

```
📦 Riksan-Dropshiper
├── 🏠 index.html            → Antarmuka publik
├── ⚡ app.js                 → Logika storefront + AI
├── 🔐 admin.html             → Antarmuka admin
├── ⚙️  admin.js               → Logika admin
├── 🎨 admin.css              → Desain admin
├── 🔑 firebase-config.js     → Kredensial Firebase
└── 🛡️  firestore.rules        → Kebijakan akses data
```

---

## 🚀 Provisioning & Deployment

```bash
1. Buat proyek di console.firebase.google.com
2. Aktifkan Firestore + Authentication (Email/Password)
3. Salin kredensial ke firebase-config.js
4. Terapkan firestore.rules lewat Firebase Console
5. Buat akun admin pertama → tambahkan UID ke koleksi "admins"
6. (Opsional) Ambil API key di console.groq.com/keys → isi di panel admin
7. Push ke GitHub → Settings → Pages → aktifkan
```

> 💡 Seed data terisi otomatis saat Firestore masih kosong — tidak perlu entry manual.

---

## 🔒 Model Keamanan

Kebijakan akses mengikuti **prinsip privilese minimum**, didefinisikan lewat Firestore Security Rules — bukan validasi sisi klien yang bisa dimanipulasi.

| Koleksi | Baca | Tulis |
|---|:---:|:---:|
| `products` `banners` `settings` `ongkir` | 🌍 Publik | 🔐 Admin |
| `orders` | 🔐 Admin/pemilik | ✍️ Buat terbuka, ubah admin |
| `customers` | 🔐 Pemilik | 🔐 Pemilik |
| `admins` | 🔐 Diri sendiri | 🚫 Tidak bisa dari klien |

> ⚠️ API key Groq dipanggil dari sisi klien — konsekuensi arsitektur tanpa backend. Mitigasi: audit & rotasi kunci berkala.

---

## 🗺️ Roadmap

- [x] Katalog & transaksi realtime
- [x] Checkout otomatis ke WhatsApp
- [x] Agen AI dengan grounding data
- [x] Gamifikasi diskon
- [ ] Notifikasi push transaksi
- [ ] Payment gateway native
- [ ] Arsitektur multi-tenant

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi **MIT** — bebas digunakan, dimodifikasi, dan didistribusikan dengan atribusi.

---

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=18&duration=2500&pause=900&color=FFD700&center=true&vCenter=true&width=550&lines=%E2%AD%90+Suka+proyek+ini%3F+Kasih+Star!;%F0%9F%94%A5+Built+by+Riksan" />

</div>
