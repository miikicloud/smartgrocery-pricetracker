/**
 * data.js
 * Master kategori, satuan ukuran, dan data awal khas mahasiswa rantau
 */

export const CATEGORIES = [
  { id: 'pokok', name: 'Bahan Pokok', icon: 'wheat', color: '#10b981' },
  { id: 'lauk', name: 'Lauk & Protein', icon: 'egg', color: '#f59e0b' },
  { id: 'bumbu', name: 'Bumbu & Instan', icon: 'flame', color: '#ef4444' },
  { id: 'toiletries', name: 'Mandi & Cuci', icon: 'sparkles', color: '#3b82f6' },
  { id: 'camilan', name: 'Camilan & Minum', icon: 'coffee', color: '#8b5cf6' },
  { id: 'lainnya', name: 'Lainnya / Kos', icon: 'package', color: '#64748b' }
];

export const UNITS = [
  { id: 'pcs', label: 'pcs' },
  { id: 'kg', label: 'kg' },
  { id: 'liter', label: 'liter' },
  { id: 'pack', label: 'pack' },
  { id: 'bungkus', label: 'bungkus' },
  { id: 'renteng', label: 'renteng' },
  { id: 'botol', label: 'botol' },
  { id: 'kaleng', label: 'kaleng' }
];

// Template barang belanjaan bulanan anak kos/rantau untuk fitur "Tambah Cepat"
export const QUICK_CATALOG = [
  {
    name: 'Beras Ramos Super 5kg',
    category: 'pokok',
    unit: 'kg',
    defaultQty: 1,
    unitPrice: 76000,
    lastMonthPrice: 72000,
    disc1: 0,
    disc2: 0,
    fixedDiscount: 0,
    notes: 'Stok sebulan anak kos'
  },
  {
    name: 'Minyak Goreng Refill 2 Liter',
    category: 'pokok',
    unit: 'liter',
    defaultQty: 1,
    unitPrice: 35000,
    lastMonthPrice: 38000,
    disc1: 5,
    disc2: 0,
    fixedDiscount: 0,
    notes: 'Promo awal bulan'
  },
  {
    name: 'Telur Ayam Ras 1kg',
    category: 'lauk',
    unit: 'kg',
    defaultQty: 1,
    unitPrice: 28500,
    lastMonthPrice: 28500,
    disc1: 0,
    disc2: 0,
    fixedDiscount: 0,
    notes: 'Harga stabil'
  },
  {
    name: 'Indomie Goreng (Isi 5 pcs)',
    category: 'bumbu',
    unit: 'pack',
    defaultQty: 2,
    unitPrice: 15500,
    lastMonthPrice: 14500,
    disc1: 0,
    disc2: 0,
    fixedDiscount: 0,
    notes: 'Penyelamat akhir bulan'
  },
  {
    name: 'Sabun Mandi Cair Refill 450ml',
    category: 'toiletries',
    unit: 'pcs',
    defaultQty: 1,
    unitPrice: 24000,
    lastMonthPrice: 26000,
    disc1: 20,
    disc2: 10,
    fixedDiscount: 0,
    notes: 'Promo bertingkat 20% + 10%'
  },
  {
    name: 'Deterjen Bubuk Konsentrat 800g',
    category: 'toiletries',
    unit: 'pack',
    defaultQty: 1,
    unitPrice: 21000,
    lastMonthPrice: 19500,
    disc1: 0,
    disc2: 0,
    fixedDiscount: 0,
    notes: 'Kebutuhan mencuci baju'
  },
  {
    name: 'Pasta Gigi Fresh 190g',
    category: 'toiletries',
    unit: 'pcs',
    defaultQty: 1,
    unitPrice: 16500,
    lastMonthPrice: 17000,
    disc1: 15,
    disc2: 0,
    fixedDiscount: 0,
    notes: 'Diskon 15%'
  },
  {
    name: 'Kopi Susu Sachet (1 Renteng/10s)',
    category: 'camilan',
    unit: 'renteng',
    defaultQty: 1,
    unitPrice: 13500,
    lastMonthPrice: 13000,
    disc1: 0,
    disc2: 0,
    fixedDiscount: 0,
    notes: 'Teman nugas malam'
  },
  {
    name: 'Kecap Manis Refill 520ml',
    category: 'bumbu',
    unit: 'botol',
    defaultQty: 1,
    unitPrice: 18000,
    lastMonthPrice: 18000,
    disc1: 0,
    disc2: 0,
    fixedDiscount: 0,
    notes: 'Stok masak telur kecap'
  },
  {
    name: 'Nugget Ayam Crispy 500g',
    category: 'lauk',
    unit: 'pack',
    defaultQty: 1,
    unitPrice: 42000,
    lastMonthPrice: 48000,
    disc1: 25,
    disc2: 10,
    fixedDiscount: 2000,
    notes: 'Promo jumbo 25% + 10% + kupon 2rb'
  }
];

// Data awal keranjang belanja (Seed data aktif saat pertama buka)
export const INITIAL_GROCERY_ITEMS = [
  {
    id: 'item_1',
    name: 'Beras Ramos Super 5kg',
    category: 'pokok',
    unit: 'kg',
    qty: 1,
    unitPrice: 76000,
    lastMonthPrice: 72000,
    disc1: 0,
    disc2: 0,
    fixedDiscount: 0,
    inCart: true,
    notes: 'Naik Rp 4.000 dibanding bulan lalu'
  },
  {
    id: 'item_2',
    name: 'Minyak Goreng Refill 2 Liter',
    category: 'pokok',
    unit: 'liter',
    qty: 1,
    unitPrice: 35000,
    lastMonthPrice: 38000,
    disc1: 10,
    disc2: 0,
    fixedDiscount: 0,
    inCart: true,
    notes: 'Lagi ada promo potongan 10%'
  },
  {
    id: 'item_3',
    name: 'Telur Ayam Ras 1kg',
    category: 'lauk',
    unit: 'kg',
    qty: 1,
    unitPrice: 28500,
    lastMonthPrice: 28500,
    disc1: 0,
    disc2: 0,
    fixedDiscount: 0,
    inCart: true,
    notes: 'Harga stabil sama persis'
  },
  {
    id: 'item_4',
    name: 'Indomie Goreng (Isi 5 pcs)',
    category: 'bumbu',
    unit: 'pack',
    qty: 2,
    unitPrice: 15500,
    lastMonthPrice: 14500,
    disc1: 0,
    disc2: 0,
    fixedDiscount: 0,
    inCart: true,
    notes: 'Sedikit naik Rp 1.000 per pack'
  },
  {
    id: 'item_5',
    name: 'Sabun Mandi Cair Refill 450ml',
    category: 'toiletries',
    unit: 'pcs',
    qty: 1,
    unitPrice: 28000,
    lastMonthPrice: 27000,
    disc1: 50,
    disc2: 20,
    fixedDiscount: 0,
    inCart: true,
    notes: 'Promo heboh bertingkat 50% + 20%!'
  },
  {
    id: 'item_6',
    name: 'Nugget Ayam Crispy 500g',
    category: 'lauk',
    unit: 'pack',
    qty: 1,
    unitPrice: 42000,
    lastMonthPrice: 45000,
    disc1: 15,
    disc2: 5,
    fixedDiscount: 0,
    inCart: false,
    notes: 'Masih di rak pendingin, belum diambil'
  }
];

export const INITIAL_BUDGET_CONFIG = {
  budgetCap: 350000, // Rp 350.000 batas saku mahasiswa rantau
  safetyBuffer: 15000, // Rp 15.000 cadangan kresek belanja + parkir motor
  enableSoundFeedback: true,
  enableVibrationFeedback: true
};

// Riwayat bulan lalu sebagai database pembanding historis
export const SAMPLE_HISTORY_SESSIONS = [
  {
    id: 'hist_sep_2026',
    date: '15 September 2026',
    totalSpent: 312000,
    budgetCap: 350000,
    totalItems: 8,
    status: 'safe',
    notes: 'Belanja bulanan hemat awal semester',
    items: [
      { name: 'Beras Ramos Super 5kg', unitPrice: 72000, qty: 1, total: 72000 },
      { name: 'Minyak Goreng Refill 2 Liter', unitPrice: 38000, qty: 1, total: 38000 },
      { name: 'Telur Ayam Ras 1kg', unitPrice: 28500, qty: 1, total: 28500 },
      { name: 'Indomie Goreng (Isi 5 pcs)', unitPrice: 14500, qty: 2, total: 29000 },
      { name: 'Deterjen Bubuk 800g', unitPrice: 19500, qty: 1, total: 19500 },
      { name: 'Kopi Susu Sachet (Renteng)', unitPrice: 13000, qty: 1, total: 13000 },
      { name: 'Pasta Gigi Fresh 190g', unitPrice: 17000, qty: 1, total: 17000 },
      { name: 'Sabun Mandi Cair Refill', unitPrice: 27000, qty: 1, total: 27000 }
    ]
  },
  {
    id: 'hist_aug_2026',
    date: '12 Agustus 2026',
    totalSpent: 348500,
    budgetCap: 350000,
    totalItems: 9,
    status: 'critical',
    notes: 'Hampir overbudget karena beli camilan lebih',
    items: [
      { name: 'Beras Ramos Super 5kg', unitPrice: 70000, qty: 1, total: 70000 },
      { name: 'Minyak Goreng 2L', unitPrice: 36000, qty: 1, total: 36000 },
      { name: 'Telur Ayam 1kg', unitPrice: 29000, qty: 1, total: 29000 }
    ]
  }
];
