'use client';

import { useState } from 'react';
import type { BusinessCardData } from '../app/page';
import SubscriptionDialog from './SubscriptionDialog';

interface GoogleSheetsServiceProps {
  businessCardData: BusinessCardData;
  onComplete: () => void;
  onBack: () => void;
}

export default function GoogleSheetsService({
  businessCardData,
  onComplete,
  onBack,
}: GoogleSheetsServiceProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [cardCount, setCardCount] = useState(0);

  const handleSave = async () => {
  setIsSaving(true);
  setError(null);

  try {
    // ✅ 1. 구독 상태 확인 (신규 추가)
    const checkResponse = await fetch('/api/subscription/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userConfig: null // 환경 변수 사용
      }),
    });

    const checkResult = await checkResponse.json();

    // ✅ 2. 5명 초과 시 구독 체크 (신규 추가)
    if (checkResult.needsSubscription) {
      const subscriptionStr = localStorage.getItem('emember_subscription');
      const subscription = subscriptionStr ? JSON.parse(subscriptionStr) : null;

      if (!subscription || !subscription.subscribed) {
        // 구독 필요 → 결제 다이얼로그 표시
        setCardCount(checkResult.cardCount);
        setShowSubscriptionDialog(true);
        setIsSaving(false);
        return; // 여기서 중단!
      }
    }
    // (여기까지 신규 추가)

    // ✅ 3. 기존 저장 로직 (그대로 유지)
    const response = await fetch('/api/sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessCardData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '저장 실패');
    }

    setSavedUrl(result.url);
  } catch (err: any) {
    console.error('저장 오류:', err);
    setError(err.message || '알 수 없는 오류가 발생했습니다.');
  } finally {
    setIsSaving(false);
  }
};

const handleSubscriptionSuccess = () => {
  setShowSubscriptionDialog(false);
  // 구독 완료 후 자동으로 저장 재시도
  handleSave();
};

  if (savedUrl) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4">
          <h2 className="text-white text-lg font-bold">✅ 저장 완료</h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <span className="text-6xl block mb-6">🎉</span>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              명함 정보가 저장되었습니다!
            </h3>

            <a
              href={savedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all mb-4"
            >
              📊 스프레드시트 열기
            </a>

            <button
              onClick={onComplete}
              className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              새 명함 스캔하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center gap-3">
        <button onClick={onBack} className="text-white hover:bg-white/20 rounded-full p-2">
          ←
        </button>
        <h2 className="text-white text-lg font-bold">💾 Google Sheets 저장</h2>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          {error ? (
            <>
              <div className="text-center mb-6">
                <span className="text-6xl block mb-4">⚠️</span>
                <h3 className="text-xl font-bold text-red-600 mb-2">저장 실패</h3>
                <p className="text-gray-600">{error}</p>
              </div>
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700"
              >
                다시 시도
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <span className="text-6xl block mb-4">📊</span>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  명함 정보 저장
                </h3>
                <p className="text-gray-600">
                  Google Sheets에 저장할 준비가 완료되었습니다
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm max-h-[400px] overflow-y-auto">
                <div><strong>이름:</strong> {businessCardData.name || '-'}</div>
                <div><strong>회사:</strong> {businessCardData.company || '-'}</div>
                <div><strong>직책:</strong> {businessCardData.position || '-'}</div>
                <div><strong>이메일:</strong> {businessCardData.email || '-'}</div>
                <div><strong>전화:</strong> {businessCardData.phone || '-'}</div>
                {businessCardData.personalizedMessage && (
                  <div className="pt-2 border-t border-gray-300">
                    <strong>💬 메시지:</strong>
                    <p className="mt-1 text-gray-700 bg-white p-2 rounded border border-gray-200">
                      {businessCardData.personalizedMessage}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    저장 중...
                  </span>
                ) : (
                  '💾 저장하기'
                )}
              </button>
            </>
          )}
        </div>
      </div>
      {showSubscriptionDialog && (
      <SubscriptionDialog
        cardCount={cardCount}
        onClose={() => {
          setShowSubscriptionDialog(false);
          setIsSaving(false);
        }}
        onSuccess={handleSubscriptionSuccess}
      />
    )}
    </div>
  );
}
