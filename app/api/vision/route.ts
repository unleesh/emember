import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const base64Image = imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
              imageContext: {
                languageHints: ['ko', 'en'],
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Vision API Error:', errorData);
      return NextResponse.json({ error: 'Vision API failed' }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Vision proxy error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}