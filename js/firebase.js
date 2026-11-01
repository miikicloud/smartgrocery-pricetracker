/**
 * firebase.js
 * Multi-Device Realtime Cloud Engine via Firebase Cloud Firestore
 * Menggunakan onSnapshot() (bukan getDoc/getDocs) untuk sinkronisasi live antar-perangkat (HP & PC).
 */

// Konfigurasi Cloud Firestore Pengguna
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBA7-U4V8sEdiAq7j2sMalaGOQv9Z-DM0I",
  authDomain: "smartgrocery-pricetracke-d5fff.firebaseapp.com",
  projectId: "smartgrocery-pricetracke-d5fff",
  storageBucket: "smartgrocery-pricetracke-d5fff.firebasestorage.app",
  messagingSenderId: "380812331971",
  appId: "1:380812331971:web:959261712cc487ba59cb76"
};

const STORAGE_KEYS = {
  DEVICE_ID: 'sg_device_identifier_v1',
  LAST_REMOTE_SYNC: 'sg_last_remote_sync_time_v1'
};

class FirebaseRealtimeEngine {
  constructor() {
    this.app = null;
    this.db = null;
    this.activeUnsubscribe = null;
    this.currentSessionId = 'active_session';
    this.isConnected = false;
    this.isSdkLoaded = false;
    this.deviceId = this.getOrCreateDeviceId();
    this.lastLocalWriteTimestamp = 0;
    this.statusListeners = new Set();
    this.status = 'connecting'; // 'connecting', 'connected', 'offline'
  }

  getOrCreateDeviceId() {
    try {
      let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      if (!id) {
        id = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
      }
      return id;
    } catch (e) {
      return `dev_fallback_${Date.now()}`;
    }
  }

  onStatusChange(callback) {
    if (typeof callback === 'function') {
      this.statusListeners.add(callback);
      callback(this.status);
      return () => this.statusListeners.delete(callback);
    }
    return () => {};
  }

  setStatus(newStatus) {
    this.status = newStatus;
    this.isConnected = newStatus === 'connected';
    this.statusListeners.forEach((cb) => {
      try {
        cb(newStatus);
      } catch (e) {}
    });
  }

  /**
   * Inisialisasi Firebase Modular Web SDK v10 dari CDN Resmi Google
   */
  async initSdk() {
    if (this.isSdkLoaded && this.db) return true;

    try {
      const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
      const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');

      const existingApps = getApps();
      this.app = existingApps.length > 0 ? existingApps[0] : initializeApp(FIREBASE_CONFIG);
      this.db = getFirestore(this.app);
      this.isSdkLoaded = true;
      return true;
    } catch (e) {
      console.warn('Firebase SDK offline atau gagal dimuat (LocalStorage fallback aktif):', e.message);
      this.isSdkLoaded = false;
      this.setStatus('offline');
      return false;
    }
  }

  /**
   * Berlangganan perubahan data realtime antar-perangkat menggunakan onSnapshot()
   * Sesuai ketentuan PRD: Dilarang menggunakan getDoc() / getDocs() sekali baca.
   * @param {string} sessionId
   * @param {Function} onDataCallback (data, meta) => void
   * @returns {Promise<Function>} Unsubscribe function
   */
  async subscribeSession(sessionId = 'active_session', onDataCallback) {
    this.currentSessionId = sessionId;

    if (this.activeUnsubscribe) {
      this.activeUnsubscribe();
      this.activeUnsubscribe = null;
    }

    const ready = await this.initSdk();
    if (!ready || !this.db) {
      this.setStatus('offline');
      return () => {};
    }

    try {
      const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      const docRef = doc(this.db, 'grocery_sessions', sessionId);

      this.setStatus('connecting');

      // REALTIME LISTENER onSnapshot()
      this.activeUnsubscribe = onSnapshot(
        docRef,
        { includeMetadataChanges: true },
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const source = docSnap.metadata.hasPendingWrites ? 'local' : 'server';

            this.setStatus('connected');

            // Jika perubahan berasal dari perangkat lain, jalankan callback update
            const isFromOtherDevice = data.deviceId && data.deviceId !== this.deviceId;
            const isDifferentWrite = data.writeTimestamp && data.writeTimestamp !== this.lastLocalWriteTimestamp;

            if (isFromOtherDevice || (isDifferentWrite && source === 'server')) {
              try {
                localStorage.setItem(STORAGE_KEYS.LAST_REMOTE_SYNC, new Date().toISOString());
              } catch (e) {}

              if (typeof onDataCallback === 'function') {
                onDataCallback(data, {
                  source,
                  isFromOtherDevice,
                  deviceId: data.deviceId,
                  updatedAt: data.updatedAt
                });
              }
            }
          } else {
            // Dokumen belum ada, Firestore tersambung siap menerima dual-write
            this.setStatus('connected');
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot listener terputus / offline:', error.message);
          this.setStatus('offline');
        }
      );

      return () => {
        if (this.activeUnsubscribe) {
          this.activeUnsubscribe();
          this.activeUnsubscribe = null;
        }
      };
    } catch (e) {
      console.warn('Error saat mengaktifkan onSnapshot:', e);
      this.setStatus('offline');
      return () => {};
    }
  }

  /**
   * Dual-Write: Sinkronisasi instan state keranjang belanja ke Firestore collection 'grocery_sessions'
   * @param {string} sessionId
   * @param {object} sessionPayload
   */
  async syncToFirestore(sessionId = 'active_session', sessionPayload) {
    const ready = await this.initSdk();
    if (!ready || !this.db) {
      return false;
    }

    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
      const docRef = doc(this.db, 'grocery_sessions', sessionId);

      const writeTimestamp = Date.now();
      this.lastLocalWriteTimestamp = writeTimestamp;

      const payload = {
        ...sessionPayload,
        deviceId: this.deviceId,
        writeTimestamp,
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });
      this.setStatus('connected');
      return true;
    } catch (e) {
      console.warn('Gagal sinkron ke Firestore (aplikasi tetap aman via LocalStorage):', e.message);
      this.setStatus('offline');
      return false;
    }
  }
}

export const FirebaseSync = new FirebaseRealtimeEngine();
