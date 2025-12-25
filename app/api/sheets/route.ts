import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Spreadsheet ID not configured' },
        { status: 500 }
      );
    }

    // 기존 데이터 확인
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:A',
    });

    const existingRows = getResponse.data.values?.length || 0;
    const nextRow = existingRows + 1;

    // 헤더가 없으면 추가
    if (existingRows === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:H1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['날짜', '이름', '회사명', '직책', '이메일', '전화번호', '주소', '웹사이트']],
        },
      });
    }

    // 데이터 저장
    const timestamp = new Date().toLocaleString('ko-KR');
    const values = [[
      timestamp,
      data.name || '',
      data.company || '',
      data.position || '',
      data.email || '',
      `'${data.phone || ''}`,
      data.address || '',
      data.website || '',
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${nextRow}:H${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    return NextResponse.json({ 
      success: true, 
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    });

  } catch (error: any) {
    console.error('Sheets API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save data' },
      { status: 500 }
    );
  }
}