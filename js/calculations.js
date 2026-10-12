/**
 * calculations.js
 * Mesin kalkulasi matematis untuk Smart Grocery & Budget Tracker
 * - Diskon bertingkat (Compound / Tiered Discount)
 * - Fluktuasi harga bulan lalu vs saat ini
 * - Status Budget Safety Cap & Safety Buffer
 */

export const Calculations = {
  /**
   * Format angka ke format mata uang Rupiah
   * @param {number} amount
   * @param {boolean} withPrefix
   * @returns {string}
   */
  formatRupiah(amount, withPrefix = true) {
    const num = Math.round(Number(amount) || 0);
    const formatted = new Intl.NumberFormat('id-ID').format(num);
    return withPrefix ? `Rp ${formatted}` : formatted;
  },

  /**
   * Hitung diskon bertingkat (compound tiered discount)
   * Contoh promo supermarket: 50% + 20%
   * Harga 100.000 -> 50% jadi 50.000 -> 20% jadi 40.000 (Bukan diskon 70%!)
   * @param {number} basePrice Harga awal barang
   * @param {number} disc1 Persentase diskon pertama (0-100)
   * @param {number} disc2 Persentase diskon kedua (0-100)
   * @param {number} fixedDiscount Potongan nominal rupiah (voucher/cashback)
   * @returns {object} Detail kalkulasi harga dan penghematan
   */
  calculateTieredDiscount(basePrice = 0, disc1 = 0, disc2 = 0, fixedDiscount = 0) {
    const rawPrice = Math.max(0, Number(basePrice) || 0);
    const d1 = Math.max(0, Math.min(100, Number(disc1) || 0));
    const d2 = Math.max(0, Math.min(100, Number(disc2) || 0));
    const fixed = Math.max(0, Number(fixedDiscount) || 0);

    // Langkah 1: Terapkan diskon pertama
    const priceAfterD1 = rawPrice * (1 - d1 / 100);

    // Langkah 2: Terapkan diskon kedua dari sisa harga langkah 1
    const priceAfterD2 = priceAfterD1 * (1 - d2 / 100);

    // Langkah 3: Potong nominal voucher
    const finalUnitPrice = Math.max(0, Math.round(priceAfterD2 - fixed));

    // Penghematan
    const totalSavingPerUnit = Math.max(0, rawPrice - finalUnitPrice);
    const effectiveDiscountPct = rawPrice > 0 
      ? Number(((totalSavingPerUnit / rawPrice) * 100).toFixed(1)) 
      : 0;

    return {
      basePrice: rawPrice,
      disc1: d1,
      disc2: d2,
      fixedDiscount: fixed,
      priceAfterD1: Math.round(priceAfterD1),
      priceAfterD2: Math.round(priceAfterD2),
      finalUnitPrice,
      savingPerUnit: totalSavingPerUnit,
      effectiveDiscountPct,
      hasDiscount: d1 > 0 || d2 > 0 || fixed > 0
    };
  },

  /**
   * Hitung total harga item berdasarkan kuantitas
   * @param {number} unitPrice 
   * @param {number} qty 
   * @returns {number}
   */
  calculateItemTotal(unitPrice = 0, qty = 1) {
    const price = Math.max(0, Number(unitPrice) || 0);
    const quantity = Math.max(0, Number(qty) || 0);
    return Math.round(price * quantity);
  },

  /**
   * Deteksi fluktuasi harga saat ini vs bulan lalu
   * @param {number} currentPrice Harga satuan saat ini
   * @param {number} lastMonthPrice Harga satuan bulan lalu
   * @returns {object}
   */
  comparePriceFluctuation(currentPrice = 0, lastMonthPrice = 0) {
    const current = Math.max(0, Number(currentPrice) || 0);
    const past = Math.max(0, Number(lastMonthPrice) || 0);

    if (past <= 0) {
      return {
        type: 'new',
        label: 'Item Baru',
        diffAmount: 0,
        percentage: 0,
        badgeClass: 'badge-new',
        icon: 'sparkles',
        summary: 'Belum ada data bulan lalu',
        description: 'Tercatat sebagai patokan harga bulan berikutnya.'
      };
    }

    const diff = current - past;
    const percentage = Number(((diff / past) * 100).toFixed(1));

    if (diff > 0) {
      return {
        type: 'up',
        symbol: '↑',
        label: `↑ Naik Rp ${new Intl.NumberFormat('id-ID').format(diff)} (+${percentage}%)`,
        shortLabel: `↑ +${percentage}%`,
        diffAmount: diff,
        percentage,
        badgeClass: 'badge-up',
        icon: 'arrow-up',
        summary: `Lebih mahal ${percentage}% dari bulan lalu`,
        description: `Bulan lalu: Rp ${new Intl.NumberFormat('id-ID').format(past)}. Tips: Cari alternatif jika budget ketat!`
      };
    } else if (diff < 0) {
      const absDiff = Math.abs(diff);
      const absPct = Math.abs(percentage);
      return {
        type: 'down',
        symbol: '↓',
        label: `↓ Turun Rp ${new Intl.NumberFormat('id-ID').format(absDiff)} (-${absPct}%)`,
        shortLabel: `↓ -${absPct}%`,
        diffAmount: absDiff,
        percentage: -absPct,
        badgeClass: 'badge-down',
        icon: 'arrow-down',
        summary: `Hemat ${absPct}% dibanding bulan lalu`,
        description: `Bulan lalu: Rp ${new Intl.NumberFormat('id-ID').format(past)}. Lagi promo/murah!`
      };
    } else {
      return {
        type: 'same',
        symbol: '=',
        label: '= Harga Stabil',
        shortLabel: '= Stabil',
        diffAmount: 0,
        percentage: 0,
        badgeClass: 'badge-same',
        icon: 'equal',
        summary: 'Sama persis dengan harga bulan lalu',
        description: `Harga konsisten di Rp ${new Intl.NumberFormat('id-ID').format(past)}.`
      };
    }
  },

  /**
   * Logika Pengendali Anggaran (Budget Safety Cap)
   * Menilai risiko belanjaan anak rantau terhadap uang saku yang dibawa
   * @param {number} totalInCart Total belanjaan barang di troli
   * @param {number} budgetCap Batas anggaran yang ditetapkan
   * @param {number} safetyBuffer Cadangan darurat (kresek, parkir, pembulatan kasir)
   * @returns {object}
   */
  evaluateBudgetSafety(totalInCart = 0, budgetCap = 0, safetyBuffer = 10000) {
    const total = Math.max(0, Number(totalInCart) || 0);
    const budget = Math.max(0, Number(budgetCap) || 0);
    const buffer = Math.max(0, Number(safetyBuffer) || 0);

    if (budget <= 0) {
      return {
        status: 'unlimited',
        level: 'normal',
        usedPercentage: 0,
        remainingBudget: 0,
        buffer,
        isOverbudget: false,
        isNearLimit: false,
        themeClass: 'budget-neutral',
        statusTitle: 'Budget Belum Diatur',
        statusMessage: 'Atur batas uang belanja agar tidak boros di kasir.',
        alertTone: 'info'
      };
    }

    const remaining = budget - total;
    const usedPercentage = Number(((total / budget) * 100).toFixed(1));
    const effectiveRemaining = remaining - buffer;

    // Status level evaluation
    if (total > budget) {
      const overAmount = total - budget;
      return {
        status: 'overbudget',
        level: 'danger',
        usedPercentage: Math.min(100, usedPercentage),
        rawPercentage: usedPercentage,
        remainingBudget: remaining, // Negatif
        overAmount,
        buffer,
        isOverbudget: true,
        isNearLimit: true,
        themeClass: 'budget-danger',
        statusTitle: '🚨 BAHAYA: OVERBUDGET!',
        statusMessage: `Melebihi budget sebesar ${this.formatRupiah(overAmount)}! Keluarkan beberapa barang sebelum ke kasir.`,
        alertTone: 'danger'
      };
    } else if (remaining <= buffer || usedPercentage >= 90) {
      return {
        status: 'critical',
        level: 'critical',
        usedPercentage,
        rawPercentage: usedPercentage,
        remainingBudget: remaining,
        effectiveRemaining,
        buffer,
        isOverbudget: false,
        isNearLimit: true,
        themeClass: 'budget-critical',
        statusTitle: '⚡ ZONA KRITIS (Hampir Habis)',
        statusMessage: `Tersisa ${this.formatRupiah(remaining)}! Sudah menyentuh cadangan darurat ${this.formatRupiah(buffer)}.`,
        alertTone: 'critical'
      };
    } else if (usedPercentage >= 75) {
      return {
        status: 'warning',
        level: 'warning',
        usedPercentage,
        rawPercentage: usedPercentage,
        remainingBudget: remaining,
        effectiveRemaining,
        buffer,
        isOverbudget: false,
        isNearLimit: false,
        themeClass: 'budget-warning',
        statusTitle: '⚠️ WASPADA BATAS ANGGARAN',
        statusMessage: `Sudah terpakai ${usedPercentage}% dari uang saku. Sisa aman: ${this.formatRupiah(remaining)}.`,
        alertTone: 'warning'
      };
    } else {
      return {
        status: 'safe',
        level: 'safe',
        usedPercentage,
        rawPercentage: usedPercentage,
        remainingBudget: remaining,
        effectiveRemaining,
        buffer,
        isOverbudget: false,
        isNearLimit: false,
        themeClass: 'budget-safe',
        statusTitle: '✅ ANGGARAN AMAN',
        statusMessage: `Tersisa ${this.formatRupiah(remaining)} (${(100 - usedPercentage).toFixed(0)}% tersisa). Belanja terkontrol!`,
        alertTone: 'success'
      };
    }
  }
};
