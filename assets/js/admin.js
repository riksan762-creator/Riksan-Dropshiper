document.addEventListener('DOMContentLoaded', () => {
    let pin = prompt("Keamanan Sistem: Masukkan PIN Admin");
    if(pin !== CONFIG.adminPin) {
        alert("Akses Ditolak! PIN Salah.");
        window.location.href = "index.html";
        return;
    }
    renderTable();
});

// Tambah Produk
document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const newProduct = {
        id: Date.now(),
        name: document.getElementById('pName').value,
        category: document.getElementById('pCat').value,
        stock: parseInt(document.getElementById('pStock').value),
        price: parseInt(document.getElementById('pPrice').value),
        image: document.getElementById('pImg').value
    };

    const products = getProducts();
    products.push(newProduct);
    saveProducts(products);
    
    showToast("Produk baru berhasil ditambahkan!", "success");
    this.reset();
    renderTable();
});

// Render Tabel
function renderTable() {
    const products = getProducts();
    const tbody = document.getElementById('adminTable');
    tbody.innerHTML = '';
    
    let totalValue = 0;
    let lowStockCount = 0;

    products.forEach(p => {
        totalValue += (p.price * p.stock);
        if(p.stock <= 3) lowStockCount++;

        let stockLabel = p.stock === 0 ? `<span style="color:#ef4444; font-weight:bold;">Habis</span>` : p.stock;

        tbody.innerHTML += `
            <tr>
                <td><img src="${p.image}" class="img-thumb"></td>
                <td><strong>${p.name}</strong></td>
                <td><span style="background:rgba(56, 189, 248, 0.1); color:#38bdf8; padding:4px 10px; border-radius:20px; font-size:12px;">${p.category}</span></td>
                <td>${stockLabel}</td>
                <td>${formatRupiah(p.price)}</td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button class="btn-action edit" onclick="openEditModal(${p.id})"><i class="fas fa-pen"></i></button>
                        <button class="btn-action delete" onclick="deleteItem(${p.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });

    document.getElementById('totalProducts').innerText = products.length;
    document.getElementById('totalValue').innerText = formatRupiah(totalValue);
    document.getElementById('lowStock').innerText = `${lowStockCount} Item`;
}

// Logika Hapus
function deleteItem(id) {
    if(confirm("Yakin ingin menghapus produk ini secara permanen?")) {
        let products = getProducts().filter(p => p.id !== id);
        saveProducts(products);
        showToast("Produk berhasil dihapus.", "error");
        renderTable();
    }
}

// Modal Edit Buka
function openEditModal(id) {
    const p = getProducts().find(x => x.id === id);
    document.getElementById('eId').value = p.id;
    document.getElementById('eName').value = p.name;
    document.getElementById('eCat').value = p.category;
    document.getElementById('eStock').value = p.stock;
    document.getElementById('ePrice').value = p.price;
    document.getElementById('eImg').value = p.image;
    
    document.getElementById('editModal').style.display = 'flex';
}

// Tutup Modal
function closeEditModal() { document.getElementById('editModal').style.display = 'none'; }

// Simpan Update Edit
document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let products = getProducts();
    let editId = parseInt(document.getElementById('eId').value);
    let pIndex = products.findIndex(x => x.id === editId);
    
    products[pIndex] = {
        id: editId,
        name: document.getElementById('eName').value,
        category: document.getElementById('eCat').value,
        stock: parseInt(document.getElementById('eStock').value),
        price: parseInt(document.getElementById('ePrice').value),
        image: document.getElementById('eImg').value
    };
    
    saveProducts(products);
    closeEditModal();
    renderTable();
    showToast("Data produk berhasil diperbarui!", "success");
});
