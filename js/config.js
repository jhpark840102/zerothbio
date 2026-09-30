/*
 * ZerothBIO website — contact form settings (EN + KR pages share this file)
 * Fill in the three EmailJS values after setup (see form-backend/README.md).
 * If they are empty, the form falls back to opening the visitor's email app.
 */
window.ZBIO_FORM = {
  provider: 'emailjs',            // 'emailjs' | 'endpoint' | 'mailto'

  emailjs: {
    publicKey:  '',               // Account → General → Public Key
    serviceId:  '',               // Email Services → Service ID (e.g. service_xxxxxxx)
    templateId: ''                // Email Templates → admin notification Template ID (e.g. template_xxxxxxx)
  },

  endpoint: '',                   // alternative backend URL (Apps Script / Formspree) when provider = 'endpoint'
  adminEmail: 'zerothbio01@gmail.com',
  minFillMs: 3000,                // submissions faster than this are treated as bots
  throttleMs: 10000               // one submission per 10 s per browser
};
