import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>인증 실패</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .error { background: #fee; border: 2px solid #c33; padding: 20px; border-radius: 10px; color: #800; }
  </style>
</head>
<body>
  <div class="error">
    <h1>❌ 인증 실패</h1>
    <p>인증 코드가 제공되지 않았습니다.</p>
  </div>
</body>
</html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 400
    });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>✅ 인증 완료</title>
  <style>
    body {
      font-family: -apple-system, system-ui, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #10b981; }
    .token-box {
      background: #f3f4f6;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      padding: 15px;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
      margin: 20px 0;
      max-height: 200px;
      overflow-y: auto;
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      width: 100%;
    }
    button:hover { opacity: 0.9; }
    .success {
      background: #d1fae5;
      color: #065f46;
      padding: 12px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .instruction {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ Gmail 인증 완료!</h1>
    
    <div class="success">
      Gmail 계정이 성공적으로 연결되었습니다.
    </div>

    <div class="instruction">
      <strong>⚠️ 중요:</strong> 아래 Refresh Token을 복사하여 설정 화면에 붙여넣으세요.
    </div>

    <h3>Refresh Token:</h3>
    <div class="token-box" id="tokenBox">${tokens.refresh_token}</div>

    <button onclick="copyToken()">📋 토큰 복사하기</button>

    <p style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
      복사 후 이 창을 닫고 설정 화면으로 돌아가세요.
    </p>
  </div>

  <script>
    function copyToken() {
      const tokenText = document.getElementById('tokenBox').innerText;
      navigator.clipboard.writeText(tokenText).then(() => {
        alert('✅ Refresh Token이 클립보드에 복사되었습니다!\\n\\n설정 화면에 붙여넣으세요.');
        window.close();
      }).catch(() => {
        alert('복사 실패. 수동으로 복사해주세요.');
      });
    }
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: any) {
    console.error('OAuth token exchange error:', error);
    
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>인증 실패</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .error { background: #fee2e2; border: 2px solid #ef4444; border-radius: 10px; padding: 20px; color: #991b1b; }
  </style>
</head>
<body>
  <div class="error">
    <h1>❌ 인증 실패</h1>
    <p>${error.message}</p>
    <p>설정 화면으로 돌아가서 다시 시도해주세요.</p>
  </div>
</body>
</html>
    `;

    return new NextResponse(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    });
  }
}
