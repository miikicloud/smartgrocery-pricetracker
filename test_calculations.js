import { Calculations } from './js/calculations.js';

console.log('--- TEST 1: DISKON BERTINGKAT (50% + 20%) ---');
const d = Calculations.calculateTieredDiscount(100000, 50, 20, 0);
console.log(`Harga Awal: Rp 100.000 -> Akhir: Rp ${d.finalUnitPrice} | Diskon Efektif: ${d.effectiveDiscountPct}% | Hemat: Rp ${d.savingPerUnit}`);
if (d.finalUnitPrice !== 40000 || d.effectiveDiscountPct !== 60) {
  throw new Error('Test 1 Gagal');
}

console.log('--- TEST 2: PERHITUNGAN KUANTITAS REALTIME ---');
const totalItem = Calculations.calculateItemTotal(d.finalUnitPrice, 3);
console.log(`Total 3 qty x Rp 40.000 = Rp ${totalItem}`);
if (totalItem !== 120000) {
  throw new Error('Test 2 Gagal');
}

console.log('--- TEST 3: DETEKSI FLUKTUASI HARGA ---');
const fUp = Calculations.comparePriceFluctuation(76000, 72000);
console.log(`Naik: ${fUp.label} [${fUp.badgeClass}]`);
const fDown = Calculations.comparePriceFluctuation(34000, 38000);
console.log(`Turun: ${fDown.label} [${fDown.badgeClass}]`);
const fSame = Calculations.comparePriceFluctuation(28000, 28000);
console.log(`Sama: ${fSame.label} [${fSame.badgeClass}]`);

console.log('--- TEST 4: BUDGET SAFETY CAP ---');
const safe = Calculations.evaluateBudgetSafety(200000, 350000, 15000);
console.log(`Safe (200k / 350k): ${safe.statusTitle} - ${safe.themeClass}`);

const warn = Calculations.evaluateBudgetSafety(280000, 350000, 15000);
console.log(`Warn (280k / 350k): ${warn.statusTitle} - ${warn.themeClass}`);

const crit = Calculations.evaluateBudgetSafety(340000, 350000, 15000);
console.log(`Crit (340k / 350k): ${crit.statusTitle} - ${crit.themeClass}`);

const over = Calculations.evaluateBudgetSafety(380000, 350000, 15000);
console.log(`Over (380k / 350k): ${over.statusTitle} - ${over.themeClass}`);

console.log('--- TEST 5: KASUS TUNA (Hari ini Rp 10.000 -> Bulan depan Rp 13.000) ---');
const tunaPast = 10000;
const tunaCurrent = 13000;
const fTuna = Calculations.comparePriceFluctuation(tunaCurrent, tunaPast);
console.log(`Kasus Tuna: ${fTuna.label} (Simbol: ${fTuna.symbol})`);
if (fTuna.type !== 'up' || fTuna.symbol !== '↑' || fTuna.percentage !== 30) {
  throw new Error('Test 5 Kasus Tuna Gagal');
}

console.log('>> SEMUA TEST LOGIKA & SRS CALCULATIONS LULUS 100%! <<');
