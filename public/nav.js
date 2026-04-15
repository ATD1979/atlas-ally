/*
  Atlas Ally — nav.js
  Single overlay approach. All panel content is inline-styled HTML
  built by JavaScript — zero dependency on CSS class inheritance.
*/
(function () {
  'use strict';

  var T = {
    teal:      '#0E7490',
    tealDark:  '#0A5F75',
    tealLight: '#E0F2F7',
    bg:        '#F8FAFB',
    card:      '#ffffff',
    border:    '#E5EAEF',
    text:      '#1A2332',
    muted:     '#6B7C93',
    subtle:    '#A8B5C4',
    red:       '#EF4444',
    redLight:  '#FEF2F2',
    green:     '#10B981',
    greenLight:'#ECFDF5',
    gold:      '#F59E0B'
  };

  var tabNames  = ['map','feed','pack','countries','account'];
  var mapWrap   = null;
  var navPanel  = null;
  var overlay   = null;
  var checkinEl = null;  // safe check-in modal

  /* ─────────────────────────────────────────
     OVERLAY
  ───────────────────────────────────────── */
  function showOverlay(html) {
    if (!overlay) return;
    overlay.innerHTML = html;
    overlay.style.display    = 'block';
    overlay.style.pointerEvents = 'all';
    overlay.scrollTop = 0;
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.style.display    = 'none';
    overlay.style.pointerEvents = 'none';
    overlay.innerHTML = '';
  }

  /* ─────────────────────────────────────────
     MAP
  ───────────────────────────────────────── */
  function showMap() {
    if (mapWrap) {
      mapWrap.style.visibility   = 'visible';
      mapWrap.style.pointerEvents = 'auto';
    }
    if (window.map && typeof window.map.invalidateSize === 'function') {
      setTimeout(function () { window.map.invalidateSize(); }, 150);
    }
  }

  function hideMap() {
    if (mapWrap) {
      mapWrap.style.visibility   = 'hidden';
      mapWrap.style.pointerEvents = 'none';
    }
  }

  /* ─────────────────────────────────────────
     TAB BAR HIGHLIGHT
  ───────────────────────────────────────── */
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

  /* ─────────────────────────────────────────
     SHARED PANEL HEADER
  ───────────────────────────────────────── */
  function panelHdr(title) {
    return [
      '<div id="aa-hdr" style="position:sticky;top:0;z-index:10;',
        'background:', T.teal, ';',
        'display:flex;align-items:center;justify-content:space-between;',
        'padding:0 16px;min-height:54px;flex-shrink:0;',
        'box-shadow:0 2px 8px rgba(0,0,0,0.12);">',
        '<span style="font-size:16px;font-weight:700;color:#fff;',
          'font-family:-apple-system,BlinkMacSystemFont,sans-serif;">',
          title,
        '</span>',
        '<button id="aa-close-btn" style="background:rgba(255,255,255,0.2);',
          'border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:6px;',
          'padding:6px 14px;cursor:pointer;font-size:14px;font-weight:600;',
          'font-family:-apple-system,BlinkMacSystemFont,sans-serif;',
          'line-height:1;touch-action:manipulation;">✕</button>',
      '</div>'
    ].join('');
  }

  /* ─────────────────────────────────────────
     EMPTY / LOADING STATES
  ───────────────────────────────────────── */
  function noCountry(msg) {
    return [
      '<div style="padding:56px 24px;text-align:center;">',
        '<div style="font-size:56px;margin-bottom:16px;">🌍</div>',
        '<div style="font-size:16px;font-weight:700;color:', T.text, ';margin-bottom:8px;">',
          'Select a Country</div>',
        '<div style="font-size:13px;color:', T.muted, ';line-height:1.6;">', msg, '</div>',
      '</div>'
    ].join('');
  }

  function loading(msg) {
    return '<div style="padding:32px;text-align:center;color:' + T.muted + ';font-size:13px;">' +
      '⏳ ' + msg + '</div>';
  }

  function empty(icon, title, sub) {
    return '<div style="padding:56px 24px;text-align:center;">' +
      '<div style="font-size:48px;margin-bottom:14px;">' + icon + '</div>' +
      '<div style="font-size:15px;font-weight:700;color:' + T.text + ';margin-bottom:8px;">' + title + '</div>' +
      '<div style="font-size:13px;color:' + T.muted + ';line-height:1.6;">' + sub + '</div>' +
      '</div>';
  }

  /* ═══════════════════════════════════════════
     FEED — NEWS
  ═══════════════════════════════════════════ */
  function loadNews(country) {
    var nb = document.getElementById('aa-feed-body');
    if (!nb) return;
    if (!country) { nb.innerHTML = noCountry('Tap the flag in the header to choose a country and see live news.'); return; }
    nb.innerHTML = loading('Loading news for ' + country + '…');

    fetch('/api/news?country_code=' + encodeURIComponent(country))
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (articles) {
        var nb2 = document.getElementById('aa-feed-body');
        if (!nb2) return;
        if (!articles || !articles.length) {
          nb2.innerHTML = empty('📡', 'No News Found', 'No articles found for ' + country + ' right now.');
          return;
        }
        nb2.innerHTML = articles.map(function (a) {
          var title = (a.title || 'Untitled').slice(0, 120);
          var src   = (a.source_name || '').replace(/-/g, ' ');
          var date  = '';
          try { date = new Date(a.published_at).toLocaleDateString([], {month:'short',day:'numeric'}); } catch(e) {}
          return '<a href="' + (a.url||'#') + '" target="_blank" rel="noopener" ' +
            'style="display:flex;gap:12px;padding:14px 16px;border-bottom:1px solid ' + T.border + ';' +
            'background:#fff;text-decoration:none;align-items:flex-start;' +
            '-webkit-tap-highlight-color:transparent;">' +
            '<div style="width:44px;height:44px;border-radius:10px;background:' + T.tealLight + ';' +
            'flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;">🗞️</div>' +
            '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:13px;font-weight:600;color:' + T.text + ';line-height:1.45;margin-bottom:4px;">' + title + '</div>' +
            '<div style="font-size:11px;color:' + T.muted + ';text-transform:capitalize;">' + src + (date?' · '+date:'') + '</div>' +
            '</div></a>';
        }).join('');
      })
      .catch(function (err) {
        var nb2 = document.getElementById('aa-feed-body');
        if (!nb2) return;
        nb2.innerHTML = '<div style="padding:32px;text-align:center;">' +
          '<div style="font-size:13px;color:' + T.red + ';margin-bottom:14px;">⚠️ ' + err.message + '</div>' +
          '<button id="aa-retry-news" style="padding:9px 22px;background:' + T.teal + ';color:#fff;' +
          'border:none;border-radius:8px;font-size:13px;cursor:pointer;touch-action:manipulation;">Retry</button></div>';
        var btn = document.getElementById('aa-retry-news');
        if (btn) btn.addEventListener('click', function() { loadNews(window.activeCountry); });
      });
  }

  /* ═══════════════════════════════════════════
     FEED — ALERTS
  ═══════════════════════════════════════════ */
  function loadAlerts(country) {
    var nb = document.getElementById('aa-feed-body');
    if (!nb) return;
    if (!country) { nb.innerHTML = noCountry('Choose a country to see active safety alerts.'); return; }
    nb.innerHTML = loading('Loading alerts for ' + country + '…');

    fetch('/api/events?country_code=' + encodeURIComponent(country))
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (events) {
        var nb2 = document.getElementById('aa-feed-body');
        if (!nb2) return;
        if (!events || !events.length) {
          nb2.innerHTML = empty('✅', 'No Active Alerts', 'No incidents reported for ' + country + ' right now.');
          return;
        }
        function sevColor(s)  { return {critical:T.red,high:T.gold,medium:'#3B82F6'}[s] || T.muted; }
        function sevBg(s)     { return {critical:T.redLight,high:'#FEF3C7',medium:'#EFF6FF'}[s] || T.bg; }
        function typeIcon(t)  { return {conflict:'💥',protest:'✊',accident:'🚧',weather:'🌪️',health:'🏥',crime:'🔴'}[t] || '⚠️'; }
        nb2.innerHTML =
          '<div style="padding:8px 16px;background:' + T.bg + ';font-size:11px;font-weight:700;' +
          'color:' + T.muted + ';letter-spacing:0.5px;">' + events.length + ' ALERTS</div>' +
          events.map(function (ev) {
            var sc  = sevColor(ev.severity);
            var sb  = sevBg(ev.severity);
            var ico = typeIcon(ev.type);
            var time = '';
            try { time = new Date(ev.created_at||ev.published_at).toLocaleDateString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); } catch(e) {}
            return '<div style="margin:8px 12px;border-radius:12px;overflow:hidden;border:1px solid ' + T.border + ';">' +
              '<div style="background:' + sb + ';border-left:4px solid ' + sc + ';padding:14px;display:flex;gap:12px;align-items:flex-start;">' +
              '<div style="font-size:26px;flex-shrink:0;line-height:1;">' + ico + '</div>' +
              '<div style="flex:1;">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
              '<span style="font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;' +
              'padding:3px 8px;border-radius:100px;background:' + sc + ';color:#fff;">' + (ev.severity||'INFO').toUpperCase() + '</span>' +
              '<span style="font-size:10px;color:' + T.muted + ';">' + time + '</span></div>' +
              '<div style="font-size:14px;font-weight:700;color:' + T.text + ';margin-bottom:5px;line-height:1.4;">' + (ev.title||'Alert') + '</div>' +
              (ev.description ? '<div style="font-size:12px;color:' + T.muted + ';line-height:1.5;">' + ev.description.slice(0,200) + (ev.description.length>200?'…':'') + '</div>' : '') +
              (ev.location ? '<div style="font-size:11px;color:' + T.teal + ';margin-top:6px;">📍 ' + ev.location + '</div>' : '') +
              '</div></div></div>';
          }).join('');
      })
      .catch(function (err) {
        var nb2 = document.getElementById('aa-feed-body');
        if (nb2) nb2.innerHTML = '<div style="padding:32px;text-align:center;font-size:13px;color:' + T.red + ';">⚠️ ' + err.message + '</div>';
      });
  }

  /* ═══════════════════════════════════════════
     FEED — CRIME
  ═══════════════════════════════════════════ */
  function loadCrime(country) {
    var nb = document.getElementById('aa-feed-body');
    if (!nb) return;
    if (!country) { nb.innerHTML = noCountry('Choose a country to see crime statistics.'); return; }
    var pos = window.activeCountryPos || {lat:0,lng:0};
    nb.innerHTML = loading('Loading crime data…');

    fetch('/api/crime/near?lat=' + pos.lat + '&lng=' + pos.lng + '&radius=300')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var nb2 = document.getElementById('aa-feed-body');
        if (!nb2) return;
        var stats = (data && data.global_stats) || [];
        var tips  = ['🔒 Keep valuables out of sight in public','🚕 Use registered taxis or ride-share apps','🏧 Use ATMs inside banks or well-lit areas','📱 Save local emergency numbers offline','🗺️ Share your itinerary with a trusted contact'];
        var html  = '';
        if (stats.length) {
          html += '<div style="padding:8px 16px;background:' + T.bg + ';font-size:11px;font-weight:700;color:' + T.muted + ';letter-spacing:0.5px;">CRIME STATISTICS · 300KM RADIUS</div>';
          html += stats.map(function (s) {
            var score = parseFloat(s.safety_index) || 0;
            var pct   = Math.min(100, score);
            var color = score>=70 ? T.green : score>=40 ? T.gold : T.red;
            return '<div style="margin:8px 12px;background:#fff;border-radius:12px;border:1px solid ' + T.border + ';padding:16px;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
              '<div style="font-size:14px;font-weight:700;color:' + T.text + ';">' + (s.city||s.country||'Area') + '</div>' +
              '<div style="font-size:14px;font-weight:700;color:' + color + ';">' + score.toFixed(0) + '<span style="font-size:10px;">/100</span></div></div>' +
              '<div style="background:' + T.border + ';border-radius:100px;height:6px;overflow:hidden;">' +
              '<div style="width:' + pct + '%;height:100%;background:' + color + ';border-radius:100px;"></div></div>' +
              '<div style="font-size:10px;color:' + T.muted + ';margin-top:6px;">Safety Index</div></div>';
          }).join('');
        } else {
          html += empty('📊','No Crime Data','No crime statistics available for this area yet.');
        }
        html += '<div style="margin:8px 12px 20px;background:#fff;border-radius:12px;border:1px solid ' + T.border + ';padding:16px;">' +
          '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:' + T.muted + ';margin-bottom:12px;">SAFETY TIPS</div>' +
          tips.map(function(t){ return '<div style="padding:9px 0;border-bottom:1px solid ' + T.border + ';font-size:13px;color:' + T.text + ';">' + t + '</div>'; }).join('') +
          '</div>';
        nb2.innerHTML = html;
      })
      .catch(function (err) {
        var nb2 = document.getElementById('aa-feed-body');
        if (nb2) nb2.innerHTML = '<div style="padding:32px;text-align:center;font-size:13px;color:' + T.red + ';">⚠️ ' + err.message + '</div>';
      });
  }

  /* ═══════════════════════════════════════════
     FEED PANEL (container + tabs)
  ═══════════════════════════════════════════ */
  var _feedTab = 'news';

  function buildFeed() {
    return panelHdr('📡 Live Feed') +
      '<div id="aa-feed-tabs" style="display:flex;background:#fff;' +
        'border-bottom:2px solid ' + T.border + ';position:sticky;top:54px;z-index:9;">' +
        '<button data-ftab="news"   style="flex:1;padding:11px 0;border:none;background:none;' +
          'font-size:12px;font-weight:700;color:' + T.teal + ';border-bottom:2px solid ' + T.teal + ';' +
          'margin-bottom:-2px;cursor:pointer;touch-action:manipulation;">📰 News</button>' +
        '<button data-ftab="alerts" style="flex:1;padding:11px 0;border:none;background:none;' +
          'font-size:12px;font-weight:700;color:' + T.muted + ';border-bottom:2px solid transparent;' +
          'margin-bottom:-2px;cursor:pointer;touch-action:manipulation;">⚠️ Alerts</button>' +
        '<button data-ftab="crime"  style="flex:1;padding:11px 0;border:none;background:none;' +
          'font-size:12px;font-weight:700;color:' + T.muted + ';border-bottom:2px solid transparent;' +
          'margin-bottom:-2px;cursor:pointer;touch-action:manipulation;">🔴 Crime</button>' +
      '</div>' +
      '<div id="aa-feed-body" style="background:' + T.bg + ';min-height:300px;"></div>';
  }

  function wireFeedTabs() {
    var bar = document.getElementById('aa-feed-tabs');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ftab]');
      if (!btn) return;
      var tab = btn.dataset.ftab;
      _feedTab = tab;
      // Update styles
      bar.querySelectorAll('[data-ftab]').forEach(function (b) {
        var on = b.dataset.ftab === tab;
        b.style.color        = on ? T.teal : T.muted;
        b.style.borderBottom = on ? ('2px solid ' + T.teal) : '2px solid transparent';
        b.style.fontWeight   = on ? '700' : '600';
      });
      if (tab === 'news')   loadNews(window.activeCountry);
      if (tab === 'alerts') loadAlerts(window.activeCountry);
      if (tab === 'crime')  loadCrime(window.activeCountry);
    });
  }

  /* ═══════════════════════════════════════════
     PACK PANEL
  ═══════════════════════════════════════════ */
  function buildPack() {
    var items = [
      ['🛂','Passport & Visas','All travel documents and entry requirements'],
      ['🔌','Power Adapter','Check destination voltage and plug type'],
      ['📱','Local SIM / Data','International plan or local SIM card'],
      ['💊','Medications','Prescriptions + first aid kit'],
      ['💵','Emergency Cash','Local currency for power outages / no signal'],
      ['📋','Document Copies','Photos of passport, insurance, contacts'],
      ['🏥','Travel Insurance','Medical coverage and emergency evacuation'],
      ['🌊','Water Purification','Tablets or filter for high-risk areas'],
      ['🔦','Torch / Headlamp','For power cuts and night navigation'],
      ['🗺️','Offline Maps','Download before you go — no data needed']
    ];
    return panelHdr('🎒 Pack Assistant') +
      '<div style="padding:16px;background:' + T.bg + ';">' +
        '<div style="background:' + T.tealLight + ';border:1px solid rgba(14,116,144,0.2);' +
          'border-radius:12px;padding:14px;margin-bottom:16px;">' +
          '<div style="font-size:13px;font-weight:700;color:' + T.teal + ';margin-bottom:4px;">Essential Travel Checklist</div>' +
          '<div style="font-size:12px;color:' + T.teal + ';opacity:0.8;">AI-powered custom lists based on destination coming soon</div>' +
        '</div>' +
        items.map(function (it) {
          return '<div style="display:flex;align-items:center;gap:12px;padding:13px 14px;' +
            'background:#fff;border:1px solid ' + T.border + ';border-radius:10px;margin-bottom:8px;">' +
            '<div style="font-size:24px;width:40px;text-align:center;flex-shrink:0;">' + it[0] + '</div>' +
            '<div style="flex:1;">' +
              '<div style="font-size:13px;font-weight:600;color:' + T.text + ';">' + it[1] + '</div>' +
              '<div style="font-size:11px;color:' + T.muted + ';margin-top:2px;">' + it[2] + '</div>' +
            '</div>' +
            '<div style="width:22px;height:22px;border-radius:50%;border:2px solid ' + T.border + ';flex-shrink:0;"></div>' +
          '</div>';
        }).join('') +
      '</div>';
  }

  /* ═══════════════════════════════════════════
     WORLD / COUNTRIES PANEL
  ═══════════════════════════════════════════ */
  function buildWorld() {
    return panelHdr('🌍 World Browser') +
      '<div style="padding:12px 16px;background:#fff;border-bottom:1px solid ' + T.border + ';' +
        'position:sticky;top:54px;z-index:9;">' +
        '<input id="aa-csearch" placeholder="Search countries…" ' +
          'style="width:100%;border:1.5px solid ' + T.border + ';border-radius:8px;' +
          'padding:9px 12px;font-size:13px;color:' + T.text + ';background:' + T.bg + ';' +
          'outline:none;box-sizing:border-box;font-family:-apple-system,sans-serif;">' +
      '</div>' +
      '<div id="aa-clist" style="background:' + T.bg + ';padding:0 16px 80px;">' +
        '<div style="padding:20px;text-align:center;color:' + T.muted + ';">Loading…</div>' +
      '</div>';
  }

  function renderCountries(list) {
    var el = document.getElementById('aa-clist');
    if (!el) return;
    if (!list || !list.length) {
      el.innerHTML = '<div style="padding:20px;text-align:center;color:' + T.muted + ';">No countries found</div>';
      return;
    }
    el.innerHTML = list.slice(0,200).map(function (c) {
      var lat = (c.center && c.center.length===2) ? c.center[0] : '';
      var lng = (c.center && c.center.length===2) ? c.center[1] : '';
      return '<div class="aa-crow" data-code="' + c.code + '" data-lat="' + lat + '" data-lng="' + lng + '" ' +
        'style="display:flex;align-items:center;gap:12px;padding:14px 0;' +
        'border-bottom:1px solid ' + T.border + ';cursor:pointer;-webkit-tap-highlight-color:transparent;">' +
        '<div style="font-size:28px;width:44px;text-align:center;flex-shrink:0;pointer-events:none;">' + (c.flag||'🌍') + '</div>' +
        '<div style="flex:1;pointer-events:none;">' +
          '<div style="font-size:14px;font-weight:600;color:' + T.text + ';">' + c.name + '</div>' +
          '<div style="font-size:11px;color:' + T.muted + ';margin-top:2px;">' +
            (c.advisoryLabel||'') + (c.capital?' · '+c.capital:'') +
          '</div>' +
        '</div>' +
        '<div style="color:' + T.muted + ';font-size:18px;pointer-events:none;">›</div>' +
      '</div>';
    }).join('');

    // Single delegated listener — no inline onclick string escaping
    el.addEventListener('click', function (e) {
      var row = e.target.closest('.aa-crow');
      if (!row) return;
      var code = row.dataset.code;
      var lat  = parseFloat(row.dataset.lat);
      var lng  = parseFloat(row.dataset.lng);
      var pos  = (!isNaN(lat) && !isNaN(lng) && lat !== 0) ? {lat:lat,lng:lng} : null;
      if (typeof window.setActiveCountry === 'function') window.setActiveCountry(code, pos);
      switchTab('map');
      if (typeof window.toast === 'function') {
        var found = (window.allCountries||[]).find(function(c){return c.code===code;});
        window.toast('📍 ' + (found ? found.name : code), 'ok');
      }
    });
  }

  function loadWorldCountries() {
    if (window.allCountries && window.allCountries.length) {
      renderCountries(window.allCountries);
    } else {
      fetch('/api/countries')
        .then(function(r){return r.json();})
        .then(function(data){
          window.allCountries = Array.isArray(data) ? data : [];
          renderCountries(window.allCountries);
        })
        .catch(function(){
          var el = document.getElementById('aa-clist');
          if (el) el.innerHTML = '<div style="padding:20px;text-align:center;color:' + T.red + ';">Failed to load countries</div>';
        });
    }
    // Wire search
    setTimeout(function(){
      var inp = document.getElementById('aa-csearch');
      if (!inp) return;
      inp.addEventListener('input', function(){
        var q = inp.value.toLowerCase();
        var filtered = (window.allCountries||[]).filter(function(c){
          return !q || c.name.toLowerCase().indexOf(q)>=0 || (c.capital||'').toLowerCase().indexOf(q)>=0 || c.code.toLowerCase().indexOf(q)>=0;
        });
        renderCountries(filtered);
      });
    }, 100);
  }

  /* ═══════════════════════════════════════════
     ACCOUNT PANEL
  ═══════════════════════════════════════════ */
  function buildAccount() {
    function arow(icon, title, sub, id) {
      return '<div class="aa-arow" data-action="' + (id||'') + '" ' +
        'style="display:flex;align-items:center;gap:12px;padding:14px;' +
        'background:#fff;border-bottom:1px solid ' + T.border + ';cursor:pointer;' +
        '-webkit-tap-highlight-color:transparent;">' +
        '<div style="width:38px;height:38px;border-radius:10px;background:' + T.tealLight + ';' +
          'flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;pointer-events:none;">' + icon + '</div>' +
        '<div style="flex:1;pointer-events:none;">' +
          '<div style="font-size:14px;font-weight:600;color:' + T.text + ';">' + title + '</div>' +
          '<div style="font-size:12px;color:' + T.muted + ';margin-top:2px;">' + sub + '</div>' +
        '</div>' +
        '<div style="color:' + T.muted + ';font-size:16px;pointer-events:none;">›</div>' +
      '</div>';
    }

    return panelHdr('👤 My Account') +
      '<div style="background:' + T.bg + ';">' +
        '<div style="background:linear-gradient(135deg,' + T.teal + ',' + T.tealDark + ');padding:20px 20px 24px;color:#fff;">' +
          '<div style="font-size:18px;font-weight:800;margin-bottom:4px;font-family:-apple-system,sans-serif;">Atlas Ally</div>' +
          '<div style="font-size:13px;opacity:0.8;margin-bottom:16px;">Global travel safety intelligence</div>' +
          '<div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:14px;">' +
            '<div style="font-size:10px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Plan</div>' +
            '<div style="font-size:16px;font-weight:700;">Free Trial · 7-day full access</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin:16px;background:#fff;border-radius:12px;border:1px solid ' + T.border + ';overflow:hidden;">' +
          '<div id="aa-acct-rows">' +
          arow('✅','Safe Check-in','Let your circle know you\'re safe','checkin') +
          arow('🔔','Notifications','Manage safety alerts and push notifications','notifications') +
          arow('📍','Saved Countries','Manage your monitored countries','countries') +
          arow('💳','Subscription','Upgrade to Premium — $3/mo','subscription') +
          arow('🔒','Privacy','Control your data and privacy settings','privacy') +
          arow('ℹ️','About Atlas Ally','v1.0 · atlas-ally.com · support@atlas-ally.com','about') +
          '</div>' +
        '</div>' +
        '<div style="padding:0 16px 80px;">' +
          '<button id="aa-signout" style="width:100%;padding:13px;background:' + T.redLight + ';' +
            'color:' + T.red + ';border:1px solid rgba(239,68,68,0.2);border-radius:10px;' +
            'font-size:14px;font-weight:600;cursor:pointer;touch-action:manipulation;' +
            'font-family:-apple-system,sans-serif;">Sign Out</button>' +
        '</div>' +
      '</div>';
  }

  function wireAccount() {
    var rows = document.getElementById('aa-acct-rows');
    if (rows) {
      rows.addEventListener('click', function(e) {
        var row = e.target.closest('.aa-arow');
        if (!row) return;
        var action = row.dataset.action;
        if (action === 'checkin')       showCheckin();
        if (action === 'notifications') showToast('🔔 Notifications coming soon', 'ok');
        if (action === 'countries')     switchTab('countries');
        if (action === 'subscription')  showToast('💳 Subscription management coming soon', 'ok');
        if (action === 'privacy')       showInfoModal('Privacy Policy',
          'Atlas Ally collects only the data necessary to provide safety intelligence. ' +
          'Your location is never stored without consent. ' +
          'We do not sell your data to third parties. ' +
          'For full details visit atlas-ally.com/privacy.');
        if (action === 'about') showInfoModal('About Atlas Ally',
          'Atlas Ally v1.0\nGlobal travel safety intelligence platform.\n\n' +
          'Built to keep travelers informed and safe.\n\nContact: support@atlas-ally.com\nWebsite: atlas-ally.com');
      });
    }
    var so = document.getElementById('aa-signout');
    if (so) so.addEventListener('click', function() { showToast('👋 Sign out coming soon', 'ok'); });
  }

  /* ═══════════════════════════════════════════
     SAFE CHECK-IN MODAL
  ═══════════════════════════════════════════ */
  function showCheckin() {
    if (checkinEl) { document.body.removeChild(checkinEl); checkinEl = null; }
    checkinEl = document.createElement('div');
    checkinEl.style.cssText =
      'position:fixed;inset:0;z-index:700000;' +
      'background:rgba(0,0,0,0.55);' +
      'display:flex;align-items:flex-end;justify-content:center;' +
      'pointer-events:all;';
    checkinEl.innerHTML =
      '<div style="background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:520px;' +
        'padding:24px 24px 40px;box-shadow:0 -8px 40px rgba(0,0,0,0.15);">' +
        '<div style="width:40px;height:4px;background:#E5EAEF;border-radius:2px;margin:0 auto 20px;"></div>' +
        '<div style="font-size:20px;font-weight:800;color:' + T.text + ';margin-bottom:6px;' +
          'font-family:-apple-system,sans-serif;">✅ Safe Check-in</div>' +
        '<div style="font-size:13px;color:' + T.muted + ';margin-bottom:20px;line-height:1.5;">' +
          'Let your emergency contacts know you\'re safe. Include your current location and a message.</div>' +

        '<div style="margin-bottom:14px;">' +
          '<div style="font-size:11px;font-weight:700;color:' + T.muted + ';text-transform:uppercase;' +
            'letter-spacing:0.5px;margin-bottom:6px;">Your Status</div>' +
          '<div id="aa-ci-status" style="display:flex;gap:8px;">' +
            '<button data-status="safe" style="flex:1;padding:10px;border-radius:10px;border:2px solid ' + T.green + ';' +
              'background:' + T.greenLight + ';color:' + T.green + ';font-weight:700;font-size:13px;cursor:pointer;' +
              'touch-action:manipulation;">🟢 I\'m Safe</button>' +
            '<button data-status="help" style="flex:1;padding:10px;border-radius:10px;border:2px solid ' + T.border + ';' +
              'background:#fff;color:' + T.muted + ';font-weight:600;font-size:13px;cursor:pointer;' +
              'touch-action:manipulation;">🆘 Need Help</button>' +
            '<button data-status="caution" style="flex:1;padding:10px;border-radius:10px;border:2px solid ' + T.border + ';' +
              'background:#fff;color:' + T.muted + ';font-weight:600;font-size:13px;cursor:pointer;' +
              'touch-action:manipulation;">⚠️ Caution</button>' +
          '</div>' +
        '</div>' +

        '<div style="margin-bottom:14px;">' +
          '<div style="font-size:11px;font-weight:700;color:' + T.muted + ';text-transform:uppercase;' +
            'letter-spacing:0.5px;margin-bottom:6px;">Message (optional)</div>' +
          '<textarea id="aa-ci-msg" placeholder="Add a message to your contacts…" ' +
            'style="width:100%;border:1.5px solid ' + T.border + ';border-radius:10px;padding:10px 12px;' +
            'font-size:13px;color:' + T.text + ';background:' + T.bg + ';outline:none;resize:none;' +
            'height:80px;box-sizing:border-box;font-family:-apple-system,sans-serif;"></textarea>' +
        '</div>' +

        '<div style="margin-bottom:20px;">' +
          '<div style="font-size:11px;font-weight:700;color:' + T.muted + ';text-transform:uppercase;' +
            'letter-spacing:0.5px;margin-bottom:6px;">Location</div>' +
          '<div id="aa-ci-loc" style="font-size:13px;color:' + T.muted + ';background:' + T.bg + ';' +
            'border:1.5px solid ' + T.border + ';border-radius:10px;padding:10px 12px;">' +
            (window.activeCountry ? '📍 ' + window.activeCountry : 'Location not set') +
          '</div>' +
        '</div>' +

        '<button id="aa-ci-send" style="width:100%;padding:14px;background:' + T.green + ';color:#fff;' +
          'border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;' +
          'touch-action:manipulation;font-family:-apple-system,sans-serif;margin-bottom:10px;">' +
          '✅ Send Check-in</button>' +
        '<button id="aa-ci-cancel" style="width:100%;padding:12px;background:none;color:' + T.muted + ';' +
          'border:none;font-size:14px;cursor:pointer;touch-action:manipulation;">Cancel</button>' +
      '</div>';

    document.body.appendChild(checkinEl);

    // Status buttons
    var statusBtns = checkinEl.querySelectorAll('[data-status]');
    var selectedStatus = 'safe';
    statusBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        selectedStatus = btn.dataset.status;
        statusBtns.forEach(function(b) {
          var active = b.dataset.status === selectedStatus;
          b.style.borderColor = active ? (selectedStatus==='safe'?T.green:selectedStatus==='help'?T.red:T.gold) : T.border;
          b.style.background  = active ? (selectedStatus==='safe'?T.greenLight:selectedStatus==='help'?T.redLight:'#FEF3C7') : '#fff';
          b.style.color       = active ? (selectedStatus==='safe'?T.green:selectedStatus==='help'?T.red:T.gold) : T.muted;
          b.style.fontWeight  = active ? '700' : '600';
        });
      });
    });

    // Send
    var sendBtn = document.getElementById('aa-ci-send');
    if (sendBtn) {
      sendBtn.addEventListener('click', function() {
        var msg = (document.getElementById('aa-ci-msg')||{}).value || '';
        var loc = window.activeCountry || 'Unknown';
        showToast('✅ Check-in sent · ' + selectedStatus.toUpperCase() + ' · ' + loc, 'ok');
        closeCheckin();
      });
    }

    // Cancel + backdrop
    var cancelBtn = document.getElementById('aa-ci-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeCheckin);
    checkinEl.addEventListener('click', function(e) {
      if (e.target === checkinEl) closeCheckin();
    });
  }

  function closeCheckin() {
    if (checkinEl && checkinEl.parentNode) {
      document.body.removeChild(checkinEl);
      checkinEl = null;
    }
  }

  /* ═══════════════════════════════════════════
     INFO MODAL (Privacy / About)
  ═══════════════════════════════════════════ */
  function showInfoModal(title, body) {
    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.55);' +
      'display:flex;align-items:center;justify-content:center;padding:20px;pointer-events:all;';
    modal.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:400px;width:100%;padding:24px;">' +
      '<div style="font-size:17px;font-weight:700;color:' + T.text + ';margin-bottom:14px;">' + title + '</div>' +
      '<div style="font-size:13px;color:' + T.muted + ';line-height:1.7;white-space:pre-line;margin-bottom:20px;">' + body + '</div>' +
      '<button id="aa-modal-close" style="width:100%;padding:12px;background:' + T.teal + ';color:#fff;' +
        'border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;touch-action:manipulation;">Close</button>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelector('#aa-modal-close').addEventListener('click', function() { document.body.removeChild(modal); });
    modal.addEventListener('click', function(e) { if (e.target===modal) document.body.removeChild(modal); });
  }

  /* ═══════════════════════════════════════════
     TOAST
  ═══════════════════════════════════════════ */
  function showToast(msg, type) {
    if (typeof window.toast === 'function') { window.toast(msg, type); return; }
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);' +
      'background:#fff;border-radius:8px;padding:10px 18px;font-size:13px;' +
      'box-shadow:0 4px 20px rgba(0,0,0,0.12);z-index:800000;pointer-events:none;' +
      'border:1px solid ' + T.border + ';color:' + T.text + ';white-space:nowrap;' +
      'font-family:-apple-system,sans-serif;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 3000);
  }

  /* ═══════════════════════════════════════════
     MAIN SWITCHER
  ═══════════════════════════════════════════ */
  function switchTab(name) {
    activateTab(name);
    closeCheckin();

    if (name === 'map') {
      hideOverlay();
      showMap();
      return;
    }

    hideMap();

    if      (name === 'feed')      showOverlay(buildFeed());
    else if (name === 'pack')      showOverlay(buildPack());
    else if (name === 'countries') showOverlay(buildWorld());
    else if (name === 'account')   showOverlay(buildAccount());

    // Wire close button
    setTimeout(function() {
      var closeBtn = document.getElementById('aa-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', function() { switchTab('map'); });

      if (name === 'feed') {
        _feedTab = 'news';
        wireFeedTabs();
        loadNews(window.activeCountry);
      }
      if (name === 'countries') {
        loadWorldCountries();
      }
      if (name === 'account') {
        wireAccount();
      }
    }, 0);
  }

  /* ═══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */
  function init() {
    mapWrap  = document.getElementById('map-wrap');
    navPanel = document.getElementById('nav-panel');

    // Create overlay div — appended to body, always above everything
    overlay = document.createElement('div');
    overlay.id = 'aa-overlay';
    overlay.style.cssText =
      'display:none;position:fixed;top:0;left:0;right:0;bottom:62px;' +
      'z-index:500000;background:' + T.bg + ';' +
      'overflow-y:auto;-webkit-overflow-scrolling:touch;pointer-events:none;';
    document.body.appendChild(overlay);

    // Hamburger
    var hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.removeAttribute('onclick');
      hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        if (navPanel) navPanel.classList.toggle('open');
      });
    }

    // Tab buttons — onclick already in HTML, addEventListener as backup
    document.querySelectorAll('.main-tab').forEach(function(btn, i) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        switchTab(tabNames[i]);
      });
    });

    // Close nav on outside click
    document.addEventListener('click', function(e) {
      if (!navPanel || !navPanel.classList.contains('open')) return;
      if (!navPanel.contains(e.target) && e.target.id !== 'hamburger') navPanel.classList.remove('open');
    });

    // ── Globals ──────────────────────────────────
    window.switchTab         = switchTab;
    window.openPanel         = function(id) { switchTab(id.replace('-panel','')); };
    window.closePanel        = function()   { switchTab('map'); };
    window.closeAllPanels    = function()   { switchTab('map'); };
    window.toggleNav         = function()   { if (navPanel) navPanel.classList.toggle('open'); };
    window.closeNav          = function()   { if (navPanel) navPanel.classList.remove('open'); };
    window.openCheckin       = showCheckin;
    window.closeCheckin      = closeCheckin;
    window.openReport        = function()   { switchTab('feed'); setTimeout(function(){ if(window._aaFeedTab) window._aaFeedTab('alerts'); }, 200); };
    window.locateUser        = function()   { navigator.geolocation && navigator.geolocation.getCurrentPosition(function(p){ window.map && window.map.setView([p.coords.latitude,p.coords.longitude],12); }); };
    window.toggleCrimeLayer  = function()   { var b=document.getElementById('crime-toggle'); if(b) b.style.opacity=b.style.opacity==='0.4'?'1':'0.4'; };
    window.toggleHeatmap     = function()   { if(window.handleFlameBtn) window.handleFlameBtn(); };
    window.toggleJourney     = function()   { var b=document.getElementById('journey-toggle'); if(b) b.textContent=b.textContent==='Start'?'Stop':'Start'; };
    window.showPicker        = function()   { var pk=document.getElementById('cpicker'); if(pk) pk.classList.add('open'); if(navPanel) navPanel.classList.remove('open'); if(typeof window.loadCountries==='function') window.loadCountries(); };
    window.hidePicker        = function()   { var pk=document.getElementById('cpicker'); if(pk) pk.classList.remove('open'); };
    window.showCountryPicker = window.showPicker;
    window.closeSheet        = function(id) { var s=document.getElementById(id); if(s) s.classList.remove('open'); };
    window.openNavSection    = function(pid){ switchTab(pid.replace('-panel','')); if(navPanel) navPanel.classList.remove('open'); };
    window.toast             = window.toast || showToast;

    // Intercept setActiveCountry — reload current feed tab if feed is open
    var _origSet = window.setActiveCountry;
    window.setActiveCountry = function(code, pos) {
      var r = _origSet ? _origSet(code, pos) : null;
      window.activeCountry    = code;
      window.activeCountryPos = pos;
      if (overlay && overlay.style.display !== 'none' && document.getElementById('aa-feed-body')) {
        if (_feedTab === 'news')   loadNews(code);
        if (_feedTab === 'alerts') loadAlerts(code);
        if (_feedTab === 'crime')  loadCrime(code);
      }
      return r;
    };

    window._debugAtlas = function() {
      console.log('switchTab:', typeof window.switchTab);
      console.log('activeCountry:', window.activeCountry);
      console.log('overlay:', overlay ? overlay.style.display : 'N/A');
    };

    switchTab('map');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
