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
      // ✅ 1. PortOne SDK 확인
      if (typeof window === 'undefined') {
        throw new Error('브라우저 환경이 아닙니다.');
      }

      const PortOne = (window as any).PortOne;
      
      if (!PortOne) {
        throw new Error('결제 모듈을 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      }

      console.log('✅ PortOne SDK 로드 완료');

      // ✅ 2. 결제 정보 생성 (서버에서 환경 변수 가져오기)
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: '사용자',
          customerEmail: 'user@emember.app',
        }),
      });

      if (!response.ok) {
        throw new Error('결제 정보 생성에 실패했습니다.');
      }

      const paymentData = await response.json();
      
      console.log('결제 정보:', paymentData);

      // ✅ 3. 필수 값 확인
      if (!paymentData.storeId || !paymentData.channelKey) {
        throw new Error('결제 설정이 완료되지 않았습니다. 관리자에게 문의하세요.');
      }

      // ✅ 4. PortOne 결제창 호출
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
      });

      console.log('결제 응답:', paymentResponse);

      // ✅ 5. 결제 실패 체크
      if (paymentResponse?.code != null) {
        throw new Error(paymentResponse.message || '결제에 실패했습니다.');
      }

      // ✅ 6. 성공 처리
      localStorage.setItem('emember_subscription', JSON.stringify({
        subscribed: true,
        subscribedAt: new Date().toISOString(),
        orderId: paymentData.orderId,
        amount: paymentData.amount,
      }));

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