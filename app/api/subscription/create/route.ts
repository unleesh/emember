import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { customerName, customerEmail } = await request.json();

    const timestamp = Date.now();
    const orderId = `emember_sub_${timestamp}`;

    // ✅ 환경 변수 포함해서 반환
    const paymentData = {
      orderId,
      storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
      channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
      productName: process.env.SUBSCRIPTION_PRODUCT_NAME || 'emember 프리미엄',
      amount: parseInt(process.env.SUBSCRIPTION_PRICE || '4900'),
    };

    console.log('결제 정보 생성:', { ...paymentData, storeId: paymentData.storeId?.substring(0, 20) + '...' });

    // ✅ 필수 값 확인
    if (!paymentData.storeId || !paymentData.channelKey) {
      return NextResponse.json(
        { error: '결제 설정이 완료되지 않았습니다. PORTONE 환경 변수를 확인하세요.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...paymentData,
    });

  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}