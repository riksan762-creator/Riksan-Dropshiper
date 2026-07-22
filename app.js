/* =========================================================
   RIKSAN DROPSHIP — storefront logic (Firestore version)
   Data produk & pengaturan toko disimpan di Firestore, jadi
   semua pengunjung (di HP manapun) lihat data yang sama &
   ter-update otomatis (real-time) tanpa perlu refresh.
   Keranjang belanja tetap per-pengunjung (sessionStorage).
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, doc, onSnapshot, addDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const LS_CART = "riksan_cart";
const LS_BUYER = "riksan_buyer_info";
const SPIN_KEY = "riksan_spin_result";

/* Hadiah roda putar — weight menentukan peluang (semakin besar makin sering keluar) */
const PRIZES = [
  { label: "5%", full: "Diskon 5%", type: "diskon", value: 5,  color: "var(--magenta)",     weight: 25 },
  { label: "10%", full: "Diskon 10%", type: "diskon", value: 10, color: "var(--gold)",        weight: 18 },
  { label: "🚚 Free", full: "Ongkir Gratis*", type: "ongkir", value: 0, color: "var(--ink)",  weight: 15 },
  { label: "3%", full: "Diskon 3%", type: "diskon", value: 3,  color: "var(--teal)",        weight: 20 },
  { label: "15%", full: "Diskon 15%", type: "diskon", value: 15, color: "var(--magenta-deep)", weight: 10 },
  { label: "😅 Lagi", full: "Belum beruntung", type: "none", value: 0, color: "var(--lime)", weight: 5 },
  { label: "20%", full: "Diskon 20%", type: "diskon", value: 20, color: "var(--ink-soft)",   weight: 4 },
  { label: "8%", full: "Diskon 8%", type: "diskon", value: 8,  color: "var(--gold-soft)",   weight: 15 },
];

const DEFAULT_SETTINGS = {
  namaToko: "Riksan Dropship",
  tagline: "Belanja Sat-Set, Chat Admin, Barang Meluncur",
  noWA: "6282113945743",
  alamat: "Gudang Titipan — Kirim dari Supplier Terpercaya",
  topbarText: "📦 Kirim ke seluruh Indonesia — dari supplier langsung ke pembeli",
  linkShopee: "",
  bannerAktif: false,
  aiAktif: false,
  groqApiKey: "",
  aiModel: "openai/gpt-oss-20b",
  aiPersona: "",
};

function getCart() {
  try { return JSON.parse(sessionStorage.getItem(LS_CART)) || []; } catch { return []; }
}
function saveCart(cart) { sessionStorage.setItem(LS_CART, JSON.stringify(cart)); }
function rupiah(n) { return "Rp" + Number(n).toLocaleString("id-ID"); }

function getBuyerInfo() {
  try { return JSON.parse(localStorage.getItem(LS_BUYER)) || {}; } catch { return {}; }
}
function saveBuyerInfo(info) {
  localStorage.setItem(LS_BUYER, JSON.stringify(info));
}

let products = [];
let banners = [];
let bannerSlideIndex = 0;
let bannerTimer = null;
let ongkirData = {};
let settings = { ...DEFAULT_SETTINGS };
let activeKategori = "Semua";
let searchTerm = "";
let aiChatHistory = [];
let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  renderCart();
  listenProducts();
  listenBanners();
  listenSettings();
  listenOngkir();
  bindSpinWheel();
  bindBuyerForm();
  bindAIChat();
  bindAccountAuth();
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
      renderCart();
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
      renderBannerSlider();
    },
    (err) => console.error(err)
  );
}

/* ---------- banner slider (auto geser) ---------- */
function listenBanners() {
  onSnapshot(
    collection(db, "banners"),
    (snap) => {
      banners = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
      renderBannerSlider();
    },
    (err) => console.error(err)
  );
}

function renderBannerSlider() {
  const wrap = document.getElementById("promoBannerPhoto");
  const track = document.getElementById("promoBannerTrack");
  const dots = document.getElementById("promoBannerDots");
  if (!wrap || !track) return;

  clearInterval(bannerTimer);
  bannerSlideIndex = 0;

  const showSlider = !!(settings.bannerAktif && banners.length > 0);
  wrap.style.display = showSlider ? "flex" : "none";
  if (!showSlider) return;

  track.innerHTML = banners.map(b => `
    <div class="promo-slide">
      <img src="${b.gambar}" alt="Banner Promo" loading="lazy">
      ${b.teks ? `<p class="promo-photo-caption">${b.teks}</p>` : ""}
    </div>
  `).join("");

  if (dots) {
    dots.innerHTML = banners.length > 1
      ? banners.map((_, i) => `<button class="promo-dot ${i === 0 ? "active" : ""}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>`).join("")
      : "";
    dots.querySelectorAll("[data-slide]").forEach(b => b.addEventListener("click", () => goToSlide(Number(b.dataset.slide))));
  }

  updateSlidePosition();

  if (banners.length > 1) {
    bannerTimer = setInterval(() => {
      bannerSlideIndex = (bannerSlideIndex + 1) % banners.length;
      updateSlidePosition();
    }, 5000);
  }
}

function goToSlide(i) {
  bannerSlideIndex = i;
  updateSlidePosition();
  clearInterval(bannerTimer);
  if (banners.length > 1) {
    bannerTimer = setInterval(() => {
      bannerSlideIndex = (bannerSlideIndex + 1) % banners.length;
      updateSlidePosition();
    }, 5000);
  }
}

function updateSlidePosition() {
  const track = document.getElementById("promoBannerTrack");
  if (track) track.style.transform = `translateX(-${bannerSlideIndex * 100}%)`;
  document.querySelectorAll(".promo-dot").forEach((d, i) => d.classList.toggle("active", i === bannerSlideIndex));
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

  const aiFab = document.getElementById("aiChatFabBtn");
  if (aiFab) aiFab.style.display = (settings.aiAktif && settings.groqApiKey) ? "flex" : "none";
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
        ${(p.rating || p.terjual) ? `<div class="rating-row">${p.rating ? `⭐ ${Number(p.rating).toFixed(1)}` : ""}${p.rating && p.terjual ? " · " : ""}${p.terjual ? `Terjual ${p.terjual}` : ""}</div>` : ""}
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
        ${(p.rating || p.terjual) ? `<div class="rating-row modal-rating">${p.rating ? `⭐ ${Number(p.rating).toFixed(1)}` : ""}${p.rating && p.terjual ? " · " : ""}${p.terjual ? `${p.terjual} terjual` : ""}</div>` : ""}
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

/* ---------- form pembeli: nama, kota, alamat + estimasi ongkir ---------- */
function listenOngkir() {
  onSnapshot(
    collection(db, "ongkir"),
    (snap) => {
      ongkirData = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.kota) ongkirData[data.kota] = data.estimasi;
      });
      populateCityOptions();
      prefillBuyerForm();
    },
    (err) => console.error(err)
  );
}

function populateCityOptions() {
  const sel = document.getElementById("buyerCity");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = `<option value="">Pilih kota/wilayah...</option>` +
    Object.keys(ongkirData).map(k => `<option value="${k}">${k}</option>`).join("");
  if (current && ongkirData[current]) sel.value = current;
}

function prefillBuyerForm() {
  const info = getBuyerInfo();
  const nameEl = document.getElementById("buyerName");
  const citySel = document.getElementById("buyerCity");
  const addrEl = document.getElementById("buyerAddress");
  if (nameEl) nameEl.value = info.name || "";
  if (citySel) citySel.value = info.city || "";
  if (addrEl) addrEl.value = info.address || "";
  updateOngkirEstimate();
}

function updateOngkirEstimate() {
  const city = document.getElementById("buyerCity")?.value;
  const box = document.getElementById("ongkirEstimate");
  if (!box) return;
  if (city && ongkirData[city]) {
    box.style.display = "flex";
    box.textContent = `🚚 Estimasi ongkir ke ${city}: ${ongkirData[city]} (perkiraan, dikonfirmasi admin)`;
  } else {
    box.style.display = "none";
  }
}

function persistBuyerForm() {
  saveBuyerInfo({
    name: document.getElementById("buyerName")?.value.trim() || "",
    city: document.getElementById("buyerCity")?.value || "",
    address: document.getElementById("buyerAddress")?.value.trim() || "",
  });
}

function bindBuyerForm() {
  populateCityOptions();
  prefillBuyerForm();
  document.getElementById("buyerName")?.addEventListener("input", persistBuyerForm);
  document.getElementById("buyerAddress")?.addEventListener("input", persistBuyerForm);
  document.getElementById("buyerCity")?.addEventListener("change", () => {
    persistBuyerForm();
    updateOngkirEstimate();
  });
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

  const spin = getSpinResult();
  const voucherLine = (spin && spin.type !== "none")
    ? `\nKode Voucher: ${spin.code} (${spin.full}) — mohon dicek & diterapkan ya 🙏\n`
    : "";

  const buyer = getBuyerInfo();
  const buyerLines = [];
  if (buyer.name) buyerLines.push(`Nama: ${buyer.name}`);
  if (buyer.city) buyerLines.push(`Kota/Wilayah: ${buyer.city}${ongkirData[buyer.city] ? ` (estimasi ongkir ${ongkirData[buyer.city]})` : ""}`);
  if (buyer.address) buyerLines.push(`Alamat: ${buyer.address}`);
  const buyerBlock = buyerLines.length ? `\n${buyerLines.join("\n")}\n` : "";

  const pesan =
`Halo ${settings.namaToko}, saya mau pesan:

${lines}
${voucherLine}
Total: ${rupiah(total)}
${buyerBlock}
Mohon info ongkir & cara pembayarannya ya. Terima kasih 🙏`;

  const url = `https://wa.me/${settings.noWA}?text=${encodeURIComponent(pesan)}`;
  logOrder(cart, total, buyer, spin);
  window.open(url, "_blank");
}

/* ---------- catat riwayat pesanan ke Firestore (buat admin) ---------- */
function logOrder(cart, total, buyer, spin) {
  try {
    const items = cart.map(c => {
      const p = products.find(x => x.id === c.id);
      return p ? { nama: p.nama, qty: c.qty, harga: p.harga, subtotal: p.harga * c.qty } : null;
    }).filter(Boolean);

    addDoc(collection(db, "orders"), {
      items,
      total,
      buyer: { name: buyer.name || "", city: buyer.city || "", address: buyer.address || "" },
      voucher: (spin && spin.type !== "none") ? { code: spin.code, label: spin.full } : null,
      createdAt: new Date().toISOString(),
    }).catch(err => console.error("Gagal mencatat riwayat pesanan:", err));
  } catch (err) {
    console.error("Gagal mencatat riwayat pesanan:", err);
  }
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

/* ---------- spin wheel diskon ---------- */
function getSpinResult() {
  try { return JSON.parse(sessionStorage.getItem(SPIN_KEY)); } catch { return null; }
}
function saveSpinResult(result) {
  sessionStorage.setItem(SPIN_KEY, JSON.stringify(result));
}
function genVoucherCode() {
  return "SPIN" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function buildWheel() {
  const wheel = document.getElementById("spinWheel");
  if (!wheel) return;
  const segAngle = 360 / PRIZES.length;
  const gradientStops = PRIZES.map((p, i) => `${p.color} ${i * segAngle}deg ${(i + 1) * segAngle}deg`).join(", ");
  wheel.style.background = `conic-gradient(${gradientStops})`;
  wheel.innerHTML = PRIZES.map((p, i) => {
    const angle = i * segAngle + segAngle / 2;
    return `<span class="wheel-label" style="transform:translate(-50%,-50%) rotate(${angle}deg) translateY(-92px) rotate(${-angle}deg);">${p.label}</span>`;
  }).join("");
}

function pickPrizeIndex() {
  const total = PRIZES.reduce((a, p) => a + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < PRIZES.length; i++) {
    r -= PRIZES[i].weight;
    if (r <= 0) return i;
  }
  return PRIZES.length - 1;
}

function spinNow() {
  const wheel = document.getElementById("spinWheel");
  const spinBtn = document.getElementById("spinActionBtn");
  if (!wheel || spinBtn.disabled) return;

  spinBtn.disabled = true;
  spinBtn.textContent = "Menggulir...";

  const idx = pickPrizeIndex();
  const segAngle = 360 / PRIZES.length;
  const segCenter = idx * segAngle + segAngle / 2;
  const jitter = (Math.random() * segAngle * 0.5) - segAngle * 0.25;
  const extraSpins = 6 * 360;
  const targetRotation = extraSpins + (360 - segCenter) + jitter;

  wheel.style.transition = "transform 4.2s cubic-bezier(.15,.7,.2,1)";
  wheel.style.transform = `rotate(${targetRotation}deg)`;

  setTimeout(() => finishSpin(idx), 4300);
}

function finishSpin(idx) {
  const prize = PRIZES[idx];
  const result = {
    label: prize.label,
    full: prize.full,
    type: prize.type,
    value: prize.value,
    code: prize.type !== "none" ? genVoucherCode() : null,
  };
  saveSpinResult(result);
  showSpinResult(result);
}

function showSpinResult(result) {
  const spinBtn = document.getElementById("spinActionBtn");
  const resultBox = document.getElementById("spinResult");
  const resultTitle = document.getElementById("spinResultTitle");
  const voucherBox = document.getElementById("voucherBox");
  const voucherCode = document.getElementById("voucherCode");
  const sub = document.getElementById("spinSub");

  if (spinBtn) { spinBtn.style.display = "none"; }
  if (sub) sub.style.display = "none";
  if (resultBox) resultBox.style.display = "block";

  if (result.type === "none") {
    if (resultTitle) resultTitle.textContent = `😅 Yah, ${result.full.toLowerCase()} kali ini. Coba lagi lain waktu ya!`;
    if (voucherBox) voucherBox.style.display = "none";
  } else {
    if (resultTitle) resultTitle.textContent = `🎉 Selamat! Kamu dapat ${result.full}`;
    if (voucherBox) voucherBox.style.display = "flex";
    if (voucherCode) voucherCode.textContent = result.code;
  }
}

function openSpinModal() {
  document.getElementById("spinOverlay")?.classList.add("show");
  const existing = getSpinResult();
  if (existing) {
    showSpinResult(existing);
  }
}
function closeSpinModal() {
  document.getElementById("spinOverlay")?.classList.remove("show");
}

function bindSpinWheel() {
  buildWheel();
  document.getElementById("spinFabBtn")?.addEventListener("click", openSpinModal);
  document.getElementById("closeSpinModal")?.addEventListener("click", closeSpinModal);
  document.getElementById("spinOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "spinOverlay") closeSpinModal();
  });
  document.getElementById("spinActionBtn")?.addEventListener("click", spinNow);
  document.getElementById("copyVoucherBtn")?.addEventListener("click", () => {
    const code = document.getElementById("voucherCode")?.textContent;
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => showToast("Kode voucher disalin!"));
  });
  document.getElementById("spinCheckoutBtn")?.addEventListener("click", () => {
    closeSpinModal();
    openCart();
  });
}

/* ---------- AI chat (Groq) ---------- */
function buildProductContext() {
  if (products.length === 0) return "Belum ada produk di katalog saat ini.";
  const list = products.slice(0, 40).map(p => {
    const stokTxt = Number(p.stok) > 0 ? `stok ${p.stok}` : "stok habis";
    const hargaTxt = p.hargaCoret ? `${rupiah(p.harga)} (diskon dari ${rupiah(p.hargaCoret)})` : rupiah(p.harga);
    const ratingTxt = p.rating ? `, rating ${p.rating}` : "";
    return `- ${p.nama} | kategori: ${p.kategori} | harga: ${hargaTxt} | ${stokTxt}${ratingTxt}`;
  }).join("\n");
  return `Daftar produk yang tersedia di toko:\n${list}`;
}

function buildOngkirContext() {
  const kota = Object.keys(ongkirData);
  if (kota.length === 0) return "";
  const list = kota.map(k => `- ${k}: ${ongkirData[k]}`).join("\n");
  return `\n\nEstimasi ongkir per wilayah (kasar, dikonfirmasi admin saat checkout):\n${list}`;
}

function buildSystemPrompt() {
  const base = settings.aiPersona?.trim()
    ? settings.aiPersona.trim()
    : `Kamu adalah asisten belanja yang ramah, gercep, dan pinter buat toko online "${settings.namaToko}". Gaya bahasa santai ala orang Indonesia (boleh pakai kata "kak"/"kamu"), jawaban singkat-padat (maks 3-4 kalimat kecuali diminta detail). Tugas kamu:
1. Bantu customer nemuin produk yang cocok dari katalog di bawah — kalau nanya rekomendasi, sebutkan 2-3 nama produk konkret beserta harganya.
2. Kalau nanya ongkir, pakai tabel estimasi wilayah di bawah; kalau kotanya nggak ada di daftar, bilang jujur belum ada datanya dan sarankan tanya admin.
3. Kalau ada produk yang harganya dicoret (diskon), sebutkan itu sebagai nilai jual.
4. Kalau customer udah keliatan mantap mau beli, dorong dengan ramah buat masukin ke keranjang terus klik "Checkout via WhatsApp", atau coba dulu tombol 🎁 Spin buat cari kode diskon.
5. JANGAN PERNAH mengarang nama produk, harga, atau stok yang tidak ada di daftar — kalau nggak ada datanya, bilang terus terang dan tawarkan tanya admin lewat WhatsApp.
6. Kalau ditanya hal di luar topik toko/produk, jawab singkat lalu arahkan balik ke soal belanja.`;
  return `${base}\n\n${buildProductContext()}${buildOngkirContext()}`;
}

function matchProductsInText(text) {
  const lower = text.toLowerCase();
  return products.filter(p => p.nama && lower.includes(p.nama.toLowerCase())).slice(0, 3);
}

function appendChatMessage(role, text, matchedProducts = []) {
  const box = document.getElementById("aiChatMessages");
  if (!box) return null;
  const wrap = document.createElement("div");
  wrap.className = `ai-msg ${role === "user" ? "ai-msg-user" : "ai-msg-bot"}`;

  const textEl = document.createElement("div");
  textEl.textContent = text;
  wrap.appendChild(textEl);

  if (matchedProducts.length > 0) {
    const actions = document.createElement("div");
    actions.className = "ai-msg-actions";
    matchedProducts.forEach(prod => {
      const habis = Number(prod.stok) <= 0;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ai-msg-add-btn";
      btn.textContent = habis ? `${prod.nama} — Habis` : `🛒 ${prod.nama}`;
      btn.disabled = habis;
      btn.addEventListener("click", () => addToCart(prod.id));
      actions.appendChild(btn);
    });
    wrap.appendChild(actions);
  }

  box.appendChild(wrap);
  box.scrollTop = box.scrollHeight;
  return wrap;
}

function appendLoadingMessage() {
  const box = document.getElementById("aiChatMessages");
  if (!box) return null;
  const el = document.createElement("div");
  el.className = "ai-msg ai-msg-loading";
  el.innerHTML = `<span class="ai-typing-dots"><span></span><span></span><span></span></span>`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
  return el;
}

async function sendAIMessage(quickText) {
  const input = document.getElementById("aiChatInput");
  const sendBtn = document.getElementById("aiChatSendBtn");
  const text = (quickText ?? input?.value ?? "").trim();
  if (!text || !settings.groqApiKey) return;

  hideQuickReplies();
  appendChatMessage("user", text);
  aiChatHistory.push({ role: "user", content: text });
  if (input) input.value = "";
  if (sendBtn) sendBtn.disabled = true;
  const loadingEl = appendLoadingMessage();

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.groqApiKey}`,
      },
      body: JSON.stringify({
        model: settings.aiModel || "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...aiChatHistory.slice(-10),
        ],
        max_completion_tokens: 400,
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    loadingEl?.remove();

    if (!res.ok) {
      const msg = data?.error?.message || "Gagal menghubungi AI (cek API key di pengaturan admin)";
      appendChatMessage("bot", `⚠️ ${msg}`);
      return;
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || "Maaf, aku belum bisa jawab itu sekarang.";
    const matched = matchProductsInText(reply);
    appendChatMessage("bot", reply, matched);
    aiChatHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    console.error(err);
    loadingEl?.remove();
    appendChatMessage("bot", "⚠️ Gagal menghubungi AI — cek koneksi internet kamu.");
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

const AI_QUICK_REPLIES = [
  { label: "🛍️ Rekomendasi produk", text: "Rekomendasiin produk yang lagi laris atau diskon dong" },
  { label: "🚚 Cek ongkir", text: "Ongkir ke kotaku berapa ya?" },
  { label: "🎁 Ada promo?", text: "Lagi ada promo atau diskon apa aja sekarang?" },
];

function renderQuickReplies() {
  const box = document.getElementById("aiChatQuick");
  if (!box) return;
  box.innerHTML = AI_QUICK_REPLIES.map((q, i) =>
    `<button type="button" class="ai-chat-quick-btn" data-quick="${i}">${q.label}</button>`
  ).join("");
  box.style.display = "flex";
  box.querySelectorAll("[data-quick]").forEach(btn => {
    btn.addEventListener("click", () => sendAIMessage(AI_QUICK_REPLIES[Number(btn.dataset.quick)].text));
  });
}
function hideQuickReplies() {
  const box = document.getElementById("aiChatQuick");
  if (box) box.style.display = "none";
}

function openAIChatModal() {
  const overlay = document.getElementById("aiChatOverlay");
  overlay?.classList.add("show");
  const box = document.getElementById("aiChatMessages");
  if (box && box.children.length === 0) {
    appendChatMessage("bot", `Halo! Aku asisten belanja ${settings.namaToko} 👋 Mau tanya-tanya produk, ongkir, atau promo? Tinggal pilih di bawah, atau ketik langsung.`);
    renderQuickReplies();
  }
}
function closeAIChatModal() {
  document.getElementById("aiChatOverlay")?.classList.remove("show");
}

function bindAIChat() {
  document.getElementById("aiChatFabBtn")?.addEventListener("click", openAIChatModal);
  document.getElementById("closeAiChatModal")?.addEventListener("click", closeAIChatModal);
  document.getElementById("aiChatOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "aiChatOverlay") closeAIChatModal();
  });
  document.getElementById("aiChatSendBtn")?.addEventListener("click", sendAIMessage);
  document.getElementById("aiChatInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); sendAIMessage(); }
  });
}

/* ---------- akun customer (Firebase Auth: email/password) ---------- */
function openAccountModal() {
  document.getElementById("accountOverlay")?.classList.add("show");
}
function closeAccountModal() {
  document.getElementById("accountOverlay")?.classList.remove("show");
}

function showAccountLoggedIn(user, profile) {
  document.getElementById("accountAuthBox").style.display = "none";
  document.getElementById("accountProfileBox").style.display = "block";
  document.getElementById("accProfileName").textContent = profile?.name || user.email;
  document.getElementById("accProfileEmail").textContent = user.email;
  const label = document.getElementById("accountBtnLabel");
  if (label) label.textContent = `👤 ${(profile?.name || user.email).split(" ")[0]}`;

  // otomatis prefill nama & no HP ke form checkout kalau masih kosong
  const nameEl = document.getElementById("buyerName");
  if (nameEl && !nameEl.value.trim() && profile?.name) {
    nameEl.value = profile.name;
    persistBuyerForm();
  }
}

function showAccountLoggedOut() {
  document.getElementById("accountAuthBox").style.display = "block";
  document.getElementById("accountProfileBox").style.display = "none";
  const label = document.getElementById("accountBtnLabel");
  if (label) label.textContent = "👤 Masuk";
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("accRegName").value.trim();
  const email = document.getElementById("accRegEmail").value.trim();
  const phone = document.getElementById("accRegPhone").value.trim();
  const pass = document.getElementById("accRegPass").value;
  const errEl = document.getElementById("accRegError");
  errEl.textContent = "";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "customers", cred.user.uid), {
      name, email, phone, createdAt: new Date().toISOString(),
    });
    showToast("Akun berhasil dibuat! Selamat belanja 🎉");
    closeAccountModal();
  } catch (err) {
    errEl.textContent = translateAuthError(err);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("accLoginEmail").value.trim();
  const pass = document.getElementById("accLoginPass").value;
  const errEl = document.getElementById("accLoginError");
  errEl.textContent = "";

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    showToast("Berhasil masuk 👋");
    closeAccountModal();
  } catch (err) {
    errEl.textContent = translateAuthError(err);
  }
}

function translateAuthError(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "Email ini sudah terdaftar. Coba menu Masuk.";
  if (code.includes("invalid-email")) return "Format email tidak valid.";
  if (code.includes("weak-password")) return "Password minimal 6 karakter.";
  if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) return "Email atau password salah.";
  if (code.includes("too-many-requests")) return "Terlalu banyak percobaan — coba lagi beberapa saat.";
  return "Gagal memproses — cek koneksi internet.";
}

function bindAccountAuth() {
  document.getElementById("openAccountBtn")?.addEventListener("click", openAccountModal);
  document.getElementById("closeAccountModal")?.addEventListener("click", closeAccountModal);
  document.getElementById("accountOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "accountOverlay") closeAccountModal();
  });

  document.querySelectorAll(".account-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".account-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const isLogin = tab.dataset.tab === "login";
      document.getElementById("accountLoginForm").style.display = isLogin ? "flex" : "none";
      document.getElementById("accountRegisterForm").style.display = isLogin ? "none" : "flex";
    });
  });

  document.getElementById("accountLoginForm")?.addEventListener("submit", handleLogin);
  document.getElementById("accountRegisterForm")?.addEventListener("submit", handleRegister);
  document.getElementById("logoutAccountBtn")?.addEventListener("click", async () => {
    await signOut(auth);
    showToast("Kamu sudah keluar dari akun");
    closeAccountModal();
  });

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      let profile = null;
      try {
        const snap = await getDoc(doc(db, "customers", user.uid));
        profile = snap.exists() ? snap.data() : null;
      } catch (err) {
        console.error(err);
      }
      showAccountLoggedIn(user, profile);
    } else {
      showAccountLoggedOut();
    }
  });
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
