(function() {
  'use strict';

  function getCart() {
    return JSON.parse(localStorage.getItem('vainCart') || '[]');
  }

  function saveCart(cart) {
    localStorage.setItem('vainCart', JSON.stringify(cart));
  }

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem('vainWishlist') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveWishlist(wishlist) {
    localStorage.setItem('vainWishlist', JSON.stringify(wishlist));
    updateWishlistCountBadges();
    var wishlistPage = document.getElementById('wishlist-items');
    if (wishlistPage) renderWishlistPage();
  }

  function getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
  }

  function updateCartCount(animated) {
    var elements = document.querySelectorAll('#cart-count, #mobile-bottom-cart-count, #mobile-hamburger-cart-count, .cart-count');
    var itemCount = getCartItemCount();
    elements.forEach(function(el) {
      if (!el) return;
      var current = parseInt(el.textContent) || 0;
      if (animated && current !== itemCount) {
        el.classList.add('count-updating');
        var duration = Math.abs(itemCount - current) * 50;
        var startVal = current;
        var startTime = Date.now();
        var animate = function() {
          var elapsed = Date.now() - startTime;
          var progress = Math.min(elapsed / Math.max(duration, 100), 1);
          el.textContent = Math.round(startVal + (itemCount - startVal) * progress);
          if (progress < 1) requestAnimationFrame(animate);
          else { el.textContent = itemCount; el.classList.remove('count-updating'); }
        };
        requestAnimationFrame(animate);
      } else {
        el.textContent = itemCount;
      }
    });
  }

  function addToCart(product, quantity, size, color) {
    quantity = quantity || 1;
    var cart = getCart();
    var resolvedSize = size || (product.sizes && product.sizes[0]) || 'One Size';
    var resolvedColor = color || (product.colors && product.colors[0]) || 'Default';
    var existing = cart.find(function(item) {
      return item.id === product.id && item.size === resolvedSize && item.color === resolvedColor;
    });
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: quantity, size: resolvedSize, color: resolvedColor });
    }
    saveCart(cart);
    updateCartCount(true);
    updateCartDisplay();
    showNotification(product.name + ' added to cart!');
    return true;
  }

  function removeFromCart(index) {
    var cart = getCart();
    if (index < 0 || index >= cart.length) return;
    var removed = cart[index];
    cart.splice(index, 1);
    saveCart(cart);
    updateCartDisplay();
    showNotification(removed.name + ' removed from cart');
  }

  function updateCartItemQuantity(index, newQuantity) {
    var cart = getCart();
    if (index < 0 || index >= cart.length) return;
    if (newQuantity <= 0) { removeFromCart(index); return; }
    cart[index].quantity = newQuantity;
    saveCart(cart);
    updateCartDisplay();
  }

  function getCartTotal() {
    return getCart().reduce(function(sum, item) { return sum + item.price * item.quantity; }, 0);
  }

  function getCartItemCount() {
    return getCart().reduce(function(sum, item) { return sum + item.quantity; }, 0);
  }

  function toggleWishlist(product) {
    var wishlist = getWishlist();
    var idx = wishlist.findIndex(function(item) { return item.id === product.id; });
    if (idx > -1) {
      wishlist.splice(idx, 1);
      saveWishlist(wishlist);
      showNotification(product.name + ' removed from wishlist');
      return false;
    } else {
      wishlist.push({ id: product.id, name: product.name, price: product.price, image: product.image });
      saveWishlist(wishlist);
      showNotification(product.name + ' added to wishlist!');
      return true;
    }
  }

  function isInWishlist(productId) {
    return getWishlist().some(function(item) { return item.id === productId; });
  }

  function updateWishlistButtons() {
    document.querySelectorAll('[data-wishlist-btn]').forEach(function(btn) {
      var pid = parseInt(btn.dataset.productId);
      if (pid) {
        var inWishlist = isInWishlist(pid);
        btn.classList.toggle('active', inWishlist);
        var svg = btn.querySelector('svg');
        if (svg) {
          svg.setAttribute('fill', inWishlist ? 'currentColor' : 'none');
        }
      }
    });
    var toggle = document.getElementById('wishlist-toggle');
    if (toggle && window._currentProductId) {
      var inWishlist = isInWishlist(window._currentProductId);
      toggle.classList.toggle('active', inWishlist);
      var toggleSvg = toggle.querySelector('svg');
      if (toggleSvg) {
        toggleSvg.setAttribute('fill', inWishlist ? 'currentColor' : 'none');
      }
    }
  }

  function getWishlistCount() {
    return getWishlist().length;
  }

  function updateWishlistCountBadges() {
    var count = getWishlistCount();
    var badges = document.querySelectorAll('.wishlist-count, #wishlist-count, .header-wishlist-count');
    badges.forEach(function(badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    });
  }

  function getWishlistTotal() {
    return getWishlist().reduce(function(sum, item) { return sum + (item.price || 0); }, 0);
  }

  function addAllToCart() {
    var wishlist = getWishlist();
    if (wishlist.length === 0) {
      showNotification('Your wishlist is empty');
      return false;
    }
    var added = 0;
    wishlist.forEach(function(item) {
      var product = window.ProductData ? window.ProductData.getProductById(item.id) : null;
      if (product && product.inStock) {
        addToCart(product);
        added++;
      }
    });
    if (added > 0) {
      showNotification(added + ' item' + (added !== 1 ? 's' : '') + ' added to cart!');
    } else {
      showNotification('No available items to add to cart');
    }
    return added > 0;
  }

  function clearWishlist() {
    saveWishlist([]);
    showNotification('Wishlist cleared');
  }

  function removeFromWishlist(productId) {
    productId = parseInt(productId);
    var wishlist = getWishlist();
    var item = wishlist.find(function(i) { return i.id === productId; });
    var filtered = wishlist.filter(function(i) { return i.id !== productId; });
    saveWishlist(filtered);
    if (item) {
      showNotification(item.name + ' removed from wishlist');
    }
    return true;
  }

  function moveToRegistry(productId) {
    productId = parseInt(productId);
    var wishlist = getWishlist();
    var item = wishlist.find(function(i) { return i.id === productId; });
    if (!item) return false;

    var registry = getRegistry();
    if (registry.some(function(i) { return i.id === productId; })) {
      showNotification(item.name + ' is already in your registry');
      return false;
    }

    registry.push(Object.assign({}, item, { movedAt: Date.now() }));
    saveRegistry(registry);

    removeFromWishlist(productId);
    showNotification(item.name + ' moved to registry');
    return true;
  }

  function moveToWishlist(productId) {
    productId = parseInt(productId);
    var wishlist = getWishlist();
    var registry = getRegistry();

    var item = registry.find(function(i) { return i.id === productId; });
    if (!item) return false;

    if (wishlist.some(function(i) { return i.id === productId; })) {
      showNotification(item.name + ' is already in your wishlist');
      return false;
    }

    var wishItem = Object.assign({}, item);
    delete wishItem.movedAt;
    wishItem.addedAt = Date.now();
    wishlist.push(wishItem);
    saveWishlist(wishlist);

    var registryIdx = registry.findIndex(function(i) { return i.id === productId; });
    if (registryIdx > -1) {
      registry.splice(registryIdx, 1);
      saveRegistry(registry);
    }

    showNotification(item.name + ' moved back to wishlist');
    return true;
  }

  function getRegistry() {
    try {
      return JSON.parse(localStorage.getItem('vainRegistry') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveRegistry(registry) {
    localStorage.setItem('vainRegistry', JSON.stringify(registry));
  }

  function generateShareableLink() {
    var baseUrl = window.location.origin + window.location.pathname;
    var wishlistIds = getWishlist().map(function(item) { return item.id; });
    if (wishlistIds.length === 0) {
      showNotification('Your wishlist is empty. Add items before sharing.');
      return null;
    }
    var params = new URLSearchParams();
    params.set('wishlist', wishlistIds.join(','));
    return baseUrl + '?' + params.toString();
  }

  function copyShareableLink() {
    var link = generateShareableLink();
    if (!link) return false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(function() {
        showNotification('Wishlist link copied to clipboard!');
      }).catch(function() {
        fallbackCopy(link);
      });
    } else {
      fallbackCopy(link);
    }
    return true;
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showNotification('Wishlist link copied to clipboard!');
    } catch (e) {
      showNotification('Failed to copy link. Please copy manually.');
    }
    document.body.removeChild(textarea);
  }

  function shareViaWhatsApp() {
    var link = generateShareableLink();
    if (!link) return false;
    if (window.VainMessaging) {
      window.VainMessaging.openShare(link);
    }
    return true;
  }

  function shareViaTwitter() {
    var link = generateShareableLink();
    if (!link) return false;
    var text = encodeURIComponent('Check out my wishlist at VAIN.PRODUCTIONS! \uD83D\uDED2\uFE0F');
    var twUrl = 'https://twitter.com/intent/tweet?text=' + text + '&url=' + encodeURIComponent(link);
    var isIOS = /iP(hone|od|ad)/.test(navigator.userAgent);
    if (isIOS) {
      window.location.href = twUrl;
    } else {
      var w = window.open(twUrl, '_blank');
      if (!w || w.closed || typeof w.closed === 'undefined') {
        window.location.href = twUrl;
      }
    }
    return true;
  }

  function shareViaEmail() {
    var link = generateShareableLink();
    if (!link) return false;
    var wishlist = getWishlist();
    var itemsList = wishlist.map(function(item) {
      return '• ' + item.name + ' - ₦' + (item.price || 0).toLocaleString();
    }).join('\n');
    var subject = encodeURIComponent('My VAIN.PRODUCTIONS Wishlist');
    var body = encodeURIComponent('Check out my wishlist!\n\n' + itemsList + '\n\nView full wishlist: ' + link);
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
    return true;
  }

  function getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
  }

  function escapeHtml(str) {
    return String(str ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function formatPrice(price) {
    return '₦' + Number(price || 0).toLocaleString();
  }

  function renderWishlistPage() {
    var container = document.getElementById('wishlist-items');
    if (!container) return;

    var emptyEl = document.getElementById('wishlist-empty');
    var actionsEl = document.getElementById('wishlist-actions');
    var summaryEl = document.getElementById('wishlist-summary');

    var wishlist = getWishlist();

    if (wishlist.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      if (actionsEl) actionsEl.style.display = 'none';
      if (summaryEl) summaryEl.style.display = 'none';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (actionsEl) actionsEl.style.display = 'flex';
    if (summaryEl) summaryEl.style.display = 'block';

    container.innerHTML = '';
    var bp = getBasePath();

    wishlist.forEach(function(item) {
      var product = window.ProductData ? window.ProductData.getProductById(item.id) : item;
      var card = document.createElement('div');
      card.className = 'wishlist-item';
      card.setAttribute('data-product-id', item.id);

      var priceDisplay = product.originalPrice
        ? '<span class="original-price">' + formatPrice(product.originalPrice) + '</span> ' + formatPrice(product.price)
        : formatPrice(product.price);

      card.innerHTML =
        '<div class="wishlist-item-image">' +
          '<img src="' + bp + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy">' +
        '</div>' +
        '<div class="wishlist-item-info">' +
          '<h3 class="wishlist-item-name">' + escapeHtml(product.name) + '</h3>' +
          '<div class="wishlist-item-price">' + priceDisplay + '</div>' +
          '<div class="wishlist-item-meta">' +
            (product.sizes ? '<span>Sizes: ' + escapeHtml(product.sizes.join(', ')) + '</span>' : '') +
            (product.colors ? '<span>Colors: ' + escapeHtml(product.colors.join(', ')) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="wishlist-item-actions">' +
          '<button class="btn btn-primary btn-sm wishlist-add-cart" data-product-id="' + item.id + '" ' +
            (!product.inStock ? 'disabled' : '') + '>' +
            (product.inStock ? 'Add to Cart' : 'Out of Stock') +
          '</button>' +
          '<button class="btn btn-secondary btn-sm wishlist-move-registry" data-product-id="' + item.id + '">' +
            'Move to Registry' +
          '</button>' +
          '<button class="icon-btn wishlist-remove" data-product-id="' + item.id + '" aria-label="Remove">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<polyline points="3 6 5 6 21 6"></polyline>' +
              '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
            '</svg>' +
          '</button>' +
        '</div>';

      var addBtn = card.querySelector('.wishlist-add-cart');
      if (addBtn && !addBtn.disabled) {
        addBtn.addEventListener('click', function() {
          if (window.ProductData) {
            var fullProduct = window.ProductData.getProductById(item.id);
            if (fullProduct) addToCart(fullProduct);
          }
        });
      }

      var moveBtn = card.querySelector('.wishlist-move-registry');
      if (moveBtn) {
        moveBtn.addEventListener('click', function() {
          moveToRegistry(item.id);
          renderWishlistPage();
          updateWishlistCountBadges();
        });
      }

      var removeBtn = card.querySelector('.wishlist-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', function() {
          removeFromWishlist(item.id);
          renderWishlistPage();
          updateWishlistCountBadges();
        });
      }

      container.appendChild(card);
    });

    var totalEl = document.getElementById('wishlist-total');
    if (totalEl) {
      totalEl.textContent = formatPrice(getWishlistTotal());
    }

    var countEl = document.getElementById('wishlist-item-count');
    if (countEl) {
      countEl.textContent = wishlist.length + ' item' + (wishlist.length !== 1 ? 's' : '');
    }
  }

  function renderRegistryPage() {
    var container = document.getElementById('registry-items');
    if (!container) return;

    var emptyEl = document.getElementById('registry-empty');
    var registry = getRegistry();

    if (registry.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    container.innerHTML = '';
    var bp = getBasePath();

    registry.forEach(function(item) {
      var product = window.ProductData ? window.ProductData.getProductById(item.id) : item;
      var card = document.createElement('div');
      card.className = 'wishlist-item registry-item';
      card.setAttribute('data-product-id', item.id);

      var priceDisplay = product.originalPrice
        ? '<span class="original-price">' + formatPrice(product.originalPrice) + '</span> ' + formatPrice(product.price)
        : formatPrice(product.price);

      card.innerHTML =
        '<div class="wishlist-item-image">' +
          '<img src="' + bp + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy">' +
        '</div>' +
        '<div class="wishlist-item-info">' +
          '<h3 class="wishlist-item-name">' + escapeHtml(product.name) + '</h3>' +
          '<div class="wishlist-item-price">' + priceDisplay + '</div>' +
          '<div class="wishlist-item-meta">' +
            '<span class="registry-badge">🎁 Registry Item</span>' +
          '</div>' +
        '</div>' +
        '<div class="wishlist-item-actions">' +
          '<button class="btn btn-primary btn-sm registry-add-cart" data-product-id="' + item.id + '" ' +
            (!product.inStock ? 'disabled' : '') + '>' +
            (product.inStock ? 'Add to Cart' : 'Out of Stock') +
          '</button>' +
          '<button class="btn btn-secondary btn-sm registry-move-wishlist" data-product-id="' + item.id + '">' +
            'Move to Wishlist' +
          '</button>' +
          '<button class="icon-btn registry-remove" data-product-id="' + item.id + '" aria-label="Remove">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<polyline points="3 6 5 6 21 6"></polyline>' +
              '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' +
            '</svg>' +
          '</button>' +
        '</div>';

      var addBtn = card.querySelector('.registry-add-cart');
      if (addBtn && !addBtn.disabled) {
        addBtn.addEventListener('click', function() {
          if (window.ProductData) {
            var fullProduct = window.ProductData.getProductById(item.id);
            if (fullProduct) addToCart(fullProduct);
          }
        });
      }

      var moveBtn = card.querySelector('.registry-move-wishlist');
      if (moveBtn) {
        moveBtn.addEventListener('click', function() {
          moveToWishlist(item.id);
          renderRegistryPage();
          renderWishlistPage();
          updateWishlistCountBadges();
        });
      }

      var removeBtn = card.querySelector('.registry-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', function() {
          var registryIdx = getRegistry().findIndex(function(i) { return i.id === item.id; });
          if (registryIdx > -1) {
            var reg = getRegistry();
            reg.splice(registryIdx, 1);
            saveRegistry(reg);
            showNotification(item.name + ' removed from registry');
          }
          renderRegistryPage();
        });
      }

      container.appendChild(card);
    });

    var countEl = document.getElementById('registry-item-count');
    if (countEl) {
      countEl.textContent = registry.length + ' item' + (registry.length !== 1 ? 's' : '');
    }
  }

  function setupHeaderWishlistButton() {
    var headerBtn = document.getElementById('wishlist-btn');
    if (headerBtn) {
      headerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var basePath = getBasePath();
        window.location.href = basePath + 'pages/wishlist.html';
      });
    }
  }

  function setupWishlistPage() {
    var addAllBtn = document.getElementById('wishlist-add-all');
    if (addAllBtn) {
      addAllBtn.addEventListener('click', addAllToCart);
    }

    var clearBtn = document.getElementById('wishlist-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear your wishlist?')) {
          clearWishlist();
          renderWishlistPage();
          updateWishlistCountBadges();
        }
      });
    }

    var shareBtn = document.getElementById('wishlist-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', function() {
        showShareModal();
      });
    }

    var copyLinkBtn = document.getElementById('share-copy-link');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', function() {
        copyShareableLink();
      });
    }

    var shareChannelBtn = document.getElementById('share-channel');
    if (shareChannelBtn) {
      shareChannelBtn.addEventListener('click', function() {
        shareViaWhatsApp();
      });
    }

    var twitterBtn = document.getElementById('share-twitter');
    if (twitterBtn) {
      twitterBtn.addEventListener('click', function() {
        shareViaTwitter();
      });
    }

    var emailBtn = document.getElementById('share-email');
    if (emailBtn) {
      emailBtn.addEventListener('click', function() {
        shareViaEmail();
      });
    }

    var closeShareBtn = document.getElementById('share-modal-close');
    if (closeShareBtn) {
      closeShareBtn.addEventListener('click', hideShareModal);
    }

    var shareOverlay = document.getElementById('share-modal-overlay');
    if (shareOverlay) {
      shareOverlay.addEventListener('click', hideShareModal);
    }
  }

  function showShareModal() {
    var modal = document.getElementById('share-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function hideShareModal() {
    var modal = document.getElementById('share-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function updateCartDisplay() {
    updateCartCount(true);
    updateCartPage();
    updateCartDrawer();
  }

  function updateCartPage() {
    var container = document.getElementById('cart-items');
    var empty = document.getElementById('cart-empty');
    var summary = document.getElementById('cart-summary');
    var itemsContainer = document.getElementById('cart-items-container');
    var cart = getCart();
    
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      if (itemsContainer) itemsContainer.style.display = 'none';
      if (empty) empty.style.display = 'block';
      if (summary) summary.textContent = '0 items in your cart';
      updateSummaryAmounts(0, 0, 0, 0);
      return;
    }

    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--space-md)';
    if (itemsContainer) itemsContainer.style.display = 'grid';
    if (empty) empty.style.display = 'none';
    
    var count = getCartItemCount();
    if (summary) summary.textContent = count + ' item' + (count !== 1 ? 's' : '') + ' in your cart';

    container.innerHTML = '';
    cart.forEach(function(item, idx) { container.appendChild(createCartItem(item, idx)); });
    updateOrderSummary();
  }

  function escapeHtml(str) {
    return String(str ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function createCartItem(item, index) {
    var bp = getBasePath();
    var div = document.createElement('div');
    div.className = 'cart-item-card';
    div.innerHTML = 
      '<div class="cart-item-image"><img src="' + bp + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '" loading="lazy"></div>' +
      '<div class="cart-item-details">' +
        '<h3 class="cart-item-name">' + escapeHtml(item.name) + '</h3>' +
        '<div class="cart-item-meta"><span>Size: ' + escapeHtml(item.size) + '</span><span>Color: ' + escapeHtml(item.color) + '</span></div>' +
        '<div class="cart-item-price">₦' + (item.price * item.quantity).toLocaleString() + '</div>' +
      '</div>' +
      '<div class="cart-item-actions">' +
        '<div class="quantity-controls">' +
          '<button class="quantity-btn" data-action="decrease" data-index="' + index + '" aria-label="Decrease quantity">-</button>' +
          '<input type="number" class="quantity-input" value="' + item.quantity + '" min="1" max="99" data-index="' + index + '" aria-label="Quantity">' +
          '<button class="quantity-btn" data-action="increase" data-index="' + index + '" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<button class="cart-item-remove" data-index="' + index + '" aria-label="Remove item">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
        '</button>' +
      '</div>';

    div.querySelector('[data-action="decrease"]').addEventListener('click', function() { updateCartItemQuantity(index, item.quantity - 1); });
    div.querySelector('[data-action="increase"]').addEventListener('click', function() { updateCartItemQuantity(index, item.quantity + 1); });
    div.querySelector('.quantity-input').addEventListener('change', function(e) {
      var val = parseInt(e.target.value) || 1;
      val = Math.max(1, Math.min(99, val));
      updateCartItemQuantity(index, val);
    });
    div.querySelector('.cart-item-remove').addEventListener('click', function() { removeFromCart(index); });
    return div;
  }

  function calculateDeliveryFee(subtotal, method) {
    if (method === 'Pickup') return 0;
    if (subtotal >= 100000) return 0;
    if (method === 'Express Delivery') return 10000;
    return 5000;
  }

  function updateSummaryAmounts(subtotal, deliveryFee, discount, total) {
    var setVal = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
    setVal('order-subtotal', '₦' + subtotal.toLocaleString());
    setVal('order-total', '₦' + total.toLocaleString());
    setVal('order-delivery', deliveryFee > 0 ? '₦' + deliveryFee.toLocaleString() : 'Free');
    
    var discEl = document.getElementById('order-discount');
    var discRow = document.getElementById('order-discount-row');
    if (discEl) discEl.textContent = discount > 0 ? '-₦' + discount.toLocaleString() : '₦0';
    if (discRow) discRow.style.display = discount > 0 ? 'flex' : 'none';
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
    
    updateSummaryAmounts(subtotal, deliveryFee, discount, total);
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
      '<div class="cart-drawer-item-controls">' +
      '<div class="cart-drawer-quantity-controls">' +
      '<button class="cart-drawer-quantity-btn" data-action="decrease" data-index="' + index + '">-</button>' +
      '<span class="cart-drawer-quantity">' + item.quantity + '</span>' +
      '<button class="cart-drawer-quantity-btn" data-action="increase" data-index="' + index + '">+</button>' +
      '</div>' +
      '<button class="cart-drawer-item-remove" data-index="' + index + '">&times;</button>' +
      '</div></div>';

    div.querySelector('[data-action="decrease"]').addEventListener('click', function(e) { e.stopPropagation(); updateCartItemQuantity(index, item.quantity - 1); });
    div.querySelector('[data-action="increase"]').addEventListener('click', function(e) { e.stopPropagation(); updateCartItemQuantity(index, item.quantity + 1); });
    div.querySelector('.cart-drawer-item-remove').addEventListener('click', function(e) { e.stopPropagation(); removeFromCart(index); });
    return div;
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

    var checkoutBtn = document.getElementById('drawer-checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function() {
        closeDrawer();
        var cartPage = window.location.pathname.includes('cart.html');
        if (!cartPage) {
          var isPages = window.location.pathname.includes('/pages/');
          window.location.href = isPages ? 'cart.html' : 'pages/cart.html';
        } else {
          var form = document.getElementById('checkout-form');
          if (form) {
            form.scrollIntoView({ behavior: 'smooth', block: 'start'});
            var nameInput = document.getElementById('customer-name');
            if (nameInput) nameInput.focus();
          }
        }
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && drawer.classList.contains('active')) closeDrawer();
    });
  }

  function generateOrderId() {
    return 'VAIN-' + Date.now();
  }

  function generateReceiptImage(data, format) {
    format = format || 'jpeg';
    
    var canvasWidth = 600;
    var canvasHeight = 900;
    
    var canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    var ctx = canvas.getContext('2d');
    
    var gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#e6b800';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAIN.PRODUCTIONS', canvasWidth / 2, 50);
    
    ctx.fillStyle = '#888';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Order: ' + data.orderId + ' • ' + new Date().toLocaleDateString(), canvasWidth / 2, 75);
    
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(30, 95, canvasWidth - 60, 1);
    
    ctx.fillStyle = '#e6b800';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CUSTOMER DETAILS', 30, 120);
    
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '13px Inter, sans-serif';
    var y = 145;
    ctx.fillText('Name: ' + data.customer.name, 30, y); y += 20;
    ctx.fillText('Phone: ' + data.customer.phone, 30, y); y += 20;
    if (data.customer.email) { ctx.fillText('Email: ' + data.customer.email, 30, y); y += 20; }
    ctx.fillText('Delivery: ' + data.customer.deliveryMethod, 30, y); y += 20;
    
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(30, y + 10, canvasWidth - 60, 1);
    y += 35;
    
    ctx.fillStyle = '#e6b800';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('DELIVERY ADDRESS', 30, y);
    y += 25;
    
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(data.customer.address, 30, y); y += 20;
    ctx.fillText(data.customer.city + ', ' + data.customer.state, 30, y); y += 20;
    ctx.fillText(data.customer.country, 30, y); y += 20;
    if (data.customer.zipCode) { ctx.fillText(data.customer.zipCode, 30, y); y += 20; }
    if (data.customer.note) { 
      ctx.fillStyle = '#aaa';
      ctx.font = 'italic 12px Inter, sans-serif';
      ctx.fillText('Note: ' + data.customer.note, 30, y); 
      y += 20;
    }
    
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(30, y + 10, canvasWidth - 60, 1);
    y += 35;
    
    ctx.fillStyle = '#e6b800';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('ORDER ITEMS', 30, y);
    y += 25;
    
    ctx.font = '12px Inter, sans-serif';
    data.items.forEach(function(item, idx) {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillText((idx + 1) + '. ' + item.name, 30, y);
      ctx.fillStyle = '#e6b800';
      ctx.textAlign = 'right';
      ctx.fillText('₦' + (item.price * item.quantity).toLocaleString(), canvasWidth - 30, y);
      ctx.textAlign = 'left';
      y += 18;
    ctx.fillStyle = '#999';
      ctx.fillText('   Size: ' + item.size + ' | Color: ' + item.color + ' | Qty: ' + item.quantity, 30, y);
      y += 25;
    });
    
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(30, y + 5, canvasWidth - 60, 1);
    y += 30;
    
    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'left';
    ctx.fillText('Subtotal', 30, y);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText('₦' + data.subtotal.toLocaleString(), canvasWidth - 30, y);
    y += 22;
    
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'left';
    ctx.fillText('Delivery', 30, y);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(data.deliveryFee > 0 ? '₦' + data.deliveryFee.toLocaleString() : 'Free', canvasWidth - 30, y);
    y += 22;
    
    if (data.discount > 0) {
      ctx.fillStyle = '#aaa';
      ctx.textAlign = 'left';
      ctx.fillText('Discount (' + (data.coupon || '') + ')', 30, y);
      ctx.fillStyle = '#198754';
      ctx.textAlign = 'right';
      ctx.fillText('-₦' + data.discount.toLocaleString(), canvasWidth - 30, y);
      y += 22;
    }
    
    ctx.fillStyle = 'rgba(255,215,0,0.25)';
    ctx.fillRect(30, y + 5, canvasWidth - 60, 2);
    y += 30;
    
    ctx.fillStyle = '#e6b800';
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TOTAL', 30, y);
    ctx.textAlign = 'right';
    ctx.fillText('₦' + data.total.toLocaleString(), canvasWidth - 30, y);
    
    y += 50;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(30, y, canvasWidth - 60, 1);
    y += 25;
    
    ctx.fillStyle = '#999';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Payment on delivery • Thank you for shopping VAIN.PRODUCTIONS', canvasWidth / 2, y);
    y += 18;
    ctx.fillText('🇳🇬', canvasWidth / 2, y);
    
    canvas.height = y + 30;
    
    var mimeType = format === 'pdf' ? 'image/jpeg' : ('image/' + format);
    var quality = format === 'pdf' ? 0.95 : 0.92;
    
    return new Promise(function(resolve) {
      canvas.toBlob(function(blob) {
        resolve({
          blob: blob,
          mimeType: mimeType,
          format: format
        });
      }, mimeType, quality);
    });
  }

  function downloadReceipt(data) {
    generateReceiptImage(data, 'jpeg').then(function(result) {
      var url = URL.createObjectURL(result.blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'VAIN-Receipt-' + data.orderId + '.jpg';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function getReceiptDataUrl(data, callback) {
    generateReceiptImage(data, 'jpeg').then(function(result) {
      var reader = new FileReader();
      reader.onloadend = function() {
        callback(reader.result);
      };
      reader.readAsDataURL(result.blob);
    });
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
    var group = document.getElementById(fieldId)?.closest('.form-group');
    if (group) {
      group.classList.add('has-error');
      var errorEl = document.getElementById('error-' + fieldId);
      if (errorEl) errorEl.textContent = message;
    }
  }

  function getFieldLabel(fieldId) {
    var labels = {
      'customer-name': 'Full Name',
      'customer-phone': 'Phone Number',
      'customer-email': 'Email Address',
      'customer-address': 'Delivery Address',
      'customer-city': 'City',
      'customer-state': 'State',
      'delivery-method': 'Delivery Method'
    };
    return labels[fieldId] || fieldId;
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

    setTimeout(function() {
      try {
        saveCart([]);
        updateCartCount(true);
        updateCartDisplay();
        
        generateReceiptImage(payload, selectedFormat).then(function(result) {
          var url = URL.createObjectURL(result.blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'VAIN-Receipt-' + payload.orderId + (selectedFormat === 'pdf' ? '.pdf' : '.jpg');
          a.click();
          URL.revokeObjectURL(url);
          
          showNotification('Receipt downloaded! Opening ' + (window.VainMessaging ? (window.VainMessaging.getPreferredChannel() === 'telegram' ? 'Telegram' : 'WhatsApp') : 'WhatsApp') + '...', 'success');
          
          setTimeout(function() {
            if (window.VainMessaging) {
              window.VainMessaging.openOrderChatWithReceipt(payload, null);
            } else if (window.VainWhatsApp) {
              getReceiptDataUrl(payload, function(dataUrl) {
                window.VainWhatsApp.openOrderChatWithReceipt(payload, dataUrl);
              });
            }
          }, 1500);
        });
      } catch (err) {
        console.error('Error processing order:', err);
        showNotification('There was an error processing your order. Please try again.', 'error');
        setLoadingState(submitBtn, false);
      }
    }, 800);
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

  function applyCoupon(code, discountPercent, freeShipping) {
    localStorage.setItem('vainCoupon', JSON.stringify({ code: code, discountPercent: discountPercent, freeShipping: freeShipping, appliedAt: Date.now() }));
  }

  function getAppliedCoupon() {
    var data = localStorage.getItem('vainCoupon');
    return data ? JSON.parse(data) : null;
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

  function setLoadingState(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.disabled = true;
      btn.querySelector('.btn-text').style.display = 'none';
      btn.querySelector('.btn-loading').style.display = 'flex';
    } else {
      btn.disabled = false;
      btn.querySelector('.btn-text').style.display = 'flex';
      btn.querySelector('.btn-loading').style.display = 'none';
    }
  }

  function setupMobileCartButtons() {
    var mobileBottomCartBtn = document.getElementById('mobile-bottom-cart-btn');
    var mobileHamburgerCartBtn = document.getElementById('mobile-hamburger-cart-btn');
    var drawer = document.getElementById('cart-drawer');
    
    var openMobileDrawer = function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (drawer) {
        drawer.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateCartDrawer();
        setTimeout(function() { drawer.classList.add('animated'); }, 10);
      }
    };
    
    if (mobileBottomCartBtn) {
      mobileBottomCartBtn.addEventListener('click', openMobileDrawer);
    }
    
    if (mobileHamburgerCartBtn) {
      mobileHamburgerCartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        var dropdown = document.getElementById('hamburger-dropdown');
        if (dropdown) dropdown.classList.remove('active');
        var toggle = document.getElementById('mobile-menu-toggle');
        if (toggle) toggle.classList.remove('active');
        openMobileDrawer(e);
      });
    }
  }

  function setupDeliveryMethodListener() {
    var deliverySelect = document.getElementById('delivery-method');
    if (deliverySelect) {
      deliverySelect.addEventListener('change', function() {
        updateOrderSummary();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    updateCartCount(false);
    setupCartDrawer();
    setupMobileCartButtons();
    setupDeliveryMethodListener();
    setupHeaderWishlistButton();
    updateWishlistCountBadges();
    updateWishlistButtons();
    setupWishlistPage();

    var wishlistPage = document.getElementById('wishlist-items');
    if (wishlistPage) {
      renderWishlistPage();
    }

    var registryPage = document.getElementById('registry-items');
    if (registryPage) {
      renderRegistryPage();
    }

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
      });
    }

    setupCouponCode();
    updateOrderSummary();
    if (document.getElementById('cart-items')) updateCartPage();
  });

  window.CartSystem = {
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateCartItemQuantity: updateCartItemQuantity,
    getCartTotal: getCartTotal,
    getCartItemCount: getCartItemCount,
    updateCartCount: updateCartCount,
    updateCartDisplay: updateCartDisplay,
    toggleWishlist: toggleWishlist,
    isInWishlist: isInWishlist,
    updateWishlistButtons: updateWishlistButtons,
    getWishlist: getWishlist,
    getWishlistCount: getWishlistCount,
    getWishlistTotal: getWishlistTotal,
    updateWishlistCountBadges: updateWishlistCountBadges,
    addAllToCart: addAllToCart,
    clearWishlist: clearWishlist,
    removeFromWishlist: removeFromWishlist,
    moveToRegistry: moveToRegistry,
    moveToWishlist: moveToWishlist,
    getRegistry: getRegistry,
    generateShareableLink: generateShareableLink,
    copyShareableLink: copyShareableLink,
    shareViaWhatsApp: shareViaWhatsApp,
    shareViaTwitter: shareViaTwitter,
    shareViaEmail: shareViaEmail,
    renderWishlistPage: renderWishlistPage,
    renderRegistryPage: renderRegistryPage,
    showNotification: showNotification
  };
})();
