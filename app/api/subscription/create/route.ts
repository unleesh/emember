import { NextRequest, NextResponse } from 'next/server';

/**
 * PortOne 결제 정보 생성
 */
export async function POST(request: NextRequest) {
  try {
    const { customerName, customerEmail } = await request.json();

    // 고유한 주문 ID 생성
    const timestamp = Date.now();
    const orderId = `emember_sub_${timestamp}`;
    const customerUid = `customer_${customerEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;

    const productInfo = {
      orderId,
      customerUid,
      storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
      productName: process.env.SUBSCRIPTION_PRODUCT_NAME || 'emember 프리미엄',
      amount: parseInt(process.env.SUBSCRIPTION_PRICE || '4900'),
    };

    console.log('결제 정보 생성:', productInfo);

    return NextResponse.json({
      success: true,
      ...productInfo,
    });

  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
