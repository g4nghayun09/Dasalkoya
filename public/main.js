/* ════════════════════════════════════════
   다살꼬야? — main.js
════════════════════════════════════════ */

let items = [];
let detailTargetId = null;
let selectedImageBase64 = null;
let editTargetId = null;       // null이면 추가 모드, 값이 있으면 수정 모드
let tournamentDeleted = [];    // 토너먼트 중 탈락시킨 아이템들 (뒤로가기 시 복구용)

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

async function apiUpdate(id, payload) {
  const res = await fetch(`/api/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('수정 실패');
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
   모달: 아이템 추가 / 수정 (같은 모달 재사용)
══════════════════════════════ */
document.getElementById('openAddModal').addEventListener('click', () => {
  editTargetId = null; // 추가 모드
  document.getElementById('addModalTitle').textContent = '물건 추가하기';
  document.getElementById('submitAddItem').textContent = '⚠️ 정말 필요해요!';
  document.getElementById('addModal').style.display = 'flex';
  document.getElementById('inputName').focus();
});

function openEditModal(id) {
  const item = items.find(i => i.item_id === id);
  if (!item) return;

  editTargetId = id; // 수정 모드
  document.getElementById('addModalTitle').textContent = '물건 수정하기';
  document.getElementById('submitAddItem').textContent = '✏️ 수정 완료';

  document.getElementById('inputName').value   = item.item_name;
  document.getElementById('inputPrice').value  = item.price;
  document.getElementById('inputReason').value = item.reason || '';

  // 기존 이미지 미리보기 (수정 안 하면 그대로 유지)
  if (item.image_url) {
    selectedImageBase64 = item.image_url;
    document.getElementById('imgPreviewImg').src = item.image_url;
    document.getElementById('imgPreview').style.display = 'block';
    document.getElementById('uploadLabelText').textContent = '✅ 기존 사진 사용 중';
  } else {
    selectedImageBase64 = null;
    document.getElementById('imgPreview').style.display = 'none';
    document.getElementById('uploadLabelText').textContent = '📷 사진 선택 (선택)';
  }

  // 상세 모달이 열려있었다면 닫고 추가/수정 모달 열기
  document.getElementById('detailModal').style.display = 'none';
  document.getElementById('addModal').style.display = 'flex';
}

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
  editTargetId = null;
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

  const isEdit = editTargetId !== null;

  try {
    if (isEdit) {
      await apiUpdate(editTargetId, {
        item_name: name,
        price: parseInt(price),
        image_url: selectedImageBase64,   // 그대로 유지되거나 새로 바뀐 값
        reason
      });
      showToast('✏️ 수정 완료!');
    } else {
      await apiAdd({ item_name: name, price: parseInt(price), image_url: selectedImageBase64 || null, reason });
      showToast('✅ 후보에 추가됐어요!');
    }
    closeAddModal();
    await loadItems();
    await loadSpending();

    // 토너먼트 화면에서 수정했다면 그 화면을 다시 그려준다
    if (document.getElementById('page-tournament').classList.contains('active')) {
      renderTournament();
    }
  } catch {
    showToast(isEdit ? '❌ 수정 실패. 서버를 확인해주세요.' : '❌ 추가 실패. 서버를 확인해주세요.');
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

document.getElementById('detailEditBtn').addEventListener('click', () => {
  if (detailTargetId === null) return;
  openEditModal(detailTargetId);
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
  tournamentDeleted = []; // 새로 시작할 때 기록 초기화
  renderTournament();
  showPage('page-tournament');
});

/* ── 토너먼트 뒤로가기: 탈락시킨 것들 전부 복구 ── */
document.getElementById('tournamentBackBtn').addEventListener('click', async () => {
  if (tournamentDeleted.length === 0) {
    // 탈락시킨 게 없으면 그냥 메인으로
    showPage('page-main');
    return;
  }

  if (!confirm('비교를 그만두고 메인으로 돌아갈까요?\n탈락시킨 물건들이 모두 복구됩니다.')) return;

  try {
    // 탈락시켰던 아이템들을 순서대로 다시 추가해서 복구
    for (const item of tournamentDeleted) {
      await apiAdd({
        item_name: item.item_name,
        price: item.price,
        reason: item.reason,
        image_url: item.image_url || null
      });
    }
    tournamentDeleted = [];
    await loadItems();
    showToast('↩️ 모두 복구됐어요!');
    showPage('page-main');
  } catch {
    showToast('❌ 복구 중 오류가 발생했어요.');
  }
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
      <button class="t-card-edit" onclick="tEdit(${item.item_id}, event)" title="수정">✏️</button>
      <button class="t-card-del" onclick="tDelete(${item.item_id}, event)">✕</button>
      <div class="t-card-name">${item.item_name}</div>
      <div class="t-card-price">${fmt(item.price)}원</div>
      <div class="t-card-reason">${item.reason || ''}</div>
      ${item.image_url ? `<img class="t-card-img" src="${item.image_url}" alt="">` : ''}
    </div>
  `).join('');
}

function tEdit(id, e) {
  e.stopPropagation();
  openEditModal(id);
}

async function tDelete(id, e) {
  e.stopPropagation();
  if (items.length === 1) { showToast('마지막 하나는 구매 확정만 가능해요!'); return; }
  const item = items.find(i => i.item_id === id);
  if (!confirm(`"${item.item_name}" 탈락시킬까요?`)) return;
  try {
    tournamentDeleted.push({ ...item }); // 복구용으로 정보 저장
    await apiDelete(id);
    await loadItems();       // items 배열 갱신
    renderTournament();
    showToast('🗑️ 탈락!');
  } catch {
    tournamentDeleted.pop(); // 실패 시 기록 롤백
    showToast('❌ 삭제 실패.');
  }
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
    tournamentDeleted = [];
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