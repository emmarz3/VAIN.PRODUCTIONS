(function() {
  'use strict';

  function escapeHtml(str) {
    return String(str ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function formatPrice(price) {
    return '₦' + Number(price || 0).toLocaleString();
  }

  function getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
  }

  function setupMobileMenu() {
    var toggle = document.getElementById('mobile-menu-toggle');
    var dropdown = document.getElementById('hamburger-dropdown');
    if (!toggle || !dropdown) return;

    toggle.addEventListener('click', function() {
      dropdown.classList.toggle('active');
      toggle.classList.toggle('active');
    });

    dropdown.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        dropdown.classList.remove('active');
        toggle.classList.remove('active');
      });
    });

    document.addEventListener('click', function(e) {
      if (!toggle.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
        toggle.classList.remove('active');
      }
    });
  }

  function setupSearch() {
    var searchBtn = document.getElementById('search-btn');
    var searchModal = document.getElementById('search-modal');
    if (!searchBtn || !searchModal) return;

    var searchInput = document.getElementById('search-input');
    var searchResults = document.getElementById('search-results');
    var searchClear = document.getElementById('search-clear');
    var searchClose = document.getElementById('search-modal-close');
    var searchOverlay = searchModal.querySelector('.search-modal-overlay');

    function openSearch() {
      searchModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (searchInput) searchInput.focus();
    }

    function closeSearch() {
      searchModal.classList.remove('active');
      document.body.style.overflow = '';
    }

    searchBtn.addEventListener('click', openSearch);
    if (searchClose) searchClose.addEventListener('click', closeSearch);
    if (searchOverlay) searchOverlay.addEventListener('click', closeSearch);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && searchModal.classList.contains('active')) closeSearch();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchModal.classList.contains('active')) closeSearch(); else openSearch();
      }
    });

    if (searchClear) {
      searchClear.addEventListener('click', function() {
        if (searchInput) { searchInput.value = ''; searchInput.focus(); }
        if (searchResults) searchResults.innerHTML = '<div class="search-suggestions"><p class="search-hint">Start typing to search for products...</p></div>';
      });
    }

    var searchTimeout = null;
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        var query = searchInput.value.trim();
        if (!query) {
          if (searchResults) searchResults.innerHTML = '<div class="search-suggestions"><p class="search-hint">Start typing to search for products...</p></div>';
          return;
        }
        searchTimeout = setTimeout(function() {
          if (!window.ProductData) return;
          var results = window.ProductData.searchProducts(query);
          if (results.length === 0) {
            if (searchResults) searchResults.innerHTML = '<div class="search-suggestions"><p class="search-hint">No products found for "' + escapeHtml(query) + '"</p></div>';
            return;
          }
          if (searchResults) {
            var html = '<div class="search-results-grid">';
            var bp = getBasePath();
            var productPath = window.location.pathname.includes('/pages/') ? 'product.html' : 'pages/product.html';
            results.forEach(function(product) {
              html += '<a class="search-result-item" href="' + productPath + '?id=' + product.id + '">' +
                '<div class="search-result-image"><img src="' + bp + escapeHtml(product.image) + '" alt="' + escapeHtml(product.name) + '" loading="lazy"></div>' +
                '<div class="search-result-info">' +
                '<div class="search-result-name">' + escapeHtml(product.name) + '</div>' +
                '<div class="search-result-price">' + formatPrice(product.price) + '</div>' +
                '</div></a>';
            });
            html += '</div>';
            searchResults.innerHTML = html;
          }
        }, 200);
      });
    }
  }

  function setupLoadingScreen() {
    var overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    var progress = overlay.querySelector('.loading-progress');
    if (progress) {
      progress.style.width = '0%';
      setTimeout(function() { progress.style.width = '100%'; }, 50);
    }
    window.addEventListener('load', function() {
      setTimeout(function() {
        overlay.classList.add('fade-out');
        setTimeout(function() { overlay.style.display = 'none'; }, 500);
      }, 800);
    });
    setTimeout(function() {
      overlay.classList.add('fade-out');
      setTimeout(function() { overlay.style.display = 'none'; }, 500);
    }, 4000);
  }

  document.addEventListener('DOMContentLoaded', function() {
    setupMobileMenu();
    setupSearch();
    setupLoadingScreen();
  });
})();
