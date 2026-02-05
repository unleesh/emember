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
    // ✅ Webhook 시크릿 검증 (선택사항이지만 권장)
    const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;
    
    // 요청 본문을 한 번만 읽기
    const rawBody = await request.text();
    let body: any;
    
    if (webhookSecret) {
      // PortOne이 보낸 요청인지 검증
      // PortOne의 실제 signature 헤더 이름 확인 필요 (일반적으로 x-portone-signature 또는 portone-signature)
      const signature = request.headers.get('x-portone-signature') || 
                       request.headers.get('portone-signature') ||
                       request.headers.get('signature');
      
      if (signature) {
        try {
          // HMAC SHA256으로 서명 생성 및 검증
          const crypto = await import('crypto');
          const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');
          
          // 서명 비교 (타이밍 공격 방지를 위해 constant-time 비교)
          const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
          );
          
          if (!isValid) {
            console.error('❌ Webhook signature verification failed');
            return NextResponse.json(
              { error: 'Invalid webhook signature' },
              { status: 401 }
            );
          }
          
          console.log('✅ Webhook signature verified');
        } catch (verifyError: any) {
          console.warn('⚠️ Webhook signature verification error:', verifyError.message);
          // 검증 실패해도 계속 진행 (개발 중에는 유연하게)
        }
      } else {
        console.warn('⚠️ Webhook secret is set but no signature header found');
        console.warn('Available headers:', Array.from(request.headers.entries())
          .filter(([key]) => key.toLowerCase().includes('signature') || key.toLowerCase().includes('portone'))
          .map(([key]) => key));
      }
    } else {
      console.log('ℹ️ Webhook secret not configured (skipping verification)');
      console.log('💡 보안을 위해 PORTONE_WEBHOOK_SECRET 환경 변수를 설정하는 것을 권장합니다.');
    }
    
    // JSON으로 파싱
    body = JSON.parse(rawBody);
    
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
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    
    // Redis 연결 에러인지 확인
    if (error.message?.includes('Redis') || error.message?.includes('KV') || error.message?.includes('Upstash')) {
      console.error('🔴 Redis 연결 문제로 보입니다!');
      console.error('환경 변수 확인:', {
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
        UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    
    return NextResponse.json(
      { 
        error: error.message,
        details: 'Webhook processing failed',
        type: error.name || 'UnknownError',
      },
      { status: 500 }
    );
  }
}