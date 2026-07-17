RD9.ensureSeedData();

const state = {
  products: getActiveProducts(),
  filtered: [],
  cart: getCart(),
  search: '',
  category: 'all',
  sort: 'featured',
};

const els = {
  grid: document.getElementById('productGrid'),
  search: document.getElementById('searchInput'),
  category: document.getElementById('categoryFilter'),
  sort: document.getElementById('sortFilter'),
  resultCount: document.getElementById('resultCount'),
  cartToggle: document.getElementById('cartToggle'),
  cartClose: document.getElementById('cartClose'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartItems: document.getElementById('cartItems'),
  cartCount: document.getElementById('cartCount'),
  subtotal: document.getElementById('subtotal'),
  shipping: document.getElementById('shipping'),
  total: document.getElementById('total'),
  checkoutForm: document.getElementById('checkoutForm'),
  statProducts: document.getElementById('statProducts'),
};

function uniqueCategories(products) {
  return [...new Set(products.map((p) => p.category))].sort((a, b) => a.localeCompare(b));
}

function applyFilters() {
  let products = [...state.products];

  if (state.search) {
    const q = normalize(state.search);
    products = products.filter((p) => [p.name, p.category, p.description].some((field) => normalize(field).includes(q)));
  }

  if (state.category !== 'all') {
    products = products.filter((p) => p.category === state.category);
  }

  switch (state.sort) {
    case 'price-low':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      products.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
      break;
  }

  state.filtered = products;
}

function renderCategories() {
  const categories = uniqueCategories(state.products);
  els.category.innerHTML = ['<option value="all">Semua kategori</option>', ...categories.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`)].join('');
}

function renderProducts() {
  applyFilters();
  els.resultCount.textContent = `${state.filtered.length} produk ditemukan`;
  els.statProducts.textContent = String(state.products.length);

  if (!state.filtered.length) {
    els.grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Produk tidak ditemukan.</div>`;
    return;
  }

  els.grid.innerHTML = state.filtered.map((product) => `
    <article class="product-card card">
      <img class="product-cover" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
      <div class="product-body">
        <div class="product-top">
          <div>
            <div class="product-title">${escapeHtml(product.name)}</div>
            <div class="product-meta">
              <span class="tag">${escapeHtml(product.category)}</span>
              ${product.featured ? '<span class="tag">Unggulan</span>' : ''}
            </div>
          </div>
          <div class="price">${RD9.rupiah(product.price)}</div>
        </div>
        <p class="muted">${escapeHtml(product.description)}</p>
        <div class="product-actions">
          <button class="btn btn-secondary" type="button" onclick="addToCart('${product.id}')">Tambah ke keranjang</button>
          <button class="btn btn-primary" type="button" onclick="buyNow('${product.id}')">Order WA</button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderCart() {
  const items = state.cart;
  const totals = calculateTotals(items);

  els.cartCount.textContent = String(items.reduce((sum, item) => sum + item.qty, 0));
  els.subtotal.textContent = RD9.rupiah(totals.subtotal);
  els.shipping.textContent = RD9.rupiah(totals.shipping);
  els.total.textContent = RD9.rupiah(totals.total);

  if (!items.length) {
    els.cartItems.innerHTML = `<div class="empty-state">Keranjang masih kosong.</div>`;
    return;
  }

  const products = getProducts();
  els.cartItems.innerHTML = items.map((item) => {
    const product = products.find((p) => p.id === item.id);
    if (!product) return '';
    return `
      <div class="cart-item">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
        <div>
          <h4>${escapeHtml(product.name)}</h4>
          <small>${escapeHtml(product.category)} • ${RD9.rupiah(product.price)}</small>
          <div class="qty-actions">
            <button type="button" onclick="changeQty('${product.id}', -1)">−</button>
            <strong>${item.qty}</strong>
            <button type="button" onclick="changeQty('${product.id}', 1)">+</button>
            <button type="button" onclick="removeItem('${product.id}')" title="Hapus item">Hapus</button>
          </div>
        </div>
        <strong>${RD9.rupiah(product.price * item.qty)}</strong>
      </div>
    `;
  }).join('');
}

function syncCart() {
  setCart(state.cart);
  renderCart();
}

function addToCart(productId) {
  const existing = state.cart.find((item) => item.id === productId);
  if (existing) existing.qty += 1;
  else state.cart.push({ id: productId, qty: 1 });
  syncCart();
  openCart();
}

function changeQty(productId, delta) {
  const item = state.cart.find((entry) => entry.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter((entry) => entry.id !== productId);
  }
  syncCart();
}

function removeItem(productId) {
  state.cart = state.cart.filter((entry) => entry.id !== productId);
  syncCart();
}

function buyNow(productId) {
  state.cart = [{ id: productId, qty: 1 }];
  syncCart();
  openCart();
}

function openCart() {
  els.cartDrawer.classList.remove('hidden');
}

function closeCart() {
  els.cartDrawer.classList.add('hidden');
}

function buildOrderMessage(customer, items, totals) {
  const products = getProducts();
  const lines = [
    `Halo admin Riksan Dropship 9, saya mau order:`,
    ``,
    `Nama: ${customer.name}`,
    `WA Pembeli: ${customer.phone}`,
    `Alamat: ${customer.address}`,
    ``,
    `Detail Pesanan:`,
  ];

  items.forEach((item, index) => {
    const product = products.find((p) => p.id === item.id);
    if (!product) return;
    lines.push(`${index + 1}. ${product.name} x${item.qty} = ${RD9.rupiah(product.price * item.qty)}`);
  });

  lines.push(
    ``,
    `Subtotal: ${RD9.rupiah(totals.subtotal)}`,
    `Ongkir: ${RD9.rupiah(totals.shipping)}`,
    `Total: ${RD9.rupiah(totals.total)}`,
    ``,
    `Mohon dibantu proses ya.`
  );

  return lines.join('\n');
}

function saveOrder(customer, items) {
  const orders = getOrders();
  const totals = calculateTotals(items);
  orders.unshift({
    id: RD9.uid(),
    createdAt: new Date().toISOString(),
    customer,
    items,
    totals,
  });
  setOrders(orders);
}

function handleCheckout(event) {
  event.preventDefault();
  if (!state.cart.length) {
    alert('Keranjang masih kosong.');
    return;
  }

  const customer = {
    name: document.getElementById('customerName').value.trim(),
    phone: document.getElementById('customerPhone').value.trim(),
    address: document.getElementById('customerAddress').value.trim(),
  };

  const totals = calculateTotals(state.cart);
  const message = buildOrderMessage(customer, state.cart, totals);

  saveOrder(customer, state.cart);
  state.cart = [];
  syncCart();
  event.target.reset();
  window.open(buildWhatsAppLink(RD9.OWNER_WHATSAPP, message), '_blank', 'noopener');
}

function bindEvents() {
  els.search.addEventListener('input', (e) => {
    state.search = e.target.value;
    renderProducts();
  });

  els.category.addEventListener('change', (e) => {
    state.category = e.target.value;
    renderProducts();
  });

  els.sort.addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderProducts();
  });

  els.cartToggle.addEventListener('click', () => {
    els.cartDrawer.classList.toggle('hidden');
  });

  els.cartClose.addEventListener('click', closeCart);
  els.checkoutForm.addEventListener('submit', handleCheckout);
}

function init() {
  state.products = getActiveProducts();
  state.cart = getCart();
  renderCategories();
  renderProducts();
  renderCart();
  bindEvents();
  closeCart();
}

document.addEventListener('DOMContentLoaded', init);

window.addToCart = addToCart;
window.buyNow = buyNow;
window.changeQty = changeQty;
window.removeItem = removeItem;
