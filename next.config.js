/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: isDev
              // 개발 환경: 제한 없음
              ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * data: blob:; img-src * data: blob:; frame-src *; style-src * 'unsafe-inline';"
              // 프로덕션: 엄격한 CSP
              : [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.portone.io https://cdn.jsdelivr.net https://accounts.google.com https://apis.google.com https://*.iamport.kr https://*.iamport.co",
                  "style-src 'self' 'unsafe-inline' https://*.iamport.kr https://*.iamport.co",
                  "img-src 'self' data: https: blob:",
                  "font-src 'self' data:",
                  "connect-src 'self' https://cdn.portone.io https://api.portone.io https://*.iamport.co https://*.iamport.kr https://accounts.google.com https://apis.google.com https://vision.googleapis.com https://generativelanguage.googleapis.com https://api.groq.com",
                  "frame-src 'self' https://accounts.google.com https://*.iamport.kr https://*.iamport.co",
                  "media-src 'self' blob:",
                ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;