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

console.log('--- TEST 3B: VALIDASI 1 EMAIL = 1 AKUN (DUPLIKAT DITOLAK) ---');
const duplicateReg = Auth.register('Budi Kloning', 'budi@smartgrocery.app', 'passwordBaru');
if (duplicateReg.success) {
  throw new Error('Test 3B Gagal: Pendaftaran email duplikat harusnya ditolak!');
}
console.log('✓ Pendaftaran Email Duplikat Berhasil Ditolak:', duplicateReg.message);

console.log('--- TEST 3C: FITUR GANTI AKUN (ACCOUNT SWITCHER) ---');
const regUser2 = Auth.register('Siti Rahma', 'siti@smartgrocery.app', 'siti12345');
const savedAccounts = Auth.getSavedAccounts();
if (savedAccounts.length < 2) {
  throw new Error('Test 3C Gagal: Saved accounts harus menyimpan minimal 2 akun!');
}
const switchRes = Auth.switchAccount(regResult.user.id);
if (!switchRes.success || Auth.getCurrentUser().id !== regResult.user.id) {
  throw new Error('Test 3C Gagal: Beralih akun gagal!');
}
console.log('✓ Account Switcher Berhasil Beralih Akun!');

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

console.log('\n--- TEST 7: BATAS WAKTU SESI LOGIN (SESSION TIMEOUT 5 JAM) ---');
// 7A: Sesi aktif < 5 jam (misal 2 jam lalu) harus tetap bertahan
const TWO_HOURS_AGO = Date.now() - (2 * 60 * 60 * 1000);
store['sg_current_user_session_v1'] = JSON.stringify({
  id: 'user_active_test',
  name: 'User Aktif',
  email: 'active@smartgrocery.app',
  loginTimestamp: TWO_HOURS_AGO,
  loggedInAt: new Date(TWO_HOURS_AGO).toISOString()
});
const activeSession = Auth.getCurrentUser();
if (!activeSession || activeSession.id !== 'user_active_test') {
  throw new Error('Test 7A Gagal: Sesi < 5 jam harusnya tetap bertahan!');
}
console.log('✓ Sesi Login < 5 Jam Berhasil Dipertahankan!');

// 7B: Sesi kadaluwarsa > 5 jam (misal 5.1 jam lalu) harus otomatis logout
const OVER_FIVE_HOURS_AGO = Date.now() - (5.1 * 60 * 60 * 1000);
store['sg_current_user_session_v1'] = JSON.stringify({
  id: 'user_expired_test',
  name: 'User Expired',
  email: 'expired@smartgrocery.app',
  loginTimestamp: OVER_FIVE_HOURS_AGO,
  loggedInAt: new Date(OVER_FIVE_HOURS_AGO).toISOString()
});
const expiredSession = Auth.getCurrentUser();
if (expiredSession !== null || store['sg_current_user_session_v1']) {
  throw new Error('Test 7B Gagal: Sesi > 5 jam harus otomatis di-logout!');
}
console.log('✓ Sesi Login > 5 Jam Berhasil Otomatis Logout!');

console.log('\n--- TEST 8: NOTIFIKASI AKUN TIDAK TERDAFTAR ---');
const unregResult = Auth.login('tidak_terdaftar@domain.com', 'password123');
if (unregResult.success || !unregResult.notRegistered || !unregResult.message.includes('Akun tidak terdaftar')) {
  throw new Error('Test 8 Gagal: Akun tidak terdaftar harus mengembalikan notRegistered: true!');
}
console.log('✓ Notifikasi Akun Tidak Terdaftar Lulus:', unregResult.message);

console.log('\n--- TEST 9: NOTIFIKASI PASSWORD SALAH SPESIFIK ---');
const wrongPassResult = Auth.login('budi@smartgrocery.app', 'SalahPasswordNya');
if (wrongPassResult.success || !wrongPassResult.wrongPassword || !wrongPassResult.message.includes('Password yang Anda masukkan salah')) {
  throw new Error('Test 9 Gagal: Password salah harus mengembalikan wrongPassword: true!');
}
console.log('✓ Notifikasi Password Salah Lulus:', wrongPassResult.message);

console.log('\n--- TEST 10: CROSS-DEVICE USER UPSERT ---');
const crossDeviceUser = {
  id: 'user_cross_99',
  name: 'Lina Marlina',
  email: 'lina@domain.com',
  password: 'marlinapassword'
};
Auth.upsertUser(crossDeviceUser);
const linaLogin = Auth.login('lina@domain.com', 'marlinapassword');
if (!linaLogin.success || linaLogin.user.id !== 'user_cross_99') {
  throw new Error('Test 10 Gagal: Akun upsert lintas perangkat gagal login!');
}
console.log('✓ Akun Lintas Perangkat Berhasil Login!');

console.log('\n--- TEST 11: VALIDASI PASSWORD SALAH TANPA SURUH BIKIN AKUN BARU ---');
// 11A: Login via username 'budi' dengan password salah
const wrongByUsername = Auth.login('budi', 'PasswordNgawur');
if (!wrongByUsername.wrongPassword || wrongByUsername.notRegistered) {
  throw new Error('Test 11A Gagal: Login via username dengan password salah harusnya wrongPassword: true!');
}
// 11B: Login via nama 'Budi Santoso' dengan password salah
const wrongByName = Auth.login('Budi Santoso', 'PasswordNgawur');
if (!wrongByName.wrongPassword || wrongByName.notRegistered) {
  throw new Error('Test 11B Gagal: Login via nama dengan password salah harusnya wrongPassword: true!');
}
console.log('✓ Password Salah Melalui Email, Username, atau Nama Tetap Memberikan Error Password Salah (Bukan Bikin Akun Baru)!');

console.log('\n>> SEMUA TEST SISTEM AUTH, CLOUD SYNC & ONSNAPSHOT LULUS 100%! <<');
