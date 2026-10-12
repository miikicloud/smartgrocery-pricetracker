/**
 * test_auth.js
 * Test Verifikasi Modul Auth, Super Admin Mikayla Subrata & Cloud Sync
 */

// Mock localStorage for Node.js environment
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); }
};

import { Auth, SUPER_ADMIN_CREDENTIALS, DEFAULT_APP_CONFIG } from './js/auth.js';

console.log('--- TEST 1: CREDENTIALS SUPER ADMIN MIKAYLA SUBRATA ---');
console.log('Admin Email:', SUPER_ADMIN_CREDENTIALS.email);
console.log('Admin Password:', SUPER_ADMIN_CREDENTIALS.password);
if (
  SUPER_ADMIN_CREDENTIALS.email !== 'mikaylasubrata@mutiarabangsa.sch.id' ||
  SUPER_ADMIN_CREDENTIALS.password !== 'Mikayla2'
) {
  throw new Error('Test 1 Gagal: Email atau Password Super Admin tidak sesuai spesifikasi!');
}
console.log('✓ Credentials Super Admin Sesuai!');

console.log('--- TEST 2: LOGIN SUPER ADMIN ---');
const adminLogin = Auth.login('mikaylasubrata@mutiarabangsa.sch.id', 'Mikayla2');
console.log('Login result:', adminLogin);
if (!adminLogin.success || !adminLogin.isAdmin || adminLogin.user.role !== 'admin') {
  throw new Error('Test 2 Gagal: Login Super Admin gagal!');
}
if (!Auth.isAdmin()) {
  throw new Error('Test 2 Gagal: Auth.isAdmin() harus bernilai true!');
}
console.log('✓ Login Super Admin Berhasil!');

console.log('--- TEST 3: REJEKSI LOGIN JIKA PASSWORD SALAH ---');
Auth.logout();
const wrongPass = Auth.login('mikaylasubrata@mutiarabangsa.sch.id', 'SalahPassword');
if (wrongPass.success) {
  throw new Error('Test 3 Gagal: Seharusnya login ditolak jika password salah!');
}
console.log('✓ Rejeki Password Salah Berhasil!');

console.log('--- TEST 4: REGISTRASI & LOGIN SISWA BIASA ---');
const regResult = Auth.register('Siswa Budi', 'budi@sekolah.sch.id', 'rahasia123');
console.log('Register result:', regResult);
if (!regResult.success || regResult.user.role !== 'user') {
  throw new Error('Test 4 Gagal: Registrasi siswa biasa gagal!');
}
if (Auth.isAdmin()) {
  throw new Error('Test 4 Gagal: Siswa biasa tidak boleh menjadi admin!');
}
console.log('✓ Registrasi Siswa Berhasil!');

console.log('--- TEST 5: CLOUD SYNC & LOAD ---');
const sampleCart = {
  items: [{ id: '1', name: 'Tuna Kaleng', qty: 2, unitPrice: 10000 }],
  budgetCap: 350000
};
Auth.syncToCloud(regResult.user.id, sampleCart);
const loaded = Auth.loadFromCloud(regResult.user.id);
console.log('Loaded from cloud:', loaded);
if (!loaded || loaded.items[0].name !== 'Tuna Kaleng') {
  throw new Error('Test 5 Gagal: Cloud sync tidak mengembalikan data yang benar!');
}
console.log('✓ Cloud Sync & Restore Berhasil!');

console.log('--- TEST 6: LIVE APP CONFIG EDIT OLEH ADMIN ---');
const newConfig = {
  appName: 'Smart Grocery Mutiara Bangsa',
  appSubtitle: 'Khusus Siswa & Asrama',
  announcement: '📢 Promo Akhir Bulan Diskon 50% + 20%!',
  accentColor: '#6366f1'
};
Auth.saveAppConfig(newConfig);
const activeConfig = Auth.getAppConfig();
console.log('Active App Config:', activeConfig);
if (activeConfig.appName !== newConfig.appName || activeConfig.accentColor !== '#6366f1') {
  throw new Error('Test 6 Gagal: App config tidak tersimpan dengan benar!');
}
console.log('✓ Live Edit App Config Berhasil!');

console.log('\n>> SEMUA TEST SISTEM AKUN, SUPER ADMIN & CLOUD SYNC LULUS 100%! <<');
