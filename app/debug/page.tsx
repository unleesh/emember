'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');

  const testRedis = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/test-redis');
      const data = await response.json();
      setResults({ type: 'redis', data });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    if (!spreadsheetId.trim()) {
      setError('Spreadsheet ID를 입력하세요');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const configStr = localStorage.getItem('emember_config');
      let userConfig = null;
      
      if (configStr) {
        try {
          userConfig = JSON.parse(configStr);
        } catch (e) {
          console.error('Config parse error:', e);
        }
      }

      const response = await fetch('/api/subscription/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userConfig: userConfig || {
            spreadsheetId: spreadsheetId.trim(),
          }
        }),
      });

      const data = await response.json();
      setResults({ type: 'subscription', data });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    const configStr = localStorage.getItem('emember_config');
    if (configStr) {
      try {
        const userConfig = JSON.parse(configStr);
        setSpreadsheetId(userConfig.spreadsheetId || '');
      } catch (e) {
        console.error('Config parse error:', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔍 emember 디버깅 콘솔
          </h1>
          <p className="text-gray-600 mb-8">
            Redis 연결 상태와 구독 정보를 확인할 수 있습니다.
          </p>

          {/* Redis 테스트 */}
          <div className="mb-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📊 Redis 연결 테스트
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Redis 연결 상태와 환경 변수를 확인합니다.
            </p>
            <button
              onClick={testRedis}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '테스트 중...' : 'Redis 연결 테스트'}
            </button>
          </div>

          {/* 구독 상태 확인 */}
          <div className="mb-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              💳 구독 상태 확인
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spreadsheet ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="스프레드시트 ID 입력"
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={loadFromLocalStorage}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 text-sm"
                  >
                    localStorage에서 불러오기
                  </button>
                </div>
              </div>
              <button
                onClick={checkSubscription}
                disabled={loading || !spreadsheetId.trim()}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '확인 중...' : '구독 상태 확인'}
              </button>
            </div>
          </div>

          {/* 에러 표시 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <h3 className="font-bold text-red-800 mb-2">❌ 오류</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* 결과 표시 */}
          {results && (
            <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📋 결과
              </h3>
              
              {results.type === 'redis' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${results.data.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                    <div className="font-bold mb-2">
                      {results.data.success ? '✅ Redis 연결 성공' : '❌ Redis 연결 실패'}
                    </div>
                    {results.data.error && (
                      <div className="text-sm text-red-700 mb-2">
                        <strong>에러:</strong> {results.data.error}
                      </div>
                    )}
                    {results.data.hint && (
                      <div className="text-sm text-blue-700">
                        <strong>힌트:</strong> {results.data.hint}
                      </div>
                    )}
                  </div>

                  {results.data.envCheck && (
                    <div className="p-4 bg-white rounded-lg">
                      <h4 className="font-bold mb-2">환경 변수 상태:</h4>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                        {JSON.stringify(results.data.envCheck, null, 2)}
                      </pre>
                    </div>
                  )}

                  {results.data.usedCredentials && (
                    <div className="p-4 bg-white rounded-lg">
                      <h4 className="font-bold mb-2">사용 중인 인증 정보:</h4>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                        {JSON.stringify(results.data.usedCredentials, null, 2)}
                      </pre>
                    </div>
                  )}

                  {results.data.test && (
                    <div className="p-4 bg-white rounded-lg">
                      <h4 className="font-bold mb-2">테스트 결과:</h4>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                        {JSON.stringify(results.data.test, null, 2)}
                      </pre>
                    </div>
                  )}

                  {results.data.allKeys && (
                    <div className="p-4 bg-white rounded-lg">
                      <h4 className="font-bold mb-2">
                        Redis에 저장된 모든 키 ({results.data.keyCount}개):
                      </h4>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                        {JSON.stringify(results.data.allKeys, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {results.type === 'subscription' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${results.data.hasSubscription ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
                    <div className="font-bold mb-2">
                      {results.data.hasSubscription ? '✅ 구독 중' : '❌ 구독 없음'}
                    </div>
                    {results.data.error && (
                      <div className="text-sm text-red-700 mb-2">
                        <strong>에러:</strong> {results.data.error}
                      </div>
                    )}
                    {results.data.sheetsError && (
                      <div className="text-sm text-yellow-700 mb-2">
                        <strong>Sheets 경고:</strong> {results.data.sheetsError}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white rounded-lg">
                    <h4 className="font-bold mb-2">구독 정보:</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Spreadsheet ID:</strong>{' '}
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          {results.data.spreadsheetId || 'N/A'}
                        </code>
                      </div>
                      <div>
                        <strong>구독 상태:</strong>{' '}
                        <span className={results.data.hasSubscription ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                          {results.data.hasSubscription ? '✅ 구독 중' : '❌ 구독 없음'}
                        </span>
                      </div>
                      <div>
                        <strong>저장된 명함 수:</strong> {results.data.cardCount || 0}명
                      </div>
                      <div>
                        <strong>무료 한도:</strong> {results.data.freeLimit || 5}명
                      </div>
                      <div>
                        <strong>구독 필요:</strong>{' '}
                        <span className={results.data.needsSubscription ? 'text-yellow-600 font-bold' : 'text-green-600'}>
                          {results.data.needsSubscription ? '⚠️ 예' : '✅ 아니오'}
                        </span>
                      </div>
                      <div>
                        <strong>메시지:</strong> {results.data.message || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg">
                    <h4 className="font-bold mb-2">전체 응답:</h4>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                      {JSON.stringify(results.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 사용 가이드 */}
          <div className="mt-8 p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
            <h3 className="font-bold text-yellow-800 mb-2">💡 사용 가이드</h3>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>
                <strong>Redis 연결 테스트:</strong> Vercel 환경 변수 설정이 올바른지 확인합니다.
              </li>
              <li>
                <strong>구독 상태 확인:</strong> Spreadsheet ID를 입력하여 해당 시트의 구독 상태를 확인합니다.
              </li>
              <li>
                <strong>localStorage에서 불러오기:</strong> 브라우저에 저장된 설정에서 Spreadsheet ID를 자동으로 불러옵니다.
              </li>
              <li>
                <strong>문제 해결:</strong> Redis 연결이 실패하면 Vercel Dashboard에서 환경 변수를 확인하세요.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
