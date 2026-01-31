# Vercel 배포 가이드

## 빠른 배포 (권장)

### 1. Vercel 계정 연결

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel
```

### 2. 환경 변수 설정

Setup Wizard를 사용했다면 복사한 환경 변수를 Vercel Dashboard에 추가:

1. https://vercel.com/dashboard 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 각 변수를 개별적으로 추가:
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY` (따옴표 포함!)
   - `GOOGLE_SPREADSHEET_ID`

### 3. 배포

```bash
vercel --prod
```

## 자동 배포

GitHub 연동 시 자동 배포됩니다:

1. GitHub에 레포지토리 생성
2. Vercel Dashboard에서 "Import Project"
3. GitHub 레포지토리 선택
4. 환경 변수 추가
5. Deploy 버튼 클릭

## 배포 후 확인사항

✅ 홈 페이지 접속 확인
✅ Setup 페이지 접속 확인 (`/setup`)
✅ 명함 스캔 기능 테스트
✅ Google Sheets 저장 확인

## 트러블슈팅

### Build 실패

```bash
# 로컬에서 빌드 테스트
npm run build
```

오류 메시지를 확인하고 수정 후 재배포

### 환경 변수 오류

1. Vercel Dashboard에서 환경 변수 재확인
2. `GOOGLE_PRIVATE_KEY`는 따옴표 포함 전체 복사
3. 모든 환경(Production, Preview)에 적용 확인
4. 재배포

### API 오류

Vercel Functions 로그 확인:
1. Vercel Dashboard → Deployments
2. 최신 배포 선택
3. Functions 탭에서 에러 로그 확인

## 도메인 연결

1. Vercel Dashboard → Settings → Domains
2. 커스텀 도메인 추가
3. DNS 설정 (Vercel이 자동 안내)
4. SSL 자동 적용

## 성능 최적화

- Vercel Edge Functions 사용 (자동)
- 이미지 최적화 (Next.js 자동)
- 정적 파일 CDN 배포 (자동)

---

배포 완료 후 사용자들과 공유하세요! 🎉
