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

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const optimized = canvas.toDataURL('image/jpeg', 0.8);
        resolve(optimized);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });
  };

  const processWithGoogleVision = async () => {
    try {
      setError(null);
      setStatus('이미지 최적화 중...');
      setProgress(10);

      const optimizedImage = await optimizeImageForVision(imageData);

      setStatus('Google Cloud Vision API 호출 중...');
      setProgress(20);

      const response = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: optimizedImage }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Vision API Error');

      setProgress(60);
      setStatus('텍스트 분석 중...');

      const text = result?.responses?.[0]?.fullTextAnnotation?.text;
      if (!text) throw new Error('텍스트를 인식할 수 없습니다.');

      setProgress(90);
      setStatus('정보 추출 중...');

      const extractedData = extractBusinessCardInfo(text);
      setProgress(100);

      setTimeout(() => onComplete(extractedData), 500);
    } catch (err: any) {
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
      });

      setStatus('명함 이미지 분석 중...');
      const { data: { text } } = await worker.recognize(imageData);

      setProgress(95);
      setStatus('정보 추출 중...');
      await worker.terminate();

      const extractedData = extractBusinessCardInfo(text);

      setProgress(100);
      setTimeout(() => onComplete(extractedData), 500);
    } catch (err) {
      console.error(err);
      setError('OCR 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const extractBusinessCardInfo = (text: string): BusinessCardData => {
  console.log("=== OCR 원본 텍스트 ===");
  console.log(text);
  console.log("===================");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  console.log("=== 라인별 텍스트 ===");
  lines.forEach((line, idx) => {
    console.log(`${idx}: "${line}"`);
  });
  console.log("===================");

  const data: BusinessCardData = {
    name: "",
    company: "",
    position: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    rawText: text,
  };

  // --------------------------
  // 1) 이메일 (E, M, T, W, F 등 모든 접두사 제거)
  // --------------------------
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
  const emailMatches = text.match(emailRegex);
  
  if (emailMatches && emailMatches.length > 0) {
    let cleanEmail = emailMatches[0];
    
    console.log("이메일 매칭:", emailMatches);
    console.log("이메일 원본:", cleanEmail);
    
    // ✅ 모든 접두사 패턴 처리
    const prefixWithSeparator = /^[EMTWF][\s:.\-]+/i;
    if (prefixWithSeparator.test(cleanEmail)) {
      const original = cleanEmail;
      cleanEmail = cleanEmail.replace(prefixWithSeparator, '');
      console.log(`✅ 접두사+구분자 제거: "${original}" → "${cleanEmail}"`);
    } else {
      const prefixPattern = /^[EMTWF]([a-z])/i;
      if (prefixPattern.test(cleanEmail)) {
        const original = cleanEmail;
        cleanEmail = cleanEmail.replace(/^[EMTWF]/i, '');
        console.log(`✅ 접두사 제거 (바로 소문자): "${original}" → "${cleanEmail}"`);
      }
    }
    
    console.log("✅ 최종 이메일:", cleanEmail);
    data.email = cleanEmail;
  }

  // --------------------------
  // 2) 전화번호 (M+82, M 010 등)
  // --------------------------
  const cleanNum = (num: string) => num.replace(/[^0-9]/g, "");

  let phone = "";
  
  const intlPattern = /[MT]?\+?82\s?10[\s.\-]?\d{3,4}[\s.\-]?\d{4}/gi;
  const intlMatch = text.match(intlPattern);
  
  if (intlMatch) {
    let digits = cleanNum(intlMatch[0]);
    console.log("✅ 국제번호 인식:", intlMatch[0], "→ 숫자:", digits);
    
    if (digits.startsWith('82')) {
      digits = '0' + digits.substring(2);
    }
    
    if (digits.startsWith('010') && digits.length >= 10) {
      phone = digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
      console.log("✅ 전화번호 변환:", phone);
    }
  }
  
  if (!phone) {
    const phonePattern = /[MT]?\s?010[\s.\-]?\d{3,4}[\s.\-]?\d{4}/gi;
    const phoneMatch = text.match(phonePattern);
    
    if (phoneMatch) {
      const digits = cleanNum(phoneMatch[0]);
      if (digits.length >= 10) {
        phone = digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
        console.log("✅ 일반 전화번호:", phone);
      }
    }
  }
  
  if (phone) data.phone = phone;

  // --------------------------
  // 3) 웹사이트 (W 접두사 처리)
  // --------------------------
  for (const line of lines) {
    if (line.includes('@')) continue;
    
    let cleanLine = line.replace(/^W\s*/i, '');
    
    const urlMatch = cleanLine.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      data.website = urlMatch[1];
      console.log("✅ URL 발견:", data.website);
      continue;
    }
    
    const wwwMatch = cleanLine.match(/(www\.[^\s/]+)/);
    if (wwwMatch) {
      data.website = `https://${wwwMatch[1]}`;
      console.log("✅ www 발견:", data.website);
      continue;
    }
    
    const domainPattern = /([a-z0-9-]+\.(?:com|kr|net|org|io|ai|co\.kr))/i;
    const domainMatch = cleanLine.match(domainPattern);
    
    if (domainMatch) {
      const domain = domainMatch[1];
      data.website = `https://${domain}`;
      console.log("✅ 도메인 발견:", data.website);
      break;
    }
  }

  // --------------------------
  // 4) 이름 (한글 2-4글자)
  // --------------------------
  for (const line of lines) {
    if (/^[가-힣]{2,4}$/.test(line)) {
      data.name = line;
      break;
    }
  }

  // --------------------------
  // 5) 직책 (키워드 확장)
  // --------------------------
  const positionKeywords = [
    "CEO", "CFO", "COO", "CTO", "CDO", "CMO", "CIO",
    "Founder", "Co-founder", "Director", "Manager", "Lead", "Head",
    "Executive", "Partner", "Principal", "Advisor",
    "Engineer", "Designer", "Developer", "Marketer",
    "대표", "이사", "상무", "부장", "팀장", "실장", "본부장", "센터장",
    "매니저", "심사역", "연구원", "컨설턴트", "전문위원", "수석",
    "투자", "마케팅", "개발", "디자인", "기획", "운영", "인사", "재무",
  ];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (positionKeywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      if (!data.position) {
        data.position = line;
      } else if (line.includes('/')) {
        data.position += ` ${line}`;
      }
      console.log("✅ 직책 발견:", line);
      if (!line.includes('/')) break;
    }
  }

  // --------------------------
  // 6) 회사명 - 가장 긴 것 선택
  // --------------------------
  const excludeWords = [
    data.name, data.position,
    "Tel", "Mobile", "Fax", "Email", "CEO", "Director",
    "서울", "경기", "강남", "도", "시", "구", "로", "길",
    "TIPS", "운영사", "혁신",
  ];

  const isExcluded = (str: string) => {
    if (!str || str.length < 2) return true;
    if (str.includes('@') || /010/.test(str) || /\+82/.test(str)) return true;
    return excludeWords.some(w => w && str.includes(w));
  };

  const companyCandidates: string[] = [];
  const corpCandidates: string[] = [];

  // ✅ (주) 패턴
  for (const line of lines) {
    const match1 = line.match(/([가-힣A-Za-z0-9&\s]{2,20})\s*\(주\)/);
    const match2 = line.match(/\(주\)\s*([가-힣A-Za-z0-9&\s]{2,20})/);
    
    if (match1) {
      const name = match1[1].trim();
      if (!isExcluded(name)) {
        corpCandidates.push(name);
        console.log("✅ (주) 패턴:", name);
      }
    } else if (match2) {
      const name = match2[1].trim();
      if (!isExcluded(name)) {
        corpCandidates.push(name);
        console.log("✅ (주) 패턴:", name);
      }
    }
  }

  // ✅ 영문 회사명 (& 포함)
  for (const line of lines) {
    if (/^[A-Za-z][A-Za-z0-9&\s]{1,29}$/.test(line) && !isExcluded(line)) {
      const trimmed = line.trim();
      if (trimmed.length >= 2 && trimmed !== data.name) {
        companyCandidates.push(trimmed);
        console.log("✅ 영문 회사명 후보:", trimmed);
      }
    }
  }

  // ✅ 이메일 도메인
  if (data.email) {
    const domain = data.email.split("@")[1]?.split(".")[0];
    if (domain && domain.length >= 2) {
      companyCandidates.push(domain);
      console.log("✅ 이메일 도메인:", domain);
    }
  }

  // ✅ 순수 한글
  for (const line of lines) {
    if (/^[가-힣]{2,10}$/.test(line) && !isExcluded(line)) {
      companyCandidates.push(line);
    }
  }

  console.log("회사명 후보:", companyCandidates);

  // ✅ 선택: 가장 긴 것
  if (corpCandidates.length > 0) {
    // (주) 패턴 최우선 (가장 긴 것)
    data.company = corpCandidates.sort((a, b) => b.length - a.length)[0];
    console.log("✅ (주) 패턴 선택 (가장 긴 것):", data.company);
  } else if (companyCandidates.length > 0) {
    // 일반 후보 중 가장 긴 것
    data.company = companyCandidates.sort((a, b) => b.length - a.length)[0];
    console.log("✅ 회사명 선택 (가장 긴 것):", data.company);
  }

  // 정제
  if (data.company) {
    data.company = data.company
      .replace(/\(주\)/g, '')
      .replace(/주식회사/g, '')
      .trim();
  }

  // --------------------------
  // 7) 주소
  // --------------------------
  const addressLines = lines.filter((l) => 
    /(시|구|동|로|길|빌딩|층|플러스)/.test(l) && !l.includes('@')
  );

  if (addressLines.length > 0) {
    data.address = addressLines.join(" ").replace(/\s+/g, " ").trim();
  }

  console.log("=== 최종 결과 ===");
  console.log("이름:", data.name);
  console.log("회사:", data.company);
  console.log("직책:", data.position);
  console.log("이메일:", data.email);
  console.log("전화:", data.phone);
  console.log("웹사이트:", data.website);
  console.log("주소:", data.address);
  console.log("===============");

  return data;
};



  // 🔥🔥🔥 여기 중괄호가 중요 — 컴포넌트 return 포함!
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
            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <img
                src={imageData}
                alt="Captured business card"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-800 font-bold">{status}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {useGoogleVision ? '🌟 Google Vision API 사용 중' : '📚 Tesseract 사용 중'}
                </p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">{progress}%</p>

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
