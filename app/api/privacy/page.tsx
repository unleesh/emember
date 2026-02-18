// app/privacy/page.tsx
export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
        
        <div className="space-y-8 text-gray-700">
          <section>
            <p className="text-sm text-gray-500 mb-6">최종 업데이트: 2026년 2월 18일</p>
            <p className="mb-4">
              명함 관리(emember) 서비스(이하 "서비스")는 사용자의 개인정보를 중요하게 생각하며, 
              개인정보보호법 및 관련 법령을 준수하고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 수집하는 개인정보 항목</h2>
            <p className="mb-2">서비스는 다음의 개인정보를 수집합니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>필수 정보:</strong> Google 계정 이메일 주소, 이름</li>
              <li><strong>명함 정보:</strong> 명함 촬영 시 인식된 이름, 회사명, 직책, 이메일, 전화번호, 주소, 웹사이트</li>
              <li><strong>서비스 이용 정보:</strong> 명함 스캔 일시, 사용자 활동 기록</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 개인정보의 수집 및 이용 목적</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>서비스 회원 가입 및 관리</li>
              <li>명함 정보 OCR 처리 및 저장</li>
              <li>Google 스프레드시트 자동 생성 및 관리</li>
              <li>서비스 개선 및 사용자 경험 향상</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Google API 사용 및 권한</h2>
            <p className="mb-2">서비스는 다음의 Google API를 사용하며, 해당 권한을 요청합니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Google Drive API:</strong> 스프레드시트 파일 생성 및 관리</li>
              <li><strong>Google Sheets API:</strong> 명함 데이터 자동 저장 및 업데이트</li>
              <li><strong>Google Cloud Vision API:</strong> 명함 이미지 텍스트 인식 (OCR)</li>
            </ul>
            <p className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
              <strong>중요:</strong> 서비스는 사용자의 Google Drive에서 오직 본 앱이 생성한 파일만 접근하며, 
              다른 파일에는 일체 접근하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 개인정보의 보유 및 이용 기간</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>회원 탈퇴 시까지 보유</li>
              <li>사용자가 명함 데이터 삭제 요청 시 즉시 삭제</li>
              <li>법령에 따라 보관이 필요한 경우 해당 기간 동안 보관</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 개인정보의 제3자 제공</h2>
            <p>
              서비스는 원칙적으로 사용자의 개인정보를 제3자에게 제공하지 않습니다. 
              단, 다음의 경우는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>사용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 요구되는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Google 사용자 데이터 정책 준수</h2>
            <p className="mb-2">
              본 서비스는 <a href="https://developers.google.com/terms/api-services-user-data-policy" 
              target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Google API Services User Data Policy
              </a>를 준수하며, 제한적 사용 요구사항을 포함한 모든 정책을 따릅니다.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Google 사용자 데이터는 명시된 용도로만 사용됩니다</li>
              <li>데이터는 안전하게 전송되고 저장됩니다</li>
              <li>다른 용도로 양도, 판매되지 않습니다</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. 사용자의 권리</h2>
            <p className="mb-2">사용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정 요구</li>
              <li>개인정보 삭제 요구</li>
              <li>개인정보 처리 정지 요구</li>
              <li>Google 계정 연결 해제 (서비스 탈퇴)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. 개인정보 보호책임자</h2>
            <p className="mb-2">
              개인정보 처리에 관한 문의사항이 있으시면 아래로 연락주시기 바랍니다:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-2">
              <p><strong>이메일:</strong> unorhe@gmail.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. 개인정보처리방침의 변경</h2>
            <p>
              본 개인정보처리방침은 법령 및 서비스의 변경사항을 반영하기 위하여 수정될 수 있습니다. 
              개인정보처리방침이 변경되는 경우 서비스 내 공지사항을 통해 안내드리겠습니다.
            </p>
          </section>

          <section className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500">
              본 개인정보처리방침은 2026년 2월 18일부터 시행됩니다.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
