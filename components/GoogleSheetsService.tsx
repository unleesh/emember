'use client';

import { useState, useEffect } from 'react';
import type { BusinessCardData } from '../app/page';

interface GoogleSheetsServiceProps {
  data: BusinessCardData;
  onComplete: () => void;
  onBack: () => void;
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export default function GoogleSheetsService({ data, onComplete, onBack }: GoogleSheetsServiceProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

useEffect(() => {
  if (!CLIENT_ID || !API_KEY) {
    setError('Google API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
    setIsLoading(false);
    return;
  }
  
  // 로컬 스토리지에서 스프레드시트 ID 불러오기
  const savedSpreadsheetId = localStorage.getItem('businesscard_spreadsheet_id');
  if (savedSpreadsheetId) {
    setSpreadsheetId(savedSpreadsheetId);
  }
  
  // 저장된 토큰 복원
  const savedToken = localStorage.getItem('businesscard_access_token');
  const tokenExpiry = localStorage.getItem('businesscard_token_expiry');
  
  loadGoogleAPI();
  
  // 토큰이 있고 만료되지 않았다면 자동 로그인
  if (savedToken && tokenExpiry) {
    const expiryTime = parseInt(tokenExpiry);
    if (Date.now() < expiryTime) {
      setAccessToken(savedToken);
      setIsSignedIn(true);
    } else {
      // 만료된 토큰 삭제
      localStorage.removeItem('businesscard_access_token');
      localStorage.removeItem('businesscard_token_expiry');
    }
  }
}, []);

  const loadGoogleAPI = () => {
    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.async = true;
    gsiScript.defer = true;
    gsiScript.onload = () => {
      console.log('Google Identity Services loaded');
      loadGapiClient();
    };
    document.head.appendChild(gsiScript);
  };

  const loadGapiClient = () => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('GAPI script loaded');
      initializeGapiClient();
    };
    document.head.appendChild(script);
  };

const initializeGapiClient = () => {
  window.gapi.load('client', async () => {
    try {
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
      });
      console.log('GAPI client initialized');
      
      // 저장된 토큰이 있으면 설정
      const savedToken = localStorage.getItem('businesscard_access_token');
      if (savedToken && isSignedIn) {
        window.gapi.client.setToken({ access_token: savedToken });
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('GAPI client initialization error:', err);
      setError('Google API 초기화에 실패했습니다.');
      setIsLoading(false);
    }
  });
};

const handleSignIn = () => {
  const client = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response: any) => {
      if (response.access_token) {
        setAccessToken(response.access_token);
        setIsSignedIn(true);
        
        // 토큰을 로컬 스토리지에 저장 (1시간 후 만료)
        const expiryTime = Date.now() + (3600 * 1000); // 1시간
        localStorage.setItem('businesscard_access_token', response.access_token);
        localStorage.setItem('businesscard_token_expiry', expiryTime.toString());
        
        window.gapi.client.setToken({ access_token: response.access_token });
      }
    },
  });
  client.requestAccessToken();
};

const handleSignOut = () => {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      console.log('Token revoked');
    });
  }
  
  // 로컬 스토리지에서 토큰 삭제
  localStorage.removeItem('businesscard_access_token');
  localStorage.removeItem('businesscard_token_expiry');
  
  setAccessToken(null);
  setIsSignedIn(false);
  window.gapi.client.setToken(null);
};

 const saveToGoogleSheets = async () => {
  if (!spreadsheetId.trim()) {
    setError('스프레드시트 ID를 입력해주세요.');
    return;
  }

  if (!window.gapi?.client?.sheets) {
    setError('Google Sheets API가 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
    return;
  }

  setIsSaving(true);
  setError(null);

  try {
    // 1. 먼저 현재 데이터가 몇 행까지 있는지 확인
    const rangeToCheck = 'A:A'; // A열만 확인
    const checkResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId.trim(),
      range: rangeToCheck,
    });

    // 다음 빈 행 번호 계산
    const existingRows = checkResponse.result.values?.length || 0;
    const nextRow = existingRows + 1;

    // 전화번호 앞에 작은따옴표 추가 (텍스트로 저장)
    const phoneFormatted = data.phone ? `'${data.phone}` : '';
    
    const values = [[
      new Date().toLocaleString('ko-KR'),
      data.name,
      data.company,
      data.position,
      data.email,
      phoneFormatted,
      data.address,
      data.website
    ]];

    // 2. 정확한 위치에 데이터 추가
    const targetRange = `A${nextRow}:H${nextRow}`;
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId.trim(),
      range: targetRange,
      valueInputOption: 'USER_ENTERED',
      resource: { values }
    });

    if (response.status === 200) {
      // 스프레드시트 ID 로컬 스토리지에 저장
      localStorage.setItem('businesscard_spreadsheet_id', spreadsheetId.trim());
      
      setSavedUrl(`https://docs.google.com/spreadsheets/d/${spreadsheetId.trim()}`);
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  } catch (err: any) {
    console.error('저장 실패:', err);
    if (err.status === 404) {
      setError('스프레드시트를 찾을 수 없습니다. ID를 확인해주세요.');
    } else if (err.status === 403) {
      setError('스프레드시트에 대한 접근 권한이 없습니다.');
    } else {
      setError('저장 중 오류가 발생했습니다: ' + (err.result?.error?.message || err.message));
    }
    setIsSaving(false);
  }
};

  const clearSavedSpreadsheetId = () => {
    localStorage.removeItem('businesscard_spreadsheet_id');
    setSpreadsheetId('');
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center gap-3">
          <button onClick={onBack} className="text-white hover:bg-white/20 rounded-full p-2">←</button>
          <h2 className="text-white text-lg font-bold">📊 Google Sheets 연동</h2>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Google API 로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isSignedIn) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center gap-3">
          <button onClick={onBack} className="text-white hover:bg-white/20 rounded-full p-2">←</button>
          <h2 className="text-white text-lg font-bold">📊 Google Sheets 연동</h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3">설정 오류</h2>
              <p className="text-red-600 mb-6">{error}</p>

              <div className="bg-white rounded-lg p-4 text-left text-sm mb-6">
                <p className="font-bold mb-2">✅ 해결 방법:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-700">
                  <li>프로젝트 루트에 <code className="bg-gray-100 px-1">.env.local</code> 파일 생성</li>
                  <li>다음 내용 추가:
                    <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-x-auto">
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key</pre>
                  </li>
                  <li>개발 서버 재시작 (<code className="bg-gray-100 px-1">npm run dev</code>)</li>
                </ol>
              </div>

              <button
                onClick={onBack}
                className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700"
              >
                이전 단계로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center gap-3">
          <button onClick={onBack} className="text-white hover:bg-white/20 rounded-full p-2">←</button>
          <h2 className="text-white text-lg font-bold">📊 Google Sheets 연동</h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📊</span>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Google 로그인</h2>
              <p className="text-gray-600 mb-8">
                Google Sheets에 명함 정보를 저장하려면 로그인이 필요합니다.
              </p>

              <button
                onClick={handleSignIn}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
                Google로 로그인
              </button>

              <p className="text-xs text-gray-500 mt-4">
                💡 로그인 정보와 스프레드시트 ID가 저장됩니다
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (savedUrl) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4">
          <h2 className="text-white text-lg font-bold flex items-center gap-2">✓ 저장 완료</h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-3">저장 완료!</h2>
            <p className="text-gray-600 mb-8">
              명함 정보가 Google Sheets에 성공적으로 저장되었습니다.
            </p>

            <a>
              href={savedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-green-600 text-white py-4 rounded-xl font-bold mb-3 hover:bg-green-700"
          
              📊 스프레드시트 열기
            </a>

            <button
              onClick={onComplete}
              className="w-full bg-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-300"
            >
              새 명함 스캔하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white hover:bg-white/20 rounded-full p-2">←</button>
          <h2 className="text-white text-lg font-bold">📊 Google Sheets 저장</h2>
        </div>
        <button
          onClick={handleSignOut}
          className="text-white text-sm hover:bg-white/20 px-3 py-1 rounded"
        >
          로그아웃
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              👀 저장될 데이터 미리보기
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex"><span className="font-bold w-24">이름:</span><span>{data.name}</span></div>
              <div className="flex"><span className="font-bold w-24">회사:</span><span>{data.company}</span></div>
              <div className="flex"><span className="font-bold w-24">직책:</span><span>{data.position}</span></div>
              <div className="flex"><span className="font-bold w-24">이메일:</span><span>{data.email}</span></div>
              <div className="flex"><span className="font-bold w-24">전화:</span><span>{data.phone}</span></div>
              <div className="flex"><span className="font-bold w-24">주소:</span><span>{data.address}</span></div>
              <div className="flex"><span className="font-bold w-24">웹사이트:</span><span>{data.website}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              📋 Google Sheets 스프레드시트 ID
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="스프레드시트 ID를 입력하세요"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              {spreadsheetId && (
                <button
                  onClick={clearSavedSpreadsheetId}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  title="저장된 ID 삭제"
                >
                  🗑️
                </button>
              )}
            </div>
            
            {spreadsheetId && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-green-800 text-sm">
                  ✅ 저장된 스프레드시트 ID를 사용합니다
                </p>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <p className="font-bold text-yellow-800 mb-2">💡 스프레드시트 ID 찾는 방법:</p>
              <ol className="list-decimal list-inside space-y-1 text-yellow-700">
                <li>Google Sheets에서 명함 저장용 시트를 엽니다</li>
                <li>URL에서 /d/ 다음에 오는 긴 문자열을 복사합니다</li>
                <li>예: docs.google.com/spreadsheets/d/<strong>여기부분</strong>/edit</li>
              </ol>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm">❌ {error}</p>
            </div>
          )}

          <button
            onClick={saveToGoogleSheets}
            disabled={isSaving || !spreadsheetId.trim()}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
              isSaving || !spreadsheetId.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-blue-600 hover:shadow-lg active:scale-95'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> 저장 중...
              </span>
            ) : (
              '💾 Google Sheets에 저장하기'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            💡 스프레드시트 ID는 다음에도 자동으로 불러옵니다
          </p>
        </div>
      </div>
    </div>
  );
}