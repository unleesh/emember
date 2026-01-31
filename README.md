# 📇 emember - 명함 스캔 및 이메일 자동화

AI 기반 명함 스캔, 자동 저장, 개인화된 이메일 발송 통합 솔루션

## ✨ 기능

### Phase 1: 명함 스캔 및 저장 ✅
- 📸 **명함 스캔**: 카메라로 촬영
- 🤖 **AI 인식**: Google Cloud Vision API
- ✏️ **정보 수정**: 인식 정보 확인 및 편집
- 💬 **음성 입력**: 개인화 메시지 (음성/키보드)
- 📊 **자동 저장**: Google Sheets
- ⚙️ **Setup Wizard**: 5분 내 설정 완료

### Phase 2: 이메일 자동화 ✅
- 📧 **Gmail 연동**: OAuth 2.0 인증
- 🤖 **AI 개인화**: Groq/Gemini로 이메일 자동 작성
- 📨 **자동 발송**: 개인화된 이메일 일괄 발송
- 📊 **Sheets 연동**: 명함 데이터 자동 활용
- ⚙️ **Email Setup Wizard**: 간편 설정

### Phase 3: 결제 연동 📌
*Pin it to the wall! - 다음 단계*
- 💳 Stripe 결제
- 📊 구독 관리
- 💰 Tier 1: $9/월 (Phase 1)
- 💰 Tier 2: $18/월 (Phase 1 + 2)

## 🚀 빠른 시작

### 1. 설치
```bash
npm install
```

### 2. Phase 1 설정 (필수)
```bash
npm run dev
# http://localhost:3000/setup 접속
```
- Google Cloud 프로젝트 생성
- Vision API, Sheets API 활성화
- Service Account 생성
- Google Sheets 공유

### 3. Phase 2 설정 (선택)
```bash
# http://localhost:3000/email-setup 접속
```
- Gmail OAuth 설정
- Groq/Gemini API 키 발급
- 이메일 템플릿 설정

### 4. Vercel 배포
```bash
vercel --prod
```

## 📋 환경 변수

### Phase 1 (필수)
```env
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SPREADSHEET_ID=
```

### Phase 2 (선택)
```env
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=
GMAIL_FROM_EMAIL=
GMAIL_REFRESH_TOKEN=
AI_PROVIDER=groq
GROQ_API_KEY=
```

자세한 내용은 `.env.example` 참고

## 📱 사용 방법

### 명함 스캔
1. 홈 → "스캔 시작하기"
2. 명함 촬영
3. 정보 확인 및 수정
4. 개인화 메시지 입력 (음성/키보드)
5. Google Sheets 저장

### 이메일 발송 (Phase 2)
1. Google Sheets에서 수신자 확인
2. 이메일 발송 페이지 접속
3. AI가 자동으로 개인화된 이메일 작성
4. 일괄 발송 또는 개별 발송

## 🏗️ 프로젝트 구조

```
emember/
├── app/
│   ├── api/
│   │   ├── sheets/          # Phase 1: Sheets 저장
│   │   ├── vision/          # Phase 1: OCR
│   │   ├── auth/            # Phase 2: Gmail OAuth
│   │   └── email/           # Phase 2: 이메일 발송
│   ├── setup/               # Phase 1 설정
│   ├── email-setup/         # Phase 2 설정
│   └── page.tsx
├── components/
│   ├── SetupWizard.tsx         # Phase 1 설정 마법사
│   ├── EmailSetupWizard.tsx    # Phase 2 설정 마법사
│   ├── CameraCapture.tsx
│   ├── OCRProcessor.tsx
│   ├── DataEditor.tsx          # 음성 입력 포함
│   └── GoogleSheetsService.tsx
└── ...
```

## 🔧 개발

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm start        # 프로덕션 실행
```

## 📊 Google Sheets 스키마

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| 날짜 | 이름 | 회사 | 직책 | 이메일 | 전화 | 주소 | 웹사이트 | 메시지 |

## 🤖 AI Provider 선택

### Groq (권장)
- ⚡ 초고속 추론
- 🆓 무료 할당량
- 📝 Mixtral-8x7b 모델

### Gemini
- ✨ Google AI
- 🆓 무료 할당량
- 📝 Gemini-Pro 모델

## 🐛 문제 해결

### Phase 1
- **"GOOGLE_PRIVATE_KEY not configured"**
  → Vercel 환경 변수 확인, 따옴표 포함 복사

- **"Spreadsheet not found"**
  → Service Account와 스프레드시트 공유 확인

### Phase 2
- **"OAuth 인증 실패"**
  → Redirect URI 확인, Test users 추가 확인

- **"AI API 오류"**
  → API 키 확인, 할당량 확인

## 💡 팁

- Phase 1만으로도 충분히 유용합니다
- Phase 2는 필요할 때 추가하세요
- Groq가 Gemini보다 빠릅니다
- 음성 입력은 Chrome/Safari 권장

## 📝 라이선스

MIT License

---

Made with ❤️ for better networking
