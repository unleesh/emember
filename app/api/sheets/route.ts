import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

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

    // 전화번호 중복 체크
    if (data.phone) {
      // 전화번호 정규화 함수 (비교를 위해 숫자만 추출)
      const normalizePhone = (phone: string): string => {
        return phone.replace(/[^0-9]/g, '');
      };

      const newPhoneNormalized = normalizePhone(data.phone);

      // 기존 전화번호 데이터 읽기 (F열 - 전화번호 컬럼, 헤더 제외)
      if (existingRows > 1) {
        const phoneResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Sheet1!F2:F',
        });

        const existingPhones = phoneResponse.data.values || [];

        // 기존 전화번호 중 중복이 있는지 확인
        for (let i = 0; i < existingPhones.length; i++) {
          const existingPhone = existingPhones[i]?.[0];
          if (existingPhone) {
            // 스프레드시트에 저장된 전화번호는 앞에 ' 가 붙어있을 수 있음
            const cleanPhone = existingPhone.replace(/^'/, '');
            const existingPhoneNormalized = normalizePhone(cleanPhone);

            if (existingPhoneNormalized === newPhoneNormalized) {
              return NextResponse.json(
                {
                  error: '중복된 전화번호입니다',
                  message: `이 전화번호(${data.phone})는 이미 등록되어 있습니다. (${i + 2}번째 행)`,
                  duplicate: true,
                  existingRow: i + 2
                },
                { status: 409 }
              );
            }
          }
        }
      }
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
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    return NextResponse.json(
      { error: error.message || 'Failed to save data' },
      { status: 500 }
    );
  }
}
