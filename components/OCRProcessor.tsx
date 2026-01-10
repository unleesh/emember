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
// 이미지 최적화 함수
const optimizeImageForVision = (imageData: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      // 최대 크기 제한
      const MAX_SIZE = 1600;
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_SIZE || height > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 고품질 렌더링
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      // JPEG 80% 품질로 압축
      const optimized = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log('이미지 최적화 완료:', {
        원본: imageData.length,
        최적화: optimized.length,
        크기: `${width}x${height}`
      });
      
      resolve(optimized);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageData;
  });
};

  const processWithGoogleVision = async () => {
  try {
    setError(null);
    setStatus('이미지 최적화 중...');
    setProgress(10);

    // 이미지 최적화
    const optimizedImage = await optimizeImageForVision(imageData);
    
    setStatus('Google Cloud Vision API 호출 중...');
    setProgress(20);

    console.log('Optimized image size:', optimizedImage.length);
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
    console.log('Google Vision API 응답:', result);
    
    if (!response.ok) {
      console.error('Google Vision API 에러 상세:', result);
      throw new Error(`API 오류: ${response.status} - ${result.message || result.error || 'Unknown'}`);
    }

    setProgress(60);
    setStatus('텍스트 분석 중...');
    
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
    } else if (result.responses && result.responses[0]?.error) {
      throw new Error(`Vision API Error: ${result.responses[0].error.message}`);
    } else {
      throw new Error('텍스트를 인식할 수 없습니다.');
    }
  } catch (err: any) {
    console.error('Google Vision Error:', err);
    console.log('Tesseract로 전환합니다...');
    setError(`Google Vision 실패: ${err.message}. Tesseract로 재시도합니다...`);
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
// 전화번호 정리 함수
const formatPhoneNumber = (phone: string): string => {
  // 공백과 특수문자 정리
  let cleaned = phone.trim();
  
  // 미국 번호 표준화 (XXX-XXX-XXXX 또는 +1-XXX-XXX-XXXX)
  const usMatch = cleaned.match(/\+?1?[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})/);
  if (usMatch) {
    const hasCountryCode = cleaned.includes('+1') || cleaned.startsWith('1');
    if (hasCountryCode) {
      return `+1-${usMatch[1]}-${usMatch[2]}-${usMatch[3]}`;
    }
    return `${usMatch[1]}-${usMatch[2]}-${usMatch[3]}`;
  }
  
  // 한국 번호 표준화 (010-XXXX-XXXX)
  const krMatch = cleaned.match(/0?1[0-9][\s-]?(\d{3,4})[\s-]?(\d{4})/);
  if (krMatch) {
    const fullNumber = cleaned.replace(/[^\d]/g, '');
    if (fullNumber.length === 10) {
      return `${fullNumber.slice(0, 3)}-${fullNumber.slice(3, 6)}-${fullNumber.slice(6)}`;
    } else if (fullNumber.length === 11) {
      return `${fullNumber.slice(0, 3)}-${fullNumber.slice(3, 7)}-${fullNumber.slice(7)}`;
    }
  }
  
  return cleaned;
};

  const extractBusinessCardInfo = (text: string): BusinessCardData => {
  console.log('=== OCR 원본 텍스트 ===');
  console.log(text);
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  console.log('=== 줄별 분리 ===');
  lines.forEach((line, i) => console.log(`${i}: "${line}"`));

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

  // Keywords for detection
  const companyKeywords = ['주식회사', '(주)', '㈜', '회사', 'company', 'corp', 'corporation', 'inc', 'llc', 'llp', 'ltd', 'limited', 'co.', '&', 'group', 'partners', 'associates'];
  const positionKeywords = ['대표', '이사', '부장', '과장', '팀장', '사원', '매니저', 'manager', 'director', 'ceo', 'cto', 'cfo', 'president', 'vp', 'vice president', 'chief', 'head', 'lead', 'senior', 'junior', 'associate', 'partner', 'counsel', '변호사', '회계사', '세무사', '교수', 'professor', 'dr.', 'attorney', 'lawyer', 'consultant'];

  // 1. 이메일 추출
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailPattern);
  if (emails && emails.length > 0) {
    data.email = emails[0];
    console.log('이메일 발견:', data.email);
  }

  // 2. 웹사이트 추출
  const websitePatterns = [
    /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi,
    /(?:www\.)?([a-zA-Z0-9-]+\.(?:com|net|org|co\.kr|kr))/gi,
  ];
  
  for (const pattern of websitePatterns) {
    const websites = text.match(pattern);
    if (websites && websites.length > 0) {
      let website = websites[0];
      if (!website.startsWith('http')) {
        website = 'https://' + website;
      }
      data.website = website;
      console.log('웹사이트 발견:', data.website);
      break;
    }
  }

  // 3. 회사명 추출 (개선됨 - 영문 회사명 포함)
  // 3. 회사명 추출 (개선됨 - 이메일 도메인 활용)
const companyPatterns = [
  // 영문 회사명 (대문자로 시작, & 포함 가능)
  /^[A-Z][A-Z\s&]+(?:LLC|LLP|INC|CORP|CO\.|LTD|LIMITED|PARTNERS|GROUP)?$/,
  // 한글 회사명
  /^[가-힣\s]+(?:주식회사|회사|\(주\)|㈜)$/,
];

// 이메일에서 회사명 추출 시도
let companyFromEmail = '';
if (data.email) {
  // 이메일 도메인에서 회사명 추출 (예: kairos@lawmission.net → lawmission)
  const emailMatch = data.email.match(/@([a-zA-Z0-9-]+)\./);
  if (emailMatch) {
    const domain = emailMatch[1];
    // 도메인을 회사명으로 변환 (첫 글자 대문자)
    companyFromEmail = domain.charAt(0).toUpperCase() + domain.slice(1);
    console.log('이메일에서 회사명 추출:', companyFromEmail);
  }
}

// 상위 10줄에서 회사명 찾기
for (let i = 0; i < Math.min(10, lines.length); i++) {
  const line = lines[i];
  const upperLine = line.toUpperCase();
  const lowerLine = line.toLowerCase();
  
  // 영문 대문자 회사명 (예: WHITE & CASE, MISSION)
  if (/^[A-Z][A-Z\s&]+$/.test(line) && line.length >= 3 && line.length <= 50) {
    // 이미 이메일이나 웹사이트가 아닌지 확인
    if (!line.includes('@') && !line.includes('.com') && !line.includes('http')) {
      // 이메일 도메인과 매칭되는지 확인
      if (companyFromEmail && line.toUpperCase().includes(companyFromEmail.toUpperCase())) {
        data.company = line;
        console.log('영문 회사명 발견 (이메일 도메인 매칭):', line);
        break;
      } else if (!data.company) {
        // 일단 후보로 저장
        data.company = line;
        console.log('영문 회사명 후보 (대문자):', line);
      }
    }
  }
  
  // 이메일 도메인과 유사한 단어 찾기
  if (companyFromEmail) {
    const words = line.split(/[\s,.\-_]+/);
    for (const word of words) {
      // 대소문자 무시하고 비교
      if (word.length >= 3 && 
          word.toLowerCase() === companyFromEmail.toLowerCase()) {
        // 정확히 매칭되는 경우
        data.company = word;
        console.log('이메일 도메인과 정확히 매칭:', word);
        break;
      } else if (word.length >= 4 && 
                 companyFromEmail.toLowerCase().includes(word.toLowerCase())) {
        // 도메인에 포함된 경우 (예: mission in lawmission)
        if (!data.company || data.company.length < word.length) {
          data.company = word;
          console.log('이메일 도메인에 포함된 단어:', word);
        }
      }
    }
    if (data.company) break;
  }
  
  // 회사 키워드 포함
  if (companyKeywords.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
    if (!data.company) {
      data.company = line;
      console.log('키워드로 회사명 발견:', line);
    }
  }
}

// 이메일에서 추출한 회사명이 있고, 본문에서 매칭되는 회사명을 못 찾았다면
// 이메일 도메인을 회사명으로 사용
if (!data.company && companyFromEmail) {
  // 본문에서 대소문자 무관하게 찾기
  let foundInText = false;
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    
    // MISSION, Mission, mission 등 모두 매칭
    if (upperLine.includes(companyFromEmail.toUpperCase())) {
      // 가능하면 원본 대소문자 형태 추출
      const regex = new RegExp(companyFromEmail, 'gi');
      const matches = line.match(regex);
      if (matches && matches.length > 0) {
        data.company = matches[0];
        console.log('이메일 도메인으로 회사명 발견 (대소문자 보존):', matches[0]);
        foundInText = true;
        break;
      }
    }
  }
  
  // 그래도 못 찾았으면 이메일 도메인 자체를 사용
  if (!foundInText) {
    data.company = companyFromEmail;
    console.log('이메일 도메인을 회사명으로 사용:', companyFromEmail);
  }
}

console.log('최종 회사명:', data.company);

  // 4. 전화번호 추출 (국제 번호 포함)
  const phonePatterns = [
    // 한국 번호
    /(\+?82[\s-]?)?0?1[0-9][\s-]?\d{3,4}[\s-]?\d{4}/g,
    /(\+?82[\s-]?)?0\d{1,2}[\s-]?\d{3,4}[\s-]?\d{4}/g,
    
    // 미국 번호
    /\+?1[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})/g,
    /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g,
    
    // 국제 번호 일반
    /\+\d{1,3}[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g,
  ];

  const phoneNumbers: string[] = [];
  phonePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.trim();
        if (cleaned.length >= 10 && cleaned.length <= 20) {
          phoneNumbers.push(cleaned);
        }
      });
    }
  });

  const uniquePhones = [...new Set(phoneNumbers)];
  const sortedPhones = uniquePhones.sort((a, b) => {
    const aHasPlus = a.startsWith('+');
    const bHasPlus = b.startsWith('+');
    if (aHasPlus && !bHasPlus) return -1;
    if (!aHasPlus && bHasPlus) return 1;
    return 0;
  });

  if (sortedPhones.length > 0) {
    data.phone = sortedPhones[0];
    console.log('전화번호 발견:', data.phone);
  }

  // 5. 주소 추출 (미국 주소 포함)
  const addressPatterns = [
    // 미국 주소 (Street, City, State ZIP)
    /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Square|Sq|Suite|Ste)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}\s+\d{5}(?:-\d{4})?/gi,
    // Suite, Floor 정보
    /(?:Suite|Ste|Floor|Fl)[\s#]?\d+/gi,
    // 미국 주소 간단 버전
    /\d+\s+[A-Za-z\s]+(?:Real|Camino|Street|Avenue|Road|Boulevard|Drive)[,\s]+/gi,
    // 한국 주소
    /[가-힣]+(?:시|도|구|동|로|길)\s*\d+/g,
    /(?:서울|경기|인천|부산|대구|광주|대전|울산|세종)[^\n]{10,}/g,
  ];

  const addresses: string[] = [];
  
  // 여러 줄을 합쳐서 주소 찾기
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 미국 주소 패턴 확인
    if (/\d+\s+[A-Za-z]/.test(line) && line.length > 10) {
      // 다음 2-3줄도 주소일 가능성
      const addressLines = [line];
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const nextLine = lines[j];
        // State, ZIP code, Suite 등이 있으면 주소의 일부
        if (/(?:Suite|Floor|CA|NY|TX|MA|IL|WA|[A-Z]{2}\s+\d{5})/i.test(nextLine)) {
          addressLines.push(nextLine);
        } else if (nextLine.length < 5 || /^[가-힣]+$/.test(nextLine)) {
          // 한글 이름이나 짧은 줄이면 중단
          break;
        }
      }
      
      if (addressLines.length > 0) {
        addresses.push(addressLines.join(', '));
      }
    }
    
    // 한국 주소
    for (const pattern of addressPatterns) {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (match.length > 10) {
            addresses.push(match);
          }
        });
      }
    }
  }

  if (addresses.length > 0) {
    // 가장 긴 주소 선택 (더 완전할 가능성)
    data.address = addresses.sort((a, b) => b.length - a.length)[0];
    console.log('주소 발견:', data.address);
  }

  // 6. 한국 이름 추출 (개선됨)
  // 6. 이름 추출 (한글 + 영문 이름)
const koreanSurnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전', '홍', '고', '문', '손', '양', '배', '백', '허', '유', '남', '심', '노', '하', '곽', '성', '차', '주', '우', '구', '나', '민', '진', '지', '엄', '원', '채', '천', '방', '공', '현', '함', '변', '염', '여', '추', '도', '소'];

// 영문 성씨 (한국 이름의 로마자 표기)
const koreanSurnamesRoman = ['kim', 'lee', 'park', 'choi', 'jung', 'jeong', 'kang', 'cho', 'yoon', 'yun', 'jang', 'zhang', 'lim', 'im', 'han', 'oh', 'seo', 'shin', 'kwon', 'hwang', 'ahn', 'an', 'song', 'ryu', 'ryoo', 'jeon', 'jun', 'hong', 'ko', 'go', 'moon', 'mun', 'son', 'yang', 'bae', 'baek', 'heo', 'hur', 'yoo', 'yu', 'nam', 'sim', 'shim', 'noh', 'no', 'ha', 'kwak', 'sung', 'seong', 'cha', 'joo', 'ju', 'woo', 'wu', 'koo', 'gu', 'goo', 'na', 'min', 'jin', 'ji', 'chi', 'uhm', 'um', 'won', 'chae', 'chun', 'bang', 'kong', 'gong', 'hyun', 'hyeon', 'ham', 'byun', 'byeon', 'yum', 'yom', 'yeo', 'choo', 'chu', 'do', 'doh', 'so', 'soh'];

const namesCandidates: { name: string; score: number; lineIndex: number; type: 'korean' | 'english' }[] = [];

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
    
    namesCandidates.push({ name: cleaned, score, lineIndex: i, type: 'korean' });
  }
  
  // 방법 2: 영문 이름 (한국식 로마자 표기)
  // 패턴: Kim Sunghoon, Lee Jinho, Park Minji 등
  const englishNamePattern = /^([A-Z][a-z]+)\s+([A-Z][a-z]+)$/;
  const englishMatch = cleaned.match(englishNamePattern);
  
  if (englishMatch) {
    const firstName = englishMatch[1].toLowerCase();
    const lastName = englishMatch[2].toLowerCase();
    const fullName = cleaned;
    
    // 첫 단어가 한국 성씨인지 확인
    if (koreanSurnamesRoman.includes(firstName)) {
      let score = 15; // 영문 이름 기본 점수
      
      // 흔한 한국 성씨면 높은 점수
      if (['kim', 'lee', 'park', 'choi', 'jung', 'jeong', 'kang', 'cho'].includes(firstName)) {
        score += 15;
      }
      
      // 이름 길이 체크 (한국 이름은 보통 짧음)
      if (lastName.length >= 4 && lastName.length <= 10) {
        score += 10;
      }
      
      // 회사명/직책 키워드 포함하면 감점
      if (companyKeywords.some(k => cleaned.toLowerCase().includes(k.toLowerCase()))) {
        score -= 30;
      }
      if (positionKeywords.some(k => cleaned.toLowerCase().includes(k.toLowerCase()))) {
        score -= 30;
      }
      
      // 상위에 있을수록 높은 점수
      score += (10 - i);
      
      namesCandidates.push({ name: fullName, score, lineIndex: i, type: 'english' });
      console.log('영문 이름 발견:', fullName, '점수:', score);
    }
  }
  
  // 방법 3: 3단어 영문 이름 (Middle name 포함)
  // 패턴: Kim Young Soo, Lee Min Ho 등
  const threeWordNamePattern = /^([A-Z][a-z]+)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)$/;
  const threeWordMatch = cleaned.match(threeWordNamePattern);
  
  if (threeWordMatch) {
    const firstName = threeWordMatch[1].toLowerCase();
    
    if (koreanSurnamesRoman.includes(firstName)) {
      let score = 18;
      
      if (['kim', 'lee', 'park', 'choi'].includes(firstName)) {
        score += 15;
      }
      
      score += (10 - i);
      
      namesCandidates.push({ name: cleaned, score, lineIndex: i, type: 'english' });
      console.log('영문 이름 발견 (3단어):', cleaned, '점수:', score);
    }
  }
  
  // 방법 4: 직책 키워드와 같은 줄 또는 인접한 줄
  const lowerLine = cleaned.toLowerCase();
  const hasPosition = positionKeywords.some(keyword => lowerLine.includes(keyword));
  
  if (hasPosition) {
    const parts = cleaned.split(/[\s||\-_]/);
    
    for (const part of parts) {
      const trimmed = part.trim();
      
      // 한글 이름
      if (/^[가-힣]{2,4}$/.test(trimmed) && 
          koreanSurnames.some(s => trimmed.startsWith(s)) &&
          !positionKeywords.some(k => trimmed.includes(k))) {
        
        let score = 25;
        
        if (trimmed.length === 3) score += 10;
        if (koreanSurnames.slice(0, 10).some(s => trimmed.startsWith(s))) {
          score += 20;
        }
        
        score += (10 - i);
        
        namesCandidates.push({ name: trimmed, score, lineIndex: i, type: 'korean' });
        console.log('직책과 함께 발견된 이름:', trimmed, '점수:', score);
      }
    }
    
    // 바로 위나 아래 줄에서 영문/한글 이름 찾기
    if (i > 0) {
      const prevLine = lines[i - 1].trim();
      
      // 한글 이름
      if (/^[가-힣]{2,4}$/.test(prevLine) && koreanSurnames.some(s => prevLine.startsWith(s))) {
        namesCandidates.push({ name: prevLine, score: 30, lineIndex: i - 1, type: 'korean' });
        console.log('직책 바로 위 이름 (한글):', prevLine);
      }
      
      // 영문 이름
      const engMatch = prevLine.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)$/);
      if (engMatch && koreanSurnamesRoman.includes(engMatch[1].toLowerCase())) {
        namesCandidates.push({ name: prevLine, score: 32, lineIndex: i - 1, type: 'english' });
        console.log('직책 바로 위 이름 (영문):', prevLine);
      }
    }
    
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1].trim();
      
      // 한글 이름
      if (/^[가-힣]{2,4}$/.test(nextLine) && koreanSurnames.some(s => nextLine.startsWith(s))) {
        namesCandidates.push({ name: nextLine, score: 28, lineIndex: i + 1, type: 'korean' });
        console.log('직책 바로 아래 이름 (한글):', nextLine);
      }
      
      // 영문 이름
      const engMatch = nextLine.match(/^([A-Z][a-z]+)\s+([A-Z][a-z]+)$/);
      if (engMatch && koreanSurnamesRoman.includes(engMatch[1].toLowerCase())) {
        namesCandidates.push({ name: nextLine, score: 30, lineIndex: i + 1, type: 'english' });
        console.log('직책 바로 아래 이름 (영문):', nextLine);
      }
    }
  }
  
  // 방법 5: 한글 + 영문 혼합 (같은 줄)
  const koreanNamePattern = /([가-힣]{2,4})\s+[A-Z]/;
  const match = cleaned.match(koreanNamePattern);
  
  if (match) {
    const koreanName = match[1];
    
    if (koreanSurnames.some(s => koreanName.startsWith(s))) {
      let score = 18;
      
      if (koreanName.length === 3) score += 10;
      if (koreanSurnames.slice(0, 10).some(s => koreanName.startsWith(s))) {
        score += 20;
      }
      
      score += (10 - i);
      
      namesCandidates.push({ name: koreanName, score, lineIndex: i, type: 'korean' });
      console.log('영문과 함께 발견된 한글 이름:', koreanName, '점수:', score);
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
    console.log('✅ 선택된 이름:', bestCandidate.name, '(타입:', bestCandidate.type, ') 점수:', bestCandidate.score);
  }
}

  // 7. 직책 추출 (개선됨 - 이름 근처 우선)
  const positionCandidates: { position: string; score: number }[] = [];
  
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // 직책 키워드 포함
    for (const keyword of positionKeywords) {
      if (lowerLine.includes(keyword)) {
        let score = 10;
        
        // 이름과 같은 줄이거나 인접하면 높은 점수
        if (data.name && line.includes(data.name)) {
          score += 20;
        }
        
        // 단독으로 직책만 있으면 높은 점수
        if (line.trim() === keyword || /^[가-힣]+$/.test(line.trim())) {
          score += 15;
        }
        
        // 상위에 있을수록 높은 점수
        score += (10 - i);
        
        positionCandidates.push({ position: line.trim(), score });
      }
    }
  }
  
  if (positionCandidates.length > 0) {
    positionCandidates.sort((a, b) => b.score - a.score);
    data.position = positionCandidates[0].position;
    console.log('✅ 선택된 직책:', data.position);
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