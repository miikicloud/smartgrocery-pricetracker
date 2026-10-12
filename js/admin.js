/**
 * admin.js
 * Modul Live Editor & Control Center untuk Super Admin Mikayla Subrata
 */

import { Auth } from './auth.js';
import { SoundFeedback } from './storage.js';

export const AdminPanel = {
  /**
   * Buka panel Live Admin Editor
   * @param {object} appInstance 
   */
  open(appInstance) {
    if (!Auth.isAdmin()) {
      alert('Akses Ditolak! Anda harus login sebagai Super Admin.');
      return;
    }

    const modal = document.getElementById('adminModal');
    if (!modal) return;

    this.populateFields(appInstance);
    modal.classList.add('open');
    SoundFeedback.success();
  },

  close() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.remove('open');
  },

  populateFields(appInstance) {
    const config = Auth.getAppConfig();
    const inputTitle = document.getElementById('adminInputTitle');
    const inputSubtitle = document.getElementById('adminInputSubtitle');
    const inputAnnouncement = document.getElementById('adminInputAnnouncement');
    const selectColor = document.getElementById('adminSelectColor');
    const usersTableBody = document.getElementById('adminUsersTableBody');

    if (inputTitle) inputTitle.value = config.appName;
    if (inputSubtitle) inputSubtitle.value = config.appSubtitle;
    if (inputAnnouncement) inputAnnouncement.value = config.announcement;
    if (selectColor) selectColor.value = config.accentColor;

    // Tampilkan daftar akun di cloud
    if (usersTableBody) {
      const users = Auth.getUsers();
      usersTableBody.innerHTML = users.map((u) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.75rem;">
          <div>
            <div style="font-weight:700; color:var(--text-main);">
              ${u.name} ${u.role === 'admin' ? '<span style="color:#f59e0b; font-size:0.7rem;">👑 Admin</span>' : '<span style="color:var(--text-muted); font-size:0.7rem;">Siswa</span>'}
            </div>
            <div style="color:var(--text-muted); font-size:0.7rem;">${u.email}</div>
          </div>
          <span style="font-family:var(--font-mono); font-size:0.68rem; color:var(--text-secondary);">
            ${u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : 'Aktif'}
          </span>
        </div>
      `).join('');
    }
  },

  /**
   * Terapkan live changes ke seluruh aplikasi
   * @param {object} appInstance 
   */
  applyLiveChanges(appInstance) {
    const inputTitle = document.getElementById('adminInputTitle');
    const inputSubtitle = document.getElementById('adminInputSubtitle');
    const inputAnnouncement = document.getElementById('adminInputAnnouncement');
    const selectColor = document.getElementById('adminSelectColor');

    const config = {
      appName: inputTitle.value.trim() || 'Smart Grocery',
      appSubtitle: inputSubtitle.value.trim() || 'Budget Safety Tracker',
      announcement: inputAnnouncement.value.trim(),
      accentColor: selectColor.value || '#10b981'
    };

    Auth.saveAppConfig(config);
    this.applyConfigToDOM(config);

    SoundFeedback.success();
    appInstance.showToast('✅ Perubahan Live Aplikasi Berhasil Diterapkan!');
    this.close();
  },

  /**
   * Terapkan ke tampilan DOM saat ini secara reaktif
   * @param {object} config 
   */
  applyConfigToDOM(config) {
    // 1. Ubah Brand Title & Subtitle di Header
    const brandTitle = document.querySelector('.brand-title');
    const brandSub = document.querySelector('.brand-sub');
    if (brandTitle) brandTitle.textContent = config.appName;
    if (brandSub) brandSub.textContent = config.appSubtitle;

    // 2. Ubah Warna Aksen CSS Variabel
    document.documentElement.style.setProperty('--emerald-500', config.accentColor);

    // 3. Update Banner Pengumuman Global
    const banner = document.getElementById('globalAnnouncementBanner');
    const bannerText = document.getElementById('globalAnnouncementText');
    if (banner && bannerText) {
      if (config.announcement) {
        bannerText.textContent = config.announcement;
        banner.style.display = 'flex';
      } else {
        banner.style.display = 'none';
      }
    }
  }
};
