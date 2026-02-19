// app/api/sheets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore
    const accessToken = session.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    const { data } = await request.json();

    // ✅ OAuth 클라이언트 설정
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    // ✅ drive.file 범위로 충분!
    // 앱이 생성한 스프레드시트는 접근 가능
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 스프레드시트 찾기 or 생성
    let spreadsheetId = await findOrCreateSpreadsheet(drive, sheets, session.user.email);

    // 데이터 추가
    const values = [[
      new Date().toLocaleString('ko-KR'),
      data.name || '',
      data.company || '',
      data.position || '',
      data.email || '',
      data.phone || '',
      data.website || '',
      data.address || '',
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '명함!A:H',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    });

  } catch (error: any) {
    console.error('Sheets API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ 스프레드시트 찾기 or 생성
async function findOrCreateSpreadsheet(drive: any, sheets: any, userEmail: string) {
  const SPREADSHEET_NAME = '명함 관리';

  try {
    // ✅ drive.file 범위: 앱이 생성한 파일만 검색 가능
    const response = await drive.files.list({
      q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log('✅ 기존 스프레드시트 발견:', response.data.files[0].id);
      return response.data.files[0].id;
    }

    // 새로 생성
    console.log('📝 새 스프레드시트 생성 중...');
    
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: SPREADSHEET_NAME,
        },
        sheets: [
          {
            properties: {
              title: '명함',
              gridProperties: {
                rowCount: 1000,
                columnCount: 8,
              },
            },
          },
        ],
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId!;
    const sheetId = createResponse.data.sheets![0].properties!.sheetId!;

    // 헤더 추가
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: '명함!A1:H1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          '등록일',
          '이름',
          '회사명',
          '직책',
          '이메일',
          '전화번호',
          '웹사이트',
          '주소',
        ]],
      },
    });

    // 헤더 스타일링
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 8,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.2,
                    green: 0.5,
                    blue: 0.8,
                  },
                  textFormat: {
                    foregroundColor: {
                      red: 1,
                      green: 1,
                      blue: 1,
                    },
                    bold: true,
                    fontSize: 11,
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheetId,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 8,
              },
            },
          },
        ],
      },
    });

    console.log('✅ 스타일링 완료');
    return spreadsheetId;

  } catch (error) {
    console.error('❌ 스프레드시트 생성 실패:', error);
    throw error;
  }
}
