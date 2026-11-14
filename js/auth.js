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
   * @returns {object|null}
   */
  getCurrentUser() {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (session) {
        return JSON.parse(session);
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
   * Ketentuan Poin 4: Perbaiki bug "Password salah" dengan sanitasi trim spasi & pesan spesifik
   * @param {string} email 
   * @param {string} password 
   * @returns {object}
   */
  login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, message: 'Email dan password wajib diisi!' };
    }

    const users = this.getUsers();
    const userWithEmail = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!userWithEmail) {
      return { 
        success: false, 
        message: 'Email belum terdaftar! Silakan daftar akun baru terlebih dahulu.' 
      };
    }

    // Cocokkan password (pastikan trim)
    if (userWithEmail.password.trim() === cleanPassword) {
      this.setSession(userWithEmail);
      this.saveToSavedAccounts(userWithEmail);
      return {
        success: true,
        message: `Selamat datang kembali, ${userWithEmail.name}!`,
        user: userWithEmail
      };
    }

    return { 
      success: false, 
      message: 'Password salah! Periksa kembali huruf besar/kecil password Anda.' 
    };
  },

  /**
   * Simpan sesi aktif ke LocalStorage untuk persistensi tahan F5
   * @param {object} user 
   */
  setSession(user) {
    try {
      const sessionData = {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
        loggedInAt: new Date().toISOString()
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
