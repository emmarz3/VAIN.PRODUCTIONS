(function() {
  'use strict';

  function escapeHtml(str) {
    return String(str ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function formatPrice(price) {
    return '₦' + Number(price || 0).toLocaleString();
    
  }

  function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const priceDisplay = product.originalPrice
      ? `<span class="original-price">${formatPrice(product.originalPrice)}</span> ${formatPrice(product.price)}`
      : formatPrice(product.price);

    const badges = [];
    if (product.isNew) badges.push('<span class="badge new">New</span>');
    if (product.isLimited) badges.push('<span class="badge limited">Limited</span>');
    if (!product.inStock) badges.push('<span class="badge out-of-stock">Out of Stock</span>');
    if (product.originalPrice) badges.push(`<span class="badge sale">${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% Off</span>`);

    card.innerHTML = `
      <div class="product-image">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
        ${badges.join('')}
        <div class="product-overlay">
          <button class="quick-view-btn" data-product-id="${product.id}" aria-label="Quick view">Quick View</button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <div class="product-price">${priceDisplay}</div>
        <div class="product-actions">
          <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}" ${!product.inStock ? 'disabled' : ''}>
            ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
          <button class="icon-btn wishlist-btn" data-wishlist-btn data-product-id="${product.id}" aria-label="Add to Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
        </div>
      </div>`;

    card.querySelector('.add-to-cart-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      if (product.inStock) window.CartSystem.addToCart(product);
    });

    card.querySelector('.wishlist-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      if (window.WishlistSystem) {
        window.WishlistSystem.toggleWishlist(product);
      } else if (window.CartSystem) {
        window.CartSystem.toggleWishlist(product);
        window.CartSystem.updateWishlistButtons();
      }
    });

    card.querySelector('.quick-view-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      if (window.ShopSystem && window.ShopSystem.openQuickView) {
        window.ShopSystem.openQuickView(product);
      } else {
        window.location.href = 'pages/product.html?id=' + product.id;
      }
    });

    card.addEventListener('click', function() {
      window.location.href = 'pages/product.html?id=' + product.id;
    });

    return card;
  }

  function renderFeaturedProducts() {
    const grid = document.getElementById('featured-grid');
    if (!grid || !window.ProductData) return;
    const products = window.ProductData.getFeaturedProducts(4);
    grid.innerHTML = '';
    products.forEach(function(p) { grid.appendChild(createProductCard(p)); });
    if (window.CartSystem) window.CartSystem.updateWishlistButtons();
  }

  function renderShopProducts() {
    const grid = document.getElementById('product-grid');
    const empty = document.getElementById('shop-empty');
    const countEl = document.getElementById('results-count');
    if (!grid || !window.ProductData) return;

    var products = window.ProductData.getAllProducts();
    var sortBy = 'featured';

    function applyFilters() {
      var filtered = products.slice();

      var catInputs = document.querySelectorAll('#category-filters .filter-checkbox input:checked');
      var cats = [];
      catInputs.forEach(function(inp) { cats.push(inp.value); });
      if (cats.length > 0) {
        filtered = filtered.filter(function(p) { return cats.indexOf(p.category) !== -1; });
      }

      var collInputs = document.querySelectorAll('#collection-filters .filter-checkbox input:checked');
      var colls = [];
      collInputs.forEach(function(inp) { colls.push(inp.value); });
      if (colls.length > 0) {
        filtered = filtered.filter(function(p) { return colls.indexOf(p.collection) !== -1; });
      }

      var filterNew = document.getElementById('filter-new');
      if (filterNew && filterNew.checked) filtered = filtered.filter(function(p) { return p.isNew; });

      var filterLimited = document.getElementById('filter-limited');
      if (filterLimited && filterLimited.checked) filtered = filtered.filter(function(p) { return p.isLimited; });

      var filterSale = document.getElementById('filter-sale');
      if (filterSale && filterSale.checked) filtered = filtered.filter(function(p) { return p.originalPrice; });

      var sortSelect = document.getElementById('sort-select');
      if (sortSelect) sortBy = sortSelect.value;

      switch (sortBy) {
        case 'newest': filtered.sort(function(a, b) { return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0); }); break;
        case 'price-low': filtered.sort(function(a, b) { return a.price - b.price; }); break;
        case 'price-high': filtered.sort(function(a, b) { return b.price - a.price; }); break;
        case 'name': filtered.sort(function(a, b) { return a.name.localeCompare(b.name); }); break;
        default: break;
      }

      grid.innerHTML = '';
      if (filtered.length === 0) {
        grid.style.display = 'none';
        if (empty) empty.style.display = 'block';
      } else {
        grid.style.display = 'grid';
        if (empty) empty.style.display = 'none';
        filtered.forEach(function(p) { grid.appendChild(createProductCard(p)); });
      }
      if (countEl) countEl.textContent = filtered.length + ' product' + (filtered.length !== 1 ? 's' : '');
      if (window.CartSystem) window.CartSystem.updateWishlistButtons();
    }

    var categories = window.ProductData.getCategories();
    var catContainer = document.getElementById('category-filters');
    if (catContainer) {
      catContainer.innerHTML = '';
      categories.forEach(function(cat) {
        var label = document.createElement('label');
        label.className = 'filter-checkbox';
        label.innerHTML = '<input type="checkbox" value="' + cat.id + '"><span>' + escapeHtml(cat.name) + ' (' + cat.count + ')</span>';
        catContainer.appendChild(label);
      });
    }

    var collections = window.ProductData.getCollections();
    var collContainer = document.getElementById('collection-filters');
    if (collContainer) {
      collContainer.innerHTML = '';
      collections.forEach(function(coll) {
        var label = document.createElement('label');
        label.className = 'filter-checkbox';
        label.innerHTML = '<input type="checkbox" value="' + coll.id + '"><span>' + escapeHtml(coll.name) + '</span>';
        collContainer.appendChild(label);
      });
    }

    document.querySelectorAll('.filter-checkbox input').forEach(function(inp) {
      inp.addEventListener('change', applyFilters);
    });

    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);

    var clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        document.querySelectorAll('.filter-checkbox input').forEach(function(inp) { inp.checked = false; });
        if (sortSelect) sortSelect.value = 'featured';
        applyFilters();
      });
    }

    applyFilters();
  }

  function setupNewsletter() {
    var form = document.getElementById('newsletter-form');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        if (input && input.value) {
          if (window.CartSystem) {
            window.CartSystem.showNotification('Thanks for subscribing! Stay tuned for exclusive drops.', 'success');
          }
          input.value = '';
        }
      });
    }
    document.querySelectorAll('.newsletter-form').forEach(function(f) {
      f.addEventListener('submit', function(e) {
        e.preventDefault();
        var input = f.querySelector('input[type="email"]');
        if (input && input.value) {
          if (window.CartSystem) {
            window.CartSystem.showNotification('Thanks for subscribing!', 'success');
          }
          input.value = '';
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    renderFeaturedProducts();
    renderShopProducts();
    setupNewsletter();
  });

  window.App = {
    createProductCard: createProductCard,
    renderFeaturedProducts: renderFeaturedProducts,
    renderShopProducts: renderShopProducts
  };
})();
