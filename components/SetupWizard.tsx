'use client';

import { useState } from 'react';

type SetupStep = 
  | 'welcome'
  | 'google-cloud'
  | 'sheets-setup'
  | 'test'
  | 'complete';

interface SetupData {
  projectId?: string;
  serviceAccountEmail?: string;
  privateKey?: string;
  spreadsheetId?: string;
}

export default function SetupWizard() {
  const [step, setStep] = useState<SetupStep>('welcome');
  const [setupData, setSetupData] = useState<SetupData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSetupData = (key: keyof SetupData, value: string) => {
    setSetupData(prev => ({ ...prev, [key]: value }));
  };

  const handleGoogleCloudSetup = () => {
    window.open('https://console.cloud.google.com/projectcreate', '_blank');
  };

  const handleApiEnable = (apiName: string) => {
    const urls: Record<string, string> = {
      'sheets': 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
      'vision': 'https://console.cloud.google.com/apis/library/vision.googleapis.com',
    };
    window.open(urls[apiName], '_blank');
  };

  const handleSheetsCreate = () => {
    window.open('https://sheets.google.com/create', '_blank');
  };

  const handleServiceAccountSetup = () => {
    window.open('https://console.cloud.google.com/iam-admin/serviceaccounts', '_blank');
  };

  const handleTestSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData),
      });

      const result = await response.json();

      if (result.success) {
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
    const template = `# Google Cloud Vision (명함 OCR)
GOOGLE_CLOUD_PROJECT_ID=${setupData.projectId || 'your-project-id'}

# Google Sheets (데이터 저장)
GOOGLE_SERVICE_ACCOUNT_EMAIL=${setupData.serviceAccountEmail || 'service@project.iam.gserviceaccount.com'}
GOOGLE_PRIVATE_KEY="${setupData.privateKey || 'your-private-key'}"
GOOGLE_SPREADSHEET_ID=${setupData.spreadsheetId || 'your-spreadsheet-id'}`;

    navigator.clipboard.writeText(template).then(() => {
      alert('✅ 환경 변수가 클립보드에 복사되었습니다!\n\nVercel Dashboard → Settings → Environment Variables에 붙여넣으세요.');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📇 emember 설정하기
          </h1>
          <p className="text-gray-600">
            명함 스캔 및 자동 저장 - 5분이면 충분해요! ✨
          </p>
        </div>

        {/* 진행 상황 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">진행률</span>
            <span className="text-sm font-medium text-blue-600">
              {step === 'welcome' && '0%'}
              {step === 'google-cloud' && '25%'}
              {step === 'sheets-setup' && '50%'}
              {step === 'test' && '75%'}
              {step === 'complete' && '100%'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{
                width:
                  step === 'welcome' ? '0%' :
                  step === 'google-cloud' ? '25%' :
                  step === 'sheets-setup' ? '50%' :
                  step === 'test' ? '75%' : '100%'
              }}
            />
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Welcome */}
          {step === 'welcome' && (
            <div className="text-center">
              <div className="text-6xl mb-6">👋</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">환영합니다!</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                명함을 스캔하고 Google Sheets에 자동으로 저장하는 시스템을 설정합니다.
                <br />
                간단한 4단계만 따라오세요! 😊
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-blue-50 rounded-xl">
                  <div className="text-3xl mb-2">📸</div>
                  <h3 className="font-bold mb-2">명함 스캔</h3>
                  <p className="text-sm text-gray-600">카메라로 촬영</p>
                </div>
                <div className="p-6 bg-purple-50 rounded-xl">
                  <div className="text-3xl mb-2">🤖</div>
                  <h3 className="font-bold mb-2">AI 인식</h3>
                  <p className="text-sm text-gray-600">자동으로 정보 추출</p>
                </div>
                <div className="p-6 bg-pink-50 rounded-xl">
                  <div className="text-3xl mb-2">✏️</div>
                  <h3 className="font-bold mb-2">정보 수정</h3>
                  <p className="text-sm text-gray-600">확인 및 편집</p>
                </div>
                <div className="p-6 bg-green-50 rounded-xl">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-bold mb-2">자동 저장</h3>
                  <p className="text-sm text-gray-600">Sheets에 저장</p>
                </div>
              </div>

              <button
                onClick={() => setStep('google-cloud')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all"
              >
                시작하기 🚀
              </button>
            </div>
          )}

          {/* Step 1: Google Cloud */}
          {step === 'google-cloud' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">1</div>
                <h2 className="text-2xl font-bold text-gray-800">Google Cloud 프로젝트</h2>
              </div>

              <div className="space-y-6">
                {/* 프로젝트 생성 */}
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <span>1️⃣</span> 프로젝트 생성
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-700 mb-4">
                    <li>✓ 아래 버튼을 클릭하여 Google Cloud Console 접속</li>
                    <li>✓ 프로젝트 이름: <code className="bg-white px-2 py-1 rounded">emember-scanner</code></li>
                    <li>✓ 프로젝트 ID를 복사하여 아래에 붙여넣기</li>
                  </ol>
                  <button
                    onClick={handleGoogleCloudSetup}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 mb-4"
                  >
                    🌐 프로젝트 생성하러 가기
                  </button>
                  <input
                    type="text"
                    placeholder="프로젝트 ID (예: emember-scanner-12345)"
                    value={setupData.projectId || ''}
                    onChange={(e) => updateSetupData('projectId', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* API 활성화 */}
                <div className="bg-purple-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <span>2️⃣</span> API 활성화
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    각 버튼을 클릭하고 "사용 설정" 버튼을 누르세요
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleApiEnable('vision')}
                      className="w-full bg-white border-2 border-purple-300 text-purple-700 px-4 py-3 rounded-lg font-medium hover:bg-purple-100 text-left flex items-center justify-between"
                    >
                      <span>👁️ Cloud Vision API (명함 인식용)</span>
                      <span className="text-xs">→</span>
                    </button>
                    <button
                      onClick={() => handleApiEnable('sheets')}
                      className="w-full bg-white border-2 border-purple-300 text-purple-700 px-4 py-3 rounded-lg font-medium hover:bg-purple-100 text-left flex items-center justify-between"
                    >
                      <span>📊 Google Sheets API (데이터 저장용)</span>
                      <span className="text-xs">→</span>
                    </button>
                  </div>
                </div>

                {/* Service Account */}
                <div className="bg-pink-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <span>3️⃣</span> Service Account 생성
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-700 mb-4">
                    <li>✓ IAM & Admin → Service Accounts 메뉴</li>
                    <li>✓ "CREATE SERVICE ACCOUNT" 클릭</li>
                    <li>✓ 이름: emember-service, Role: Editor</li>
                    <li>✓ Keys 탭 → ADD KEY → Create new key → JSON</li>
                    <li>✓ 다운로드된 JSON 파일 열기</li>
                  </ol>
                  <button
                    onClick={handleServiceAccountSetup}
                    className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 mb-4"
                  >
                    🔐 Service Account 만들러 가기
                  </button>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="client_email (JSON의 client_email 값)"
                      value={setupData.serviceAccountEmail || ''}
                      onChange={(e) => updateSetupData('serviceAccountEmail', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    />
                    <textarea
                      placeholder="private_key (JSON의 private_key 값, -----BEGIN PRIVATE KEY-----로 시작)"
                      value={setupData.privateKey || ''}
                      onChange={(e) => updateSetupData('privateKey', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep('welcome')}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-300"
                >
                  ← 이전
                </button>
                <button
                  onClick={() => setStep('sheets-setup')}
                  disabled={!setupData.projectId || !setupData.serviceAccountEmail || !setupData.privateKey}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음 →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Sheets */}
          {step === 'sheets-setup' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">2</div>
                <h2 className="text-2xl font-bold text-gray-800">Google Sheets 설정</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">📊 스프레드시트 생성</h3>
                  <ol className="space-y-2 text-sm text-gray-700 mb-4">
                    <li>✓ 아래 버튼으로 새 스프레드시트 생성</li>
                    <li>✓ 이름: <code className="bg-white px-2 py-1 rounded">명함 데이터베이스</code></li>
                    <li>✓ URL에서 긴 ID 부분 복사 (예: 1a2b3c4d5e...)</li>
                  </ol>
                  <button
                    onClick={handleSheetsCreate}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 mb-4"
                  >
                    📊 스프레드시트 생성
                  </button>
                  <input
                    type="text"
                    placeholder="Spreadsheet ID"
                    value={setupData.spreadsheetId || ''}
                    onChange={(e) => updateSetupData('spreadsheetId', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div className="bg-yellow-50 p-6 rounded-xl border-2 border-yellow-300">
                  <h3 className="font-bold mb-3 text-yellow-800">⚠️ 중요: 스프레드시트 공유</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    생성한 스프레드시트를 Service Account와 공유해야 합니다.
                  </p>
                  <div className="bg-white p-4 rounded-lg space-y-2 text-sm">
                    <p className="font-medium">공유 방법:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>스프레드시트 우측 상단 "공유" 버튼 클릭</li>
                      <li>아래 이메일 주소 입력:
                        <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs break-all">
                          {setupData.serviceAccountEmail || '(위에서 입력한 Service Account Email)'}
                        </div>
                      </li>
                      <li>권한: <strong>편집자</strong> 선택</li>
                      <li>"완료" 클릭</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep('google-cloud')}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-300"
                >
                  ← 이전
                </button>
                <button
                  onClick={() => setStep('test')}
                  disabled={!setupData.spreadsheetId}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음 →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Test */}
          {step === 'test' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 text-orange-600 w-10 h-10 rounded-full flex items-center justify-center font-bold">3</div>
                <h2 className="text-2xl font-bold text-gray-800">설정 확인 및 배포</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-orange-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">📋 입력한 정보</h3>
                  <div className="bg-white p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">프로젝트 ID:</span>
                      <span className="font-mono text-gray-800">{setupData.projectId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Account:</span>
                      <span className="font-mono text-gray-800 truncate max-w-xs">{setupData.serviceAccountEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spreadsheet ID:</span>
                      <span className="font-mono text-gray-800 truncate max-w-xs">{setupData.spreadsheetId}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl">
                  <h3 className="font-bold mb-3">🚀 Vercel 배포 방법</h3>
                  <ol className="space-y-3 text-sm text-gray-700">
                    <li>
                      <strong>1. 환경 변수 복사</strong>
                      <button
                        onClick={copyEnvTemplate}
                        className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs hover:bg-blue-700"
                      >
                        📋 복사하기
                      </button>
                    </li>
                    <li>
                      <strong>2. Vercel Dashboard 접속</strong>
                      <br />
                      Settings → Environment Variables 메뉴
                    </li>
                    <li>
                      <strong>3. 복사한 환경 변수 붙여넣기</strong>
                      <br />
                      각 변수를 개별적으로 추가
                    </li>
                    <li>
                      <strong>4. 재배포</strong>
                      <br />
                      Deployments → Redeploy
                    </li>
                  </ol>
                </div>

                {error && (
                  <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
                    <strong>오류:</strong> {error}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setStep('sheets-setup')}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-300"
                >
                  ← 이전
                </button>
                <button
                  onClick={() => setStep('complete')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-lg"
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
              <h2 className="text-3xl font-bold text-gray-800 mb-4">설정 완료!</h2>
              <p className="text-gray-600 mb-8">
                Vercel에 환경 변수를 추가하고 재배포하면 사용할 수 있습니다.
              </p>

              <div className="bg-green-50 p-6 rounded-xl mb-8">
                <h3 className="font-bold mb-3">✅ 다음 단계</h3>
                <ol className="text-left text-sm space-y-2">
                  <li>1. Vercel에 환경 변수 추가</li>
                  <li>2. 프로젝트 재배포</li>
                  <li>3. 명함 스캔 시작!</li>
                </ol>
              </div>

              <button
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:shadow-lg"
              >
                홈으로 가기 🏠
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
