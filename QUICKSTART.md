# 🚀 emember 빠른 시작 가이드

## 📦 다운로드 및 설치

### 1. 프로젝트 압축 해제
```bash
unzip emember-complete.zip
cd emember-complete
```

### 2. 의존성 설치
```bash
npm install
```

## ⚙️ 설정 (5분)

### Google Cloud 설정

#### 1단계: 프로젝트 생성
1. https://console.cloud.google.com/projectcreate 접속
2. 프로젝트 이름: `emember-automation`
3. "만들기" 클릭

#### 2단계: API 활성화
다음 링크를 각각 클릭하고 "사용 설정" 버튼 누르기:
- https://console.cloud.google.com/apis/library/sheets.googleapis.com
- https://console.cloud.google.com/apis/library/vision.googleapis.com

#### 3단계: Service Account 생성
1. https://console.cloud.google.com/iam-admin/serviceaccounts 접속
2. "CREATE SERVICE ACCOUNT" 클릭
3. 이름: `emember-service`
4. Role: `Editor` 선택
5. "DONE" → 생성된 계정 클릭 → "Keys" 탭
6. "ADD KEY" → "Create new key" → JSON
7. JSON 파일 다운로드

#### 4단계: Google Sheets 생성
1. https://sheets.google.com/create 접속
2. 이름: `명함 데이터베이스`
3. URL에서 ID 복사 (긴 영숫자 문자열)
4. "공유" 버튼 클릭
5. JSON 파일의 `client_email` 값 입력
6. 권한: **편집자** → "완료"

### 환경 변수 설정

#### 로컬 개발
`.env.local` 파일 생성:
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=JSON파일의_client_email
GOOGLE_PRIVATE_KEY="JSON파일의_private_key_전체"
GOOGLE_SPREADSHEET_ID=복사한_스프레드시트_ID
```

## 🎬 실행

### 개발 모드
```bash
npm run dev
```
→ http://localhost:3000

### 프로덕션 빌드
```bash
npm run build
npm start
```

## 🚢 Vercel 배포

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. 로그인
```bash
vercel login
```

### 3. 배포
```bash
vercel
```

### 4. 환경 변수 설정
Vercel Dashboard에서:
1. 프로젝트 선택
2. Settings → Environment Variables
3. 환경 변수 3개 추가:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SPREADSHEET_ID`
4. Production, Preview, Development 모두 체크

### 5. 프로덕션 배포
```bash
vercel --prod
```

## ✅ 확인

1. 배포된 URL 접속
2. "설정" 버튼 클릭
3. 환경 변수 설정 확인
4. "스캔 시작하기"로 테스트

## 🎯 처음 사용하기

1. **홈 화면**: "스캔 시작하기" 클릭
2. **카메라**: 명함 촬영
3. **OCR**: 자동 인식 (30초 소요)
4. **편집**: 정보 확인 및 수정
   - 음성 입력: 빨간 마이크 버튼
   - 키보드 입력: "키보드 입력" 버튼
5. **저장**: Google Sheets 확인 화면
6. **완료**: "스프레드시트 열기"로 확인

## 🆘 문제 해결

### "설정이 필요합니다" 화면에서 벗어나지 못해요
→ 환경 변수를 올바르게 설정했는지 확인
→ Vercel에서 재배포 후 몇 분 대기

### OCR이 작동하지 않아요
→ Google Cloud Vision API가 활성화되었는지 확인
→ 브라우저 콘솔(F12)에서 에러 확인

### Google Sheets 저장 실패
→ Service Account가 스프레드시트와 공유되었는지 확인
→ 편집자 권한이 부여되었는지 확인

### 음성 입력이 작동하지 않아요
→ HTTPS 연결 확인 (로컬은 localhost)
→ Chrome 또는 Safari 사용
→ 마이크 권한 확인

## 📞 지원

- README.md에서 상세 문서 확인
- GitHub Issues로 문의
- 로컬: http://localhost:3000/setup 에서 단계별 안내

---

🎉 **완료! 이제 명함을 스캔해보세요!**
