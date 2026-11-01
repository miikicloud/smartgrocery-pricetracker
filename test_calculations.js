/**
 * test_calculations.js
 * Unit Test Komprehensif Berdasarkan PRD Smart Grocery Tracker & Budget Safety System
 * Evaluasi Daily Test 2 (DT2 Rubrik F-01 s/d F-05)
 */

import { Calculations } from './js/calculations.js';

console.log('================================================================');
console.log('🧪 PENGUJIAN KALKULASI & LOGIKA MATEMATIS SESUAI SPESIFIKASI PRD');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// SRS F-03: ENGINE DISKON BERTINGKAT (COMPOUND TIERED DISCOUNT)
// -----------------------------------------------------------------------------
console.log('--- TEST F-03.1: DISKON TUNGGAL 25% DARI RP 20.000 ---');
const dSingle = Calculations.calculateTieredDiscount(20000, 25, 0, 0);
console.log(`Input: Rp 20.000 (Disc 25%) -> Output: Rp ${dSingle.finalUnitPrice} | Diskon: ${dSingle.effectiveDiscountPct}%`);
if (dSingle.finalUnitPrice !== 15000) {
  throw new Error(`Test F-03.1 Gagal: Seharusnya Rp 15.000, didapat Rp ${dSingle.finalUnitPrice}`);
}
console.log('✓ Test F-03.1 Diskon Tunggal Lulus (Rp 15.000)!');

console.log('\n--- TEST F-03.2: DISKON BERTINGKAT 50% + 20% DARI RP 100.000 ---');
const dTiered = Calculations.calculateTieredDiscount(100000, 50, 20, 0);
console.log(`Input: Wajan Rp 100.000 promo 50% + 20%`);
console.log(`Tahap 1 (50%): Rp ${dTiered.priceAfterD1} | Tahap 2 (20% dari sisa): Rp ${dTiered.priceAfterD2}`);
console.log(`Harga Akhir: Rp ${dTiered.finalUnitPrice} | Diskon Efektif: ${dTiered.effectiveDiscountPct}% | Hemat: Rp ${dTiered.savingPerUnit}`);
if (dTiered.finalUnitPrice !== 40000 || dTiered.effectiveDiscountPct !== 60) {
  throw new Error(`Test F-03.2 Gagal: Seharusnya Rp 40.000 (Diskon 60%), didapat Rp ${dTiered.finalUnitPrice}`);
}
// Strict Constraint: Menolak logika salah linier 50% + 20% = 70% (Rp 30.000)
if (dTiered.finalUnitPrice === 30000) {
  throw new Error('Test F-03.2 Gagal: Logika salah linier 70% terdeteksi!');
}
console.log('✓ Test F-03.2 Compound Discount 50% + 20% Lulus Tepat Rp 40.000!');

// -----------------------------------------------------------------------------
// SRS F-02: REAKTIVITAS KUANTITAS & SUBTOTAL BARIS
// -----------------------------------------------------------------------------
console.log('\n--- TEST F-02: REAKTIVITAS KUANTITAS & PERHITUNGAN SUBTOTAL BARIS ---');
const qty = 3;
const subtotalItem = Calculations.calculateItemTotal(dTiered.finalUnitPrice, qty);
console.log(`Kuantitas: ${qty} x Rp ${dTiered.finalUnitPrice} = Rp ${subtotalItem}`);
if (subtotalItem !== 120000) {
  throw new Error(`Test F-02 Gagal: Subtotal salah! Didapat ${subtotalItem}`);
}
console.log('✓ Test F-02 Subtotal Baris Item Lulus (3 x Rp 40.000 = Rp 120.000)!');

// -----------------------------------------------------------------------------
// SRS F-04: REALTIME PRICE COMPARATOR (KOMPARASI HARGA BULAN LALU)
// -----------------------------------------------------------------------------
console.log('\n--- TEST F-04: REALTIME PRICE COMPARATOR (NAIK, TURUN, STABIL) ---');
// Kasus 1: Harga Naik (Beras Rp 68k -> Rp 74k = +Rp 6.000, ↑)
const compUp = Calculations.comparePriceFluctuation(74000, 68000);
console.log(`Kasus Beras (68k -> 74k): Simbol: ${compUp.symbol} | Diff: +Rp ${compUp.diffAmount} | Badge: ${compUp.badgeClass}`);
if (compUp.type !== 'up' || compUp.symbol !== '↑' || compUp.diffAmount !== 6000) {
  throw new Error('Test F-04 Kasus Naik Gagal!');
}

// Kasus 2: Harga Turun (Telur Rp 32k -> Rp 28k = -Rp 4.000, ↓)
const compDown = Calculations.comparePriceFluctuation(28000, 32000);
console.log(`Kasus Telur (32k -> 28k): Simbol: ${compDown.symbol} | Diff: -Rp ${compDown.diffAmount} | Badge: ${compDown.badgeClass}`);
if (compDown.type !== 'down' || compDown.symbol !== '↓' || compDown.diffAmount !== 4000) {
  throw new Error('Test F-04 Kasus Turun Gagal!');
}

// Kasus 3: Harga Stabil (Minyak Rp 35k -> Rp 35k = Rp 0, =)
const compSame = Calculations.comparePriceFluctuation(35000, 35000);
console.log(`Kasus Minyak (35k -> 35k): Simbol: ${compSame.symbol} | Diff: Rp ${compSame.diffAmount} | Badge: ${compSame.badgeClass}`);
if (compSame.type !== 'same' || compSame.symbol !== '=') {
  throw new Error('Test F-04 Kasus Stabil Gagal!');
}
console.log('✓ Test F-04 Realtime Price Comparator 3 Kondisi Lulus Sempurna!');

// -----------------------------------------------------------------------------
// SRS F-05: BUDGET SAFETY CAP & WARNING SYSTEM
// -----------------------------------------------------------------------------
console.log('\n--- TEST F-05: BUDGET SAFETY CAP & AMBANG BATAS SALDO DOMPET ---');
const budgetCap = 350000;
const buffer = 15000;

// Skenario Aman (< 90%)
const evalSafe = Calculations.evaluateBudgetSafety(250000, budgetCap, buffer);
console.log(`1. Aman (Rp 250k / Rp 350k - ${evalSafe.usedPercentage}%): Status=${evalSafe.statusTitle} [${evalSafe.themeClass}]`);
if (evalSafe.status !== 'safe' && evalSafe.status !== 'notice') {
  throw new Error('Test F-05 Skenario Aman Gagal');
}

// Skenario Kuning Waspada (>= 90% Limit)
const evalWarn = Calculations.evaluateBudgetSafety(315000, budgetCap, buffer); // 315.000 / 350.000 = 90%
console.log(`2. Waspada (Rp 315k / Rp 350k - ${evalWarn.usedPercentage}%): Status=${evalWarn.statusTitle} [${evalWarn.themeClass}]`);
if (evalWarn.level !== 'warning' || evalWarn.themeClass !== 'budget-warning') {
  throw new Error('Test F-05 Status Kuning Waspada (>= 90%) Gagal!');
}

// Skenario Red Alert Overbudget (> 100% Limit)
const evalOver = Calculations.evaluateBudgetSafety(380000, budgetCap, buffer); // 380.000 > 350.000
console.log(`3. Overbudget (Rp 380k / Rp 350k): Status=${evalOver.statusTitle} [${evalOver.themeClass}]`);
console.log(`   Pesan Notifikasi: "${evalOver.statusMessage}"`);
if (
  !evalOver.isOverbudget ||
  evalOver.themeClass !== 'budget-danger' ||
  evalOver.statusMessage !== 'Total belanja melebihi batas saldo dompet! Kurangi kuantitas atau batalkan barang sekunder.'
) {
  throw new Error('Test F-05 Red Alert Overbudget Gagal: Pesan atau status tidak sesuai spesifikasi PRD!');
}
console.log('✓ Test F-05 Ambang Batas Waspada & Red Alert Overbudget Lulus Sempurna!');

console.log('\n================================================================');
console.log('🎉 SEMUA PENGUJIAN LOGIKA & SRS CALCULATIONS PRD LULUS 100%! 🎉');
console.log('================================================================');
