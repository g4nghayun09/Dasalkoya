let items = [];

async function loadItems() {
    const res = await fetch('/api/items');
    items = await res.json();
    render();
}

async function loadSpending() {
    const res = await fetch('/api/spending');
    const data = await res.json();
    document.getElementById('monthlySpending').textContent = data.total.toLocaleString() + '원';
}

function render() {
    const list = document.getElementById('itemList');
    const confirmSection = document.getElementById('confirmSection');

    if (items.length === 0) {
        list.innerHTML = '<div class="empty"><p>등록된 물건이 없습니다.</p></div>';
        confirmSection.style.display = 'none';
    } else {
        list.innerHTML = items.map(item => `
            <div class="item-card">
                <div class="item-image ${item.image_url ? '' : 'placeholder'}">
                    ${item.image_url ? `<img src="${item.image_url}" alt="item">` : '<span>📦</span>'}
                </div>
                <div class="item-info">
                    <h3>${item.item_name}</h3>
                    <p class="price">${Number(item.price).toLocaleString()}원</p>
                    <p class="reason">${item.reason}</p>
                </div>
                <button class="delete-btn" onclick="deleteItem(${item.item_id})">✕</button>
            </div>
        `).join('');

        confirmSection.style.display = items.length === 1 ? 'block' : 'none';
    }
}

function showWarning() {
    const name = document.getElementById('itemName').value.trim();
    const price = document.getElementById('itemPrice').value.trim();
    const reason = document.getElementById('itemReason').value.trim();
    if (!name || !price || !reason) {
        alert('물건 이름, 가격, 이유는 필수 입력입니다!');
        return;
    }
    document.getElementById('warningModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('warningModal').style.display = 'none';
}

async function addItem() {
    closeModal();
    await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            item_name: document.getElementById('itemName').value,
            price: parseInt(document.getElementById('itemPrice').value),
            reason: document.getElementById('itemReason').value,
            image_url: document.getElementById('itemImage').value || null
        })
    });
    document.getElementById('itemForm').reset();
    await loadItems();
    await loadSpending();
}

async function deleteItem(id) {
    const item = items.find(i => i.item_id === id);
    if (items.length === 1) {
        if (!confirm('마지막 물건입니다! 삭제 후 구매확정을 하시겠습니까?')) return;
    } else {
        if (!confirm(`"${item.item_name}" - 이 물건이 정말 필요하지 않나요?`)) return;
    }
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    await loadItems();
}

async function confirmPurchase() {
    const last = items[0];
    if (confirm(`"${last.item_name}" 구매를 확정할까요?`)) {
        await fetch(`/api/items/${last.item_id}/confirm`, { method: 'POST' });
        await loadItems();
        await loadSpending();
        alert('🎉 구매 확정되었습니다! 이번 달 지출에 반영되었습니다.');
    }
}

loadItems();
loadSpending();
