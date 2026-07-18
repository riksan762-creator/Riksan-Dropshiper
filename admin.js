/* =========================================================
   RIKSAN DROPSHIP — admin panel logic (Firestore + Auth version)
   Login pakai Firebase Authentication (akun dibuat di Firebase
   Console > Authentication > Users). Produk & pengaturan toko
   disimpan di Firestore — otomatis tersinkron ke semua pengunjung.
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_SETTINGS = {
  namaToko: "Riksan Dropship",
  tagline: "Belanja Sat-Set, Chat Admin, Barang Meluncur",
  noWA: "6282113945743",
  alamat: "Gudang Titipan — Kirim dari Supplier Terpercaya",
  topbarText: "📦 Kirim ke seluruh Indonesia — dari supplier langsung ke pembeli",
  linkShopee: "",
  bannerAktif: false,
  kategoriList: ["Fashion Pria", "Tas & Aksesoris", "Kecantikan", "Sepatu", "Aksesoris HP", "Peralatan Harian"],
};

// Dipakai HANYA sekali untuk mengisi data awal (seed) saat Firestore masih kosong.
const SEED_PRODUCTS = [
  { id: "P001", nama: "Kaos Oversize Katun 24s", kategori: "Fashion Pria", harga: 89000, hargaCoret: 120000, stok: 24, rating: 4.8, terjual: 156,
    gambar: "https://placehold.co/500x500/1B1030/FBF6EC?text=Kaos+Oversize", deskripsi: "Bahan katun combed 24s, adem, jahitan rapi." },
  { id: "P002", nama: "Tas Selempang Mini Kanvas", kategori: "Tas & Aksesoris", harga: 65000, hargaCoret: null, stok: 15, rating: 4.6, terjual: 89,
    gambar: "https://placehold.co/500x500/E63E7F/FBF6EC?text=Tas+Selempang", deskripsi: "Kanvas tebal anti sobek, muat HP + dompet." },
  { id: "P003", nama: "Skincare Serum Niacinamide 20ml", kategori: "Kecantikan", harga: 45000, hargaCoret: null, stok: 0, rating: 4.9, terjual: 312,
    gambar: "https://placehold.co/500x500/12897A/FBF6EC?text=Serum+Niacinamide", deskripsi: "Serum wajah mencerahkan, BPOM." },
  { id: "P004", nama: "Sepatu Sneakers Sport Grip", kategori: "Sepatu", harga: 149000, hargaCoret: 199000, stok: 8, rating: 4.7, terjual: 64,
    gambar: "https://placehold.co/500x500/1B1030/C6FF3D?text=Sneakers", deskripsi: "Outsole grip anti licin, size 39-44." },
  { id: "P005", nama: "Case HP Anti Crack Bening", kategori: "Aksesoris HP", harga: 19000, hargaCoret: null, stok: 50, rating: 4.5, terjual: 421,
    gambar: "https://placehold.co/500x500/B8215C/FBF6EC?text=Case+HP", deskripsi: "Silikon lentur, presisi lubang kamera." },
  { id: "P006", nama: "Botol Minum Lipat 500ml", kategori: "Peralatan Harian", harga: 35000, hargaCoret: null, stok: 30, rating: 4.4, terjual: 47,
    gambar: "https://placehold.co/500x500/3A2C52/FBF6EC?text=Botol+Lipat", deskripsi: "Silikon food grade, bisa dilipat kecil." },
];

function rupiah(n) { return "Rp" + Number(n || 0).toLocaleString("id-ID"); }
function genId(prefix = "P") { return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }

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
let banners = [];
let settings = { ...DEFAULT_SETTINGS };
let editingId = null;
let editingBannerId = null;
let tableSearch = "";
let tableKategori = "Semua";
let unsubProducts = null;
let unsubBanners = null;
let boundOnce = false;

/* ---------- auth ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const shell = document.getElementById("adminShell");
  const loginWrap = document.getElementById("loginWrap");
  const loginBtn = loginForm?.querySelector("button[type=submit]");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginWrap.style.display = "none";
      shell.style.display = "flex";
      boot();
    } else {
      loginWrap.style.display = "flex";
      shell.style.display = "none";
      if (unsubProducts) { unsubProducts(); unsubProducts = null; }
      if (unsubBanners) { unsubBanners(); unsubBanners = null; }
    }
  });

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;
    const err = document.getElementById("loginError");
    if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = "Memproses..."; }
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      err.classList.remove("show");
    } catch (e2) {
      err.textContent = "Email atau password salah. Pastikan akun sudah dibuat di Firebase Console.";
      err.classList.add("show");
    } finally {
      if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = "Masuk ke Dashboard"; }
    }
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => signOut(auth));

  async function boot() {
    await seedIfEmpty();
    listenProducts();
    listenBanners();
    await loadSettings();
    if (!boundOnce) { bindShellUI(); boundOnce = true; }
  }
});

/* ---------- seed data awal (hanya jalan sekali saat koleksi masih kosong) ---------- */
async function seedIfEmpty() {
  try {
    const snap = await getDocs(collection(db, "products"));
    if (!snap.empty) return;
    const batch = writeBatch(db);
    SEED_PRODUCTS.forEach(p => {
      const { id, ...data } = p;
      batch.set(doc(db, "products", id), data);
    });
    batch.set(doc(db, "settings", "store"), DEFAULT_SETTINGS);
    await batch.commit();
  } catch (err) {
    console.error("Gagal seed data awal:", err);
  }
}

/* ---------- realtime products ---------- */
function listenProducts() {
  if (unsubProducts) unsubProducts();
  unsubProducts = onSnapshot(
    collection(db, "products"),
    (snap) => {
      products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderStats();
      renderTable();
      renderKategoriFilter();
    },
    (err) => {
      console.error(err);
      showToast("Gagal memuat produk — cek koneksi internet");
    }
  );
}

/* ---------- realtime banners ---------- */
function listenBanners() {
  if (unsubBanners) unsubBanners();
  unsubBanners = onSnapshot(
    collection(db, "banners"),
    (snap) => {
      banners = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
      renderBannerTable();
    },
    (err) => {
      console.error(err);
      showToast("Gagal memuat banner — cek koneksi internet");
    }
  );
}

async function loadSettings() {
  try {
    const snap = await getDoc(doc(db, "settings", "store"));
    settings = snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : { ...DEFAULT_SETTINGS };
  } catch (err) {
    console.error(err);
  }
  fillSettingsForm();
  renderStats();
}

/* ---------- render ---------- */
function renderStats() {
  document.getElementById("statProduk").textContent = products.length;
  document.getElementById("statStok").textContent = products.reduce((a, p) => a + Number(p.stok || 0), 0);
  document.getElementById("statHabis").textContent = products.filter(p => Number(p.stok) <= 0).length;
  document.getElementById("statKategori").textContent = new Set(products.map(p => p.kategori)).size;
  document.getElementById("waNumberDisplay").textContent = "+" + (settings.noWA || "-");
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
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Belum ada produk. Klik "Tambah Produk" untuk mulai mengisi katalog.</td></tr>`;
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
      <td>${p.hargaCoret ? `<span style="text-decoration:line-through;color:var(--ink-soft);font-size:11px;display:block;">${rupiah(p.hargaCoret)}</span>${rupiah(p.harga)}` : rupiah(p.harga)}</td>
      <td>${p.stok}</td>
      <td>${p.rating ? `⭐ ${Number(p.rating).toFixed(1)}` : "-"}<br><span style="font-size:11px;color:var(--ink-soft);">Terjual ${p.terjual || 0}</span></td>
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
  populateKategoriSelect(p?.kategori || "");
  document.getElementById("fHarga").value = p?.harga || "";
  document.getElementById("fHargaCoret").value = p?.hargaCoret || "";
  document.getElementById("fStok").value = p?.stok ?? "";
  document.getElementById("fRating").value = p?.rating ?? "";
  document.getElementById("fTerjual").value = p?.terjual ?? 0;
  document.getElementById("fDeskripsi").value = p?.deskripsi || "";
  document.getElementById("fGambar").value = p?.gambar || "";
  document.getElementById("fGambarFile").value = "";
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

async function saveProductForm(e) {
  e.preventDefault();
  const nama = document.getElementById("fNama").value.trim();
  const kategori = document.getElementById("fKategori").value.trim();
  const harga = Number(document.getElementById("fHarga").value);
  const hargaCoretRaw = document.getElementById("fHargaCoret").value.trim();
  const hargaCoret = hargaCoretRaw ? Number(hargaCoretRaw) : null;
  const stok = Number(document.getElementById("fStok").value);
  const ratingRaw = document.getElementById("fRating").value.trim();
  const rating = ratingRaw ? Number(ratingRaw) : null;
  const terjual = Number(document.getElementById("fTerjual").value || 0);
  const gambar = document.getElementById("fGambar").value.trim() || `https://placehold.co/500x500/1B1030/FBF6EC?text=${encodeURIComponent(nama || "Produk")}`;
  const deskripsi = document.getElementById("fDeskripsi").value.trim();

  if (!nama || !kategori || isNaN(harga) || isNaN(stok)) {
    showToast("Lengkapi semua kolom wajib dulu ya");
    return;
  }
  if (hargaCoret !== null && (isNaN(hargaCoret) || hargaCoret <= harga)) {
    showToast("Harga coret harus lebih besar dari harga jual");
    return;
  }
  if (rating !== null && (isNaN(rating) || rating < 0 || rating > 5)) {
    showToast("Rating harus di antara 0 sampai 5");
    return;
  }
  if (isNaN(terjual) || terjual < 0) {
    showToast("Jumlah terjual tidak valid");
    return;
  }

  const saveBtn = document.querySelector("#productForm .save");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Menyimpan..."; }

  const data = { nama, kategori, harga, hargaCoret, stok, rating, terjual, gambar, deskripsi };
  const id = editingId || genId();

  try {
    await setDoc(doc(db, "products", id), data);
    showToast(editingId ? "Produk berhasil diperbarui" : "Produk baru ditambahkan");
    closeProductModal();
  } catch (err) {
    console.error(err);
    showToast("Gagal menyimpan — cek koneksi internet");
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Simpan Produk"; }
  }
}

async function deleteProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Hapus produk "${p.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
  try {
    await deleteDoc(doc(db, "products", id));
    showToast("Produk dihapus");
  } catch (err) {
    console.error(err);
    showToast("Gagal menghapus — cek koneksi internet");
  }
}

/* ---------- settings ---------- */
function fillSettingsForm() {
  const f = document.getElementById("settingsForm");
  if (!f) return;
  document.getElementById("sNamaToko").value = settings.namaToko;
  document.getElementById("sTagline").value = settings.tagline;
  document.getElementById("sTopbar").value = settings.topbarText || "";
  document.getElementById("sNoWA").value = settings.noWA;
  document.getElementById("sAlamat").value = settings.alamat;
  document.getElementById("sLinkShopee").value = settings.linkShopee || "";
  document.getElementById("sBannerAktif").checked = !!settings.bannerAktif;
  renderKategoriChips();
}

async function saveSettingsForm(e) {
  e.preventDefault();
  settings = {
    ...settings,
    namaToko: document.getElementById("sNamaToko").value.trim() || DEFAULT_SETTINGS.namaToko,
    tagline: document.getElementById("sTagline").value.trim(),
    topbarText: document.getElementById("sTopbar").value.trim() || DEFAULT_SETTINGS.topbarText,
    noWA: document.getElementById("sNoWA").value.trim().replace(/[^0-9]/g, ""),
    alamat: document.getElementById("sAlamat").value.trim(),
    linkShopee: document.getElementById("sLinkShopee").value.trim(),
    bannerAktif: document.getElementById("sBannerAktif").checked,
  };
  if (settings.bannerAktif && banners.length === 0) {
    showToast("Aktif tapi belum ada banner — tambah dulu di menu Kelola Banner");
  }
  const btn = document.querySelector("#settingsForm button[type=submit]");
  if (btn) { btn.disabled = true; btn.textContent = "Menyimpan..."; }
  try {
    await setDoc(doc(db, "settings", "store"), settings, { merge: true });
    renderStats();
    showToast("Pengaturan toko disimpan");
  } catch (err) {
    console.error(err);
    showToast("Gagal menyimpan — cek koneksi internet");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Simpan Pengaturan"; }
  }
}

/* ---------- kelola kategori produk (terkelola, dropdown) ---------- */
function renderKategoriChips() {
  const wrap = document.getElementById("kategoriChipsList");
  if (!wrap) return;
  const list = settings.kategoriList || [];
  wrap.innerHTML = list.length
    ? list.map(k => `<span class="kategori-chip">${k}<button type="button" data-del-kategori="${k}">&times;</button></span>`).join("")
    : `<span style="font-size:12px;color:var(--ink-soft,#3A2C52);">Belum ada kategori. Tambah dulu di atas.</span>`;
  wrap.querySelectorAll("[data-del-kategori]").forEach(b => b.addEventListener("click", () => removeKategori(b.dataset.delKategori)));
  populateKategoriSelect();
}

function populateKategoriSelect(selected) {
  const sel = document.getElementById("fKategori");
  if (!sel) return;
  const list = [...(settings.kategoriList || [])];
  const current = selected !== undefined ? selected : sel.value;
  if (current && !list.includes(current)) list.push(current);
  sel.innerHTML = list.length
    ? list.map(k => `<option value="${k}">${k}</option>`).join("")
    : `<option value="">Belum ada kategori — tambah di Pengaturan Toko</option>`;
  if (current) sel.value = current;
}

async function addKategori() {
  const input = document.getElementById("newKategoriInput");
  const val = input.value.trim();
  if (!val) return;
  const list = settings.kategoriList || [];
  if (list.some(k => k.toLowerCase() === val.toLowerCase())) {
    showToast("Kategori itu sudah ada");
    return;
  }
  settings.kategoriList = [...list, val];
  input.value = "";
  renderKategoriChips();
  try {
    await setDoc(doc(db, "settings", "store"), { kategoriList: settings.kategoriList }, { merge: true });
    showToast("Kategori ditambahkan");
  } catch (err) {
    console.error(err);
    showToast("Gagal menyimpan kategori — cek koneksi internet");
  }
}

async function removeKategori(nama) {
  if (!confirm(`Hapus kategori "${nama}"? Produk yang sudah pakai kategori ini tidak berubah otomatis.`)) return;
  settings.kategoriList = (settings.kategoriList || []).filter(k => k !== nama);
  renderKategoriChips();
  try {
    await setDoc(doc(db, "settings", "store"), { kategoriList: settings.kategoriList }, { merge: true });
    showToast("Kategori dihapus");
  } catch (err) {
    console.error(err);
    showToast("Gagal menghapus kategori — cek koneksi internet");
  }
}

/* ---------- kelola banner (slider) ---------- */
function renderBannerTable() {
  const tbody = document.getElementById("bannerTableBody");
  if (!tbody) return;
  if (banners.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Belum ada banner. Klik "+ Tambah Banner" untuk mulai.</td></tr>`;
    return;
  }
  tbody.innerHTML = banners.map(b => `
    <tr>
      <td><img class="banner-thumb" src="${b.gambar}" alt="banner"></td>
      <td>${b.teks || "<span style='color:var(--ink-soft,#3A2C52);'>(tanpa teks)</span>"}</td>
      <td>${b.urutan ?? 0}</td>
      <td>
        <div class="row-actions">
          <button class="edit" data-edit-banner="${b.id}">Edit</button>
          <button class="del" data-del-banner="${b.id}">Hapus</button>
        </div>
      </td>
    </tr>
  `).join("");
  tbody.querySelectorAll("[data-edit-banner]").forEach(bt => bt.addEventListener("click", () => openBannerModal(bt.dataset.editBanner)));
  tbody.querySelectorAll("[data-del-banner]").forEach(bt => bt.addEventListener("click", () => deleteBanner(bt.dataset.delBanner)));
}

function openBannerModal(id) {
  editingBannerId = id || null;
  const b = id ? banners.find(x => x.id === id) : null;
  document.getElementById("bannerModalTitle").textContent = b ? "Edit Banner" : "Tambah Banner";
  document.getElementById("bGambar").value = b?.gambar || "";
  document.getElementById("bGambarFile").value = "";
  document.getElementById("bTeks").value = b?.teks || "";
  document.getElementById("bUrutan").value = b?.urutan ?? banners.length;
  updateBannerFormPreview();
  document.getElementById("bannerModal").classList.add("show");
}
function closeBannerModal() {
  document.getElementById("bannerModal").classList.remove("show");
  editingBannerId = null;
}
function updateBannerFormPreview() {
  const url = document.getElementById("bGambar").value.trim();
  const box = document.getElementById("bannerFormPreviewBox");
  if (!box) return;
  box.classList.remove("loading");
  box.innerHTML = url
    ? `<img src="${url}" alt="preview banner" onerror="this.parentElement.innerHTML='<span>Gagal memuat gambar</span>'">`
    : `<span>Belum ada foto</span>`;
}
function setBannerFormPreviewLoading() {
  const box = document.getElementById("bannerFormPreviewBox");
  if (!box) return;
  box.classList.add("loading");
  box.innerHTML = `<span>Mengompres foto...</span>`;
}

async function saveBannerForm(e) {
  e.preventDefault();
  const gambar = document.getElementById("bGambar").value.trim();
  const teks = document.getElementById("bTeks").value.trim();
  const urutan = Number(document.getElementById("bUrutan").value || 0);

  if (!gambar) {
    showToast("Upload foto banner dulu ya");
    return;
  }
  if (isNaN(urutan) || urutan < 0) {
    showToast("Urutan tampil tidak valid");
    return;
  }

  const saveBtn = document.querySelector("#bannerForm .save");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Menyimpan..."; }

  const data = { gambar, teks, urutan };
  const id = editingBannerId || genId("B");

  try {
    await setDoc(doc(db, "banners", id), data);
    showToast(editingBannerId ? "Banner berhasil diperbarui" : "Banner baru ditambahkan");
    closeBannerModal();
  } catch (err) {
    console.error(err);
    showToast("Gagal menyimpan banner — cek koneksi internet");
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Simpan Banner"; }
  }
}

async function deleteBanner(id) {
  const b = banners.find(x => x.id === id);
  if (!b) return;
  if (!confirm("Hapus banner ini? Tindakan ini tidak bisa dibatalkan.")) return;
  try {
    await deleteDoc(doc(db, "banners", id));
    showToast("Banner dihapus");
  } catch (err) {
    console.error(err);
    showToast("Gagal menghapus banner — cek koneksi internet");
  }
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
    document.getElementById("fGambarUrl").value = "";
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
    document.getElementById("fGambarFile").value = "";
    document.getElementById("fGambar").value = e.target.value.trim();
    updateImgPreview();
  });
  document.getElementById("settingsForm")?.addEventListener("submit", saveSettingsForm);

  // kelola kategori
  document.getElementById("btnAddKategori")?.addEventListener("click", addKategori);
  document.getElementById("newKategoriInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addKategori(); }
  });

  // kelola banner (slider)
  document.getElementById("btnAddBanner")?.addEventListener("click", () => openBannerModal(null));
  document.getElementById("closeBannerModal")?.addEventListener("click", closeBannerModal);
  document.getElementById("cancelBannerForm")?.addEventListener("click", closeBannerModal);
  document.getElementById("bannerForm")?.addEventListener("submit", saveBannerForm);
  document.getElementById("bGambarFile")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFormPreviewLoading();
    try {
      const dataUrl = await compressImage(file, 1000, 0.75);
      document.getElementById("bGambar").value = dataUrl;
      updateBannerFormPreview();
      const kb = Math.round((dataUrl.length * 0.75) / 1024);
      document.getElementById("bannerFormUploadHint").textContent = `Foto siap dipakai (~${kb} KB setelah dikompres).`;
    } catch (err) {
      showToast(err.message || "Gagal memproses foto banner");
      updateBannerFormPreview();
    }
  });

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

  document.getElementById("cancelProductForm")?.addEventListener("click", () => {
    document.getElementById("productModal").classList.remove("show");
  });
}
