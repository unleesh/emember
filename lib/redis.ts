import { Redis } from '@upstash/redis';

// Upstash Redis 클라이언트
// Vercel Integration으로 자동 설정된 환경 변수 사용
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 구독 정보 타입
export interface Subscription {
  spreadsheetId: string;
  subscribed: boolean;
  subscribedAt: string;
  orderId: string;
  plan: 'free' | 'premium';
  expiresAt: string;
  customerEmail?: string;
}

/**
 * 구독 정보 조회
 */
export async function getSubscription(spreadsheetId: string): Promise<Subscription | null> {
  try {
    const key = `subscription:${spreadsheetId}`;
    const data = await redis.get<Subscription>(key);
    return data;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * 구독 정보 저장
 */
export async function setSubscription(spreadsheetId: string, data: Subscription): Promise<void> {
  try {
    const key = `subscription:${spreadsheetId}`;
    // 30일 TTL (자동 만료)
    await redis.set(key, data, { ex: 30 * 24 * 60 * 60 });
    console.log('✅ Subscription saved:', key);
  } catch (error) {
    console.error('Redis set error:', error);
    throw error;
  }
}

/**
 * 구독 정보 삭제
 */
export async function deleteSubscription(spreadsheetId: string): Promise<void> {
  try {
    const key = `subscription:${spreadsheetId}`;
    await redis.del(key);
    console.log('✅ Subscription deleted:', key);
  } catch (error) {
    console.error('Redis del error:', error);
    throw error;
  }
}

/**
 * 구독 상태 확인 (활성화 + 만료일 체크)
 */
export async function isSubscribed(spreadsheetId: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(spreadsheetId);
    
    if (!subscription) {
      return false;
    }
    
    if (!subscription.subscribed) {
      return false;
    }
    
    // 만료일 체크
    const expiresAt = new Date(subscription.expiresAt);
    const now = new Date();
    
    if (expiresAt <= now) {
      console.log('⚠️ Subscription expired:', spreadsheetId);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('isSubscribed error:', error);
    return false;
  }
}

/**
 * 디버깅용: 구독 정보 상세 조회
 */
export async function debugSubscription(spreadsheetId: string) {
  const key = `subscription:${spreadsheetId}`;
  const data = await redis.get(key);
  const ttl = await redis.ttl(key);
  
  console.log('=== Subscription Debug ===');
  console.log('Key:', key);
  console.log('Data:', data);
  console.log('TTL:', ttl, 'seconds (', Math.floor(ttl / 86400), 'days )');
  
  return { key, data, ttl };
}