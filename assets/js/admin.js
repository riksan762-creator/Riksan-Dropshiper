document.addEventListener('DOMContentLoaded', () => {
    // Keamanan PIN Sederhana
    let pin = prompt("Keamanan Sistem: Masukkan PIN Admin");
    if(pin !== CONFIG.adminPin) {
        alert("Akses Ditolak! PIN Salah.");
        window.location.href = "index.html";
        return;
    }
    renderTable();
});

// Submit Form Produk Baru
document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newProduct = {
        id: Date.now(),
        name: document.getElementById('pName').value,
        category: document.getElementById('pCat').value,
        price: parseInt(document.getElementById('pPrice').value),
        image: document.getElementById('pImg').value
    };

    const products = getProducts();
    products.push(newProduct);
    saveProducts(products);
    
    showToast("Produk berhasil ditambahkan!", "success");
    this.reset();
    renderTable();
});

// Render Tabel & Kalkulasi Aset
function renderTable() {
    const products = getProducts();
    const tbody = document.getElementById('adminTable');
    tbody.innerHTML = '';
    
    let totalValue = 0;

    if(products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada produk.</td></tr>`;
    }

    products.forEach(p => {
        totalValue += p.price;
        tbody.innerHTML += `
            <tr>
                <td><img src="${p.image}" class="img-thumb"></td>
                <td><strong>${p.name}</strong></td>
                <td><span style="background:rgba(56, 189, 248, 0.1); color:#38bdf8; padding:4px 10px; border-radius:20px; font-size:12px;">${p.category}</span></td>
                <td>${formatRupiah(p.price)}</td>
                <td><button class="btn-del" onclick="deleteItem(${p.id})"><i class="fas fa-trash"></i> Hapus</button></td>
            </tr>
        `;
    });

    // Update Statistik
    document.getElementById('totalProducts').innerText = products.length;
    document.getElementById('totalValue').innerText = formatRupiah(totalValue);
}

// Hapus Produk
function deleteItem(id) {
    if(confirm("Yakin ingin menghapus produk ini secara permanen?")) {
        let products = getProducts().filter(p => p.id !== id);
        saveProducts(products);
        showToast("Produk berhasil dihapus.", "error");
        renderTable();
    }
}
