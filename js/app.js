/**
 * app.js
 * Controller Utama Smart Grocery & Budget Safety Tracker PWA
 */

import { CATEGORIES, UNITS, QUICK_CATALOG, getContextualUnitsForProduct } from './data.js';
import { Calculations } from './calculations.js';
import { Storage, SoundFeedback } from './storage.js';
import { getIcon } from './icons.js';
import { Auth } from './auth.js';
import { FirebaseSync } from './firebase.js';
import { RecipeEngine } from './recipes.js';

class SmartGroceryApp {
  constructor() {
    this.currentTab = 'belanja'; // 'belanja', 'riwayat', 'anggaran'
    this.selectedCategory = 'all';

    // Poin 2: Inisialisasi Isolasi Data per Akun Pengguna Aktif
    const initialUser = Auth.getCurrentUser();
    Storage.setActiveUser(initialUser);

    this.items = Storage.getItems();
    this.budgetConfig = Storage.getBudgetConfig();
    this.historySessions = Storage.getHistory();
    this.editingItemId = null;
    this.deferredPrompt = null;
    this.unsubscribeSnapshot = null;
    this.activeRecipeFilter = 'ready'; // 'ready' or 'all'
    this.currentSessionDocId = initialUser ? ('user_session_' + FirebaseSync.sanitizeSessionId(initialUser.id || initialUser.email)) : 'guest_session';

    this.initElements();
    this.initSessionStore();
    this.attachEventListeners();
    this.setupPWAInstall();
    this.initAuth();
    this.initSnapshotListener();
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
    this.onSnapshotLiveBadge = document.getElementById('onSnapshotLiveBadge');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.checkoutSimBtn = document.getElementById('checkoutSimBtn');
    this.snapshotBtn = document.getElementById('snapshotBtn');
    this.budgetWarningBanner = document.getElementById('budgetWarningBanner');
    this.budgetWarningBannerText = document.getElementById('budgetWarningBannerText');

    // Sesi Toko & Tanggal (SRS F-01)
    this.selectStore = document.getElementById('selectStore');
    this.sessionDatePicker = document.getElementById('sessionDatePicker');

    // Custom Confirmation Dialog (Non-blocking SRS UX)
    this.confirmDialogModal = document.getElementById('confirmDialogModal');
    this.confirmDialogTitle = document.getElementById('confirmDialogTitle');
    this.confirmDialogMessage = document.getElementById('confirmDialogMessage');
    this.confirmDialogIcon = document.getElementById('confirmDialogIcon');
    this.btnConfirmCancel = document.getElementById('btnConfirmCancel');
    this.btnConfirmOk = document.getElementById('btnConfirmOk');

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
    this.customUnitGroup = document.getElementById('customUnitGroup');
    this.inputCustomUnit = document.getElementById('inputCustomUnit');
    this.inputUnitConversion = document.getElementById('inputUnitConversion');
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

    // Snapshot Modal Elements (Fitur onSnapshot)
    this.snapshotModal = document.getElementById('snapshotModal');
    this.btnCloseSnapshot = document.getElementById('btnCloseSnapshot');
    this.btnTakeSnapshot = document.getElementById('btnTakeSnapshot');
    this.inputSnapshotLabel = document.getElementById('inputSnapshotLabel');
    this.snapshotCountBadge = document.getElementById('snapshotCountBadge');
    this.snapshotListContainer = document.getElementById('snapshotListContainer');

    // Budget Settings Elements in Tab 3
    this.inputBudgetCap = document.getElementById('inputBudgetCap');
    this.inputSafetyBuffer = document.getElementById('inputSafetyBuffer');
    this.btnSaveBudget = document.getElementById('btnSaveBudget');
    this.btnResetDemoData = document.getElementById('btnResetDemoData');
    this.btnExportShare = document.getElementById('btnExportShare');

    // Toast Banner
    this.toastBanner = document.getElementById('toastBanner');
    this.toastText = document.getElementById('toastText');

    // Selesai Belanja & Struk Digital (Poin 2)
    this.btnFinishShoppingMain = document.getElementById('btnFinishShoppingMain');
    this.receiptModal = document.getElementById('receiptModal');
    this.receiptPaperContainer = document.getElementById('receiptPaperContainer');
    this.btnCloseReceipt = document.getElementById('btnCloseReceipt');
    this.btnDismissReceipt = document.getElementById('btnDismissReceipt');
    this.btnPrintReceipt = document.getElementById('btnPrintReceipt');

    // Ide Menu Masakan Cerdas (Poin 8)
    this.btnOpenRecipes = document.getElementById('btnOpenRecipes');
    this.recipeMatchCountBadge = document.getElementById('recipeMatchCountBadge');
    this.recipesModal = document.getElementById('recipesModal');
    this.btnCloseRecipes = document.getElementById('btnCloseRecipes');
    this.recipesListContainer = document.getElementById('recipesListContainer');
    this.filterRecipeReady = document.getElementById('filterRecipeReady');
    this.filterRecipeAll = document.getElementById('filterRecipeAll');
    this.recipeReadyCount = document.getElementById('recipeReadyCount');
    this.recipeAllCount = document.getElementById('recipeAllCount');

    // Auth & Account Switcher Elements (Poin 3, 4, 5)
    this.userAuthBtn = document.getElementById('userAuthBtn');
    this.authModal = document.getElementById('authModal');
    this.btnCloseAuth = document.getElementById('btnCloseAuth');
    this.authLoggedInView = document.getElementById('authLoggedInView');
    this.authFormView = document.getElementById('authFormView');
    this.tabAuthLogin = document.getElementById('tabAuthLogin');
    this.tabAuthRegister = document.getElementById('tabAuthRegister');
    this.loginForm = document.getElementById('loginForm');
    this.loginEmail = document.getElementById('loginEmail');
    this.loginPassword = document.getElementById('loginPassword');
    this.registerForm = document.getElementById('registerForm');
    this.registerName = document.getElementById('registerName');
    this.registerEmail = document.getElementById('registerEmail');
    this.registerPassword = document.getElementById('registerPassword');
    this.btnLogout = document.getElementById('btnLogout');
    this.headerLogoutBtn = document.getElementById('headerLogoutBtn');
    this.btnQuickDemoLogin = document.getElementById('btnQuickDemoLogin');
    this.savedAccountsContainer = document.getElementById('savedAccountsContainer');
    this.quickAccountsPrompt = document.getElementById('quickAccountsPrompt');
    this.quickAccountsList = document.getElementById('quickAccountsList');
    this.btnAddNewAccount = document.getElementById('btnAddNewAccount');

    // Download & Install Aplikasi PWA (Poin 7)
    this.btnDownloadPwaApp = document.getElementById('btnDownloadPwaApp');
    this.btnDownloadOfflinePackage = document.getElementById('btnDownloadOfflinePackage');
    this.pwaGuideModal = document.getElementById('pwaGuideModal');
    this.btnClosePwaGuide = document.getElementById('btnClosePwaGuide');
    this.btnTriggerNativeInstall = document.getElementById('btnTriggerNativeInstall');
    this.btnDownloadHtmlBackup = document.getElementById('btnDownloadHtmlBackup');
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

    // Snapshot Modal Button
    if (this.snapshotBtn) {
      this.snapshotBtn.addEventListener('click', () => {
        SoundFeedback.tap();
        this.openSnapshotModal();
      });
    }

    if (this.btnCloseSnapshot) {
      this.btnCloseSnapshot.addEventListener('click', () => {
        this.closeSnapshotModal();
      });
    }

    if (this.btnTakeSnapshot) {
      this.btnTakeSnapshot.addEventListener('click', () => {
        this.handleTakeSnapshot();
      });
    }

    // Tombol Utama Selesai Belanja (Checkout & Cetak Struk - Poin 2)
    if (this.btnFinishShoppingMain) {
      this.btnFinishShoppingMain.addEventListener('click', () => {
        this.promptFinishShopping();
      });
    }

    // Modal Struk Digital Buttons
    if (this.btnCloseReceipt) {
      this.btnCloseReceipt.addEventListener('click', () => {
        this.receiptModal.classList.remove('open');
      });
    }
    if (this.btnDismissReceipt) {
      this.btnDismissReceipt.addEventListener('click', () => {
        this.receiptModal.classList.remove('open');
      });
    }
    if (this.btnPrintReceipt) {
      this.btnPrintReceipt.addEventListener('click', () => {
        window.print();
      });
    }

    // Ide Menu Masakan Cerdas (Poin 8)
    if (this.btnOpenRecipes) {
      this.btnOpenRecipes.addEventListener('click', () => {
        SoundFeedback.tap();
        this.openRecipesModal();
      });
    }
    if (this.btnCloseRecipes) {
      this.btnCloseRecipes.addEventListener('click', () => {
        this.recipesModal.classList.remove('open');
      });
    }
    if (this.filterRecipeReady) {
      this.filterRecipeReady.addEventListener('click', () => {
        this.activeRecipeFilter = 'ready';
        this.filterRecipeReady.classList.add('active');
        this.filterRecipeAll.classList.remove('active');
        this.renderRecipesList();
      });
    }
    if (this.filterRecipeAll) {
      this.filterRecipeAll.addEventListener('click', () => {
        this.activeRecipeFilter = 'all';
        this.filterRecipeAll.classList.add('active');
        this.filterRecipeReady.classList.remove('active');
        this.renderRecipesList();
      });
    }

    // Account Switcher Add New Account Button (Poin 5)
    if (this.btnAddNewAccount) {
      this.btnAddNewAccount.addEventListener('click', () => {
        this.authLoggedInView.style.display = 'none';
        this.authFormView.style.display = 'block';
        this.tabAuthLogin.click();
      });
    }

    // Download & Install PWA (Poin 7)
    if (this.btnDownloadPwaApp) {
      this.btnDownloadPwaApp.addEventListener('click', () => {
        this.handlePwaInstallClick();
      });
    }
    if (this.btnDownloadOfflinePackage) {
      this.btnDownloadOfflinePackage.addEventListener('click', () => {
        this.downloadStandaloneOfflineHtml();
      });
    }
    if (this.btnClosePwaGuide) {
      this.btnClosePwaGuide.addEventListener('click', () => {
        this.pwaGuideModal.classList.remove('open');
      });
    }
    if (this.btnTriggerNativeInstall) {
      this.btnTriggerNativeInstall.addEventListener('click', () => {
        this.handlePwaInstallClick();
      });
    }
    if (this.btnDownloadHtmlBackup) {
      this.btnDownloadHtmlBackup.addEventListener('click', () => {
        this.downloadStandaloneOfflineHtml();
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

    // Login Form Submit
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processLogin(this.loginEmail.value, this.loginPassword.value);
      });
    }

    // Tombol 1-Klik Masuk Akun Demo Cepat
    if (this.btnQuickDemoLogin) {
      this.btnQuickDemoLogin.addEventListener('click', () => {
        SoundFeedback.tap();
        if (this.loginEmail) this.loginEmail.value = 'user@smartgrocery.app';
        if (this.loginPassword) this.loginPassword.value = 'password123';
        this.processLogin('user@smartgrocery.app', 'password123');
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
          document.body.classList.remove('auth-locked-mode');
          document.documentElement.classList.remove('auth-locked-mode');
          if (this.btnCloseAuth) this.btnCloseAuth.style.display = 'inline-flex';

          // Poin 2: Isolasi Data untuk Akun Baru Terdaftar
          Storage.setActiveUser(res.user);
          this.items = Storage.getItems();
          this.budgetConfig = Storage.getBudgetConfig();
          this.historySessions = Storage.getHistory();

          this.updateAuthUI();
          this.setupUserRealtimeSession(res.user);
          this.syncCurrentDataWithCloud();
          this.authModal.classList.remove('open');
          this.render();
        } else {
          SoundFeedback.warning();
          this.showToast(res.message, true);
        }
      });
    }

    // Logout Button di Modal Akun
    if (this.btnLogout) {
      this.btnLogout.addEventListener('click', () => {
        Auth.logout();
        Storage.setActiveUser(null);
        this.items = [];
        this.historySessions = [];
        SoundFeedback.tap();
        this.showToast('Anda telah logout dari akun.');
        this.updateAuthUI();
        this.render();
        this.initAuth();
      });
    }

    // Tombol Logout Langsung di Header (Kembali ke Gerbang Login)
    if (this.headerLogoutBtn) {
      this.headerLogoutBtn.addEventListener('click', () => {
        SoundFeedback.tap();
        Auth.logout();
        Storage.setActiveUser(null);
        this.items = [];
        this.historySessions = [];
        this.showToast('Keluar akun. Gerbang Login aktif.');
        this.updateAuthUI();
        this.render();
        this.initAuth();
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

    // Auto-complete, prefill & dynamic contextual units when typing product name (Poin 1)
    this.inputName.addEventListener('input', () => {
      const typed = this.inputName.value.trim();
      this.handleProductNameAutoFill(typed);
      this.updateContextualUnits(typed);
      this.updateModalLivePreview();
    });

    // Custom unit dropdown toggle (Poin 1)
    if (this.inputUnit) {
      this.inputUnit.addEventListener('change', () => {
        if (this.inputUnit.value === '__custom__') {
          if (this.customUnitGroup) this.customUnitGroup.style.display = 'block';
          if (this.inputCustomUnit) setTimeout(() => this.inputCustomUnit.focus(), 100);
        } else {
          if (this.customUnitGroup) this.customUnitGroup.style.display = 'none';
        }
      });
    }

    // Validasi Kolom Numerik Ketat dengan Peringatan Instan (Minus, Simbol, Huruf ditolak)
    this.attachNumericValidationWithWarning(this.inputQty, 'Kuantitas', true);
    this.attachNumericValidationWithWarning(this.inputUnitPrice, 'Harga Satuan', false);
    this.attachNumericValidationWithWarning(this.inputLastMonthPrice, 'Harga Bulan Lalu', false);
    this.attachNumericValidationWithWarning(this.inputDisc1, 'Diskon Utama (%)', true);
    this.attachNumericValidationWithWarning(this.inputDisc2, 'Diskon Tambahan (%)', true);
    this.attachNumericValidationWithWarning(this.inputFixedDiscount, 'Potongan Diskon (Rp)', false);
    this.attachNumericValidationWithWarning(this.inputBudgetCap, 'Batas Anggaran', false);
    this.attachNumericValidationWithWarning(this.inputSafetyBuffer, 'Dana Cadangan', false);

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
      this.btnResetDemoData.addEventListener('click', async () => {
        const ok = await this.showConfirmDialog(
          'Reset Data Contoh',
          'Kembalikan data barang & riwayat ke contoh awal anak rantau?',
          '🔄',
          'Ya, Reset'
        );
        if (ok) {
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
  // SESI BELANJA & TOKO GROSIR (SRS F-01)
  // ==========================================================================

  initSessionStore() {
    const meta = Storage.getSessionMeta();
    if (this.selectStore && meta.storeName) {
      this.selectStore.value = meta.storeName;
    }
    if (this.sessionDatePicker) {
      this.sessionDatePicker.value = meta.shoppingDate || new Date().toISOString().split('T')[0];
    }

    if (this.selectStore) {
      this.selectStore.addEventListener('change', () => {
        const storeName = this.selectStore.value;
        const shoppingDate = this.sessionDatePicker ? this.sessionDatePicker.value : '';
        Storage.saveSessionMeta({ storeName, shoppingDate });
        this.syncCurrentDataWithCloud();
        this.showToast(`🏬 Toko diatur ke: ${storeName}`);
      });
    }

    if (this.sessionDatePicker) {
      this.sessionDatePicker.addEventListener('change', () => {
        const storeName = this.selectStore ? this.selectStore.value : '';
        const shoppingDate = this.sessionDatePicker.value;
        Storage.saveSessionMeta({ storeName, shoppingDate });
        this.syncCurrentDataWithCloud();
        this.showToast(`📅 Tanggal belanja diatur ke: ${shoppingDate}`);
      });
    }
  }

  // ==========================================================================
  // FITUR VALIDASI INPUT ANGKA KETAT DENGAN PERINGATAN INSTAN
  // Munculkan peringatan apabila karakter berupa minus (-), simbol, spasi, atau huruf
  // ==========================================================================

  attachNumericValidationWithWarning(inputEl, fieldLabel, allowDecimal = false) {
    if (!inputEl) return;

    let lastWarningTime = 0;
    const triggerWarning = (msg) => {
      const now = Date.now();
      if (now - lastWarningTime > 1200) {
        lastWarningTime = now;
        SoundFeedback.warning();
        this.showToast(msg, true);
        inputEl.style.borderColor = 'var(--rose-500)';
        inputEl.style.boxShadow = '0 0 0 2px var(--rose-glow)';
        setTimeout(() => {
          inputEl.style.borderColor = '';
          inputEl.style.boxShadow = '';
        }, 1200);
      }
    };

    inputEl.addEventListener('keydown', (e) => {
      // 1. Tombol kontrol & navigasi standar
      const controlKeys = [
        'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
      ];
      if (controlKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
        return;
      }

      // 2. Tombol minus (-)
      if (e.key === '-' || e.key === 'Subtract') {
        e.preventDefault();
        triggerWarning(`⚠️ Kolom ${fieldLabel} tidak boleh bernilai minus/negatif! Hanya menerima angka positif.`);
        return;
      }

      // 3. Spasi
      if (e.key === ' ') {
        e.preventDefault();
        triggerWarning(`⚠️ Kolom ${fieldLabel} tidak boleh mengandung spasi!`);
        return;
      }

      // 4. Huruf (a-z, A-Z)
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        triggerWarning(`⚠️ Kolom ${fieldLabel} hanya menerima angka, tidak boleh berisi huruf "${e.key}"!`);
        return;
      }

      // 5. Tanda Titik Desimal (.) atau Koma (,)
      if (e.key === '.' || e.key === ',') {
        if (!allowDecimal) {
          e.preventDefault();
          triggerWarning(`⚠️ Kolom ${fieldLabel} hanya menerima angka bulat (tanpa desimal/simbol)!`);
          return;
        }
        if (inputEl.value.includes('.')) {
          e.preventDefault();
          triggerWarning(`⚠️ Kolom ${fieldLabel} hanya boleh memiliki satu tanda titik desimal!`);
          return;
        }
        return; // Izinkan 1 tanda titik
      }

      // 6. Simbol-simbol lainnya (+, *, /, @, #, $, %, dll)
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        triggerWarning(`⚠️ Kolom ${fieldLabel} tidak boleh mengandung simbol "${e.key}"! Hanya menerima angka.`);
        return;
      }
    });

    // Event input untuk menangani paste / mobile keyboard
    inputEl.addEventListener('input', () => {
      const original = inputEl.value;
      if (!original) return;

      let sanitized = original;
      let hasIllegal = false;
      let reason = '';

      if (sanitized.includes('-')) {
        hasIllegal = true;
        reason = 'simbol minus (-)';
      } else if (/[a-zA-Z]/.test(sanitized)) {
        hasIllegal = true;
        reason = 'huruf';
      } else if (allowDecimal ? /[^0-9.]/.test(sanitized) : /[^0-9]/.test(sanitized)) {
        hasIllegal = true;
        reason = 'simbol khusus';
      }

      if (allowDecimal) {
        sanitized = sanitized.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        if (parts.length > 2) {
          sanitized = parts[0] + '.' + parts.slice(1).join('');
          hasIllegal = true;
          reason = 'titik ganda';
        }
      } else {
        sanitized = sanitized.replace(/[^0-9]/g, '');
      }

      if (hasIllegal && sanitized !== original) {
        inputEl.value = sanitized;
        triggerWarning(`⚠️ Kolom ${fieldLabel} hanya boleh berisi angka! Karakter ${reason} otomatis dibersihkan.`);
      }
    });

    // Event blur untuk validasi nilai jika kosong/minus
    inputEl.addEventListener('blur', () => {
      const val = Number(inputEl.value);
      if (inputEl.value !== '' && (isNaN(val) || val < 0)) {
        inputEl.value = allowDecimal ? '1' : '0';
        triggerWarning(`⚠️ Nilai ${fieldLabel} tidak valid, otomatis disesuaikan.`);
      }
    });
  }

  // ==========================================================================
  // NON-BLOCKING CONFIRMATION DIALOG (SRS UX)
  // ==========================================================================

  showConfirmDialog(title, message, icon = '⚠️', confirmBtnText = 'Ya, Lanjutkan', isDanger = true) {
    return new Promise((resolve) => {
      if (!this.confirmDialogModal) {
        resolve(true);
        return;
      }
      this.confirmDialogTitle.textContent = title;
      this.confirmDialogMessage.textContent = message;
      this.confirmDialogIcon.textContent = icon;
      this.btnConfirmOk.textContent = confirmBtnText;
      this.btnConfirmOk.style.background = isDanger ? 'var(--rose-500)' : 'var(--emerald-500)';

      const cleanup = (result) => {
        this.confirmDialogModal.classList.remove('open');
        this.btnConfirmOk.removeEventListener('click', onOk);
        this.btnConfirmCancel.removeEventListener('click', onCancel);
        resolve(result);
      };

      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);

      this.btnConfirmOk.addEventListener('click', onOk);
      this.btnConfirmCancel.addEventListener('click', onCancel);

      this.confirmDialogModal.classList.add('open');
      SoundFeedback.tap();
    });
  }

  // ==========================================================================
  // AUTENTIKASI & CLOUD SYNC
  // ==========================================================================

  initAuth() {
    this.updateAuthUI();

    const user = Auth.getCurrentUser();
    // Poin 2: Isolasi Data Pengguna Aktif
    Storage.setActiveUser(user);

    if (!user) {
      // POIN 2: Gerbang Autentikasi Awal - Kunci halaman utama sebelum user login
      document.body.classList.add('auth-locked-mode');
      document.documentElement.classList.add('auth-locked-mode');
      if (this.btnCloseAuth) this.btnCloseAuth.style.display = 'none';
      const titleElem = document.getElementById('authModalTitle');
      if (titleElem) titleElem.textContent = 'Silakan Masuk atau Buat Akun untuk Memulai';
      this.openAuthModal(true);
    } else {
      document.body.classList.remove('auth-locked-mode');
      document.documentElement.classList.remove('auth-locked-mode');
      if (this.btnCloseAuth) this.btnCloseAuth.style.display = 'inline-flex';

      // Muat data terisolasi untuk akun ini
      this.items = Storage.getItems();
      this.budgetConfig = Storage.getBudgetConfig();
      this.historySessions = Storage.getHistory();

      // Pulihkan data cloud jika tersedia
      const cloudData = Auth.loadFromCloud(user.id);
      if (cloudData) {
        if (cloudData.items && Array.isArray(cloudData.items)) {
          this.items = cloudData.items;
          Storage.saveItems(this.items, false);
        }
        if (cloudData.budgetConfig) {
          this.budgetConfig = cloudData.budgetConfig;
          Storage.saveBudgetConfig(this.budgetConfig, false);
        }
        if (cloudData.history && Array.isArray(cloudData.history)) {
          this.historySessions = cloudData.history;
          Storage.saveHistory(this.historySessions, false);
        }
        if (cloudData.priceMemory) {
          try {
            localStorage.setItem('sg_price_memory_v1', JSON.stringify(cloudData.priceMemory));
          } catch (e) {}
        }
      }
      this.setupUserRealtimeSession(user);
    }
  }

  // ==========================================================================
  // FITUR ONSNAPSHOT & REALTIME STATE SYNCHRONIZER (POIN 6 - HP & PC MULTI-DEVICE)
  // ==========================================================================

  initSnapshotListener() {
    // 1. Daftarkan listener real-time onSnapshot LocalStorage
    this.unsubscribeSnapshot = Storage.onSnapshot((snapshot) => {
      // Sinkronkan jika ada perubahan dari tab lain atau restore snapshot
      if (snapshot.source === 'cross_tab' || snapshot.source === 'snapshot_restore') {
        this.items = snapshot.items;
        this.budgetConfig = snapshot.budgetConfig;
        this.historySessions = snapshot.history;
        if (snapshot.sessionMeta) {
          if (this.selectStore && snapshot.sessionMeta.storeName) {
            this.selectStore.value = snapshot.sessionMeta.storeName;
          }
          if (this.sessionDatePicker && snapshot.sessionMeta.shoppingDate) {
            this.sessionDatePicker.value = snapshot.sessionMeta.shoppingDate;
          }
        }
        this.render();
        if (snapshot.source === 'cross_tab') {
          this.showToast('⚡ Data diperbarui via onSnapshot!');
        }
      }
      this.renderSnapshots();
      this.flashSnapshotBadge();
    });

    // 2. Pantau status koneksi Firestore (Realtime vs Offline)
    FirebaseSync.onStatusChange((status) => {
      if (!this.onSnapshotLiveBadge) return;
      if (status === 'connected') {
        this.onSnapshotLiveBadge.className = 'live-snapshot-badge live-connected';
        this.onSnapshotLiveBadge.title = 'Cloud Firestore Live: Terhubung Real-Time Multi-Device';
        this.onSnapshotLiveBadge.innerHTML = '<span class="pulse-dot"></span> Firestore Live';
      } else if (status === 'connecting') {
        this.onSnapshotLiveBadge.className = 'live-snapshot-badge live-connecting';
        this.onSnapshotLiveBadge.title = 'Menghubungkan ke Cloud Firestore...';
        this.onSnapshotLiveBadge.innerHTML = '<span class="pulse-dot" style="background:var(--amber-400); box-shadow:0 0 6px var(--amber-400);"></span> Menghubungkan';
      } else {
        this.onSnapshotLiveBadge.className = 'live-snapshot-badge live-offline';
        this.onSnapshotLiveBadge.title = 'Mode Offline: Menggunakan LocalStorage (Data aman saat F5)';
        this.onSnapshotLiveBadge.innerHTML = '<span class="pulse-dot" style="background:var(--text-muted); box-shadow:none;"></span> LocalStorage';
      }
    });

    // Inisialisasi realtime session pengguna aktif
    const user = Auth.getCurrentUser();
    this.setupUserRealtimeSession(user);
  }

  /**
   * Poin 6: Setup Listener onSnapshot Firestore terikat ke Akun Pengguna Aktif
   * Ketika user login dengan akun sama di HP & Laptop, data langsung berubah tanpa refresh!
   * @param {object|null} user 
   */
  setupUserRealtimeSession(user) {
    FirebaseSync.unsubscribeSession();
    const sessionDocId = user 
      ? ('user_session_' + FirebaseSync.sanitizeSessionId(user.email || user.id))
      : 'guest_session';

    this.currentSessionDocId = sessionDocId;

    FirebaseSync.subscribeSession(sessionDocId, (cloudData, meta) => {
      if (!cloudData) return;
      let hasUpdate = false;

      if (cloudData.items && Array.isArray(cloudData.items)) {
        this.items = cloudData.items;
        Storage.saveItems(this.items, false);
        hasUpdate = true;
      }
      if (cloudData.budgetConfig) {
        this.budgetConfig = cloudData.budgetConfig;
        Storage.saveBudgetConfig(this.budgetConfig, false);
        hasUpdate = true;
      }
      if (cloudData.sessionMeta) {
        Storage.saveSessionMeta(cloudData.sessionMeta, false);
        if (this.selectStore && cloudData.sessionMeta.storeName) {
          this.selectStore.value = cloudData.sessionMeta.storeName;
        }
        if (this.sessionDatePicker && cloudData.sessionMeta.shoppingDate) {
          this.sessionDatePicker.value = cloudData.sessionMeta.shoppingDate;
        }
        hasUpdate = true;
      }
      if (cloudData.priceMemory) {
        Storage.savePriceMemory(cloudData.priceMemory, false);
      }
      if (cloudData.snapshots && Array.isArray(cloudData.snapshots)) {
        Storage.saveSnapshots(cloudData.snapshots, false);
      }
      if (cloudData.history && Array.isArray(cloudData.history)) {
        this.historySessions = cloudData.history;
        Storage.saveHistory(this.historySessions, false);
        hasUpdate = true;
      }

      if (hasUpdate) {
        this.render();
        this.flashSnapshotBadge();
      }
    });
  }

  flashSnapshotBadge() {
    if (!this.onSnapshotLiveBadge) return;
    this.onSnapshotLiveBadge.classList.add('flash');
    setTimeout(() => {
      if (this.onSnapshotLiveBadge) this.onSnapshotLiveBadge.classList.remove('flash');
    }, 800);
  }

  openSnapshotModal() {
    if (!this.snapshotModal) return;
    this.renderSnapshots();
    this.snapshotModal.classList.add('open');
  }

  closeSnapshotModal() {
    if (this.snapshotModal) {
      this.snapshotModal.classList.remove('open');
    }
  }

  handleTakeSnapshot() {
    const customLabel = this.inputSnapshotLabel ? this.inputSnapshotLabel.value : '';
    const snap = Storage.createSnapshot(customLabel);
    if (this.inputSnapshotLabel) this.inputSnapshotLabel.value = '';
    SoundFeedback.success();
    this.showToast(`📸 Snapshot "${snap.label}" berhasil disimpan!`);
    this.renderSnapshots();
  }

  async handleRestoreSnapshot(snapshotId) {
    const ok = await this.showConfirmDialog(
      'Pulihkan Snapshot',
      'Pulihkan troli belanja dari snapshot ini? Barang saat ini akan diganti.',
      '🔄',
      'Ya, Pulihkan',
      false
    );
    if (ok) {
      const success = Storage.restoreSnapshot(snapshotId);
      if (success) {
        SoundFeedback.success();
        this.items = Storage.getItems();
        this.budgetConfig = Storage.getBudgetConfig();
        this.render();
        this.showToast('🔄 Troli berhasil dipulihkan dari snapshot!');
        this.closeSnapshotModal();
      }
    }
  }

  handleDeleteSnapshot(snapshotId) {
    Storage.deleteSnapshot(snapshotId);
    SoundFeedback.tap();
    this.showToast('🗑️ Snapshot berhasil dihapus!');
    this.renderSnapshots();
  }

  renderSnapshots() {
    if (!this.snapshotListContainer) return;
    const snapshots = Storage.getSnapshots();

    if (this.snapshotCountBadge) {
      this.snapshotCountBadge.textContent = `${snapshots.length} snapshot tersimpan`;
    }

    if (snapshots.length === 0) {
      this.snapshotListContainer.innerHTML = `
        <div style="text-align:center; padding:24px 12px; color:var(--text-muted); font-size:0.8rem;">
          <div style="font-size:1.8rem; margin-bottom:6px;">📸</div>
          <div>Belum ada snapshot tersimpan.</div>
          <div style="font-size:0.72rem; margin-top:4px;">Ketik catatan dan tekan tombol <b>Buat Snapshot</b> di atas untuk menyimpan kondisi troli saat ini.</div>
        </div>
      `;
      return;
    }

    this.snapshotListContainer.innerHTML = snapshots.map((s) => `
      <div class="snapshot-card">
        <div class="snapshot-header-row">
          <span class="snapshot-title">
            <span>📷</span> ${s.label}
          </span>
          <span class="snapshot-time">
            ${new Date(s.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div class="snapshot-stats-row">
          <div class="snapshot-stat-item">
            <span class="snapshot-stat-label">Total Belanja</span>
            <span class="snapshot-stat-val" style="color:var(--emerald-400);">Rp ${Number(s.totalSpent || 0).toLocaleString('id-ID')}</span>
          </div>
          <div class="snapshot-stat-item">
            <span class="snapshot-stat-label">Barang</span>
            <span class="snapshot-stat-val">${s.itemCount || (s.items ? s.items.length : 0)} item (${s.inCartCount || 0} di troli)</span>
          </div>
          <div class="snapshot-stat-item">
            <span class="snapshot-stat-label">Batas Budget</span>
            <span class="snapshot-stat-val">Rp ${Number(s.budgetCap || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div class="snapshot-actions-row">
          <button type="button" class="btn-snapshot-delete" data-snapshot-id="${s.id}">
            Hapus
          </button>
          <button type="button" class="btn-snapshot-restore" data-snapshot-id="${s.id}">
            🔄 Pulihkan Troli
          </button>
        </div>
      </div>
    `).join('');

    // Pasang listener tombol restore & delete
    this.snapshotListContainer.querySelectorAll('.btn-snapshot-restore').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.snapshotId;
        this.handleRestoreSnapshot(id);
      });
    });

    this.snapshotListContainer.querySelectorAll('.btn-snapshot-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.snapshotId;
        this.handleDeleteSnapshot(id);
      });
    });
  }

  openAuthModal(isLocked = false) {
    const user = Auth.getCurrentUser();
    this.renderSavedAccounts();

    if (user && !isLocked) {
      this.authLoggedInView.style.display = 'flex';
      this.authFormView.style.display = 'none';

      const nameDisplay = document.getElementById('authUserNameDisplay');
      const emailDisplay = document.getElementById('authUserEmailDisplay');
      if (nameDisplay) nameDisplay.textContent = user.name;
      if (emailDisplay) emailDisplay.textContent = user.email;
    } else {
      this.authLoggedInView.style.display = 'none';
      this.authFormView.style.display = 'block';
    }

    if (this.btnCloseAuth) {
      this.btnCloseAuth.style.display = isLocked ? 'none' : 'inline-flex';
    }

    this.authModal.classList.add('open');
  }

  renderSavedAccounts() {
    const saved = Auth.getSavedAccounts();
    const currentUser = Auth.getCurrentUser();

    // 1. Render di dalam profil saat login
    if (this.savedAccountsContainer) {
      if (saved.length === 0) {
        this.savedAccountsContainer.innerHTML = `
          <div style="font-size:0.72rem; color:var(--text-muted); text-align:center; padding:8px 0;">
            Belum ada akun lain tersimpan di perangkat ini.
          </div>
        `;
      } else {
        this.savedAccountsContainer.innerHTML = saved.map((acc) => {
          const isCurrent = currentUser && (currentUser.id === acc.id || currentUser.email === acc.email);
          const initial = (acc.name || 'U').charAt(0).toUpperCase();
          return `
            <div class="saved-account-chip ${isCurrent ? 'active-account' : ''}" data-account-id="${acc.id}">
              <div style="display:flex; align-items:center; gap:8px;">
                <div class="account-avatar-circle">${initial}</div>
                <div>
                  <div style="font-weight:700; font-size:0.82rem; color:var(--text-main);">
                    ${acc.name} ${isCurrent ? '<span style="color:var(--emerald-400); font-size:0.7rem;">(Aktif)</span>' : ''}
                  </div>
                  <div style="font-size:0.7rem; color:var(--text-muted);">${acc.email}</div>
                </div>
              </div>
              <div>
                ${!isCurrent ? `
                  <button type="button" class="btn-switch-to-acc" data-account-id="${acc.id}" style="background:var(--emerald-500); color:#022c22; border:none; border-radius:var(--radius-sm); font-size:0.7rem; font-weight:800; padding:4px 8px; cursor:pointer;">
                    Ganti
                  </button>
                ` : '<span>✓</span>'}
              </div>
            </div>
          `;
        }).join('');

        this.savedAccountsContainer.querySelectorAll('.btn-switch-to-acc').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.accountId;
            this.handleSwitchAccount(id);
          });
        });
      }
    }

    // 2. Render quick prompt di form login jika ada akun tersimpan
    if (this.quickAccountsPrompt && this.quickAccountsList) {
      if (saved.length > 0 && !currentUser) {
        this.quickAccountsPrompt.style.display = 'block';
        this.quickAccountsList.innerHTML = saved.map((acc) => {
          const initial = (acc.name || 'U').charAt(0).toUpperCase();
          return `
            <button type="button" class="btn-quick-switch" data-account-id="${acc.id}" style="width:100%; display:flex; align-items:center; justify-content:space-between; background:var(--bg-card); border:1px solid var(--border-subtle); padding:6px 10px; border-radius:var(--radius-md); text-align:left; cursor:pointer;">
              <div style="display:flex; align-items:center; gap:8px;">
                <div class="account-avatar-circle" style="width:26px; height:26px; font-size:0.75rem;">${initial}</div>
                <div>
                  <div style="font-size:0.78rem; font-weight:700; color:var(--text-main);">${acc.name}</div>
                  <div style="font-size:0.68rem; color:var(--text-muted);">${acc.email}</div>
                </div>
              </div>
              <span style="font-size:0.72rem; color:var(--emerald-400); font-weight:700;">Masuk Instan →</span>
            </button>
          `;
        }).join('');

        this.quickAccountsList.querySelectorAll('.btn-quick-switch').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.accountId;
            this.handleSwitchAccount(id);
          });
        });
      } else {
        this.quickAccountsPrompt.style.display = 'none';
      }
    }
  }

  handleSwitchAccount(userId) {
    const res = Auth.switchAccount(userId);
    if (res.success) {
      SoundFeedback.success();
      this.showToast(`Beralih ke akun ${res.user.name}`);
      document.body.classList.remove('auth-locked-mode');
      document.documentElement.classList.remove('auth-locked-mode');
      if (this.btnCloseAuth) this.btnCloseAuth.style.display = 'inline-flex';

      // Poin 2: Isolasi Data Pengguna Aktif
      Storage.setActiveUser(res.user);
      this.items = Storage.getItems();
      this.budgetConfig = Storage.getBudgetConfig();
      this.historySessions = Storage.getHistory();

      // Load data cloud akun baru
      const cloudData = Auth.loadFromCloud(res.user.id);
      if (cloudData) {
        if (cloudData.items && Array.isArray(cloudData.items)) {
          this.items = cloudData.items;
          Storage.saveItems(this.items, false);
        }
        if (cloudData.budgetConfig) {
          this.budgetConfig = cloudData.budgetConfig;
          Storage.saveBudgetConfig(this.budgetConfig, false);
        }
        if (cloudData.history && Array.isArray(cloudData.history)) {
          this.historySessions = cloudData.history;
          Storage.saveHistory(this.historySessions, false);
        }
      }

      this.updateAuthUI();
      this.setupUserRealtimeSession(res.user);
      this.render();
      this.authModal.classList.remove('open');
    } else {
      this.showToast(res.message, true);
    }
  }

  processLogin(email, password) {
    const result = Auth.login(email, password);
    if (result.success) {
      SoundFeedback.success();
      this.showToast(result.message);
      document.body.classList.remove('auth-locked-mode');
      document.documentElement.classList.remove('auth-locked-mode');
      if (this.btnCloseAuth) this.btnCloseAuth.style.display = 'inline-flex';

      // Poin 2: Isolasi Data Pengguna Aktif
      Storage.setActiveUser(result.user);
      this.items = Storage.getItems();
      this.budgetConfig = Storage.getBudgetConfig();
      this.historySessions = Storage.getHistory();

      this.updateAuthUI();

      // Sinkronkan data cloud pengguna
      const cloudData = Auth.loadFromCloud(result.user.id);
      if (cloudData) {
        if (cloudData.items && Array.isArray(cloudData.items)) {
          this.items = cloudData.items;
          Storage.saveItems(this.items, false);
        }
        if (cloudData.budgetConfig) {
          this.budgetConfig = cloudData.budgetConfig;
          Storage.saveBudgetConfig(this.budgetConfig, false);
        }
        if (cloudData.history && Array.isArray(cloudData.history)) {
          this.historySessions = cloudData.history;
          Storage.saveHistory(this.historySessions, false);
        }
      } else {
        this.syncCurrentDataWithCloud();
      }

      this.setupUserRealtimeSession(result.user);
      this.render();
      this.authModal.classList.remove('open');
    } else {
      SoundFeedback.warning();
      this.showToast(result.message, true);
    }
  }

  updateAuthUI() {
    const user = Auth.getCurrentUser();

    // Ubah visual tombol akun di header
    if (this.userAuthBtn) {
      if (user) {
        this.userAuthBtn.style.borderColor = 'var(--emerald-500)';
        this.userAuthBtn.style.color = 'var(--emerald-400)';
        this.userAuthBtn.title = `Akun: ${user.name} (${user.email}) - Klik untuk Ganti Akun`;
      } else {
        this.userAuthBtn.style.borderColor = '';
        this.userAuthBtn.style.color = '';
        this.userAuthBtn.title = 'Akun & Cloud Sync';
      }
    }

    if (this.headerLogoutBtn) {
      this.headerLogoutBtn.style.display = user ? 'inline-flex' : 'none';
      if (user) {
        this.headerLogoutBtn.title = `Logout dari ${user.name} (Buka Gerbang Login)`;
      }
    }
  }

  syncCurrentDataWithCloud() {
    const sessionMeta = Storage.getSessionMeta();
    const dataPayload = {
      sessionMeta,
      items: this.items,
      budgetConfig: this.budgetConfig,
      history: this.historySessions,
      priceMemory: Storage.getPriceMemory(),
      lastSynced: new Date().toISOString()
    };

    const user = Auth.getCurrentUser();
    if (user) {
      dataPayload.userId = user.id;
      dataPayload.userEmail = user.email;
      Auth.syncToCloud(user.id, dataPayload);
    }

    // Dual-Write ke Firebase Firestore collection 'grocery_sessions' (Poin 6)
    const docId = this.currentSessionDocId || 'active_session';
    FirebaseSync.syncToFirestore(docId, dataPayload);
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
    this.updateRecipeMatchBadge();
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

    // Dynamic Budget Alert Banner (SRS F-05)
    if (this.budgetWarningBanner) {
      if (evaluation.isOverbudget) {
        this.budgetWarningBanner.className = 'budget-alert-banner';
        this.budgetWarningBanner.style.display = 'flex';
        if (this.budgetWarningBannerText) {
          this.budgetWarningBannerText.textContent = evaluation.statusMessage;
        }
      } else if (evaluation.usedPercentage >= 90) {
        this.budgetWarningBanner.className = 'budget-alert-banner warning-banner';
        this.budgetWarningBanner.style.display = 'flex';
        if (this.budgetWarningBannerText) {
          this.budgetWarningBannerText.textContent = evaluation.statusMessage;
        }
      } else {
        this.budgetWarningBanner.style.display = 'none';
      }
    }
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
        <div class="empty-cart-state">
          <div class="empty-cart-icon">${getIcon('cart')}</div>
          <div class="empty-cart-title">Keranjang Belanja Kosong</div>
          <p class="empty-cart-subtitle">Mulai tambahkan barang kebutuhan bulanan kamu menggunakan tombol di bawah atau pilih Cepat dari katalog di atas.</p>
          <button id="btnEmptyAdd" type="button" class="btn-primary" style="margin-top:6px; font-size:0.8rem; padding:8px 16px;">
            + Tambah Barang Sekarang
          </button>
        </div>
      `;
      const btnEmptyAdd = document.getElementById('btnEmptyAdd');
      if (btnEmptyAdd) {
        btnEmptyAdd.addEventListener('click', () => this.openItemModal());
      }
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
            <span>• Satuan: <b>${item.unit}</b>${item.unitConversion ? `<span class="unit-conv-tag">(${item.unitConversion})</span>` : ''}</span>
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
    btnMinus.addEventListener('click', async () => {
      if (item.qty > 1) {
        item.qty -= 1;
        SoundFeedback.tap();
        Storage.saveItems(this.items);
        this.render();
      } else {
        // Jika 1 lalu ditekan minus, konfirmasi hapus via modal non-blocking
        const ok = await this.showConfirmDialog(
          'Hapus Barang',
          `Kuantitas sudah 1. Ingin menghapus "${item.name}" dari troli belanja?`,
          '🗑️',
          'Ya, Hapus'
        );
        if (ok) {
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
    btnDelete.addEventListener('click', async () => {
      const ok = await this.showConfirmDialog(
        'Hapus Barang',
        `Apakah kamu yakin ingin menghapus "${item.name}" dari keranjang belanja?`,
        '🗑️',
        'Ya, Hapus'
      );
      if (ok) {
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

    // Reset status active chip diskon
    document.querySelectorAll('.disc-preset-chip').forEach((c) => c.classList.remove('active-preset'));

    if (itemToEdit) {
      this.inputName.value = itemToEdit.name;
      this.inputCategory.value = itemToEdit.category;
      this.updateContextualUnits(itemToEdit.name, itemToEdit.unit);
      if (this.inputUnitConversion) this.inputUnitConversion.value = itemToEdit.unitConversion || '';
      this.inputQty.value = itemToEdit.qty;
      this.inputUnitPrice.value = itemToEdit.unitPrice;
      this.inputLastMonthPrice.value = itemToEdit.lastMonthPrice || '';
      this.inputDisc1.value = itemToEdit.disc1 || 0;
      this.inputDisc2.value = itemToEdit.disc2 || 0;
      this.inputFixedDiscount.value = itemToEdit.fixedDiscount || 0;
      this.inputNotes.value = itemToEdit.notes || '';
    } else {
      this.itemForm.reset();
      this.updateContextualUnits('');
      if (this.customUnitGroup) this.customUnitGroup.style.display = 'none';
      if (this.inputCustomUnit) this.inputCustomUnit.value = '';
      if (this.inputUnitConversion) this.inputUnitConversion.value = '';
      this.inputQty.value = 1;
      this.inputDisc1.value = 0;
      this.inputDisc2.value = 0;
      this.inputFixedDiscount.value = 0;
    }

    this.updateModalLivePreview();
    this.itemModal.classList.add('open');
    setTimeout(() => this.inputName.focus(), 150);
  }

  /**
   * Poin 1: Update Opsi Satuan Dinamis Berdasarkan Pencocokan Nama Produk
   * @param {string} productName 
   * @param {string|null} preselectUnit 
   */
  updateContextualUnits(productName = '', preselectUnit = null) {
    if (!this.inputUnit) return;
    const currentVal = preselectUnit || this.inputUnit.value;
    const contextualUnits = getContextualUnitsForProduct(productName);

    let html = contextualUnits.map((u) => `<option value="${u}">${u}</option>`).join('');
    html += `<option value="__custom__">✏️ Custom / Tulis Sendiri...</option>`;
    this.inputUnit.innerHTML = html;

    if (currentVal && contextualUnits.includes(currentVal)) {
      this.inputUnit.value = currentVal;
      if (this.customUnitGroup) this.customUnitGroup.style.display = 'none';
    } else if (currentVal && currentVal !== '__custom__') {
      // Nilai custom tersimpan
      this.inputUnit.value = '__custom__';
      if (this.customUnitGroup) this.customUnitGroup.style.display = 'block';
      if (this.inputCustomUnit) this.inputCustomUnit.value = currentVal;
    } else {
      this.inputUnit.value = contextualUnits[0] || 'pcs';
      if (this.customUnitGroup) this.customUnitGroup.style.display = 'none';
    }
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
      this.showToast('Nama produk wajib diisi!', true);
      SoundFeedback.warning();
      return;
    }

    const rawUnitPrice = Number(this.inputUnitPrice.value);
    if (isNaN(rawUnitPrice) || rawUnitPrice <= 0) {
      this.showToast('Harga satuan harus lebih besar dari Rp 0!', true);
      SoundFeedback.warning();
      return;
    }

    // Validasi kuantitas hanya angka positif minimal 0.1 (Poin 1)
    const rawQty = Number(this.inputQty.value);
    if (isNaN(rawQty) || rawQty <= 0) {
      this.showToast('Kuantitas beli harus angka positif (minimal 0.1)!', true);
      SoundFeedback.warning();
      if (this.inputQty) this.inputQty.focus();
      return;
    }

    // Tentukan satuan (apakah dari dropdown atau custom tulis sendiri)
    let finalUnit = this.inputUnit.value;
    if (finalUnit === '__custom__') {
      const customVal = this.inputCustomUnit ? this.inputCustomUnit.value.trim() : '';
      if (!customVal) {
        this.showToast('Silakan tulis format satuan custom Anda!', true);
        SoundFeedback.warning();
        if (this.inputCustomUnit) this.inputCustomUnit.focus();
        return;
      }
      finalUnit = customVal;
    }

    const unitPrice = rawUnitPrice;
    const qty = rawQty;
    const unitConversion = this.inputUnitConversion ? this.inputUnitConversion.value.trim() : '';
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
          unit: finalUnit,
          unitConversion,
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
        unit: finalUnit,
        unitConversion,
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
      this.showToast('Belum ada barang di dalam troli! Centang barang terlebih dahulu.', true);
      SoundFeedback.warning();
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

  // ==========================================================================
  // POIN 2: FITUR SELESAI BELANJA, STRUK TOTAL & ARSIP RIWAYAT (CHECKOUT)
  // ==========================================================================

  async promptFinishShopping() {
    const inCartItems = this.items.filter((it) => it.inCart);
    if (inCartItems.length === 0) {
      SoundFeedback.warning();
      this.showToast('Troli belanja masih kosong! Masukkan barang terlebih dahulu.', true);
      return;
    }

    const ok = await this.showConfirmDialog(
      'Selesaikan Belanja & Cetak Struk',
      `Anda memiliki ${inCartItems.length} barang di troli. Ingin menyelesaikan belanja, mengarsipkan transaksi ini, dan mencetak struk digital?`,
      '🧾',
      'Ya, Selesai Belanja',
      false
    );

    if (ok) {
      this.handleFinishShopping();
    }
  }

  handleFinishShopping() {
    const inCartItems = this.items.filter((it) => it.inCart);
    if (inCartItems.length === 0) return;

    let subtotalRaw = 0;
    let totalDiscountSavings = 0;
    let totalFinal = 0;

    const itemsReceipt = inCartItems.map((item) => {
      const disc = Calculations.calculateTieredDiscount(
        item.unitPrice,
        item.disc1,
        item.disc2,
        item.fixedDiscount
      );
      const rowRaw = item.unitPrice * item.qty;
      const rowFinal = Calculations.calculateItemTotal(disc.finalUnitPrice, item.qty);
      const rowSaving = rowRaw - rowFinal;

      subtotalRaw += rowRaw;
      totalDiscountSavings += rowSaving;
      totalFinal += rowFinal;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        unitConversion: item.unitConversion || '',
        qty: item.qty,
        unitPriceRaw: item.unitPrice,
        unitPriceFinal: disc.finalUnitPrice,
        disc1: item.disc1 || 0,
        disc2: item.disc2 || 0,
        fixedDiscount: item.fixedDiscount || 0,
        saving: rowSaving,
        rowTotal: rowFinal
      };
    });

    const evaluation = Calculations.evaluateBudgetSafety(
      totalFinal,
      this.budgetConfig.budgetCap,
      this.budgetConfig.safetyBuffer
    );

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const storeName = this.selectStore ? this.selectStore.value : 'Lotte Mart Grocery - Puri Indah';
    const trxId = 'TRX-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();

    const transactionRecord = {
      id: trxId,
      storeName,
      date: dateFormatted,
      time: timeFormatted,
      timestamp: now.toISOString(),
      items: itemsReceipt,
      totalItems: inCartItems.length,
      subtotalRaw,
      totalDiscountSavings,
      totalSpent: totalFinal,
      budgetCap: this.budgetConfig.budgetCap,
      safetyBuffer: this.budgetConfig.safetyBuffer,
      status: evaluation.level,
      statusTitle: evaluation.statusTitle,
      notes: `Selesai belanja di ${storeName}. Status dompet: ${evaluation.statusTitle}`
    };

    // 1. Simpan transaksi ke riwayat belanja (LocalStorage & Firestore)
    Storage.addHistorySession(transactionRecord);
    this.historySessions = Storage.getHistory();

    // Rekam harga produk ke memori harga permanen untuk patokan masa lalu
    inCartItems.forEach((it) => {
      Storage.recordProductPrice(it.name, it.unitPrice, it.category, it.unit);
    });

    // 2. Kosongkan seluruh item yang ada di dalam troli saat ini (Reset keranjang belanja)
    this.items = [];
    Storage.saveItems(this.items);

    // Sinkronkan ke Cloud Firestore (sehingga di perangkat lain HP/Laptop juga langsung kosong)
    this.syncCurrentDataWithCloud();

    // Render ulang tampilan utama
    this.render();

    // 3. Tampilkan modal struk digital resmi
    SoundFeedback.success();
    this.showToast('🎉 Belanja selesai! Transaksi diarsipkan ke Riwayat Belanja.');
    this.openReceiptModal(transactionRecord);
  }

  openReceiptModal(trx) {
    if (!this.receiptModal || !this.receiptPaperContainer) return;

    const itemsHtml = trx.items.map((it, idx) => `
      <div class="receipt-item-row">
        <div style="flex:1; padding-right:8px;">
          <div class="receipt-item-name">${idx + 1}. ${it.name}</div>
          <div class="receipt-item-subcalc">
            ${it.qty} ${it.unit} ${it.unitConversion ? `(${it.unitConversion})` : ''} x ${Calculations.formatRupiah(it.unitPriceFinal)}
            ${it.saving > 0 ? `<span style="color:#16a34a; font-weight:700;">(Hemat ${Calculations.formatRupiah(it.saving)})</span>` : ''}
          </div>
        </div>
        <div style="font-weight:700; text-align:right;">
          ${Calculations.formatRupiah(it.rowTotal)}
        </div>
      </div>
    `).join('');

    this.receiptPaperContainer.innerHTML = `
      <div class="receipt-header-center">
        <div class="receipt-store-title">🏬 ${trx.storeName.toUpperCase()}</div>
        <div class="receipt-meta-info">
          <div>No. Struk: <b>${trx.id}</b></div>
          <div>Waktu: ${trx.date} • ${trx.time} WIB</div>
          <div>Kasir: Self-Checkout PWA</div>
        </div>
      </div>

      <div style="font-size:0.75rem; font-weight:700; color:#334155; margin-bottom:8px; border-bottom:1px dashed #cbd5e1; padding-bottom:4px;">
        RINCIAN BELANJAAN (${trx.totalItems} ITEM):
      </div>

      <div style="display:flex; flex-direction:column; gap:6px;">
        ${itemsHtml}
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-summary-line">
        <span>Subtotal Kotor:</span>
        <span>${Calculations.formatRupiah(trx.subtotalRaw || trx.totalSpent)}</span>
      </div>

      <div class="receipt-summary-line" style="color:#16a34a; font-weight:700;">
        <span>Total Hemat Promo:</span>
        <span>-${Calculations.formatRupiah(trx.totalDiscountSavings || 0)}</span>
      </div>

      <div class="receipt-grand-total receipt-summary-line">
        <span>TOTAL AKHIR:</span>
        <span>${Calculations.formatRupiah(trx.totalSpent)}</span>
      </div>

      <div class="receipt-summary-line" style="font-size:0.75rem; color:#475569;">
        <span>Batas Anggaran Dompet:</span>
        <span>${Calculations.formatRupiah(trx.budgetCap)}</span>
      </div>

      <div class="receipt-summary-line" style="font-size:0.75rem; color:#475569;">
        <span>Status Saldo:</span>
        <b>${trx.statusTitle || 'Anggaran Terkendali'}</b>
      </div>

      <div class="receipt-barcode-visual">
        <div style="font-weight:700; letter-spacing:0.5px;">TERIMA KASIH TELAH BERBELANJA HEMAT</div>
        <div style="font-size:0.65rem; color:#64748b; margin-top:3px;">Simpan struk digital ini sebagai bukti pengeluaran bulanan</div>
      </div>
    `;

    this.receiptModal.classList.add('open');
  }

  // ==========================================================================
  // TAB 2: RIWAYAT BELANJA (FORMAT STRUK DIGITAL - POIN 2)
  // ==========================================================================

  renderHistory() {
    this.historyListContainer.innerHTML = '';
    if (this.historySessions.length === 0) {
      this.historyListContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${getIcon('history')}</div>
          <p>Belum ada riwayat belanja yang disimpan.</p>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
            Setelah memasukkan barang dan menekan <b>Selesai Belanja</b>, struk transaksi akan otomatis tersimpan di sini.
          </div>
        </div>
      `;
      return;
    }

    this.historySessions.forEach((session) => {
      const card = document.createElement('div');
      card.className = 'history-receipt-card';

      let statusBadge = '<span class="budget-status-pill pill-safe">Aman</span>';
      if (session.status === 'warning') statusBadge = '<span class="budget-status-pill pill-warning">Waspada</span>';
      if (session.status === 'critical') statusBadge = '<span class="budget-status-pill pill-critical">Kritis</span>';
      if (session.status === 'danger') statusBadge = '<span class="budget-status-pill pill-danger">Overbudget</span>';

      const itemsListHtml = session.items ? session.items.map((it) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
          <div style="flex:1; padding-right:8px;">
            <div style="font-weight:600; color:var(--text-main);">• ${it.name}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">
              ${it.qty} ${it.unit || 'unit'} ${it.unitConversion ? `(${it.unitConversion})` : ''} • Total: ${Calculations.formatRupiah(it.rowTotal || it.total)} 
              <span style="color:var(--emerald-400);">(@ ${Calculations.formatRupiah(it.unitPriceFinal || it.unitPrice)})</span>
            </div>
          </div>
          <button class="btn-rebuy" data-name="${it.name}" data-price="${it.unitPriceFinal || it.unitPrice}" title="Masukkan barang ini kembali ke troli">
            ${getIcon('cart')} Beli Lagi
          </button>
        </div>
      `).join('') : '';

      card.innerHTML = `
        <div class="history-card-header">
          <div>
            <div class="history-store-name">🏬 ${session.storeName || 'Lotte Mart Grocery'}</div>
            <div class="history-date-badge">📅 ${session.date} ${session.time ? `• ${session.time}` : ''} • No: ${session.id || 'TRX-AUTO'}</div>
          </div>
          ${statusBadge}
        </div>

        <div class="history-stats-row">
          <div>
            <div class="history-stat-label">Total Belanja Struk</div>
            <div class="history-stat-val" style="color:var(--emerald-400); font-size:1.1rem;">
              ${Calculations.formatRupiah(session.totalSpent)}
            </div>
            ${session.totalDiscountSavings > 0 ? `
              <div style="font-size:0.7rem; color:var(--emerald-400);">Hemat: -${Calculations.formatRupiah(session.totalDiscountSavings)}</div>
            ` : ''}
          </div>
          <div style="text-align:right;">
            <div class="history-stat-label">Batas Anggaran Saku</div>
            <div style="font-family:var(--font-mono); font-size:0.85rem; color:var(--text-secondary);">
              ${Calculations.formatRupiah(session.budgetCap || 350000)}
            </div>
            <button type="button" class="btn-view-full-receipt" style="margin-top:4px; background:var(--bg-surface); border:1px solid var(--border-subtle); color:var(--sky-400); font-size:0.72rem; padding:4px 8px; border-radius:var(--radius-sm); cursor:pointer;">
              🧾 Buka Struk
            </button>
          </div>
        </div>

        <div class="history-items-mini">
          <div style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); margin-bottom:4px;">
            Rincian Barang (${session.totalItems || (session.items ? session.items.length : 0)} Item):
          </div>
          ${itemsListHtml}
        </div>
      `;

      // Event listener Beli Lagi
      card.querySelectorAll('.btn-rebuy').forEach((btn) => {
        btn.addEventListener('click', () => {
          const name = btn.dataset.name;
          const price = Number(btn.dataset.price) || 0;
          this.reBuyItem(name, price);
        });
      });

      // Event listener Buka Struk
      const btnViewReceipt = card.querySelector('.btn-view-full-receipt');
      if (btnViewReceipt) {
        btnViewReceipt.addEventListener('click', () => {
          this.openReceiptModal(session);
        });
      }

      this.historyListContainer.appendChild(card);
    });
  }

  // ==========================================================================
  // POIN 8: FITUR IDE MENU MASAKAN CERDAS DARI ISI KERANJANG
  // ==========================================================================

  updateRecipeMatchBadge() {
    if (!this.recipeMatchCountBadge) return;
    const recipes = RecipeEngine.matchRecipes(this.items);
    const readyCount = recipes.filter((r) => r.canCookNow).length;

    if (this.recipeReadyCount) this.recipeReadyCount.textContent = readyCount;
    if (this.recipeAllCount) this.recipeAllCount.textContent = recipes.length;

    if (readyCount > 0) {
      this.recipeMatchCountBadge.textContent = `🔥 ${readyCount} Menu Siap Masak`;
      this.recipeMatchCountBadge.style.background = 'var(--emerald-500)';
      this.recipeMatchCountBadge.style.color = '#022c22';
    } else {
      this.recipeMatchCountBadge.textContent = '💡 Cek Menu';
      this.recipeMatchCountBadge.style.background = 'var(--amber-500)';
      this.recipeMatchCountBadge.style.color = '#1e1b4b';
    }
  }

  openRecipesModal() {
    this.renderRecipesList();
    this.recipesModal.classList.add('open');
  }

  renderRecipesList() {
    if (!this.recipesListContainer) return;
    const allRecipes = RecipeEngine.matchRecipes(this.items);
    const readyCount = allRecipes.filter((r) => r.canCookNow).length;

    if (this.recipeReadyCount) this.recipeReadyCount.textContent = readyCount;
    if (this.recipeAllCount) this.recipeAllCount.textContent = allRecipes.length;

    const filtered = this.activeRecipeFilter === 'ready'
      ? allRecipes.filter((r) => r.canCookNow)
      : allRecipes;

    if (filtered.length === 0) {
      this.recipesListContainer.innerHTML = `
        <div style="text-align:center; padding:24px 12px; color:var(--text-muted);">
          <div style="font-size:2rem; margin-bottom:6px;">🍳</div>
          <div style="font-weight:700; color:var(--text-main); margin-bottom:4px;">Belum Ada Menu yang 100% Siap Masak</div>
          <div style="font-size:0.75rem; line-height:1.4;">
            Bahan di troli Anda belum mencukupi menu siap masak. Klik tab <b>"Semua Menu"</b> di atas untuk melihat inspirasi dan menambahkan bahan yang kurang dengan 1 klik!
          </div>
        </div>
      `;
      return;
    }

    this.recipesListContainer.innerHTML = filtered.map((recipe) => {
      let badgeClass = 'recipe-match-low';
      if (recipe.matchPercentage >= 75) badgeClass = 'recipe-match-high';
      else if (recipe.matchPercentage >= 40) badgeClass = 'recipe-match-med';

      const availableHtml = recipe.availableIngredients.length > 0
        ? recipe.availableIngredients.map((ing) => `<span style="color:var(--emerald-400); font-weight:700;">✅ ${ing}</span>`).join(' • ')
        : '<span style="color:var(--text-muted);">Belum ada</span>';

      const missingHtml = recipe.missingIngredients.length > 0
        ? recipe.missingIngredients.map((ing) => `
            <div style="display:inline-flex; align-items:center; gap:4px; margin-right:6px; margin-top:4px;">
              <span style="color:var(--rose-400);">❌ ${ing}</span>
              <button type="button" class="btn-add-missing-ingredient" data-ing-name="${ing}">
                + Ke Troli
              </button>
            </div>
          `).join('')
        : '<span style="color:var(--emerald-400); font-weight:700;">Semua bahan lengkap di troli!</span>';

      const instructionsHtml = recipe.instructions.map((step, idx) => `
        <div style="margin-bottom:3px;">${idx + 1}. ${step}</div>
      `).join('');

      return `
        <div class="recipe-card-box ${recipe.canCookNow ? 'recipe-can-cook' : ''}">
          <div class="recipe-header-row">
            <div class="recipe-title-group">
              <span class="recipe-emoji-big">${recipe.emoji}</span>
              <div>
                <div class="recipe-name">${recipe.name}</div>
                <div class="recipe-meta-sub">${recipe.category} • ⏱️ ${recipe.prepTime} persiapan, ${recipe.cookTime} masak • 🍽️ ${recipe.servings}</div>
              </div>
            </div>
            <span class="recipe-match-pill ${badgeClass}">
              ${recipe.matchPercentage}% Cocok
            </span>
          </div>

          <div class="recipe-ingredients-block">
            <div style="margin-bottom:4px;">
              <b>Bahan Tersedia di Troli:</b> ${availableHtml}
            </div>
            <div>
              <b>Bahan yang Masih Kurang:</b>
              <div style="margin-top:2px;">${missingHtml}</div>
            </div>
          </div>

          <details style="font-size:0.75rem; color:var(--text-secondary); cursor:pointer;">
            <summary style="font-weight:700; color:var(--amber-400); margin-bottom:4px;">
              📖 Lihat Cara Memasak Praktis
            </summary>
            <div style="background:var(--bg-surface); padding:8px 10px; border-radius:var(--radius-sm); margin-top:4px; line-height:1.45;">
              ${instructionsHtml}
            </div>
          </details>
        </div>
      `;
    }).join('');

    // Pasang listener tombol tambah bahan kurang ke troli
    this.recipesListContainer.querySelectorAll('.btn-add-missing-ingredient').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const ingName = e.currentTarget.dataset.ingName;
        this.addMissingIngredientToCart(ingName);
      });
    });
  }

  addMissingIngredientToCart(ingredientName) {
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: ingredientName,
      category: 'pokok',
      unit: 'pcs',
      unitConversion: '',
      qty: 1,
      unitPrice: 10000,
      lastMonthPrice: 10000,
      disc1: 0,
      disc2: 0,
      fixedDiscount: 0,
      inCart: true,
      notes: 'Bahan pelengkap resep masakan'
    };

    this.items.unshift(newItem);
    Storage.saveItems(this.items);
    this.syncCurrentDataWithCloud();
    SoundFeedback.success();
    this.showToast(`+1 ${ingredientName} ditambahkan ke troli belanja!`);
    this.render();
    this.renderRecipesList();
  }

  // ==========================================================================
  // POIN 7: FITUR DOWNLOAD & PASANG APLIKASI MANDIRI (PWA INSTALL)
  // ==========================================================================

  async handlePwaInstallClick() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        this.showToast('Aplikasi berhasil dipasang di perangkat Anda!');
      }
      this.deferredPrompt = null;
      if (this.pwaGuideModal) this.pwaGuideModal.classList.remove('open');
    } else {
      // Jika browser tidak support event prompt (misal iOS Safari atau Desktop tanpa native prompt)
      if (this.pwaGuideModal) {
        this.pwaGuideModal.classList.add('open');
      } else {
        this.showToast('Gunakan menu browser > "Add to Home Screen" untuk memasang.');
      }
    }
  }

  downloadStandaloneOfflineHtml() {
    try {
      const htmlContent = document.documentElement.outerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SmartGrocery-Standalone-App.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      SoundFeedback.success();
      this.showToast('File aplikasi standalone berhasil diunduh!');
    } catch (e) {
      this.showToast('Gagal mengunduh file offline.', true);
    }
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
