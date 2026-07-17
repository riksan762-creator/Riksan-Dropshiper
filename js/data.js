const STORAGE_KEYS = {
  products: 'riksanDropshipProducts',
  orders: 'riksanDropshipOrders',
  cart: 'riksanDropshipCart',
};

const OWNER_WHATSAPP = '6282113945743';

const defaultProducts = [
  {
    id: 'p1',
    name: 'Hoodie Premium Urban',
    category: 'Fashion',
    price: 189000,
    image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80',
    description: 'Hoodie streetwear bahan tebal, cocok untuk katalog niche fashion modern.',
    featured: true,
    active: true,
  },
  {
    id: 'p2',
    name: 'Tumbler Stainless 1L',
    category: 'Home Living',
    price: 99000,
    image: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=900&q=80',
    description: 'Tumbler estetik, cocok untuk gift, kantor, dan promosi impulse buy.',
    featured: true,
    active: true,
  },
  {
    id: 'p3',
    name: 'Lampu LED Dekorasi',
    category: 'Dekorasi',
    price: 129000,
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80',
    description: 'Lampu ambient premium untuk kamar, konten, dan backdrop produk.',
    featured: false,
    active: true,
  },
  {
    id: 'p4',
    name: 'Tas Sling Minimalist',
    category: 'Fashion',
    price: 149000,
    image: 'https://images.unsplash.com/photo-1520608421741-68228b76b6ef?auto=format&fit=crop&w=900&q=80',
    description: 'Tas ringan, simple, dan laku untuk pasar harian anak muda.',
    featured: true,
    active: true,
  },
  {
    id: 'p5',
    name: 'Rak Serbaguna',
    category: 'Home Living',
    price: 159000,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    description: 'Rak serbaguna untuk rumah rapi, cocok buat bundle upsell.',
    featured: false,
    active: true,
  },
  {
    id: 'p6',
    name: 'Set Skincare Travel',
    category: 'Beauty',
    price: 119000,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=900&q=80',
    description: 'Paket travel-friendly untuk niche beauty yang mudah dijual.',
    featured: true,
    active: true,
  },
];

function rupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.warn('Gagal load JSON', key, error);
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureSeedData() {
  const existing = loadJSON(STORAGE_KEYS.products, null);
  if (!existing || !existing.length) {
    saveJSON(STORAGE_KEYS.products, clone(defaultProducts));
  }
  const orders = loadJSON(STORAGE_KEYS.orders, null);
  if (!orders) saveJSON(STORAGE_KEYS.orders, []);
  const cart = loadJSON(STORAGE_KEYS.cart, null);
  if (!cart) saveJSON(STORAGE_KEYS.cart, []);
}

function uid() {
  return `id_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

window.RD9 = {
  STORAGE_KEYS,
  OWNER_WHATSAPP,
  defaultProducts,
  rupiah,
  loadJSON,
  saveJSON,
  clone,
  ensureSeedData,
  uid,
};
