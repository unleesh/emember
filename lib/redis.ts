import { Redis } from '@upstash/redis';

// Vercel Integration 환경 변수 (KV_REST_API_*) 우선 사용
const getRedisUrl = () => {
  return process.env.KV_REST_API_URL ||           // Vercel Integration
         process.env.UPSTASH_REDIS_REST_URL ||    // 수동 설정
         process.env.KV_URL ||
         process.env.REDIS_URL ||
         '';
};

const getRedisToken = () => {
  return process.env.KV_REST_API_TOKEN ||         // Vercel Integration
         process.env.UPSTASH_REDIS_REST_TOKEN ||  // 수동 설정
         process.env.KV_TOKEN ||
         process.env.REDIS_TOKEN ||
         '';
};

const url = getRedisUrl();
const token = getRedisToken();

// 시작 시 로그
console.log('=== Redis Client Initialization ===');
console.log('URL:', url ? '✅ Found: ' + url.substring(0, 40) + '...' : '❌ Missing');
console.log('Token:', token ? '✅ Found: ' + token.substring(0, 20) + '...' : '❌ Missing');

if (!url || !token) {
  console.error('❌ Redis credentials missing!');
  console.error('Checked env vars:', [
    'KV_REST_API_URL',
    'UPSTASH_REDIS_REST_URL',
    'KV_REST_API_TOKEN',
    'UPSTASH_REDIS_REST_TOKEN',
  ]);
  console.error('Available:', Object.keys(process.env).filter(k => 
    k.includes('REDIS') || k.includes('KV') || k.includes('UPSTASH')
  ));
}

// Redis 클라이언트
export const redis = new Redis({
  url: url,
  token: token,
});

export interface Subscription {
  spreadsheetId: string;
  subscribed: boolean;
  subscribedAt: string;
  orderId: string;
  plan: 'free' | 'premium';
  expiresAt: string;
  customerEmail?: string;
}

export async function getSubscription(spreadsheetId: string): Promise<Subscription | null> {
  try {
    const key = `subscription:${spreadsheetId}`;
    console.log('🔍 Redis GET:', key);
    
    const data = await redis.get<Subscription>(key);
    
    if (data) {
      console.log('✅ Found subscription:', {
        spreadsheetId: spreadsheetId.substring(0, 15) + '...',
        subscribed: data.subscribed,
        expiresAt: data.expiresAt,
      });
    } else {
      console.log('❌ No subscription found for:', spreadsheetId.substring(0, 15) + '...');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Redis GET error:', error);
    return null;
  }
}

export async function setSubscription(spreadsheetId: string, data: Subscription): Promise<void> {
  try {
    const key = `subscription:${spreadsheetId}`;
    console.log('💾 Redis SET:', key);
    
    // 30일 TTL
    await redis.set(key, data, { ex: 30 * 24 * 60 * 60 });
    
    console.log('✅ Subscription saved:', {
      key,
      spreadsheetId: spreadsheetId.substring(0, 15) + '...',
      orderId: data.orderId,
      expiresAt: data.expiresAt,
    });
    
    // 즉시 확인
    const verification = await redis.get(key);
    if (verification) {
      console.log('✅ Verification passed: Data is in Redis');
    } else {
      console.error('❌ Verification failed: Data not in Redis!');
    }
    
  } catch (error) {
    console.error('❌ Redis SET error:', error);
    throw error;
  }
}

export async function deleteSubscription(spreadsheetId: string): Promise<void> {
  try {
    const key = `subscription:${spreadsheetId}`;
    await redis.del(key);
    console.log('🗑️ Subscription deleted:', key);
  } catch (error) {
    console.error('❌ Redis DEL error:', error);
    throw error;
  }
}

export async function isSubscribed(spreadsheetId: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(spreadsheetId);
    
    if (!subscription) {
      console.log('❌ No subscription:', spreadsheetId.substring(0, 15) + '...');
      return false;
    }
    
    if (!subscription.subscribed) {
      console.log('❌ Not subscribed:', spreadsheetId.substring(0, 15) + '...');
      return false;
    }
    
    // 만료일 체크
    const expiresAt = new Date(subscription.expiresAt);
    const now = new Date();
    const isValid = expiresAt > now;
    
    if (!isValid) {
      console.log('❌ Subscription expired:', {
        spreadsheetId: spreadsheetId.substring(0, 15) + '...',
        expiresAt: subscription.expiresAt,
        now: now.toISOString(),
      });
    } else {
      console.log('✅ Subscription valid:', {
        spreadsheetId: spreadsheetId.substring(0, 15) + '...',
        expiresAt: subscription.expiresAt,
        daysLeft: Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      });
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ isSubscribed error:', error);
    return false;
  }
}

// 디버깅 헬퍼
export async function getAllSubscriptions(): Promise<string[]> {
  try {
    const keys = await redis.keys('subscription:*');
    console.log('📋 All subscription keys:', keys);
    return keys;
  } catch (error) {
    console.error('❌ getAllSubscriptions error:', error);
    return [];
  }
}