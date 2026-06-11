(function() {
  'use strict';

  function buildGeneralInquiryMessage() {
    return encodeURIComponent('Hello VAIN.PRODUCTIONS! I have a question about your products.');
  }

  function setupContactWhatsApp() {
    var btn = document.getElementById('contact-whatsapp-btn');
    if (!btn) return;
    btn.href = '#';
    btn.target = '';
    btn.rel = '';
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (window.VainMessaging) {
        window.VainMessaging.openGeneralInquiry();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    setupContactWhatsApp();
  });
})();
