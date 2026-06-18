-- DB 생성
CREATE DATABASE IF NOT EXISTS dasalkoya CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dasalkoya;

-- 소비 후보 및 구매 내역 테이블
CREATE TABLE IF NOT EXISTS purchase_item (
    item_id     INT           NOT NULL AUTO_INCREMENT,
    item_name   VARCHAR(100)  NOT NULL,
    price       INT           NOT NULL,
    reason      TEXT          NOT NULL,
    image_url   LONGTEXT      NULL,
    status      VARCHAR(20)   NOT NULL DEFAULT '고민중',
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id)
);

-- 월별 지출 통계 테이블
CREATE TABLE IF NOT EXISTS monthly_spending (
    spending_id  INT          NOT NULL AUTO_INCREMENT,
    ym           VARCHAR(7)   NOT NULL,
    total_amount INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (spending_id),
    UNIQUE KEY uq_ym (ym)
);

-- 이번 달 기본 데이터
INSERT INTO monthly_spending (ym, total_amount) VALUES ('2026-06', 0)
ON DUPLICATE KEY UPDATE total_amount = total_amount;