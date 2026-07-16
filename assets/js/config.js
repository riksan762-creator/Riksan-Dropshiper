const CONFIG = {
    storeName: "Riksan Dropship",
    waNumber: "6282113945743", // Format 62
    adminPin: "0000", // Ganti PIN admin di sini
    currency: "Rp"
};

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}
