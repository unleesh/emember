import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    const { phone, email } = await request.json();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Read all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:H',
    });

    const rows = response.data.values || [];

    if (rows.length <= 1) {
      // No data rows (only header or empty)
      return NextResponse.json({ isDuplicate: false });
    }

    // Find duplicate by phone or email
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const existingPhone = row[5] || ''; // Column F (전화번호)
      const existingEmail = row[4] || ''; // Column E (이메일)

      const phoneMatch = phone && existingPhone && existingPhone.trim() === phone.trim();
      const emailMatch = email && existingEmail && existingEmail.toLowerCase().trim() === email.toLowerCase().trim();

      if (phoneMatch || emailMatch) {
        // Found duplicate
        return NextResponse.json({
          isDuplicate: true,
          duplicate: {
            rowIndex: i + 1, // 1-indexed, including header
            data: {
              name: row[1] || '',
              company: row[2] || '',
              position: row[3] || '',
              email: row[4] || '',
              phone: row[5] || '',
              address: row[6] || '',
              website: row[7] || '',
            },
          },
        });
      }
    }

    return NextResponse.json({ isDuplicate: false });

  } catch (error: any) {
    console.error('Check duplicate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}