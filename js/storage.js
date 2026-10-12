/**
 * storage.js
 * Manajemen LocalStorage, Sinkronisasi State, dan Audio Feedback
 */

import { INITIAL_GROCERY_ITEMS, INITIAL_BUDGET_CONFIG, SAMPLE_HISTORY_SESSIONS } from './data.js';

const STORAGE_KEYS = {
  ITEMS: 'sg_grocery_items_v1',
  BUDGET: 'sg_budget_config_v1',
  HISTORY: 'sg_history_sessions_v1',
  PRICE_MEMORY: 'sg_price_memory_v1'
};

export const Storage = {
  /**
   * Mengambil daftar memori harga historis produk
   * @returns {object}
   */
  getPriceMemory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRICE_MEMORY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Gagal membaca price memory:', e);
    }

    // Inisialisasi awal dengan data produk default
    const memory = {};
    INITIAL_GROCERY_ITEMS.forEach((it) => {
      memory[it.name.trim().toLowerCase()] = {
        name: it.name.trim(),
        price: it.lastMonthPrice || it.unitPrice,
        category: it.category,
        unit: it.unit,
        updatedAt: new Date().toISOString()
      };
    });
    this.savePriceMemory(memory);
    return memory;
  },

  /**
   * Menyimpan memori harga
   * @param {object} memory 
   */
  savePriceMemory(memory) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRICE_MEMORY, JSON.stringify(memory));
    } catch (e) {
      console.error('Gagal menyimpan price memory:', e);
    }
  },

  /**
   * Merekam atau memperbarui harga terakhir suatu produk
   * @param {string} name 
   * @param {number} price 
   * @param {string} category 
   * @param {string} unit 
   */
  recordProductPrice(name, price, category = '', unit = '') {
    if (!name || Number(price) <= 0) return;
    const memory = this.getPriceMemory();
    const key = name.trim().toLowerCase();
    const prev = memory[key] || {};
    memory[key] = {
      name: name.trim(),
      price: Number(price),
      category: category || prev.category || 'pokok',
      unit: unit || prev.unit || 'pcs',
      updatedAt: new Date().toISOString()
    };
    this.savePriceMemory(memory);
  },

  /**
   * Mengambil harga historis produk jika pernah dicatat
   * @param {string} name 
   * @returns {object|null}
   */
  getRecordedPrice(name) {
    if (!name) return null;
    const memory = this.getPriceMemory();
    const key = name.trim().toLowerCase();
    return memory[key] || null;
  },

  /**
   * Mengambil daftar barang belanjaan saat ini
   * @returns {Array}
   */
  getItems() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Gagal membaca items dari LocalStorage:', e);
    }
    // Jika belum ada, inisialisasi dengan data awal
    this.saveItems(INITIAL_GROCERY_ITEMS);
    return [...INITIAL_GROCERY_ITEMS];
  },

  /**
   * Menyimpan daftar barang belanjaan
   * @param {Array} items 
   */
  saveItems(items) {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Gagal menyimpan items ke LocalStorage:', e);
    }
  },

  /**
   * Mengambil konfigurasi budget
   * @returns {object}
   */
  getBudgetConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGET);
      if (data) {
        return { ...INITIAL_BUDGET_CONFIG, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Gagal membaca budget dari LocalStorage:', e);
    }
    this.saveBudgetConfig(INITIAL_BUDGET_CONFIG);
    return { ...INITIAL_BUDGET_CONFIG };
  },

  /**
   * Menyimpan konfigurasi budget
   * @param {object} config 
   */
  saveBudgetConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(config));
    } catch (e) {
      console.error('Gagal menyimpan budget config:', e);
    }
  },

  /**
   * Mengambil riwayat sesi belanja
   * @returns {Array}
   */
  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Gagal membaca riwayat:', e);
    }
    this.saveHistory(SAMPLE_HISTORY_SESSIONS);
    return [...SAMPLE_HISTORY_SESSIONS];
  },

  /**
   * Menyimpan riwayat sesi belanja
   * @param {Array} history 
   */
  saveHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Gagal menyimpan history:', e);
    }
  },

  /**
   * Reset data ke kondisi awal demo
   */
  resetToSampleData() {
    this.saveItems(INITIAL_GROCERY_ITEMS);
    this.saveBudgetConfig(INITIAL_BUDGET_CONFIG);
    this.saveHistory(SAMPLE_HISTORY_SESSIONS);
  }
};

/**
 * Audio & Haptic Feedback Synthesizer via Web Audio API
 * Berjalan tanpa file audio eksternal dan bekerja 100% offline
 */
class HapticAudioFeedback {
  constructor() {
    this.audioCtx = null;
  }

  initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  // Efek klik lembut untuk tombol +/- kuantitas
  tap() {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  // Efek centang masuk troli (sukses)
  success() {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 30, 20]);
      }
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.audioCtx.currentTime + 0.06); // E5
      osc.frequency.setValueAtTime(783.99, this.audioCtx.currentTime + 0.12); // G5

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.23);
    } catch (e) {}
  }

  // Efek peringatan overbudget (buzzer)
  warning() {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.audioCtx.currentTime);
      osc.frequency.setValueAtTime(180, this.audioCtx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.26);
    } catch (e) {}
  }
}

export const SoundFeedback = new HapticAudioFeedback();
