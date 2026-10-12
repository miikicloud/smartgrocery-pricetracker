/**
 * auth.js
 * Sistem Autentikasi Pengguna, Cloud Storage Sync, dan Super Admin Guard
 */

const STORAGE_KEYS = {
  USERS: 'sg_cloud_users_registry_v1',
  CURRENT_SESSION: 'sg_current_user_session_v1',
  APP_CONFIG: 'sg_live_app_config_v1',
  CLOUD_DATA_PREFIX: 'sg_cloud_user_data_'
};

// Akun Super Admin Khusus
export const SUPER_ADMIN_CREDENTIALS = {
  email: 'mikaylasubrata@mutiarabangsa.sch.id',
  password: 'Mikayla2',
  role: 'admin',
  displayName: 'Mikayla Subrata (Super Admin)',
  school: 'Mutiara Bangsa'
};

// Pengaturan Global Aplikasi yang Bisa di-Live Edit oleh Super Admin
export const DEFAULT_APP_CONFIG = {
  appName: 'Smart Grocery',
  appSubtitle: 'Budget Safety Tracker • Mutiara Bangsa',
  announcement: '📢 Selamat datang di Smart Grocery Tracker! Belanja hemat, anti-overbudget.',
  accentColor: '#10b981', // Emerald
  currencyPrefix: 'Rp',
  maxDefaultBudget: 500000
};

export const Auth = {
  /**
   * Mengambil daftar semua akun terdaftar di cloud
   * @returns {Array}
   */
  getUsers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}

    // Inisialisasi awal dengan akun Super Admin
    const initialUsers = [
      {
        id: 'user_admin_01',
        name: SUPER_ADMIN_CREDENTIALS.displayName,
        email: SUPER_ADMIN_CREDENTIALS.email,
        password: SUPER_ADMIN_CREDENTIALS.password,
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user_demo_02',
        name: 'Siswa Rantau Demo',
        email: 'siswa@mutiarabangsa.sch.id',
        password: 'password123',
        role: 'user',
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
   * Mengambil sesi user yang sedang login
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
   * Mendaftar akun baru
   * @param {string} name 
   * @param {string} email 
   * @param {string} password 
   * @returns {object} { success: boolean, message: string, user: object }
   */
  register(name, email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || !cleanEmail || !password) {
      return { success: false, message: 'Semua kolom wajib diisi!' };
    }

    const users = this.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'Email sudah terdaftar! Silakan login.' };
    }

    const isSuperAdmin = cleanEmail === SUPER_ADMIN_CREDENTIALS.email.toLowerCase();

    const newUser = {
      id: `user_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password,
      role: isSuperAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);

    // Auto login
    this.setSession(newUser);
    return { success: true, message: 'Pendaftaran akun berhasil!', user: newUser };
  },

  /**
   * Masuk (Sign In)
   * @param {string} email 
   * @param {string} password 
   * @returns {object}
   */
  login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getUsers();

    // Verifikasi Super Admin
    if (
      cleanEmail === SUPER_ADMIN_CREDENTIALS.email.toLowerCase() &&
      password === SUPER_ADMIN_CREDENTIALS.password
    ) {
      let adminUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!adminUser) {
        adminUser = {
          id: 'user_admin_01',
          name: SUPER_ADMIN_CREDENTIALS.displayName,
          email: SUPER_ADMIN_CREDENTIALS.email,
          password: SUPER_ADMIN_CREDENTIALS.password,
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        users.push(adminUser);
        this.saveUsers(users);
      } else {
        adminUser.role = 'admin';
        this.saveUsers(users);
      }

      this.setSession(adminUser);
      return {
        success: true,
        message: 'Selamat datang Super Admin Mikayla Subrata!',
        user: adminUser,
        isAdmin: true
      };
    }

    // Verifikasi Akun Biasa
    const matched = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (matched) {
      this.setSession(matched);
      return {
        success: true,
        message: `Selamat datang kembali, ${matched.name}!`,
        user: matched,
        isAdmin: matched.role === 'admin'
      };
    }

    return { success: false, message: 'Email atau password salah! Periksa kembali.' };
  },

  setSession(user) {
    try {
      const sessionData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(sessionData));
    } catch (e) {}
  },

  logout() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    } catch (e) {}
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return (
      user &&
      (user.role === 'admin' ||
        user.email.toLowerCase() === SUPER_ADMIN_CREDENTIALS.email.toLowerCase())
    );
  },

  /**
   * Mengambil konfigurasi live app yang diatur admin
   */
  getAppConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APP_CONFIG);
      if (data) {
        return { ...DEFAULT_APP_CONFIG, ...JSON.parse(data) };
      }
    } catch (e) {}
    this.saveAppConfig(DEFAULT_APP_CONFIG);
    return { ...DEFAULT_APP_CONFIG };
  },

  /**
   * Menyimpan live edit konfigurasi oleh Admin
   */
  saveAppConfig(config) {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
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
