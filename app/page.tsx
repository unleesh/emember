// app/page.tsx
'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import CameraCapture from '@/components/CameraCapture';
import OCRProcessor from '@/components/OCRProcessor';

// ✅ 타입 정의 (파일 상단에 추가)
export interface BusinessCardData {
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  rawText?: string;
  personalizedMessage?: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [currentView, setCurrentView] = useState<'home' | 'camera' | 'ocr'>('home');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📇</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              명함 관리
            </h1>
            <p className="text-gray-600">
              AI로 명함을 스캔하고<br/>
              자동으로 Google 스프레드시트에 저장
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="space-y-4">
              <Feature
                icon="📸"
                title="명함 촬영"
                description="카메라로 명함을 찍기만 하세요"
              />
              <Feature
                icon="🤖"
                title="AI 인식"
                description="Google Vision이 자동으로 정보 추출"
              />
              <Feature
                icon="📊"
                title="자동 저장"
                description="내 스프레드시트에 깔끔하게 정리"
              />
            </div>
          </div>

          <button
            onClick={() => signIn('google')}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-xl shadow-lg border-2 border-gray-200 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google 계정으로 시작하기
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            로그인하면{' '}
            <a 
              href="/terms" 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              서비스 이용약관
            </a>
            {' '}및{' '}
            <a 
              href="/privacy" 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              개인정보처리방침
            </a>
            에 동의하게 됩니다.
          </p>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800 text-center">
              💡 <strong>완전 무료!</strong> API 키 설정 불필요<br/>
              Google 로그인만으로 바로 사용 가능
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'camera') {
    return (
      <CameraCapture
        onCapture={(imageData) => {
          setCapturedImage(imageData);
          setCurrentView('ocr');
        }}
        onClose={() => {
          setCurrentView('home');
          setCapturedImage(null);
        }}
        session={session}
      />
    );
  }

  if (currentView === 'ocr' && capturedImage) {
    return (
      <OCRProcessor
        imageData={capturedImage}
        onComplete={async (data: BusinessCardData) => {
          if (session) {
            try {
              console.log('📊 스프레드시트 저장 시작...');
              
              const response = await fetch('/api/sheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data }),
              });

              if (response.ok) {
                const result = await response.json();
                console.log('✅ 저장 완료:', result.spreadsheetUrl);
                alert('✅ 명함 정보가 스프레드시트에 저장되었습니다!');
              } else {
                console.error('❌ 저장 실패:', await response.text());
                alert('❌ 저장에 실패했습니다. 다시 시도해주세요.');
              }
            } catch (error) {
              console.error('❌ 저장 오류:', error);
              alert('❌ 저장 중 오류가 발생했습니다.');
            }
          }

          setCurrentView('home');
          setCapturedImage(null);
        }}
        onBack={() => {
          setCurrentView('camera');
          setCapturedImage(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📇</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              환영합니다!
            </h1>
            <p className="text-gray-600">
              {session?.user?.name || session?.user?.email}님
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setCurrentView('camera')}
              className="w-full bg-blue-600 text-white py-4 px-4 rounded-lg font-semibold text-center hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <span className="text-2xl">📸</span>
              <span>명함 촬영하기</span>
            </button>

            <button
              onClick={() => {
                window.open('https://docs.google.com/spreadsheets/u/0/', '_blank');
              }}
              className="w-full bg-green-600 text-white py-4 px-4 rounded-lg font-semibold text-center hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <span className="text-2xl">📊</span>
              <span>스프레드시트 열기</span>
            </button>

            <button
              onClick={() => signOut()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium text-center hover:bg-gray-200 transition"
            >
              로그아웃
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 명함을 촬영하면 자동으로 "명함 관리" 스프레드시트에 저장됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-3xl flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
