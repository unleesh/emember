import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // 간단한 검증만 수행
    const errors = [];
    
    if (!data.projectId) errors.push('프로젝트 ID가 필요합니다');
    if (!data.serviceAccountEmail) errors.push('Service Account Email이 필요합니다');
    if (!data.privateKey) errors.push('Private Key가 필요합니다');
    if (!data.spreadsheetId) errors.push('Spreadsheet ID가 필요합니다');
    
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: errors.join(', '),
      });
    }
    
    return NextResponse.json({
      success: true,
      message: '모든 정보가 입력되었습니다. Vercel에 환경 변수를 추가하고 재배포하세요.',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
