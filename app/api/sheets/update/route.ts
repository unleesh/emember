import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { data, rowIndex } = await request.json();

    if (!rowIndex || !data) {
      return NextResponse.json(
        { error: 'Missing rowIndex or data' },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Update the specific row
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
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${rowIndex}:H${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    return NextResponse.json({
      success: true,
      spreadsheetUrl,
      message: 'Card updated successfully',
    });

  } catch (error: any) {
    console.error('Update sheet error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update sheet' },
      { status: 500 }
    );
  }
}