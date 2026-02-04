import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { isSubscribed } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { userConfig } = await request.json();
    
    const spreadsheetId = userConfig?.spreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;
    const serviceAccountEmail = userConfig?.serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = userConfig?.privateKey || process.env.GOOGLE_PRIVATE_KEY;

    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      return NextResponse.json({ error: '설정이 필요합니다' }, { status: 400 });
    }

    privateKey = privateKey.replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: serviceAccountEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:A',
    });

    const rows = response.data.values || [];
    const cardCount = Math.max(0, rows.length - 1);
    const FREE_LIMIT = 5;
    const needsSubscription = cardCount >= FREE_LIMIT;
    
    // ✅ Redis에서 구독 확인
    const hasSubscription = await isSubscribed(spreadsheetId);
    
    console.log('📊 Check:', { cardCount, needsSubscription, hasSubscription });
    
    return NextResponse.json({
      success: true,
      cardCount,
      freeLimit: FREE_LIMIT,
      needsSubscription,
      hasSubscription,
      message: needsSubscription && !hasSubscription
        ? `${cardCount}명 저장됨. 프리미엄 구독 필요.`
        : hasSubscription
        ? `프리미엄 (${cardCount}명)`
        : `무료 (${cardCount}/${FREE_LIMIT}명)`,
    });
  } catch (error: any) {
    console.error('Check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}