'use client';

import { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  session: any; //
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
    
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        setError(null);
        setIsReady(false);

        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
             width: { ideal: 1920 },
            height: { ideal: 1080 },
            aspectRatio: { ideal: 16/9 }
          }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = async () => {
            if (videoRef.current) {
              try {
                await videoRef.current.play();
                setIsReady(true);
              } catch (err) {
                console.error('Video play error:', err);
                setError('비디오 재생에 실패했습니다.');
              }
            }
          };
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('카메라 접근에 실패했습니다. 권한을 확인해주세요.');
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(imageData);
  };

  // 모바일: 전체화면 오버레이 스타일로 카메라 영역 최대화
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* 카메라 프리뷰 - 전체 화면 */}
        <div className="absolute inset-0">
          {error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-4">
                <p className="text-red-400 mb-4">{error}</p>
                <p className="text-white text-sm mb-4">
                  설정 → Safari/Chrome → 카메라 권한을 확인하세요
                </p>
                <button
                  onClick={onClose}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: '#000',
              }}
            />
          )}
        </div>
 
        {/* 로딩 오버레이 */}
        {!isReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white">카메라 준비 중...</p>
            </div>
          </div>
        )}
 
        {/* 상단 오버레이 - 닫기 버튼 + 안내 */}
        <div className="absolute top-0 left-0 right-0 z-20 safe-area-top">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <h2 className="text-white text-base font-bold flex items-center gap-2 drop-shadow-lg">
              📷 명함 촬영
            </h2>
            <button
              onClick={onClose}
              className="text-white bg-black/40 hover:bg-black/60 rounded-full w-9 h-9 flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              ✕
            </button>
          </div>
          {isReady && (
            <p className="text-xs text-amber-300 text-center pb-2 drop-shadow-lg">
              흔들리지 않게 찍어야 인식이 잘 됩니다.
            </p>
          )}
        </div>
 
        {/* 명함 가이드 오버레이 */}
        {isReady && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div
              className="border-3 border-white/80 rounded-2xl relative"
              style={{
                width: '92%',
                maxWidth: '600px',
                aspectRatio: '9/5.5',
              }}
            >
              {/* Corner markers */}
              <div className="absolute -top-1.5 -left-1.5 w-7 h-7 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg"></div>
              <div className="absolute -top-1.5 -right-1.5 w-7 h-7 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-4 border-r-4 border-yellow-400 rounded-br-lg"></div>
 
              {/* 안내 텍스트 */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap backdrop-blur-sm">
                명함을 이 영역에 맞춰주세요
              </div>
            </div>
          </div>
        )}
 
        {/* 하단 촬영 버튼 오버레이 */}
        {!error && (
          <div className="absolute bottom-0 left-0 right-0 z-20 safe-area-bottom">
            <div className="px-5 pb-5 pt-3">
              <button
                onClick={captureImage}
                disabled={!isReady}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all text-lg shadow-2xl ${
                  isReady
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 active:scale-95'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {isReady ? '📷 촬영하기' : '⏳ 준비 중...'}
              </button>
            </div>
          </div>
        )}
 
        {/* 숨겨진 캔버스 */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }
 
  // 데스크톱: 기존 레이아웃 유지

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 헤더 - 고정 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between flex-shrink-0 safe-area-top">
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
          📷 명함 촬영
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 상태 표시 - 고정 */}
      <div className="bg-blue-50 p-3 border-b border-blue-200 flex-shrink-0">
        <p className="text-sm text-center">
          {error ? '❌ 카메라 접근 실패' : isReady ? '✅ 준비 완료' : '⏳ 카메라 준비 중...'}
        </p>
        {isReady && (
          <p className="text-xs text-gray-600 text-center mt-1">💻 웹캠</p>
        )}
        <p className="text-xs text-amber-700 text-center mt-1">
          흔들리지 않게 찍어야 인식이 잘 됩니다.
        </p>
      </div>

      {/* 카메라 프리뷰 - 가변 */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden min-h-0">
        {error ? (
          <div className="text-center p-4">
            <p className="text-red-400 mb-4">{error}</p>
            <p className="text-white text-sm mb-4">
              설정 → Safari/Chrome → 카메라 권한을 확인하세요
            </p>
            <button
              onClick={onClose}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain"
              style={{ 
                display: 'block',
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                transform: 'scaleX(-1)',
              }}
            />
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-white">카메라 준비 중...</p>
                </div>
              </div>
            )}
            
            {/* 명함 가이드 오버레이 - Larger and Landscape */}
            {isReady && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div 
                  className="border-4 border-white rounded-2xl shadow-2xl relative"
                  style={{
                    width: '75%',
                    maxWidth: '800px',
                    aspectRatio: '16/9',
                  }}
                >
                  {/* Corner markers */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-yellow-400 rounded-tl-lg"></div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-yellow-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-yellow-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-yellow-400 rounded-br-lg"></div>
                  
                  {/* Top instruction */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap backdrop-blur-sm">
                    {isMobile ? '📱 명함을 가로로 맞춰주세요' : '💳 명함을 이 영역에 맞춰주세요'}
                  </div>
                  
                  {/* Bottom hint for mobile */}
                  {isMobile && (
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-xs whitespace-nowrap backdrop-blur-sm">
                      💡 휴대폰을 가로로 돌리세요
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 촬영 버튼 - 고정 하단 */}
      {!error && (
        <div className="bg-black/80 backdrop-blur-sm p-4 sm:p-6 border-t border-gray-700 flex-shrink-0 safe-area-bottom">
          <button
            onClick={captureImage}
            disabled={!isReady}
            className={`w-full py-4 sm:py-5 rounded-2xl font-bold text-white transition-all text-lg ${
              isReady
                ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 active:scale-95 shadow-lg hover:shadow-xl'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {isReady ? '📷 촬영하기' : '⏳ 준비 중...'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            💡 명함 전체가 잘 보이도록 촬영하세요
          </p>
        </div>
      )}

      {/* 숨겨진 캔버스 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}