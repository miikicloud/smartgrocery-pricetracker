/**
 * test_auth.js
 * Test Verifikasi Modul Auth, Cloud Sync, dan Fitur onSnapshot
 */

// Mock localStorage for test environment
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); }
};

import { Auth } from './js/auth.js';
import { Storage } from './js/storage.js';

console.log('--- TEST 1: REGISTRASI PENGGUNA BARU ---');
const regResult = Auth.register('Budi Santoso', 'budi@smartgrocery.app', 'rahasia123');
console.log('Register result:', regResult);
if (!regResult.success || !regResult.user || regResult.user.email !== 'budi@smartgrocery.app') {
  throw new Error('Test 1 Gagal: Registrasi pengguna gagal!');
}
console.log('✓ Registrasi Pengguna Berhasil!');

console.log('--- TEST 2: LOGIN PENGGUNA ---');
const loginResult = Auth.login('budi@smartgrocery.app', 'rahasia123');
console.log('Login result:', loginResult);
if (!loginResult.success || !loginResult.user) {
  throw new Error('Test 2 Gagal: Login pengguna gagal!');
}
console.log('✓ Login Pengguna Berhasil!');

console.log('--- TEST 3: REJEKSI LOGIN PASSWORD SALAH ---');
const wrongLogin = Auth.login('budi@smartgrocery.app', 'PasswordSalah');
if (wrongLogin.success) {
  throw new Error('Test 3 Gagal: Login dengan password salah harusnya ditolak!');
}
console.log('✓ Proteksi Password Salah Berhasil!');

console.log('--- TEST 4: CLOUD SYNC & RESTORE DATA ---');
const sampleCart = {
  items: [{ id: '1', name: 'Beras Ramos 5kg', qty: 1, unitPrice: 76000 }],
  budgetCap: 350000
};
Auth.syncToCloud(regResult.user.id, sampleCart);
const loaded = Auth.loadFromCloud(regResult.user.id);
console.log('Loaded from cloud:', loaded);
if (!loaded || loaded.items[0].name !== 'Beras Ramos 5kg') {
  throw new Error('Test 4 Gagal: Cloud sync tidak mengembalikan data yang benar!');
}
console.log('✓ Cloud Sync & Restore Berhasil!');

console.log('--- TEST 5: FITUR ONSNAPSHOT REACTIVE LISTENER ---');
let snapshotReceived = null;
const unsubscribe = Storage.onSnapshot((snap) => {
  snapshotReceived = snap;
});

if (!snapshotReceived || !snapshotReceived.items) {
  throw new Error('Test 5 Gagal: onSnapshot tidak menerima initial snapshot!');
}
console.log('✓ Initial onSnapshot Diterima (Total Barang:', snapshotReceived.items.length, ')');

// Trigger update
Storage.saveItems([{ id: 'test_item_1', name: 'Mie Instan', unitPrice: 3500, qty: 5, inCart: true }]);
if (!snapshotReceived || snapshotReceived.items[0].name !== 'Mie Instan') {
  throw new Error('Test 5 Gagal: onSnapshot listener tidak terpanggil saat state berubah!');
}
console.log('✓ Reactive onSnapshot Berhasil Trigger saat Storage Berubah!');

console.log('--- TEST 6: FITUR SNAPSHOT MANAGEMENT (CREATE & RESTORE) ---');
const createdSnap = Storage.createSnapshot('Snapshot Tes Otomatis');
console.log('Snapshot dibuat:', createdSnap.label, 'ID:', createdSnap.id);
const snapshots = Storage.getSnapshots();
if (snapshots.length === 0 || snapshots[0].id !== createdSnap.id) {
  throw new Error('Test 6 Gagal: createSnapshot tidak menyimpan ke array snapshots!');
}
console.log('✓ Create Snapshot Berhasil!');

// Restore snapshot test
const restored = Storage.restoreSnapshot(createdSnap.id);
if (!restored) {
  throw new Error('Test 6 Gagal: restoreSnapshot gagal!');
}
console.log('✓ Restore Snapshot Berhasil!');

unsubscribe();
console.log('\n>> SEMUA TEST SISTEM AUTH, CLOUD SYNC & ONSNAPSHOT LULUS 100%! <<');
