let cart = JSON.parse(localStorage.getItem('riksan_cart_v2')) || [];
let currentCategory = 'Semua';

// Render dengan Info Stok
function renderProducts(searchQuery = '') {
    const products = getProducts();
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    let filtered = products.filter(p => {
        const matchCat = currentCategory === 'Semua' || p.category === currentCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:gray; padding: 50px;">Produk tidak ditemukan.</p>`;
        return;
    }

    filtered.forEach(p => {
        let isOutOfStock = p.stock <= 0;
        let stockDisplay = isOutOfStock ? `<span class="stock-label out"><i class="fas fa-times-circle"></i> Stok Habis</span>` : `<span class="stock-label"><i class="fas fa-box-open"></i> Tersisa: ${p.stock}</span>`;
        let btnStatus = isOutOfStock ? "disabled" : "";
        let btnText = isOutOfStock ? "Kosong" : "<i class='fas fa-shopping-cart'></i> Add to Cart";

        grid.innerHTML += `
            <div class="product-card">
                <div class="product-badge">${p.category}</div>
                <img src="${p.image}" class="product-img" loading="lazy" alt="${p.name}">
                <div class="product-info">
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-price gradient-text">${formatRupiah(p.price)}</div>
                    ${stockDisplay}
                    <button class="btn-add" ${btnStatus} onclick="addToCart(${p.id})">
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
    });
}

function addToCart(id) {
    const product = getProducts().find(p => p.id === id);
    const exist = cart.find(item => item.id === id);
    
    // Cek batas stok
    let currentQtyInCart = exist ? exist.qty : 0;
    if (currentQtyInCart >= product.stock) {
        showToast("Maaf, melebihi stok yang tersedia!", "error");
        return;
    }

    if(exist) exist.qty++;
    else cart.push({ ...product, qty: 1 });
    
    saveCart();
    showToast(`${product.name} masuk keranjang!`, 'success');
}

// ... [Biarkan fungsi filterProducts, updateQty, updateCartUI, toggleCart seperti sebelumnya] ...

function processCheckout() {
    if(cart.length === 0) {
        showToast('Keranjang masih kosong!', 'error');
        return;
    }
    
    let text = `Halo *${CONFIG.storeName}*,\nSaya ingin melakukan order:\n\n`;
    let total = 0;
    let productsDB = getProducts(); // Panggil database asli
    
    cart.forEach((c, i) => {
        text += `▪️ *${c.name}*\n   ${c.qty} x ${formatRupiah(c.price)} = ${formatRupiah(c.price * c.qty)}\n`;
        total += c.price * c.qty;
        
        // KURANGI STOK DI DATABASE LOKAL
        let prodIndex = productsDB.findIndex(p => p.id === c.id);
        if(prodIndex !== -1) {
            productsDB[prodIndex].stock -= c.qty;
        }
    });
    
    text += `\n*TOTAL TAGIHAN: ${formatRupiah(total)}*\n\nMohon info nomor rekening / QRIS untuk pembayaran. Terima kasih.`;
    
    // Simpan stok baru ke LocalStorage
    saveProducts(productsDB);

    // Reset Keranjang
    localStorage.removeItem('riksan_cart_v2');
    cart = [];
    updateCartUI();
    toggleCart();
    renderProducts(); // Refresh layar katalog
    
    window.open(`https://api.whatsapp.com/send?phone=${CONFIG.waNumber}&text=${encodeURIComponent(text)}`, '_blank');
}
