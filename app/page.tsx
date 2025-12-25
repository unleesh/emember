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
  rawText: string;
}

export default function Home() {
  const [step, setStep] = useState<'camera' | 'ocr' | 'edit' | 'sheets'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<BusinessCardData | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    setStep('ocr');
  };

  const handleOCRComplete = (data: BusinessCardData) => {
    setExtractedData(data);
    setStep('edit');
  };

  const handleEditComplete = (data: BusinessCardData) => {
    setExtractedData(data);
    setStep('sheets');
  };

  const handleSaveComplete = () => {
    // 저장 완료 후 초기화
    setCapturedImage(null);
    setExtractedData(null);
    setStep('camera');
  };

  const handleReset = () => {
    setCapturedImage(null);
    setExtractedData(null);
    setStep('camera');
    setShowCamera(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 safe-top shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🎴</span> 명함 스캐너
        </h1>
        <p className="text-sm opacity-90 mt-1">
          명함을 스캔하고 자동으로 정리해보세요
        </p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-auto">
        {step === 'camera' && !showCamera && (
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📷</span>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  명함을 스캔하세요
                </h2>
                
                <p className="text-gray-600 mb-8">
                  카메라로 명함을 촬영하면 자동으로 정보를 추출하고 Google Sheets에 저장해드립니다.
                </p>

                <button
                  onClick={() => setShowCamera(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all active:scale-95"
                >
                  📸 카메라 시작하기
                </button>

                <div className="mt-6 space-y-2 text-sm text-gray-500">
                  <p>💡 명함이 잘 보이도록 조명을 조절하세요</p>
                  <p>📐 명함이 화면에 꽉 차도록 촬영하세요</p>
                  <p>✨ 흐릿하지 않게 초점을 맞추세요</p>
                </div>
              </div>

              {/* 기능 소개 */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow text-center">
                  <span className="text-2xl block mb-2">📷</span>
                  <p className="text-xs text-gray-600">카메라<br/>촬영</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow text-center">
                  <span className="text-2xl block mb-2">🤖</span>
                  <p className="text-xs text-gray-600">AI<br/>인식</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow text-center">
                  <span className="text-2xl block mb-2">📊</span>
                  <p className="text-xs text-gray-600">자동<br/>저장</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCamera && (
          <CameraCapture
            onCapture={handleCapture}
            onClose={() => setShowCamera(false)}
          />
        )}

        {step === 'ocr' && capturedImage && (
          <OCRProcessor
            imageData={capturedImage}
            onComplete={handleOCRComplete}
            onBack={handleReset}
          />
        )}

        {step === 'edit' && extractedData && (
          <DataEditor
            data={extractedData}
            onComplete={handleEditComplete}
            onBack={() => setStep('ocr')}
          />
        )}

        {step === 'sheets' && extractedData && (
          <GoogleSheetsService
            data={extractedData}
            onComplete={handleSaveComplete}
            onBack={() => setStep('edit')}
          />
        )}
      </div>

      {/* 푸터 */}
      <div className="bg-white border-t border-gray-200 p-4 safe-bottom text-center text-xs text-gray-500">
        <p>💡 Google Sheets API 연동으로 자동 저장됩니다</p>
      </div>
    </div>
  );
}
