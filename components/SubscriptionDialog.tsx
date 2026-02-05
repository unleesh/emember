'use client';

import { useState } from 'react';

interface SubscriptionDialogProps {
  cardCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubscriptionDialog({ cardCount, onClose, onSuccess }: SubscriptionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const PortOne = (window as any).PortOne;
      if (!PortOne) {
        throw new Error('결제 모듈을 불러올 수 없습니다.');
      }

      // ✅ localStorage에서 먼저 확인
      const configStr = localStorage.getItem('emember_config');
      let spreadsheetId = null;
      
      if (configStr) {
        try {
          const userConfig = JSON.parse(configStr);
          spreadsheetId = userConfig.spreadsheetId;
          console.log('✅ localStorage에서 spreadsheetId 찾음:', spreadsheetId?.substring(0, 15) + '...');
        } catch (e) {
          console.error('Config parse error:', e);
        }
      }
      
      // ✅ 없으면 API에서 가져오기
      if (!spreadsheetId) {
        console.log('⚠️ localStorage 없음, API에서 가져옴...');
        
        // API로 현재 spreadsheetId 요청
        const checkResponse = await fetch('/api/subscription/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userConfig: null }),
        });
        
        if (!checkResponse.ok) {
          throw new Error('스프레드시트 정보를 가져올 수 없습니다.');
        }
        
        const checkData = await checkResponse.json();

        // 서버에서 사용 중인 spreadsheetId를 그대로 사용
        spreadsheetId = checkData.spreadsheetId;

        if (!spreadsheetId) {
          throw new Error('스프레드시트 설정이 필요합니다. /setup 페이지에서 먼저 설정하세요.');
        }
      }

      console.log('✅ spreadsheetId:', spreadsheetId.substring(0, 15) + '...');

      // 결제 정보 생성
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: '사용자',
          customerEmail: 'user@emember.app',
          spreadsheetId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '결제 정보 생성에 실패했습니다.');
      }

      const paymentData = await response.json();
      
      console.log('결제 정보:', paymentData);

      if (!paymentData.storeId || !paymentData.channelKey) {
        throw new Error('결제 설정이 완료되지 않았습니다.');
      }

      // PortOne 결제창 호출
      const paymentResponse = await PortOne.requestPayment({
        storeId: paymentData.storeId,
        paymentId: paymentData.orderId,
        orderName: paymentData.productName,
        totalAmount: paymentData.amount,
        currency: 'CURRENCY_KRW',
        channelKey: paymentData.channelKey,
        payMethod: 'CARD',
        customer: {
          fullName: '사용자',
          email: 'user@emember.app',
        },
        customData: {
          spreadsheetId: spreadsheetId,
          customerEmail: 'user@emember.app',
        },
      });

      console.log('결제 응답:', paymentResponse);

      if (paymentResponse?.code != null) {
        throw new Error(paymentResponse.message || '결제에 실패했습니다.');
      }

      // 1초 정도 대기 시간을 주어 자연스럽게 연출 (선택 사항)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert('✅ 프리미엄 구독이 완료되었습니다!\n이제 무제한으로 명함을 저장할 수 있습니다.');
      onSuccess();

    } catch (err: any) {
      console.error('❌ 결제 오류:', err);
      setError(err.message || '결제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          💳 프리미엄으로 업그레이드
        </h2>

        <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl mb-6">
          <p className="text-yellow-800 font-medium mb-2">
            ⚠️ 무료 한도 초과
          </p>
          <p className="text-sm text-yellow-700">
            현재 <strong>{cardCount}명</strong>의 명함이 저장되어 있습니다.<br/>
            무료는 5명까지만 가능하며, 더 저장하려면 프리미엄 구독이 필요합니다.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl mb-6">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              ₩4,900<span className="text-lg font-normal text-gray-600">/월</span>
            </div>
            <p className="text-sm text-gray-600">첫 달 무료 체험</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <span>🎉 <strong>무제한 명함 저장</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <span>Google Sheets 자동 저장</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <span>음성 메시지 입력</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <span>언제든 취소 가능</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            <strong>오류:</strong> {error}
            {error.includes('설정') && (
              <div className="mt-2">
                <a 
                  href="/setup" 
                  className="text-blue-600 hover:underline font-semibold"
                >
                  → 설정 페이지로 이동
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-300 disabled:opacity-50 transition-all"
          >
            나중에
          </button>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? '처리 중...' : '지금 구독하기'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          💳 안전한 결제는 토스페이먼츠로 처리됩니다
        </p>
      </div>
    </div>
  );
}