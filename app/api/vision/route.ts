// app/api/vision/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // ✅ 세션 확인
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

    // ✅ OAuth 토큰 가져오기
    // @ts-ignore
    const accessToken = session.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }

    // Base64 이미지 처리
    const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');

    // ✅ Google Vision REST API 직접 호출
    const visionResponse = await fetch(
      'https://vision.googleapis.com/v1/images:annotate',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

    // ✅ 기존 포맷으로 변환
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
