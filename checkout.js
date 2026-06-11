(function() {
  'use strict';

  function getCart() {
    return JSON.parse(localStorage.getItem('vainCart') || '[]');
  }

  function saveCart(cart) {
    localStorage.setItem('vainCart', JSON.stringify(cart));
  }

  function getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
  }

  function updateCartCount() {
    var elements = document.querySelectorAll('#cart-count, #mobile-bottom-cart-count, .cart-count');
    var itemCount = getCartItemCount();
    elements.forEach(function(el) {
      if (el) el.textContent = itemCount;
    });
  }

  function getCartItemCount() {
    return getCart().reduce(function(sum, item) { return sum + item.quantity; }, 0);
  }

  function getCartTotal() {
    return getCart().reduce(function(sum, item) { return sum + item.price * item.quantity; }, 0);
  }

  function calculateDeliveryFee(subtotal, method) {
    if (method === 'Pickup') return 0;
    if (subtotal >= 100000) return 0;
    if (method === 'Express Delivery') return 10000;
    return 5000;
  }

  function escapeHtml(str) {
    return String(str ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function renderCheckoutItems() {
    var container = document.getElementById('checkout-cart-items');
    if (!container) return;
    
    var cart = getCart();
    
    if (cart.length === 0) {
      container.innerHTML = '<div class="checkout-empty-items"><p>Your cart is empty</p><a href="../products.html" class="btn btn-secondary btn-sm">Browse Products</a></div>';
      return;
    }

    container.innerHTML = '';
    cart.forEach(function(item) {
      var bp = getBasePath();
      var div = document.createElement('div');
      div.className = 'checkout-item';
      div.innerHTML = 
        '<div class="checkout-item-image"><img src="' + bp + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '" loading="lazy"></div>' +
        '<div class="checkout-item-info">' +
          '<div class="checkout-item-name">' + escapeHtml(item.name) + '</div>' +
          '<div class="checkout-item-meta">' + escapeHtml(item.size) + ' • Qty: ' + item.quantity + '</div>' +
        '</div>' +
        '<div class="checkout-item-price">₦' + (item.price * item.quantity).toLocaleString() + '</div>';
      container.appendChild(div);
    });
  }

  function updateOrderSummary() {
    var subtotal = getCartTotal();
    var coupon = getAppliedCoupon();
    var discount = 0;
    
    var deliveryMethod = '';
    var deliverySelect = document.getElementById('delivery-method');
    if (deliverySelect) deliveryMethod = deliverySelect.value;
    
    var deliveryFee = calculateDeliveryFee(subtotal, deliveryMethod);
    
    if (coupon) {
      if (coupon.freeShipping) deliveryFee = 0;
      if (coupon.discountPercent > 0) discount = Math.round(subtotal * (coupon.discountPercent / 100));
    }
    var total = subtotal + deliveryFee - discount;
    
    var setVal = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
    setVal('order-subtotal', '₦' + subtotal.toLocaleString());
    setVal('order-total', '₦' + total.toLocaleString());
    setVal('order-delivery', deliveryFee > 0 ? '₦' + deliveryFee.toLocaleString() : 'Free');
    
    var discEl = document.getElementById('order-discount');
    var discRow = document.getElementById('order-discount-row');
    if (discEl) discEl.textContent = discount > 0 ? '-₦' + discount.toLocaleString() : '₦0';
    if (discRow) discRow.style.display = discount > 0 ? 'flex' : 'none';
  }

  function clearFieldErrors() {
    document.querySelectorAll('.form-group.has-error').forEach(function(el) {
      el.classList.remove('has-error');
    });
    document.querySelectorAll('.form-error').forEach(function(el) {
      el.textContent = '';
    });
    var summary = document.getElementById('form-error-summary');
    if (summary) {
      summary.style.display = 'none';
      summary.textContent = '';
    }
  }

  function showFieldError(fieldId, message) {
    var input = document.getElementById(fieldId);
    if (!input) return;
    var group = input.closest('.form-group');
    if (group) {
      group.classList.add('has-error');
      var errorEl = group.querySelector('.form-error');
      if (errorEl) errorEl.textContent = message;
    }
  }

  function validateForm() {
    clearFieldErrors();
    var errors = [];
    
    var name = document.getElementById('customer-name')?.value.trim();
    var phone = document.getElementById('customer-phone')?.value.trim();
    var email = document.getElementById('customer-email')?.value.trim();
    var address = document.getElementById('customer-address')?.value.trim();
    var city = document.getElementById('customer-city')?.value.trim();
    var state = document.getElementById('customer-state')?.value.trim();
    var deliveryMethod = document.getElementById('delivery-method')?.value;

    if (!name || name.length < 2) {
      errors.push({ field: 'customer-name', message: 'Please enter your full name (at least 2 characters)' });
    }

    var phoneClean = phone ? phone.replace(/\s/g, '') : '';
    if (!phoneClean) {
      errors.push({ field: 'customer-phone', message: 'Phone number is required' });
    } else if (!/^(\+234|0)[789][01]\d{8}$/.test(phoneClean)) {
      errors.push({ field: 'customer-phone', message: 'Please enter a valid Nigerian phone number (e.g., 08012345678)' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'customer-email', message: 'Please enter a valid email address' });
    }

    if (!address || address.length < 10) {
      errors.push({ field: 'customer-address', message: 'Please enter a complete address (at least 10 characters)' });
    }

    if (!city) {
      errors.push({ field: 'customer-city', message: 'City is required' });
    }

    if (!state) {
      errors.push({ field: 'customer-state', message: 'State is required' });
    }

    if (!deliveryMethod) {
      errors.push({ field: 'delivery-method', message: 'Please select a delivery method' });
    }

    if (errors.length > 0) {
      errors.forEach(function(err) {
        showFieldError(err.field, err.message);
      });
      
      var summary = document.getElementById('form-error-summary');
      if (summary) {
        summary.textContent = 'Please fix the following errors: ' + errors.map(function(e) { return e.message; }).join('; ');
        summary.style.display = 'block';
        summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  }

  function generateOrderId() {
    return 'VAIN-' + Date.now();
  }

  var RECEIPT_LOGO_SRC = (function() {
    var path = window.location.pathname;
    return path.includes('/pages/') ? '../photo_2026-04-08_12-43-10.jpg' : 'photo_2026-04-08_12-43-10.jpg';
  })();

  function generateReceiptImage(data, format) {
    format = format || 'jpeg';

    var safeStr = function(val, fallback) {
      if (val === null || val === undefined || String(val).trim() === '') return fallback || '';
      return String(val);
    };

    var safeNum = function(val, fallback) {
      var n = Number(val);
      return isFinite(n) ? n : (fallback || 0);
    };

    var customer = data && data.customer ? data.customer : {};
    var items = Array.isArray(data && data.items) ? data.items : [];
    var orderId = safeStr(data && data.orderId, 'UNKNOWN');
    var subtotal = safeNum(data && data.subtotal);
    var deliveryFee = safeNum(data && data.deliveryFee);
    var discount = safeNum(data && data.discount);
    var total = safeNum(data && data.total);
    var coupon = safeStr(data && data.coupon, '');

    var CANVAS_W = 600;
    var PAD = 30;
    var INNER_W = CANVAS_W - PAD * 2;

    function renderPass(ctx, logoImg) {
      var y = 0;

      ctx.save();
      var gradient = ctx.createLinearGradient(0, 0, 0, 160);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_W, 160);
      ctx.restore();

      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        var logoH = 50;
        var logoW = Math.round(logoImg.naturalWidth / logoImg.naturalHeight * logoH);
        if (logoW > 120) logoW = 120;
        var logoX = (CANVAS_W - logoW) / 2;
        ctx.drawImage(logoImg, logoX, 12, logoW, logoH);
        y = 75;
      } else {
        y = 15;
      }

      ctx.fillStyle = '#e6b800';
      ctx.font = 'bold 24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('VAIN.PRODUCTIONS', CANVAS_W / 2, y);
      y += 25;

      ctx.fillStyle = '#888';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText('Receipt #' + orderId + '  \u2022  ' + new Date().toLocaleDateString(), CANVAS_W / 2, y);
      y += 20;

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(PAD, y, INNER_W, 1);
      y += 15;

      ctx.fillStyle = '#f5f3eb';
      ctx.fillRect(0, y, CANVAS_W, 900);
      y += 20;

      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('ITEMS', PAD, y);
      y += 22;

      if (items.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('No items', PAD, y);
        y += 20;
      } else {
        items.forEach(function(item, idx) {
          var itemName = safeStr(item.name, 'Item');
          var itemPrice = safeNum(item.price);
          var itemQty = Math.max(1, safeNum(item.quantity, 1));
          var lineTotal = itemPrice * itemQty;

          ctx.fillStyle = '#1a1a2e';
          ctx.font = '13px Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText((idx + 1) + '. ' + itemName, PAD, y);

          ctx.fillStyle = '#e6b800';
          ctx.font = 'bold 13px Arial, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText('\u20A6' + lineTotal.toLocaleString(), CANVAS_W - PAD, y);
          y += 18;

          ctx.fillStyle = '#888';
          ctx.font = '11px Arial, sans-serif';
          ctx.textAlign = 'left';
          var meta = 'Size: ' + safeStr(item.size, '-') + '  |  Color: ' + safeStr(item.color, '-') + '  |  Qty: ' + itemQty;
          ctx.fillText(meta, PAD + 15, y);
          y += 22;
        });
      }

      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(PAD, y, INNER_W, 1);
      y += 16;

      ctx.font = '13px Arial, sans-serif';
      ctx.textAlign = 'left';

      ctx.fillStyle = '#555';
      ctx.fillText('Subtotal', PAD, y);
      ctx.fillStyle = '#1a1a2e';
      ctx.textAlign = 'right';
      ctx.fillText('\u20A6' + subtotal.toLocaleString(), CANVAS_W - PAD, y);
      y += 20;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#555';
      ctx.fillText('Delivery', PAD, y);
      ctx.fillStyle = deliveryFee > 0 ? '#1a1a2e' : '#198754';
      ctx.textAlign = 'right';
      ctx.fillText(deliveryFee > 0 ? '\u20A6' + deliveryFee.toLocaleString() : 'Free', CANVAS_W - PAD, y);
      y += 20;

      if (discount > 0) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#555';
        ctx.fillText('Discount' + (coupon ? ' (' + coupon + ')' : ''), PAD, y);
        ctx.fillStyle = '#198754';
        ctx.textAlign = 'right';
        ctx.fillText('-\u20A6' + discount.toLocaleString(), CANVAS_W - PAD, y);
        y += 20;
      }

      ctx.fillStyle = '#e6b800';
      ctx.fillRect(PAD, y, INNER_W, 2);
      y += 18;

      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL', PAD, y);
      ctx.fillStyle = '#e6b800';
      ctx.textAlign = 'right';
      ctx.fillText('\u20A6' + total.toLocaleString(), CANVAS_W - PAD, y);
      y += 30;

      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(PAD, y, INNER_W, 1);
      y += 20;

      ctx.fillStyle = '#999';
      ctx.font = '11px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Thank you for shopping VAIN.PRODUCTIONS', CANVAS_W / 2, y);
      y += 25;

      return y;
    }

    return new Promise(function(resolve) {
      var logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';

      var finalize = function(img) {
        var measureCanvas = document.createElement('canvas');
        measureCanvas.width = CANVAS_W;
        measureCanvas.height = 2000;
        var measureCtx = measureCanvas.getContext('2d');
        var totalHeight = renderPass(measureCtx, img);

        var outputCanvas = document.createElement('canvas');
        outputCanvas.width = CANVAS_W;
        outputCanvas.height = Math.max(totalHeight + 20, 200);
        var outCtx = outputCanvas.getContext('2d');
        renderPass(outCtx, img);

        var mimeType = format === 'pdf' ? 'image/jpeg' : ('image/' + format);
        var quality = format === 'pdf' ? 0.95 : 0.92;

        outputCanvas.toBlob(function(blob) {
          resolve({ blob: blob, mimeType: mimeType, format: format });
        }, mimeType, quality);
      };

      var logoTimeout = setTimeout(function() { finalize(null); }, 3000);

      logoImg.onload = function() {
        clearTimeout(logoTimeout);
        finalize(logoImg);
      };

      logoImg.onerror = function() {
        clearTimeout(logoTimeout);
        finalize(null);
      };

      logoImg.src = RECEIPT_LOGO_SRC;
    });
  }

  function downloadReceipt(data) {
    generateReceiptImage(data, 'jpeg').then(function(result) {
      var url = URL.createObjectURL(result.blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'VAIN-Receipt-' + (data && data.orderId || 'order') + '.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    });
  }

  function getReceiptDataUrl(data, callback) {
    generateReceiptImage(data, 'jpeg').then(function(result) {
      var reader = new FileReader();
      reader.onloadend = function() {
        callback(reader.result);
      };
      reader.onerror = function() {
        callback(null);
      };
      reader.readAsDataURL(result.blob);
    });
  }

  function showNotification(message, type) {
    type = type || 'success';
    document.querySelectorAll('.toast-notification').forEach(function(n) { n.remove(); });
    var el = document.createElement('div');
    el.className = 'toast-notification ' + type;
    var icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    el.innerHTML = '<span class="toast-icon">' + icon + '</span><span class="toast-message">' + message + '</span>';
    document.body.appendChild(el);
    setTimeout(function() { el.classList.add('show'); }, 10);
    setTimeout(function() {
      el.classList.remove('show');
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 4000);
  }

  function handleCheckoutForm(e) {
    e.preventDefault();
    
    var cart = getCart();
    if (cart.length === 0) {
      showNotification('Your cart is empty. Please add items before checkout.', 'error');
      return;
    }

    if (!validateForm()) {
      return;
    }

    var getVal = function(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    var customer = {
      name: getVal('customer-name'),
      phone: getVal('customer-phone'),
      email: getVal('customer-email'),
      address: getVal('customer-address'),
      city: getVal('customer-city'),
      state: getVal('customer-state'),
      country: getVal('customer-country') || 'Nigeria',
      zipCode: getVal('customer-zip'),
      deliveryMethod: getVal('delivery-method'),
      note: getVal('order-note')
    };

    var subtotal = getCartTotal();
    var coupon = getAppliedCoupon();
    var discount = 0;
    var deliveryFee = calculateDeliveryFee(subtotal, customer.deliveryMethod);
    
    if (coupon) {
      if (coupon.freeShipping) deliveryFee = 0;
      if (coupon.discountPercent > 0) discount = Math.round(subtotal * (coupon.discountPercent / 100));
    }
    var total = subtotal + deliveryFee - discount;
    var orderId = generateOrderId();
    var payload = { 
      orderId: orderId, 
      customer: customer, 
      items: cart.slice(), 
      subtotal: subtotal, 
      deliveryFee: deliveryFee, 
      discount: discount, 
      total: total, 
      coupon: coupon ? coupon.code : null 
    };

    var submitBtn = document.getElementById('checkout-btn');
    setLoadingState(submitBtn, true);

    var formatInputs = document.getElementsByName('receipt-format');
    var selectedFormat = 'jpeg';
    for (var i = 0; i < formatInputs.length; i++) {
      if (formatInputs[i].checked) {
        selectedFormat = formatInputs[i].value;
        break;
      }
    }

    var isIOS = /iP(hone|od|ad)/.test(navigator.userAgent);

    function downloadBlob(blob, filename) {
      try {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
      } catch (e) {
        if (navigator.msSaveOrOpenBlob) {
          navigator.msSaveOrOpenBlob(blob, filename);
        }
      }
    }

    try {
      saveCart([]);
      updateCartCount();
      updateOrderSummary();
      renderCheckoutItems();

      var whatsAppAlreadyOpened = false;
      var channelName = window.VainMessaging ? (window.VainMessaging.getPreferredChannel() === 'telegram' ? 'Telegram' : 'WhatsApp') : 'WhatsApp';

      if (isIOS && window.VainMessaging) {
        whatsAppAlreadyOpened = true;
        window.VainMessaging.openOrderChat(payload);
      }

      generateReceiptImage(payload, selectedFormat).then(function(result) {
        var filename = 'VAIN-Receipt-' + payload.orderId + (selectedFormat === 'pdf' ? '.pdf' : '.jpg');
        downloadBlob(result.blob, filename);

        if (!whatsAppAlreadyOpened) {
          showNotification('Receipt downloaded! Opening ' + channelName + '...', 'success');
          setTimeout(function() {
            if (window.VainMessaging) {
              window.VainMessaging.openOrderChatWithReceipt(payload, null);
            } else if (window.VainWhatsApp) {
              getReceiptDataUrl(payload, function(dataUrl) {
                window.VainWhatsApp.openOrderChatWithReceipt(payload, dataUrl);
              });
            }
          }, 1500);
        } else {
          showNotification('Order placed! Receipt downloaded.', 'success');
        }
      });
    } catch (err) {
      console.error('Error processing order:', err);
      showNotification('There was an error processing your order. Please try again.', 'error');
      setLoadingState(submitBtn, false);
    }
  }

  function setLoadingState(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.disabled = true;
      var btnText = btn.querySelector('.btn-text');
      var btnLoading = btn.querySelector('.btn-loading');
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'flex';
    } else {
      btn.disabled = false;
      var btnText = btn.querySelector('.btn-text');
      var btnLoading = btn.querySelector('.btn-loading');
      if (btnText) btnText.style.display = 'flex';
      if (btnLoading) btnLoading.style.display = 'none';
    }
  }

  function applyCoupon(code, discountPercent, freeShipping) {
    localStorage.setItem('vainCoupon', JSON.stringify({ code: code, discountPercent: discountPercent, freeShipping: freeShipping, appliedAt: Date.now() }));
  }

  function getAppliedCoupon() {
    var data = localStorage.getItem('vainCoupon');
    return data ? JSON.parse(data) : null;
  }

  function setupCouponCode() {
    var input = document.getElementById('coupon-code');
    var btn = document.getElementById('apply-coupon-btn');
    if (!input || !btn) return;
    
    btn.addEventListener('click', function() {
      var code = input.value.trim().toUpperCase();
      if (!code) { showNotification('Please enter a coupon code', 'error'); return; }
      if (code === 'VAIN10') { 
        applyCoupon('VAIN10', 10); 
        showNotification('Coupon applied! 10% discount added.', 'success'); 
        input.value = '';
      } else if (code === 'FREESHIP') { 
        applyCoupon('FREESHIP', 0, true); 
        showNotification('Free shipping coupon applied!', 'success'); 
        input.value = '';
      } else { 
        showNotification('Invalid coupon code. Try VAIN10 or FREESHIP', 'error'); 
      }
      updateOrderSummary();
    });
    
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        btn.click();
      }
    });
  }

  function setupDeliveryMethodListener() {
    var deliverySelect = document.getElementById('delivery-method');
    if (deliverySelect) {
      deliverySelect.addEventListener('change', function() {
        updateOrderSummary();
      });
    }
  }

  function setupCartDrawer() {
    var cartBtn = document.getElementById('cart-btn');
    var drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    var closeDrawer = function() { drawer.classList.remove('active', 'animated'); document.body.style.overflow = ''; };
    var openDrawer = function() { drawer.classList.add('active'); document.body.style.overflow = 'hidden'; updateCartDrawer(); setTimeout(function() { drawer.classList.add('animated'); }, 10); };

    if (cartBtn) {
      cartBtn.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        if (drawer.classList.contains('active')) closeDrawer(); else openDrawer();
      });
    }

    var closeBtn = document.getElementById('cart-drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    var overlay = drawer.querySelector('.cart-drawer-overlay');
    if (overlay) overlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && drawer.classList.contains('active')) closeDrawer();
    });
  }

  function updateCartDrawer() {
    var drawerItems = document.getElementById('cart-drawer-items');
    if (!drawerItems) return;
    var cart = getCart();
    var bp = getBasePath();

    if (cart.length === 0) {
      drawerItems.innerHTML = '<div class="cart-drawer-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="m1 1 4 4h15l2 7H6"></path></svg><h3>Your cart is empty</h3><p>Add some luxury pieces to get started</p></div>';
      var ids = ['drawer-total', 'drawer-subtotal', 'drawer-delivery'];
      ids.forEach(function(id) { var el = document.getElementById(id); if (el) el.textContent = '₦0'; });
      return;
    }

    drawerItems.innerHTML = '';
    cart.forEach(function(item, idx) { drawerItems.appendChild(createDrawerItem(item, idx, bp)); });

    var subtotal = getCartTotal();
    var fee = calculateDeliveryFee(subtotal);
    var coupon = getAppliedCoupon();
    if (coupon && coupon.freeShipping) fee = 0;
    var total = subtotal + fee;
    var subEl = document.getElementById('drawer-subtotal');
    var delEl = document.getElementById('drawer-delivery');
    var totEl = document.getElementById('drawer-total');
    if (subEl) subEl.textContent = '₦' + subtotal.toLocaleString();
    if (delEl) delEl.textContent = fee > 0 ? '₦' + fee.toLocaleString() : 'Free';
    if (totEl) totEl.textContent = '₦' + total.toLocaleString();
  }

  function createDrawerItem(item, index, bp) {
    var div = document.createElement('div');
    div.className = 'cart-drawer-item';
    div.innerHTML = '<div class="cart-drawer-item-image"><img src="' + bp + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '" loading="lazy"></div>' +
      '<div class="cart-drawer-item-details">' +
      '<div class="cart-drawer-item-name">' + escapeHtml(item.name) + '</div>' +
      '<div class="cart-drawer-item-meta">Size: ' + escapeHtml(item.size) + ' | Color: ' + escapeHtml(item.color) + '</div>' +
      '<div class="cart-drawer-item-price">₦' + (item.price * item.quantity).toLocaleString() + '</div>' +
      '</div>';
    return div;
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    renderCheckoutItems();
    updateOrderSummary();
    setupCartDrawer();
    setupCouponCode();
    setupDeliveryMethodListener();
    
    var form = document.getElementById('checkout-form');
    if (form) {
      form.addEventListener('submit', handleCheckoutForm);
      
      form.querySelectorAll('input, textarea, select').forEach(function(input) {
        input.addEventListener('blur', function() {
          if (input.hasAttribute('required') && !input.value.trim()) {
            input.closest('.form-group')?.classList.add('has-error');
          } else {
            input.closest('.form-group')?.classList.remove('has-error');
          }
        });
        
        input.addEventListener('input', function() {
          if (input.closest('.form-group')?.classList.contains('has-error') && input.value.trim()) {
            input.closest('.form-group').classList.remove('has-error');
            var errorEl = input.closest('.form-group').querySelector('.form-error');
            if (errorEl) errorEl.textContent = '';
          }
        });
      });
    }
  });
})();
