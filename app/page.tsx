'use client';

import { useState } from 'react';
import CameraCapture from '../components/CameraCapture';
import OCRProcessor from '../components/OCRProcessor';
import DataEditor from '../components/DataEditor';
import GoogleSheetsService from '../components/GoogleSheetsService';

export interface BusinessCardData {
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  personalizedMessage?: string;
  rawText?: string;
}

type AppStep = 'home' | 'camera' | 'ocr' | 'edit' | 'sheets';

export default function Home() {
  const [step, setStep] = useState<AppStep>('home');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<BusinessCardData | null>(null);
  const [editedData, setEditedData] = useState<BusinessCardData | null>(null);

  const handleStartScan = () => {
    setStep('camera');
  };

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setStep('ocr');
  };

  const handleOCRComplete = (data: BusinessCardData) => {
    setOcrData(data);
    setEditedData(data);
    setStep('edit');
  };

  const handleEditComplete = (data: BusinessCardData) => {
    setEditedData(data);
    setStep('sheets');
  };

  const handleSaveComplete = () => {
    setStep('home');
    setCapturedImage(null);
    setOcrData(null);
    setEditedData(null);
  };

  const handleBack = () => {
    if (step === 'camera') {
      setStep('home');
    } else if (step === 'ocr') {
      setStep('camera');
      setCapturedImage(null);
    } else if (step === 'edit') {
      setStep('ocr');
    } else if (step === 'sheets') {
      setStep('edit');
    }
  };

  return (
    <main className="h-screen w-screen overflow-hidden">
      {step === 'home' && (
        <div className="h-full flex flex-col bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
          <div className="p-6 text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              📇 emember
            </h1>
            <p className="text-blue-100">명함 스캔부터 이메일 발송까지 자동화</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">📸</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  명함을 스캔하세요
                </h2>
                <p className="text-gray-600">
                  AI가 자동으로 정보를 추출하고<br />
                  Google Sheets에 저장합니다
                </p>
              </div>

              <button
                onClick={handleStartScan}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 mb-3"
              >
                📷 스캔 시작하기
              </button>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => window.location.href = '/setup'}
                  className="bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all text-sm"
                >
                  ⚙️ 기본 설정
                </button>
                <button
                  onClick={() => window.location.href = '/email-setup'}
                  className="bg-purple-100 text-purple-700 py-3 rounded-xl font-medium hover:bg-purple-200 transition-all text-sm"
                >
                  📧 이메일 설정
                </button>
              </div>

              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Google Cloud Vision으로 정확한 인식</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Google Sheets 자동 저장</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span>
                  <span>AI로 이메일 자동 작성 (선택)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'camera' && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setStep('home')}
        />
      )}

      {step === 'ocr' && capturedImage && (
        <OCRProcessor
          imageData={capturedImage}
          onComplete={handleOCRComplete}
          onBack={handleBack}
        />
      )}

      {step === 'edit' && editedData && (
        <DataEditor
          initialData={editedData}
          onSave={handleEditComplete}
          onBack={handleBack}
        />
      )}

      {step === 'sheets' && editedData && (
        <GoogleSheetsService
          businessCardData={editedData}
          onComplete={handleSaveComplete}
          onBack={handleBack}
        />
      )}
    </main>
  );
}
