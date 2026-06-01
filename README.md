# 🛍️ 다살꼬야?

> "이거 really 필요한거야?"

현명한 소비를 도와주는 웹 서비스입니다.  
충동구매를 막고, 진짜 필요한 물건만 구매하도록 도와줍니다.

## 기능

- 구매할 물건 등록 (이름, 가격, 이미지, 이유)
- 등록 전 경고창으로 한 번 더 생각하게 함
- 물건을 하나씩 삭제하며 진짜 필요한 물건만 남김
- 마지막 1개까지 삭제 후 구매 확정
- 이번 달 사용 금액 자동 집계

## 기술 스택

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **Database:** MySQL

## 실행 방법

```bash
# 1. MySQL에서 DB 생성
mysql -u root < schema.sql

# 2. 서버 실행
npm install
npm start

# 3. 브라우저 접속
http://localhost:3000
```

## DB 테이블

- `purchase_item` — 구매 고민 물건들 (status: 고민중/삭제됨/구매완료)
- `monthly_spending` — 월별 지출 통계
