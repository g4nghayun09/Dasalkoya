const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dasalkoya',
    waitForConnections: true,
    charset: 'utf8mb4'
});

app.get('/api/items', async (req, res) => {
    const [rows] = await pool.query(
        "SELECT * FROM purchase_item WHERE status = '고민중' ORDER BY created_at DESC"
    );
    res.json(rows);
});

app.post('/api/items', async (req, res) => {
    const { item_name, price, reason, image_url } = req.body;
    await pool.query(
        'INSERT INTO purchase_item (item_name, price, reason, image_url) VALUES (?, ?, ?, ?)',
        [item_name, price, reason, image_url || null]
    );
    res.json({ success: true });
});

app.delete('/api/items/:id', async (req, res) => {
    await pool.query("UPDATE purchase_item SET status = '삭제됨' WHERE item_id = ?", [req.params.id]);
    res.json({ success: true });
});

app.post('/api/items/:id/confirm', async (req, res) => {
    const [item] = await pool.query('SELECT * FROM purchase_item WHERE item_id = ?', [req.params.id]);
    if (item.length === 0) return res.status(404).json({ error: 'not found' });

    await pool.query("UPDATE purchase_item SET status = '구매완료' WHERE item_id = ?", [req.params.id]);

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await pool.query(
        `INSERT INTO monthly_spending (year_month, total_amount)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE total_amount = total_amount + ?`,
        [yearMonth, item[0].price, item[0].price]
    );

    res.json({ success: true });
});

app.get('/api/spending', async (req, res) => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [rows] = await pool.query('SELECT total_amount FROM monthly_spending WHERE year_month = ?', [yearMonth]);
    res.json({ total: rows.length > 0 ? rows[0].total_amount : 0 });
});

app.listen(3000, () => {
    console.log('✅ 다살꼬야 서버 실행 중! http://localhost:3000');
});
