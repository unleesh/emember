# 명함 스캐너 v6 - Fixed Edition

AI OCR 기반 명함 스캐너 PWA 애플리케이션

## 🔧 v6-fixed 주요 수정사항

### 1. Google API 초기화 문제 완전 해결 ✅
- **문제**: `window.gapi.auth2.getAuthInstance()` null 에러
- **해결**: 
  - auth2 초기화 완료 대기 로직 추가 (폴링 방식)
  - null 체크 후 안전한 접근
  - 환경변수 검증 추가

### 2. 카메라 검정화면 문제 해결 ✅
- 비디오 자동 재생 (`onloadedmetadata` + `play()`)
- 준비 상태 추적 및 UI 피드백
- 명시적 스타일 지정

### 3. 에러 핸들링 개선 ✅
- 환경변수 누락 시 명확한 안내
- Google API 초기화 실패 시 재시도 안내
- 각 단계별 상세한 에러 메시지

## 🚨 중요: 환경변수 설정 필수

이 앱을 실행하려면 Google API 키가 **반드시** 필요합니다.

### 1단계: Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** → **라이브러리**에서 "Google Sheets API" 활성화
4. **사용자 인증 정보** → **사용자 인증 정보 만들기**

#### OAuth 2.0 클라이언트 ID 만들기:
- 애플리케이션 유형: **웹 애플리케이션**
- 승인된 자바스크립트 원본: `http://localhost:3000`
- 승인된 리디렉션 URI: `http://localhost:3000`
- 생성 후 **클라이언트 ID** 복사

#### API 키 만들기:
- **사용자 인증 정보 만들기** → **API 키**
- 생성된 **API 키** 복사

### 2단계: .env.local 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 입력:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key-here
```

⚠️ **주의**: 
- 따옴표 없이 값만 입력
- `.env.local` 파일은 절대 Git에 커밋하지 말 것 (이미 .gitignore에 포함됨)

## ✨ 주요 기능

- 📷 **카메라 촬영**: 모바일 카메라로 명함 촬영
- 🤖 **AI OCR**: Tesseract.js로 한글/영어 자동 인식
- ✏️ **정보 수정**: 인식된 정보 확인 및 수정
- 📊 **Google Sheets 연동**: 자동으로 스프레드시트에 저장
- 📱 **PWA**: 앱처럼 설치 가능
- 🔒 **오프라인 지원**: Service Worker 캐싱

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정 (위 참조)

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

## 📋 Google Sheets 준비

1. Google Sheets에서 새 스프레드시트 생성
2. 첫 번째 행에 헤더 추가 (선택사항):
   ```
   날짜 | 이름 | 회사 | 직책 | 이메일 | 전화번호 | 주소 | 웹사이트
   ```
3. 스프레드시트 URL에서 ID 복사:
   ```
   https://docs.google.com/spreadsheets/d/[이 부분이 ID]/edit
   ```
4. 앱에서 해당 ID 입력

## 🎯 사용 방법

1. **카메라 시작** 버튼 클릭
2. 명함을 화면에 맞춰 **촬영**
3. AI가 자동으로 **텍스트 인식** (10-20초 소요)
4. 추출된 정보 **확인 및 수정**
5. **Google로 로그인**
6. **스프레드시트 ID** 입력
7. **저장** 완료!

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **OCR**: Tesseract.js (한국어 + 영어)
- **API**: Google Sheets API
- **PWA**: Service Worker, Web App Manifest

## 📂 프로젝트 구조

```
business-card-scanner-v6/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 메인 페이지
│   └── globals.css         # 글로벌 스타일
├── components/
│   ├── CameraCapture.tsx   # 카메라 촬영 (v6 수정)
│   ├── OCRProcessor.tsx    # OCR 처리
│   ├── DataEditor.tsx      # 데이터 편집
│   └── GoogleSheetsService.tsx  # Google Sheets (v6-fixed 수정)
├── public/
│   ├── manifest.json       # PWA 매니페스트
│   └── sw.js              # Service Worker
├── .env.local.example      # 환경변수 예시
├── package.json
├── next.config.js
├── tsconfig.json
└── tailwind.config.ts
```

## 🐛 트러블슈팅

### 1. "Google API 키가 설정되지 않았습니다" 에러
**원인**: `.env.local` 파일이 없거나 환경변수가 잘못됨
**해결**:
- 프로젝트 루트에 `.env.local` 파일 생성
- 올바른 Client ID와 API Key 입력
- 개발 서버 재시작 (`Ctrl+C` 후 `npm run dev`)

### 2. "Google 인증이 초기화되지 않았습니다" 에러
**원인**: Google API 스크립트 로딩 실패
**해결**:
- 페이지 새로고침 (F5)
- 브라우저 콘솔에서 에러 확인
- 인터넷 연결 확인

### 3. 카메라가 검정색만 표시
**원인**: 비디오 스트림 초기화 문제
**해결**:
- ✅ v6에서 이미 수정됨
- 페이지 새로고침
- 카메라 권한 재승인

### 4. Google Sheets 저장 실패
**원인**: 스프레드시트 ID 오류 또는 권한 문제
**해결**:
- 스프레드시트 ID 정확히 확인
- 스프레드시트를 본인 계정에서 생성했는지 확인
- Google 계정 재로그인

### 5. OCR 인식률이 낮음
**개선 방법**:
- 조명이 밝은 곳에서 촬영
- 명함을 화면에 꽉 차게 촬영
- 흔들리지 않게 안정적으로 촬영
- 명함의 글씨가 선명하게 보이도록 초점 조절

## 📱 카메라 사용 요구사항

- **HTTPS 필수**: 보안 연결에서만 카메라 접근 가능
  - localhost는 예외 (개발 시)
- **권한 허용**: 브라우저에서 카메라 권한 승인 필요
- **지원 브라우저**: Chrome, Safari, Edge 등 최신 브라우저

## 🔐 보안 주의사항

1. `.env.local` 파일을 절대 공개하지 마세요
2. API 키를 GitHub 등에 업로드하지 마세요
3. OAuth 클라이언트 ID는 신뢰할 수 있는 도메인만 추가하세요
4. 프로덕션 배포 시 환경변수를 서버 설정에서 관리하세요

## 📄 라이선스

MIT License

## 🆘 도움이 필요하신가요?

1. README를 다시 한 번 확인
2. 콘솔 에러 메시지 확인
3. `.env.local` 파일 설정 재확인
4. 개발 서버 재시작

## 📝 변경 이력

### v6-fixed (2024-12-22)
- ✅ Google API null 에러 해결
- ✅ 환경변수 검증 추가
- ✅ 에러 UI 개선
- ✅ 안전한 API 접근

### v6 (2024-12-21)
- ✅ 카메라 검정화면 문제 해결
- ✅ 비디오 자동 재생 추가
- ✅ 준비 상태 UI 개선

---

**개발자**: Business Card Scanner Team
**버전**: v6-fixed
**최종 업데이트**: 2024-12-22
