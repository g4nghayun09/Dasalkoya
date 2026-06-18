const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'dasalkoya'
});

db.connect((err) => {
    if (err) {
        console.error('❌ MySQL 연결 실패!! 에러 내용:', err);
        return;
    }
    console.log('✅ Successfully Connected to MySQL Database! 🚀');
});

/* ──────────────────────────────────────
   유틸: 현재 연월 'YYYY-MM' 반환
────────────────────────────────────── */
function getCurrentYm() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
}

/* ──────────────────────────────────────
   API 라우트
────────────────────────────────────── */

// ① 이번 달 총 사용 금액 (GET) — 날짜 자동 계산
app.get('/api/spending', (req, res) => {
    const ym = getCurrentYm();
    const query = "SELECT total_amount FROM monthly_spending WHERE ym = ?";
    db.query(query, [ym], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        const total = results.length > 0 ? results[0].total_amount : 0;
        res.json({ total, ym });
    });
});

// ② 고민 중인 아이템 리스트 (GET)
app.get('/api/items', (req, res) => {
    const query = "SELECT * FROM purchase_item WHERE status = '고민중' ORDER BY created_at DESC";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ③ 아이템 추가 (POST)
app.post('/api/items', (req, res) => {
    const { item_name, price, reason, image_url } = req.body;

    if (!item_name || price === undefined || !reason) {
        return res.status(400).json({ error: '필수 항목(이름, 가격, 이유)을 입력해주세요.' });
    }

    const query = "INSERT INTO purchase_item (item_name, price, reason, image_url, status) VALUES (?, ?, ?, ?, '고민중')";
    db.query(query, [item_name, price, reason, image_url || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, insertId: result.insertId });
    });
});

// ③-1 아이템 수정 (PUT) — 고민중인 아이템만 수정 가능
app.put('/api/items/:id', (req, res) => {
    const itemId = req.params.id;
    const { item_name, price, reason, image_url } = req.body;

    if (!item_name || price === undefined || !reason) {
        return res.status(400).json({ error: '필수 항목(이름, 가격, 이유)을 입력해주세요.' });
    }

    // image_url이 undefined로 오면(=프론트에서 안 바꿈) 기존 값 유지
    const query = image_url === undefined
        ? "UPDATE purchase_item SET item_name = ?, price = ?, reason = ? WHERE item_id = ? AND status = '고민중'"
        : "UPDATE purchase_item SET item_name = ?, price = ?, reason = ?, image_url = ? WHERE item_id = ? AND status = '고민중'";

    const params = image_url === undefined
        ? [item_name, price, reason, itemId]
        : [item_name, price, reason, image_url, itemId];

    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '수정할 아이템을 찾을 수 없거나 이미 구매 확정된 아이템입니다.' });
        }
        res.json({ success: true, message: '수정 완료!' });
    });
});

// ④ 아이템 탈락/삭제 (DELETE)
app.delete('/api/items/:id', (req, res) => {
    const itemId = req.params.id;
    const query = "DELETE FROM purchase_item WHERE item_id = ?";
    db.query(query, [itemId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ⑤ 최종 구매 확정 (POST) — 날짜 자동 계산
app.post('/api/items/:id/purchase', (req, res) => {
    const itemId = req.params.id;
    const ym = getCurrentYm();

    db.query("SELECT price FROM purchase_item WHERE item_id = ?", [itemId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!results.length) return res.status(404).json({ error: '아이템을 찾을 수 없습니다.' });

        const price = results[0].price;

        db.query("UPDATE purchase_item SET status = '구매완료' WHERE item_id = ?", [itemId], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // 이번 달 데이터 없으면 새로 생성, 있으면 누적 (UPSERT)
            const upsertQuery = `
                INSERT INTO monthly_spending (ym, total_amount)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE total_amount = total_amount + VALUES(total_amount)
            `;
            db.query(upsertQuery, [ym, price], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, message: '구매 확정 완료! 💰' });
            });
        });
    });
});

// ⑥ 구매 완료 내역 (GET)
app.get('/api/history', (req, res) => {
    const query = "SELECT item_id, item_name, price, reason, image_url, status, created_at FROM purchase_item WHERE status = '구매완료' ORDER BY created_at DESC";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ⑦ 월별 지출 데이터 - 그래프용 (GET)
app.get('/api/spending/monthly', (req, res) => {
    const query = "SELECT ym, total_amount FROM monthly_spending ORDER BY ym ASC";
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Server running on http://localhost:${PORT}`);
});