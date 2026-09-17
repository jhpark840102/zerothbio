# 문의 폼 → 관리자 이메일 전송 설정 (EmailJS)

홈페이지 문의 폼을 제출하면 **EmailJS**가 zerothbio@gmail.com으로 알림 메일을 즉시 보냅니다.
서버 없이 브라우저에서 바로 전송되며, 설정값은 `assets/js/config.js` **한 파일**에만 입력하면 영문·국문 페이지에 모두 적용됩니다. 소요 시간 약 10분.

> 이 폴더(`form-backend/`)는 사이트에서 사용하지 않습니다. 설정 후 저장소에서 지워도 됩니다.

## 1. 계정·메일 서비스 연결
1. https://www.emailjs.com 가입 (zerothbio@gmail.com 권장)
2. **Email Services → Add New Service → Gmail** → *Connect Account*로 zerothbio@gmail.com 연결
   - "Send email on your behalf" 권한 체크 필수
3. 생성된 **Service ID** 복사 (예: `service_ab12cd3`)

## 2. 템플릿 만들기
1. **Email Templates → Create New Template**
2. `emailjs/template-admin-notification.html` 파일 상단 주석의 **Settings** 값을 그대로 입력
   - To Email `zerothbio@gmail.com` · Reply To `{{reply_to}}` · Subject `[ZerothBIO 홈페이지 문의] {{topic}} — {{name}} ({{org}})`
3. Content → **Code editor**에 파일 본문(HTML) 붙여넣기 → Save
4. **Template ID** 복사 (예: `template_x9y8z7w`)
5. (선택) 문의자 자동 회신: **Auto-Reply** 탭에서 `emailjs/template-auto-reply.html`로 두 번째 템플릿 연결

템플릿에서 사용하는 변수 (사이트가 자동으로 채움):
`{{name}} {{org}} {{email}} {{reply_to}} {{topic}} {{message}} {{lang}} {{page}} {{submitted_at}} {{consent}}`

## 3. 공개 키 확인
**Account → General → Public Key** 복사

## 4. 사이트에 입력
`assets/js/config.js`
```js
emailjs: {
  publicKey:  'xxxxxxxxxxxxxxx',
  serviceId:  'service_ab12cd3',
  templateId: 'template_x9y8z7w'
},
```
커밋 → GitHub Pages 반영(1~2분) → 사이트에서 테스트 문의 제출 → 관리자 메일 수신 확인.
세 값 중 하나라도 비어 있으면 방문자 메일 앱을 여는 방식으로 자동 전환됩니다.

## 5. 보안 설정 (권장)
EmailJS **Account → Security**
- **Allowed origins / Domain restriction**: `https://www.zerothbio.com`, `https://zerothbio.com` (요금제에 따라 제공 여부가 다릅니다)
- 사이트 코드에 이미 적용된 보호: 헤드리스 브라우저 차단(`blockHeadless`), 10초 1회 전송 제한(`limitRate`), 숨김 필드(honeypot), 3초 이내 제출 무시
- Public Key는 원래 공개되는 값입니다. **Private Key는 절대 사이트에 넣지 마세요.**

## 요금·한도 (2026-09 기준, 변경될 수 있음)
| 플랜 | 월 요청 | 템플릿 | 비고 |
| --- | --- | --- | --- |
| Free | 200건 | 2개 | 발송 이력 7일, 도메인 제한 기능 없음 |
| Personal ($9/월) | 2,000건 | 6개 | 스팸이 늘면 전환 검토 |

자동 회신을 켜면 문의 1건에 메일 2통이 나가므로 한도가 더 빨리 소진될 수 있습니다.

## 개인정보 운영 (필수)
- EmailJS는 해외 사업자로, 문의 내용이 EmailJS를 거쳐 전송·일시 보관됩니다. **개인정보처리방침에 처리 위탁(EmailJS)·국외 이전 사항을 기재**해야 합니다.
- 폼 동의 문구의 보유 기간(문의 처리 후 1년)은 관리자 메일함 기준입니다. 기간이 지난 문의 메일은 정기 삭제하세요.

---

### 대안: Google Apps Script
외부 업체 없이 Google 계정 안에서만 처리하려면 `apps-script/apps-script.gs`를 사용하고,
`config.js`에서 `provider: 'endpoint'`, `endpoint: '<웹 앱 URL>'`로 설정합니다. (설정 절차: 이전 가이드 v2.2 참조 — 스프레드시트 → Apps Script → 웹 앱 배포)
