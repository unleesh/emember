import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { isSubscribed } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const { userConfig } = await request.json();

    const spreadsheetId =
      userConfig?.spreadsheetId || process.env.GOOGLE_SPREADSHEET_ID;
    const serviceAccountEmail =
      userConfig?.serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = userConfig?.privateKey || process.env.GOOGLE_PRIVATE_KEY;

    if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
      return NextResponse.json(
        { success: false, error: '설정이 필요합니다' },
        { status: 400 },
      );
    }

    // 기본 값들
    const FREE_LIMIT = 5;
    let cardCount = 0;
    let needsSubscription = false;
    // 구독 필요없게 해둠 260205
    let sheetsError: string | null = null;

    // Google Sheets에서 카드 개수 조회 (에러가 나도 전체 API가 500으로 죽지 않도록 분리)
    try {
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
      cardCount = Math.max(0, rows.length - 1);
      needsSubscription = cardCount >= FREE_LIMIT;
    } catch (sheetsErr: any) {
      console.error('Sheets read error in /api/subscription/check:', sheetsErr);
      sheetsError = sheetsErr?.message || 'Sheets 조회 중 오류';
      // Sheets에 문제가 있어도, 구독 상태 확인은 계속 진행한다.
    }

    // ✅ Redis에서 구독 확인
    const hasSubscription = await isSubscribed(spreadsheetId);

    console.log('📊 Check:', {
      cardCount,
      needsSubscription,
      hasSubscription,
      spreadsheetId: spreadsheetId.substring(0, 15) + '...',
      sheetsError,
    });

    return NextResponse.json({
      success: true,
      cardCount,
      freeLimit: FREE_LIMIT,
      needsSubscription,
      hasSubscription,
      spreadsheetId,
      sheetsError,
      message:
        needsSubscription && !hasSubscription
          ? `${cardCount}명 저장됨. 프리미엄 구독 필요.`
          : hasSubscription
          ? `프리미엄 (${cardCount}명)`
          : `무료 (${cardCount}/${FREE_LIMIT}명)`,
    });
  } catch (error: any) {
    console.error('Check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '구독 확인 중 오류' },
      { status: 500 },
    );
  }
}