const CATS_INC = ['Gaji','Usaha','Bonus','Transfer Masuk','Lainnya'];
const CATS_EXP = ['Makanan','Transportasi','Listrik','Pajak','Kesehatan','Pendidikan','Belanja','Hiburan','Cicilan','Lainnya'];
const EMOJIS = {
  'Gaji':'💼','Usaha':'🏪','Bonus':'🎁','Transfer Masuk':'📥',
  'Makanan':'🍽️','Transportasi':'🚗','Listrik':'💡','Pajak':'🏠',
  'Kesehatan':'❤️','Pendidikan':'📚','Belanja':'🛒','Hiburan':'🎬',
  'Cicilan':'💳','Lainnya':'📌'
};
const BAR_COLORS = ['#34d399','#60a5fa','#a78bfa','#f59e0b','#f87171','#fb7185','#4ade80','#38bdf8','#c084fc','#94a3b8'];

let allTxs = [];
let currentType = 'inc';

// ── Format ────────────────────────────────────────────────────────────────

function fmt(n) {
  return 'Rp ' + Math.abs(Math.round(n)).toLocaleString('id-ID');
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Filter bulan ──────────────────────────────────────────────────────────

function filtered() {
  const v = document.getElementById('filter-month').value;
  return v === 'semua' ? allTxs : allTxs.filter(t => t.date.slice(0,7) === v);
}

function updateMonthOptions() {
  const months = [...new Set(allTxs.map(t => t.date.slice(0,7)))].sort().reverse();
  const el  = document.getElementById('filter-month');
  const cur = el.value;
  el.innerHTML = '<option value="semua">Semua bulan</option>' +
    months.map(m => {
      const [y, mo] = m.split('-');
      const label = new Date(y, mo-1).toLocaleDateString('id-ID', { month:'long', year:'numeric' });
      return `<option value="${m}">${label}</option>`;
    }).join('');
  if (months.includes(cur)) el.value = cur;
}

// ── Render ────────────────────────────────────────────────────────────────

function render() {
  const list = filtered();
  const inc  = list.filter(t => t.type==='inc').reduce((s,t) => s+t.amount, 0);
  const exp  = list.filter(t => t.type==='exp').reduce((s,t) => s+t.amount, 0);
  const sav  = inc - exp;

  document.getElementById('total-inc').textContent = fmt(inc);
  document.getElementById('total-exp').textContent = fmt(exp);
  const savEl = document.getElementById('header-saldo');
  savEl.textContent = (sav < 0 ? '-' : '') + fmt(sav);
  savEl.style.color = sav >= 0 ? 'var(--sav)' : 'var(--exp)';

  // Bar chart
  const catMap = {};
  list.filter(t => t.type==='exp').forEach(t => { catMap[t.cat] = (catMap[t.cat]||0) + t.amount; });
  const bars = document.getElementById('cat-bars');
  if (!Object.keys(catMap).length) {
    bars.innerHTML = '<div class="empty-state"><span>📊</span>Belum ada pengeluaran</div>';
  } else {
    const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]);
    const max = sorted[0][1];
    bars.innerHTML = sorted.map(([cat,amt],i) => `
      <div class="bar-item">
        <div class="bar-meta"><span class="bar-cat">${cat}</span><span class="bar-amt">${fmt(amt)}</span></div>
        <div class="bar-bg"><div class="bar-fill" style="width:${Math.round(amt/max*100)}%;background:${BAR_COLORS[i%BAR_COLORS.length]}"></div></div>
      </div>`).join('');
  }

  // Riwayat
  const sorted2 = [...list].sort((a,b) => b.date.localeCompare(a.date));
  const txList  = document.getElementById('tx-list');
  if (!sorted2.length) {
    txList.innerHTML = '<div class="empty-state"><span>📋</span>Belum ada transaksi</div>';
    return;
  }
  const groups = {};
  sorted2.forEach(t => { if (!groups[t.date]) groups[t.date]=[]; groups[t.date].push(t); });

  txList.innerHTML = Object.entries(groups)
    .sort((a,b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => `
      <div class="tx-group-label">${fmtDate(date)}</div>
      ${items.map(t => {
        const emoji = EMOJIS[t.cat] || (t.type==='inc' ? '💰' : '📌');
        return `<div class="tx-item">
          <div class="tx-badge ${t.type}">${emoji}</div>
          <div class="tx-info">
            <div class="tx-name">${t.desc || t.cat}</div>
            <div class="tx-sub">${t.cat}</div>
          </div>
          <div class="tx-right">
            <div class="tx-amt ${t.type}">${t.type==='inc'?'+':'-'}${fmt(t.amount)}</div>
          </div>
          <button class="btn-del" onclick="delTx(${t.id})">✕</button>
        </div>`;
      }).join('')}`
    ).join('');
}

// ── Aksi form ─────────────────────────────────────────────────────────────

async function addTx() {
  const desc   = document.getElementById('f-desc').value.trim();
  const amount = parseFloat(document.getElementById('f-amount').value);
  const date   = document.getElementById('f-date').value;
  const cat    = document.getElementById('f-cat').value;

  if (!amount || amount <= 0) { alert('Isi jumlah transaksi dulu ya!'); return; }
  if (!date) { alert('Pilih tanggal dulu ya!'); return; }

  const btn = document.querySelector('.btn-simpan');
  btn.textContent = 'Menyimpan...';
  btn.disabled = true;

  try {
    const newTx = await Storage.insert({ type: currentType, desc, amount, date, cat });
    allTxs.push(newTx);
    document.getElementById('f-desc').value  = '';
    document.getElementById('f-amount').value = '';
    updateMonthOptions();
    render();
    showToast('Tersimpan ke transaksi.json ✅');
    switchTab('riwayat', null);
  } catch (err) {
    alert('Gagal menyimpan: ' + err.message);
  } finally {
    btn.textContent = 'Simpan Transaksi';
    btn.disabled = false;
  }
}

async function delTx(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  await Storage.remove(id);
  allTxs = allTxs.filter(t => t.id !== id);
  updateMonthOptions();
  render();
}

function setType(type) {
  currentType = type;
  document.getElementById('btn-inc').classList.toggle('active', type==='inc');
  document.getElementById('btn-exp').classList.toggle('active', type==='exp');
  updateCatSelect();
}

function updateCatSelect() {
  const cats = currentType==='inc' ? CATS_INC : CATS_EXP;
  document.getElementById('f-cat').innerHTML = cats.map(c => `<option>${c}</option>`).join('');
}

function switchTab(name, el) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  if (el) el.classList.add('active');
  else document.querySelectorAll('.tab-btn')[['ringkasan','tambah','riwayat','backup'].indexOf(name)].classList.add('active');
}

// ── Backup / Import ───────────────────────────────────────────────────────

// function exportData() {
//   const json = JSON.stringify({ version:1, exported: new Date().toISOString(), data: allTxs }, null, 2);
//   const blob = new Blob([json], { type: 'application/json' });
//   const url  = URL.createObjectURL(blob);
//   const a    = document.createElement('a');
//   a.href     = url;
//   a.download = `kas-rumah-backup-${new Date().toISOString().slice(0,10)}.json`;
//   a.click();
//   URL.revokeObjectURL(url);
//   showToast('Backup diunduh! 💾');
// }
async function exportData(){

try{

const file =
`kas-rumah-backup-${
new Date()
.toLocaleString('sv-SE')
.replace(/[\s:]/g,'-')
}.json`;

await Capacitor.Plugins.Filesystem.writeFile({

path:
`App/DB_backup/${file}`,

data:
JSON.stringify(
{
version:1,
exported:new Date().toISOString(),
data:allTxs
},
null,
2
),

directory:
Capacitor.Plugins.FilesystemDirectory.Documents,

recursive:true,

encoding:'utf8'

});

showToast(
'Backup tersimpan 💾'
);

}
catch(err){

console.error(err);

showToast(
'Backup gagal ❌'
);

}

}

function importData() {
  document.getElementById('import-input').click();
}

// async function handleImport(e) {
//   const file = e.target.files[0];
//   if (!file) return;
//   const reader = new FileReader();
//   reader.onload = async ev => {
//     try {
//       const parsed   = JSON.parse(ev.target.result);
//       const imported = parsed.data || parsed;
//       if (!Array.isArray(imported)) throw new Error('Format tidak valid');
//       if (!confirm(`Import ${imported.length} transaksi?\nData lama akan diganti.`)) return;
//       await Storage.replaceAll(imported);
//       allTxs = await Storage.load();
//       updateMonthOptions();
//       render();
//       showToast(`${imported.length} transaksi diimport! ✅`);
//     } catch (err) {
//       alert('File tidak valid: ' + err.message);
//     }
//   };
//   reader.readAsText(file);
//   e.target.value = '';
// }
async function handleImport(){

try{

const result =
await Capacitor.Plugins.FilePicker.pickFiles({
types:['application/json']
});

if(
!result.files ||
!result.files.length
){
return;
}

const file =
result.files[0];

const read =
await Capacitor.Plugins.Filesystem.readFile({

path:
file.path

});

const parsed =
JSON.parse(
read.data
);

const imported =
parsed.data ||
parsed;

if(
!imported
){
throw 'invalid';
}
if(
!confirm(
'Import data? Data sekarang akan diganti.'
)
){
return;
}

allTxs =
imported;

saveData();

renderAll();

showToast(
'Import berhasil ✅'
);

}
catch(err){

console.error(
err
);

showToast(
'Import dibatalkan'
);
}
}

// ── Toast ─────────────────────────────────────────────────────────────────

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Init ──────────────────────────────────────────────────────────────────

async function init() {
  document.getElementById('f-date').value = new Date().toISOString().slice(0, 10);
  updateCatSelect();

  await Storage.init();
  allTxs = await Storage.load();

  // Tampilkan path file
  const pathEl = document.getElementById('file-path');
  if (pathEl) pathEl.textContent = Storage.filePath();

  updateMonthOptions();
  render();

  // Sembunyikan loading
  const loading = document.getElementById('loading');
  loading.style.opacity = '0';
  setTimeout(() => loading.style.display = 'none', 400);
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.Capacitor) {
    setTimeout(init, 300); // beri waktu Capacitor siap
  } else {
    init();
  }
});
