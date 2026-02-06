'use client';

import { useState, useRef, useEffect } from 'react';
import type { BusinessCardData } from '../app/page';

interface DataEditorProps {
  initialData: BusinessCardData;
  onSave: (data: BusinessCardData) => void;
  onBack: () => void;
}

export default function DataEditor({ initialData, onSave, onBack }: DataEditorProps) {
  const [data, setData] = useState<BusinessCardData>(initialData);
  const [isRecording, setIsRecording] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'keyboard'>('voice');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.lang = 'ko-KR';
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleChange('personalizedMessage', transcript);
          setIsRecording(false);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const handleChange = (field: keyof BusinessCardData, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(data);
  };

  const startRecording = () => {
    if (recognition) {
      setIsRecording(true);
      recognition.start();
    } else {
      alert('음성 인식을 지원하지 않는 브라우저입니다. 키보드 입력을 사용해주세요.');
      setInputMode('keyboard');
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const toggleInputMode = () => {
    if (isRecording) {
      stopRecording();
    }
    setInputMode(prev => prev === 'voice' ? 'keyboard' : 'voice');
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center gap-3 flex-shrink-0 safe-area-top">
        <button
          onClick={onBack}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          ←
        </button>
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
          ✏️ 정보 확인 및 수정
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 min-h-0">
        <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            명함의 형태에 따라 아직 성함 및 직책이 인식이 덜 되거나 잘 못 될 수 있습니다. 개선 중이니 보고 수정입력하시면 더 좋습니다. 개선하겠습니다!
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">👤 이름</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🏢 회사명</label>
            <input
              type="text"
              value={data.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="회사 이름"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">💼 직책</label>
            <input
              type="text"
              value={data.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="대표이사"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📧 이메일</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📞 전화번호</label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📍 주소</label>
            <input
              type="text"
              value={data.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="서울시 강남구..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🌐 웹사이트</label>
            <input
              type="url"
              value={data.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="https://example.com"
            />
          </div>

          <div className="pt-4 border-t-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">💬 개인화된 메시지</label>
              <button
                type="button"
                onClick={toggleInputMode}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {inputMode === 'voice' ? (
                  <>⌨️ <span>키보드 입력</span></>
                ) : (
                  <>🎤 <span>음성 입력</span></>
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-3">
              {inputMode === 'voice' 
                ? '🎤 음성으로 메시지를 입력하세요' 
                : '⌨️ 키보드로 메시지를 입력하세요'}
            </p>

            {inputMode === 'voice' ? (
              <div className="relative">
                <textarea
                  value={data.personalizedMessage || ''}
                  onChange={(e) => handleChange('personalizedMessage', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none min-h-[120px] resize-none"
                  placeholder="예: 회의에서 좋은 대화 나눴습니다."
                  readOnly={isRecording}
                />
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`absolute bottom-3 right-3 p-4 rounded-full font-bold transition-all shadow-lg ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isRecording ? '⏹️' : '🎤'}
                </button>
              </div>
            ) : (
              <textarea
                value={data.personalizedMessage || ''}
                onChange={(e) => handleChange('personalizedMessage', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none min-h-[120px] resize-y"
                placeholder="예: 회의에서 좋은 대화 나눴습니다."
              />
            )}
          </div>

          {data.rawText && (
            <div>
              <button
                type="button"
                onClick={() => {
                  const elem = document.getElementById('rawText');
                  if (elem) {
                    elem.classList.toggle('hidden');
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 mb-2"
              >
                ▶ 인식된 원본 텍스트 보기
              </button>
              <pre
                id="rawText"
                className="hidden bg-gray-100 p-4 rounded-lg text-xs overflow-auto max-h-40"
              >
                {data.rawText}
              </pre>
            </div>
          )}

          <div className="h-4"></div>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 border-t border-gray-200 flex-shrink-0 safe-area-bottom shadow-lg">
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          💾 저장하고 계속
        </button>
      </div>
    </div>
  );
}
