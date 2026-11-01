/**
 * auth.js
 * Sistem Autentikasi Pengguna & Cloud Storage Data Sync
 */

const STORAGE_KEYS = {
  USERS: 'sg_cloud_users_registry_v1',
  CURRENT_SESSION: 'sg_current_user_session_v1',
  CLOUD_DATA_PREFIX: 'sg_cloud_user_data_'
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

    const newUser = {
      id: `user_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password,
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

    const matched = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (matched) {
      this.setSession(matched);
      return {
        success: true,
        message: `Selamat datang kembali, ${matched.name}!`,
        user: matched
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
