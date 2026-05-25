# Kas Rumah 💰

Aplikasi keuangan rumah tangga. APK di-build otomatis via GitHub Actions — tanpa install Android Studio atau npm di laptop.

---

## Cara pakai: dari nol sampai APK

### Langkah 1 — Buat akun GitHub
Kalau belum punya, daftar di https://github.com (gratis)

---

### Langkah 2 — Buat repository baru
1. Login ke github.com
2. Klik tombol **+** di pojok kanan atas → **New repository**
3. Isi nama: `kas-rumah`
4. Pilih **Public** (gratis unlimited build)
5. Klik **Create repository**

---

### Langkah 3 — Upload semua file project ini

Di halaman repository yang baru dibuat:
1. Klik **uploading an existing file**
2. Drag & drop SEMUA file dan folder dari project ini
3. Pastikan struktur foldernya seperti ini:

```
kas-rumah/
├── .github/
│   └── workflows/
│       └── build-apk.yml   ← PENTING, jangan sampai ketinggalan
├── src/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── storage.js
│       └── app.js
├── capacitor.config.json
└── package.json
```

4. Scroll ke bawah → klik **Commit changes**

---

### Langkah 4 — GitHub otomatis build APK

Setelah upload selesai, GitHub Actions langsung jalan otomatis.

Pantau progressnya:
1. Klik tab **Actions** di repository
2. Akan ada job bernama **Build APK** sedang berjalan (lingkaran kuning)
3. Tunggu sekitar **5-10 menit** sampai jadi centang hijau ✅

---

### Langkah 5 — Download APK

Setelah build selesai (centang hijau):
1. Klik job **Build APK**
2. Scroll ke bawah ke bagian **Artifacts**
3. Klik **kas-rumah-debug** → file ZIP terdownload
4. Extract ZIP → ada file `app-debug.apk`

---

### Langkah 6 — Install APK ke HP

1. Pindahkan `app-debug.apk` ke HP (kirim via WhatsApp ke diri sendiri, atau Google Drive)
2. Di HP: **Pengaturan → Keamanan → Install aplikasi tidak dikenal → aktifkan**
3. Buka file APK → Install
4. Aplikasi **Kas Rumah** muncul di layar utama HP ✅

---

## Kalau mau update kode

Cukup edit file di GitHub langsung (klik file → ikon pensil):

```
Edit file di GitHub
      ↓
Klik "Commit changes"
      ↓
GitHub Actions otomatis build APK baru
      ↓
Download APK baru dari tab Actions
```

Tidak perlu install apapun di laptop!

---

## Kenapa APK-nya "debug"?

APK debug = untuk testing pribadi, sudah cukup untuk dipakai sehari-hari.
APK release = untuk upload ke Play Store (butuh keystore & signing).

Untuk pemakaian pribadi, APK debug sudah sempurna.

---

## Struktur file penting

| File | Fungsi |
|------|--------|
| `.github/workflows/build-apk.yml` | Instruksi build otomatis di GitHub |
| `src/js/storage.js` | Baca/tulis file JSON di storage HP |
| `src/js/app.js` | Logika utama aplikasi |
| `capacitor.config.json` | Konfigurasi nama app & ID |
| `package.json` | Daftar library yang dibutuhkan |
