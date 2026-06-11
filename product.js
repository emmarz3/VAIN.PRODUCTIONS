(function() {
  'use strict';

  var currentProduct = null;
  var selectedSize = '';
  var selectedColor = '';
  var selectedQuantity = 1;

  function escapeHtml(str) {
    return String(str ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function formatPrice(price) {
    return '\u20A6' + Number(price || 0).toLocaleString();
  }

  function getBasePath() {
    return window.location.pathname.indexOf('/pages/') !== -1 ? '../' : '';
  }

  function showNotification(message, type) {
    type = type || 'success';
    document.querySelectorAll('.toast-notification').forEach(function(n) { n.remove(); });
    var el = document.createElement('div');
    el.className = 'toast-notification ' + type;
    var icon = type === 'success' ? '\u2713' : type === 'error' ? '\u2715' : '\u2139';
    el.innerHTML = '<span class="toast-icon">' + icon + '</span><span class="toast-message">' + message + '</span>';
    document.body.appendChild(el);
    setTimeout(function() { el.classList.add('show'); }, 10);
    setTimeout(function() {
      el.classList.remove('show');
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 4000);
  }

  function loadProduct(productId) {
    currentProduct = window.ProductData.getProductById(productId);
    window._currentProductId = parseInt(productId);
    if (!currentProduct) { showProductNotFound(); return; }
    renderProductDetails();
    renderRelatedProducts();
    updateBreadcrumb();
  }

  function renderProductDetails() {
    var bp = getBasePath();
    document.title = currentProduct.name + ' - VAIN.PRODUCTIONS';

    var breadcrumb = document.getElementById('product-name-breadcrumb');
    if (breadcrumb) breadcrumb.textContent = currentProduct.name;

    var breadcrumbCat = document.getElementById('breadcrumb-category');
    if (breadcrumbCat) {
      breadcrumbCat.textContent = currentProduct.category.charAt(0).toUpperCase() + currentProduct.category.slice(1);
    }

    var mainImage = document.getElementById('main-product-image');
    if (mainImage) { mainImage.src = bp + currentProduct.image; mainImage.alt = currentProduct.name; }

    var thumbs = document.getElementById('thumbnail-gallery');
    if (thumbs) {
      thumbs.innerHTML = '';
      currentProduct.images.forEach(function(img, idx) {
        var t = document.createElement('img');
        t.src = bp + img;
        t.alt = currentProduct.name + ' view ' + (idx + 1);
        t.loading = 'lazy';
        if (idx === 0) t.classList.add('active');
        t.addEventListener('click', function() {
          if (mainImage) mainImage.src = bp + img;
          thumbs.querySelectorAll('img').forEach(function(i) { i.classList.remove('active'); });
          t.classList.add('active');
        });
        thumbs.appendChild(t);
      });
    }

    var titleEl = document.getElementById('product-title');
    if (titleEl) titleEl.textContent = currentProduct.name;

    var priceEl = document.getElementById('product-price');
    if (priceEl) {
      priceEl.innerHTML = currentProduct.originalPrice
        ? '<span class="original-price">' + formatPrice(currentProduct.originalPrice) + '</span> ' + formatPrice(currentProduct.price)
        : formatPrice(currentProduct.price);
    }

    var descEl = document.getElementById('product-description');
    if (descEl) descEl.innerHTML = '<p>' + escapeHtml(currentProduct.description) + '</p>';

    var badgesEl = document.getElementById('product-badges-detail');
    if (badgesEl) {
      badgesEl.innerHTML = '';
      if (currentProduct.isNew) badgesEl.innerHTML += '<span class="badge new">New</span>';
      if (currentProduct.isLimited) badgesEl.innerHTML += '<span class="badge limited">Limited</span>';
      if (!currentProduct.inStock) badgesEl.innerHTML += '<span class="badge out-of-stock">Out of Stock</span>';
      if (currentProduct.originalPrice) {
        var pct = Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100);
        badgesEl.innerHTML += '<span class="badge sale">' + pct + '% Off</span>';
      }
    }

    var sizeOpts = document.getElementById('size-options');
    if (sizeOpts) {
      sizeOpts.innerHTML = '';
      currentProduct.sizes.forEach(function(size) {
        var btn = document.createElement('button');
        btn.className = 'size-option';
        btn.textContent = size;
        btn.addEventListener('click', function() { selectSize(size, btn); });
        sizeOpts.appendChild(btn);
      });
    }

    var colorOpts = document.getElementById('color-options');
    if (colorOpts) {
      colorOpts.innerHTML = '';
      currentProduct.colors.forEach(function(color) {
        var btn = document.createElement('button');
        btn.className = 'color-option';
        btn.style.backgroundColor = color.toLowerCase();
        btn.title = color;
        btn.setAttribute('aria-label', color);
        btn.addEventListener('click', function() { selectColor(color, btn); });
        colorOpts.appendChild(btn);
      });
    }

    if (currentProduct.sizes.length > 0 && sizeOpts) selectSize(currentProduct.sizes[0], sizeOpts.firstElementChild);
    if (currentProduct.colors.length > 0 && colorOpts) selectColor(currentProduct.colors[0], colorOpts.firstElementChild);

    updateAddToCartButton();
    updateWishlistButton();

    var skuEl = document.getElementById('product-sku');
    if (skuEl) skuEl.textContent = 'VAIN-' + String(currentProduct.id).padStart(3, '0');
    var catEl = document.getElementById('product-category');
    if (catEl) catEl.textContent = currentProduct.category.charAt(0).toUpperCase() + currentProduct.category.slice(1);
    var tagsEl = document.getElementById('product-tags');
    if (tagsEl) tagsEl.textContent = currentProduct.tags.join(', ');
    var stockEl = document.getElementById('product-stock');
    if (stockEl) {
      stockEl.textContent = currentProduct.inStock ? 'In Stock (' + currentProduct.stockCount + ' available)' : 'Out of Stock';
      stockEl.style.color = currentProduct.inStock ? 'var(--color-success)' : 'var(--color-danger)';
    }

    var featuresList = document.getElementById('features-list');
    var featuresContainer = document.getElementById('product-features');
    if (featuresList && featuresContainer) {
      featuresList.innerHTML = '';
      if (currentProduct.features && currentProduct.features.length > 0) {
        currentProduct.features.forEach(function(f) {
          var li = document.createElement('li');
          li.textContent = f;
          featuresList.appendChild(li);
        });
        featuresContainer.style.display = 'block';
      } else {
        featuresContainer.style.display = 'none';
      }
    }
  }

  function selectSize(size, btn) {
    selectedSize = size;
    document.querySelectorAll('.size-option').forEach(function(b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    var label = document.getElementById('selected-size-label');
    if (label) label.textContent = size;
    updateAddToCartButton();
  }

  function selectColor(color, btn) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(function(b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
    var label = document.getElementById('selected-color-label');
    if (label) label.textContent = color;
    updateAddToCartButton();
  }

  function updateAddToCartButton() {
    var btn = document.getElementById('add-to-cart-btn');
    if (!btn) return;
    var canAdd = selectedSize && selectedColor && currentProduct.inStock;
    btn.disabled = !canAdd;
    btn.textContent = !currentProduct.inStock ? 'Out of Stock' : !canAdd ? 'Select Options' : 'Add to Cart';
  }

  function updateWishlistButton() {
    var btn = document.getElementById('wishlist-toggle');
    if (!btn || !currentProduct) return;
    var inWishlist = window.WishlistSystem
      ? window.WishlistSystem.isInWishlist(currentProduct.id)
      : window.CartSystem.isInWishlist(currentProduct.id);
    btn.classList.toggle('active', inWishlist);
  }

  function handleAddToCart() {
    if (!currentProduct || !selectedSize || !selectedColor) {
      showNotification('Please select size and color', 'error');
      return;
    }
    window.CartSystem.addToCart(currentProduct, selectedQuantity, selectedSize, selectedColor);
  }

  function handleBuyNow() {
    if (!currentProduct) return;
    var orderId = 'VAIN-' + Date.now();
    var msg = '\uD83D\uDECD\uFE0F *QUICK ORDER - VAIN.PRODUCTIONS*\n\n';
    msg += '\uD83D\uDCE6 *Order ID:* ' + orderId + '\n';
    msg += '\uD83D\uDCC5 *Date:* ' + new Date().toLocaleString() + '\n\n';
    msg += '\uD83D\uDED2 *ITEM*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
    msg += '*' + currentProduct.name + '*\n';
    msg += 'Size: ' + selectedSize + ' | Color: ' + selectedColor + '\n';
    msg += 'Quantity: ' + selectedQuantity + '\n';
    msg += 'Price: \u20A6' + (currentProduct.price * selectedQuantity).toLocaleString() + '\n\n';
    msg += '\uD83D\uDCB5 *TOTAL: \u20A6' + (currentProduct.price * selectedQuantity).toLocaleString() + '*\n\n';
    msg += '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n';
    msg += '\u2705 *Please confirm availability and delivery details.*\n';
    msg += '\uD83D\uDCB3 *Payment will be collected upon delivery.*\n\n';
    msg += 'Thank you for choosing VAIN.PRODUCTIONS! \uD83C\uDDFF\uD83C\uDDE6';

    var orderData = {
      orderId: orderId,
      customer: { name: '', phone: '', address: '', city: '', state: '', country: 'Nigeria', deliveryMethod: '' },
      items: [{ name: currentProduct.name, size: selectedSize, color: selectedColor, quantity: selectedQuantity, price: currentProduct.price }],
      subtotal: currentProduct.price * selectedQuantity,
      deliveryFee: 0,
      discount: 0,
      total: currentProduct.price * selectedQuantity,
      coupon: null
    };

    if (window.VainMessaging) {
      window.VainMessaging.openOrderChat(orderData);
    } else if (window.VainWhatsApp) {
      window.VainWhatsApp.openOrderChat(orderData);
    } else {
      var waUrl = 'https://wa.me/2349134141831?text=' + encodeURIComponent(msg);
      var isIOS = /iP(hone|od|ad)/.test(navigator.userAgent);
      if (isIOS) {
        window.location.href = waUrl;
      } else {
        var w = window.open(waUrl, '_blank');
        if (!w || w.closed || typeof w.closed === 'undefined') {
          window.location.href = waUrl;
        }
      }
    }
  }

  function toggleWishlist() {
    if (!currentProduct) return;
    if (window.WishlistSystem) {
      window.WishlistSystem.toggleWishlist(currentProduct);
    } else if (window.CartSystem) {
      window.CartSystem.toggleWishlist(currentProduct);
    }
    updateWishlistButton();
  }

  function renderRelatedProducts() {
    var container = document.getElementById('related-products');
    if (!container) return;
    var bp = getBasePath();
    var related = window.ProductData.products.filter(function(p) {
      return p.category === currentProduct.category && p.id !== currentProduct.id;
    }).slice(0, 4);

    container.innerHTML = '';
    if (related.length === 0) { container.innerHTML = '<p class="no-related">No related products found.</p>'; return; }

    related.forEach(function(product) {
      var card = document.createElement('div');
      card.className = 'product-card';
      var priceDisplay = product.originalPrice
        ? '<span class="original-price">' + formatPrice(product.originalPrice) + '</span> ' + formatPrice(product.price)
        : formatPrice(product.price);
      var inWishlist = window.CartSystem.isInWishlist(product.id);

      card.innerHTML = '<div class="product-image">' +
        '<img src="' + bp + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy">' +
        (product.isNew ? '<span class="badge new">New</span>' : '') +
        (!product.inStock ? '<span class="badge out-of-stock">Out of Stock</span>' : '') +
        '</div>' +
        '<div class="product-info">' +
        '<h3 class="product-name">' + escapeHtml(product.name) + '</h3>' +
        '<div class="product-price">' + priceDisplay + '</div>' +
        '<div class="product-actions">' +
        '<button class="btn btn-primary add-to-cart" ' + (!product.inStock ? 'disabled' : '') + '>' +
        (product.inStock ? 'Add to Cart' : 'Out of Stock') + '</button>' +
        '<button class="btn btn-secondary wishlist-btn ' + (inWishlist ? 'active' : '') + '" data-wishlist-btn data-product-id="' + product.id + '">' + (inWishlist ? '\u2665' : '\u2661') + '</button>' +
        '</div></div>';

      var addBtn = card.querySelector('.add-to-cart');
      if (addBtn && !addBtn.disabled) {
        addBtn.addEventListener('click', function(e) { e.stopPropagation(); window.CartSystem.addToCart(product); });
      }
      var wishBtn = card.querySelector('.wishlist-btn');
      if (wishBtn) {
        wishBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          window.CartSystem.toggleWishlist(product);
          window.CartSystem.updateWishlistButtons();
        });
      }
      card.addEventListener('click', function() { window.location.href = './product.html?id=' + product.id; });
      container.appendChild(card);
    });
  }

  function showProductNotFound() {
    var section = document.querySelector('.product-details');
    if (section) {
      section.innerHTML = '<div class="container"><div class="product-not-found"><h1>Product Not Found</h1><p>The product you\'re looking for doesn\'t exist.</p><a href="../products.html" class="btn btn-primary">Back to Shop</a></div></div>';
    }
  }

  function updateBreadcrumb() {
    var el = document.getElementById('product-name-breadcrumb');
    if (el && currentProduct) el.textContent = currentProduct.name;
  }

  function setupQuantityControls() {
    var qtyInput = document.getElementById('quantity');
    var qtyMinus = document.getElementById('quantity-minus');
    var qtyPlus = document.getElementById('quantity-plus');
    if (qtyMinus) qtyMinus.addEventListener('click', function() {
      var c = parseInt(qtyInput.value);
      if (c > 1) { qtyInput.value = c - 1; selectedQuantity = c - 1; }
    });
    if (qtyPlus) qtyPlus.addEventListener('click', function() {
      var c = parseInt(qtyInput.value);
      if (c < 99) { qtyInput.value = c + 1; selectedQuantity = c + 1; }
    });
    if (qtyInput) qtyInput.addEventListener('change', function(e) {
      var v = parseInt(e.target.value);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 99) v = 99;
      e.target.value = v;
      selectedQuantity = v;
    });
  }

  function setupActionButtons() {
    var addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) addBtn.addEventListener('click', handleAddToCart);
    var buyBtn = document.getElementById('buy-now-btn');
    if (buyBtn) buyBtn.addEventListener('click', handleBuyNow);
    var wishBtn = document.getElementById('wishlist-toggle');
    if (wishBtn) wishBtn.addEventListener('click', toggleWishlist);
  }

  document.addEventListener('DOMContentLoaded', function() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    if (id) {
      loadProduct(id);
    } else {
      showProductNotFound();
    }
    setupQuantityControls();
    setupActionButtons();
    var buyBtn = document.getElementById('buy-now-btn');
    if (buyBtn && window.VainMessaging) {
      var ch = window.VainMessaging.CHANNELS[window.VainMessaging.getPreferredChannel()];
      buyBtn.textContent = 'Buy on ' + ch.name;
    }
  });

  window.ProductDetail = {
    loadProduct: loadProduct,
    getCurrentProduct: function() { return currentProduct; },
    getSelectedSize: function() { return selectedSize; },
    getSelectedColor: function() { return selectedColor; },
    getSelectedQuantity: function() { return selectedQuantity; },
    selectSize: selectSize,
    selectColor: selectColor,
    handleAddToCart: handleAddToCart,
    handleBuyNow: handleBuyNow,
    toggleWishlist: toggleWishlist,
    showNotification: showNotification,
    formatPrice: formatPrice,
    escapeHtml: escapeHtml,
    getBasePath: getBasePath
  };
})();
