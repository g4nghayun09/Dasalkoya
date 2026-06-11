/* ════════════════════════════════════════
   다살꼬야? — main.js
════════════════════════════════════════ */

let items = [];
let detailTargetId = null;
let selectedImageBase64 = null;

/* ── 유틸 ── */
function fmt(n) { return Number(n).toLocaleString(); }
function fmtDate(s) {
  const d = s ? new Date(s) : new Date();
  return `${String(d.getFullYear()).slice(2)}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

/* ── API ── */
async function loadItems() {
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error();
    items = await res.json();
  } catch { items = []; }
  renderMain();
}

async function loadSpending() {
  try {
    const res = await fetch('/api/spending');
    const data = await res.json();
    document.getElementById('monthlySpending').textContent = fmt(data.total ?? 0);
  } catch { /* 무시 */ }
}

async function apiAdd(payload) {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('추가 실패');
}

async function apiDelete(id) {
  const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('삭제 실패');
}

async function apiPurchase(id) {
  const res = await fetch(`/api/items/${id}/purchase`, { method: 'POST' });
  if (!res.ok) throw new Error('구매 확정 실패');
}

/* ══════════════════════════════
   메인 화면 렌더링
══════════════════════════════ */
function renderMain() {
  const list = document.getElementById('itemList');
  if (!items.length) {
    list.innerHTML = '<div class="items-empty">아직 추가된 물건이 없어요 🙂</div>';
    return;
  }
  list.innerHTML = items.map(item => `
    <div class="item-row">
      <span class="item-row-name">${item.item_name}</span>
      <span class="item-row-date">${fmtDate(item.created_at)}</span>
      <span class="item-row-price">${fmt(item.price)}원</span>
      <button class="detail-btn" onclick="openDetail(${item.item_id})">+</button>
    </div>
  `).join('');
}

/* ══════════════════════════════
   모달: 아이템 추가
══════════════════════════════ */
document.getElementById('openAddModal').addEventListener('click', () => {
  document.getElementById('addModal').style.display = 'flex';
  document.getElementById('inputName').focus();
});

document.getElementById('closeAddModal').addEventListener('click', closeAddModal);
document.getElementById('addModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeAddModal();
});

// 이미지 파일 선택 → Base64 변환 + 미리보기
document.getElementById('inputImage').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 5MB 제한
  if (file.size > 5 * 1024 * 1024) {
    showToast('이미지는 5MB 이하만 가능해요!');
    e.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    selectedImageBase64 = ev.target.result; // data:image/...;base64,...
    document.getElementById('imgPreviewImg').src = selectedImageBase64;
    document.getElementById('imgPreview').style.display = 'block';
    document.getElementById('uploadLabelText').textContent = '✅ ' + file.name;
  };
  reader.readAsDataURL(file);
});

// 이미지 제거 버튼
document.getElementById('removeImage').addEventListener('click', () => {
  selectedImageBase64 = null;
  document.getElementById('inputImage').value = '';
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('uploadLabelText').textContent = '📷 사진 선택 (선택)';
});

function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
  ['inputName','inputPrice','inputReason'].forEach(id => document.getElementById(id).value = '');
  selectedImageBase64 = null;
  document.getElementById('inputImage').value = '';
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('uploadLabelText').textContent = '📷 사진 선택 (선택)';
}

document.getElementById('submitAddItem').addEventListener('click', async () => {
  const name   = document.getElementById('inputName').value.trim();
  const price  = document.getElementById('inputPrice').value.trim();
  const reason = document.getElementById('inputReason').value.trim();

  if (!name || !price || !reason) {
    showToast('이름, 가격, 구매 이유는 필수예요!');
    return;
  }

  try {
    await apiAdd({ item_name: name, price: parseInt(price), image_url: selectedImageBase64 || null, reason });
    closeAddModal();
    await loadItems();
    await loadSpending();
    showToast('✅ 후보에 추가됐어요!');
  } catch {
    showToast('❌ 추가 실패. 서버를 확인해주세요.');
  }
});

/* ══════════════════════════════
   모달: 상세보기
══════════════════════════════ */
function openDetail(id) {
  const item = items.find(i => i.item_id === id);
  if (!item) return;
  detailTargetId = id;

  document.getElementById('detailName').textContent  = item.item_name;
  document.getElementById('detailPrice').textContent = fmt(item.price) + '원';
  document.getElementById('detailReason').textContent = item.reason || '(이유 없음)';
  document.getElementById('detailImgWrap').innerHTML = item.image_url
    ? `<img src="${item.image_url}" alt="상품 이미지" style="max-width:130px;max-height:130px;border-radius:10px;object-fit:contain;display:block;margin:0 auto;">`
    : `<div class="detail-no-img">📦</div>`;

  document.getElementById('detailModal').style.display = 'flex';
}

document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
document.getElementById('detailModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeDetailModal();
});

function closeDetailModal() {
  document.getElementById('detailModal').style.display = 'none';
  detailTargetId = null;
}

document.getElementById('detailDeleteBtn').addEventListener('click', async () => {
  if (detailTargetId === null) return;
  const item = items.find(i => i.item_id === detailTargetId);
  if (!confirm(`"${item.item_name}"을(를) 탈락시킬까요?`)) return;
  try {
    await apiDelete(detailTargetId);
    closeDetailModal();
    await loadItems();
    showToast('🗑️ 탈락!');
  } catch { showToast('❌ 삭제 실패. 서버를 확인해주세요.'); }
});

/* ══════════════════════════════
   구매하기 → 토너먼트 시작
══════════════════════════════ */
document.getElementById('openTournamentBtn').addEventListener('click', () => {
  if (!items.length) { showToast('먼저 물건을 추가해주세요!'); return; }
  renderTournament();
  showPage('page-tournament');
});

/* ══════════════════════════════
   토너먼트 렌더링
══════════════════════════════ */
function renderTournament() {
  const grid      = document.getElementById('tournamentGrid');
  const wrap      = document.getElementById('tournamentWrap');
  const finalWrap = document.getElementById('finalWrap');

  if (items.length === 1) {
    wrap.style.display = 'none';
    finalWrap.style.display = 'block';
    renderFinal(items[0]);
    return;
  }

  wrap.style.display = 'block';
  finalWrap.style.display = 'none';
  grid.className = 'tournament-grid' + (items.length === 1 ? ' cols-1' : '');

  grid.innerHTML = items.map((item, i) => `
    <div class="t-card" style="animation-delay:${i * 0.06}s">
      <button class="t-card-del" onclick="tDelete(${item.item_id}, event)">✕</button>
      <div class="t-card-name">${item.item_name}</div>
      <div class="t-card-price">${fmt(item.price)}원</div>
      <div class="t-card-reason">${item.reason || ''}</div>
      ${item.image_url ? `<img class="t-card-img" src="${item.image_url}" alt="">` : ''}
    </div>
  `).join('');
}

async function tDelete(id, e) {
  e.stopPropagation();
  if (items.length === 1) { showToast('마지막 하나는 구매 확정만 가능해요!'); return; }
  const item = items.find(i => i.item_id === id);
  if (!confirm(`"${item.item_name}" 탈락시킬까요?`)) return;
  try {
    await apiDelete(id);
    await loadItems();       // items 배열 갱신
    renderTournament();
    showToast('🗑️ 탈락!');
  } catch { showToast('❌ 삭제 실패.'); }
}

/* ── 최종 카드 ── */
function renderFinal(item) {
  const spending = document.getElementById('monthlySpending').textContent;
  document.getElementById('finalCard').innerHTML = `
    <div class="final-name">${item.item_name}</div>
    <div class="final-price">${fmt(item.price)}원</div>
    <div class="final-reason">${item.reason || ''}</div>
    ${item.image_url
      ? `<img class="final-img" src="${item.image_url}" alt="">`
      : `<div class="final-placeholder">📦</div>`}
    <div class="final-total">총 사용금액 : ${spending}원</div>
  `;
}

/* ── 구매 확정 ── */
document.getElementById('confirmPurchaseBtn').addEventListener('click', async () => {
  if (items.length !== 1) { showPage('page-main'); return; }

  const last = items[0];
  if (!confirm(`"${last.item_name}" 구매를 최종 확정할까요?\n이번 달 사용 금액에 반영됩니다.`)) return;

  try {
    await apiPurchase(last.item_id);
    await loadSpending();
    items = [];
    renderMain();
    showToast('🎉 구매 확정 완료! 잘 고민하셨어요 😊');
    setTimeout(() => showPage('page-main'), 500);
  } catch {
    showToast('❌ 구매 확정 실패. 서버를 확인해주세요.');
  }
});

/* ══════════════════════════════
   초기 로드
══════════════════════════════ */
(async () => {
  await Promise.all([loadItems(), loadSpending()]);
})();

/* ══════════════════════════════
   마이페이지
══════════════════════════════ */
document.getElementById('openProfileBtn').addEventListener('click', async () => {
  await loadProfile();
  showPage('page-profile');
});

document.getElementById('profileBackBtn').addEventListener('click',  () => showPage('page-main'));
document.getElementById('profileBackBtn2').addEventListener('click', () => showPage('page-main'));

async function loadProfile() {
  // 이번 달 사용 금액
  try {
    const res = await fetch('/api/spending');
    const data = await res.json();
    document.getElementById('profileSpending').textContent = fmt(data.total ?? 0);
  } catch {}

  // 구매 완료 내역
  try {
    const res = await fetch('/api/history');
    const history = await res.json();
    renderHistory(history);
  } catch { renderHistory([]); }

  // 월별 그래프
  try {
    const res = await fetch('/api/spending/monthly');
    const data = await res.json();
    renderChart(data);
  } catch { renderChart([]); }
}

function renderHistory(history) {
  const el = document.getElementById('historyList');
  if (!history.length) {
    el.innerHTML = '<div class="profile-empty">아직 구매 내역이 없어요 🙂</div>';
    return;
  }

  // 월별 그룹핑
  const groups = {};
  history.forEach(item => {
    const d = new Date(item.created_at);
    const key = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  el.innerHTML = Object.entries(groups).map(([month, items]) => {
    const monthTotal = items.reduce((sum, i) => sum + Number(i.price), 0);
    const rows = items.map(item => `
      <div class="history-row">
        <div class="history-thumb">
          ${item.image_url ? `<img src="${item.image_url}" alt="">` : '📦'}
        </div>
        <div class="history-info">
          <div class="history-name">${item.item_name}</div>
          <div class="history-date">${fmtDate(item.created_at)}</div>
        </div>
        <div class="history-price">${fmt(item.price)}원</div>
      </div>
    `).join('');

    return `
      <div class="history-month-group">
        <div class="history-month-header">
          <span class="history-month-label">${month}</span>
          <span class="history-month-total">${fmt(monthTotal)}원</span>
        </div>
        ${rows}
      </div>
    `;
  }).join('');
}

function renderChart(monthlyData) {
  const canvas = document.getElementById('spendingChart');
  const empty  = document.getElementById('chartEmpty');

  if (!monthlyData.length) {
    canvas.style.display = 'none';
    empty.style.display  = 'block';
    return;
  }
  canvas.style.display = 'block';
  empty.style.display  = 'none';

  const ctx = canvas.getContext('2d');
  const W = canvas.width  = canvas.offsetWidth || 340;
  const H = canvas.height = 130;
  ctx.clearRect(0, 0, W, H);

  const labels  = monthlyData.map(d => d.ym.slice(5));   // "06"
  const amounts = monthlyData.map(d => Number(d.total_amount));
  const maxAmt  = Math.max(...amounts, 1);

  const padL = 14, padR = 14, padT = 16, padB = 28;
  const gW = W - padL - padR;
  const gH = H - padT - padB;
  const step = monthlyData.length > 1 ? gW / (monthlyData.length - 1) : gW;

  const px = (i) => padL + i * step;
  const py = (v) => padT + gH - (v / maxAmt) * gH;

  // 그라데이션 영역
  const grad = ctx.createLinearGradient(0, padT, 0, padT + gH);
  grad.addColorStop(0, 'rgba(90,138,106,0.35)');
  grad.addColorStop(1, 'rgba(90,138,106,0.02)');

  ctx.beginPath();
  ctx.moveTo(px(0), py(amounts[0]));
  amounts.forEach((v, i) => { if (i > 0) ctx.lineTo(px(i), py(v)); });
  ctx.lineTo(px(amounts.length - 1), padT + gH);
  ctx.lineTo(px(0), padT + gH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // 선
  ctx.beginPath();
  ctx.moveTo(px(0), py(amounts[0]));
  amounts.forEach((v, i) => { if (i > 0) ctx.lineTo(px(i), py(v)); });
  ctx.strokeStyle = '#3d6b4f';
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 점 + 라벨
  amounts.forEach((v, i) => {
    ctx.beginPath();
    ctx.arc(px(i), py(v), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#3d6b4f';
    ctx.fill();

    ctx.fillStyle = '#5a7a62';
    ctx.font = '600 10px Noto Sans KR, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i] + '월', px(i), H - 8);
  });
}