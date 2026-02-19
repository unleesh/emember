// app/api/vision/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // ✅ 세션 확인 (로그인 여부만 체크)
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const { imageData } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // ✅ 서버의 API 키 사용 (사용자 OAuth 토큰 불필요)
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Vision API key not configured' },
        { status: 500 }
      );
    }

    // Base64 이미지 처리
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');

    // ✅ Vision API 호출 (API 키 사용)
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
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
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Vision API Error:', errorText);
      return NextResponse.json(
        { error: 'Vision API failed', details: errorText },
        { status: visionResponse.status }
      );
    }

    const visionData = await visionResponse.json();

    return NextResponse.json({
      success: true,
      responses: [
        {
          fullTextAnnotation: {
            text: visionData.responses?.[0]?.fullTextAnnotation?.text || '',
          },
        },
      ],
    });

  } catch (error: any) {
    console.error('Vision API Error:', error);
    return NextResponse.json(
      {
        error: 'Vision API failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
