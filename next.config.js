/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              
              // 스크립트 소스
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' " +
              "https://cdn.portone.io " +
              "https://cdn.jsdelivr.net " +
              "https://accounts.google.com " +
              "https://apis.google.com " +
              "https://checkout.iamport.kr " +
              "https://service.iamport.kr",
              
              // 스타일 소스
              "style-src 'self' 'unsafe-inline' https://checkout.iamport.kr",
              
              // 이미지 소스
              "img-src 'self' data: https: blob:",
              
              // 폰트 소스
              "font-src 'self' data:",
              
              // API 연결
              "connect-src 'self' " +
              "https://cdn.portone.io " +
              "https://api.portone.io " +
              "https://checkout-service.prod.iamport.co " +
              "https://api.iamport.co " +
              "https://accounts.google.com " +
              "https://apis.google.com " +
              "https://vision.googleapis.com " +
              "https://generativelanguage.googleapis.com " +
              "https://api.groq.com",
              
              // iframe 소스
              "frame-src 'self' " +
              "https://accounts.google.com " +
              "https://service.iamport.kr " +
              "https://checkout.iamport.kr",
              
              // 미디어 소스
              "media-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
