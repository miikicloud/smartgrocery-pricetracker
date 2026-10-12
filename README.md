# 🛒 Smart Grocery & Budget Safety Tracker (PWA Mobile)

Aplikasi Web Mobile PWA bergaya native smartphone untuk membantu mahasiswa/siswa rantau berbelanja kebutuhan bulanan di supermarket secara terkontrol dan anti-overbudget saat mendorong troli.

---

## 📱 Standar Arsitektur & Tampilan Mobile

1. **Format Layar Khusus Smartphone (`max-width: 430px`)**:
   - Tampilan didesain proporsional mengikuti standar layar smartphone modern (iPhone 15/16 Pro Max) dengan lebar maksimal 430px di tengah layar (centered) saat dibuka pada desktop browser.
   - Pada layar HP asli, aplikasi otomatis memenuhi layar 100% dengan dukungan `viewport-fit=cover` dan *safe-area insets*.

2. **Navigasi Bawah (*Bottom Navigation Bar*)**:
   - Menu melayang (*docked floating bar*) di bagian bawah layar dengan ikon SVG Lucide yang ringan dan 100% siap bekerja secara *offline*.
   - 3 Tab Utama:
     - 🛒 **Belanja**: Daftar troli aktif, tambah barang cepat, filter kategori, dan kartu belanja ergonomis.
     - 📜 **Riwayat**: Arsip belanja bulan-bulan sebelumnya dan database harga historis.
     - 🎯 **Anggaran**: Pemantau saldo saku, konfigurasi batas anggaran, analisis pengeluaran, dan tips hemat anak kos.

3. **Ergonomi Mobile Satu Tangan**:
   - Tombol pengatur kuantitas (*stepper* `+` dan `-`) berukuran minimal 44–48px yang ramah jempol.
   - Input harga dan kuantitas berukuran besar (*big number input*).
   - Layout kartu modular vertikal (tanpa tabel horizontal desktop yang melebar ke samping).
   - Dilengkapi *Web Audio API Synthesizer* untuk simulasi getaran/efek audio klik (*haptic feedback*) saat menekan tombol dan peringatan suara saat *overbudget*.

4. **Dukungan PWA (*Progressive Web App*)**:
   - Disertai file `manifest.json` dan `sw.js` (Service Worker) dengan strategi *cache-first*.
   - Siap dipasang ke layar utama (*Add to Home Screen* / *Standalone Mode*).
   - Berfungsi 100% *offline* di lantai basement supermarket tanpa sinyal internet.

---

## 🧮 Kebutuhan Fungsional (SRS Checklist)

| Kebutuhan Fungsional | Implementasi & Rumus Matematis |
| :--- | :--- |
| **Struktur Data Belanja** | Atribut wajib setiap barang:<br>• `id`: ID unik item<br>• `name`: Nama barang<br>• `category`: Kategori (Bahan Pokok, Lauk, Bumbu, Toiletries, Camilan, Kos)<br>• `unit`: Satuan ukuran (kg, liter, pcs, pack, botol, renteng)<br>• `qty`: Kuantitas belanja<br>• `unitPrice`: Harga satuan terkini<br>• `lastMonthPrice`: Harga patokan bulan lalu<br>• `disc1`, `disc2`: Diskon bertingkat (%)<br>• `fixedDiscount`: Voucher potongan langsung (Rp)<br>• `inCart`: Status sudah masuk troli<br>• `notes`: Catatan belanja |
| **Logika Kuantitas Otomatis** | Begitu tombol kuantitas `[+]` atau `[-]` ditekan, total harga item dan saldo anggaran langsung terhitung secara *realtime* otomatis tanpa perlu tombol kalkulator manual. |
| **Logika Diskon Bertingkat** | Perhitungan diskon bertumpuk matematis (*compound discount*):<br>1. Potongan pertama: $P_1 = \text{Harga Awal} \times (1 - \frac{D_1}{100})$<br>2. Potongan kedua: $P_2 = P_1 \times (1 - \frac{D_2}{100})$<br>3. Potongan kupon: $P_{\text{akhir}} = \max(0, P_2 - \text{Voucher})$<br>*Contoh:* Promo 50% + 20% pada harga Rp 100.000 menghasilkan harga akhir **Rp 40.000** (Diskon efektif 60%, hemat Rp 60.000). |
| **Deteksi Fluktuasi Harga** | Membandingkan $\Delta = \text{unitPrice} - \text{lastMonthPrice}$:<br>• **Naik (Merah / Rose)**: Menampilkan selisih dan persentase kenaikan harga.<br>• **Turun (Hijau / Emerald)**: Menampilkan penghematan karena promo.<br>• **Stabil (Abu-abu / Slate)**: Harga konsisten sama dengan bulan lalu.<br>• **Baru (Indigo)**: Barang pertama kali dibeli. |
| **Pengendali Anggaran (*Budget Safety Cap*)** | *Sticky header card* pemantau uang saku anak rantau:<br>• **Aman** ($< 75\%$): Indikator hijau, belanja terkendali.<br>• **Waspada** ($75\% - 90\%$): Indikator amber, mendekati batas belanja.<br>• **Kritis** ($> 90\%$): Indikator oranye menyentuh *Safety Buffer* (cadangan kresek & parkir).<br>• **🚨 Overbudget** ($> 100\%$): Indikator merah berkedip (*pulsing alert*) + peringatan overbudget agar barang dikurangi sebelum menuju kasir. |

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi dibangun menggunakan teknologi murni web modern (HTML5, Vanilla CSS3, Vanilla ES Modules JavaScript, Service Worker) tanpa perlu proses kompilasi yang rumit:

```bash
# Jalankan server lokal
node serve.js
```

Buka peramban di: **`http://localhost:3000/`** (atau `http://127.0.0.1:3000/`).
- Di browser desktop: Tampilan akan rapi berada di tengah layar dengan simulator smartphone 430px.
- Di smartphone: Tambahkan ke layar utama (*Add to Home Screen*) untuk menjalankan mode aplikasi *fullscreen native*.