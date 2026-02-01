import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * 구독 상태 및 명함 수 확인
 * 무료: 5명까지
 * 유료: 6명 이상
 */
export async function POST(request: NextRequest) {
  try {
    const { userConfig } = await request.json();
    
    // Google Sheets 연결
    const spreadsheetId = userConfig?.spreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;
    const serviceAccountEmail = userConfig?.serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = userConfig?.privateKey || process.env.GOOGLE_PRIVATE_KEY;

    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      return NextResponse.json(
        { error: '설정이 완료되지 않았습니다. /setup 페이지에서 먼저 설정하세요.' },
        { status: 400 }
      );
    }

    privateKey = privateKey.replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 현재 명함 수 확인 (헤더 제외)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:A',
    });

    const rows = response.data.values || [];
    const cardCount = Math.max(0, rows.length - 1); // 헤더 제외

    const FREE_LIMIT = 5;
    const needsSubscription = cardCount >= FREE_LIMIT;
    
    return NextResponse.json({
      success: true,
      cardCount,
      freeLimit: FREE_LIMIT,
      needsSubscription,
      message: needsSubscription 
        ? `현재 ${cardCount}명의 명함이 저장되어 있습니다. 더 저장하려면 프리미엄 구독이 필요합니다.`
        : `현재 ${cardCount}/${FREE_LIMIT}명 저장됨. ${FREE_LIMIT - cardCount}명 더 무료로 사용 가능합니다.`
    });

  } catch (error: any) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
