/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.portone.io https://cdn.jsdelivr.net https://accounts.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://cdn.portone.io https://api.portone.io https://accounts.google.com https://apis.google.com https://vision.googleapis.com https://generativelanguage.googleapis.com https://api.groq.com",
              "frame-src 'self' https://accounts.google.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;