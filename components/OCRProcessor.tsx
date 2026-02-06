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
  console.log("=== OCR 텍스트 ===");
  console.log(text);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

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
  // 1) 이메일
  // --------------------------
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/;
  const email = text.match(emailRegex);
  if (email) data.email = email[0];

  // --------------------------
  // 2) 웹사이트
  // --------------------------
  const websiteRegex = /(https?:\/\/|www\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
  const website = text.match(websiteRegex);
  if (website) data.website = website[0].replace(/^www\./, "https://www.");

  // --------------------------
  // 3) 전화번호 (+82 변환 포함)
  // --------------------------
  const cleanNum = (num: string) =>
    num.replace(/[^0-9]/g, ""); // 숫자만 남기기

  let phone = "";

  // +82 패턴
  const intl = text.match(/\+82\s?10[\s.-]?\d{3,4}[\s.-]?\d{4}/);
  if (intl) {
    let digits = cleanNum(intl[0]); // 8210XXXXYYYY
    digits = digits.replace(/^82/, "0"); // → 010xxxxYYYY
    phone = digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }

  // 기본 한국 휴대폰 (010)
  if (!phone) {
    const m = text.match(/010[\s.-]?\d{3,4}[\s.-]?\d{4}/);
    if (m) {
      let digits = cleanNum(m[0]);
      phone = digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    }
  }

  if (phone) data.phone = phone;

  // --------------------------
  // 4) 이름 (한글 2–4글자)
  // --------------------------
  const nameCandidate = lines.find((l) => /^[가-힣]{2,4}$/.test(l));
  if (nameCandidate) data.name = nameCandidate;

  // --------------------------
  // 5) 직책 (영문 + 한국어)
  // --------------------------
  const positionKeywords = [
    "CEO", "CFO", "COO", "CTO", "CDO", "CMO", "CIO",
    "Founder", "Co-founder", "Co-founder", "Co Founder",
    "President", "Director", "Manager", "Lead", "Head",
    "Executive", "Partner", "Principal", "Advisor",
    "Engineer", "Designer", "Developer",
    "대표", "이사", "상무", "부장", "팀장", "실장", "본부장", "센터장",
  ];

  for (const line of lines) {
    if (positionKeywords.some((kw) => line.toLowerCase().includes(kw.toLowerCase()))) {
      data.position = line;
      break;
    }
  }

  // --------------------------
  // 6) 회사명 (도메인 기반 + 한글 + 영문 조합)
  // --------------------------
  const companyCandidates: string[] = [];

  // 이메일 도메인 기반
  if (data.email) {
    const domain = data.email.split("@")[1].split(".")[0];
    companyCandidates.push(domain);
  }

  // 한글 회사명
  for (const line of lines) {
    if (/^[가-힣A-Za-z\s]{2,20}$/.test(line) && !/대표|이사|팀장/.test(line)) {
      companyCandidates.push(line);
    }
  }

  // 영문 회사명
  for (const line of lines) {
    if (/[A-Za-z]{2,}/.test(line) && line.length < 20) {
      companyCandidates.push(line);
    }
  }

  // 회사명 선택
  if (companyCandidates.length > 0) {
    const unique = [...new Set(companyCandidates)];
    data.company = unique[0];
  }

  // ⭐ 요구사항: 회사명은 항상 "큐리에이아이"로 통일
  data.company = "큐리에이아이";

  // --------------------------
  // 7) 주소 (2줄 이상이면 자동 합쳐서 1줄로 변환)
  // --------------------------
  const addressLines = lines.filter((l) => /(도|시|구|동|로|길)/.test(l));

  if (addressLines.length > 0) {
    // 여러 줄 → 한 줄로 병합
    const merged = addressLines.join(" ").replace(/\s+/g, " ").trim();
    data.address = merged;
  }

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
