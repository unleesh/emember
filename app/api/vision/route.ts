import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== Vision API Route Called ===');
  
  try {
    const body = await request.json();
    const { imageData } = body;
    
    console.log('Request body keys:', Object.keys(body));
    console.log('imageData exists:', !!imageData);
    console.log('imageData length:', imageData?.length);
    
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!API_KEY) {
      console.error('API Key not found in environment');
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }
    
    console.log('API Key exists:', !!API_KEY);

    // 이미지 데이터 검증
    if (!imageData) {
      console.error('No imageData provided');
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    if (!imageData.startsWith('data:image/')) {
      console.error('Invalid image data format. Starts with:', imageData.substring(0, 50));
      return NextResponse.json({ error: 'Invalid image data format' }, { status: 400 });
    }

    const base64Image = imageData.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    console.log('Base64 image length after strip:', base64Image.length);
    
    // Base64 검증
    if (base64Image.length < 100) {
      console.error('Base64 image too short');
      return NextResponse.json({ error: 'Image data too short' }, { status: 400 });
    }

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
            },
          ],
          imageContext: {
            languageHints: ['ko', 'en'],
          },
        },
      ],
    };

    console.log('Calling Vision API...');
    console.log('Request body structure:', JSON.stringify({
      requests: [{
        image: { content: '[BASE64_DATA_LENGTH:' + base64Image.length + ']' },
        features: requestBody.requests[0].features,
        imageContext: requestBody.requests[0].imageContext,
      }]
    }));

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('Vision API response status:', response.status);
    console.log('Vision API response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Vision API raw response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Vision API response as JSON');
      return NextResponse.json(
        { error: 'Invalid JSON response from Vision API', rawResponse: responseText },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('Vision API error response:', JSON.stringify(result, null, 2));
      return NextResponse.json(
        { 
          error: 'Vision API failed', 
          status: response.status,
          details: result,
          message: result.error?.message || 'Unknown error'
        },
        { status: response.status }
      );
    }

    console.log('Vision API success!');
    console.log('Response has data:', !!result.responses?.[0]);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Server error in vision route:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Unknown server error', stack: error.stack },
      { status: 500 }
    );
  }
}