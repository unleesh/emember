import { NextRequest, NextResponse } from 'next/server';
import { setSubscription, type Subscription } from '@/lib/redis';

/**
 * PortOne Webhook - 결제 완료 시 Redis에 저장
 * URL: https://your-app.vercel.app/api/subscription/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Webhook:', { status: body.status, orderId: body.merchantUid });

    if (body.status === 'paid') {
      const { merchantUid, customData } = body;
      const spreadsheetId = customData?.spreadsheetId;
      
      if (!spreadsheetId) {
        return NextResponse.json({ error: 'spreadsheetId 필요' }, { status: 400 });
      }
      
      const subscription: Subscription = {
        spreadsheetId,
        subscribed: true,
        subscribedAt: new Date().toISOString(),
        orderId: merchantUid,
        plan: 'premium',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customerEmail: customData?.customerEmail,
      };
      
      await setSubscription(spreadsheetId, subscription);
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}