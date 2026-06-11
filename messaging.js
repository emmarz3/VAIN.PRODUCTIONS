(function() {
  'use strict';

  var WHATSAPP_NUMBER = '+2349134141831';
  var TELEGRAM_USERNAME = '+2349134141831';
  var CHANNEL_STORAGE_KEY = 'vainPreferredChannel';
  var MAX_URL_LENGTH = 6000;

  var CHANNELS = {
    whatsapp: {
      id: 'whatsapp',
      name: 'WhatsApp',
      color: '#25d366',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>',
      phone: WHATSAPP_NUMBER
    },
    telegram: {
      id: 'telegram',
      name: 'Telegram',
      color: '#0088cc',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
      username: TELEGRAM_USERNAME
    }
  };

  function isIOSSafari() {
    var ua = navigator.userAgent;
    return /iP(hone|od|ad)/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
  }

  function isIOS() {
    return /iP(hone|od|ad)/.test(navigator.userAgent);
  }

  function getPreferredChannel() {
    var stored = localStorage.getItem(CHANNEL_STORAGE_KEY);
    if (stored === 'whatsapp' || stored === 'telegram') return stored;
    return 'whatsapp';
  }

  function setPreferredChannel(channel) {
    if (channel === 'whatsapp' || channel === 'telegram') {
      localStorage.setItem(CHANNEL_STORAGE_KEY, channel);
    }
  }

  function buildWaUrl(phone, encodedText) {
    var barePhone = phone.replace('+', '');
    var base = 'https://wa.me/' + barePhone + '?text=';
    var fullUrl = base + encodedText;
    if (fullUrl.length > MAX_URL_LENGTH) {
      var message = decodeURIComponent(encodedText);
      var truncated = message.substring(0, 1500);
      var lastNewline = truncated.lastIndexOf('\n');
      if (lastNewline > 800) truncated = truncated.substring(0, lastNewline);
      truncated += '\n\n[... Order continues in next message]';
      return base + encodeURIComponent(truncated);
    }
    return fullUrl;
  }

  function buildTgUrl(username, encodedText) {
    var base = 'https://t.me/' + username + '?text=';
    var fullUrl = base + encodedText;
    if (fullUrl.length > MAX_URL_LENGTH) {
      var message = decodeURIComponent(encodedText);
      var truncated = message.substring(0, 1500);
      var lastNewline = truncated.lastIndexOf('\n');
      if (lastNewline > 800) truncated = truncated.substring(0, lastNewline);
      truncated += '\n\n[... Order continues in next message]';
      return base + encodeURIComponent(truncated);
    }
    return fullUrl;
  }

  function openUrl(url) {
    if (isIOS()) {
      window.location.href = url;
      return;
    }
    var newWindow = window.open(url, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = url;
    }
  }

  function buildGeneralInquiryMessage() {
    return encodeURIComponent('Hello VAIN.PRODUCTIONS! I have a question about your products.');
  }

  function buildOrderMessage(orderData) {
    var msg = '\uD83D\uDED2 *NEW ORDER - VAIN.PRODUCTIONS*\n\n';
    msg += '\uD83D\uDCE6 *Order ID:* ' + orderData.orderId + '\n';
    msg += '\uD83D\uDCC5 *Date:* ' + new Date().toLocaleString() + '\n\n';
    msg += '\uD83D\uDC64 *CUSTOMER DETAILS*\n';
    msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
    msg += '\uD83D\uDCDD Name: ' + orderData.customer.name + '\n';
    msg += '\uD83D\uDCDE Phone: ' + orderData.customer.phone + '\n';
    if (orderData.customer.email) msg += '\u2709\uFE0F Email: ' + orderData.customer.email + '\n';
    msg += '\n\uD83C\uDFE0 *DELIVERY ADDRESS*\n';
    msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
    msg += orderData.customer.address + '\n';
    msg += orderData.customer.city + ', ' + orderData.customer.state + '\n';
    if (orderData.customer.zipCode) msg += orderData.customer.zipCode + '\n';
    msg += orderData.customer.country + '\n';
    msg += '\n\uD83D\uDE9A Delivery Method: ' + orderData.customer.deliveryMethod + '\n';
    if (orderData.customer.note) msg += '\n\uD83D\uDCC2 Order Notes: ' + orderData.customer.note + '\n';
    msg += '\n\uD83D\uDED2 *ORDER ITEMS*\n';
    msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
    orderData.items.forEach(function(item, idx) {
      msg += (idx + 1) + '. *' + item.name + '*\n';
      msg += '   Size: ' + item.size + ' | Color: ' + item.color + '\n';
      msg += '   Quantity: ' + item.quantity + ' | Price: \u20A6' + (item.price * item.quantity).toLocaleString() + '\n\n';
    });
    msg += '\uD83D\uDCB0 *ORDER SUMMARY*\n';
    msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
    msg += 'Subtotal: \u20A6' + orderData.subtotal.toLocaleString() + '\n';
    if (orderData.deliveryFee > 0) msg += 'Delivery: \u20A6' + orderData.deliveryFee.toLocaleString() + '\n';
    else msg += 'Delivery: Free\n';
    if (orderData.discount > 0) msg += 'Discount (' + orderData.coupon + '): -\u20A6' + orderData.discount.toLocaleString() + '\n';
    msg += '\n\uD83D\uDCB5 *TOTAL: \u20A6' + orderData.total.toLocaleString() + '*\n\n';
    msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
    msg += '\uD83D\uDCC4 *Receipt downloaded to your device*\n\n';
    msg += '\u2705 *Please confirm availability and provide delivery timeline.*\n';
    msg += '\uD83D\uDCB3 *Payment will be collected upon delivery.*\n\n';
    msg += 'Thank you for choosing VAIN.PRODUCTIONS! \uD83C\uDDF3\uD83C\uDDEC';
    return msg;
  }

  function openOrderChat(orderData) {
    var channel = getPreferredChannel();
    var message = buildOrderMessage(orderData);
    var url;
    if (channel === 'telegram') {
      url = buildTgUrl(TELEGRAM_USERNAME, encodeURIComponent(message));
    } else {
      url = buildWaUrl(WHATSAPP_NUMBER, encodeURIComponent(message));
    }
    openUrl(url);
  }

  function openOrderChatWithReceipt(orderData, receiptDataUrl) {
    var channel = getPreferredChannel();
    var message = buildOrderMessage(orderData);
    var url;

    if (channel === 'telegram') {
      url = buildTgUrl(TELEGRAM_USERNAME, encodeURIComponent(message));
    } else {
      url = buildWaUrl(WHATSAPP_NUMBER, encodeURIComponent(message));
    }

    var canWriteClipboardImage = (
      receiptDataUrl &&
      navigator.clipboard &&
      typeof ClipboardItem !== 'undefined' &&
      !isIOSSafari()
    );

    if (canWriteClipboardImage && channel !== 'telegram') {
      fetch(receiptDataUrl)
        .then(function(response) { return response.blob(); })
        .then(function(blob) {
          try {
            var item = new ClipboardItem({ 'image/jpeg': blob });
            navigator.clipboard.write([item]).then(function() {
              alert('Receipt copied to clipboard! You can paste it in WhatsApp after the chat opens.');
              openUrl(url);
            }).catch(function() {
              openUrl(url);
            });
          } catch (e) {
            openUrl(url);
          }
        })
        .catch(function() {
          openUrl(url);
        });
    } else {
      openUrl(url);
    }
  }

  function openGeneralInquiry() {
    var channel = getPreferredChannel();
    var message = buildGeneralInquiryMessage();
    var url;
    if (channel === 'telegram') {
      url = 'https://t.me/' + TELEGRAM_USERNAME + '?text=' + message;
    } else {
      url = 'https://wa.me/' + WHATSAPP_NUMBER.replace('+', '') + '?text=' + message;
    }
    openUrl(url);
  }

  function buildShareUrl(link) {
    var channel = getPreferredChannel();
    var message = encodeURIComponent('Check out my wishlist at VAIN.PRODUCTIONS! \uD83D\uDED2\uFE0F\n\n' + link);
    if (channel === 'telegram') {
      return 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent('Check out my wishlist at VAIN.PRODUCTIONS! \uD83D\uDED2\uFE0F');
    }
    return 'https://wa.me/?text=' + message;
  }

  function openShare(link) {
    var url = buildShareUrl(link);
    openUrl(url);
  }

  function updateFloatButton() {
    var btn = document.getElementById('whatsapp-btn');
    if (!btn) return;
    var channel = getPreferredChannel();
    var ch = CHANNELS[channel];
    btn.style.background = ch.color;
    btn.innerHTML = ch.icon;
    btn.setAttribute('aria-label', 'Chat on ' + ch.name);
    btn.classList.remove('whatsapp-float', 'telegram-float');
    btn.classList.add(channel + '-float');
    btn.href = '#';
    btn.target = '';
    btn.rel = '';
    btn.removeEventListener('click', _floatBtnClickHandler);
    btn.addEventListener('click', _floatBtnClickHandler);
  }

  function _floatBtnClickHandler(e) {
    e.preventDefault();
    openGeneralInquiry();
  }

  function createChannelSelector() {
    var container = document.getElementById('channel-selector');
    if (!container) return;
    var current = getPreferredChannel();
    container.innerHTML = '';
    container.className = 'channel-selector';
    Object.keys(CHANNELS).forEach(function(key) {
      var ch = CHANNELS[key];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'channel-option' + (key === current ? ' active' : '');
      btn.setAttribute('data-channel', key);
      btn.setAttribute('aria-label', 'Select ' + ch.name);
      btn.innerHTML = '<span class="channel-option-icon">' + ch.icon + '</span><span class="channel-option-name">' + ch.name + '</span>';
      btn.addEventListener('click', function() {
        setPreferredChannel(key);
        updateFloatButton();
        updateChannelSelectorUI();
        updateCheckoutButtons();
        updateShareButton();
      });
      container.appendChild(btn);
    });
  }

  function updateChannelSelectorUI() {
    var current = getPreferredChannel();
    document.querySelectorAll('.channel-option').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-channel') === current);
    });
  }

  function updateCheckoutButtons() {
    var channel = getPreferredChannel();
    var ch = CHANNELS[channel];
    var btns = document.querySelectorAll('.checkout-btn-text');
    btns.forEach(function(btn) {
      if (btn) btn.textContent = 'Complete Order via ' + ch.name;
    });
    var formatDescs = document.querySelectorAll('.format-desc-channel');
    formatDescs.forEach(function(el) {
      if (el) el.textContent = 'Best for ' + ch.name + ' sharing';
    });
  }

  function updateShareButton() {
    var shareBtn = document.getElementById('share-channel-text');
    if (shareBtn && window.VainMessaging) {
      var ch = window.VainMessaging.CHANNELS[window.VainMessaging.getPreferredChannel()];
      shareBtn.textContent = 'Share on ' + ch.name;
    }
    var shareIcon = document.querySelector('#share-channel .share-option-icon');
    if (shareIcon && window.VainMessaging) {
      var channel = window.VainMessaging.getPreferredChannel();
      var iconSvg = window.VainMessaging.CHANNELS[channel].icon;
      shareIcon.innerHTML = iconSvg;
      shareIcon.className = 'share-option-icon share-channel';
      if (channel === 'telegram') {
        shareIcon.style.background = 'rgba(0, 136, 204, 0.12)';
        shareIcon.style.color = '#0088cc';
      } else {
        shareIcon.style.background = 'rgba(37, 211, 102, 0.12)';
        shareIcon.style.color = '#25d366';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateFloatButton();
    createChannelSelector();
    updateCheckoutButtons();
    updateShareButton();
  });

  window.VainMessaging = {
    CHANNELS: CHANNELS,
    getPreferredChannel: getPreferredChannel,
    setPreferredChannel: setPreferredChannel,
    isIOS: isIOS,
    isIOSSafari: isIOSSafari,
    buildOrderMessage: buildOrderMessage,
    openOrderChat: openOrderChat,
    openOrderChatWithReceipt: openOrderChatWithReceipt,
    openGeneralInquiry: openGeneralInquiry,
    buildShareUrl: buildShareUrl,
    openShare: openShare,
    buildWaUrl: buildWaUrl,
    updateFloatButton: updateFloatButton,
    createChannelSelector: createChannelSelector,
    updateCheckoutButtons: updateCheckoutButtons,
    updateShareButton: updateShareButton
  };

  window.VainWhatsApp = {
    phone: WHATSAPP_NUMBER,
    isIOS: isIOS,
    isIOSSafari: isIOSSafari,
    buildOrderMessage: buildOrderMessage,
    openOrderChat: openOrderChat,
    openOrderChatWithReceipt: openOrderChatWithReceipt,
    buildWaUrl: buildWaUrl,
    openWhatsApp: openGeneralInquiry
  };
})();
