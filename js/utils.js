function getProducts() {
  return RD9.loadJSON(RD9.STORAGE_KEYS.products, RD9.clone(RD9.defaultProducts));
}

function setProducts(products) {
  RD9.saveJSON(RD9.STORAGE_KEYS.products, products);
}

function getCart() {
  return RD9.loadJSON(RD9.STORAGE_KEYS.cart, []);
}

function setCart(cart) {
  RD9.saveJSON(RD9.STORAGE_KEYS.cart, cart);
}

function getOrders() {
  return RD9.loadJSON(RD9.STORAGE_KEYS.orders, []);
}

function setOrders(orders) {
  RD9.saveJSON(RD9.STORAGE_KEYS.orders, orders);
}

function formatDateTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalize(text) {
  return String(text || '').toLowerCase().trim();
}

function buildWhatsAppLink(phone, message) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function getActiveProducts() {
  return getProducts().filter((product) => product.active !== false);
}

function calculateShipping(subtotal) {
  if (subtotal >= 250000) return 0;
  if (subtotal === 0) return 0;
  return 15000;
}

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = calculateShipping(subtotal);
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
  };
}
