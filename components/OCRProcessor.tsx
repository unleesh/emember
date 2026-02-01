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

const extractBusinessCardInfo = (text: string): BusinessCardData => {
  console.log('=== 한국 명함 특화 OCR 시작 ===');
  console.log(text);
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  console.log(`=== 줄별 분리 (총 ${lines.length}줄) ===`);
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

  // 1. 이메일
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailPattern);
  if (emails && emails.length > 0) {
    data.email = emails[0];
    console.log('✓ 이메일:', data.email);
  }

  // 2. 웹사이트
  const websitePatterns = [
    /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi,
    /(?:www\.)?([a-zA-Z0-9-]+\.(?:com|net|org|co\.kr|kr))/gi,
  ];
  for (const pattern of websitePatterns) {
    const websites = text.match(pattern);
    if (websites && websites.length > 0) {
      let website = websites[0];
      if (!website.startsWith('http')) website = 'https://' + website;
      data.website = website;
      console.log('✓ 웹사이트:', data.website);
      break;
    }
  }

  // 3. 전화번호 (휴대폰 우선) - 점(.) 구분자 지원
const phones: Array<{num: string; score: number; type: string}> = [];
const mobileKw = ['mobile', 'cell', 'h.p', 'hp', 'h.p.', '휴대폰', '핸드폰', '모바일', 'm', 'm.', 'm:'];
const officeKw = ['tel', 'office', 't', 't.', 't:', 'phone', '전화', '사무실', 'f', 'fax', '직통', '대표'];

for (const line of lines) {
  const lower = line.toLowerCase();
  
  // 010 휴대폰 (하이픈 또는 점 구분)
  // 패턴: 010-1234-5678, 010.1234.5678, 010 1234 5678, 0101234567 등
  const mobilePattern = /010[\s.-]?\d{3,4}[\s.-]?\d{4}/g;
  const mobiles = line.match(mobilePattern);
  
  if (mobiles) {
    mobiles.forEach(m => {
      // 하이픈으로 통일 (점을 하이픈으로 변환)
      const cleaned = m.replace(/[\s.]/g, '-');
      let score = 100;
      
      // "Mobile:", "m:", "휴대폰" 등 키워드 확인
      if (mobileKw.some(kw => lower.includes(kw))) {
        score += 50;
      }
      
      phones.push({num: cleaned, score, type: 'mobile'});
      console.log(`전화 발견(휴대폰): ${cleaned}, 점수: ${score}`);
    });
  }

  // 일반 전화 (지역번호: 02, 031, 032 등)
  // 패턴: (02)2194-7910, 02-2194-7910, (02)2194.7910, 02.2194.7910 등
  const officePattern = /\(?0\d{1,2}\)?[\s.-]?\d{3,4}[\s.-]?\d{4}/g;
  const officeMatches = line.match(officePattern);
  
  if (officeMatches) {
    officeMatches.forEach(o => {
      // 010은 위에서 이미 처리
      if (o.includes('010')) return;
      
      // 괄호 제거하고 하이픈으로 통일
      const cleaned = o.replace(/[()]/g, '').replace(/[\s.]/g, '-');
      let score = 50;
      
      // "직통:", "대표:", "Tel:" 등 키워드 확인
      if (officeKw.some(kw => lower.includes(kw))) {
        score += 20;
      }
      
      phones.push({num: cleaned, score, type: 'office'});
      console.log(`전화 발견(사무실): ${cleaned}, 점수: ${score}`);
    });
  }
}

// 중복 제거
const uniquePhones = new Map();
phones.forEach(p => {
  const key = p.num.replace(/[-\s.()]/g, '');
  if (!uniquePhones.has(key) || uniquePhones.get(key).score < p.score) {
    uniquePhones.set(key, p);
  }
});

const sorted = Array.from(uniquePhones.values()).sort((a,b) => b.score - a.score);
if (sorted.length > 0) {
  data.phone = sorted[0].num;
  console.log('✓ 최종 전화:', data.phone, `(${sorted[0].type})`);
}

  // 4. 이름 (띄어쓰기 있어도 인식)
  const surnames = ['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','류','전','홍','고','문','손','양','배','백','허','유','남','심','노','하','곽','성','차','주','우','구','나','민','진','지','엄','원','채','천','방','공','현','함','변','염','여','추','도','소'];
  const names: Array<{name: string; score: number}> = [];

  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].trim();

    // "홍 길 동"
    const m1 = line.match(/^([가-힣])\s+([가-힣])\s+([가-힣])$/);
    if (m1 && surnames.includes(m1[1])) {
      names.push({name: m1[1]+m1[2]+m1[3], score: 100});
      console.log(`이름 발견(띄어쓰기3): ${m1[1]+m1[2]+m1[3]}, 점수: 100`);
    }

    // "홍 길동"
    const m2 = line.match(/^([가-힣])\s+([가-힣]{1,3})$/);
    if (m2 && surnames.includes(m2[1])) {
      names.push({name: m2[1]+m2[2], score: 95});
      console.log(`이름 발견(띄어쓰기2): ${m2[1]+m2[2]}, 점수: 95`);
    }

    // "홍길동"
    if (/^[가-힣]{2,4}$/.test(line) && surnames.includes(line[0])) {
      names.push({name: line, score: 90});
      console.log(`이름 발견(붙어있음): ${line}, 점수: 90`);
    }

    // "대표 홍길동"
    const m3 = line.match(/(?:대표|이사|상무|부장|차장|과장|팀장|주임|사원|회장|전무|실장|본부장|센터장|그룹장)\s*([가-힣]{2,4})/);
    if (m3 && surnames.includes(m3[1][0])) {
      names.push({name: m3[1], score: 85});
      console.log(`이름 발견(직함+이름): ${m3[1]}, 점수: 85`);
    }
  }

  names.sort((a,b) => b.score - a.score);
  if (names.length > 0) {
    data.name = names[0].name;
    console.log('✓ 최종 이름:', data.name);
  }

  // 5. 직책 (팀+직함)
  const positions: Array<{text: string; score: number}> = [];
  const titles = ['회장','부회장','사장','부사장','전무','상무','이사','부장','차장','과장','대리','주임','사원','팀장','실장','본부장','센터장','그룹장','파트장','수석','책임','선임','매니저','리더','CEO','CTO','CFO','COO','CMO','Director','Manager','Lead','Head'];

  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i].trim();

    // "마케팅팀 팀장"
    const m1 = line.match(/^([가-힣A-Za-z&]+(?:팀|부|실|센터|그룹|본부))\s*([가-힣A-Za-z]+)$/);
    if (m1 && titles.some(t => m1[2].includes(t) || m1[2].toLowerCase().includes(t.toLowerCase()))) {
      positions.push({text: `${m1[1]} ${m1[2]}`, score: 100});
      console.log(`직책 발견(팀+직함): ${m1[1]} ${m1[2]}, 점수: 100`);
    }

    // "팀장 / 마케팅팀"
    const m2 = line.match(/^([가-힣A-Za-z]+)\s*[|/]\s*([가-힣A-Za-z&]+팀)$/);
    if (m2 && titles.some(t => m2[1].includes(t))) {
      positions.push({text: `${m2[2]} ${m2[1]}`, score: 95});
      console.log(`직책 발견(직함/팀): ${m2[2]} ${m2[1]}, 점수: 95`);
    }

    // 2줄에 걸쳐
    if (i < lines.length - 1) {
      const curr = lines[i].trim();
      const next = lines[i+1].trim();
      
      if (/팀|부|실|센터/.test(curr) && titles.some(t => next === t || next.toLowerCase() === t.toLowerCase())) {
        positions.push({text: `${curr} ${next}`, score: 90});
        console.log(`직책 발견(2줄-팀+직함): ${curr} ${next}, 점수: 90`);
      }
      if (titles.some(t => curr === t) && /팀|부|실/.test(next)) {
        positions.push({text: `${next} ${curr}`, score: 90});
        console.log(`직책 발견(2줄-직함+팀): ${next} ${curr}, 점수: 90`);
      }
    }

    // 직함만
    if (titles.some(t => line === t || line.toLowerCase() === t.toLowerCase())) {
      positions.push({text: line, score: 60});
      console.log(`직책 발견(직함만): ${line}, 점수: 60`);
    }
  }

  positions.sort((a,b) => b.score - a.score);
  if (positions.length > 0) {
    data.position = positions[0].text;
    console.log('✓ 최종 직책:', data.position);
  }

  // 6. 회사명 (주식회사, ~회사)
  const companies: Array<{name: string; score: number}> = [];

  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].trim();

    // "주식회사 ABC", "(주)ABC", "ABC(주)"
    const patterns = [
      {re: /(?:주식회사|유한회사)\s*([가-힣A-Za-z0-9&\s]+)/, s: 100},
      {re: /\((?:주|유)\)\s*([가-힣A-Za-z0-9&\s]+)/, s: 100},
      {re: /([가-힣A-Za-z0-9&\s]+)\s*\((?:주|유)\)/, s: 100},
      {re: /([가-힣A-Za-z0-9&\s]+(?:주식회사|유한회사|회사))/, s: 95},
    ];

    for (const {re, s} of patterns) {
      const m = line.match(re);
      if (m) {
        let name = m[1] || m[0];
        name = name.replace(/\((?:주|유)\)/g, '').trim();
        if (name.length >= 2 && name.length <= 50) {
          companies.push({name, score: s});
          console.log(`회사명 발견(법인): ${name}, 점수: ${s}`);
        }
      }
    }

    // "~그룹", "~기업"
    if (/[가-힣A-Za-z0-9&\s]+(?:그룹|기업|코퍼레이션|Corporation|Inc|LLC|Ltd)/.test(line) && line.length >= 2 && line.length <= 50) {
      companies.push({name: line, score: 90});
      console.log(`회사명 발견(기업형): ${line}, 점수: 90`);
    }

    // 영문 대문자
    if (/^[A-Z][A-Z\s&]+$/.test(line) && line.length >= 2 && line.length <= 50 && !line.includes('@') && !line.includes('.COM')) {
      companies.push({name: line, score: 80});
      console.log(`회사명 발견(영문): ${line}, 점수: 80`);
    }
  }

  // 이메일 도메인
  if (data.email) {
    const dm = data.email.match(/@([a-zA-Z0-9-]+)\./);
    if (dm) {
      const domain = dm[1];
      for (const line of lines.slice(0, 15)) {
        if (line.toLowerCase().includes(domain.toLowerCase())) {
          companies.push({name: line, score: 85});
          console.log(`회사명 발견(도메인 매칭): ${line}, 점수: 85`);
          break;
        }
      }
      if (companies.length === 0) {
        companies.push({name: domain.charAt(0).toUpperCase() + domain.slice(1), score: 70});
      }
    }
  }

  companies.sort((a,b) => b.score - a.score);
  if (companies.length > 0) {
    data.company = companies[0].name;
    console.log('✓ 최종 회사:', data.company);
  }

  // 7. 주소 (여러 줄 결합)
  const addresses: Array<{addr: string; score: number}> = [];
  const addrKw = ['시','도','구','군','읍','면','동','리','로','길','가','층','호'];
  const cities = ['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const hasKw = addrKw.some(kw => line.includes(kw));
    const hasCity = cities.some(c => line.includes(c));

    if (hasKw || hasCity) {
      const parts = [line];
      let score = 50;

      for (let j = i+1; j < Math.min(i+4, lines.length); j++) {
        const next = lines[j].trim();
        if (addrKw.some(kw => next.includes(kw)) || /\d+/.test(next)) {
          parts.push(next);
          score += 20;
        } else if (next.length < 5) {
          break;
        }
      }

      const full = parts.join(' ').trim();
      if (full.length >= 10) {
        addresses.push({addr: full, score});
        console.log(`주소 발견: ${full}, 점수: ${score}`);
      }
    }
  }

  addresses.sort((a,b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.addr.length - a.addr.length;
  });

  if (addresses.length > 0) {
    data.address = addresses[0].addr;
    console.log('✓ 최종 주소:', data.address);
  }

  console.log('=== 최종 결과 ===');
  console.log(data);
  return data;
};


// const extractBusinessCardInfo = (text: string): BusinessCardData => {
// console.log('=== OCR 원본 텍스트 ===');
// console.log(text);
// const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
// console.log('=== 줄별 분리 ===');
// lines.forEach((line, i) => console.log(`${i}: "${line}"`));

// const data: BusinessCardData = {
//   name: '',
//   company: '',
//   position: '',
//   email: '',
//   phone: '',
//   address: '',
//   website: '',
//   rawText: text
// };

// // Keywords for detection
// const companyKeywords = ['주식회사', '(주)', '㈜', '회사', 'company', 'corp', 'corporation', 'inc', 'llc', 'llp', 'ltd', 'limited', 'co.', '&', 'group', 'partners', 'associates'];
// const positionKeywords = ['대표', '이사', '부장', '과장', '팀장', '사원', '매니저', 'manager', 'director', 'ceo', 'cto', 'cfo', 'president', 'vp', 'vice president', 'chief', 'head', 'lead', 'senior', 'junior', 'associate', 'partner', 'counsel', '변호사', '회계사', '세무사', '교수', 'professor', 'dr.', 'attorney', 'lawyer', 'consultant'];

// // 1. 이메일 추출
// const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// const emails = text.match(emailPattern);
// if (emails && emails.length > 0) {
//   data.email = emails[0];
//   console.log('이메일 발견:', data.email);
// }

// // 2. 웹사이트 추출
// const websitePatterns = [
//   /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi,
//   /(?:www\.)?([a-zA-Z0-9-]+\.(?:com|net|org|co\.kr|kr))/gi,
// ];

// for (const pattern of websitePatterns) {
//   const websites = text.match(pattern);
//   if (websites && websites.length > 0) {
//     let website = websites[0];
//     if (!website.startsWith('http')) {
//       website = 'https://' + website;
//     }
//     data.website = website;
//     console.log('웹사이트 발견:', data.website);
//     break;
//   }
// }

// // 3. 회사명 추출 (개선됨 - 이메일 도메인 활용)
// let companyFromEmail = '';
// if (data.email) {
//   const emailMatch = data.email.match(/@([a-zA-Z0-9-]+)\./);
//   if (emailMatch) {
//     const domain = emailMatch[1];
//     companyFromEmail = domain.charAt(0).toUpperCase() + domain.slice(1);
//     console.log('이메일에서 회사명 추출:', companyFromEmail);
//   }
// }

// // 상위 10줄에서 회사명 찾기
// for (let i = 0; i < Math.min(10, lines.length); i++) {
//   const line = lines[i];
//   const upperLine = line.toUpperCase();
//   const lowerLine = line.toLowerCase();
  
//   // 영문 대문자 회사명 (예: WHITE & CASE, MISSION)
//   if (/^[A-Z][A-Z\s&]+$/.test(line) && line.length >= 3 && line.length <= 50) {
//     if (!line.includes('@') && !line.includes('.com') && !line.includes('http')) {
//       // 이메일 도메인과 매칭되는지 확인
//       if (companyFromEmail && line.toUpperCase().includes(companyFromEmail.toUpperCase())) {
//         data.company = line;
//         console.log('영문 회사명 발견 (이메일 도메인 매칭):', line);
//         break;
//       } else if (!data.company) {
//         data.company = line;
//         console.log('영문 회사명 후보 (대문자):', line);
//       }
//     }
//   }
  
//   // 이메일 도메인과 유사한 단어 찾기
//   if (companyFromEmail) {
//     const words = line.split(/[\s,.\-_]+/);
//     for (const word of words) {
//       if (word.length >= 3 && word.toLowerCase() === companyFromEmail.toLowerCase()) {
//         data.company = word;
//         console.log('이메일 도메인과 정확히 매칭:', word);
//         break;
//       } else if (word.length >= 4 && companyFromEmail.toLowerCase().includes(word.toLowerCase())) {
//         if (!data.company || data.company.length < word.length) {
//           data.company = word;
//           console.log('이메일 도메인에 포함된 단어:', word);
//         }
//       }
//     }
//     if (data.company) break;
//   }
  
//   // 회사 키워드 포함
//   if (companyKeywords.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
//     if (!data.company) {
//       data.company = line;
//       console.log('키워드로 회사명 발견:', line);
//     }
//   }
// }

// // 이메일 도메인을 회사명으로 사용 (본문에서 못 찾은 경우)
// if (!data.company && companyFromEmail) {
//   let foundInText = false;
//   for (let i = 0; i < Math.min(15, lines.length); i++) {
//     const line = lines[i];
//     const upperLine = line.toUpperCase();
    
//     if (upperLine.includes(companyFromEmail.toUpperCase())) {
//       const regex = new RegExp(companyFromEmail, 'gi');
//       const matches = line.match(regex);
//       if (matches && matches.length > 0) {
//         data.company = matches[0];
//         console.log('이메일 도메인으로 회사명 발견 (대소문자 보존):', matches[0]);
//         foundInText = true;
//         break;
//       }
//     }
//   }
  
//   if (!foundInText) {
//     data.company = companyFromEmail;
//     console.log('이메일 도메인을 회사명으로 사용:', companyFromEmail);
//   }
// }

// console.log('최종 회사명:', data.company);

// // 4. 전화번호 추출 (국제 번호 포함)
// const phonePatterns = [
//   // 한국 번호
//   /(\+?82[\s-]?)?0?1[0-9][\s-]?\d{3,4}[\s-]?\d{4}/g,
//   /(\+?82[\s-]?)?0\d{1,2}[\s-]?\d{3,4}[\s-]?\d{4}/g,
  
//   // 미국 번호
//   /\+?1[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})/g,
//   /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g,
  
//   // 국제 번호 일반
//   /\+\d{1,3}[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g,
// ];

// const phoneNumbers: string[] = [];
// phonePatterns.forEach(pattern => {
//   const matches = text.match(pattern);
//   if (matches) {
//     matches.forEach(match => {
//       const cleaned = match.trim();
//       if (cleaned.length >= 10 && cleaned.length <= 20) {
//         phoneNumbers.push(cleaned);
//       }
//     });
//   }
// });

// const uniquePhones = [...new Set(phoneNumbers)];
// const sortedPhones = uniquePhones.sort((a, b) => {
//   const aHasPlus = a.startsWith('+');
//   const bHasPlus = b.startsWith('+');
//   if (aHasPlus && !bHasPlus) return -1;
//   if (!aHasPlus && bHasPlus) return 1;
//   return 0;
// });

// if (sortedPhones.length > 0) {
//   data.phone = sortedPhones[0];
//   console.log('전화번호 발견:', data.phone);
// }

// // 5. 주소 추출 (미국 주소 포함)
// const addresses: string[] = [];

// // 여러 줄을 합쳐서 주소 찾기
// for (let i = 0; i < lines.length; i++) {
//   const line = lines[i];
  
//   // 미국 주소 패턴 확인
//   if (/\d+\s+[A-Za-z]/.test(line) && line.length > 10) {
//     const addressLines = [line];
//     for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
//       const nextLine = lines[j];
//       if (/(?:Suite|Floor|CA|NY|TX|MA|IL|WA|[A-Z]{2}\s+\d{5})/i.test(nextLine)) {
//         addressLines.push(nextLine);
//       } else if (nextLine.length < 5 || /^[가-힣]+$/.test(nextLine)) {
//         break;
//       }
//     }
    
//     if (addressLines.length > 0) {
//       addresses.push(addressLines.join(', '));
//     }
//   }
  
//   // 한국 주소
//   if (/[가-힣]+(?:시|도|구|동|로|길)\s*\d+/.test(line) || /(?:서울|경기|인천|부산|대구|광주|대전|울산|세종)/.test(line)) {
//     if (line.length > 10) {
//       addresses.push(line);
//     }
//   }
// }

// if (addresses.length > 0) {
//   data.address = addresses.sort((a, b) => b.length - a.length)[0];
//   console.log('주소 발견:', data.address);
// }

// // 6. 이름 추출 (한글 + 영문)
// const koreanSurnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '전', '홍', '고', '문', '손', '양', '배', '백', '허', '유', '남', '심', '노', '하', '곽', '성', '차', '주', '우', '구', '나', '민', '진', '지', '엄', '원', '채', '천', '방', '공', '현', '함', '변', '염', '여', '추', '도', '소'];

// const koreanSurnamesRoman = ['kim', 'lee', 'park', 'choi', 'jung', 'jeong', 'kang', 'cho', 'yoon', 'yun', 'jang', 'zhang', 'lim', 'im', 'han', 'oh', 'seo', 'shin', 'kwon', 'hwang', 'ahn', 'an', 'song', 'ryu', 'ryoo', 'jeon', 'jun', 'hong', 'ko', 'go', 'moon', 'mun', 'son', 'yang', 'bae', 'baek', 'heo', 'hur', 'yoo', 'yu', 'nam', 'sim', 'shim', 'noh', 'no', 'ha', 'kwak', 'sung', 'seong', 'cha', 'joo', 'ju', 'woo', 'wu', 'koo', 'gu', 'goo', 'na', 'min', 'jin', 'ji', 'chi', 'uhm', 'um', 'won', 'chae', 'chun', 'bang', 'kong', 'gong', 'hyun', 'hyeon', 'ham', 'byun', 'byeon', 'yum', 'yom', 'yeo', 'choo', 'chu', 'do', 'doh', 'so', 'soh'];

// const namesCandidates: { name: string; score: number; lineIndex: number; type: 'korean' | 'english' }[] = [];

// for (let i = 0; i < Math.min(10, lines.length); i++) {
//   const line = lines[i];
//   const cleaned = line.trim();
  
//   // 방법 1: 한글 이름 (2-4글자)
//   if (/^[가-힣]{2,4}$/.test(cleaned)) {
//     let score = 0;
    
//     if (cleaned.length === 3) score += 10;
//     if (koreanSurnames.slice(0, 10).some(s => cleaned.startsWith(s))) {
//       score += 20;
//     } else if (koreanSurnames.some(s => cleaned.startsWith(s))) {
//       score += 10;
//     }
    
//     if (companyKeywords.some(k => cleaned.includes(k))) score -= 50;
//     if (positionKeywords.some(k => cleaned.includes(k))) score -= 50;
    
//     score += (10 - i);
    
//     if (cleaned === data.company || cleaned === data.position) score -= 30;
    
//     namesCandidates.push({ name: cleaned, score, lineIndex: i, type: 'korean' });
//   }
  
//   // 방법 2: 영문 이름 (2단어 - Kim Sunghoon)
//   const englishNamePattern = /^([A-Z][a-z]+)\s+([A-Z][a-z]+)$/;
//   const englishMatch = cleaned.match(englishNamePattern);
  
//   if (englishMatch) {
//     const firstName = englishMatch[1].toLowerCase();
//     const lastName = englishMatch[2].toLowerCase();
//     const fullName = cleaned;
    
//     if (koreanSurnamesRoman.includes(firstName)) {
//       let score = 15;
      
//       if (['kim', 'lee', 'park', 'choi', 'jung', 'jeong', 'kang', 'cho'].includes(firstName)) {
//         score += 15;
//       }
      
//       if (lastName.length >= 4 && lastName.length <= 10) {
//         score += 10;
//       }
      
//       if (companyKeywords.some(k => cleaned.toLowerCase().includes(k.toLowerCase()))) {
//         score -= 30;
//       }
//       if (positionKeywords.some(k => cleaned.toLowerCase().includes(k.toLowerCase()))) {
//         score -= 30;
//       }
      
//       score += (10 - i);
      
//       namesCandidates.push({ name: fullName, score, lineIndex: i, type: 'english' });
//       console.log('영문 이름 발견:', fullName, '점수:', score);
//     }
//   }
  
//   // 방법 3: 3단어 영문 이름 (Kim Young Soo)
//   const threeWordNamePattern = /^([A-Z][a-z]+)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)$/;
//   const threeWordMatch = cleaned.match(threeWordNamePattern);
  
//   if (threeWordMatch) {
//     const firstName = threeWordMatch[1].toLowerCase();
    
//     if (koreanSurnamesRoman.includes(firstName)) {
//       let score = 18;
      
//       if (['kim', 'lee', 'park', 'choi'].includes(firstName)) {
//         score += 15;
//       }
      
//       score += (10 - i);
      
//       namesCandidates.push({ name: cleaned, score, lineIndex: i, type: 'english' });
//       console.log('영문 이름 발견 (3단어):', cleaned, '점수:', score);
//     }
//   }
  
//   // 방법 4: Western full name (Alexander Hyung-Joon Lee)
//   const westernFullNamePattern = /^([A-Z][a-z]+)\s+([A-Z][a-z]+-[A-Z][a-z]+)\s+([A-Z][a-z]+)$/;
//   const westernMatch = cleaned.match(westernFullNamePattern);
  
//   if (westernMatch) {
//     const firstName = westernMatch[1];
//     const middleName = westernMatch[2];
//     const lastName = westernMatch[3].toLowerCase();
//     const fullName = cleaned;
    
//     if (koreanSurnamesRoman.includes(lastName)) {
//       let score = 25;
      
//       if (['kim', 'lee', 'park', 'choi', 'jung', 'jeong', 'kang', 'cho'].includes(lastName)) {
//         score += 20;
//       }
      
//       if (middleName.includes('-')) {
//         score += 15;
//       }
      
//       if (companyKeywords.some(k => cleaned.toLowerCase().includes(k.toLowerCase()))) {
//         score -= 30;
//       }
//       if (positionKeywords.some(k => cleaned.toLowerCase().includes(k.toLowerCase()))) {
//         score -= 30;
//       }
      
//       score += (10 - i);
      
//       namesCandidates.push({ name: fullName, score, lineIndex: i, type: 'english' });
//       console.log('Western full name 발견:', fullName, '점수:', score);
//     }
//   }
  
//   // 방법 5: Multi-word English name (2-4 words)
//   const multiWordNamePattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z-]+)*\s+([A-Z][a-z]+))$/;
//   const multiMatch = cleaned.match(multiWordNamePattern);
  
//   if (multiMatch && !westernMatch && !englishMatch && !threeWordMatch) {
//     const fullName = multiMatch[1];
//     const words = fullName.split(/\s+/);
    
//     if (words.length >= 2 && words.length <= 4) {
//       const lastName = words[words.length - 1].toLowerCase();
      
//       if (koreanSurnamesRoman.includes(lastName)) {
//         let score = 20;
        
//         if (['kim', 'lee', 'park', 'choi', 'jung', 'jeong'].includes(lastName)) {
//           score += 15;
//         }
        
//         if (fullName.includes('-')) {
//           score += 10;
//         }
        
//         if (fullName.length >= 10 && fullName.length <= 40) {
//           score += 5;
//         }
        
//         if (companyKeywords.some(k => cleaned.toLowerCase().includes(k.toLowerCase()))) {
//           score -= 40;
//         }
//         if (positionKeywords.some(k => cleaned.toLowerCase().includes(k.toLowerCase()))) {
//           score -= 40;
//         }
        
//         score += (10 - i);
        
//         namesCandidates.push({ name: fullName, score, lineIndex: i, type: 'english' });
//         console.log('Multi-word English name 발견:', fullName, '점수:', score);
//       }
//     }
//   }
  
//   // 방법 6: 직책 키워드와 인접
//   const lowerLine = cleaned.toLowerCase();
//   const hasPosition = positionKeywords.some(keyword => lowerLine.includes(keyword));
  
//   if (hasPosition) {
//     const parts = cleaned.split(/[\s||\-_]/);
    
//     for (const part of parts) {
//       const trimmed = part.trim();
      
//       if (/^[가-힣]{2,4}$/.test(trimmed) && 
//           koreanSurnames.some(s => trimmed.startsWith(s)) &&
//           !positionKeywords.some(k => trimmed.includes(k))) {
        
//         let score = 25;
        
//         if (trimmed.length === 3) score += 10;
//         if (koreanSurnames.slice(0, 10).some(s => trimmed.startsWith(s))) {
//           score += 20;
//         }
        
//         score += (10 - i);
        
//         namesCandidates.push({ name: trimmed, score, lineIndex: i, type: 'korean' });
//         console.log('직책과 함께 발견된 이름:', trimmed, '점수:', score);
//       }
//     }
    
//     // 바로 위/아래 줄 확인
//     if (i > 0) {
//       const prevLine = lines[i - 1].trim();
      
//       if (/^[가-힣]{2,4}$/.test(prevLine) && koreanSurnames.some(s => prevLine.startsWith(s))) {
//         namesCandidates.push({ name: prevLine, score: 30, lineIndex: i - 1, type: 'korean' });
//         console.log('직책 바로 위 이름 (한글):', prevLine);
//       }
      
//       const engMatch = prevLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z-]+)*\s+[A-Z][a-z]+)$/);
//       if (engMatch) {
//         const words = engMatch[1].split(/\s+/);
//         const lastName = words[words.length - 1].toLowerCase();
        
//         if (koreanSurnamesRoman.includes(lastName)) {
//           namesCandidates.push({ name: prevLine, score: 35, lineIndex: i - 1, type: 'english' });
//           console.log('직책 바로 위 이름 (영문):', prevLine);
//         }
//       }
//     }
    
//     if (i < lines.length - 1) {
//       const nextLine = lines[i + 1].trim();
      
//       if (/^[가-힣]{2,4}$/.test(nextLine) && koreanSurnames.some(s => nextLine.startsWith(s))) {
//         namesCandidates.push({ name: nextLine, score: 28, lineIndex: i + 1, type: 'korean' });
//         console.log('직책 바로 아래 이름 (한글):', nextLine);
//       }
      
//       const engMatch = nextLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z-]+)*\s+[A-Z][a-z]+)$/);
//       if (engMatch) {
//         const words = engMatch[1].split(/\s+/);
//         const lastName = words[words.length - 1].toLowerCase();
        
//         if (koreanSurnamesRoman.includes(lastName)) {
//           namesCandidates.push({ name: nextLine, score: 32, lineIndex: i + 1, type: 'english' });
//           console.log('직책 바로 아래 이름 (영문):', nextLine);
//         }
//       }
//     }
//   }
  
//   // 방법 7: 한글 + 영문 혼합
//   const koreanNamePattern = /([가-힣]{2,4})\s+[A-Z]/;
//   const match = cleaned.match(koreanNamePattern);
  
//   if (match) {
//     const koreanName = match[1];
    
//     if (koreanSurnames.some(s => koreanName.startsWith(s))) {
//       let score = 18;
      
//       if (koreanName.length === 3) score += 10;
//       if (koreanSurnames.slice(0, 10).some(s => koreanName.startsWith(s))) {
//         score += 20;
//       }
      
//       score += (10 - i);
      
//       namesCandidates.push({ name: koreanName, score, lineIndex: i, type: 'korean' });
//       console.log('영문과 함께 발견된 한글 이름:', koreanName, '점수:', score);
//     }
//   }
// }

// // 최고 점수 이름 선택
// if (namesCandidates.length > 0) {
//   namesCandidates.sort((a, b) => b.score - a.score);
//   const bestCandidate = namesCandidates[0];
  
//   console.log('이름 후보들:', namesCandidates);
  
//   if (bestCandidate.score > 0) {
//     data.name = bestCandidate.name;
//     console.log('✅ 선택된 이름:', bestCandidate.name, '(타입:', bestCandidate.type, ') 점수:', bestCandidate.score);
//   }
// }

// // 7. 직책 추출
// const positionCandidates: { position: string; score: number }[] = [];

// for (let i = 0; i < Math.min(10, lines.length); i++) {
//   const line = lines[i];
//   const lowerLine = line.toLowerCase();
  
//   for (const keyword of positionKeywords) {
//     if (lowerLine.includes(keyword)) {
//       let score = 10;
      
//       if (data.name && line.includes(data.name)) {
//         score += 20;
//       }
      
//       if (line.trim() === keyword || /^[가-힣]+$/.test(line.trim())) {
//         score += 15;
//       }
      
//       score += (10 - i);
      
//       positionCandidates.push({ position: line.trim(), score });
//     }
//   }
// }

// if (positionCandidates.length > 0) {
//   positionCandidates.sort((a, b) => b.score - a.score);
//   data.position = positionCandidates[0].position;
//   console.log('✅ 선택된 직책:', data.position);
// }

// return data;
// };


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