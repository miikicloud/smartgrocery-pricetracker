/**
 * storage.js
 * Manajemen LocalStorage, Reactive State Sync, Fitur onSnapshot & Audio Feedback
 */

import { INITIAL_GROCERY_ITEMS, INITIAL_BUDGET_CONFIG, SAMPLE_HISTORY_SESSIONS } from './data.js';

const STORAGE_KEYS = {
  ITEMS: 'sg_grocery_items_v1',
  BUDGET: 'sg_budget_config_v1',
  HISTORY: 'sg_history_sessions_v1',
  PRICE_MEMORY: 'sg_price_memory_v1',
  SNAPSHOTS: 'sg_cart_snapshots_v1',
  SESSION_META: 'sg_session_meta_v1'
};

export const Storage = {
  _listeners: new Set(),
  _isListeningCrossTab: false,

  /**
   * Daftarkan listener real-time onSnapshot (Firebase-style reactive listener)
   * Mengembalikan fungsi unsubscribe
   * @param {Function} callback (snapshot) => void
   * @returns {Function} unsubscribe function
   */
  onSnapshot(callback) {
    if (typeof callback !== 'function') return () => {};

    this._listeners.add(callback);
    this._ensureCrossTabListener();

    // Segera kirimkan snapshot pertama ke subscriber
    try {
      callback(this.getSnapshot('initial'));
    } catch (e) {
      console.warn('Error on initial onSnapshot callback:', e);
    }

    return () => {
      this._listeners.delete(callback);
    };
  },

  /**
   * Ambil snapshot lengkap seluruh state aplikasi saat ini
   * @param {string} source
   * @returns {object} snapshot
   */
  getSnapshot(source = 'local') {
    return {
      sessionMeta: this.getSessionMeta(),
      items: this.getItems(),
      budgetConfig: this.getBudgetConfig(),
      history: this.getHistory(),
      priceMemory: this.getPriceMemory(),
      snapshots: this.getSnapshots(),
      timestamp: new Date().toISOString(),
      source
    };
  },

  /**
   * Mengambil metadata sesi belanja aktif (Toko Grosir & Tanggal Belanja - SRS F-01)
   * @returns {object}
   */
  getSessionMeta() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION_META);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}
    const defaultMeta = {
      storeName: 'Lotte Mart Grocery - Puri Indah',
      shoppingDate: new Date().toISOString().split('T')[0]
    };
    this.saveSessionMeta(defaultMeta, false);
    return defaultMeta;
  },

  /**
   * Menyimpan metadata sesi belanja
   * @param {object} meta
   * @param {boolean} notify
   */
  saveSessionMeta(meta, notify = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_META, JSON.stringify(meta));
      if (notify) this._notifyListeners({ source: 'session_meta' });
    } catch (e) {
      console.error('Gagal menyimpan session meta:', e);
    }
  },

  /**
   * Broadcast perubahan state ke seluruh subscriber onSnapshot
   * @param {object} meta
   */
  _notifyListeners(meta = {}) {
    const source = meta.source || 'local';
    const snapshot = this.getSnapshot(source);

    this._listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (e) {
        console.error('Error invoking onSnapshot listener:', e);
      }
    });
  },

  /**
   * Pasang listener window storage event untuk sinkronisasi realtime lintas tab / browser window
   */
  _ensureCrossTabListener() {
    if (this._isListeningCrossTab) return;
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('storage', (e) => {
        if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
          this._notifyListeners({ source: 'cross_tab', key: e.key });
        }
      });
      this._isListeningCrossTab = true;
    }
  },

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
    this.savePriceMemory(memory, false);
    return memory;
  },

  /**
   * Menyimpan memori harga
   * @param {object} memory 
   * @param {boolean} notify
   */
  savePriceMemory(memory, notify = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRICE_MEMORY, JSON.stringify(memory));
      if (notify) this._notifyListeners({ source: 'price_memory' });
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
    this.savePriceMemory(memory, true);
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
    this.saveItems(INITIAL_GROCERY_ITEMS, false);
    return [...INITIAL_GROCERY_ITEMS];
  },

  /**
   * Menyimpan daftar barang belanjaan
   * @param {Array} items 
   * @param {boolean} notify
   */
  saveItems(items, notify = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      if (notify) this._notifyListeners({ source: 'items' });
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
    this.saveBudgetConfig(INITIAL_BUDGET_CONFIG, false);
    return { ...INITIAL_BUDGET_CONFIG };
  },

  /**
   * Menyimpan konfigurasi budget
   * @param {object} config 
   * @param {boolean} notify
   */
  saveBudgetConfig(config, notify = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(config));
      if (notify) this._notifyListeners({ source: 'budget' });
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
    this.saveHistory(SAMPLE_HISTORY_SESSIONS, false);
    return [...SAMPLE_HISTORY_SESSIONS];
  },

  /**
   * Menyimpan riwayat sesi belanja
   * @param {Array} history 
   * @param {boolean} notify
   */
  saveHistory(history, notify = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      if (notify) this._notifyListeners({ source: 'history' });
    } catch (e) {
      console.error('Gagal menyimpan history:', e);
    }
  },

  /**
   * Mengambil daftar snapshot tersimpan
   * @returns {Array}
   */
  getSnapshots() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Gagal membaca snapshots:', e);
    }
    return [];
  },

  /**
   * Menyimpan daftar snapshot
   * @param {Array} snapshots
   * @param {boolean} notify
   */
  saveSnapshots(snapshots, notify = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
      if (notify) this._notifyListeners({ source: 'snapshots' });
    } catch (e) {
      console.error('Gagal menyimpan snapshots:', e);
    }
  },

  /**
   * Mengambil / membuat Snapshot instan dari status belanja dan anggaran saat ini
   * @param {string} customLabel
   * @returns {object} snapshot baru
   */
  createSnapshot(customLabel = '') {
    const items = this.getItems();
    const budgetConfig = this.getBudgetConfig();
    const now = new Date();

    // Hitung total belanja troli saat ini
    let totalSpent = 0;
    items.forEach((item) => {
      if (item.inCart) {
        const qty = Number(item.qty) || 0;
        const p1 = Number(item.unitPrice) * (1 - (Number(item.disc1) || 0) / 100);
        const p2 = p1 * (1 - (Number(item.disc2) || 0) / 100);
        const finalPrice = Math.max(0, p2 - (Number(item.fixedDiscount) || 0));
        totalSpent += finalPrice * qty;
      }
    });

    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    const newSnapshot = {
      id: `snap_${Date.now()}`,
      label: customLabel.trim() || `Snapshot ${dateStr} • ${timeStr}`,
      timestamp: now.toISOString(),
      itemCount: items.length,
      inCartCount: items.filter((i) => i.inCart).length,
      totalSpent: Math.round(totalSpent),
      budgetCap: budgetConfig.budgetCap,
      remaining: Math.max(0, budgetConfig.budgetCap - totalSpent),
      items: JSON.parse(JSON.stringify(items)),
      budgetConfig: JSON.parse(JSON.stringify(budgetConfig))
    };

    const snapshots = this.getSnapshots();
    snapshots.unshift(newSnapshot);
    this.saveSnapshots(snapshots, true);

    return newSnapshot;
  },

  /**
   * Memulihkan (restore) state belanja dan anggaran dari Snapshot yang dipilih
   * @param {string} snapshotId
   * @returns {boolean}
   */
  restoreSnapshot(snapshotId) {
    const snapshots = this.getSnapshots();
    const target = snapshots.find((s) => s.id === snapshotId);
    if (!target) return false;

    if (target.items && Array.isArray(target.items)) {
      this.saveItems(target.items, false);
    }
    if (target.budgetConfig) {
      this.saveBudgetConfig(target.budgetConfig, false);
    }

    this._notifyListeners({ source: 'snapshot_restore', snapshotId });
    return true;
  },

  /**
   * Menghapus snapshot dari penyimpanan
   * @param {string} snapshotId
   * @returns {boolean}
   */
  deleteSnapshot(snapshotId) {
    const snapshots = this.getSnapshots();
    const filtered = snapshots.filter((s) => s.id !== snapshotId);
    this.saveSnapshots(filtered, true);
    return true;
  },

  /**
   * Reset data ke kondisi awal demo
   */
  resetToSampleData() {
    this.saveItems(INITIAL_GROCERY_ITEMS, false);
    this.saveBudgetConfig(INITIAL_BUDGET_CONFIG, false);
    this.saveHistory(SAMPLE_HISTORY_SESSIONS, false);
    this._notifyListeners({ source: 'reset' });
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
