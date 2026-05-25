/**
 * storage.js
 * Di HP (native)  : baca/tulis file transaksi.json ke App folder HP
 * Di browser      : fallback ke localStorage
 *
 * File di HP tersimpan di:
 *   /storage/emulated/0/App/KasRumah/transaksi.json
 *   (bisa dilihat di File Manager HP)
 */

const Storage = (() => {
  const FILE_NAME = 'transaksi.json';
  const FOLDER    = 'KasRumah';
  let Filesystem  = null;
  let Directory   = null;
  let isNative    = false;

  // ── Init ────────────────────────────────────────────────────────────────

  async function init() {
    // Cek apakah jalan di Capacitor native
    if (window.Capacitor?.isNativePlatform?.()) {
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/@capacitor/filesystem@5/dist/esm/index.js');
        Filesystem = mod.Filesystem;
        Directory  = mod.Directory;
        isNative   = true;

        // Pastikan folder KasRumah ada
        try {
          await Filesystem.mkdir({
            path: FOLDER,
            directory: Directory.App,
            recursive: true
          });
        } catch (e) {
          // Folder sudah ada, tidak masalah
        }

        setStatus('🟢 File JSON tersimpan di App/KasRumah/');
        console.log('[Storage] Filesystem native siap');
      } catch (err) {
        isNative = false;
        setStatus('🟡 Mode browser — pakai localStorage');
        console.warn('[Storage] Filesystem gagal, fallback localStorage', err);
      }
    } else {
      isNative = false;
      setStatus('🟡 Mode browser — pakai localStorage');
    }
  }

  function setStatus(msg) {
    const el = document.getElementById('db-status');
    if (el) el.textContent = msg;
  }

  // ── Baca semua transaksi ─────────────────────────────────────────────────

  async function load() {
    if (isNative) {
      try {
        const result = await Filesystem.readFile({
          path: `${FOLDER}/${FILE_NAME}`,
          directory: Directory.App,
          encoding: 'utf8'
        });
        return JSON.parse(result.data) || [];
      } catch (e) {
        // File belum ada (pertama kali pakai)
        return [];
      }
    } else {
      return JSON.parse(localStorage.getItem('kas_rumah') || '[]');
    }
  }

  // ── Tulis semua transaksi ke file ────────────────────────────────────────

  async function saveAll(txs) {
    const json = JSON.stringify(txs, null, 2);
    if (isNative) {
      await Filesystem.writeFile({
        path: `${FOLDER}/${FILE_NAME}`,
        directory: Directory.App,
        data: json,
        encoding: 'utf8',
        recursive: true
      });
    } else {
      localStorage.setItem('kas_rumah', json);
    }
  }

  // ── Helpers CRUD (semua load dulu, ubah, simpan ulang) ───────────────────

  async function insert(tx) {
    const txs = await load();
    const newTx = { ...tx, id: Date.now() };
    txs.push(newTx);
    await saveAll(txs);
    return newTx;
  }

  async function remove(id) {
    const txs = await load();
    await saveAll(txs.filter(t => t.id !== id));
  }

  async function replaceAll(newTxs) {
    await saveAll(newTxs);
  }

  // Kembalikan path file untuk ditampilkan ke user
  function filePath() {
    return isNative
      ? 'App/KasRumah/transaksi.json'
      : 'localStorage (browser)';
  }

  return { init, load, insert, remove, replaceAll, filePath, isNative: () => isNative };
})();
