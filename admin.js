/* =========================================================
   RIKSAN DROPSHIP — admin panel logic
   Login sederhana (client-side) + CRUD produk via localStorage.
   Ganti USERNAME/PASSWORD di bawah untuk mengubah akses admin.
   ========================================================= */

const LS_PRODUCTS = "riksan_products";
const LS_SETTINGS = "riksan_settings";
const LS_AUTH = "riksan_admin_auth";

const ADMIN_USER = "admin";
const ADMIN_PASS = "riksan123"; // ganti password default ini sebelum go-live

const DEFAULT_SETTINGS = {
  namaToko: "Riksan Dropship",
  tagline: "Belanja Sat-Set, Chat Admin, Barang Meluncur",
  noWA: "6282113945743",
  alamat: "Gudang Titipan — Kirim dari Supplier Terpercaya",
};

const DEFAULT_PRODUCTS = [
  { id: "P001", nama: "Kaos Oversize Katun 24s", kategori: "Fashion Pria", harga: 89000, stok: 24,
    gambar: "https://placehold.co/500x500/1B1030/FBF6EC?text=Kaos+Oversize", deskripsi: "Bahan katun combed 24s, adem, jahitan rapi." },
  { id: "P002", nama: "Tas Selempang Mini Kanvas", kategori: "Tas & Aksesoris", harga: 65000, stok: 15,
    gambar: "https://placehold.co/500x500/E63E7F/FBF6EC?text=Tas+Selempang", deskripsi: "Kanvas tebal anti sobek, muat HP + dompet." },
  { id: "P003", nama: "Skincare Serum Niacinamide 20ml", kategori: "Kecantikan", harga: 45000, stok: 0,
    gambar: "https://placehold.co/500x500/12897A/FBF6EC?text=Serum+Niacinamide", deskripsi: "Serum wajah mencerahkan, BPOM." },
  { id: "P004", nama: "Sepatu Sneakers Sport Grip", kategori: "Sepatu", harga: 149000, stok: 8,
    gambar: "https://placehold.co/500x500/1B1030/C6FF3D?text=Sneakers", deskripsi: "Outsole grip anti licin, size 39-44." },
  { id: "P005", nama: "Case HP Anti Crack Bening", kategori: "Aksesoris HP", harga: 19000, stok: 50,
    gambar: "https://placehold.co/500x500/B8215C/FBF6EC?text=Case+HP", deskripsi: "Silikon lentur, presisi lubang kamera." },
  { id: "P006", nama: "Botol Minum Lipat 500ml", kategori: "Peralatan Harian", harga: 35000, stok: 30,
    gambar: "https://placehold.co/500x500/3A2C52/FBF6EC?text=Botol+Lipat", deskripsi: "Silikon food grade, bisa dilipat kecil." },
];

/* ---------- storage helpers ---------- */
function getProducts() {
  const raw = localStorage.getItem(LS_PRODUCTS);
  if (!raw) { localStorage.setItem(LS_PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS)); return [...DEFAULT_PRODUCTS]; }
  try { return JSON.parse(raw); } catch { return [...DEFAULT_PRODUCTS]; }
}
function saveProducts(list) { localStorage.setItem(LS_PRODUCTS, JSON.stringify(list)); }
function getSettings() {
  const raw = localStorage.getItem(LS_SETTINGS);
  if (!raw) { localStorage.setItem(LS_SETTINGS, JSON.stringify(DEFAULT_SETTINGS)); return { ...DEFAULT_SETTINGS }; }
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }; } catch { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(s) { localStorage.setItem(LS_SETTINGS, JSON.stringify(s)); }
function rupiah(n) { return "Rp" + Number(n || 0).toLocaleString("id-ID"); }
function genId() { return "P" + Math.random().toString(36).slice(2, 7).toUpperCase(); }

/* ---------- kompres foto upload jadi base64 ringan ---------- */
function compressImage(file, maxDim = 700, startQuality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) { reject(new Error("File bukan gambar")); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        let quality = startQuality;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        // turunkan kualitas kalau hasilnya masih terlalu besar (target ~300KB)
        while (dataUrl.length > 400000 && quality > 0.35) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- state ---------- */
let products = [];
let settings = {};
let editingId = null;
let tableSearch = "";
let tableKategori = "Semua";

/* ---------- auth ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const shell = document.getElementById("adminShell");
  const loginWrap = document.getElementById("loginWrap");

  if (sessionStorage.getItem(LS_AUTH) === "true") {
    boot();
  }

  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value;
    const err = document.getElementById("loginError");
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      sessionStorage.setItem(LS_AUTH, "true");
      err.classList.remove("show");
      boot();
    } else {
      err.textContent = "Username atau password salah. Coba lagi.";
      err.classList.add("show");
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    sessionStorage.removeItem(LS_AUTH);
    location.reload();
  });

  function boot() {
    loginWrap.style.display = "none";
    shell.style.display = "flex";
    products = getProducts();
    settings = getSettings();
    renderAll();
    bindShellUI();
  }
});

/* ---------- render everything ---------- */
function renderAll() {
  renderStats();
  renderTable();
  renderKategoriFilter();
  fillSettingsForm();
}

function renderStats() {
  document.getElementById("statProduk").textContent = products.length;
  document.getElementById("statStok").textContent = products.reduce((a, p) => a + Number(p.stok || 0), 0);
  document.getElementById("statHabis").textContent = products.filter(p => Number(p.stok) <= 0).length;
  document.getElementById("statKategori").textContent = new Set(products.map(p => p.kategori)).size;
  document.getElementById("waNumberDisplay").textContent = "+" + settings.noWA;
}

function renderKategoriFilter() {
  const sel = document.getElementById("filterKategori");
  if (!sel) return;
  const current = sel.value || "Semua";
  const kategoris = ["Semua", ...new Set(products.map(p => p.kategori))];
  sel.innerHTML = kategoris.map(k => `<option value="${k}">${k}</option>`).join("");
  sel.value = kategoris.includes(current) ? current : "Semua";
}

function filteredList() {
  return products.filter(p => {
    const mk = tableKategori === "Semua" || p.kategori === tableKategori;
    const ms = p.nama.toLowerCase().includes(tableSearch.toLowerCase());
    return mk && ms;
  });
}

function renderTable() {
  const tbody = document.getElementById("productTableBody");
  if (!tbody) return;
  const list = filteredList();
  if (list.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Belum ada produk. Klik "Tambah Produk" untuk mulai mengisi katalog.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(p => {
    const habis = Number(p.stok) <= 0;
    return `
    <tr>
      <td>
        <div class="prod-name-cell">
          <img class="prod-thumb" src="${p.gambar}" alt="${p.nama}">
          <div class="txt"><b>${p.nama}</b><span>${p.id}</span></div>
        </div>
      </td>
      <td>${p.kategori}</td>
      <td>${rupiah(p.harga)}</td>
      <td>${p.stok}</td>
      <td><span class="pill ${habis ? "habis" : "ready"}">${habis ? "Stok Habis" : "Ready"}</span></td>
      <td>
        <div class="row-actions">
          <button class="edit" data-edit="${p.id}">Edit</button>
          <button class="del" data-del="${p.id}">Hapus</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => openProductModal(b.dataset.edit)));
  tbody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => deleteProduct(b.dataset.del)));
}

/* ---------- product modal (add/edit) ---------- */
function openProductModal(id) {
  editingId = id || null;
  const p = id ? products.find(x => x.id === id) : null;
  document.getElementById("modalTitle").textContent = p ? "Edit Produk" : "Tambah Produk";
  document.getElementById("fNama").value = p?.nama || "";
  document.getElementById("fKategori").value = p?.kategori || "";
  document.getElementById("fHarga").value = p?.harga || "";
  document.getElementById("fStok").value = p?.stok ?? "";
  document.getElementById("fDeskripsi").value = p?.deskripsi || "";
  document.getElementById("fGambar").value = p?.gambar || "";
  document.getElementById("fGambarFile").value = "";
  // kalau gambar lama berupa link URL (bukan hasil upload base64), tampilkan di kolom URL
  document.getElementById("fGambarUrl").value = (p?.gambar && p.gambar.startsWith("http")) ? p.gambar : "";
  updateImgPreview();
  document.getElementById("productModal").classList.add("show");
}
function closeProductModal() {
  document.getElementById("productModal").classList.remove("show");
  editingId = null;
}
function updateImgPreview() {
  const url = document.getElementById("fGambar").value.trim();
  const box = document.getElementById("imgPreviewBox");
  box.classList.remove("loading");
  box.innerHTML = url
    ? `<img src="${url}" alt="preview" onerror="this.parentElement.innerHTML='<span>Gagal memuat gambar — cek URL/file</span>'">`
    : `<span>Belum ada foto — upload di atas</span>`;
}
function setPreviewLoading() {
  const box = document.getElementById("imgPreviewBox");
  box.classList.add("loading");
  box.innerHTML = `<span>Mengompres foto...</span>`;
}

function saveProductForm(e) {
  e.preventDefault();
  const nama = document.getElementById("fNama").value.trim();
  const kategori = document.getElementById("fKategori").value.trim();
  const harga = Number(document.getElementById("fHarga").value);
  const stok = Number(document.getElementById("fStok").value);
  const gambar = document.getElementById("fGambar").value.trim() || `https://placehold.co/500x500/1B1030/FBF6EC?text=${encodeURIComponent(nama || "Produk")}`;
  const deskripsi = document.getElementById("fDeskripsi").value.trim();

  if (!nama || !kategori || isNaN(harga) || isNaN(stok)) {
    showToast("Lengkapi semua kolom wajib dulu ya");
    return;
  }

  if (editingId) {
    const idx = products.findIndex(p => p.id === editingId);
    if (idx > -1) products[idx] = { ...products[idx], nama, kategori, harga, stok, gambar, deskripsi };
    showToast("Produk berhasil diperbarui");
  } else {
    products.push({ id: genId(), nama, kategori, harga, stok, gambar, deskripsi });
    showToast("Produk baru ditambahkan");
  }
  saveProducts(products);
  closeProductModal();
  renderAll();
}

function deleteProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Hapus produk "${p.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
  products = products.filter(x => x.id !== id);
  saveProducts(products);
  renderAll();
  showToast("Produk dihapus");
}

/* ---------- settings ---------- */
function fillSettingsForm() {
  const f = document.getElementById("settingsForm");
  if (!f) return;
  document.getElementById("sNamaToko").value = settings.namaToko;
  document.getElementById("sTagline").value = settings.tagline;
  document.getElementById("sNoWA").value = settings.noWA;
  document.getElementById("sAlamat").value = settings.alamat;
}
function saveSettingsForm(e) {
  e.preventDefault();
  settings = {
    namaToko: document.getElementById("sNamaToko").value.trim() || DEFAULT_SETTINGS.namaToko,
    tagline: document.getElementById("sTagline").value.trim(),
    noWA: document.getElementById("sNoWA").value.trim().replace(/[^0-9]/g, ""),
    alamat: document.getElementById("sAlamat").value.trim(),
  };
  saveSettings(settings);
  renderStats();
  showToast("Pengaturan toko disimpan");
}

/* ---------- toast ---------- */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toastAdmin");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- shell UI bindings ---------- */
function bindShellUI() {
  document.getElementById("btnAddProduct")?.addEventListener("click", () => openProductModal(null));
  document.getElementById("closeProductModal")?.addEventListener("click", closeProductModal);
  document.getElementById("productForm")?.addEventListener("submit", saveProductForm);
  document.getElementById("fGambarFile")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById("fGambarUrl").value = ""; // upload menang atas URL
    setPreviewLoading();
    try {
      const dataUrl = await compressImage(file);
      document.getElementById("fGambar").value = dataUrl;
      updateImgPreview();
      const kb = Math.round((dataUrl.length * 0.75) / 1024);
      document.getElementById("uploadHint").textContent = `Foto siap dipakai (~${kb} KB setelah dikompres).`;
    } catch (err) {
      showToast(err.message || "Gagal memproses foto");
      updateImgPreview();
    }
  });
  document.getElementById("fGambarUrl")?.addEventListener("input", (e) => {
    document.getElementById("fGambarFile").value = ""; // URL menang atas upload
    document.getElementById("fGambar").value = e.target.value.trim();
    updateImgPreview();
  });
  document.getElementById("settingsForm")?.addEventListener("submit", saveSettingsForm);

  document.getElementById("tableSearch")?.addEventListener("input", (e) => {
    tableSearch = e.target.value;
    renderTable();
  });
  document.getElementById("filterKategori")?.addEventListener("change", (e) => {
    tableKategori = e.target.value;
    renderTable();
  });

  document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".view-panel").forEach(v => v.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.view).classList.add("active");
      document.getElementById("sidebar").classList.remove("open");
    });
  });
}
