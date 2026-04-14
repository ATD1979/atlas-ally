(function () {

  var PANEL_IDS = ['feed-panel', 'pack-panel', 'countries-panel', 'account-panel'];

  function showPanel(id) {
    PANEL_IDS.forEach(function (pid) {
      var el = document.getElementById(pid);
      if (!el) return;
      el.classList.remove('open');
      el.style.setProperty('display', 'none', 'important');
    });
    var p = document.getElementById(id);
    if (!p) { console.warn('[Atlas] Panel not found:', id); return; }
    p.classList.add('open');
    p.style.setProperty('display',        'flex',    'important');
    p.style.setProperty('flex-direction', 'column',  'important');
    p.style.setProperty('position',       'fixed',   'important');
    p.style.setProperty('top',            '56px',    'important');
    p.style.setProperty('left',           '0',       'important');
    p.style.setProperty('right',          '0',       'important');
    p.style.setProperty('bottom',         '62px',    'important');
    p.style.setProperty('z-index',        '5000',    'important');
    p.style.setProperty('background',     '#F8FAFB', 'important');
    p.style.setProperty('overflow',       'hidden',  'important');
    p.style.setProperty('pointer-events', 'all',     'important');
    p.style.setProperty('visibility',     'visible', 'important');
    p.style.setProperty('transform',      'none',    'important');
    p.style.setProperty('opacity',        '1',       'important');
  }

  function hideAllPanels() {
    PANEL_IDS.forEach(function (pid) {
      var el = document.getElementById(pid);
      if (!el) return;
      el.classList.remove('open');
      el.style.setProperty('display', 'none', 'important');
    });
  }

  /* ── News loader — standalone, no app.js dependency ── */
  function loadFeedNews(country) {
    var newsBody = document.getElementById('feed-news-body');
    if (!newsBody) return;

    if (!country) {
      newsBody.innerHTML =
        '<div style="padding:40px 20px;text-align:center;">' +
        '<div style="font-size:48px;margin-bottom:12px;">🌍</div>' +
        '<div style="font-size:15px;font-weight:600;color:#1A2332;margin-bottom:6px;">Select a Country</div>' +
        '<div style="font-size:13px;color:#6B7C93;">Tap the flag button in the header to choose a country and see live news.</div>' +
        '</div>';
      return;
    }

    newsBody.innerHTML =
      '<div style="padding:24px;text-align:center;color:#6B7C93;font-size:13px;">' +
      '⏳ Loading news for ' + country + '…</div>';

    fetch('/api/news?country_code=' + encodeURIComponent(country))
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (articles) {
        var nb = document.getElementById('feed-news-body');
        if (!nb) return;
        if (!articles || !articles.length) {
          nb.innerHTML =
            '<div style="padding:40px 20px;text-align:center;">' +
            '<div style="font-size:40px;margin-bottom:10px;">📡</div>' +
            '<div style="font-size:14px;color:#6B7C93;">No news found for ' + country + '.</div>' +
            '</div>';
          return;
        }
        nb.innerHTML = articles.map(function (a) {
          var title = (a.title || 'Untitled').slice(0, 110);
          var src   = (a.source_name || 'News').replace(/-/g, ' ');
          var date  = '';
          try { date = new Date(a.published_at).toLocaleDateString([], {month:'short', day:'numeric'}); } catch(e){}
          return (
            '<a href="' + (a.url || '#') + '" target="_blank" rel="noopener" ' +
            'style="display:flex;gap:12px;padding:13px 16px;border-bottom:1px solid #E5EAEF;' +
            'background:#fff;text-decoration:none;align-items:flex-start;-webkit-tap-highlight-color:transparent;">' +
            '<div style="width:42px;height:42px;border-radius:10px;background:#E0F2F7;' +
            'display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🗞️</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:13px;font-weight:600;color:#1A2332;line-height:1.4;margin-bottom:5px;">' + title + '</div>' +
            '<div style="font-size:11px;color:#6B7C93;text-transform:capitalize;">' + src + (date ? ' · ' + date : '') + '</div>' +
            '</div></a>'
          );
        }).join('');
      })
      .catch(function (err) {
        var nb = document.getElementById('feed-news-body');
        if (nb) nb.innerHTML =
          '<div style="padding:24px;text-align:center;">' +
          '<div style="font-size:13px;color:#EF4444;margin-bottom:12px;">⚠️ ' + err.message + '</div>' +
          '<button onclick="window._reloadFeed && window._reloadFeed()" ' +
          'style="padding:8px 20px;background:#0E7490;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;">Retry</button>' +
          '</div>';
      });
  }

  var tabNames = ['map', 'feed', 'pack', 'countries', 'account'];

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

  var mapWrap = null;

  function showMap() {
    if (mapWrap) {
      mapWrap.style.setProperty('visibility',     'visible', 'important');
      mapWrap.style.setProperty('pointer-events', 'auto',    'important');
    }
    if (window.map && typeof window.map.invalidateSize === 'function') {
      setTimeout(function () { window.map.invalidateSize(); }, 200);
    }
  }

  function hideMap() {
    if (mapWrap) {
      mapWrap.style.setProperty('visibility',     'hidden', 'important');
      mapWrap.style.setProperty('pointer-events', 'none',   'important');
    }
  }

  function switchTab(name) {
    activateTab(name);

    if (name === 'map') {
      hideAllPanels();
      showMap();
      return;
    }

    hideMap();
    var pm = { feed:'feed-panel', pack:'pack-panel', countries:'countries-panel', account:'account-panel' };
    if (pm[name]) showPanel(pm[name]);

    if (name === 'feed') {
      // Get country — try all sources
      var country = window.activeCountry ||
        (typeof currentCountry !== 'undefined' ? currentCountry : null);
      loadFeedNews(country);
      // Also expose reload for the retry button
      window._reloadFeed = function () { loadFeedNews(window.activeCountry); };
    }

    if (name === 'countries' && typeof window.loadCountries === 'function') {
      setTimeout(window.loadCountries, 150);
    }
  }

  function init() {
    mapWrap = document.getElementById('map-wrap');

    var hamburger = document.getElementById('hamburger');
    var navPanel  = document.getElementById('nav-panel');

    if (hamburger) {
      hamburger.removeAttribute('onclick');
      hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (navPanel) navPanel.classList.toggle('open');
      });
    }

    // Wire tab buttons via addEventListener (backup to onclick attributes in HTML)
    var tabButtons = document.querySelectorAll('.main-tab');
    var tabNames2  = ['map', 'feed', 'pack', 'countries', 'account'];
    tabButtons.forEach(function (btn, i) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        switchTab(tabNames2[i]);
      });
    });

    document.addEventListener('click', function (e) {
      if (!navPanel || !navPanel.classList.contains('open')) return;
      if (!navPanel.contains(e.target) && e.target !== hamburger) {
        navPanel.classList.remove('open');
      }
    });

    window.switchTab         = switchTab;
    window.openPanel         = showPanel;
    window.closePanel        = function (id) { var p=document.getElementById(id); if(p){p.classList.remove('open');p.style.setProperty('display','none','important');} };
    window.closeAllPanels    = hideAllPanels;
    window.toggleNav         = function () { if (navPanel) navPanel.classList.toggle('open'); };
    window.closeNav          = function () { if (navPanel) navPanel.classList.remove('open'); };
    window.showPicker        = function () { var pk=document.getElementById('cpicker'); if(pk) pk.classList.add('open'); if(navPanel) navPanel.classList.remove('open'); if(typeof window.loadCountries==='function') window.loadCountries(); };
    window.hidePicker        = function () { var pk=document.getElementById('cpicker'); if(pk) pk.classList.remove('open'); };
    window.showCountryPicker = window.showPicker;
    window.closeSheet        = function (id) { var s=document.getElementById(id); if(s) s.classList.remove('open'); };
    window.openNavSection    = function (pid) { switchTab(pid.replace('-panel','')); if(navPanel) navPanel.classList.remove('open'); };

    // When a country is selected elsewhere, reload feed if it's open
    var _origSetActive = window.setActiveCountry;
    window.setActiveCountry = function (code, pos) {
      var result = _origSetActive ? _origSetActive(code, pos) : null;
      window.activeCountry = code;
      var fp = document.getElementById('feed-panel');
      if (fp && fp.classList.contains('open')) loadFeedNews(code);
      return result;
    };

    window._debugNav = function () {
      console.log('=== Atlas Debug ===');
      console.log('activeCountry:', window.activeCountry);
      console.log('switchTab:', typeof window.switchTab);
      PANEL_IDS.forEach(function (id) {
        var p = document.getElementById(id);
        if (!p) { console.log(id, 'NOT FOUND'); return; }
        var cs = getComputedStyle(p);
        console.log(id, '| display:', cs.display, '| visibility:', cs.visibility, '| class:', p.className);
      });
    };

    switchTab('map');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
