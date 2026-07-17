RD9.ensureSeedData();

const els = {
  form: document.getElementById('productForm'),
  title: document.getElementById('formTitle'),
  productId: document.getElementById('productId'),
  name: document.getElementById('name'),
  category: document.getElementById('category'),
  price: document.getElementById('price'),
  image: document.getElementById('image'),
  description: document.getElementById('description'),
  featured: document.getElementById('featured'),
  active: document.getElementById('active'),
  clearFormBtn: document.getElementById('clearFormBtn'),
  productsTable: document.getElementById('productsTable'),
  ordersList: document.getElementById('ordersList'),
  metricProducts: document.getElementById('metricProducts'),
  metricOrders: document.getElementById('metricOrders'),
  metricRevenue: document.getElementById('metricRevenue'),
  clearOrdersBtn: document.getElementById('clearOrdersBtn'),
  resetAllBtn: document.getElementById('resetAllBtn'),
};

let editingId = null;

function renderAdmin() {
  const products = getProducts();
  const orders = getOrders();

  els.metricProducts.textContent = String(products.length);
  els.metricOrders.textContent = String(orders.length);
  els.metricRevenue.textContent = RD9.rupiah(
    orders.reduce((sum, order) => sum + (order.totals?.total || 0), 0)
  );

  if (!products.length) {
    els.productsTable.innerHTML = `<tr><td colspan="5"><div class="empty-state">Belum ada produk.</div></td></tr>`;
  } else {
    els.productsTable.innerHTML = products.map((product) => `
      <tr>
        <td>
          <strong>${escapeHtml(product.name)}</strong><br />
          <small>${escapeHtml(product.description)}</small>
        </td>
        <td>${escapeHtml(product.category)}</td>
        <td>${RD9.rupiah(product.price)}</td>
        <td>${product.active !== false ? 'Aktif' : 'Nonaktif'}${product.featured ? ' • Unggulan' : ''}</td>
        <td>
          <div class="table-actions">
            <button type="button" onclick="editProduct('${product.id}')">Edit</button>
            <button type="button" onclick="toggleProduct('${product.id}')">${product.active !== false ? 'Nonaktifkan' : 'Aktifkan'}</button>
            <button type="button" onclick="deleteProduct('${product.id}')">Hapus</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  if (!orders.length) {
    els.ordersList.innerHTML = `<div class="empty-state">Belum ada order tersimpan.</div>`;
  } else {
    els.ordersList.innerHTML = orders.slice(0, 12).map((order) => `
      <article class="order-card">
        <h4>${escapeHtml(order.customer?.name || 'Tanpa nama')} — ${formatDateTime(order.createdAt)}</h4>
        <p><strong>WA:</strong> ${escapeHtml(order.customer?.phone || '-')}</p>
        <p><strong>Alamat:</strong> ${escapeHtml(order.customer?.address || '-')}</p>
        <p><strong>Total:</strong> ${RD9.rupiah(order.totals?.total || 0)}</p>
        <p><strong>Item:</strong> ${escapeHtml((order.items || []).map((item) => `${item.id} x${item.qty}`).join(', '))}</p>
      </article>
    `).join('');
  }
}

function resetForm() {
  editingId = null;
  els.form.reset();
  els.productId.value = '';
  els.active.checked = true;
  els.featured.checked = false;
  els.title.textContent = 'Tambah produk baru';
}

function fillForm(product) {
  editingId = product.id;
  els.productId.value = product.id;
  els.name.value = product.name;
  els.category.value = product.category;
  els.price.value = product.price;
  els.image.value = product.image;
  els.description.value = product.description;
  els.featured.checked = Boolean(product.featured);
  els.active.checked = product.active !== false;
  els.title.textContent = 'Edit produk';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveProduct(event) {
  event.preventDefault();

  const payload = {
    id: editingId || RD9.uid(),
    name: els.name.value.trim(),
    category: els.category.value.trim(),
    price: Number(els.price.value),
    image: els.image.value.trim(),
    description: els.description.value.trim(),
    featured: els.featured.checked,
    active: els.active.checked,
  };

  if (!payload.name || !payload.category || !payload.price || !payload.image || !payload.description) {
    alert('Semua field wajib diisi.');
    return;
  }

  const products = getProducts();
  const idx = products.findIndex((product) => product.id === payload.id);
  if (idx >= 0) products[idx] = payload;
  else products.unshift(payload);

  setProducts(products);
  resetForm();
  renderAdmin();
}

function editProduct(id) {
  const product = getProducts().find((item) => item.id === id);
  if (!product) return;
  fillForm(product);
}

function toggleProduct(id) {
  const products = getProducts();
  const product = products.find((item) => item.id === id);
  if (!product) return;
  product.active = product.active === false;
  setProducts(products);
  renderAdmin();
}

function deleteProduct(id) {
  if (!confirm('Hapus produk ini?')) return;
  setProducts(getProducts().filter((item) => item.id !== id));
  if (editingId === id) resetForm();
  renderAdmin();
}

function clearOrders() {
  if (!confirm('Hapus semua order tersimpan?')) return;
  setOrders([]);
  renderAdmin();
}

function resetAll() {
  if (!confirm('Reset semua data ke default?')) return;
  RD9.saveJSON(RD9.STORAGE_KEYS.products, RD9.clone(RD9.defaultProducts));
  setOrders([]);
  setCart([]);
  resetForm();
  renderAdmin();
}

function bindEvents() {
  els.form.addEventListener('submit', saveProduct);
  els.clearFormBtn.addEventListener('click', resetForm);
  els.clearOrdersBtn.addEventListener('click', clearOrders);
  els.resetAllBtn.addEventListener('click', resetAll);
}

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  renderAdmin();
});

window.editProduct = editProduct;
window.toggleProduct = toggleProduct;
window.deleteProduct = deleteProduct;
