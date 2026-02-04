import { NextRequest, NextResponse } from 'next/server';
import { setSubscription, type Subscription } from '@/lib/redis';

/**
 * PortOne Webhook - 결제 완료 시 Redis에 저장
 * 
 * POST: PortOne이 호출
 * GET: 테스트용
 */

// GET 메서드 (테스트용)
export async function GET() {
  return NextResponse.json({
    message: 'PortOne Webhook Endpoint',
    method: 'POST',
    url: '/api/subscription/webhook',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}

// POST 메서드 (실제 Webhook)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 PortOne Webhook:', {
      status: body.status,
      merchantUid: body.merchantUid,
      timestamp: new Date().toISOString(),
    });

    // 결제 성공 확인
    if (body.status === 'paid') {
      const { merchantUid, customData } = body;
      
      // customData에서 spreadsheetId 추출
      const spreadsheetId = customData?.spreadsheetId;
      
      if (!spreadsheetId) {
        console.error('❌ spreadsheetId not found');
        return NextResponse.json(
          { error: 'spreadsheetId가 필요합니다.' },
          { status: 400 }
        );
      }
      
      // 구독 정보 생성
      const subscription: Subscription = {
        spreadsheetId,
        subscribed: true,
        subscribedAt: new Date().toISOString(),
        orderId: merchantUid,
        plan: 'premium',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customerEmail: customData?.customerEmail || 'unknown',
      };
      
      // Redis에 저장
      await setSubscription(spreadsheetId, subscription);
      
      console.log('✅ Subscription saved:', {
        spreadsheetId: spreadsheetId.substring(0, 15) + '...',
        orderId: merchantUid,
      });
      
      return NextResponse.json({ 
        success: true,
        message: 'Subscription activated',
      });
    }

    // 결제 실패 또는 다른 상태
    console.log('⚠️ Payment not completed:', body.status);
    return NextResponse.json({ 
      success: false, 
      message: `Payment status: ${body.status}`,
    });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { 
        error: error.message,
        details: 'Webhook processing failed',
      },
      { status: 500 }
    );
  }
}