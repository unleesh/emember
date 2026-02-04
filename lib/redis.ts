import { Redis } from '@upstash/redis';

// Vercel Integration 환경 변수 이름 자동 감지
const getRedisUrl = () => {
  return process.env.UPSTASH_REDIS_REST_URL || 
         process.env.KV_REST_API_URL || 
         process.env.REDIS_URL ||
         '';
};

const getRedisToken = () => {
  return process.env.UPSTASH_REDIS_REST_TOKEN || 
         process.env.KV_REST_API_TOKEN || 
         process.env.REDIS_TOKEN ||
         '';
};

const url = getRedisUrl();
const token = getRedisToken();

console.log('Redis Config:', {
  url: url ? '✅ ' + url.substring(0, 30) + '...' : '❌ Missing',
  token: token ? '✅ ' + token.substring(0, 20) + '...' : '❌ Missing',
});

if (!url || !token) {
  console.error('❌ Redis credentials missing!');
  console.error('Available env vars:', Object.keys(process.env).filter(k => 
    k.includes('UPSTASH') || k.includes('REDIS') || k.includes('KV')
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
    const data = await redis.get<Subscription>(key);
    console.log('Redis GET:', key, data ? '✅' : '❌');
    return data;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

export async function setSubscription(spreadsheetId: string, data: Subscription): Promise<void> {
  try {
    const key = `subscription:${spreadsheetId}`;
    await redis.set(key, data, { ex: 30 * 24 * 60 * 60 });
    console.log('✅ Redis SET:', key);
    
    // 확인
    const saved = await redis.get(key);
    console.log('Verification:', saved ? '✅ Saved' : '❌ Not saved');
  } catch (error) {
    console.error('Redis set error:', error);
    throw error;
  }
}

export async function isSubscribed(spreadsheetId: string): Promise<boolean> {
  try {
    const subscription = await getSubscription(spreadsheetId);
    if (!subscription?.subscribed) return false;
    
    const expiresAt = new Date(subscription.expiresAt);
    const isValid = expiresAt > new Date();
    
    console.log('isSubscribed:', spreadsheetId.substring(0, 10) + '...', isValid);
    
    return isValid;
  } catch (error) {
    console.error('isSubscribed error:', error);
    return false;
  }
}