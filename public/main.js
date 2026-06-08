/* ════════════════════════════════════════
   다살꼬야? — main.js
   페이지: 메인 ↔ 토너먼트 (SPA)
════════════════════════════════════════ */

let items = [];           // 고민 중인 아이템들
let detailTargetId = null; // 상세 모달에서 삭제할 아이템 ID

/* ── 날짜 포맷 헬퍼 ── */
function formatDate(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}/${mm}/${dd}`;
}

/* ══════════════════════════════
   페이지 전환
══════════════════════════════ */
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

/* ══════════════════════════════
   API 호출
══════════════════════════════ */
async function loadItems() {
    try {
        const res = await fetch('/api/items');
        if (!res.ok) throw new Error('아이템 로드 실패');
        items = await res.json();
    } catch (e) {
        console.error(e);
        items = [];
    }
    renderMain();
}

async function loadSpending() {
    try {
        const res = await fetch('/api/spending');
        const data = await res.json();
        const amount = data.total ?? data.amount ?? 0;
        document.getElementById('monthlySpending').textContent = Number(amount).toLocaleString();
    } catch (e) {
        console.error(e);
    }
}

async function apiAddItem(payload) {
    const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('추가 실패');
}

async function apiDeleteItem(id) {
    const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('삭제 실패');
}

async function apiConfirmPurchase(id) {
    // 서버 라우트: POST /api/items/:id/purchase  (또는 /confirm — 서버에 맞게 수정)
    const res = await fetch(`/api/items/${id}/purchase`, { method: 'POST' });
    if (!res.ok) throw new Error('구매 확정 실패');
}

/* ══════════════════════════════
   메인 화면 렌더링
══════════════════════════════ */
function renderMain() {
    const list = document.getElementById('itemList');

    if (!items.length) {
        list.innerHTML = '<div class="item-table-empty">아직 추가된 물건이 없어요 🙂</div>';
        return;
    }

    list.innerHTML = items.map(item => `
        <div class="item-row">
            <span class="item-row-name">${item.item_name}</span>
            <span class="item-row-date">${formatDate(item.created_at)}</span>
            <span class="item-row-price">${Number(item.price).toLocaleString()}원</span>
            <button class="item-row-detail" onclick="openDetail(${item.item_id})">+</button>
        </div>
    `).join('');
}

/* ══════════════════════════════
   모달: 아이템 추가
══════════════════════════════ */
document.getElementById('openAddModal').addEventListener('click', () => {
    document.getElementById('addModal').style.display = 'flex';
});

document.getElementById('closeAddModal').addEventListener('click', () => {
    document.getElementById('addModal').style.display = 'none';
    clearAddForm();
});

document.getElementById('submitAddItem').addEventListener('click', async () => {
    const name   = document.getElementById('inputName').value.trim();
    const price  = document.getElementById('inputPrice').value.trim();
    const image  = document.getElementById('inputImage').value.trim();
    const reason = document.getElementById('inputReason').value.trim();

    if (!name || !price || !reason) {
        alert('물건 이름, 가격, 구매 이유는 필수입니다!');
        return;
    }

    try {
        await apiAddItem({
            item_name: name,
            price: parseInt(price),
            image_url: image || null,
            reason
        });
        document.getElementById('addModal').style.display = 'none';
        clearAddForm();
        await loadItems();
        await loadSpending();
    } catch (e) {
        alert('추가 중 오류가 발생했습니다. 서버를 확인해주세요.');
        console.error(e);
    }
});

function clearAddForm() {
    ['inputName', 'inputPrice', 'inputImage', 'inputReason'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

/* ══════════════════════════════
   모달: 상세보기
══════════════════════════════ */
function openDetail(id) {
    const item = items.find(i => i.item_id === id);
    if (!item) return;
    detailTargetId = id;

    document.getElementById('detailName').textContent  = item.item_name;
    document.getElementById('detailPrice').textContent = Number(item.price).toLocaleString() + '원';
    document.getElementById('detailReason').textContent = item.reason || '(이유 없음)';

    const imgWrap = document.getElementById('detailImgWrap');
    imgWrap.innerHTML = item.image_url
        ? `<img src="${item.image_url}" alt="상품 이미지">`
        : `<div class="no-img">📦</div>`;

    document.getElementById('detailModal').style.display = 'flex';
}

document.getElementById('closeDetailModal').addEventListener('click', () => {
    document.getElementById('detailModal').style.display = 'none';
    detailTargetId = null;
});

document.getElementById('detailDeleteBtn').addEventListener('click', async () => {
    if (detailTargetId === null) return;
    const item = items.find(i => i.item_id === detailTargetId);
    if (!confirm(`"${item.item_name}"을(를) 탈락시킬까요?`)) return;

    try {
        await apiDeleteItem(detailTargetId);
        document.getElementById('detailModal').style.display = 'none';
        detailTargetId = null;
        await loadItems();
        await loadSpending();
    } catch (e) {
        alert('삭제 중 오류가 발생했습니다.');
        console.error(e);
    }
});

/* ══════════════════════════════
   구매하기 → 토너먼트 시작
══════════════════════════════ */
document.getElementById('openTournamentBtn').addEventListener('click', () => {
    if (items.length === 0) {
        alert('먼저 물건을 추가해주세요!');
        return;
    }
    renderTournament();
    showPage('page-tournament');
});

/* ══════════════════════════════
   토너먼트 화면 렌더링
══════════════════════════════ */
function renderTournament() {
    const grid = document.getElementById('tournamentGrid');
    const finalSection = document.getElementById('finalSection');

    // 최종 1개 남은 경우
    if (items.length === 1) {
        grid.style.display = 'none';
        document.querySelector('.tournament-hint').style.display = 'none';
        renderFinal(items[0]);
        finalSection.style.display = 'block';
        return;
    }

    finalSection.style.display = 'none';
    grid.style.display = 'grid';
    document.querySelector('.tournament-hint').style.display = 'block';

    // 2개일 때 단일 행 처리
    grid.className = 'tournament-grid' + (items.length <= 2 ? '' : '');

    grid.innerHTML = items.map(item => `
        <div class="t-card">
            <button class="t-card-delete" onclick="tournamentDelete(${item.item_id}, event)">✕</button>
            <div class="t-card-name">${item.item_name}</div>
            <div class="t-card-price">${Number(item.price).toLocaleString()}원</div>
            <div class="t-card-reason">${item.reason || ''}</div>
            ${item.image_url ? `<img class="t-card-img" src="${item.image_url}" alt="">` : ''}
        </div>
    `).join('');
}

async function tournamentDelete(id, e) {
    e.stopPropagation();
    const item = items.find(i => i.item_id === id);

    if (items.length === 1) {
        alert('마지막 하나는 구매 확정만 가능합니다!');
        return;
    }

    if (!confirm(`"${item.item_name}"을(를) 탈락시킬까요?`)) return;

    try {
        await apiDeleteItem(id);
        await loadItems();        // items 갱신
        renderTournament();       // 화면 갱신
    } catch (e) {
        alert('삭제 중 오류가 발생했습니다.');
        console.error(e);
    }
}

/* ── 최종 확정 카드 렌더링 ── */
function renderFinal(item) {
    const card = document.getElementById('finalCard');
    card.innerHTML = `
        <div class="final-card-name">${item.item_name}</div>
        <div class="final-card-price">${Number(item.price).toLocaleString()}원</div>
        <div class="final-card-reason">${item.reason || ''}</div>
        ${item.image_url
            ? `<img class="final-card-img" src="${item.image_url}" alt="">`
            : `<div class="final-card-placeholder">📦</div>`
        }
    `;
}

/* ── 구매 확정 버튼 ── */
document.getElementById('confirmPurchaseBtn').addEventListener('click', async () => {
    if (items.length !== 1) {
        // 아직 후보가 남은 상태에서 누르면 그냥 메인으로
        showPage('page-main');
        return;
    }

    const last = items[0];
    if (!confirm(`"${last.item_name}" 구매를 최종 확정할까요?\n이번 달 사용 금액에 반영됩니다.`)) return;

    try {
        await apiConfirmPurchase(last.item_id);
        await loadSpending();

        // 총 사용금액 표시
        const res = await fetch('/api/spending');
        const data = await res.json();
        document.getElementById('finalTotal').textContent = Number(data.total ?? data.amount ?? 0).toLocaleString();

        // items 리셋
        items = [];
        renderMain();

        // 잠시 후 메인으로
        setTimeout(() => {
            showPage('page-main');
        }, 2200);

        alert('🎉 구매 확정 완료! 잘 고민하셨어요 😊');
    } catch (e) {
        alert('구매 확정 중 오류가 발생했습니다.');
        console.error(e);
    }
});

/* ══════════════════════════════
   초기 로드
══════════════════════════════ */
(async () => {
    await loadItems();
    await loadSpending();
})();