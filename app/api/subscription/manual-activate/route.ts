import { NextRequest, NextResponse } from 'next/server';
import { setSubscription, type Subscription } from '@/lib/redis';

/**
 * 클라이언트에서 직접 구독 활성화 (Webhook 실패 시 Fallback)
 * POST /api/subscription/manual-activate
 */
export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId, orderId, customerEmail } = await request.json();

    if (!spreadsheetId || !orderId) {
      return NextResponse.json(
        { error: 'spreadsheetId와 orderId가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('🔧 Manual subscription activation:', {
      spreadsheetId: spreadsheetId.substring(0, 15) + '...',
      orderId,
    });

    // 구독 정보 생성
    const subscription: Subscription = {
      spreadsheetId,
      subscribed: true,
      subscribedAt: new Date().toISOString(),
      orderId,
      plan: 'premium',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      customerEmail: customerEmail || 'unknown',
    };

    // Redis에 저장
    await setSubscription(spreadsheetId, subscription);

    console.log('✅ Manual subscription saved:', {
      spreadsheetId: spreadsheetId.substring(0, 15) + '...',
      orderId,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription activated manually',
    });

  } catch (error: any) {
    console.error('❌ Manual activation error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: error.message,
        details: 'Manual activation failed',
      },
      { status: 500 }
    );
  }
}
