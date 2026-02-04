import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { customerName, customerEmail, spreadsheetId } = await request.json();

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'spreadsheetId 필요' }, { status: 400 });
    }

    const orderId = `emember_sub_${Date.now()}`;

    const paymentData = {
      orderId,
      storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
      channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
      productName: process.env.SUBSCRIPTION_PRODUCT_NAME || 'emember 프리미엄',
      amount: parseInt(process.env.SUBSCRIPTION_PRICE || '4900'),
      spreadsheetId, // ✅ 추가
    };

    if (!paymentData.storeId || !paymentData.channelKey) {
      return NextResponse.json({ error: '결제 설정 필요' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...paymentData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}