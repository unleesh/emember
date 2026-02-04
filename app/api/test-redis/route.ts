import { NextResponse } from 'next/server';
import { redis, setSubscription } from '@/lib/redis';

/**
 * Redis 연결 및 저장 테스트
 * GET /api/test-redis
 */
export async function GET() {
  try {
    console.log('=== Redis Test Start ===');
    
    // 1. 환경 변수 확인
    const envVars = {
      UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      KV_URL: !!process.env.KV_URL,
      REDIS_URL: !!process.env.REDIS_URL,
    };
    
    console.log('Environment variables:', envVars);
    
    // 실제 사용 중인 값 확인
    const actualUrl = process.env.UPSTASH_REDIS_REST_URL || 
                     process.env.KV_REST_API_URL || 
                     process.env.REDIS_URL || '';
    const actualToken = process.env.UPSTASH_REDIS_REST_TOKEN || 
                       process.env.KV_REST_API_TOKEN || '';
    
    if (!actualUrl || !actualToken) {
      return NextResponse.json({
        success: false,
        error: 'Redis credentials not found',
        envVars,
        hint: 'Vercel Integration으로 Upstash를 연결했다면 KV_REST_API_URL과 KV_REST_API_TOKEN을 사용해야 합니다.',
      });
    }
    
    console.log('Using:', {
      url: actualUrl.substring(0, 30) + '...',
      token: actualToken.substring(0, 20) + '...',
    });
    
    // 2. 간단한 SET/GET 테스트
    const testKey = 'test-key-' + Date.now();
    const testValue = { 
      hello: 'world', 
      timestamp: new Date().toISOString(),
      random: Math.random(),
    };
    
    await redis.set(testKey, testValue);
    console.log('✅ SET:', testKey);
    
    const retrieved = await redis.get(testKey);
    console.log('✅ GET:', retrieved);
    
    // 3. 구독 정보 저장 테스트
    const testSpreadsheetId = 'test_' + Date.now();
    const subscription = {
      spreadsheetId: testSpreadsheetId,
      subscribed: true,
      subscribedAt: new Date().toISOString(),
      orderId: 'test_order_' + Date.now(),
      plan: 'premium' as const,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      customerEmail: 'test@example.com',
    };
    
    await setSubscription(testSpreadsheetId, subscription);
    console.log('✅ Subscription saved');
    
    // 4. 저장된 데이터 확인
    const savedSubscription = await redis.get(`subscription:${testSpreadsheetId}`);
    console.log('✅ Retrieved subscription:', savedSubscription);
    
    // 5. 모든 키 확인
    const allKeys = await redis.keys('*');
    console.log('All keys:', allKeys);
    
    return NextResponse.json({
      success: true,
      message: '✅ Redis 연결 및 저장 성공!',
      envCheck: envVars,
      usedCredentials: {
        url: actualUrl.substring(0, 40) + '...',
        token: '***' + actualToken.substring(actualToken.length - 10),
      },
      test: {
        simple: {
          key: testKey,
          value: testValue,
          retrieved: retrieved,
          match: JSON.stringify(testValue) === JSON.stringify(retrieved),
        },
        subscription: {
          spreadsheetId: testSpreadsheetId,
          saved: savedSubscription,
          match: !!savedSubscription,
        },
      },
      allKeys: allKeys,
      keyCount: allKeys.length,
    });
    
  } catch (error: any) {
    console.error('❌ Redis Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      hint: 'lib/redis.ts의 환경 변수 설정을 확인하세요.',
    }, { status: 500 });
  }
}