const defaultProducts = [
    { id: 1, name: "Adidas Samba OG White Black", price: 1800000, stock: 15, category: "Sepatu", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500" },
    { id: 2, name: "Oversized Black Blazer Edgy", price: 650000, stock: 8, category: "Pakaian", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500" },
    { id: 3, name: "Air Jordan 1 Retro High", price: 2500000, stock: 0, category: "Sepatu", image: "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=500" },
    { id: 4, name: "Futuristic Sling Bag Premium", price: 350000, stock: 20, category: "Aksesoris", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500" }
];

function getProducts() {
    let products = localStorage.getItem('riksan_v2_db');
    if (!products) {
        localStorage.setItem('riksan_v2_db', JSON.stringify(defaultProducts));
        return defaultProducts;
    }
    return JSON.parse(products);
}

function saveProducts(products) {
    localStorage.setItem('riksan_v2_db', JSON.stringify(products));
}
