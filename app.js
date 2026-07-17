/* =========================================================
   RIKSAN DROPSHIP — storefront logic
   Data source: localStorage("riksan_products" / "riksan_settings")
   Diisi & dikelola lewat admin.html — file ini hanya membaca
   & menampilkan, plus mengurus keranjang + checkout WhatsApp/Shopee.
   ========================================================= */

const LS_PRODUCTS = "riksan_products";
const LS_SETTINGS = "riksan_settings";
const LS_CART = "riksan_cart";

const DEFAULT_SETTINGS = {
  namaToko: "Riksan Dropship",
  tagline: "Belanja Sat-Set, Chat Admin, Barang Meluncur",
  noWA: "6282113945743",
  alamat: "Gudang Titipan — Kirim dari Supplier Terpercaya",
  topbarText: "📦 Kirim ke seluruh Indonesia — dari supplier langsung ke pembeli",
  linkShopee: "",
};

const DEFAULT_PRODUCTS = [
  { id: "P001", nama: "Kaos Oversize Katun 24s", kategori: "Fashion Pria", harga: 89000, stok: 24,
    gambar: "https://placehold.co/500x500/1B1030/FBF6EC?text=Kaos+Oversize", deskripsi: "Bahan katun combed 24s, adem, jahitan rapi. Cocok buat dropship harian, fast moving item." },
  { id: "P002", nama: "Tas Selempang Mini Kanvas", kategori: "Tas & Aksesoris", harga: 65000, stok: 15,
    gambar: "https://placehold.co/500x500/E63E7F/FBF6EC?text=Tas+Selempang", deskripsi: "Kanvas tebal anti sobek, muat HP + dompet, banyak varian warna." },
  { id: "P003", nama: "Skincare Serum Niacinamide 20ml", kategori: "Kecantikan", harga: 45000, stok: 0,
    gambar: "https://placehold.co/500x500/12897A/FBF6EC?text=Serum+Niacinamide", deskripsi: "Serum wajah untuk mencerahkan & meratakan warna kulit, BPOM." },
  { id: "P004", nama: "Sepatu Sneakers Sport Grip", kategori: "Sepatu", harga: 149000, stok: 8,
    gambar: "https://placehold.co/500x500/1B1030/C6FF3D?text=Sneakers", deskripsi: "Outsole grip anti licin, ringan dipakai seharian, size 39-44." },
  { id: "P005", nama: "Case HP Anti Crack Bening", kategori: "Aksesoris HP", harga: 19000, stok: 50,
    gambar: "https://placehold.co/500x500/B8215C/FBF6EC?text=Case+HP", deskripsi: "Silikon lentur, presisi lubang kamera, tersedia semua tipe HP populer." },
  { id: "P006", nama: "Botol Minum Lipat 500ml", kategori: "Peralatan Harian", harga: 35000, stok: 30,
    gambar: "https://placehold.co/500x500/3A2C52/FBF6EC?text=Botol+Lipat", deskripsi: "Silikon food grade, bisa dilipat kecil, hemat tempat di tas." },
];

function getProducts() {
  const raw = localStorage.getItem(LS_PRODUCTS);
  if (!raw) {
    localStorage.setItem(LS_PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    return [...DEFAULT_PRODUCTS];
  }
  try { return JSON.parse(raw); } catch { return [...DEFAULT_PRODUCTS]; }
}
function getSettings() {
  const raw = localStorage.getItem(LS_SETTINGS);
  if (!raw) {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS };
  }
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }; } catch { return { ...DEFAULT_SETTINGS }; }
}
function getCart() {
  try { return JSON.parse(sessionStorage.getItem(LS_CART)) || []; } catch { return []; }
}
function saveCart(cart) { sessionStorage.setItem(LS_CART, JSON.stringify(cart)); }
function rupiah(n) { return "Rp" + Number(n).toLocaleString("id-ID"); }

let products = [];
let settings = {};
let activeKategori = "Semua";
let searchTerm = "";

document.addEventListener("DOMContentLoaded", () => {
  products = getProducts();
  settings = getSettings();
  applyBranding();
  renderKategoriChips();
  renderGrid();
  renderStats();
  renderCart();
  bindUI();
});

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
    return `
    <div class="card">
      <div class="thumb" data-open="${p.id}">
        <span class="badge-stock ${habis ? "habis" : ""}">${habis ? "Stok Habis" : "Ready Stock"}</span>
        <img src="${p.gambar}" alt="${p.nama}" loading="lazy">
      </div>
      <div class="body">
        <span class="kategori">${p.kategori}</span>
        <h4 data-open="${p.id}">${p.nama}</h4>
        <div class="price">${rupiah(p.harga)}</div>
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

function openModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const overlay = document.getElementById("modalOverlay");
  const habis = Number(p.stok) <= 0;
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="closeModal">&times;</button>
      <div class="m-img"><img src="${p.gambar}" alt="${p.nama}"></div>
      <div class="m-body">
        <span class="kategori">${p.kategori}</span>
        <h3>${p.nama}</h3>
        <div class="price">${rupiah(p.harga)}</div>
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

let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

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
