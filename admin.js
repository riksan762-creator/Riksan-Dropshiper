/* =========================================================
   RIKSAN DROPSHIP — admin panel logic
   Login sederhana + CRUD produk via localStorage
   ========================================================= */

const LS_PRODUCTS = "riksan_products";
const LS_SETTINGS = "riksan_settings";
const LS_AUTH = "riksan_admin_auth";

const ADMIN_USER = "admin";
const ADMIN_PASS = "riksan123";

const DEFAULT_SETTINGS = {
  namaToko: "Riksan Dropship",
  tagline: "Belanja Sat-Set, Chat Admin, Barang Meluncur",
  noWA: "6282113945743",
  alamat: "Gudang Titipan — Kirim dari Supplier Terpercaya",
  topbarText: "📦 Kirim ke seluruh Indonesia — dari supplier langsung ke pembeli",
  linkShopee: "",
};

const DEFAULT_PRODUCTS = [
  {
    id: "P001",
    nama: "Kaos Oversize Katun 24s",
    kategori: "Fashion Pria",
    harga: 89000,
    hargaCoret: 120000,
    stok: 24,
    gambar: "https://placehold.co/500x500/1B1030/FBF6EC?text=Kaos+Oversize",
    deskripsi: "Bahan katun combed 24s, adem, jahitan rapi."
  },
  {
    id: "P002",
    nama: "Tas Selempang Mini Kanvas",
    kategori: "Tas & Aksesoris",
    harga: 65000,
    hargaCoret: null,
    stok: 15,
    gambar: "https://placehold.co/500x500/E63E7F/FBF6EC?text=Tas+Selempang",
    deskripsi: "Kanvas tebal anti sobek, muat HP + dompet."
  },
  {
    id: "P003",
    nama: "Skincare Serum Niacinamide 20ml",
    kategori: "Kecantikan",
    harga: 45000,
    hargaCoret: null,
    stok: 0,
    gambar: "https://placehold.co/500x500/12897A/FBF6EC?text=Serum+Niacinamide",
    deskripsi: "Serum wajah mencerahkan, BPOM."
  },
  {
    id: "P004",
    nama: "Sepatu Sneakers Sport Grip",
    kategori: "Sepatu",
    harga: 149000,
    hargaCoret: 199000,
    stok: 8,
    gambar: "https://placehold.co/500x500/1B1030/C6FF3D?text=Sneakers",
    deskripsi: "Outsole grip anti licin, size 39-44."
  },
  {
    id: "P005",
    nama: "Case HP Anti Crack Bening",
    kategori: "Aksesoris HP",
    harga: 19000,
    hargaCoret: null,
    stok: 50,
    gambar: "https://placehold.co/500x500/B8215C/FBF6EC?text=Case+HP",
    deskripsi: "Silikon lentur, presisi lubang kamera."
  },
  {
    id: "P006",
    nama: "Botol Minum Lipat 500ml",
    kategori: "Peralatan Harian",
    harga: 35000,
    hargaCoret: null,
    stok: 30,
    gambar: "https://placehold.co/500x500/3A2C52/FBF6EC?text=Botol+Lipat",
    deskripsi: "Silikon food grade, bisa dilipat kecil."
  }
];


/* =========================================================
   STORAGE
   ========================================================= */

function getProducts() {
  const raw = localStorage.getItem(LS_PRODUCTS);

  if (!raw) {
    const defaults = DEFAULT_PRODUCTS.map(normalizeProduct);

    localStorage.setItem(
      LS_PRODUCTS,
      JSON.stringify(defaults)
    );

    return defaults;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return DEFAULT_PRODUCTS.map(normalizeProduct);
    }

    const normalized = parsed.map(normalizeProduct);

    // Simpan ulang agar format data selalu konsisten
    localStorage.setItem(
      LS_PRODUCTS,
      JSON.stringify(normalized)
    );

    return normalized;

  } catch {
    const defaults = DEFAULT_PRODUCTS.map(normalizeProduct);

    localStorage.setItem(
      LS_PRODUCTS,
      JSON.stringify(defaults)
    );

    return defaults;
  }
}


function normalizeProduct(product) {
  return {
    id: product.id || genId(),

    nama: String(product.nama || ""),

    kategori: String(product.kategori || "Lainnya"),

    harga: Number(product.harga) || 0,

    hargaCoret:
      product.hargaCoret !== null &&
      product.hargaCoret !== undefined &&
      product.hargaCoret !== ""
        ? Number(product.hargaCoret)
        : null,

    stok: Number(product.stok) || 0,

    gambar:
      product.gambar ||
      "https://placehold.co/500x500/1B1030/FBF6EC?text=Produk",

    deskripsi: String(product.deskripsi || "")
  };
}


function saveProducts(list) {
  localStorage.setItem(
    LS_PRODUCTS,
    JSON.stringify(list)
  );
}


function getSettings() {
  const raw = localStorage.getItem(LS_SETTINGS);

  if (!raw) {
    localStorage.setItem(
      LS_SETTINGS,
      JSON.stringify(DEFAULT_SETTINGS)
    );

    return {
      ...DEFAULT_SETTINGS
    };
  }

  try {
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(raw)
    };
  } catch {
    return {
      ...DEFAULT_SETTINGS
    };
  }
}


function saveSettings(settingsData) {
  localStorage.setItem(
    LS_SETTINGS,
    JSON.stringify(settingsData)
  );
}


function rupiah(n) {
  return "Rp" + Number(n || 0).toLocaleString("id-ID");
}


function genId() {
  return "P" +
    Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase();
}


/* =========================================================
   IMAGE COMPRESS
   ========================================================= */

function compressImage(
  file,
  maxDim = 700,
  startQuality = 0.72
) {
  return new Promise((resolve, reject) => {

    if (!file.type.startsWith("image/")) {
      reject(new Error("File bukan gambar"));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Gagal membaca file"));
    };

    reader.onload = () => {

      const img = new Image();

      img.onerror = () => {
        reject(new Error("Gagal memuat gambar"));
      };

      img.onload = () => {

        let {
          width,
          height
        } = img;

        if (
          width > height &&
          width > maxDim
        ) {
          height = Math.round(
            height * (maxDim / width)
          );

          width = maxDim;

        } else if (
          height > maxDim
        ) {
          width = Math.round(
            width * (maxDim / height)
          );

          height = maxDim;
        }

        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        let quality = startQuality;

        let dataUrl =
          canvas.toDataURL(
            "image/jpeg",
            quality
          );

        while (
          dataUrl.length > 400000 &&
          quality > 0.35
        ) {
          quality -= 0.1;

          dataUrl =
            canvas.toDataURL(
              "image/jpeg",
              quality
            );
        }

        resolve(dataUrl);
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let products = [];
let settings = {};
let editingId = null;
let tableSearch = "";
let tableKategori = "Semua";


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const loginForm =
      document.getElementById(
        "loginForm"
      );

    const shell =
      document.getElementById(
        "adminShell"
      );

    const loginWrap =
      document.getElementById(
        "loginWrap"
      );


    if (
      sessionStorage.getItem(
        LS_AUTH
      ) === "true"
    ) {
      boot();
    }


    loginForm?.addEventListener(
      "submit",
      (e) => {

        e.preventDefault();

        const username =
          document
            .getElementById(
              "loginUser"
            )
            .value
            .trim();

        const password =
          document
            .getElementById(
              "loginPass"
            )
            .value;

        const error =
          document.getElementById(
            "loginError"
          );


        if (
          username === ADMIN_USER &&
          password === ADMIN_PASS
        ) {

          sessionStorage.setItem(
            LS_AUTH,
            "true"
          );

          error.classList.remove(
            "show"
          );

          boot();

        } else {

          error.textContent =
            "Username atau password salah. Coba lagi.";

          error.classList.add(
            "show"
          );
        }
      }
    );


    document
      .getElementById(
        "logoutBtn"
      )
      ?.addEventListener(
        "click",
        () => {

          sessionStorage.removeItem(
            LS_AUTH
          );

          location.reload();
        }
      );


    function boot() {

      loginWrap.style.display =
        "none";

      shell.style.display =
        "flex";

      products =
        getProducts();

      settings =
        getSettings();

      renderAll();

      bindShellUI();
    }
  }
);


/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {

  renderStats();

  renderTable();

  renderKategoriFilter();

  fillSettingsForm();
}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */

function renderStats() {

  const totalProduk =
    document.getElementById(
      "statProduk"
    );

  const totalStok =
    document.getElementById(
      "statStok"
    );

  const stokHabis =
    document.getElementById(
      "statHabis"
    );

  const totalKategori =
    document.getElementById(
      "statKategori"
    );

  const waDisplay =
    document.getElementById(
      "waNumberDisplay"
    );


  if (totalProduk) {
    totalProduk.textContent =
      products.length;
  }

  if (totalStok) {
    totalStok.textContent =
      products.reduce(
        (total, product) =>
          total +
          Number(product.stok || 0),
        0
      );
  }

  if (stokHabis) {
    stokHabis.textContent =
      products.filter(
        product =>
          Number(product.stok) <= 0
      ).length;
  }

  if (totalKategori) {
    totalKategori.textContent =
      new Set(
        products.map(
          product =>
            product.kategori
        )
      ).size;
  }

  if (waDisplay) {
    waDisplay.textContent =
      "+" + settings.noWA;
  }
}


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function renderKategoriFilter() {

  const select =
    document.getElementById(
      "filterKategori"
    );

  if (!select) return;

  const current =
    select.value ||
    "Semua";

  const kategoris = [
    "Semua",
    ...new Set(
      products.map(
        product =>
          product.kategori
      )
    )
  ];

  select.innerHTML =
    kategoris
      .map(
        kategori =>
          `<option value="${kategori}">
            ${kategori}
          </option>`
      )
      .join("");

  select.value =
    kategoris.includes(current)
      ? current
      : "Semua";
}


/* =========================================================
   FILTER PRODUCTS
   ========================================================= */

function filteredList() {

  return products.filter(
    product => {

      const matchKategori =
        tableKategori === "Semua" ||
        product.kategori ===
          tableKategori;

      const matchSearch =
        product.nama
          .toLowerCase()
          .includes(
            tableSearch.toLowerCase()
          );

      return (
        matchKategori &&
        matchSearch
      );
    }
  );
}


/* =========================================================
   PRODUCT TABLE
   ========================================================= */

function renderTable() {

  const tbody =
    document.getElementById(
      "productTableBody"
    );

  if (!tbody) return;

  const list =
    filteredList();


  if (list.length === 0) {

    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">
          Belum ada produk.
          Klik "Tambah Produk"
          untuk mulai mengisi katalog.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    list
      .map(product => {

        const habis =
          Number(product.stok) <= 0;


        const hasHargaCoret =
          product.hargaCoret !== null &&
          product.hargaCoret !== undefined &&
          Number(product.hargaCoret) >
            Number(product.harga);


        return `
          <tr>

            <td>
              <div class="prod-name-cell">

                <img
                  class="prod-thumb"
                  src="${product.gambar}"
                  alt="${product.nama}"
                >

                <div class="txt">
                  <b>${product.nama}</b>
                  <span>${product.id}</span>
                </div>

              </div>
            </td>

            <td>
              ${product.kategori}
            </td>

            <td>

              ${
                hasHargaCoret
                  ? `
                    <span
                      style="
                        text-decoration:
                          line-through;
                        color:
                          var(--ink-soft);
                        font-size:
                          11px;
                        display:
                          block;
                      "
                    >
                      ${rupiah(
                        product.hargaCoret
                      )}
                    </span>
                  `
                  : ""
              }

              ${rupiah(product.harga)}

            </td>

            <td>
              ${product.stok}
            </td>

            <td>
              <span
                class="pill ${
                  habis
                    ? "habis"
                    : "ready"
                }"
              >
                ${
                  habis
                    ? "Stok Habis"
                    : "Ready"
                }
              </span>
            </td>

            <td>
              <div class="row-actions">

                <button
                  class="edit"
                  data-edit="${product.id}"
                >
                  Edit
                </button>

                <button
                  class="del"
                  data-del="${product.id}"
                >
                  Hapus
                </button>

              </div>
            </td>

          </tr>
        `;
      })
      .join("");


  tbody
    .querySelectorAll(
      "[data-edit]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            openProductModal(
              button.dataset.edit
            )
        );
      }
    );


  tbody
    .querySelectorAll(
      "[data-del]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            deleteProduct(
              button.dataset.del
            )
        );
      }
    );
}


/* =========================================================
   OPEN PRODUCT MODAL
   ========================================================= */

function openProductModal(id) {

  editingId =
    id || null;

  const product =
    id
      ? products.find(
          p =>
            p.id === id
        )
      : null;


  document.getElementById(
    "modalTitle"
  ).textContent =
    product
      ? "Edit Produk"
      : "Tambah Produk";


  document.getElementById(
    "fNama"
  ).value =
    product?.nama ||
    "";


  document.getElementById(
    "fKategori"
  ).value =
    product?.kategori ||
    "";


  document.getElementById(
    "fHarga"
  ).value =
    product?.harga ??
    "";


  document.getElementById(
    "fHargaCoret"
  ).value =
    product?.hargaCoret ??
    "";


  document.getElementById(
    "fStok"
  ).value =
    product?.stok ??
    "";


  document.getElementById(
    "fDeskripsi"
  ).value =
    product?.deskripsi ||
    "";


  document.getElementById(
    "fGambar"
  ).value =
    product?.gambar ||
    "";


  document.getElementById(
    "fGambarFile"
  ).value =
    "";


  document.getElementById(
    "fGambarUrl"
  ).value =
    product?.gambar &&
    product.gambar.startsWith(
      "http"
    )
      ? product.gambar
      : "";


  updateImgPreview();


  document
    .getElementById(
      "productModal"
    )
    .classList.add(
      "show"
    );
}


/* =========================================================
   CLOSE PRODUCT MODAL
   ========================================================= */

function closeProductModal() {

  document
    .getElementById(
      "productModal"
    )
    .classList.remove(
      "show"
    );

  editingId =
    null;
}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

function updateImgPreview() {

  const url =
    document
      .getElementById(
        "fGambar"
      )
      .value
      .trim();

  const box =
    document.getElementById(
      "imgPreviewBox"
    );


  box.classList.remove(
    "loading"
  );


  if (!url) {

    box.innerHTML =
      `
        <span>
          Belum ada foto —
          upload di atas
        </span>
      `;

    return;
  }


  box.innerHTML =
    `
      <img
        src="${url}"
        alt="preview"
        onerror="
          this.parentElement.innerHTML =
          '<span>
            Gagal memuat gambar —
            cek URL/file
          </span>'
        "
      >
    `;
}


function setPreviewLoading() {

  const box =
    document.getElementById(
      "imgPreviewBox"
    );

  box.classList.add(
    "loading"
  );

  box.innerHTML =
    `
      <span>
        Mengompres foto...
      </span>
    `;
}


/* =========================================================
   SAVE PRODUCT
   ========================================================= */

function saveProductForm(e) {

  e.preventDefault();


  const nama =
    document
      .getElementById(
        "fNama"
      )
      .value
      .trim();


  const kategori =
    document
      .getElementById(
        "fKategori"
      )
      .value
      .trim();


  const harga =
    Number(
      document
        .getElementById(
          "fHarga"
        )
        .value
    );


  const hargaCoretInput =
    document
      .getElementById(
        "fHargaCoret"
      )
      .value
      .trim();


  const hargaCoret =
    hargaCoretInput !== ""
      ? Number(
          hargaCoretInput
        )
      : null;


  const stok =
    Number(
      document
        .getElementById(
          "fStok"
        )
        .value
    );


  const gambar =
    document
      .getElementById(
        "fGambar"
      )
      .value
      .trim() ||
    `
      https://placehold.co/500x500/
      1B1030/FBF6EC?text=
      ${encodeURIComponent(
        nama ||
        "Produk"
      )}
    `.replace(
      /\s+/g,
      ""
    );


  const deskripsi =
    document
      .getElementById(
        "fDeskripsi"
      )
      .value
      .trim();


  if (
    !nama ||
    !kategori ||
    !Number.isFinite(
      harga
    ) ||
    !Number.isFinite(
      stok
    )
  ) {

    showToast(
      "Lengkapi semua kolom wajib dulu ya"
    );

    return;
  }


  if (
    hargaCoret !== null &&
    (
      !Number.isFinite(
        hargaCoret
      ) ||
      hargaCoret <= harga
    )
  ) {

    showToast(
      "Harga coret harus lebih besar dari harga jual"
    );

    return;
  }


  const productData = {

    nama,

    kategori,

    harga,

    hargaCoret,

    stok,

    gambar,

    deskripsi

  };


  if (editingId) {

    const index =
      products.findIndex(
        product =>
          product.id ===
          editingId
      );


    if (index !== -1) {

      products[index] = {

        ...products[index],

        ...productData

      };
    }


    showToast(
      "Produk berhasil diperbarui"
    );

  } else {

    products.push({

      id: genId(),

      ...productData

    });


    showToast(
      "Produk baru ditambahkan"
    );
  }


  // Pastikan semua data dinormalisasi
  products =
    products.map(
      normalizeProduct
    );


  // Simpan ke localStorage
  saveProducts(
    products
  );


  // Verifikasi data tersimpan
  console.log(
    "Produk tersimpan:",
    JSON.parse(
      localStorage.getItem(
        LS_PRODUCTS
      )
    )
  );


  closeProductModal();

  renderAll();
}


/* =========================================================
   DELETE PRODUCT
   ========================================================= */

function deleteProduct(id) {

  const product =
    products.find(
      p =>
        p.id === id
    );

  if (!product) return;


  if (
    !confirm(
      `Hapus produk "${product.nama}"? Tindakan ini tidak bisa dibatalkan.`
    )
  ) {
    return;
  }


  products =
    products.filter(
      p =>
        p.id !== id
    );


  saveProducts(
    products
  );


  renderAll();


  showToast(
    "Produk dihapus"
  );
}


/* =========================================================
   SETTINGS
   ========================================================= */

function fillSettingsForm() {

  const form =
    document.getElementById(
      "settingsForm"
    );

  if (!form) return;


  document.getElementById(
    "sNamaToko"
  ).value =
    settings.namaToko;


  document.getElementById(
    "sTagline"
  ).value =
    settings.tagline;


  document.getElementById(
    "sTopbar"
  ).value =
    settings.topbarText ||
    "";


  document.getElementById(
    "sNoWA"
  ).value =
    settings.noWA;


  document.getElementById(
    "sAlamat"
  ).value =
    settings.alamat;


  document.getElementById(
    "sLinkShopee"
  ).value =
    settings.linkShopee ||
    "";
}


function saveSettingsForm(e) {

  e.preventDefault();


  settings = {

    namaToko:
      document
        .getElementById(
          "sNamaToko"
        )
        .value
        .trim() ||
      DEFAULT_SETTINGS.namaToko,


    tagline:
      document
        .getElementById(
          "sTagline"
        )
        .value
        .trim(),


    topbarText:
      document
        .getElementById(
          "sTopbar"
        )
        .value
        .trim() ||
      DEFAULT_SETTINGS.topbarText,


    noWA:
      document
        .getElementById(
          "sNoWA"
        )
        .value
        .trim()
        .replace(
          /[^0-9]/g,
          ""
        ),


    alamat:
      document
        .getElementById(
          "sAlamat"
        )
        .value
        .trim(),


    linkShopee:
      document
        .getElementById(
          "sLinkShopee"
        )
        .value
        .trim()

  };


  saveSettings(
    settings
  );


  renderStats();


  showToast(
    "Pengaturan toko disimpan"
  );
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;


function showToast(msg) {

  const toast =
    document.getElementById(
      "toastAdmin"
    );

  if (!toast) return;


  toast.textContent =
    msg;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () =>
        toast.classList.remove(
          "show"
        ),
      2200
    );
}


/* =========================================================
   BIND UI
   ========================================================= */

function bindShellUI() {


  document
    .getElementById(
      "btnAddProduct"
    )
    ?.addEventListener(
      "click",
      () =>
        openProductModal(
          null
        )
    );


  document
    .getElementById(
      "closeProductModal"
    )
    ?.addEventListener(
      "click",
      closeProductModal
    );


  document
    .getElementById(
      "productForm"
    )
    ?.addEventListener(
      "submit",
      saveProductForm
    );


  document
    .getElementById(
      "fGambarFile"
    )
    ?.addEventListener(
      "change",
      async e => {

        const file =
          e.target.files[0];

        if (!file) return;


        document
          .getElementById(
            "fGambarUrl"
          )
          .value =
          "";


        setPreviewLoading();


        try {

          const dataUrl =
            await compressImage(
              file
            );


          document
            .getElementById(
              "fGambar"
            )
            .value =
            dataUrl;


          updateImgPreview();


          const kb =
            Math.round(
              (
                dataUrl.length *
                0.75
              ) / 1024
            );


          document
            .getElementById(
              "uploadHint"
            )
            .textContent =
            `Foto siap dipakai (~${kb} KB setelah dikompres).`;

        } catch (error) {

          showToast(
            error.message ||
            "Gagal memproses foto"
          );


          updateImgPreview();
        }
      }
    );


  document
    .getElementById(
      "fGambarUrl"
    )
    ?.addEventListener(
      "input",
      e => {

        document
          .getElementById(
            "fGambarFile"
          )
          .value =
          "";


        document
          .getElementById(
            "fGambar"
          )
          .value =
          e.target.value.trim();


        updateImgPreview();
      }
    );


  document
    .getElementById(
      "settingsForm"
    )
    ?.addEventListener(
      "submit",
      saveSettingsForm
    );


  document
    .getElementById(
      "tableSearch"
    )
    ?.addEventListener(
      "input",
      e => {

        tableSearch =
          e.target.value;

        renderTable();
      }
    );


  document
    .getElementById(
      "filterKategori"
    )
    ?.addEventListener(
      "change",
      e => {

        tableKategori =
          e.target.value;

        renderTable();
      }
    );


  document
    .getElementById(
      "menuToggle"
    )
    ?.addEventListener(
      "click",
      () => {

        document
          .getElementById(
            "sidebar"
          )
          .classList.toggle(
            "open"
          );
      }
    );


  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".nav-item"
              )
              .forEach(
                item =>
                  item.classList.remove(
                    "active"
                  )
              );


            document
              .querySelectorAll(
                ".view-panel"
              )
              .forEach(
                panel =>
                  panel.classList.remove(
                    "active"
                  )
              );


            button.classList.add(
              "active"
            );


            document
              .getElementById(
                button.dataset.view
              )
              .classList.add(
                "active"
              );


            document
              .getElementById(
                "sidebar"
              )
              .classList.remove(
                "open"
              );
          }
        );
      }
    );
}
