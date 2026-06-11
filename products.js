// ============================================================
// VAIN.PRODUCTIONS — Products / Shop Page Module
// Load order: products.js → cart.js → search.js → app.js
//
// PUBLIC API
//   window.ProductData  — product catalog model (also loads first)
//   window.ShopSystem   — rendering, filtering, add-to-cart bridge
//
// INTEGRATION POINTS
//   window.CartSystem  (js/cart.js) — addToCart / updateCartCount / showNotification
//   window.VainWhatsApp (js/whatsapp.js) — openOrderChat / buildOrderMessage
//   window.App (js/app.js) — createProductCard / renderFeaturedProducts / renderShopProducts
//
// Both js/products.js and js/app.js load before js/cart.js.  DOMReady
// callbacks here fire after cart.js inits, so CartSystem is guaranteed
// available when any button is clicked.
// ============================================================

/* ============================================================
   1. PRODUCT DATA MODEL
   ============================================================ */
class ProductData {
  constructor() {
    this.products = [
      {
        id: 1,
        name: 'Swag Revival camo tee',
        price: 18000,
        originalPrice: null,
        image: 'products/photo_2026-05-05_20-29-31.jpg',
        images: [
          'products/photo_2026-05-05_20-29-31.jpg',
          'products/photo_2026-05-05_20-29-29.jpg',
        ],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Black'],
        category: 'tees',
        description: 'People Thought Swag Died. We Revived It. Heavy street energy wrapped in a clean black tee with bold camo typography. Built for the culture, the hustle, and the ones who never lost sauce.',
        features: [
          'Premium black cotton fabric',
          'Bold camo typography print',
          'Relaxed streetwear fit',
          'Minimal branded lower tag detail',
          'Everyday luxury/street style fusion'

        ],
        inStock: true,
        isNew: true,
        isLimited: true,
        stockCount: 23,
      },
      {
        id: 2,
        name: 'Leopard print vain armless tee',
        price: 20000,
        originalPrice: null,
        image: 'products/photo_2026-05-05_20-29-27.jpg',
        images: [
          'products/photo_2026-05-05_20-29-27.jpg',
          'products/photo_2026-05-05_20-29-27.jpg'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black'],
        category: 'tees',
        description:
          "A fearless streetwear piece with raw vintage energy, bold leopard flag graphics, and oversized confidence. Made for the ones who step out seen, not subtle.",
        features: [
          "Premium washed black fabric",
          "Bold leopard flag graphic",
          "Oversized streetwear fit",
          "Sleeveless vintage cut",
          "Heavy urban aesthetic"
        ],
        inStock: true,
        isNew: true,
        stockCount: 45,
        tags: ['new', 'tee', 'basics']
      },
      {
        id: 3,
        name: 'Vain Monarch Polo',
        price: 35000,
        originalPrice: null,
        image: 'products/photo_2026-05-25_20-32-29.jpg',
        images: [
          'products/photo_2026-05-25_20-32-29.jpg'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black'],
        category: 'polo',
        description:
  "Luxury streetwear meets timeless vintage energy. A bold polo built with elite graphics, premium details, and quiet confidence for standout fits.",

features: [
  "Premium black polo fabric",
  "Luxury crest and knight graphics",
  "Vintage-inspired streetwear aesthetic",
  "Soft relaxed fit",
  "Detailed sleeve and hem accents",
  "Clean luxury urban look"
],
        inStock: true,
        stockCount: 30,
        tags: ['polo', 'streetwear', 'luxury']
      },
      {
        id: 4,
        name: 'VAIN White Tee',
        price: 19000,
        originalPrice: null,
        image: 'products/photo_2026-05-05_20-29-26.jpg',
        images: [
          'products/photo_2026-05-05_20-29-26.jpg'
        ],
        sizes: ['One Size'],
        colors: ['White'],
        category: 'tee',
        description: "An absolute heavyweight in conceptual streetwear. This white tee drops a raw, high-contrast barcode graphic right on the chest, blending stark surrealism with a sharp psychological edge. It’s clean, provocative, and built to anchor any tech-wear or street-forward rotation.",
  features: [
    "Premium heavyweight cotton with a relaxed, drop-shoulder cut.",
    "High-contrast central barcode print with leopard-patterned surreal figures.",
    "Distressed 'PTSD' lettering paired with sharp ISBN typography.",
    "Clean, durable double-stitched seams and a thick ribbed collar."
  ],

        inStock: true,
        stockCount: 67,
        tags: ['tee']
      },
      {
        id: 5,
        name: 'Swag Revival Camo Tee 2',
        price: 18000,
        originalPrice: null,
        image: 'products/photo_2026-05-11_19-37-23.jpg',
        images: [
          'products/photo_2026-05-11_19-37-23.jpg'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black'],
        category: 'tees',
        description: "A loud, cynical take on modern internet irony. This faded black tee hits hard with bold, stacked typography declaring 'SWAG WILL SAVE ME'. It perfectly merges early-web aesthetics with aggressive, dystopian streetwear energy.",
  features: [
    "Premium vintage-wash black cotton with a relaxed streetwear drape.",
    "Bold, stacked white typographic print utilizing section sign (§) styling.",
    "High-contrast neon yellow hazard label printed at the lower left hem.",
    "Ribbed crewneck collar with reinforced, low-profile shoulder stitching."
  ],
        inStock: true,
        isLimited: true,
        stockCount: 40,
        tags: ['limited', 'tee', 'handcrafted']
      },
      
    
 

       
      
    ];

    this.collections = [
      {
        id: 'lagos-nights',
        name: 'Lagos Nights',
        description: 'Inspired by the vibrant energy and sophistication of Lagos nightlife',
        coverImage: 'products/photo_2026-05-05_20-29-28.jpg',
        productIds: [1, 2]
      },
      {
        id: 'urban-collection',
        name: 'Urban Collection',
        description: 'Functional streetwear for the modern Lagos resident',
        coverImage: 'products/photo_2026-05-05_20-29-28.jpg',
        productIds: [3, 6]
      },
      {
        id: 'heritage',
        name: 'Heritage Collection',
        description: 'Celebrating Nigerian culture through contemporary fashion',
        coverImage: 'products/photo_2026-05-05_20-29-28.jpg',
        productIds: [5]
      },
      {
        id: 'essentials',
        name: 'Essentials',
        description: 'Timeless pieces that form the foundation of your wardrobe',
        coverImage: 'products/photo_2026-05-05_20-29-28.jpg',
        productIds: [4, 6]
      }
    ];

    this.categories = [
      { id: 'hoodies', name: 'Hoodies', count: 1 },
      { id: 'tees', name: 'T-Shirts', count: 1 },
      { id: 'pants', name: 'Pants', count: 2 },
      { id: 'jackets', name: 'Jackets', count: 1 },
      { id: 'accessories', name: 'Accessories', count: 1 }
    ];
  }

  /* ── Queries ────────────────────────────────────────── */
  getAllProducts()          { return this.products; }
  getProductById(id)        { return this.products.find(p => p.id === parseInt(id)); }
  getProductsByCategory(c)  { return this.products.filter(p => p.category === c); }
  getProductsByCollection(id) {
    const coll = this.collections.find(c => c.id === id);
    if (!coll) return [];
    return coll.productIds.map(i => this.getProductById(i)).filter(Boolean);
  }
  getFeaturedProducts(limit) {
    return this.products.filter(p => p.isNew || p.isLimited).slice(0, limit);
  }
  getLimitedProducts()      { return this.products.filter(p => p.isLimited); }
  getNewArrivals(limit)     { return this.products.filter(p => p.isNew).slice(0, limit); }
  searchProducts(query) {
    const q = query.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  getCollections()          { return this.collections; }
  getCollectionById(id)     { return this.collections.find(c => c.id === id); }
  getCategories()           { return this.categories; }

  /* ── Helpers ───────────────────────────────────────── */
  formatPrice(price)        { return '\u20A6' + Number(price || 0).toLocaleString(); }
  getDiscountPercentage(p) {
    if (!p.originalPrice) return 0;
    return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  }
}

/* ============================================================
   2. XSS SAFEGUARD
   ============================================================ */
function escapeHtml(str) {
  return String(str ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

/* ============================================================
   3. PRODUCT CARD FACTORY
   Consumed by: js/app.js renderShopProducts() / renderFeaturedProducts()
   But also callable standalone for related-products grids on /pages/.
   ============================================================ */
function createProductCard(product) {
  var card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-product-id', product.id);

  var priceDisplay = product.originalPrice
    ? '<span class="original-price">' + escapeHtml(window.ProductData.formatPrice(product.originalPrice)) + '</span> ' + escapeHtml(window.ProductData.formatPrice(product.price))
    : escapeHtml(window.ProductData.formatPrice(product.price));

  var badgeHtml = '';
  if (product.isNew)      badgeHtml += '<span class="badge new">New</span>';
  if (product.isLimited)  badgeHtml += '<span class="badge limited">Limited</span>';
  if (!product.inStock)   badgeHtml += '<span class="badge out-of-stock">Out of Stock</span>';
  if (product.originalPrice)
    badgeHtml += '<span class="badge sale">' + window.ProductData.getDiscountPercentage(product) + '% Off</span>';

  card.innerHTML =
    '<div class="product-image">' +
      '<img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy">' +
      badgeHtml +
      '<div class="product-overlay">' +
        '<button class="quick-view-btn" data-product-id="' + product.id + '" aria-label="Quick view ' + escapeHtml(product.name) + '">Quick View</button>' +
      '</div>' +
    '</div>' +
    '<div class="product-info">' +
      '<h3 class="product-name">' + escapeHtml(product.name) + '</h3>' +
      '<div class="product-price">' + priceDisplay + '</div>' +
      '<div class="product-actions">' +
        '<button class="btn btn-primary add-to-cart-btn" data-product-id="' + product.id + '" ' +
          (!product.inStock ? 'disabled' : '') + '>' +
          (product.inStock ? 'Add to Cart' : 'Out of Stock') +
        '</button>' +
        '<button class="icon-btn wishlist-btn" data-wishlist-btn data-product-id="' + product.id + '" aria-label="Wishlist">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' +
        '</button>' +
      '</div>' +
    '</div>';

  /* ── Add-to-cart (bridges to CartSystem) ── */
  var addBtn = card.querySelector('.add-to-cart-btn');
  addBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (product.inStock && window.CartSystem) {
      window.CartSystem.addToCart(product);
    }
  });

  /* ── Wishlist toggle (bridges to WishlistSystem or CartSystem) ── */
  var wishBtn = card.querySelector('.wishlist-btn');
  wishBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (window.WishlistSystem) {
      window.WishlistSystem.toggleWishlist(product);
    } else if (window.CartSystem) {
      window.CartSystem.toggleWishlist(product);
      window.CartSystem.updateWishlistButtons();
    }
  });

  /* ── Quick view → modal overlay ── */
  var quickView = card.querySelector('.quick-view-btn');
  quickView.addEventListener('click', function(e) {
    e.stopPropagation();
    openQuickView(product);
  });

  /* ── Whole-card click → product detail page ── */
  card.addEventListener('click', function() {
    window.location.href = 'pages/product.html?id=' + product.id;
  });

  return card;
}

/* ============================================================
   4. SHOP RENDERER (standalone — used by DOMContentLoaded when
   app.js is absent or on pages where only products.js loads)
   ============================================================ */
var _shopFiltered = [];

function setupFilterByChecks() {
  var checkNew      = document.getElementById('filter-new');
  var checkLimited  = document.getElementById('filter-limited');
  var checkSale     = document.getElementById('filter-sale');
  if (!checkNew || !checkLimited || !checkSale) return;

  [checkNew, checkLimited, checkSale].forEach(function(inp) {
    inp.addEventListener('change', applyFilters);
  });
}

function applyFilters() {
  if (!window.ProductData) return;
  var all = window.ProductData.getAllProducts();
  var filtered = all.slice();
  var grid    = document.getElementById('product-grid');
  var empty   = document.getElementById('shop-empty');
  var countEl = document.getElementById('results-count');
  if (!grid) return;

  var catInputs = document.querySelectorAll('#category-filters input[type="checkbox"]:checked');
  var cats = [];
  catInputs.forEach(function(inp) { cats.push(inp.value); });
  if (cats.length > 0)
    filtered = filtered.filter(function(p) { return cats.indexOf(p.category) !== -1; });

  var collInputs = document.querySelectorAll('#collection-filters input[type="checkbox"]:checked');
  var colls = [];
  collInputs.forEach(function(inp) { colls.push(inp.value); });
  if (colls.length > 0)
    filtered = filtered.filter(function(p) { return colls.indexOf(p.collection) !== -1; });

  var filterNew = document.getElementById('filter-new');
  if (filterNew && filterNew.checked)
    filtered = filtered.filter(function(p) { return p.isNew; });

  var filterLimited = document.getElementById('filter-limited');
  if (filterLimited && filterLimited.checked)
    filtered = filtered.filter(function(p) { return p.isLimited; });

  var filterSale = document.getElementById('filter-sale');
  if (filterSale && filterSale.checked)
    filtered = filtered.filter(function(p) { return !!p.originalPrice; });

  var sortSelect = document.getElementById('sort-select');
  var sortBy = sortSelect ? sortSelect.value : 'featured';
  switch (sortBy) {
    case 'newest':   filtered.sort(function(a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); }); break;
    case 'price-low':  filtered.sort(function(a, b) { return a.price - b.price; }); break;
    case 'price-high': filtered.sort(function(a, b) { return b.price - a.price; }); break;
    case 'name':    filtered.sort(function(a, b) { return a.name.localeCompare(b.name); }); break;
    default: break;
  }

  _shopFiltered = filtered;

  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.style.display = 'none';
    if (empty) empty.style.display = 'block';
  } else {
    // In landscape swipe-mode (CSS turns #product-grid into a flex scroller),
    // keep using the existing flex display.
    // Let the CSS control layout (landscape swipe-mode uses flex).
    // Avoid overriding with inline styles.
    if (grid.dataset && grid.dataset.swipeMode === '1') {
      // no-op
    } else {
      grid.style.display = 'grid';
    }

    if (empty) empty.style.display = 'none';
    filtered.forEach(function(p) {
      grid.appendChild(createProductCard(p));
    });

  }
  if (countEl)
    countEl.textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '');

  if (window.CartSystem) window.CartSystem.updateWishlistButtons();
}

var _shopRendered = false;

function setupCategoryFilters() {
  var catContainer = document.getElementById('category-filters');
  if (!catContainer || !window.ProductData) return;
  catContainer.innerHTML = '';
  window.ProductData.getCategories().forEach(function(cat) {
    var lbl = document.createElement('label');
    lbl.className = 'filter-checkbox';
    lbl.innerHTML = '<input type="checkbox" value="' + cat.id + '"><span>' +
      escapeHtml(cat.name) + ' (' + cat.count + ')</span>';
    catContainer.appendChild(lbl);
  });
  catContainer.querySelectorAll('input').forEach(function(inp) {
    inp.addEventListener('change', applyFilters);
  });
}

function setupCollectionFilters() {
  var collContainer = document.getElementById('collection-filters');
  if (!collContainer || !window.ProductData) return;
  collContainer.innerHTML = '';
  window.ProductData.getCollections().forEach(function(coll) {
    var lbl = document.createElement('label');
    lbl.className = 'filter-checkbox';
    lbl.innerHTML = '<input type="checkbox" value="' + coll.id + '"><span>' +
      escapeHtml(coll.name) + '</span>';
    collContainer.appendChild(lbl);
  });
  collContainer.querySelectorAll('input').forEach(function(inp) {
    inp.addEventListener('change', applyFilters);
  });
}

function setupSortSelect() {
  var sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.addEventListener('change', applyFilters);
}

function setupClearAllFilters() {
  var btn = document.getElementById('clear-filters');
  if (btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(function(inp) {
        inp.checked = false;
      });
      var sortSelect = document.getElementById('sort-select');
      if (sortSelect) sortSelect.value = 'featured';
      applyFilters();
    });
  }
  var emptyBtn = document.getElementById('empty-clear-btn');
  if (emptyBtn) {
    emptyBtn.addEventListener('click', function() {
      document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(function(inp) {
        inp.checked = false;
      });
      var sortSelect = document.getElementById('sort-select');
      if (sortSelect) sortSelect.value = 'featured';
      applyFilters();
    });
  }
}

function renderShopProducts() {
  if (_shopRendered) return;
  _shopRendered = true;
  if (!window.ProductData) return;
  setupCategoryFilters();
  setupCollectionFilters();
  setupFilterByChecks();
  setupSortSelect();
  setupClearAllFilters();
  applyFilters();
}

/* ============================================================
   5. CHECKOUT BRIDGE
   Invoked: when cart drawer's "Proceed to Checkout" fires on
   the products page — navigates to pages/cart.html.
   The cart drawer handler (in cart.js) already does this:
     window.location.href = isPages ? 'cart.html' : 'pages/cart.html';
   This exported helper is kept here for any future direct
   programmatic calls from this module.
   ============================================================ */
function proceedToCheckout() {
  var onPages = window.location.pathname.indexOf('/pages/') !== -1;
  window.location.href = onPages ? 'cart.html' : 'pages/cart.html';
}

/* ============================================================
   6. FEATURED / RELATED PRODUCTS (used on index.html, etc.)
   ============================================================ */
function renderFeaturedProducts(limit) {
  limit = limit || 4;
  var grid = document.getElementById('featured-grid');
  if (!grid || !window.ProductData) return;
  grid.innerHTML = '';
  window.ProductData.getFeaturedProducts(limit).forEach(function(p) {
    grid.appendChild(createProductCard(p));
  });
  if (window.CartSystem) window.CartSystem.updateWishlistButtons();
}

/* ============================================================
   7. BOOTSTRAP — runs at DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  /* 7a. Product catalog model must be available before any render */
  if (!window.ProductData) {
    window.ProductData = new ProductData();
  }

  /* 7b. Render shop listings if #product-grid exists on this page */
  var productGrid = document.getElementById('product-grid');
  if (productGrid) {
    // Coordinate with CSS landscape swipe-mode — only flag swipe mode
    // when the landscape media query actually matches so that applyFilters()
    // still sets display:grid in portrait/non-landscape contexts.
    var mq = window.matchMedia('(orientation: landscape) and (min-width: 768px)');
    if (mq.matches) productGrid.dataset.swipeMode = '1';
    mq.addEventListener('change', function(e) {
      if (e.matches) {
        productGrid.dataset.swipeMode = '1';
      } else {
        delete productGrid.dataset.swipeMode;
      }
    });
    renderShopProducts();
    if (window.App && window.App.renderShopProducts) {
      window.App.renderShopProducts();
    }
  }


  /* 7c. Render featured if #featured-grid exists (e.g. index.html) */
  var featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid) {
    renderFeaturedProducts(4);
    if (window.App && window.App.renderFeaturedProducts) {
      window.App.renderFeaturedProducts();
    }
  }
});

/* ============================================================
   8. QUICK VIEW MODAL
   ============================================================ */
var _qvProduct = null;
var _qvSelectedSize = '';
var _qvSelectedColor = '';
var _qvSelectedQty = 1;
var _qvModalEl = null;

function getQvBasePath() {
  return window.location.pathname.indexOf('/pages/') !== -1 ? '../' : '';
}

function buildQuickViewModal() {
  if (_qvModalEl) return _qvModalEl;
  var d = document.createElement('div');
  d.id = 'quick-view-modal';
  d.className = 'quick-view-modal';
  d.setAttribute('role', 'dialog');
  d.setAttribute('aria-modal', 'true');
  d.setAttribute('aria-label', 'Product quick view');
  d.innerHTML =
    '<div class="quick-view-overlay" id="qv-overlay"></div>' +
    '<div class="quick-view-content">' +
      '<button class="quick-view-close" id="qv-close" aria-label="Close quick view">&times;</button>' +
      '<div class="quick-view-layout">' +
        '<div class="quick-view-gallery">' +
          '<div class="main-image"><img id="qv-main-img" src="" alt=""></div>' +
          '<div class="thumbnail-gallery" id="qv-thumbs"></div>' +
        '</div>' +
        '<div class="quick-view-info">' +
          '<div class="product-badges" id="qv-badges"></div>' +
          '<h2 class="product-title" id="qv-title"></h2>' +
          '<div class="product-price-detail" id="qv-price"></div>' +
          '<div class="product-description-detail" id="qv-desc"></div>' +
          '<div class="product-option-group">' +
            '<label class="option-label">Size: <span id="qv-size-label" class="option-value"></span></label>' +
            '<div class="size-options" id="qv-sizes"></div>' +
          '</div>' +
          '<div class="product-option-group">' +
            '<label class="option-label">Color: <span id="qv-color-label" class="option-value"></span></label>' +
            '<div class="color-options" id="qv-colors"></div>' +
          '</div>' +
          '<div class="product-option-group">' +
            '<label class="option-label">Quantity</label>' +
            '<div class="quantity-selector">' +
              '<button class="qty-btn" id="qv-qty-minus" aria-label="Decrease quantity">−</button>' +
              '<input type="number" id="qv-qty-input" value="1" min="1" max="99" class="qty-input">' +
              '<button class="qty-btn" id="qv-qty-plus" aria-label="Increase quantity">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="product-actions-detail">' +
            '<button class="btn btn-primary" id="qv-add-cart">Add to Cart</button>' +
            '<button class="icon-btn" id="qv-wishlist" aria-label="Wishlist">' +
              '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
              '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' +
            '</button>' +
          '</div>' +
          '<a class="quick-view-full-link" id="qv-full-link" href="#">View Full Details &rarr;</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(d);

  d.querySelector('#qv-overlay').addEventListener('click', closeQuickView);
  d.querySelector('#qv-close').addEventListener('click', closeQuickView);
  d.addEventListener('click', function(e) {
    if (e.target === d) closeQuickView();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && _qvModalEl && _qvModalEl.classList.contains('active')) {
      closeQuickView();
    }
  });

  d.querySelector('#qv-qty-minus').addEventListener('click', function() {
    var inp = d.querySelector('#qv-qty-input');
    var c = parseInt(inp.value);
    if (c > 1) { inp.value = c - 1; _qvSelectedQty = c - 1; }
  });
  d.querySelector('#qv-qty-plus').addEventListener('click', function() {
    var inp = d.querySelector('#qv-qty-input');
    var c = parseInt(inp.value);
    if (c < 99) { inp.value = c + 1; _qvSelectedQty = c + 1; }
  });
  d.querySelector('#qv-qty-input').addEventListener('change', function(e) {
    var v = parseInt(e.target.value);
    if (isNaN(v) || v < 1) v = 1;
    if (v > 99) v = 99;
    e.target.value = v;
    _qvSelectedQty = v;
  });
  d.querySelector('#qv-add-cart').addEventListener('click', function() {
    if (!_qvProduct) return;
    if (!_qvSelectedSize || !_qvSelectedColor) {
      if (window.CartSystem) window.CartSystem.showNotification('Please select size and color', 'error');
      return;
    }
    if (window.CartSystem) {
      window.CartSystem.addToCart(_qvProduct, _qvSelectedQty, _qvSelectedSize, _qvSelectedColor);
      closeQuickView();
    }
  });
  d.querySelector('#qv-wishlist').addEventListener('click', function() {
    if (!_qvProduct) return;
    if (window.WishlistSystem) {
      window.WishlistSystem.toggleWishlist(_qvProduct);
    } else if (window.CartSystem) {
      window.CartSystem.toggleWishlist(_qvProduct);
    }
    updateQvWishlistBtn();
  });

  _qvModalEl = d;
  return d;
}

function openQuickView(product) {
  _qvProduct = product;
  _qvSelectedSize = product.sizes.length > 0 ? product.sizes[0] : '';
  _qvSelectedColor = product.colors.length > 0 ? product.colors[0] : '';
  _qvSelectedQty = 1;

  var m = buildQuickViewModal();
  var bp = getQvBasePath();

  var mainImg = m.querySelector('#qv-main-img');
  mainImg.src = bp + product.image;
  mainImg.alt = product.name;

  var thumbs = m.querySelector('#qv-thumbs');
  thumbs.innerHTML = '';
  product.images.forEach(function(img, idx) {
    var t = document.createElement('img');
    t.src = bp + img;
    t.alt = product.name + ' view ' + (idx + 1);
    if (idx === 0) t.classList.add('active');
    t.addEventListener('click', function() {
      mainImg.src = bp + img;
      thumbs.querySelectorAll('img').forEach(function(i) { i.classList.remove('active'); });
      t.classList.add('active');
    });
    thumbs.appendChild(t);
  });

  m.querySelector('#qv-title').textContent = product.name;

  m.querySelector('#qv-price').innerHTML = product.originalPrice
    ? '<span class="original-price">' + window.ProductData.formatPrice(product.originalPrice) + '</span> ' + window.ProductData.formatPrice(product.price)
    : window.ProductData.formatPrice(product.price);

  m.querySelector('#qv-desc').innerHTML = '<p>' + escapeHtml(product.description) + '</p>';

  var badgesEl = m.querySelector('#qv-badges');
  badgesEl.innerHTML = '';
  if (product.isNew) badgesEl.innerHTML += '<span class="badge new">New</span>';
  if (product.isLimited) badgesEl.innerHTML += '<span class="badge limited">Limited</span>';
  if (!product.inStock) badgesEl.innerHTML += '<span class="badge out-of-stock">Out of Stock</span>';

  var sizeWrap = m.querySelector('#qv-sizes');
  sizeWrap.innerHTML = '';
  product.sizes.forEach(function(sz) {
    var btn = document.createElement('button');
    btn.className = 'size-option' + (sz === _qvSelectedSize ? ' selected' : '');
    btn.textContent = sz;
    btn.addEventListener('click', function() {
      _qvSelectedSize = sz;
      sizeWrap.querySelectorAll('.size-option').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      m.querySelector('#qv-size-label').textContent = sz;
    });
    sizeWrap.appendChild(btn);
  });
  m.querySelector('#qv-size-label').textContent = _qvSelectedSize;

  var colorWrap = m.querySelector('#qv-colors');
  colorWrap.innerHTML = '';
  product.colors.forEach(function(col) {
    var btn = document.createElement('button');
    btn.className = 'color-option' + (col === _qvSelectedColor ? ' selected' : '');
    btn.style.backgroundColor = col.toLowerCase();
    btn.title = col;
    btn.setAttribute('aria-label', col);
    btn.addEventListener('click', function() {
      _qvSelectedColor = col;
      colorWrap.querySelectorAll('.color-option').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      m.querySelector('#qv-color-label').textContent = col;
    });
    colorWrap.appendChild(btn);
  });
  m.querySelector('#qv-color-label').textContent = _qvSelectedColor;

  m.querySelector('#qv-qty-input').value = 1;
  m.querySelector('#qv-add-cart').disabled = !product.inStock;
  m.querySelector('#qv-add-cart').textContent = product.inStock ? 'Add to Cart' : 'Out of Stock';

  updateQvWishlistBtn();

  var fullLink = m.querySelector('#qv-full-link');
  fullLink.href = bp + 'pages/product.html?id=' + product.id;

  m.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function updateQvWishlistBtn() {
  if (!_qvModalEl || !_qvProduct) return;
  var btn = _qvModalEl.querySelector('#qv-wishlist');
  var inWishlist = window.WishlistSystem
    ? window.WishlistSystem.isInWishlist(_qvProduct.id)
    : window.CartSystem.isInWishlist(_qvProduct.id);
  btn.classList.toggle('active', inWishlist);
}

function closeQuickView() {
  if (!_qvModalEl) return;
  _qvModalEl.classList.remove('active');
  document.body.style.overflow = '';
  _qvProduct = null;
}

/* ============================================================
   9. GLOBAL EXPORTS
   ============================================================ */
window.ProductData = window.ProductData || new ProductData();
window.ShopSystem = {
  createProductCard:     createProductCard,
  renderShopProducts:    renderShopProducts,
  renderFeaturedProducts: renderFeaturedProducts,
  applyFilters:          applyFilters,
  proceedToCheckout:     proceedToCheckout,
  escapeHtml:            escapeHtml,
  formatPrice:           function(p) { return window.ProductData.formatPrice(p); },
  openQuickView:         openQuickView,
  closeQuickView:        closeQuickView
};
