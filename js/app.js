/**
 * app.js
 * Controller Utama Smart Grocery & Budget Safety Tracker PWA
 */

import { CATEGORIES, UNITS, QUICK_CATALOG } from './data.js';
import { Calculations } from './calculations.js';
import { Storage, SoundFeedback } from './storage.js';
import { getIcon } from './icons.js';
import { Auth, SUPER_ADMIN_CREDENTIALS } from './auth.js';
import { AdminPanel } from './admin.js';

class SmartGroceryApp {
  constructor() {
    this.currentTab = 'belanja'; // 'belanja', 'riwayat', 'anggaran'
    this.selectedCategory = 'all';
    this.items = Storage.getItems();
    this.budgetConfig = Storage.getBudgetConfig();
    this.historySessions = Storage.getHistory();
    this.editingItemId = null;
    this.deferredPrompt = null;

    this.initElements();
    this.attachEventListeners();
    this.setupPWAInstall();
    this.initAuthAndAdmin();
    this.render();
  }

  initElements() {
    // Header & Budget Gauge
    this.headerBudgetCard = document.getElementById('budgetSafetyCard');
    this.budgetStatusPill = document.getElementById('budgetStatusPill');
    this.budgetCurrentSpent = document.getElementById('budgetCurrentSpent');
    this.budgetCapDisplay = document.getElementById('budgetCapDisplay');
    this.budgetProgressFill = document.getElementById('budgetProgressFill');
    this.budgetRemainingText = document.getElementById('budgetRemainingText');
    this.safetyBufferTag = document.getElementById('safetyBufferTag');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.checkoutSimBtn = document.getElementById('checkoutSimBtn');

    // Main Containers
    this.viewBelanja = document.getElementById('viewBelanja');
    this.viewRiwayat = document.getElementById('viewRiwayat');
    this.viewAnggaran = document.getElementById('viewAnggaran');
    this.quickCatalogScroll = document.getElementById('quickCatalogScroll');
    this.categoryFilterRow = document.getElementById('categoryFilterRow');
    this.groceryListContainer = document.getElementById('groceryListContainer');
    this.historyListContainer = document.getElementById('historyListContainer');
    this.navBtnAddItem = document.getElementById('navBtnAddItem');
    this.inlineAddBtn = document.getElementById('inlineAddBtn');
    this.headerAddBtn = document.getElementById('headerAddBtn');

    // Navigation Tabs
    this.navTabs = document.querySelectorAll('.nav-tab-btn');
    this.cartCountBadge = document.getElementById('cartCountBadge');

    // Item Modal Elements
    this.itemModal = document.getElementById('itemModal');
    this.modalTitle = document.getElementById('modalTitle');
    this.itemForm = document.getElementById('itemForm');
    this.inputName = document.getElementById('inputName');
    this.inputCategory = document.getElementById('inputCategory');
    this.inputUnit = document.getElementById('inputUnit');
    this.inputQty = document.getElementById('inputQty');
    this.inputUnitPrice = document.getElementById('inputUnitPrice');
    this.inputLastMonthPrice = document.getElementById('inputLastMonthPrice');
    this.inputDisc1 = document.getElementById('inputDisc1');
    this.inputDisc2 = document.getElementById('inputDisc2');
    this.inputFixedDiscount = document.getElementById('inputFixedDiscount');
    this.inputNotes = document.getElementById('inputNotes');
    this.modalLivePreview = document.getElementById('modalLivePreview');
    this.modalFluctuationPreview = document.getElementById('modalFluctuationPreview');
    this.autoMemoryNotice = document.getElementById('autoMemoryNotice');
    this.btnCancelModal = document.getElementById('btnCancelModal');
    this.sheetHandle = document.getElementById('sheetHandle');

    // Checkout Modal
    this.checkoutModal = document.getElementById('checkoutModal');
    this.checkoutReceiptBody = document.getElementById('checkoutReceiptBody');
    this.btnCloseCheckout = document.getElementById('btnCloseCheckout');
    this.btnFinishShopping = document.getElementById('btnFinishShopping');

    // Budget Settings Elements in Tab 3
    this.inputBudgetCap = document.getElementById('inputBudgetCap');
    this.inputSafetyBuffer = document.getElementById('inputSafetyBuffer');
    this.btnSaveBudget = document.getElementById('btnSaveBudget');
    this.btnResetDemoData = document.getElementById('btnResetDemoData');
    this.btnExportShare = document.getElementById('btnExportShare');

    // Toast Banner
    this.toastBanner = document.getElementById('toastBanner');
    this.toastText = document.getElementById('toastText');

    // Auth & Admin Elements
    this.userAuthBtn = document.getElementById('userAuthBtn');
    this.adminPanelBtn = document.getElementById('adminPanelBtn');
    this.authModal = document.getElementById('authModal');
    this.btnCloseAuth = document.getElementById('btnCloseAuth');
    this.authLoggedInView = document.getElementById('authLoggedInView');
    this.authFormView = document.getElementById('authFormView');
    this.tabAuthLogin = document.getElementById('tabAuthLogin');
    this.tabAuthRegister = document.getElementById('tabAuthRegister');
    this.loginForm = document.getElementById('loginForm');
    this.loginEmail = document.getElementById('loginEmail');
    this.loginPassword = document.getElementById('loginPassword');
    this.quickLoginAdminBtn = document.getElementById('quickLoginAdminBtn');
    this.registerForm = document.getElementById('registerForm');
    this.registerName = document.getElementById('registerName');
    this.registerEmail = document.getElementById('registerEmail');
    this.registerPassword = document.getElementById('registerPassword');
    this.btnLogout = document.getElementById('btnLogout');
    this.btnOpenAdminFromAuth = document.getElementById('btnOpenAdminFromAuth');

    // Admin Modal Elements
    this.adminModal = document.getElementById('adminModal');
    this.btnCloseAdmin = document.getElementById('btnCloseAdmin');
    this.adminForm = document.getElementById('adminForm');
  }

  attachEventListeners() {
    // Navigation Tabs
    this.navTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        SoundFeedback.tap();
        const targetTab = tab.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // Super Admin Panel Button & Modal
    if (this.adminPanelBtn) {
      this.adminPanelBtn.addEventListener('click', () => {
        AdminPanel.open(this);
      });
    }

    if (this.btnOpenAdminFromAuth) {
      this.btnOpenAdminFromAuth.addEventListener('click', () => {
        this.authModal.classList.remove('open');
        AdminPanel.open(this);
      });
    }

    if (this.btnCloseAdmin) {
      this.btnCloseAdmin.addEventListener('click', () => {
        AdminPanel.close();
      });
    }

    if (this.adminForm) {
      this.adminForm.addEventListener('submit', (e) => {
        e.preventDefault();
        AdminPanel.applyLiveChanges(this);
      });
    }

    // User Auth Modal Open / Close
    if (this.userAuthBtn) {
      this.userAuthBtn.addEventListener('click', () => {
        SoundFeedback.tap();
        this.openAuthModal();
      });
    }

    if (this.btnCloseAuth) {
      this.btnCloseAuth.addEventListener('click', () => {
        this.authModal.classList.remove('open');
      });
    }

    // Auth Tabs Switch (Masuk vs Daftar)
    if (this.tabAuthLogin && this.tabAuthRegister) {
      this.tabAuthLogin.addEventListener('click', () => {
        this.tabAuthLogin.classList.add('active');
        this.tabAuthRegister.classList.remove('active');
        this.loginForm.style.display = 'block';
        this.registerForm.style.display = 'none';
      });

      this.tabAuthRegister.addEventListener('click', () => {
        this.tabAuthRegister.classList.add('active');
        this.tabAuthLogin.classList.remove('active');
        this.registerForm.style.display = 'block';
        this.loginForm.style.display = 'none';
      });
    }

    // Quick Login Super Admin Button (Mikayla Subrata)
    if (this.quickLoginAdminBtn) {
      this.quickLoginAdminBtn.addEventListener('click', () => {
        this.loginEmail.value = SUPER_ADMIN_CREDENTIALS.email;
        this.loginPassword.value = SUPER_ADMIN_CREDENTIALS.password;
        this.processLogin(SUPER_ADMIN_CREDENTIALS.email, SUPER_ADMIN_CREDENTIALS.password);
      });
    }

    // Login Form Submit
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processLogin(this.loginEmail.value, this.loginPassword.value);
      });
    }

    // Register Form Submit
    if (this.registerForm) {
      this.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const res = Auth.register(
          this.registerName.value,
          this.registerEmail.value,
          this.registerPassword.value
        );
        if (res.success) {
          SoundFeedback.success();
          this.showToast(res.message);
          this.updateAuthUI();
          this.syncCurrentDataWithCloud();
        } else {
          alert(res.message);
        }
      });
    }

    // Logout Button
    if (this.btnLogout) {
      this.btnLogout.addEventListener('click', () => {
        Auth.logout();
        SoundFeedback.tap();
        this.showToast('Anda telah logout dari akun.');
        this.updateAuthUI();
      });
    }

    // Theme Toggle
    this.themeToggleBtn.addEventListener('click', () => {
      SoundFeedback.tap();
      const current = document.body.dataset.theme;
      const nextTheme = current === 'light' ? 'dark' : 'light';
      document.body.dataset.theme = nextTheme;
      localStorage.setItem('sg_theme', nextTheme);
      this.updateThemeIcon();
    });

    // Checkout Sim Button
    this.checkoutSimBtn.addEventListener('click', () => {
      SoundFeedback.tap();
      this.openCheckoutModal();
    });

    this.btnCloseCheckout.addEventListener('click', () => {
      this.checkoutModal.classList.remove('open');
    });

    // Selesaikan Belanja & Arsipkan ke Riwayat
    this.btnFinishShopping.addEventListener('click', () => {
      this.finishAndArchiveShopping();
    });

    // Add Item Triggers (Bottom Nav Bar, Inline Button, and Header Icon)
    const addTriggers = [this.navBtnAddItem, this.inlineAddBtn, this.headerAddBtn];
    addTriggers.forEach((btn) => {
      if (btn) {
        btn.addEventListener('click', () => {
          SoundFeedback.tap();
          this.openItemModal();
        });
      }
    });

    // Modal Close
    this.btnCancelModal.addEventListener('click', () => {
      this.closeItemModal();
    });

    this.itemModal.addEventListener('click', (e) => {
      if (e.target === this.itemModal) {
        this.closeItemModal();
      }
    });

    // Real-time calculation previews inside item modal
    const liveCalcInputs = [
      this.inputUnitPrice,
      this.inputQty,
      this.inputLastMonthPrice,
      this.inputDisc1,
      this.inputDisc2,
      this.inputFixedDiscount
    ];
    liveCalcInputs.forEach((input) => {
      input.addEventListener('input', () => this.updateModalLivePreview());
    });

    // Quick Edit Budget by tapping the sticky header budget card
    if (this.headerBudgetCard) {
      this.headerBudgetCard.style.cursor = 'pointer';
      this.headerBudgetCard.addEventListener('click', () => {
        SoundFeedback.tap();
        this.switchTab('anggaran');
      });
    }

    // Auto-complete & prefill when typing product name
    this.inputName.addEventListener('input', () => {
      this.handleProductNameAutoFill(this.inputName.value.trim());
      this.updateModalLivePreview();
    });

    // Quick Discount Presets in Modal
    const discChips = document.querySelectorAll('.disc-preset-chip');
    discChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        SoundFeedback.tap();
        discChips.forEach((c) => c.classList.remove('active-preset'));
        chip.classList.add('active-preset');

        const d1 = Number(chip.dataset.d1) || 0;
        const d2 = Number(chip.dataset.d2) || 0;
        this.inputDisc1.value = d1;
        this.inputDisc2.value = d2;
        this.updateModalLivePreview();
      });
    });

    // Quick Budget Presets in Tab 3 (Anggaran)
    const budgetChips = document.querySelectorAll('.budget-preset-chip');
    budgetChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        SoundFeedback.success();
        const amount = Number(chip.dataset.amount) || 0;
        this.inputBudgetCap.value = amount;
        this.budgetConfig.budgetCap = amount;
        Storage.saveBudgetConfig(this.budgetConfig);
        this.showToast(`Batas saku belanja diatur: ${Calculations.formatRupiah(amount)}`);
        this.render();
      });
    });

    // Form Submit
    this.itemForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveItemFromForm();
    });

    // Save Budget Configuration in Tab 3
    if (this.btnSaveBudget) {
      this.btnSaveBudget.addEventListener('click', () => {
        const newCap = Math.max(0, Number(this.inputBudgetCap.value) || 0);
        const newBuffer = Math.max(0, Number(this.inputSafetyBuffer.value) || 0);
        this.budgetConfig.budgetCap = newCap;
        this.budgetConfig.safetyBuffer = newBuffer;
        Storage.saveBudgetConfig(this.budgetConfig);
        this.syncCurrentDataWithCloud();
        SoundFeedback.success();
        this.showToast('Anggaran berhasil diperbarui!');
        this.render();
      });
    }

    // Reset Data
    if (this.btnResetDemoData) {
      this.btnResetDemoData.addEventListener('click', () => {
        if (confirm('Kembalikan data barang & riwayat ke contoh awal anak rantau?')) {
          Storage.resetToSampleData();
          this.items = Storage.getItems();
          this.budgetConfig = Storage.getBudgetConfig();
          this.historySessions = Storage.getHistory();
          SoundFeedback.success();
          this.showToast('Data berhasil di-reset ke template awal!');
          this.render();
        }
      });
    }

    // Share / WhatsApp List Export
    if (this.btnExportShare) {
      this.btnExportShare.addEventListener('click', () => {
        this.exportListToClipboard();
      });
    }
  }

  setupPWAInstall() {
    // Listen for PWA beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installPwaBtn = document.getElementById('installPwaBtn');
      if (installPwaBtn) {
        installPwaBtn.style.display = 'inline-flex';
        installPwaBtn.addEventListener('click', async () => {
          if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            if (outcome === 'accepted') {
              this.showToast('Aplikasi berhasil dipasang di layar utama HP!');
            }
            this.deferredPrompt = null;
            installPwaBtn.style.display = 'none';
          }
        });
      }
    });

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          console.log('ServiceWorker terdaftar:', reg.scope);
        }).catch((err) => {
          console.warn('ServiceWorker gagal:', err);
        });
      });
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('sg_theme') || 'dark';
    document.body.dataset.theme = savedTheme;
    this.updateThemeIcon();
  }

  updateThemeIcon() {
    const isLight = document.body.dataset.theme === 'light';
    this.themeToggleBtn.innerHTML = isLight ? getIcon('moon') : getIcon('sun');
  }

  // ==========================================================================
  // AUTENTIKASI, CLOUD SYNC & SUPER ADMIN LIVE EDIT
  // ==========================================================================

  initAuthAndAdmin() {
    // 1. Terapkan App Config dari Admin
    const appConfig = Auth.getAppConfig();
    AdminPanel.applyConfigToDOM(appConfig);

    // 2. Sinkronkan tampilan status akun & status Super Admin
    this.updateAuthUI();

    // 3. Jika user login, pulihkan data dari cloud jika tersedia
    const user = Auth.getCurrentUser();
    if (user) {
      const cloudData = Auth.loadFromCloud(user.id);
      if (cloudData) {
        if (cloudData.items && Array.isArray(cloudData.items)) {
          this.items = cloudData.items;
          Storage.saveItems(this.items);
        }
        if (cloudData.budgetConfig) {
          this.budgetConfig = cloudData.budgetConfig;
          Storage.saveBudgetConfig(this.budgetConfig);
        }
        if (cloudData.history && Array.isArray(cloudData.history)) {
          this.historySessions = cloudData.history;
          Storage.saveHistory(this.historySessions);
        }
        if (cloudData.priceMemory) {
          try {
            localStorage.setItem('sg_price_memory_v1', JSON.stringify(cloudData.priceMemory));
          } catch (e) {}
        }
      } else {
        this.syncCurrentDataWithCloud();
      }
    }
  }

  openAuthModal() {
    const user = Auth.getCurrentUser();
    if (user) {
      this.authLoggedInView.style.display = 'flex';
      this.authFormView.style.display = 'none';

      const nameDisplay = document.getElementById('authUserNameDisplay');
      const emailDisplay = document.getElementById('authUserEmailDisplay');
      const roleBadge = document.getElementById('authRoleBadge');
      if (nameDisplay) nameDisplay.textContent = user.name;
      if (emailDisplay) emailDisplay.textContent = user.email;

      const isAdmin = user.role === 'admin' || user.email.toLowerCase() === SUPER_ADMIN_CREDENTIALS.email.toLowerCase();
      if (roleBadge) {
        if (isAdmin) {
          roleBadge.className = 'budget-status-pill pill-warning';
          roleBadge.innerHTML = '👑 Super Admin';
        } else {
          roleBadge.className = 'budget-status-pill pill-safe';
          roleBadge.innerHTML = '🎓 Siswa';
        }
      }

      if (this.btnOpenAdminFromAuth) {
        this.btnOpenAdminFromAuth.style.display = isAdmin ? 'block' : 'none';
      }
    } else {
      this.authLoggedInView.style.display = 'none';
      this.authFormView.style.display = 'block';
    }

    this.authModal.classList.add('open');
  }

  processLogin(email, password) {
    const result = Auth.login(email, password);
    if (result.success) {
      SoundFeedback.success();
      this.showToast(result.message);
      this.updateAuthUI();

      // Sinkronkan data cloud pengguna
      const cloudData = Auth.loadFromCloud(result.user.id);
      if (cloudData) {
        if (cloudData.items && Array.isArray(cloudData.items)) {
          this.items = cloudData.items;
          Storage.saveItems(this.items);
        }
        if (cloudData.budgetConfig) {
          this.budgetConfig = cloudData.budgetConfig;
          Storage.saveBudgetConfig(this.budgetConfig);
        }
        if (cloudData.history && Array.isArray(cloudData.history)) {
          this.historySessions = cloudData.history;
          Storage.saveHistory(this.historySessions);
        }
        this.render();
      } else {
        this.syncCurrentDataWithCloud();
      }

      this.authModal.classList.remove('open');

      if (result.isAdmin) {
        setTimeout(() => {
          this.showToast('👑 Mode Super Admin Aktif! Ketuk ikon mahkota untuk Live Edit.');
        }, 1200);
      }
    } else {
      SoundFeedback.warning();
      alert(result.message);
    }
  }

  updateAuthUI() {
    const user = Auth.getCurrentUser();
    const isAdmin = Auth.isAdmin();

    // Toggle tombol mahkota Super Admin di header
    if (this.adminPanelBtn) {
      this.adminPanelBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    // Ubah visual tombol akun di header
    if (this.userAuthBtn) {
      if (user) {
        this.userAuthBtn.style.borderColor = isAdmin ? '#f59e0b' : 'var(--emerald-500)';
        this.userAuthBtn.style.color = isAdmin ? '#fbbf24' : 'var(--emerald-400)';
        this.userAuthBtn.title = `Akun: ${user.name} (${user.email})`;
      } else {
        this.userAuthBtn.style.borderColor = '';
        this.userAuthBtn.style.color = '';
        this.userAuthBtn.title = 'Akun & Cloud Sync';
      }
    }
  }

  syncCurrentDataWithCloud() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const dataPayload = {
      userId: user.id,
      userEmail: user.email,
      lastSynced: new Date().toISOString(),
      items: this.items,
      budgetConfig: this.budgetConfig,
      history: this.historySessions,
      priceMemory: Storage.getPriceMemory()
    };

    Auth.syncToCloud(user.id, dataPayload);
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    this.navTabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    this.viewBelanja.style.display = tabId === 'belanja' ? 'block' : 'none';
    this.viewRiwayat.style.display = tabId === 'riwayat' ? 'block' : 'none';
    this.viewAnggaran.style.display = tabId === 'anggaran' ? 'block' : 'none';

    if (tabId === 'riwayat') {
      this.renderHistory();
    } else if (tabId === 'anggaran') {
      this.renderBudgetTab();
    }
  }

  showToast(message, isDanger = false) {
    this.toastText.textContent = message;
    this.toastBanner.classList.toggle('toast-danger', isDanger);
    this.toastBanner.classList.add('show');
    setTimeout(() => {
      this.toastBanner.classList.remove('show');
    }, 3200);
  }

  // ==========================================================================
  // RENDER CONTROLLERS
  // ==========================================================================

  render() {
    this.renderBudgetCapHeader();
    this.renderCategoryFilters();
    this.renderQuickCatalog();
    this.renderGroceryList();
    this.updateCartBadge();
  }

  updateCartBadge() {
    const cartCount = this.items.filter((item) => item.inCart).length;
    this.cartCountBadge.textContent = cartCount;
    this.cartCountBadge.style.display = cartCount > 0 ? 'flex' : 'none';
  }

  // Hitung total belanjaan di troli
  getTotalSpent() {
    return this.items
      .filter((item) => item.inCart)
      .reduce((sum, item) => {
        const discInfo = Calculations.calculateTieredDiscount(
          item.unitPrice,
          item.disc1,
          item.disc2,
          item.fixedDiscount
        );
        return sum + Calculations.calculateItemTotal(discInfo.finalUnitPrice, item.qty);
      }, 0);
  }

  // Hitung total seluruh belanjaan (troli + daftar rencana)
  getTotalPlanned() {
    return this.items.reduce((sum, item) => {
      const discInfo = Calculations.calculateTieredDiscount(
        item.unitPrice,
        item.disc1,
        item.disc2,
        item.fixedDiscount
      );
      return sum + Calculations.calculateItemTotal(discInfo.finalUnitPrice, item.qty);
    }, 0);
  }

  renderBudgetCapHeader() {
    const totalSpent = this.getTotalSpent();
    const evaluation = Calculations.evaluateBudgetSafety(
      totalSpent,
      this.budgetConfig.budgetCap,
      this.budgetConfig.safetyBuffer
    );

    // Update Card Class & Styles
    this.headerBudgetCard.className = `budget-safety-card ${evaluation.themeClass}`;
    
    // Status Pill
    let pillClass = 'pill-safe';
    if (evaluation.level === 'warning') pillClass = 'pill-warning';
    if (evaluation.level === 'critical') pillClass = 'pill-critical';
    if (evaluation.level === 'danger') {
      pillClass = 'pill-danger';
      SoundFeedback.warning();
    }

    this.budgetStatusPill.className = `budget-status-pill ${pillClass}`;
    this.budgetStatusPill.innerHTML = `${getIcon('shield', 'pill-icon')} ${evaluation.statusTitle.replace(/🚨|⚠️|✅|⚡/g, '').trim()}`;

    // Current spent & Cap
    this.budgetCurrentSpent.textContent = Calculations.formatRupiah(totalSpent);
    this.budgetCapDisplay.textContent = `/ ${Calculations.formatRupiah(this.budgetConfig.budgetCap)}`;

    // Progress Bar
    const pct = Math.min(100, evaluation.usedPercentage);
    this.budgetProgressFill.style.width = `${pct}%`;
    this.budgetProgressFill.className = `budget-progress-fill fill-${evaluation.level}`;

    // Remaining Info
    if (evaluation.isOverbudget) {
      this.budgetRemainingText.innerHTML = `<span style="color:var(--rose-400)">Over: <b>${Calculations.formatRupiah(evaluation.overAmount)}</b></span>`;
    } else {
      this.budgetRemainingText.innerHTML = `Sisa Saku: <b>${Calculations.formatRupiah(evaluation.remainingBudget)}</b>`;
    }

    this.safetyBufferTag.innerHTML = `${getIcon('tag')} Cadangan: ${Calculations.formatRupiah(this.budgetConfig.safetyBuffer)}`;
  }

  renderCategoryFilters() {
    this.categoryFilterRow.innerHTML = '';
    
    // "Semua" Filter Pill
    const allBtn = document.createElement('button');
    allBtn.className = `filter-pill ${this.selectedCategory === 'all' ? 'active' : ''}`;
    allBtn.textContent = `Semua (${this.items.length})`;
    allBtn.addEventListener('click', () => {
      SoundFeedback.tap();
      this.selectedCategory = 'all';
      this.render();
    });
    this.categoryFilterRow.appendChild(allBtn);

    // Categories
    CATEGORIES.forEach((cat) => {
      const count = this.items.filter((it) => it.category === cat.id).length;
      const btn = document.createElement('button');
      btn.className = `filter-pill ${this.selectedCategory === cat.id ? 'active' : ''}`;
      btn.innerHTML = `${getIcon(cat.icon)} ${cat.name} (${count})`;
      btn.addEventListener('click', () => {
        SoundFeedback.tap();
        this.selectedCategory = cat.id;
        this.render();
      });
      this.categoryFilterRow.appendChild(btn);
    });
  }

  renderQuickCatalog() {
    this.quickCatalogScroll.innerHTML = '';
    QUICK_CATALOG.forEach((item) => {
      const chip = document.createElement('button');
      chip.className = 'quick-chip';
      chip.innerHTML = `
        ${getIcon('plus')}
        <span>${item.name}</span>
        <span class="quick-chip-price">${Calculations.formatRupiah(item.unitPrice)}</span>
      `;
      chip.addEventListener('click', () => {
        SoundFeedback.success();
        this.addQuickCatalogItem(item);
      });
      this.quickCatalogScroll.appendChild(chip);
    });
  }

  addQuickCatalogItem(template) {
    // Cari apakah barang sudah ada di list
    const existing = this.items.find((it) => it.name.toLowerCase() === template.name.toLowerCase());
    if (existing) {
      existing.qty += 1;
      existing.inCart = true;
      this.showToast(`+1 ${existing.name} dimasukkan ke troli!`);
    } else {
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: template.name,
        category: template.category,
        unit: template.unit,
        qty: template.defaultQty || 1,
        unitPrice: template.unitPrice,
        lastMonthPrice: template.lastMonthPrice,
        disc1: template.disc1 || 0,
        disc2: template.disc2 || 0,
        fixedDiscount: template.fixedDiscount || 0,
        inCart: true,
        notes: template.notes || ''
      };
      this.items.unshift(newItem);
      this.showToast(`${newItem.name} ditambahkan ke troli!`);
    }
    Storage.saveItems(this.items);
    this.syncCurrentDataWithCloud();
    this.render();
  }

  renderGroceryList() {
    this.groceryListContainer.innerHTML = '';

    const filteredItems = this.selectedCategory === 'all'
      ? this.items
      : this.items.filter((it) => it.category === this.selectedCategory);

    if (filteredItems.length === 0) {
      this.groceryListContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${getIcon('cart')}</div>
          <h4 style="color:var(--text-main); font-size:1.05rem;">Troli Kosong</h4>
          <p style="font-size:0.85rem;">Pilih barang dari menu <b>Tambah Cepat</b> di atas atau ketuk tombol <b>+ Tambah Barang</b> di bawah.</p>
        </div>
      `;
      return;
    }

    filteredItems.forEach((item) => {
      const card = this.createItemCard(item);
      this.groceryListContainer.appendChild(card);
    });
  }

  createItemCard(item) {
    const card = document.createElement('div');
    card.className = `grocery-card ${item.inCart ? 'in-cart' : 'not-in-cart'}`;
    card.dataset.id = item.id;

    // Kalkulasi diskon bertingkat
    const discountInfo = Calculations.calculateTieredDiscount(
      item.unitPrice,
      item.disc1,
      item.disc2,
      item.fixedDiscount
    );

    // Kalkulasi total item
    const itemTotal = Calculations.calculateItemTotal(discountInfo.finalUnitPrice, item.qty);

    // Deteksi fluktuasi harga vs bulan lalu
    const fluctuation = Calculations.comparePriceFluctuation(item.unitPrice, item.lastMonthPrice);

    // Kategori Info
    const catObj = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[5];

    // Card Header Row
    let discountBadgeHtml = '';
    if (discountInfo.hasDiscount) {
      discountBadgeHtml = `
        <span class="discount-chip">
          ${getIcon('tag')} Diskon ${item.disc1}%${item.disc2 > 0 ? ` + ${item.disc2}%` : ''} 
          (Hemat ${Calculations.formatRupiah(discountInfo.savingPerUnit * item.qty)})
        </span>
      `;
    }

    // Harga satuan kalkulasi
    let unitPriceDisplayHtml = '';
    if (discountInfo.hasDiscount) {
      unitPriceDisplayHtml = `
        <span class="original-struck">${Calculations.formatRupiah(item.unitPrice)}</span>
        <span>${Calculations.formatRupiah(discountInfo.finalUnitPrice)} / ${item.unit}</span>
      `;
    } else {
      unitPriceDisplayHtml = `<span>${Calculations.formatRupiah(item.unitPrice)} / ${item.unit}</span>`;
    }

    card.innerHTML = `
      <div class="card-top-row">
        <!-- Big Checkbox Button for Shopping Trolley -->
        <button class="cart-toggle-btn" aria-label="Tandai di troli" title="Masukkan ke troli">
          ${getIcon('check')}
        </button>

        <div class="card-info">
          <div class="item-name-row">
            <h3 class="item-name">${item.name}</h3>
          </div>

          <div class="item-category-unit">
            <span class="category-tag">${getIcon(catObj.icon)} ${catObj.name}</span>
            <span>• Satuan: ${item.unit}</span>
          </div>

          <!-- Price Fluctuation & Discount Badges -->
          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:4px; margin-top:2px;">
            <div class="fluctuation-badge ${fluctuation.badgeClass}">
              ${getIcon(fluctuation.icon)} ${fluctuation.label}
            </div>
            ${discountBadgeHtml}
          </div>

          ${item.notes ? `<div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;">💬 ${item.notes}</div>` : ''}
        </div>
      </div>

      <!-- Ergonomic Stepper & Instant Math -->
      <div class="card-bottom-row">
        <div class="stepper-container">
          <button class="stepper-btn btn-minus" aria-label="Kurangi kuantitas">
            ${getIcon('minus')}
          </button>
          <span class="stepper-value">${item.qty}</span>
          <button class="stepper-btn btn-plus" aria-label="Tambah kuantitas">
            ${getIcon('plus')}
          </button>
        </div>

        <div class="price-calculation-box">
          <div class="item-unit-price-calc">${unitPriceDisplayHtml}</div>
          <div class="item-total-price">${Calculations.formatRupiah(itemTotal)}</div>
        </div>
      </div>

      <!-- Card Action Bar -->
      <div class="card-action-bar">
        <button class="mini-action-btn btn-edit">
          ${getIcon('edit')} Edit
        </button>
        <button class="mini-action-btn delete-btn btn-delete">
          ${getIcon('trash')} Hapus
        </button>
      </div>
    `;

    // Event: Toggle Trolley In/Out
    const toggleBtn = card.querySelector('.cart-toggle-btn');
    toggleBtn.addEventListener('click', () => {
      item.inCart = !item.inCart;
      if (item.inCart) {
        SoundFeedback.success();
      } else {
        SoundFeedback.tap();
      }
      Storage.saveItems(this.items);
      this.render();
    });

    // Event: Stepper Plus
    const btnPlus = card.querySelector('.btn-plus');
    btnPlus.addEventListener('click', () => {
      item.qty += 1;
      SoundFeedback.tap();
      Storage.saveItems(this.items);
      this.render();
    });

    // Event: Stepper Minus
    const btnMinus = card.querySelector('.btn-minus');
    btnMinus.addEventListener('click', () => {
      if (item.qty > 1) {
        item.qty -= 1;
        SoundFeedback.tap();
        Storage.saveItems(this.items);
        this.render();
      } else {
        // Jika 1 lalu ditekan minus, konfirmasi hapus
        if (confirm(`Keluarkan ${item.name} dari troli/daftar?`)) {
          this.deleteItem(item.id);
        }
      }
    });

    // Event: Edit
    const btnEdit = card.querySelector('.btn-edit');
    btnEdit.addEventListener('click', () => {
      SoundFeedback.tap();
      this.openItemModal(item);
    });

    // Event: Delete
    const btnDelete = card.querySelector('.btn-delete');
    btnDelete.addEventListener('click', () => {
      if (confirm(`Hapus "${item.name}" dari troli?`)) {
        this.deleteItem(item.id);
      }
    });

    return card;
  }

  deleteItem(id) {
    this.items = this.items.filter((it) => it.id !== id);
    Storage.saveItems(this.items);
    this.syncCurrentDataWithCloud();
    SoundFeedback.tap();
    this.showToast('Barang berhasil dihapus');
    this.render();
  }

  // ==========================================================================
  // MODAL BOTTOM SHEET ADD / EDIT
  // ==========================================================================

  populateDatalistSuggestions() {
    const datalist = document.getElementById('productSuggestions');
    if (!datalist) return;

    // Kumpulkan nama unik dari katalog cepat, riwayat, memori harga, dan daftar belanja aktif
    const namesSet = new Set();
    QUICK_CATALOG.forEach((it) => namesSet.add(it.name));
    this.items.forEach((it) => namesSet.add(it.name));
    
    // Tambahkan dari memori harga historis
    const priceMem = Storage.getPriceMemory();
    Object.values(priceMem).forEach((it) => {
      if (it && it.name) namesSet.add(it.name);
    });

    this.historySessions.forEach((session) => {
      if (session.items) {
        session.items.forEach((it) => namesSet.add(it.name));
      }
    });

    datalist.innerHTML = Array.from(namesSet)
      .map((name) => `<option value="${name}"></option>`)
      .join('');
  }

  handleProductNameAutoFill(typedName) {
    if (!typedName || this.editingItemId) {
      if (this.autoMemoryNotice) this.autoMemoryNotice.style.display = 'none';
      return;
    }

    // 1. Cek Memori Harga Historis Permanen terlebih dahulu (Kasus: Tuna pernah dibeli Rp 10.000)
    const recorded = Storage.getRecordedPrice(typedName);
    if (recorded && recorded.price > 0) {
      if (recorded.category) this.inputCategory.value = recorded.category;
      if (recorded.unit) this.inputUnit.value = recorded.unit;
      this.inputLastMonthPrice.value = recorded.price;

      if (this.autoMemoryNotice) {
        this.autoMemoryNotice.style.display = 'block';
        this.autoMemoryNotice.innerHTML = `✨ <b>Riwayat Otomatis:</b> Terdeteksi harga sebelumnya <b>${Calculations.formatRupiah(recorded.price)}</b>. Otomatis dipasang sebagai patokan bulan lalu tanpa perlu diketik!`;
      }
      return;
    }

    // 2. Cek di Katalog Cepat bawaan
    const matchedCatalog = QUICK_CATALOG.find(
      (it) => it.name.toLowerCase() === typedName.toLowerCase()
    );

    if (matchedCatalog) {
      if (matchedCatalog.category) this.inputCategory.value = matchedCatalog.category;
      if (matchedCatalog.unit) this.inputUnit.value = matchedCatalog.unit;
      if (!this.inputUnitPrice.value || Number(this.inputUnitPrice.value) === 0) {
        this.inputUnitPrice.value = matchedCatalog.unitPrice;
      }
      this.inputLastMonthPrice.value = matchedCatalog.lastMonthPrice || matchedCatalog.unitPrice;
      if (matchedCatalog.disc1) this.inputDisc1.value = matchedCatalog.disc1;
      if (matchedCatalog.disc2) this.inputDisc2.value = matchedCatalog.disc2;

      if (this.autoMemoryNotice) {
        this.autoMemoryNotice.style.display = 'block';
        this.autoMemoryNotice.innerHTML = `✨ <b>Katalog Template:</b> Patokan bulan lalu <b>${Calculations.formatRupiah(matchedCatalog.lastMonthPrice || matchedCatalog.unitPrice)}</b> terpasang otomatis.`;
      }
      return;
    }

    // 3. Cari di Riwayat Sesi Belanja
    for (const session of this.historySessions) {
      if (session.items) {
        const foundHist = session.items.find(
          (it) => it.name.toLowerCase() === typedName.toLowerCase()
        );
        if (foundHist) {
          this.inputLastMonthPrice.value = foundHist.unitPrice;
          if (this.autoMemoryNotice) {
            this.autoMemoryNotice.style.display = 'block';
            this.autoMemoryNotice.innerHTML = `✨ <b>Riwayat Sesi Belanja:</b> Ditemukan patokan harga <b>${Calculations.formatRupiah(foundHist.unitPrice)}</b> dari belanjaan ${session.date}.`;
          }
          return;
        }
      }
    }

    if (this.autoMemoryNotice) {
      this.autoMemoryNotice.style.display = 'none';
    }
  }

  openItemModal(itemToEdit = null) {
    this.editingItemId = itemToEdit ? itemToEdit.id : null;
    this.modalTitle.textContent = itemToEdit ? 'Edit Barang Belanja' : 'Tambah Barang ke Troli';

    // Isi Datalist Autocomplete
    this.populateDatalistSuggestions();

    // Populate Category Options
    this.inputCategory.innerHTML = CATEGORIES.map(
      (c) => `<option value="${c.id}">${c.name}</option>`
    ).join('');

    // Populate Unit Options
    this.inputUnit.innerHTML = UNITS.map(
      (u) => `<option value="${u.id}">${u.label}</option>`
    ).join('');

    // Reset status active chip diskon
    document.querySelectorAll('.disc-preset-chip').forEach((c) => c.classList.remove('active-preset'));

    if (itemToEdit) {
      this.inputName.value = itemToEdit.name;
      this.inputCategory.value = itemToEdit.category;
      this.inputUnit.value = itemToEdit.unit;
      this.inputQty.value = itemToEdit.qty;
      this.inputUnitPrice.value = itemToEdit.unitPrice;
      this.inputLastMonthPrice.value = itemToEdit.lastMonthPrice || '';
      this.inputDisc1.value = itemToEdit.disc1 || 0;
      this.inputDisc2.value = itemToEdit.disc2 || 0;
      this.inputFixedDiscount.value = itemToEdit.fixedDiscount || 0;
      this.inputNotes.value = itemToEdit.notes || '';
    } else {
      this.itemForm.reset();
      this.inputQty.value = 1;
      this.inputDisc1.value = 0;
      this.inputDisc2.value = 0;
      this.inputFixedDiscount.value = 0;
    }

    this.updateModalLivePreview();
    this.itemModal.classList.add('open');
    setTimeout(() => this.inputName.focus(), 150);
  }

  closeItemModal() {
    this.itemModal.classList.remove('open');
    this.editingItemId = null;
  }

  updateModalLivePreview() {
    const rawPrice = Number(this.inputUnitPrice.value) || 0;
    const qty = Math.max(1, Number(this.inputQty.value) || 1);
    const pastPrice = Number(this.inputLastMonthPrice.value) || 0;
    const d1 = Number(this.inputDisc1.value) || 0;
    const d2 = Number(this.inputDisc2.value) || 0;
    const fixed = Number(this.inputFixedDiscount.value) || 0;

    const discCalc = Calculations.calculateTieredDiscount(rawPrice, d1, d2, fixed);
    const totalItem = Calculations.calculateItemTotal(discCalc.finalUnitPrice, qty);
    const fluctuation = Calculations.comparePriceFluctuation(rawPrice, pastPrice);

    // Live preview tiered discount (F-03)
    if (discCalc.hasDiscount && rawPrice > 0) {
      this.modalLivePreview.style.display = 'flex';
      this.modalLivePreview.innerHTML = `
        <div class="tiered-title">${getIcon('tag')} Rumus Diskon Bertingkat Aktif:</div>
        <div class="tiered-preview-calc">
          • Harga Awal: ${Calculations.formatRupiah(rawPrice)}<br>
          • Potongan 1 (${d1}%): -${Calculations.formatRupiah(rawPrice * (d1 / 100))} (Sisa: ${Calculations.formatRupiah(discCalc.priceAfterD1)})<br>
          ${d2 > 0 ? `• Potongan 2 (${d2}% dari sisa): -${Calculations.formatRupiah(discCalc.priceAfterD1 * (d2 / 100))} (Sisa: ${Calculations.formatRupiah(discCalc.priceAfterD2)})<br>` : ''}
          ${fixed > 0 ? `• Voucher Potongan: -${Calculations.formatRupiah(fixed)}<br>` : ''}
          <strong>Harga Satuan Bersih: ${Calculations.formatRupiah(discCalc.finalUnitPrice)}</strong><br>
          <span style="color:var(--emerald-400); font-weight:700;">
            Diskon Efektif: ${discCalc.effectiveDiscountPct}% | Total Hemat: ${Calculations.formatRupiah(discCalc.savingPerUnit * qty)}
          </span>
        </div>
      `;
    } else {
      this.modalLivePreview.style.display = 'none';
    }

    // Live preview fluctuation vs last month (F-04: ↑ Merah, ↓ Hijau, = Stabil)
    this.modalFluctuationPreview.innerHTML = `
      <div style="font-size:0.75rem; color:var(--text-secondary);">
        <b>Deteksi Fluktuasi Harga vs Bulan Lalu:</b><br>
        ${pastPrice > 0 ? `Bulan Lalu: ${Calculations.formatRupiah(pastPrice)}` : 'Belum ada data bulan lalu'}
      </div>
      <div class="fluctuation-badge ${fluctuation.badgeClass}" style="font-size:0.75rem; padding:4px 10px;">
        ${getIcon(fluctuation.icon)} <b>${fluctuation.label}</b>
      </div>
    `;
  }

  saveItemFromForm() {
    const name = this.inputName.value.trim();
    if (!name) {
      alert('Nama barang wajib diisi!');
      return;
    }

    const unitPrice = Math.max(0, Number(this.inputUnitPrice.value) || 0);
    const qty = Math.max(1, Number(this.inputQty.value) || 1);
    const lastMonthPrice = Math.max(0, Number(this.inputLastMonthPrice.value) || 0);
    const disc1 = Math.max(0, Math.min(100, Number(this.inputDisc1.value) || 0));
    const disc2 = Math.max(0, Math.min(100, Number(this.inputDisc2.value) || 0));
    const fixedDiscount = Math.max(0, Number(this.inputFixedDiscount.value) || 0);

    if (this.editingItemId) {
      // Edit mode
      const idx = this.items.findIndex((it) => it.id === this.editingItemId);
      if (idx !== -1) {
        this.items[idx] = {
          ...this.items[idx],
          name,
          category: this.inputCategory.value,
          unit: this.inputUnit.value,
          qty,
          unitPrice,
          lastMonthPrice,
          disc1,
          disc2,
          fixedDiscount,
          notes: this.inputNotes.value.trim()
        };
        this.showToast(`"${name}" berhasil diperbarui!`);
      }
    } else {
      // New item mode
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name,
        category: this.inputCategory.value,
        unit: this.inputUnit.value,
        qty,
        unitPrice,
        lastMonthPrice,
        disc1,
        disc2,
        fixedDiscount,
        inCart: true,
        notes: this.inputNotes.value.trim()
      };
      this.items.unshift(newItem);
      this.showToast(`"${name}" dimasukkan ke troli!`);
    }

    // Rekam ke Memori Harga Historis Otomatis (F-06 Auto Memory)
    // Supaya di bulan depan, pengguna tidak perlu mengetik harga bulan lalu lagi!
    Storage.recordProductPrice(name, unitPrice, this.inputCategory.value, this.inputUnit.value);

    Storage.saveItems(this.items);
    this.syncCurrentDataWithCloud();
    SoundFeedback.success();
    this.closeItemModal();
    this.render();
  }

  // ==========================================================================
  // CHECKOUT MODAL & ARSIP RIWAYAT
  // ==========================================================================

  openCheckoutModal() {
    const inCartItems = this.items.filter((it) => it.inCart);
    if (inCartItems.length === 0) {
      alert('Belum ada barang di dalam troli! Centang barang terlebih dahulu.');
      return;
    }

    let subtotalRaw = 0;
    let totalDiscountSavings = 0;
    let totalFinal = 0;

    let itemsHtml = inCartItems.map((item) => {
      const disc = Calculations.calculateTieredDiscount(
        item.unitPrice,
        item.disc1,
        item.disc2,
        item.fixedDiscount
      );
      const rowRaw = item.unitPrice * item.qty;
      const rowFinal = disc.finalUnitPrice * item.qty;
      const rowSave = rowRaw - rowFinal;

      subtotalRaw += rowRaw;
      totalDiscountSavings += rowSave;
      totalFinal += rowFinal;

      return `
        <div class="receipt-line">
          <span>${item.name} (${item.qty} ${item.unit})</span>
          <span>${Calculations.formatRupiah(rowFinal)}</span>
        </div>
      `;
    }).join('');

    const evaluation = Calculations.evaluateBudgetSafety(
      totalFinal,
      this.budgetConfig.budgetCap,
      this.budgetConfig.safetyBuffer
    );

    this.checkoutReceiptBody.innerHTML = `
      <div style="font-weight:700; color:var(--text-main); margin-bottom:6px; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">
        🛒 STRUK SIMULASI KASIR (${inCartItems.length} Item)
      </div>
      ${itemsHtml}
      <div class="receipt-line" style="border-top:1px dashed var(--border-subtle); padding-top:6px; margin-top:6px;">
        <span style="color:var(--text-muted)">Harga Asli Normal:</span>
        <span style="color:var(--text-muted)">${Calculations.formatRupiah(subtotalRaw)}</span>
      </div>
      <div class="receipt-line" style="color:var(--emerald-400);">
        <span>Total Hemat Diskon:</span>
        <span>-${Calculations.formatRupiah(totalDiscountSavings)}</span>
      </div>
      <div class="receipt-line total">
        <span>TOTAL BAYAR KASIR:</span>
        <span>${Calculations.formatRupiah(totalFinal)}</span>
      </div>
      <div style="margin-top:12px; padding:10px; border-radius:var(--radius-md); background:var(--bg-surface); border:1px solid var(--border-subtle);">
        <div style="font-weight:700; font-size:0.82rem; margin-bottom:4px;">Evaluasi Saku Belanja:</div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">
          • Anggaran Saku: ${Calculations.formatRupiah(this.budgetConfig.budgetCap)}<br>
          • Status: <b>${evaluation.statusTitle}</b><br>
          • ${evaluation.statusMessage}
        </div>
      </div>
    `;

    this.checkoutModal.classList.add('open');
  }

  finishAndArchiveShopping() {
    const inCartItems = this.items.filter((it) => it.inCart);
    if (inCartItems.length === 0) return;

    if (!confirm('Selesaikan belanja dan simpan sesi ini ke Riwayat Belanja?')) {
      return;
    }

    const totalSpent = this.getTotalSpent();
    const evaluation = Calculations.evaluateBudgetSafety(
      totalSpent,
      this.budgetConfig.budgetCap,
      this.budgetConfig.safetyBuffer
    );

    // Format tanggal saat ini (contoh: 12 Oktober 2026)
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const newHistorySession = {
      id: `hist_${Date.now()}`,
      date: dateStr,
      totalSpent,
      budgetCap: this.budgetConfig.budgetCap,
      totalItems: inCartItems.length,
      status: evaluation.level,
      notes: `Belanja bulanan selesai. Status: ${evaluation.statusTitle}`,
      items: inCartItems.map((it) => {
        const disc = Calculations.calculateTieredDiscount(it.unitPrice, it.disc1, it.disc2, it.fixedDiscount);
        return {
          name: it.name,
          unitPrice: disc.finalUnitPrice,
          qty: it.qty,
          total: disc.finalUnitPrice * it.qty
        };
      })
    };

    // Tambahkan ke riwayat
    this.historySessions.unshift(newHistorySession);
    Storage.saveHistory(this.historySessions);

    // Update harga riwayat bulan lalu & rekam ke memori harga otomatis
    // sehingga saat belanja berikutnya, harga saat ini otomatis menjadi patokan masa lalu!
    this.items.forEach((it) => {
      if (it.inCart) {
        Storage.recordProductPrice(it.name, it.unitPrice, it.category, it.unit);
        it.lastMonthPrice = it.unitPrice;
        it.inCart = false; // Reset checklist troli
      }
    });
    Storage.saveItems(this.items);
    this.syncCurrentDataWithCloud();

    this.checkoutModal.classList.remove('open');
    SoundFeedback.success();
    this.showToast('Sesi belanja berhasil disimpan ke Riwayat!');
    this.switchTab('riwayat');
    this.render();
  }

  // ==========================================================================
  // TAB 2: RIWAYAT & DATABASE HARGA
  // ==========================================================================

  renderHistory() {
    this.historyListContainer.innerHTML = '';
    if (this.historySessions.length === 0) {
      this.historyListContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${getIcon('history')}</div>
          <p>Belum ada riwayat belanja yang disimpan.</p>
        </div>
      `;
      return;
    }

    this.historySessions.forEach((session) => {
      const card = document.createElement('div');
      card.className = 'history-card';

      let statusBadge = '<span class="budget-status-pill pill-safe">Aman</span>';
      if (session.status === 'warning') statusBadge = '<span class="budget-status-pill pill-warning">Waspada</span>';
      if (session.status === 'critical') statusBadge = '<span class="budget-status-pill pill-critical">Kritis</span>';
      if (session.status === 'danger') statusBadge = '<span class="budget-status-pill pill-danger">Overbudget</span>';

      const itemsListHtml = session.items ? session.items.map((it) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
          <div style="flex:1; padding-right:8px;">
            <div style="font-weight:600; color:var(--text-main);">• ${it.name}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">
              ${it.qty}x • Total: ${Calculations.formatRupiah(it.total)} 
              <span style="color:var(--emerald-400);">(@ ${Calculations.formatRupiah(it.unitPrice)})</span>
            </div>
          </div>
          <button class="btn-rebuy" data-name="${it.name}" data-price="${it.unitPrice}" title="Masukkan barang ini kembali ke troli">
            ${getIcon('cart')} Beli Lagi
          </button>
        </div>
      `).join('') : '';

      card.innerHTML = `
        <div class="history-card-header">
          <div>
            <div class="history-date">${session.date}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${session.totalItems} Barang Dibeli • ${session.notes || ''}</div>
          </div>
          ${statusBadge}
        </div>

        <div class="history-stats-row">
          <div>
            <div class="history-stat-label">Total Belanja Kasir</div>
            <div class="history-stat-val">${Calculations.formatRupiah(session.totalSpent)}</div>
          </div>
          <div style="text-align:right;">
            <div class="history-stat-label">Batas Anggaran Saku</div>
            <div style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary);">
              ${Calculations.formatRupiah(session.budgetCap)}
            </div>
          </div>
        </div>

        <div class="history-items-mini">
          <div style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">Rincian Barang & Patokan Harga:</div>
          ${itemsListHtml}
        </div>
      `;

      // Event listener tombol Beli Lagi
      card.querySelectorAll('.btn-rebuy').forEach((btn) => {
        btn.addEventListener('click', () => {
          const name = btn.dataset.name;
          const price = Number(btn.dataset.price) || 0;
          this.reBuyItem(name, price);
        });
      });

      this.historyListContainer.appendChild(card);
    });
  }

  reBuyItem(name, pastUnitPrice) {
    const existing = this.items.find((it) => it.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.qty += 1;
      existing.inCart = true;
      existing.lastMonthPrice = pastUnitPrice;
      this.showToast(`+1 ${existing.name} dimasukkan kembali ke troli!`);
    } else {
      const catalogItem = QUICK_CATALOG.find((it) => it.name.toLowerCase() === name.toLowerCase());
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name,
        category: catalogItem ? catalogItem.category : 'pokok',
        unit: catalogItem ? catalogItem.unit : 'pcs',
        qty: 1,
        unitPrice: pastUnitPrice,
        lastMonthPrice: pastUnitPrice,
        disc1: 0,
        disc2: 0,
        fixedDiscount: 0,
        inCart: true,
        notes: 'Patokan bulan lalu'
      };
      this.items.unshift(newItem);
      this.showToast(`"${name}" dimasukkan ke troli belanja!`);
    }

    Storage.saveItems(this.items);
    SoundFeedback.success();
    this.switchTab('belanja');
    this.render();
  }

  // ==========================================================================
  // TAB 3: ANGGARAN & BUDGET SAFETY CAP SETTINGS
  // ==========================================================================

  renderBudgetTab() {
    this.inputBudgetCap.value = this.budgetConfig.budgetCap;
    this.inputSafetyBuffer.value = this.budgetConfig.safetyBuffer;

    const totalSpent = this.getTotalSpent();
    const totalPlanned = this.getTotalPlanned();
    const evaluation = Calculations.evaluateBudgetSafety(
      totalSpent,
      this.budgetConfig.budgetCap,
      this.budgetConfig.safetyBuffer
    );

    document.getElementById('metricSpentNumber').textContent = Calculations.formatRupiah(totalSpent);
    document.getElementById('metricRemainingNumber').textContent = Calculations.formatRupiah(evaluation.remainingBudget);
    document.getElementById('metricPlannedNumber').textContent = Calculations.formatRupiah(totalPlanned);
    document.getElementById('metricPctNumber').textContent = `${evaluation.usedPercentage}%`;
  }

  // ==========================================================================
  // EXPORT WHATSAPP TEXT GENERATOR
  // ==========================================================================

  exportListToClipboard() {
    const inCartItems = this.items.filter((it) => it.inCart);
    const plannedItems = this.items.filter((it) => !it.inCart);
    const totalSpent = this.getTotalSpent();

    let text = `🛒 *DAFTAR BELANJA BULANAN ANAK RANTAU*\n`;
    text += `📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n`;
    text += `💰 Anggaran Saku: ${Calculations.formatRupiah(this.budgetConfig.budgetCap)}\n`;
    text += `💵 Estimasi Troli: ${Calculations.formatRupiah(totalSpent)}\n\n`;

    if (inCartItems.length > 0) {
      text += `*SUDAH DI TROLI:*\n`;
      inCartItems.forEach((it, i) => {
        const disc = Calculations.calculateTieredDiscount(it.unitPrice, it.disc1, it.disc2, it.fixedDiscount);
        text += `${i + 1}. [✓] ${it.name} - ${it.qty} ${it.unit} (${Calculations.formatRupiah(disc.finalUnitPrice * it.qty)})\n`;
      });
      text += `\n`;
    }

    if (plannedItems.length > 0) {
      text += `*BELUM DIAMBIL:*\n`;
      plannedItems.forEach((it, i) => {
        text += `${i + 1}. [ ] ${it.name} - ${it.qty} ${it.unit}\n`;
      });
    }

    text += `\n_Dibuat dengan Smart Grocery & Budget Safety Tracker PWA_`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        SoundFeedback.success();
        this.showToast('Daftar belanja disalin! Siap dipaste ke WhatsApp.');
      }).catch(() => {
        prompt('Salin teks belanjaan ini:', text);
      });
    } else {
      prompt('Salin teks belanjaan ini:', text);
    }
  }
}

// Inisialisasi Aplikasi Saat DOM Siap
document.addEventListener('DOMContentLoaded', () => {
  window.SmartGrocery = new SmartGroceryApp();
});
