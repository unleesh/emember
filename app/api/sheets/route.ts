import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Private key 디코딩 개선
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Private key not configured' },
        { status: 500 }
      );
    }

    // Vercel 환경 변수에서 줄바꿈이 이스케이프된 경우 처리
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // 혹시 따옴표로 감싸져 있는 경우 제거
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet ID not configured' },
        { status: 500 }
      );
    }

    // Check if sheet exists and has headers
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:I1',  // I 컬럼까지 (개인화된 메시지 추가)
    });

    const existingValues = getResponse.data.values || [];

    // Add header if not exists
    if (existingValues.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:I1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['날짜', '이름', '회사명', '직책', '이메일', '전화번호', '주소', '웹사이트', '개인화된 메시지']],
        },
      });
    }

    // Append new row
    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const values = [[
      timestamp,
      data.name || '',
      data.company || '',
      data.position || '',
      data.email || '',
      data.phone || '',
      data.address || '',
      data.website || '',
      data.personalizedMessage || '',  // 개인화된 메시지 추가
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:I',  // I 컬럼까지
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    return NextResponse.json({
      success: true,
      url: spreadsheetUrl,
    });

  } catch (error: any) {
    console.error('Sheets API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    return NextResponse.json(
      { error: error.message || 'Failed to save to sheets' },
      { status: 500 }
    );
  }
}
