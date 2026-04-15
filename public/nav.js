/* Atlas Ally — nav.js (clean rewrite)
   Approach: dynamically-created overlay div, all content inline-styled,
   no dependency on existing .panel CSS classes whatsoever. */
(function () {
  'use strict';

  /* ── Design tokens ── */
  var T = {
    teal:   '#0E7490',
    bg:     '#F8FAFB',
    card:   '#ffffff',
    border: '#E5EAEF',
    text:   '#1A2332',
    muted:  '#6B7C93',
    red:    '#EF4444'
  };

  var tabNames = ['map', 'feed', 'pack', 'countries', 'account'];
  var mapWrap  = null;
  var navPanel = null;
  var overlay  = null;   // the single overlay div we create

  /* ── Overlay helpers ── */
  function showOverlay(html) {
    if (!overlay) return;
    overlay.innerHTML = html;
    overlay.style.display = 'block';
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.style.display = 'none';
    overlay.innerHTML = '';
  }

  /* ── Map helpers ── */
  function showMap() {
    if (mapWrap) {
      mapWrap.style.visibility = 'visible';
      mapWrap.style.pointerEvents = 'auto';
    }
    if (window.map && typeof window.map.invalidateSize === 'function') {
      setTimeout(function () { window.map.invalidateSize(); }, 150);
    }
  }
  function hideMap() {
    if (mapWrap) {
      mapWrap.style.visibility = 'hidden';
      mapWrap.style.pointerEvents = 'none';
    }
  }

  /* ── Tab highlighting ── */
  function activateTab(name) {
    document.querySelectorAll('.main-tab').forEach(function (btn, i) {
      var on = tabNames[i] === name;
      btn.classList.toggle('active', on);
      var icon  = btn.querySelector('.tbi-icon');
      var label = btn.querySelector('.tbi-label');
      if (icon)  icon.classList.toggle('on', on);
      if (label) label.classList.toggle('on', on);
    });
  }

  /* ── Panel header builder ── */
  function hdr(title) {
    return '<div style="position:sticky;top:0;z-index:2;background:' + T.teal + ';' +
      'display:flex;align-items:center;justify-content:space-between;' +
      'padding:0 16px;min-height:54px;flex-shrink:0;">' +
      '<span style="font-size:16px;font-weight:700;color:#fff;font-family:sans-serif;">' + title + '</span>' +
      '<button onclick="window.switchTab(\'map\')" ' +
        'style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);' +
        'color:#fff;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:15px;' +
        'font-family:sans-serif;line-height:1;">✕</button>' +
      '</div>';
  }

  /* ══════════════════════════════════════════════
     FEED PANEL
  ══════════════════════════════════════════════ */
  function buildFeed() {
    return hdr('📡 Live Feed') +
      '<div id="aa-news" style="background:' + T.bg + ';min-height:200px;">' +
        '<div style="padding:24px;text-align:center;color:' + T.muted + ';font-size:13px;">Loading…</div>' +
      '</div>';
  }

  function loadNews(country) {
    var nb = document.getElementById('aa-news');
    if (!nb) return;

    if (!country) {
      nb.innerHTML =
        '<div style="padding:48px 24px;text-align:center;">' +
          '<div style="font-size:52px;margin-bottom:14px;">🌍</div>' +
          '<div style="font-size:16px;font-weight:700;color:' + T.text + ';margin-bottom:8px;">Select a Country</div>' +
          '<div style="font-size:13px;color:' + T.muted + ';line-height:1.6;">Tap the flag button in the header to<br>choose a country and see live news.</div>' +
        '</div>';
      return;
    }

    nb.innerHTML = '<div style="padding:24px;text-align:center;color:' + T.muted + ';font-size:13px;">⏳ Loading news for ' + country + '…</div>';

    fetch('/api/news?country_code=' + encodeURIComponent(country))
      .then(function (r) {
        if (!r.ok) throw new Error('Server error ' + r.status);
        return r.json();
      })
      .then(function (articles) {
        var nb2 = document.getElementById('aa-news');
        if (!nb2) return;

        if (!articles || !articles.length) {
          nb2.innerHTML =
            '<div style="padding:48px 24px;text-align:center;">' +
              '<div style="font-size:40px;margin-bottom:12px;">📡</div>' +
              '<div style="font-size:14px;color:' + T.muted + ';">No news found for ' + country + '.</div>' +
            '</div>';
          return;
        }

        nb2.innerHTML = articles.map(function (a) {
          var title = (a.title || 'Untitled').slice(0, 120);
          var src   = (a.source_name || '').replace(/-/g, ' ');
          var date  = '';
          try { date = new Date(a.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' }); } catch (e) {}

          return (
            '<a href="' + (a.url || '#') + '" target="_blank" rel="noopener" ' +
            'style="display:flex;gap:12px;padding:14px 16px;border-bottom:1px solid ' + T.border + ';' +
              'background:#fff;text-decoration:none;align-items:flex-start;">' +
              '<div style="width:44px;height:44px;border-radius:10px;background:#E0F2F7;flex-shrink:0;' +
                'display:flex;align-items:center;justify-content:center;font-size:22px;">🗞️</div>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:13px;font-weight:600;color:' + T.text + ';line-height:1.45;margin-bottom:5px;">' + title + '</div>' +
                '<div style="font-size:11px;color:' + T.muted + ';text-transform:capitalize;">' + src + (date ? ' · ' + date : '') + '</div>' +
              '</div>' +
            '</a>'
          );
        }).join('');
      })
      .catch(function (err) {
        var nb2 = document.getElementById('aa-news');
        if (!nb2) return;
        nb2.innerHTML =
          '<div style="padding:32px 24px;text-align:center;">' +
            '<div style="font-size:36px;margin-bottom:10px;">⚠️</div>' +
            '<div style="font-size:13px;color:' + T.red + ';margin-bottom:14px;">' + err.message + '</div>' +
            '<button onclick="window._aaReloadNews && window._aaReloadNews()" ' +
              'style="padding:9px 22px;background:' + T.teal + ';color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;">Retry</button>' +
          '</div>';
      });
  }

  /* ══════════════════════════════════════════════
     PACK PANEL
  ══════════════════════════════════════════════ */
  function buildPack() {
    var items = [
      '🛂 Passport, visas, travel documents',
      '🔌 Phone charger, power adapter, backup battery',
      '📱 Local SIM card or international data plan',
      '💊 First aid kit, medications, prescriptions',
      '💵 Emergency cash in local currency',
      '📋 Copies of all important documents',
      '🏥 Travel insurance documents',
      '🌊 Water purification (for high-risk areas)',
      '🔦 Flashlight or headlamp',
      '🗺️ Offline maps downloaded'
    ];
    return hdr('🎒 Pack Assistant') +
      '<div style="padding:20px;background:' + T.bg + ';">' +
        '<div style="background:#fff;border-radius:12px;border:1px solid ' + T.border + ';padding:14px;margin-bottom:16px;">' +
          '<div style="font-size:13px;color:' + T.muted + ';line-height:1.6;">Essential items for safe travel. ' +
            'AI-powered custom packing lists coming soon.</div>' +
        '</div>' +
        items.map(function (item) {
          return '<div style="display:flex;align-items:center;gap:12px;padding:13px 16px;' +
            'background:#fff;border:1px solid ' + T.border + ';border-radius:10px;margin-bottom:8px;">' +
            '<div style="width:22px;height:22px;border-radius:50%;background:' + T.teal + ';flex-shrink:0;' +
              'display:flex;align-items:center;justify-content:center;">' +
              '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5">' +
                '<polyline points="20 6 9 17 4 12"/></svg>' +
            '</div>' +
            '<span style="font-size:13px;color:' + T.text + ';">' + item + '</span>' +
          '</div>';
        }).join('') +
      '</div>';
  }

  /* ══════════════════════════════════════════════
     WORLD (COUNTRIES) PANEL
  ══════════════════════════════════════════════ */
  function buildWorld() {
    return hdr('🌍 World Browser') +
      '<div style="padding:12px 16px;background:#fff;border-bottom:1px solid ' + T.border + ';position:sticky;top:54px;z-index:1;">' +
        '<input id="aa-country-search" placeholder="Search countries…" oninput="window._aaFilterCountries(this.value)" ' +
          'style="width:100%;border:1.5px solid ' + T.border + ';border-radius:8px;padding:9px 12px;' +
          'font-size:13px;color:' + T.text + ';background:' + T.bg + ';outline:none;box-sizing:border-box;">' +
      '</div>' +
      '<div id="aa-countries" style="background:' + T.bg + ';padding:0 16px 16px;">' +
        '<div style="padding:20px;text-align:center;color:' + T.muted + ';">Loading countries…</div>' +
      '</div>';
  }

  function renderCountryList(list) {
    var el = document.getElementById('aa-countries');
    if (!el) return;
    if (!list || !list.length) {
      el.innerHTML = '<div style="padding:20px;text-align:center;color:' + T.muted + ';">No countries found</div>';
      return;
    }
    el.innerHTML = list.slice(0, 150).map(function (c) {
      var centerStr = (c.center && c.center.length === 2)
        ? '{lat:' + c.center[0] + ',lng:' + c.center[1] + '}'
        : 'null';
      return (
        '<div onclick="(function(){\'' +
          'window.setActiveCountry && window.setActiveCountry(\'' + c.code + '\',' + centerStr + ');' +
          'window.hidePicker && window.hidePicker();' +
          'window.switchTab(\'map\');' +
        '})()" ' +
        'style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid ' + T.border + ';cursor:pointer;">' +
          '<div style="font-size:28px;width:44px;text-align:center;flex-shrink:0;">' + (c.flag || '🌍') + '</div>' +
          '<div style="flex:1;">' +
            '<div style="font-size:14px;font-weight:600;color:' + T.text + ';">' + c.name + '</div>' +
            '<div style="font-size:11px;color:' + T.muted + ';margin-top:2px;">' + (c.advisoryLabel || '') + (c.capital ? ' · ' + c.capital : '') + '</div>' +
          '</div>' +
          '<div style="font-size:18px;color:' + T.muted + ';">›</div>' +
        '</div>'
      );
    }).join('');
  }

  function loadWorldCountries() {
    if (window.allCountries && window.allCountries.length) {
      renderCountryList(window.allCountries);
      return;
    }
    fetch('/api/countries')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        window.allCountries = Array.isArray(data) ? data : [];
        renderCountryList(window.allCountries);
      })
      .catch(function () {
        var el = document.getElementById('aa-countries');
        if (el) el.innerHTML = '<div style="padding:20px;text-align:center;color:' + T.red + ';">Failed to load countries</div>';
      });
  }

  /* ══════════════════════════════════════════════
     ACCOUNT PANEL
  ══════════════════════════════════════════════ */
  function buildAccount() {
    function row(icon, title, sub) {
      return '<div style="display:flex;align-items:center;gap:12px;padding:13px;' +
        'background:#fff;border:1px solid ' + T.border + ';border-radius:10px;margin-bottom:8px;cursor:pointer;">' +
        '<div style="width:38px;height:38px;border-radius:10px;background:#E0F2F7;flex-shrink:0;' +
          'display:flex;align-items:center;justify-content:center;font-size:18px;">' + icon + '</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:14px;font-weight:600;color:' + T.text + ';">' + title + '</div>' +
          '<div style="font-size:12px;color:' + T.muted + ';margin-top:2px;">' + sub + '</div>' +
        '</div>' +
        '<div style="color:' + T.muted + ';font-size:16px;">›</div></div>';
    }
    return hdr('👤 My Account') +
      '<div style="background:' + T.bg + ';">' +
        '<div style="background:linear-gradient(135deg,' + T.teal + ',#0A5F75);padding:20px;color:#fff;">' +
          '<div style="font-size:18px;font-weight:700;margin-bottom:4px;">Welcome to Atlas Ally</div>' +
          '<div style="font-size:13px;opacity:0.8;margin-bottom:14px;">Global travel safety intelligence</div>' +
          '<div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:12px;">' +
            '<div style="font-size:10px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Free Trial</div>' +
            '<div style="font-size:15px;font-weight:700;">7-day full access</div>' +
          '</div>' +
        '</div>' +
        '<div style="padding:16px;">' +
          row('🔔', 'Notifications', 'Manage safety alerts and push notifications') +
          row('📍', 'Saved Locations', 'Manage your monitored countries') +
          row('💳', 'Subscription', 'Upgrade to Premium — $3/mo') +
          row('🔒', 'Privacy', 'Control your data and privacy settings') +
          row('ℹ️', 'About', 'Atlas Ally v1.0 · atlas-ally.com') +
        '</div>' +
      '</div>';
  }

  /* ══════════════════════════════════════════════
     MAIN SWITCHER
  ══════════════════════════════════════════════ */
  function switchTab(name) {
    activateTab(name);

    if (name === 'map') {
      hideOverlay();
      showMap();
      return;
    }

    hideMap();

    var html = '';
    if      (name === 'feed')      html = buildFeed();
    else if (name === 'pack')      html = buildPack();
    else if (name === 'countries') html = buildWorld();
    else if (name === 'account')   html = buildAccount();

    showOverlay(html);

    if (name === 'feed') {
      window._aaReloadNews = function () { loadNews(window.activeCountry); };
      loadNews(window.activeCountry);
    }
    if (name === 'countries') {
      window._aaFilterCountries = function (q) {
        var list = (window.allCountries || []).filter(function (c) {
          return !q || c.name.toLowerCase().indexOf(q.toLowerCase()) >= 0 ||
            (c.capital || '').toLowerCase().indexOf(q.toLowerCase()) >= 0;
        });
        renderCountryList(list);
      };
      loadWorldCountries();
    }
  }

  /* ══════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════ */
  function init() {
    mapWrap  = document.getElementById('map-wrap');
    navPanel = document.getElementById('nav-panel');

    /* Create the overlay — appended to body so it's always on top */
    overlay = document.createElement('div');
    overlay.id = 'aa-overlay';
    overlay.style.cssText =
      'display:none;' +
      'position:fixed;top:0;left:0;right:0;bottom:62px;' +   /* bottom:62px = tab bar height */
      'z-index:500000;' +
      'background:' + T.bg + ';' +
      'overflow-y:auto;' +
      '-webkit-overflow-scrolling:touch;';
    document.body.appendChild(overlay);

    /* Hamburger — remove onclick, use addEventListener */
    var hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.removeAttribute('onclick');
      hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (navPanel) navPanel.classList.toggle('open');
      });
    }

    /* Tab buttons */
    document.querySelectorAll('.main-tab').forEach(function (btn, i) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        switchTab(tabNames[i]);
      });
    });

    /* Close nav on outside click */
    document.addEventListener('click', function (e) {
      if (!navPanel || !navPanel.classList.contains('open')) return;
      if (!navPanel.contains(e.target) && e.target.id !== 'hamburger') {
        navPanel.classList.remove('open');
      }
    });

    /* Globals */
    window.switchTab      = switchTab;
    window.openPanel      = function (id) { switchTab(id.replace('-panel', '')); };
    window.closePanel     = function ()   { switchTab('map'); };
    window.closeAllPanels = function ()   { switchTab('map'); };
    window.toggleNav      = function ()   { if (navPanel) navPanel.classList.toggle('open'); };
    window.closeNav       = function ()   { if (navPanel) navPanel.classList.remove('open'); };
    window.showPicker     = function () {
      var pk = document.getElementById('cpicker');
      if (pk) pk.classList.add('open');
      if (navPanel) navPanel.classList.remove('open');
      if (typeof window.loadCountries === 'function') window.loadCountries();
    };
    window.hidePicker     = function () {
      var pk = document.getElementById('cpicker');
      if (pk) pk.classList.remove('open');
    };
    window.showCountryPicker = window.showPicker;
    window.closeSheet     = function (id) { var s = document.getElementById(id); if (s) s.classList.remove('open'); };
    window.openNavSection = function (pid) { switchTab(pid.replace('-panel', '')); if (navPanel) navPanel.classList.remove('open'); };

    /* Intercept setActiveCountry to reload feed if it's open */
    var _origSet = window.setActiveCountry;
    window.setActiveCountry = function (code, pos) {
      var r = _origSet ? _origSet(code, pos) : null;
      window.activeCountry = code;
      if (overlay && overlay.style.display !== 'none' && document.getElementById('aa-news')) {
        loadNews(code);
      }
      return r;
    };

    window._debugAtlas = function () {
      console.log('switchTab:', typeof window.switchTab);
      console.log('activeCountry:', window.activeCountry);
      console.log('overlay display:', overlay ? overlay.style.display : 'N/A');
      console.log('map visibility:', mapWrap ? mapWrap.style.visibility : 'N/A');
    };

    switchTab('map');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
