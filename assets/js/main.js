let cart = JSON.parse(localStorage.getItem('riksan_cart_db')) || [];
let currentCategory = 'Semua';

// Render Produk ke Layar
function renderProducts(searchQuery = '') {
    const products = getProducts();
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    let filtered = products.filter(p => {
        const matchCategory = currentCategory === 'Semua' || p.category === currentCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:var(--text-muted); padding: 50px;">Produk tidak ditemukan.</p>`;
        return;
    }

    filtered.forEach(p => {
        grid.innerHTML += `
            <div class="product-card">
                <div class="product-badge">${p.category}</div>
                <img src="${p.image}" class="product-img" loading="lazy" alt="${p.name}">
                <div class="product-info">
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-price gradient-text">${formatRupiah(p.price)}</div>
                    <button class="btn-add" onclick="addToCart(${p.id})">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
}

// Filter Kategori
function filterProducts(category) {
    currentCategory = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText === category) btn.classList.add('active');
    });
    renderProducts(document.getElementById('searchInput').value);
}

// Search Real-time
document.getElementById('searchInput').addEventListener('input', (e) => {
    renderProducts(e.target.value);
});

// Keranjang
function addToCart(id) {
    const product = getProducts().find(p => p.id === id);
    const exist = cart.find(item => item.id === id);
    if(exist) {
        exist.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    
    saveCart();
    showToast(`${product.name} masuk keranjang!`, 'success');
}

function updateQty(id, change) {
    const item = cart.find(i => i.id === id);
    if(item) {
        item.qty += change;
        if(item.qty <= 0) cart = cart.filter(i => i.id !== id);
        saveCart();
    }
}

function saveCart() {
    localStorage.setItem('riksan_cart_db', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    document.getElementById('cartBadge').innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartBody = document.getElementById('cartBody');
    let total = 0;
    cartBody.innerHTML = '';

    if(cart.length === 0) {
        cartBody.innerHTML = '<p style="text-align:center; color:gray; margin-top:50px;">Keranjang kosong.</p>';
    }

    cart.forEach(item => {
        total += item.price * item.qty;
        cartBody.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatRupiah(item.price)}</div>
                    <div class="qty-control">
                        <button class="qty-btn" onclick="updateQty(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                        <span style="font-weight:600; width:20px; text-align:center;">${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty(${item.id}, 1)"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
    document.getElementById('cartTotal').innerText = formatRupiah(total);
}

// Buka Tutup Keranjang
function toggleCart() { 
    document.getElementById('cartDrawer').classList.toggle('open'); 
    document.getElementById('cartOverlay').classList.toggle('show');
}

// Checkout WhatsApp
function processCheckout() {
    if(cart.length === 0) {
        showToast('Keranjang masih kosong!', 'error');
        return;
    }
    
    let text = `Halo *${CONFIG.storeName}*,\nSaya ingin melakukan order:\n\n`;
    let total = 0;
    
    cart.forEach((c, i) => {
        text += `▪️ *${c.name}*\n   ${c.qty} x ${formatRupiah(c.price)} = ${formatRupiah(c.price * c.qty)}\n`;
        total += c.price * c.qty;
    });
    
    text += `\n*TOTAL TAGIHAN: ${formatRupiah(total)}*\n\nMohon info nomor rekening / QRIS untuk pembayaran. Terima kasih.`;
    
    // Reset Keranjang
    localStorage.removeItem('riksan_cart_db');
    cart = [];
    updateCartUI();
    toggleCart();
    
    window.open(`https://api.whatsapp.com/send?phone=${CONFIG.waNumber}&text=${encodeURIComponent(text)}`, '_blank');
}

// Eksekusi Awal
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartUI();
});
