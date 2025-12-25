'use client';

import { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        setError(null);
        setIsReady(false);

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });

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

    // 좌우반전 해제 (원본 그대로 저장)
    ctx.save();
    ctx.scale(1, 1);  // 반전 없이 원본 그대로
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(imageData);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
          📷 카메라 설정 확인
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 상태 정보 */}
      <div className="bg-blue-50 p-3 border-b border-blue-200">
        <p className="text-sm">
          권한 상태: {error ? '❌ 거부됨' : isReady ? '✅ 카메라 권한이 허용되었습니다.' : '⏳ 카메라 준비 중...'}
        </p>
        {videoRef.current && (
          <p className="text-xs text-gray-600 mt-1">
            감지된 카메라: {videoRef.current.videoWidth}x{videoRef.current.videoHeight || '준비 중...'}
          </p>
        )}
      </div>

      {/* 카메라 프리뷰 */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
        {error ? (
          <div className="text-center p-4">
            <p className="text-red-400 mb-4">{error}</p>
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
                transform: 'scaleX(-1)'  // 좌우반전 (미리보기만)
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
          </>
        )}
      </div>

      {/* 캡처 버튼 */}
      {!error && (
        <div className="bg-white p-4 border-t border-gray-200">
          <button
            onClick={captureImage}
            disabled={!isReady}
            className={`w-full py-4 rounded-lg font-bold text-white transition-all ${
              isReady
                ? 'bg-red-600 hover:bg-red-700 active:scale-95'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isReady ? '📷 카메라 촬영' : '⏳ 카메라 준비 중...'}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            💡 명함이 화면에 잘 보이도록 조정 후 촬영해주세요
          </p>
        </div>
      )}

      {/* 숨겨진 캔버스 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}