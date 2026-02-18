// app/terms/page.tsx
export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">서비스 이용약관</h1>
        
        <div className="space-y-8 text-gray-700">
          <section>
            <p className="text-sm text-gray-500 mb-6">최종 업데이트: 2026년 2월 18일</p>
            <p className="mb-4">
              명함 관리(emember) 서비스(이하 "서비스")를 이용해 주셔서 감사합니다. 
              본 약관은 서비스 이용과 관련된 권리와 의무, 책임사항을 규정합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제1조 (목적)</h2>
            <p>
              본 약관은 명함 관리(emember) 서비스(이하 "서비스")의 이용과 관련하여 
              서비스 제공자와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제2조 (정의)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>"서비스"</strong>란 명함을 촬영하여 자동으로 정보를 인식하고 Google 스프레드시트에 저장하는 서비스를 말합니다.</li>
              <li><strong>"이용자"</strong>란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
              <li><strong>"명함 정보"</strong>란 이용자가 촬영한 명함에서 추출된 이름, 회사, 직책, 연락처 등의 정보를 말합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제3조 (서비스의 제공)</h2>
            <p className="mb-2">서비스는 다음의 기능을 제공합니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>명함 이미지 촬영 및 업로드</li>
              <li>AI 기반 명함 정보 자동 인식 (OCR)</li>
              <li>Google 스프레드시트 자동 생성 및 데이터 저장</li>
              <li>명함 정보 관리 및 검색</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제4조 (서비스 이용계약의 성립)</h2>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>서비스 이용계약은 이용자가 Google 계정으로 로그인하여 본 약관에 동의함으로써 성립됩니다.</li>
              <li>이용자는 Google OAuth를 통해 다음의 권한을 부여해야 합니다:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Google Drive 파일 생성 및 관리</li>
                  <li>Google Sheets 데이터 읽기/쓰기</li>
                  <li>Google Cloud Vision API 사용</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제5조 (이용자의 의무)</h2>
            <p className="mb-2">이용자는 다음 행위를 해서는 안 됩니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>타인의 명함을 무단으로 촬영하거나 정보를 수집하는 행위</li>
              <li>서비스를 통해 얻은 정보를 부정한 목적으로 사용하는 행위</li>
              <li>서비스의 안정적 운영을 방해하는 행위</li>
              <li>다른 이용자의 개인정보를 수집하거나 도용하는 행위</li>
              <li>관련 법령을 위반하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제6조 (서비스 제공자의 의무)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>서비스 제공자는 안정적이고 지속적인 서비스 제공을 위해 노력합니다.</li>
              <li>서비스 제공자는 이용자의 개인정보를 보호하기 위해 최선을 다합니다.</li>
              <li>서비스 제공자는 이용자의 의견을 존중하며, 정당한 의견이나 불만을 반영하기 위해 노력합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제7조 (데이터 소유권 및 저장)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>명함 스캔을 통해 생성된 데이터는 이용자의 Google Drive에 저장되며, 
                이용자가 완전한 소유권을 가집니다.</li>
              <li>서비스는 이용자의 명함 데이터를 별도로 저장하거나 상업적으로 이용하지 않습니다.</li>
              <li>이용자는 언제든지 자신의 Google Drive에서 생성된 스프레드시트를 삭제할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제8조 (OCR 정확도)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>서비스는 Google Cloud Vision API를 사용하여 명함 정보를 인식합니다.</li>
              <li>OCR 인식 정확도는 명함의 상태, 촬영 품질 등에 따라 달라질 수 있습니다.</li>
              <li>이용자는 인식된 정보의 정확성을 직접 확인하고 수정할 책임이 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제9조 (서비스의 중단)</h2>
            <p className="mb-2">서비스 제공자는 다음의 경우 서비스 제공을 일시적으로 중단할 수 있습니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>시스템 점검, 보수, 교체 등이 필요한 경우</li>
              <li>Google API 서비스의 장애가 발생한 경우</li>
              <li>천재지변, 국가비상사태 등 불가항력적 사유가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제10조 (면책조항)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>서비스는 무료로 제공되며, 있는 그대로(as-is) 제공됩니다.</li>
              <li>서비스 제공자는 Google API 서비스의 장애로 인한 손해에 대해 책임지지 않습니다.</li>
              <li>서비스 제공자는 이용자가 서비스를 이용함으로써 얻은 정보나 자료의 신뢰성, 
                정확성에 대해 보증하지 않습니다.</li>
              <li>이용자 간 또는 이용자와 제3자 간에 발생한 분쟁에 대해 서비스 제공자는 책임지지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제11조 (계정 해지)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>이용자는 언제든지 서비스 이용을 중단하고 계정을 해지할 수 있습니다.</li>
              <li>계정 해지 시 이용자의 Google Drive에 저장된 스프레드시트는 유지되며, 
                이용자가 직접 삭제할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제12조 (약관의 변경)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>서비스 제공자는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
              <li>약관이 변경되는 경우, 적용일자 및 변경사유를 명시하여 서비스 내에 공지합니다.</li>
              <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제13조 (준거법 및 재판관할)</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>본 약관의 해석 및 적용은 대한민국 법령을 따릅니다.</li>
              <li>서비스 이용과 관련하여 발생한 분쟁에 대해서는 대한민국 법원을 관할 법원으로 합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">제14조 (문의)</h2>
            <p className="mb-2">
              서비스 이용 관련 문의사항이 있으시면 아래로 연락주시기 바랍니다:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-2">
              <p><strong>이메일:</strong> unorhe@gmail.com</p>
            </div>
          </section>

          <section className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500">
              본 이용약관은 2026년 2월 18일부터 시행됩니다.
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
