CREATE DATABASE IF NOT EXISTS dasalkoya DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dasalkoya;

CREATE TABLE IF NOT EXISTS purchase_item (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(200) NOT NULL,
    price INT NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT '고민중',
    created_at DATE NOT NULL DEFAULT (CURRENT_DATE),
    image_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS monthly_spending (
    spending_id INT AUTO_INCREMENT PRIMARY KEY,
    year_month VARCHAR(7) NOT NULL UNIQUE,
    total_amount INT NOT NULL DEFAULT 0
);

INSERT INTO purchase_item (item_name, price, reason, image_url) VALUES
('LG 그램 노트북', 1000000, '게임을 해야한다.', NULL),
('아이폰 16', 1500000, '지금 폰이 너무 오래됐다.', NULL),
('나이키 운동화', 120000, '운동 시작해야지!', NULL);
