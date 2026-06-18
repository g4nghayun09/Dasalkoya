# 🛒 다살꼬야?
> "한 달 뒤에도 떠오를 물건만 사세요"

알리, 테무, 쿠팡에서 무분별하게 장바구니에 담는 과소비를 막기 위한 소비 습관 개선 웹 서비스입니다.  
사고 싶은 물건들을 등록하고, 하나씩 탈락시키며 **진짜 필요한 딱 1개**만 구매 확정합니다.

---

## 핵심 플로우

```
물건 등록 → 후보들 비교 → 하나씩 탈락 → 마지막 1개 구매 확정 → 월 지출에 누적
```

---

## 주요 기능

- **물건 등록** — 이름, 가격, 이미지(파일 업로드), 구매 이유 입력
- **⚠️ 경고 버튼** — 등록 전 "정말 필요해요?" 한 번 더 생각하게 유도
- **토너먼트 방식 탈락** — 구매하기 클릭 시 후보 카드들 비교, 하나씩 ✕ 로 탈락
- **구매 확정** — 마지막 1개 남으면 구매 확정 → 이번 달 지출 자동 누적
- **마이페이지** — 월별 지출 꺾은선 그래프 + 월별 구매 내역 조회

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | HTML, CSS, Vanilla JS (SPA) |
| Backend | Node.js + Express |
| Database | MySQL + mysql2 |
| 기타 | dotenv, Base64 이미지 저장 |

---

## 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/g4nghayun09/Dasalkoya.git
cd Dasalkoya

# 2. 패키지 설치
npm install

# 3. 환경변수 설정
# .env 파일 생성 후 아래 내용 입력
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dasalkoya

# 4. MySQL DB 및 테이블 생성
mysql -u root -p < schema.sql

# 5. 서버 실행
npm start

# 6. 브라우저 접속
http://localhost:3000
```

---

## DB 구조

**`purchase_item`** — 소비 후보 및 구매 내역
| 컬럼 | 타입 | 설명 |
|------|------|------|
| item_id | INT | PK, AUTO_INCREMENT |
| item_name | VARCHAR | 물건 이름 |
| price | INT | 가격 |
| reason | TEXT | 구매 이유 |
| image_url | LONGTEXT | 이미지 (Base64) |
| status | VARCHAR | 고민중 / 구매완료 |
| created_at | DATETIME | 등록 시각 |

**`monthly_spending`** — 월별 지출 통계
| 컬럼 | 타입 | 설명 |
|------|------|------|
| spending_id | INT | PK, AUTO_INCREMENT |
| ym | VARCHAR | 연월 (예: 2026-06) |
| total_amount | INT | 해당 월 총 지출 |

---

## 프로젝트 구조

```
Dasalkoya/
├── public/
│   ├── index.html     # SPA 메인 (메인/토너먼트/마이페이지)
│   ├── style.css      # 올리브 그린 테마 스타일
│   └── main.js        # 프론트엔드 로직 (fetch API)
├── server.js          # Express 서버 + API 라우트
├── schema.sql         # DB 테이블 생성 스크립트
├── package.json
└── .env               # 환경변수 (gitignore 처리)
```
