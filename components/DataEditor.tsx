'use client';

import { useState } from 'react';
import type { BusinessCardData } from '../app/page';

interface DataEditorProps {
  data: BusinessCardData;
  onComplete: (data: BusinessCardData) => void;
  onBack: () => void;
}

export default function DataEditor({ data: initialData, onComplete, onBack }: DataEditorProps) {
  const [data, setData] = useState<BusinessCardData>(initialData);
  const [showRawText, setShowRawText] = useState(false);

  const handleChange = (field: keyof BusinessCardData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(data);
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
          ✏️ 정보 확인 및 수정
        </h2>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              👤 이름 *
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="홍길동"
              required
            />
          </div>

          {/* 회사명 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🏢 회사명
            </label>
            <input
              type="text"
              value={data.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="(주)회사명"
            />
          </div>

          {/* 직책 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              💼 직책
            </label>
            <input
              type="text"
              value={data.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="부장, 매니저 등"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📧 이메일
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="email@example.com"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📞 전화번호
            </label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="010-1234-5678"
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📍 주소
            </label>
            <input
              type="text"
              value={data.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="서울시 강남구..."
            />
          </div>

          {/* 웹사이트 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🌐 웹사이트
            </label>
            <input
              type="url"
              value={data.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="https://example.com"
            />
          </div>

          {/* 원본 텍스트 토글 */}
          <div className="pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <span>{showRawText ? '▼' : '▶'}</span>
              <span>인식된 원본 텍스트 보기</span>
            </button>
            
            {showRawText && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                  {data.rawText}
                </pre>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* 하단 버튼 */}
      <div className="bg-white border-t-2 border-gray-200 p-4 space-y-2">
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all active:scale-95"
        >
          ✓ 확인 완료 - Google Sheets에 저장
        </button>
        <p className="text-xs text-gray-500 text-center">
          💡 정보를 확인하고 수정한 후 저장하세요
        </p>
      </div>
    </div>
  );
}
