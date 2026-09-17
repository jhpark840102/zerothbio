/*
 * ZerothBIO website — contact form settings (EN + KR pages share this file)
 * Fill in the three EmailJS values after setup (see form-backend/README.md).
 * If they are empty, the form falls back to opening the visitor's email app.
 */
window.ZBIO_FORM = {
  provider: 'emailjs',            // 'emailjs' | 'endpoint' | 'mailto'

  emailjs: {
    publicKey:  '56FygKIIqogu5u9iI',               // Account → General → Public Key
    serviceId:  'service_2xtbnzv',               // Email Services → service_2xtbnzv
    templateId: 'ejs-test-mail-service'                // Email Templates → ejs-test-mail-service
  },

  endpoint: 'zerothbio.com',                   // alternative backend URL (Apps Script / Formspree) when provider = 'endpoint'
  adminEmail: 'jh.park8401@gmail.com',
  minFillMs: 3000,                // submissions faster than this are treated as bots
  throttleMs: 10000               // one submission per 10 s per browser
};
