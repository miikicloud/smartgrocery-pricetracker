/**
 * auth.js
 * Sistem Autentikasi Pengguna, Persistent Session & Account Switcher (Multi-Akun)
 */

const STORAGE_KEYS = {
  USERS: 'sg_cloud_users_registry_v1',
  CURRENT_SESSION: 'sg_current_user_session_v1',
  SAVED_ACCOUNTS: 'sg_saved_accounts_v1',
  CLOUD_DATA_PREFIX: 'sg_cloud_user_data_'
};

export const Auth = {
  /**
   * Mengambil daftar semua akun terdaftar di storage
   * @returns {Array}
   */
  getUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    // Inisialisasi awal dengan akun demo standar
    const initialUsers = [
      {
        id: 'user_demo_01',
        name: 'Pengguna Demo',
        email: 'user@smartgrocery.app',
        password: 'password123',
        createdAt: new Date().toISOString()
      }
    ];
    this.saveUsers(initialUsers);
    return initialUsers;
  },

  saveUsers(users) {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {}
  },

  /**
   * Mengambil sesi user yang sedang login saat ini
   * Sesuai Tugas 1: Batas Waktu Sesi Login (Session Timeout 5 Jam)
   * Jika waktu login sudah melewati 5 jam (atau tidak ada data waktu login),
   * otomatis lakukan logout dan kembalikan null.
   * @returns {object|null}
   */
  getCurrentUser() {
    try {
      const sessionStr = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session && session.id) {
          const FIVE_HOURS_MS = 5 * 60 * 60 * 1000; // 5 Jam = 18.000.000 ms
          const now = Date.now();
          const loginTime = session.loginTimestamp || (session.loggedInAt ? new Date(session.loggedInAt).getTime() : 0);

          // Cek apakah sesi sudah melebihi 5 jam atau timestamp tidak valid
          if (!loginTime || (now - loginTime) > FIVE_HOURS_MS) {
            this.logout();
            return null;
          }

          return session;
        }
      }
    } catch (e) {}
    return null;
  },

  /**
   * Cek apakah user sedang login
   * @returns {boolean}
   */
  isLoggedIn() {
    return Boolean(this.getCurrentUser());
  },

  /**
   * Mengambil daftar akun yang pernah login di perangkat ini (Account Switcher)
   * @returns {Array}
   */
  getSavedAccounts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_ACCOUNTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  },

  /**
   * Simpan akun ke daftar perangkat ini agar bisa beralih tanpa login ulang
   * @param {object} user 
   */
  saveToSavedAccounts(user) {
    if (!user || !user.id || !user.email) return;
    try {
      let accounts = this.getSavedAccounts();
      const existingIdx = accounts.findIndex((a) => a.id === user.id || a.email.toLowerCase() === user.email.toLowerCase());
      const accountData = {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
        lastActive: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        accounts[existingIdx] = { ...accounts[existingIdx], ...accountData };
      } else {
        accounts.unshift(accountData);
      }
      localStorage.setItem(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {}
  },

  /**
   * Hapus akun dari daftar switcher pada perangkat ini
   * @param {string} userId 
   */
  removeSavedAccount(userId) {
    try {
      let accounts = this.getSavedAccounts();
      accounts = accounts.filter((a) => a.id !== userId);
      localStorage.setItem(STORAGE_KEYS.SAVED_ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {}
  },

  /**
   * Beralih ke salah satu akun yang tersimpan secara instan (1-Click Switch)
   * @param {string} userId 
   * @returns {object|null}
   */
  switchAccount(userId) {
    const users = this.getUsers();
    const matched = users.find((u) => u.id === userId);
    if (matched) {
      this.setSession(matched);
      this.saveToSavedAccounts(matched);
      return { success: true, message: `Beralih ke akun ${matched.name}`, user: matched };
    }
    return { success: false, message: 'Data akun tidak ditemukan di perangkat ini.' };
  },

  /**
   * Mendaftar akun baru
   * Ketentuan Poin 4: Satu email hanya boleh digunakan untuk 1 akun saja!
   * @param {string} name 
   * @param {string} email 
   * @param {string} password 
   * @returns {object} { success: boolean, message: string, user: object }
   */
  register(name, email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return { success: false, message: 'Semua kolom (Nama, Email, Password) wajib diisi!' };
    }

    if (cleanPassword.length < 6) {
      return { success: false, message: 'Password minimal 6 karakter demi keamanan akun Anda.' };
    }

    const users = this.getUsers();
    // Validasi 1 email = 1 akun ketat
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { 
        success: false, 
        message: 'Email sudah terdaftar, silakan login dengan akun Anda.' 
      };
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);

    // Auto login & simpan ke daftar akun tersimpan (Switcher)
    this.setSession(newUser);
    this.saveToSavedAccounts(newUser);

    return { 
      success: true, 
      message: 'Pendaftaran akun berhasil!', 
      user: newUser 
    };
  },

  /**
   * Masuk (Sign In)
   * Sesuai Tugas 4 & 5:
   * - Mendukung pencocokan akun via Email, Username, Nama, atau ID akun.
   * - Jika akun ditemukan tetapi password salah: return wrongPassword: true dan pesan "Password yang Anda masukkan salah. Silakan coba lagi." (TIDAK menyuruh buat akun baru).
   * - Jika akun benar-benar tidak terdaftar: return notRegistered: true dan pesan "Akun tidak terdaftar. Silakan buat akun terlebih dahulu."
   * @param {string} identifier 
   * @param {string} password 
   * @returns {object}
   */
  login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanId || !cleanPassword) {
      return { success: false, message: 'Email/username dan password wajib diisi!' };
    }

    const users = this.getUsers();
    
    // Cari berdasarkan email, username (sebelum @), nama lengkap, atau id akun
    const matchedUser = users.find((u) => {
      const email = (u.email || '').toLowerCase().trim();
      const name = (u.name || '').toLowerCase().trim();
      const username = email.split('@')[0];
      const id = (u.id || '').toLowerCase().trim();

      return email === cleanId || username === cleanId || name === cleanId || id === cleanId;
    });

    if (!matchedUser) {
      return { 
        success: false, 
        notRegistered: true,
        message: 'Akun tidak terdaftar. Silakan buat akun terlebih dahulu.' 
      };
    }

    // Cocokkan password (pastikan trim & case-sensitive)
    if (String(matchedUser.password || '').trim() === cleanPassword) {
      this.setSession(matchedUser);
      this.saveToSavedAccounts(matchedUser);
      return {
        success: true,
        message: `Selamat datang kembali, ${matchedUser.name}!`,
        user: matchedUser
      };
    }

    // Password salah: HANYA tampilkan pesan password salah, JANGAN suruh bikin akun baru!
    return { 
      success: false, 
      wrongPassword: true,
      message: 'Password yang Anda masukkan salah. Silakan coba lagi.' 
    };
  },

  /**
   * Menyimpan / memperbarui akun pengguna dari Cloud ke penyimpanan lokal
   * Sesuai Tugas 3: Sinkronisasi Lintas Perangkat (Cross-Device Sync)
   * @param {object} user
   * @returns {object|null}
   */
  upsertUser(user) {
    if (!user || !user.email) return null;
    try {
      const users = this.getUsers();
      const cleanEmail = user.email.trim().toLowerCase();
      const existingIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      const formattedUser = {
        id: user.id || `user_${Date.now()}`,
        name: user.name || 'Pengguna',
        email: cleanEmail,
        password: String(user.password || '').trim(),
        createdAt: user.createdAt || new Date().toISOString()
      };

      if (existingIdx >= 0) {
        users[existingIdx] = { ...users[existingIdx], ...formattedUser };
      } else {
        users.push(formattedUser);
      }
      this.saveUsers(users);
      return formattedUser;
    } catch (e) {
      return null;
    }
  },

  /**
   * Simpan sesi aktif ke LocalStorage untuk persistensi tahan F5
   * Sesuai Tugas 1: Menyimpan loginTimestamp untuk validasi batas waktu 5 jam
   * @param {object} user 
   */
  setSession(user) {
    try {
      const now = Date.now();
      const sessionData = {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
        loggedInAt: new Date(now).toISOString(),
        loginTimestamp: now
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(sessionData));
    } catch (e) {}
  },

  /**
   * Logout dari sesi saat ini
   */
  logout() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    } catch (e) {}
  },

  /**
   * Cloud Data Sync Simulator: Simpan data belanja per akun
   */
  syncToCloud(userId, data) {
    if (!userId) return;
    try {
      localStorage.setItem(`${STORAGE_KEYS.CLOUD_DATA_PREFIX}${userId}`, JSON.stringify(data));
    } catch (e) {}
  },

  /**
   * Cloud Data Sync Simulator: Ambil data belanja akun dari cloud
   */
  loadFromCloud(userId) {
    if (!userId) return null;
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.CLOUD_DATA_PREFIX}${userId}`);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return null;
  }
};
