'use client';

import { useState } from 'react';

type EmailSetupStep = 
  | 'welcome'
  | 'gmail-oauth'
  | 'ai-setup'
  | 'template'
  | 'test'
  | 'complete';

interface EmailSetupData {
  gmailClientId?: string;
  gmailClientSecret?: string;
  gmailFromEmail?: string;
  gmailRefreshToken?: string;
  aiProvider?: 'groq' | 'gemini';
  aiApiKey?: string;
  emailTemplate?: string;
}

export default function EmailSetupWizard() {
  const [step, setStep] = useState<EmailSetupStep>('welcome');
  const [setupData, setSetupData] = useState<EmailSetupData>({
    aiProvider: 'groq',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSetupData = (key: keyof EmailSetupData, value: string) => {
    setSetupData(prev => ({ ...prev, [key]: value }));
  };

  const handleOAuthSetup = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
  };

  const handleOAuthFlow = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/gmail', {
        method: 'GET',
      });
      
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'OAuth URL 생성 실패');
      }

      const data = await response.json();
      
      if (data.authUrl) {
        window.open(data.authUrl, 'gmail-auth', 'width=600,height=700');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGroqSetup = () => {
    window.open('https://console.groq.com/keys', '_blank');
  };

  const handleGeminiSetup = () => {
    window.open('https://ai.google.dev/', '_blank');
  };

  const handleTestEmail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: setupData.gmailFromEmail,
          testMessage: '안녕하세요! 이것은 테스트 메시지입니다.',
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ 테스트 이메일이 발송되었습니다! 받은편지함을 확인하세요.');
        setStep('complete');
      } else {
        setError(result.error || '테스트 실패');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyEnvTemplate = () => {
    const template = `# Gmail API (OAuth 2.0)
GMAIL_CLIENT_ID=${setupData.gmailClientId || 'your-client-id'}
GMAIL_CLIENT_SECRET=${setupData.gmailClientSecret || 'your-client-secret'}
GMAIL_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
GMAIL_FROM_EMAIL=${setupData.gmailFromEmail || 'your-email@gmail.com'}
GMAIL_FROM_NAME=Your Name
GMAIL_REFRESH_TOKEN=${setupData.gmailRefreshToken || 'your-refresh-token'}

# AI Provider (Groq 또는 Gemini)
AI_PROVIDER=${setupData.aiProvider || 'groq'}
${setupData.aiProvider === 'groq' ? 'GROQ_API_KEY' : 'GEMINI_API_KEY'}=${setupData.aiApiKey || 'your-api-key'}`;

    navigator.clipboard.writeText(template).then(() => {
      alert('✅ 환경 변수가 복사되었습니다!\n\nVercel Dashboard → Environment Variables에 추가하세요.');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📧 이메일 자동화 설정
          </h1>
          <p className="text-gray-600">
            AI가 개인화된 이메일을 작성하고 자동 발송합니다 ✨
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">진행률</span>
            <span className="text-sm font-medium text-purple-600">
              {step === 'welcome' && '0%'}
              {step === 'gmail-oauth' && '20%'}
              {step === 'ai-setup' && '40%'}
              {step === 'template' && '60%'}
              {step === 'test' && '80%'}
              {step === 'complete' && '100%'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{
                width:
                  step === 'welcome' ? '0%' :
                  step === 'gmail-oauth' ? '20%' :
                  step === 'ai-setup' ? '40%' :
                  step === 'template' ? '60%' :
                  step === 'test' ? '80%' : '100%'
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Welcome */}
          {step === 'welcome' && (
            <div className="text-center">
              <div className="text-6xl mb-6">🤖</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                이메일 자동화 시작!
              </h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                명함 데이터를 바탕으로 AI가 개인화된 이메일을 작성하고 Gmail로 자동 발송합니다.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-purple-50 rounded-xl">
                  <div className="text-3xl mb-2">📧</div>
                  <h3 className="font-bold mb-2">Gmail 연동</h3>
                  <p className="text-sm text-gray-600">자동 발송</p>
                </div>
                <div className="p-6 bg-pink-50 rounded-xl">
                  <div className="text-3xl mb-2">🤖</div>
                  <h3 className="font-bold mb-2">AI 개인화</h3>
                  <p className="text-sm text-gray-600">Groq/Gemini</p>
                </div>
                <div className="p-6 bg-blue-50 rounded-xl">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-bold mb-2">Sheets 연동</h3>
                  <p className="text-sm text-gray-600">자동 데이터</p>
                </div>
              </div>

              <button
                onClick={() => setStep('gmail-oauth')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all"
              >
                시작하기 🚀
              </button>
            </div>
          )}

          {/* Gmail OAuth */}
          {step === 'gmail-oauth' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">1</div>
                <h2 className="text-2xl font-bold text-gray-800">Gmail 연동</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-purple-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">📧 OAuth 2.0 설정</h3>
                  <ol className="space-y-2 text-sm text-gray-700 mb-4">
                    <li>✓ Google Cloud Console → Credentials</li>
                    <li>✓ "Create Credentials" → "OAuth client ID"</li>
                    <li>✓ Application type: <strong>Web application</strong></li>
                    <li>✓ Authorized redirect URIs:
                      <code className="block bg-white px-2 py-1 rounded mt-1 text-xs">
                        https://your-app.vercel.app/api/auth/callback
                      </code>
                    </li>
                  </ol>
                  <button
                    onClick={handleOAuthSetup}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 mb-4"
                  >
                    🔐 OAuth 설정하러 가기
                  </button>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Client ID"
                      value={setupData.gmailClientId || ''}
                      onChange={(e) => updateSetupData('gmailClientId', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      placeholder="Client Secret"
                      value={setupData.gmailClientSecret || ''}
                      onChange={(e) => updateSetupData('gmailClientSecret', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-pink-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">🔑 Gmail 인증</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      발송할 Gmail 주소
                    </label>
                    <input
                      type="email"
                      placeholder="your-email@gmail.com"
                      value={setupData.gmailFromEmail || ''}
                      onChange={(e) => updateSetupData('gmailFromEmail', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleOAuthFlow}
                    disabled={loading || !setupData.gmailFromEmail || !setupData.gmailClientId}
                    className="w-full bg-pink-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-pink-700 disabled:opacity-50 mb-4"
                  >
                    {loading ? '인증 중...' : '🔐 Google 인증하기'}
                  </button>

                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      인증 후 Refresh Token:
                    </p>
                    <textarea
                      placeholder="1//0g...로 시작하는 토큰"
                      value={setupData.gmailRefreshToken || ''}
                      onChange={(e) => updateSetupData('gmailRefreshToken', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
                    <strong>오류:</strong> {error}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep('welcome')}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-300"
                >
                  ← 이전
                </button>
                <button
                  onClick={() => setStep('ai-setup')}
                  disabled={!setupData.gmailRefreshToken}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg disabled:opacity-50"
                >
                  다음 →
                </button>
              </div>
            </div>
          )}

          {/* AI Setup */}
          {step === 'ai-setup' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-pink-100 text-pink-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">2</div>
                <h2 className="text-2xl font-bold text-gray-800">AI 선택</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-4">🤖 AI Provider 선택</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => updateSetupData('aiProvider', 'groq')}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        setupData.aiProvider === 'groq'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 bg-white hover:border-purple-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">⚡</div>
                      <h4 className="font-bold mb-1">Groq</h4>
                      <p className="text-sm text-gray-600">초고속 추론 (권장)</p>
                      {setupData.aiProvider === 'groq' && (
                        <div className="mt-2 text-purple-600 font-bold">✓ 선택됨</div>
                      )}
                    </button>

                    <button
                      onClick={() => updateSetupData('aiProvider', 'gemini')}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        setupData.aiProvider === 'gemini'
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-300 bg-white hover:border-pink-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">✨</div>
                      <h4 className="font-bold mb-1">Gemini</h4>
                      <p className="text-sm text-gray-600">Google AI</p>
                      {setupData.aiProvider === 'gemini' && (
                        <div className="mt-2 text-pink-600 font-bold">✓ 선택됨</div>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">
                    🔑 {setupData.aiProvider === 'groq' ? 'Groq' : 'Gemini'} API 키
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    {setupData.aiProvider === 'groq' 
                      ? '초당 30 토큰을 무료로 처리할 수 있습니다.'
                      : '무료 할당량으로 충분히 사용 가능합니다.'}
                  </p>
                  <button
                    onClick={setupData.aiProvider === 'groq' ? handleGroqSetup : handleGeminiSetup}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 mb-4"
                  >
                    🔗 API 키 받으러 가기
                  </button>
                  <input
                    type="password"
                    placeholder={`${setupData.aiProvider === 'groq' ? 'gsk_...' : 'AIzaSy...'} 형식의 API 키`}
                    value={setupData.aiApiKey || ''}
                    onChange={(e) => updateSetupData('aiApiKey', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="bg-green-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">✨ AI 기능</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ 수신자 정보를 바탕으로 맞춤형 이메일 작성</li>
                    <li>✓ 개인화된 메시지를 자연스럽게 녹여내기</li>
                    <li>✓ 한국어/영어 자동 감지</li>
                    <li>✓ 전문적이면서도 친근한 톤</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep('gmail-oauth')}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-300"
                >
                  ← 이전
                </button>
                <button
                  onClick={() => setStep('template')}
                  disabled={!setupData.aiApiKey}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg disabled:opacity-50"
                >
                  다음 →
                </button>
              </div>
            </div>
          )}

          {/* Template */}
          {step === 'template' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">3</div>
                <h2 className="text-2xl font-bold text-gray-800">이메일 템플릿</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">📝 기본 템플릿 (선택사항)</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    AI가 이 템플릿을 바탕으로 개인화된 이메일을 작성합니다.
                    <br/>비워두면 AI가 처음부터 작성합니다.
                  </p>
                  <textarea
                    placeholder={`예시:
안녕하세요 {name}님,

{company}에서 근무하시는 것으로 알고 있습니다.
저희 서비스에 대해 소개드리고 싶어 연락드립니다.

{personalized_message}

감사합니다.`}
                    value={setupData.emailTemplate || ''}
                    onChange={(e) => updateSetupData('emailTemplate', e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    사용 가능한 변수: {'{name}'}, {'{company}'}, {'{position}'}, {'{personalized_message}'}
                  </p>
                </div>

                <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-300">
                  <h3 className="font-bold mb-3 text-yellow-800">💡 팁</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• 간단한 구조로 시작하세요</li>
                    <li>• AI가 개인화된 메시지를 자연스럽게 추가합니다</li>
                    <li>• 템플릿 없이도 훌륭한 이메일이 작성됩니다</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep('ai-setup')}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-300"
                >
                  ← 이전
                </button>
                <button
                  onClick={() => setStep('test')}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg"
                >
                  다음 →
                </button>
              </div>
            </div>
          )}

          {/* Test */}
          {step === 'test' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">4</div>
                <h2 className="text-2xl font-bold text-gray-800">테스트 및 완료</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">📋 설정 요약</h3>
                  <div className="bg-white p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gmail:</span>
                      <span className="font-mono">{setupData.gmailFromEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">AI Provider:</span>
                      <span className="font-mono">{setupData.aiProvider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">템플릿:</span>
                      <span>{setupData.emailTemplate ? '설정됨' : '기본값 사용'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">🚀 Vercel 배포</h3>
                  <button
                    onClick={copyEnvTemplate}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 mb-4"
                  >
                    📋 환경 변수 복사
                  </button>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li>1. Vercel Dashboard → Environment Variables</li>
                    <li>2. 복사한 변수들을 개별적으로 추가</li>
                    <li>3. 재배포</li>
                  </ol>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">🧪 테스트 이메일 발송 (선택)</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    환경 변수를 추가한 후 테스트할 수 있습니다.
                  </p>
                  <button
                    onClick={handleTestEmail}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white px-6 py-4 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? '발송 중...' : '📧 테스트 이메일 발송'}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep('template')}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-300"
                >
                  ← 이전
                </button>
                <button
                  onClick={() => setStep('complete')}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg"
                >
                  완료 →
                </button>
              </div>
            </div>
          )}

          {/* Complete */}
          {step === 'complete' && (
            <div className="text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                이메일 자동화 설정 완료!
              </h2>
              <p className="text-gray-600 mb-8">
                이제 명함을 스캔하면 AI가 자동으로 개인화된 이메일을 작성합니다.
              </p>

              <div className="bg-green-50 p-6 rounded-xl mb-8 text-left">
                <h3 className="font-bold mb-3">✅ 다음 단계</h3>
                <ol className="space-y-2 text-sm">
                  <li>1. 명함 스캔 및 Google Sheets 저장</li>
                  <li>2. Sheets에서 발송할 대상 확인</li>
                  <li>3. 이메일 발송 페이지에서 일괄 발송</li>
                  <li>4. 발송 결과 확인</li>
                </ol>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-300"
                >
                  홈으로
                </button>
                <button
                  onClick={() => window.location.href = '/email-sender'}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg"
                >
                  이메일 발송하러 가기 →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
