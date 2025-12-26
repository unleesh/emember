'use client';

import { useState } from 'react';
import type { BusinessCardData } from '../app/page';

interface DataEditorProps {
  initialData: BusinessCardData;
  onSave: (data: BusinessCardData) => void;
  onBack: () => void;
}

export default function DataEditor({ initialData, onSave, onBack }: DataEditorProps) {
  const [data, setData] = useState<BusinessCardData>(initialData);

  const handleChange = (field: keyof BusinessCardData, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* 헤더 - 고정 */}
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

      {/* 폼 - 가변 (스크롤 가능) */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 min-h-0">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              👤 이름
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="홍길동"
            />
          </div>

          {/* 회사명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🏢 회사명
            </label>
            <input
              type="text"
              value={data.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="회사 이름"
            />
          </div>

          {/* 직책 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              💼 직책
            </label>
            <input
              type="text"
              value={data.position}
              onChange={(e) => handleChange('position', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="대표이사"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
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

          {/* 원본 텍스트 (선택사항) */}
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

          {/* 하단 여백 (버튼 높이만큼) */}
          <div className="h-4"></div>
        </div>
      </div>

      {/* 저장 버튼 - 고정 하단 */}
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