/* =========================================================
   RIKSAN DROPSHIP — storefront logic (Firestore version)
   Data produk & pengaturan toko disimpan di Firestore, jadi
   semua pengunjung (di HP manapun) lihat data yang sama &
   ter-update otomatis (real-time) tanpa perlu refresh.
   Keranjang belanja tetap per-pengunjung (sessionStorage).
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const LS_CART = "riksan_cart";

const DEFAULT_SETTINGS = {
  namaToko: "Riksan Dropship",
  tagline: "Belanja Sat-Set, Chat Admin, Barang Meluncur",
  noWA: "6282113945743",
  alamat: "Gudang Titipan — Kirim dari Supplier Terpercaya",
  topbarText: "📦 Kirim ke seluruh Indonesia — dari supplier langsung ke pembeli",
  linkShopee: "",
};

function getCart() {
  try { return JSON.parse(sessionStorage.getItem(LS_CART)) || []; } catch { return []; }
}
function saveCart(cart) { sessionStorage.setItem(LS_CART, JSON.stringify(cart)); }
function rupiah(n) { return "Rp" + Number(n).toLocaleString("id-ID"); }

let products = [];
let settings = { ...DEFAULT_SETTINGS };
let activeKategori = "Semua";
let searchTerm = "";

document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  renderCart();
  listenProducts();
  listenSettings();
});

/* ---------- realtime listeners ---------- */
function listenProducts() {
  onSnapshot(
    collection(db, "products"),
    (snap) => {
      products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderKategoriChips();
      renderGrid();
      renderStats();
      renderCart(); // in case a cart item's stock/price changed
    },
    (err) => {
      console.error(err);
      showToast("Gagal memuat produk — cek koneksi internet");
    }
  );
}

function listenSettings() {
  onSnapshot(
    doc(db, "settings", "store"),
    (snap) => {
      settings = snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : { ...DEFAULT_SETTINGS };
      applyBranding();
    },
    (err) => console.error(err)
  );
}

function applyBranding() {
  document.querySelectorAll("[data-toko-nama]").forEach(el => el.textContent = settings.namaToko);
  document.querySelectorAll("[data-toko-tagline]").forEach(el => el.textContent = settings.tagline);
  document.querySelectorAll("[data-toko-alamat]").forEach(el => el.textContent = settings.alamat);
  document.querySelectorAll("[data-toko-topbar]").forEach(el => el.textContent = settings.topbarText || DEFAULT_SETTINGS.topbarText);
  document.title = settings.namaToko + " — Dropship Kilat, Order via WhatsApp";
  const waFloat = document.getElementById("waFloatLink");
  if (waFloat) waFloat.href = `https://wa.me/${settings.noWA}?text=${encodeURIComponent("Halo " + settings.namaToko + ", saya mau tanya-tanya produk 🙏")}`;

  const hasShopee = !!(settings.linkShopee && settings.linkShopee.trim());
  const heroShopeeBtn = document.getElementById("btnShopeeHero");
  if (heroShopeeBtn) {
    heroShopeeBtn.style.display = hasShopee ? "inline-flex" : "none";
    heroShopeeBtn.href = settings.linkShopee || "#";
  }
  const shopeeCheckoutBtn = document.getElementById("shopeeCheckoutBtn");
  const shopeeDivider = document.getElementById("shopeeDivider");
  if (shopeeCheckoutBtn) shopeeCheckoutBtn.style.display = hasShopee ? "flex" : "none";
  if (shopeeDivider) shopeeDivider.style.display = hasShopee ? "flex" : "none";
}

function renderKategoriChips() {
  const wrap = document.getElementById("chips");
  if (!wrap) return;
  const kategoris = ["Semua", ...new Set(products.map(p => p.kategori))];
  wrap.innerHTML = kategoris.map(k =>
    `<button class="chip ${k === activeKategori ? "active" : ""}" data-k="${k}">${k}</button>`
  ).join("");
  wrap.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      activeKategori = btn.dataset.k;
      renderKategoriChips();
      renderGrid();
    });
  });
}

function renderStats() {
  const totalProduk = document.getElementById("statTotalProduk");
  const totalKategori = document.getElementById("statTotalKategori");
  const totalStok = document.getElementById("statTotalStok");
  if (totalProduk) totalProduk.textContent = products.length;
  if (totalKategori) totalKategori.textContent = new Set(products.map(p => p.kategori)).size;
  if (totalStok) totalStok.textContent = products.reduce((a, p) => a + Number(p.stok || 0), 0);
}

function filteredProducts() {
  return products.filter(p => {
    const matchKategori = activeKategori === "Semua" || p.kategori === activeKategori;
    const matchSearch = p.nama.toLowerCase().includes(searchTerm.toLowerCase());
    return matchKategori && matchSearch;
  });
}

function renderGrid() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  const list = filteredProducts();
  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state">Belum ada produk cocok — coba kata kunci atau kategori lain.</div>`;
    return;
  }
  grid.innerHTML = list.map(p => {
    const habis = Number(p.stok) <= 0;
    const diskon = p.hargaCoret && p.hargaCoret > p.harga ? Math.round((1 - p.harga / p.hargaCoret) * 100) : 0;
    return `
    <div class="card">
      <div class="thumb" data-open="${p.id}">
        <span class="badge-stock ${habis ? "habis" : ""}">${habis ? "Stok Habis" : "Ready Stock"}</span>
        ${diskon > 0 ? `<span class="badge-diskon">-${diskon}%</span>` : ""}
        <img src="${p.gambar}" alt="${p.nama}" loading="lazy">
      </div>
      <div class="body">
        <span class="kategori">${p.kategori}</span>
        <h4 data-open="${p.id}">${p.nama}</h4>
        <div class="price-wrap">
          <span class="price">${rupiah(p.harga)}</span>
          ${diskon > 0 ? `<span class="price-original">${rupiah(p.hargaCoret)}</span>` : ""}
        </div>
        <div class="actions">
          <button class="detail" data-open="${p.id}">Detail</button>
          <button class="add" data-add="${p.id}" ${habis ? "disabled" : ""}>${habis ? "Habis" : "+ Keranjang"}</button>
        </div>
      </div>
    </div>`;
  }).join("");

  grid.querySelectorAll("[data-open]").forEach(el => el.addEventListener("click", () => openModal(el.dataset.open)));
  grid.querySelectorAll("[data-add]").forEach(el => el.addEventListener("click", (e) => { e.stopPropagation(); addToCart(el.dataset.add); }));
}

/* ---------- modal detail ---------- */
function openModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const overlay = document.getElementById("modalOverlay");
  const habis = Number(p.stok) <= 0;
  const diskon = p.hargaCoret && p.hargaCoret > p.harga ? Math.round((1 - p.harga / p.hargaCoret) * 100) : 0;
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="closeModal">&times;</button>
      <div class="m-img"><img src="${p.gambar}" alt="${p.nama}"></div>
      <div class="m-body">
        <span class="kategori">${p.kategori}</span>
        <h3>${p.nama}</h3>
        <div class="price-wrap">
          <span class="price">${rupiah(p.harga)}</span>
          ${diskon > 0 ? `<span class="price-original">${rupiah(p.hargaCoret)}</span><span class="badge-diskon-inline">Hemat ${diskon}%</span>` : ""}
        </div>
        <p class="desc">${p.deskripsi || "Tidak ada deskripsi tambahan."}</p>
        <p style="font-family:var(--font-mono);font-size:12px;color:var(--ink-soft);">Stok: ${p.stok}</p>
        <button class="btn btn-primary" id="modalAdd" ${habis ? "disabled" : ""} style="width:100%;justify-content:center;">${habis ? "Stok Habis" : "Tambah ke Keranjang"}</button>
      </div>
    </div>`;
  overlay.classList.add("show");
  document.getElementById("closeModal").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  const addBtn = document.getElementById("modalAdd");
  if (addBtn) addBtn.addEventListener("click", () => { addToCart(id); closeModal(); });
}
function closeModal() { document.getElementById("modalOverlay").classList.remove("show"); }

/* ---------- cart (tetap per-pengunjung, sessionStorage) ---------- */
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p || Number(p.stok) <= 0) return;
  const cart = getCart();
  const existing = cart.find(c => c.id === id);
  if (existing) {
    if (existing.qty < p.stok) existing.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart(cart);
  renderCart();
  showToast(`${p.nama} ditambahkan ke keranjang`);
  openCart();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(c => c.id === id);
  const p = products.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    saveCart(cart.filter(c => c.id !== id));
  } else {
    if (p && item.qty > p.stok) item.qty = p.stok;
    saveCart(cart);
  }
  renderCart();
}

function removeFromCart(id) {
  saveCart(getCart().filter(c => c.id !== id));
  renderCart();
}

function renderCart() {
  const cart = getCart();
  const wrap = document.getElementById("cartItems");
  const countEl = document.getElementById("cartCount");
  const totalEl = document.getElementById("cartTotal");
  const totalQty = cart.reduce((a, c) => a + c.qty, 0);
  if (countEl) countEl.textContent = totalQty;

  if (!wrap) return;
  if (cart.length === 0) {
    wrap.innerHTML = `<div class="empty-state" style="border:none;">Keranjang masih kosong. Yuk pilih produk dulu 🛍️</div>`;
    if (totalEl) totalEl.textContent = rupiah(0);
    return;
  }
  let total = 0;
  wrap.innerHTML = cart.map(c => {
    const p = products.find(x => x.id === c.id);
    if (!p) return "";
    const subtotal = p.harga * c.qty;
    total += subtotal;
    return `
    <div class="cart-row">
      <img src="${p.gambar}" alt="${p.nama}">
      <div class="info">
        <h5>${p.nama}</h5>
        <div class="price">${rupiah(p.harga)}</div>
        <div class="qty">
          <button data-dec="${p.id}">-</button>
          <span>${c.qty}</span>
          <button data-inc="${p.id}">+</button>
          <button class="remove-btn" data-rem="${p.id}">Hapus</button>
        </div>
      </div>
    </div>`;
  }).join("");
  if (totalEl) totalEl.textContent = rupiah(total);

  wrap.querySelectorAll("[data-inc]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
  wrap.querySelectorAll("[data-dec]").forEach(b => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
  wrap.querySelectorAll("[data-rem]").forEach(b => b.addEventListener("click", () => removeFromCart(b.dataset.rem)));
}

function openCart() {
  document.getElementById("cartDrawer").classList.add("show");
  document.getElementById("overlayBg").classList.add("show");
}
function closeCart() {
  document.getElementById("cartDrawer").classList.remove("show");
  document.getElementById("overlayBg").classList.remove("show");
}

/* ---------- checkout ---------- */
function checkoutWA() {
  const cart = getCart();
  if (cart.length === 0) { showToast("Keranjang masih kosong"); return; }
  let total = 0;
  let lines = cart.map((c, i) => {
    const p = products.find(x => x.id === c.id);
    if (!p) return "";
    const subtotal = p.harga * c.qty;
    total += subtotal;
    return `${i + 1}. ${p.nama} x${c.qty} = ${rupiah(subtotal)}`;
  }).join("\n");

  const pesan =
`Halo ${settings.namaToko}, saya mau pesan:

${lines}

Total: ${rupiah(total)}

Mohon info ongkir & cara pembayarannya ya. Terima kasih 🙏`;

  const url = `https://wa.me/${settings.noWA}?text=${encodeURIComponent(pesan)}`;
  window.open(url, "_blank");
}

function checkoutShopee() {
  if (!settings.linkShopee) { showToast("Link Shopee belum diatur admin"); return; }
  showToast("Membuka Shopee — cari produk yang sama di sana ya");
  window.open(settings.linkShopee, "_blank");
}

/* ---------- toast ---------- */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- bind global UI ---------- */
function bindUI() {
  document.getElementById("openCartBtn")?.addEventListener("click", openCart);
  document.getElementById("closeCartBtn")?.addEventListener("click", closeCart);
  document.getElementById("overlayBg")?.addEventListener("click", closeCart);
  document.getElementById("waCheckoutBtn")?.addEventListener("click", checkoutWA);
  document.getElementById("shopeeCheckoutBtn")?.addEventListener("click", checkoutShopee);

  const searchInput = document.getElementById("searchInput");
  searchInput?.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderGrid();
  });
  document.getElementById("searchBtn")?.addEventListener("click", () => searchInput?.focus());
}
