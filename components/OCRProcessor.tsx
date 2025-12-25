'use client';

import { useEffect, useState } from 'react';
import type { BusinessCardData } from '../app/page';

interface OCRProcessorProps {
  imageData: string;
  onComplete: (data: BusinessCardData) => void;
  onBack: () => void;
}

export default function OCRProcessor({ imageData, onComplete, onBack }: OCRProcessorProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('OCR 엔진 초기화 중...');
  const [error, setError] = useState<string | null>(null);
  const [useGoogleVision, setUseGoogleVision] = useState(true);

  useEffect(() => {
    processOCR();
  }, [imageData]);

  const processOCR = async () => {
    if (useGoogleVision) {
      await processWithGoogleVision();
    } else {
      await processWithTesseract();
    }
  };

  const processWithGoogleVision = async () => {
  try {
    setError(null);
    setStatus('이미지 최적화 중...');
    setProgress(10);

    // 이미지 크기 줄이기 (Vision API 제한: 4MB)
    const optimizedImage = await optimizeImage(imageData);
    
    setStatus('Google Cloud Vision API 호출 중...');
    setProgress(20);

    console.log('Google Vision API 호출 시작...');
    
    const response = await fetch('/api/vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: optimizedImage,
      }),
    });

    console.log('Google Vision API 응답 상태:', response.status);
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Google Vision API 에러:', result);
      throw new Error(`API 오류: ${response.status} - ${JSON.stringify(result.details)}`);
    }

    setProgress(60);
    setStatus('텍스트 분석 중...');

    console.log('Google Vision 결과:', result);
    
    if (result.responses && result.responses[0]?.fullTextAnnotation) {
      const text = result.responses[0].fullTextAnnotation.text;
      console.log('Google Vision 인식 텍스트:', text);
      
      setProgress(90);
      setStatus('정보 추출 중...');
      
      const extractedData = extractBusinessCardInfo(text);
      
      setProgress(100);
      setTimeout(() => {
        onComplete(extractedData);
      }, 500);
    } else {
      throw new Error('텍스트를 인식할 수 없습니다.');
    }
  } catch (err: any) {
    console.error('Google Vision Error:', err);
    console.log('Tesseract로 전환합니다...');
    setError('Google Vision API 오류. Tesseract로 재시도합니다...');
    setUseGoogleVision(false);
    setTimeout(() => processWithTesseract(), 1000);
  }
};

// 이미지 최적화 함수 추가
const optimizeImage = async (imageData: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // 최대 크기 제한 (1920x1080)
      const maxWidth = 1920;
      const maxHeight = 1080;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // JPEG 압축 (품질 85%)
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = imageData;
  });
};

  const processWithTesseract = async () => {
  try {
    setError(null);
    setStatus('Tesseract 엔진 로딩 중...');
    setProgress(10);

    const Tesseract = await import('tesseract.js');
    
    const worker = await Tesseract.createWorker(['kor', 'eng'], 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          const ocrProgress = Math.round(m.progress * 80) + 10;
          setProgress(ocrProgress);
          setStatus(`텍스트 인식 중... ${ocrProgress}%`);
        }
      },
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.4/dist/worker.min.js',
      langPath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/lang-data',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm.js',
    });

    // setParameters 제거 - 기본 설정 사용
    setStatus('명함 이미지 분석 중...');
    const { data: { text } } = await worker.recognize(imageData);
    
    setProgress(95);
    setStatus('정보 추출 중...');
    await worker.terminate();

    console.log('Tesseract 인식 텍스트:', text);
    const extractedData = extractBusinessCardInfo(text);
    
    setProgress(100);
    setTimeout(() => {
      onComplete(extractedData);
    }, 500);

  } catch (err) {
    console.error('Tesseract Error:', err);
    setError('OCR 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
  }
};

// 이미지 전처리 함수 추가 (컴포넌트 바깥에)
const enhanceImageForOCR = async (imageData: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // 3배 확대
      const scale = 3;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // 고품질 렌더링
      ctx.imageSmoothingEnabled = false; // 픽셀 선명도 유지
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 대비 강화
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const contrast = 1.3; // 대비 증가
      const factor = (259 * (contrast + 1)) / (259 - contrast);
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;     // R
        data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
        data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.src = imageData;
  });
};

  const extractBusinessCardInfo = (text: string): BusinessCardData => {
    
  const lines = text.split('\n').filter(line => line.trim());
  
  const data: BusinessCardData = {
    name: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    rawText: text
  };
  // extractBusinessCardInfo 함수 시작 부분에 추가
console.log('=== OCR 원본 텍스트 ===');
console.log(text);
console.log('=== 줄별 분리 ===');
lines.forEach((line, i) => console.log(`${i}: "${line}"`));
  // 1. 이메일 추출 (가장 확실한 패턴)
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    data.email = emails[0].toLowerCase();
  }

  // 2. 전화번호 추출
  const phoneRegex = /(\+?82[-.\s]?)?0?1[0-9][-.\s]?\d{3,4}[-.\s]?\d{4}|0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    data.phone = phones[0].replace(/\s+/g, '-');
  }

  // 3. 웹사이트 추출 (URL 우선, 없으면 이메일 도메인)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+\.[a-z]{2,})/gi;
  const urls = text.match(urlRegex);
  if (urls && urls.length > 0) {
    data.website = urls[0];
    if (!data.website.startsWith('http')) {
      data.website = 'https://' + data.website;
    }
  } else if (data.email) {
    // URL이 없으면 이메일 도메인 사용
    const domain = data.email.split('@')[1];
    if (domain && !domain.includes('gmail') && !domain.includes('naver') && !domain.includes('kakao')) {
      data.website = 'https://' + domain;
    }
  }

  // 4. 직책 추출 (대표, CEO 등)
  const positionKeywords = [
    '대표이사', '대표', '부대표', 'CEO', 'CTO', 'CFO', 'COO', 'CMO',
    '회장', '사장', '부사장', '이사', '본부장', '부장', '차장', '과장', '팀장', 
    '매니저', '주임', '사원', 'President', 'Director', 'Manager', 'Chief', 
    'Head', 'Lead', 'Senior', 'Junior', 'Executive', 'Officer'
  ];
  
  for (const line of lines) {
    const cleaned = line.trim();
    // 직책 키워드가 있고, 짧고, 숫자/이메일 없는 경우
    if (positionKeywords.some(keyword => cleaned.includes(keyword)) && 
        cleaned.length < 30 &&
        !cleaned.includes('@') &&
        !cleaned.match(/\d{3,}/)) {
      data.position = cleaned;
      break;
    }
  }

  // 5. 회사명 추출
  const companyKeywords = [
    '주식회사', '(주)', 'Co.,Ltd', 'Co., Ltd', 'Corp', 'Corporation', 
    'Inc', 'Company', 'Group', 'Partners', 'Ltd', 'LLC', 'Lab'
  ];
  
  for (const line of lines) {
    const cleaned = line.trim();
    
    // 회사명 키워드가 있거나, 영문 대문자+소문자 조합 (AI, curi 등)
    const hasCompanyKeyword = companyKeywords.some(keyword => cleaned.includes(keyword));
    const isEnglishBrand = /^[A-Za-z\s]+$/.test(cleaned) && cleaned.length >= 3 && cleaned.length <= 30;
    
    if ((hasCompanyKeyword || isEnglishBrand) &&
        !cleaned.includes('@') && 
        !cleaned.match(/\d{2,4}[-.\s]\d{3,4}/) &&
        !cleaned.includes('www.') &&
        !cleaned.includes('http') &&
        !positionKeywords.some(keyword => cleaned.includes(keyword))) {
      data.company = cleaned;
      break;
    }
  }

// 6. 한국 이름 추출 (개선된 로직 - 모든 케이스 대응)
const koreanSurnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전', '홍', '고', '문', '손', '양', '배', '백', '허', '유', '남', '심', '노', '하', '곽', '성', '차', '주', '우', '구', '나', '민', '진', '지', '엄', '원', '채', '천', '방', '공', '현', '함', '변', '염', '여', '추', '도', '소'];

const namesCandidates: { name: string; score: number; lineIndex: number }[] = [];

for (let i = 0; i < Math.min(10, lines.length); i++) {
  const line = lines[i];
  const cleaned = line.trim();
  
  // 방법 1: 정확히 한글 2-4글자만
  if (/^[가-힣]{2,4}$/.test(cleaned)) {
    let score = 0;
    
    if (cleaned.length === 3) score += 10;
    if (koreanSurnames.slice(0, 10).some(s => cleaned.startsWith(s))) {
      score += 20;
    } else if (koreanSurnames.some(s => cleaned.startsWith(s))) {
      score += 10;
    }
    
    if (companyKeywords.some(k => cleaned.includes(k))) score -= 50;
    if (positionKeywords.some(k => cleaned.includes(k))) score -= 50;
    
    score += (10 - i);
    
    if (cleaned === data.company || cleaned === data.position) score -= 30;
    
    namesCandidates.push({ name: cleaned, score, lineIndex: i });
  }
  
  // 방법 2: 직책 키워드와 함께
  const hasPosition = positionKeywords.some(keyword => cleaned.includes(keyword));
  if (hasPosition) {
    const parts = cleaned.split(/[\s||\-_]/);
    
    for (const part of parts) {
      const trimmed = part.trim();
      
      if (/^[가-힣]{2,4}$/.test(trimmed) && 
          koreanSurnames.some(s => trimmed.startsWith(s)) &&
          !positionKeywords.some(k => trimmed.includes(k))) {
        
        let score = 15;
        
        if (trimmed.length === 3) score += 10;
        if (koreanSurnames.slice(0, 10).some(s => trimmed.startsWith(s))) {
          score += 20;
        }
        
        score += (10 - i);
        
        namesCandidates.push({ name: trimmed, score, lineIndex: i });
        console.log('직책과 함께 발견된 이름:', trimmed, '점수:', score);
      }
    }
  }
  
  // 방법 3: 회사명 키워드와 함께
  const hasCompany = companyKeywords.some(keyword => cleaned.includes(keyword));
  if (hasCompany) {
    const parts = cleaned.split(/[\s||\-_()]/);
    
    for (const part of parts) {
      const trimmed = part.trim();
      
      if (/^[가-힣]{2,4}$/.test(trimmed) && 
          koreanSurnames.some(s => trimmed.startsWith(s)) &&
          !companyKeywords.some(k => trimmed.includes(k))) {
        
        let score = 12;
        
        if (trimmed.length === 3) score += 10;
        if (koreanSurnames.slice(0, 10).some(s => trimmed.startsWith(s))) {
          score += 20;
        }
        
        namesCandidates.push({ name: trimmed, score, lineIndex: i });
        console.log('회사명과 함께 발견된 이름:', trimmed, '점수:', score);
      }
    }
  }
  
  // 방법 4: 한글 + 영문 이름 혼합 (NEW!)
  // "양희연 H.Hailey Yang" → "양희연"
  const koreanNamePattern = /([가-힣]{2,4})\s+[A-Z]/;
  const match = cleaned.match(koreanNamePattern);
  
  if (match) {
    const koreanName = match[1];
    
    if (koreanSurnames.some(s => koreanName.startsWith(s))) {
      let score = 18; // 영문과 함께 = 신뢰도 매우 높음
      
      if (koreanName.length === 3) score += 10;
      if (koreanSurnames.slice(0, 10).some(s => koreanName.startsWith(s))) {
        score += 20;
      }
      
      score += (10 - i);
      
      namesCandidates.push({ name: koreanName, score, lineIndex: i });
      console.log('영문과 함께 발견된 한글 이름:', koreanName, '점수:', score);
    }
  }
  
  // 방법 5: 공백 없이 붙은 경우 (NEW!)
  // "양희연H.Hailey" 
  const widePattern = /([가-힣]{2,4})[\s\t]*[A-Z.]/;
  const wideMatch = cleaned.match(widePattern);
  
  if (wideMatch && !match) {
    const koreanName = wideMatch[1];
    
    if (koreanSurnames.some(s => koreanName.startsWith(s))) {
      let score = 16;
      
      if (koreanName.length === 3) score += 10;
      if (koreanSurnames.slice(0, 10).some(s => koreanName.startsWith(s))) {
        score += 20;
      }
      
      namesCandidates.push({ name: koreanName, score, lineIndex: i });
      console.log('영문과 붙어있는 한글 이름:', koreanName, '점수:', score);
    }
  }
}

// 점수가 가장 높은 이름 선택
if (namesCandidates.length > 0) {
  namesCandidates.sort((a, b) => b.score - a.score);
  const bestCandidate = namesCandidates[0];
  
  console.log('이름 후보들:', namesCandidates);
  
  if (bestCandidate.score > 0) {
    data.name = bestCandidate.name;
    console.log('✅ 선택된 이름:', bestCandidate.name, '점수:', bestCandidate.score);
  }
}

// 한글 이름을 못 찾았으면 영문 이름 찾기
if (!data.name) {
  for (const line of lines.slice(0, 10)) {
    const cleaned = line.trim();
    
    if (/^[A-Z][a-z]+\s[A-Z][a-z]+$/.test(cleaned) && cleaned.length <= 20) {
      data.name = cleaned;
      console.log('영문 이름 발견:', cleaned);
      break;
    }
  }
}

  // 7. 주소 추출 (여러 줄 합치기 - 개선)
  const addressKeywords = ['시', '구', '동', '로', '길', '층', '호', '번지', 'Fl', 'Floor', 'St', 'Street', 'Ave'];
  const addressLines: string[] = [];
  let foundAddress = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 이미 주소를 찾았고, 현재 줄도 주소의 연속인지 확인
    if (foundAddress) {
      const hasAddressPattern = 
        /\d+길/.test(line) || // "60길"
        /\d+층/.test(line) || // "13층"
        /\d+호/.test(line) || // "5호"
        addressKeywords.some(keyword => line.includes(keyword)) ||
        /^\d+\s*[A-Z]/.test(line) || // "3003 N First St" 같은 영문 주소
        /^[A-Z]{2}\s*\d+/.test(line); // "CA 95134" 같은 주소
      
      if (hasAddressPattern && 
          line.length < 50 &&
          !line.includes('@') &&
          !line.includes('www.') &&
          !positionKeywords.some(keyword => line.includes(keyword))) {
        addressLines.push(line);
        continue;
      } else {
        break; // 주소가 끝남
      }
    }
    
    // 주소 시작 찾기
    const koreanAddressPattern = /[가-힣]+[시도]|[가-힣]+[구군]|[가-힣]+[동읍면리]|[가-힣]+로|[가-힣]+길/;
    const hasKoreanAddress = koreanAddressPattern.test(line);
    const hasAddressKeyword = addressKeywords.some(keyword => line.includes(keyword));
    
    if ((hasKoreanAddress || hasAddressKeyword) && 
        line.length > 5 &&
        !line.includes('@') &&
        !line.includes('www.') &&
        !line.includes('http') &&
        !positionKeywords.some(keyword => line.includes(keyword))) {
      
      addressLines.push(line);
      foundAddress = true;
    }
  }
  
  if (addressLines.length > 0) {
    data.address = addressLines.join(' ').trim();
  }

  // 8. 이름이 여전히 없다면 추가 시도
  if (!data.name) {
    // "이름 + 직책" 형태에서 분리
    if (data.position) {
      for (const line of lines.slice(0, 5)) {
        const cleaned = line.trim();
        // 직책 제거
        const withoutPosition = positionKeywords.reduce((text, keyword) => 
          text.replace(keyword, ''), cleaned).trim();
        
        if (withoutPosition.length >= 2 && 
            withoutPosition.length <= 4 && 
            /^[가-힣]+$/.test(withoutPosition)) {
          data.name = withoutPosition;
          break;
        }
      }
    }
    
    // 그래도 없으면 첫 줄에서 한글 2-4자 찾기
    if (!data.name) {
      for (const line of lines.slice(0, 3)) {
        const cleaned = line.trim();
        if (/^[가-힣]{2,4}$/.test(cleaned)) {
          data.name = cleaned;
          break;
        }
      }
    }
  }

  return data;
};

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          ← 
        </button>
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
          🤖 OCR 처리 중
        </h2>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {error ? (
          <div className="max-w-md w-full">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 text-center">
              <span className="text-4xl block mb-4">⚠️</span>
              <p className="text-orange-800 font-bold mb-2">재시도 중</p>
              <p className="text-orange-600 text-sm mb-4">{error}</p>
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent mx-auto"></div>
            </div>
          </div>
        ) : (
          <div className="max-w-md w-full">
            {/* 이미지 프리뷰 */}
            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <img
                src={imageData}
                alt="Captured business card"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>

            {/* 진행 상태 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-800 font-bold">{status}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {useGoogleVision ? '🌟 Google Vision API 사용 중' : '📚 Tesseract 사용 중'}
                </p>
              </div>

              {/* 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">{progress}%</p>

              {/* 처리 단계 */}
              <div className="mt-6 space-y-2 text-sm">
                <div className={`flex items-center gap-2 ${progress > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{progress > 0 ? '✓' : '○'}</span>
                  <span>OCR 엔진 준비</span>
                </div>
                <div className={`flex items-center gap-2 ${progress > 30 ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{progress > 30 ? '✓' : '○'}</span>
                  <span>텍스트 인식</span>
                </div>
                <div className={`flex items-center gap-2 ${progress > 70 ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{progress > 70 ? '✓' : '○'}</span>
                  <span>정보 추출</span>
                </div>
                <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-green-600' : 'text-gray-400'}`}>
                  <span>{progress >= 100 ? '✓' : '○'}</span>
                  <span>완료</span>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              💡 Google Cloud Vision API로 정확하게 인식합니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}