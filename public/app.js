(function(){
  function checkAdminRole() {
    try {
      var u = JSON.parse(localStorage.getItem('atlas_user') || 'null');
      if (u && u.role === 'admin') {
        var el = document.getElementById('admin-panel-link');
        if (el) el.style.display = 'block';
      }
    } catch (e) {}
  }

  checkAdminRole();

  function getFeedLocation() {
    if (window.activeCountryPos) return window.activeCountryPos;
    if (typeof currentLat !== 'undefined' && typeof currentLng !== 'undefined') return { lat: currentLat, lng: currentLng };
    if (window.map && typeof window.map.getCenter === 'function') {
      var c = window.map.getCenter();
      return { lat: c.lat, lng: c.lng };
    }
    return null;
  }
  window.getFeedLocation = window.getFeedLocation || getFeedLocation;

  function makeFeedCard(title, description) {
    return '<div style="padding:14px;border-radius:16px;border:1px solid var(--border);background:rgba(255,255,255,0.95);margin-bottom:12px;">' +
           '<div style="font-size:15px;font-weight:700;margin-bottom:6px;">' + title + '</div>' +
           '<div style="font-size:13px;color:var(--dm);line-height:1.5;">' + description + '</div>' +
           '</div>';
  }

  function switchFeedTab(tab) {
    document.querySelectorAll('.ftab').forEach(function(btn){
      btn.classList.toggle('active', btn.id === 'tab-' + tab);
    });
    document.querySelectorAll('.feed-tab-pane').forEach(function(pane){
      pane.classList.toggle('active', pane.id === 'pane-' + tab);
    });
    refreshFeedPanel();
  }

  function refreshFeedPanel() {
    var ctx = document.getElementById('feed-context');
    var newsBody = document.getElementById('feed-news-body');
    var eventsBody = document.getElementById('feed-events-body');
    var crimeBody = document.getElementById('feed-crime-body');
    var loc = getFeedLocation();
    var country = window.activeCountry || (typeof currentCountry !== 'undefined' ? currentCountry : null);
    if (ctx) {
      if (country) ctx.textContent = 'Monitoring ' + country + ' · 300km radius';
      else if (loc) ctx.textContent = 'Current location: ' + loc.lat.toFixed(2) + ', ' + loc.lng.toFixed(2);
      else ctx.textContent = 'No location or country selected yet.';
    }
    if (newsBody) newsBody.innerHTML = makeFeedCard('News', country ? 'Latest safety news around ' + country + '.' : 'Select a country or drop a pin to see location-based news.');
    if (eventsBody) eventsBody.innerHTML = makeFeedCard('Danger Alerts', 'Recent threats and incidents within a 300 km radius of your current pin or GPS position.');
    if (crimeBody) crimeBody.innerHTML = makeFeedCard('Crime Stats', 'Local crime and safety trends based on nearby data and historical patterns.');
    if (country) {
      fetch('/api/events?country_code=' + country).then(function(r){ return r.json(); }).then(function(events){
        if (!events || !events.length) {
          if (eventsBody) eventsBody.innerHTML = '<div style="padding:18px;color:var(--muted);text-align:center;">No recent alerts for this country.</div>';
          return;
        }
        if (eventsBody) {
          eventsBody.innerHTML = events.slice(0,6).map(function(ev){
            return '<div style="padding:12px;margin-bottom:10px;border-radius:14px;background:rgba(14,116,144,0.06);">' +
                   '<div style="font-size:14px;font-weight:700;">' + (ev.title || 'Alert') + '</div>' +
                   '<div style="font-size:12px;color:var(--dm);margin-top:4px;">' + (ev.location || ev.source || 'Location unknown') + '</div>' +
                   '<div style="margin-top:8px;font-size:13px;color:var(--text);">' + (ev.description ? ev.description.slice(0,140) : 'No details provided.') + '</div>' +
                   '</div>';
          }).join('');
        }
      }).catch(function(){ if (eventsBody) eventsBody.innerHTML = '<div style="padding:18px;color:var(--muted);text-align:center;">Unable to load alerts.</div>'; });
    }
    if (loc) {
      fetch('/api/crime/near?lat=' + loc.lat + '&lng=' + loc.lng + '&radius=300').then(function(r){ return r.json(); }).then(function(data){
        if (!data || !data.global_stats || !data.global_stats.length) {
          if (crimeBody) crimeBody.innerHTML = '<div style="padding:18px;color:var(--muted);text-align:center;">No nearby crime data available.</div>';
          return;
        }
        if (crimeBody) {
          crimeBody.innerHTML = data.global_stats.slice(0,4).map(function(stat){
            return '<div style="padding:12px;margin-bottom:10px;border-radius:14px;background:rgba(14,116,144,0.05);">' +
                   '<div style="font-size:14px;font-weight:700;">' + stat.city + '</div>' +
                   '<div style="font-size:12px;color:var(--dm);margin-top:4px;">Overall safety index: ' + (stat.safety_index || 'n/a') + '</div>' +
                   '</div>';
          }).join('') + '<div style="font-size:12px;color:var(--dm);">Showing nearest available crime stats for this radius.</div>';
        }
      }).catch(function(){ if (crimeBody) crimeBody.innerHTML = '<div style="padding:18px;color:var(--muted);text-align:center;">Unable to load crime stats.</div>'; });
    }
  }

  function openCountryDetail(code) {
    if (!code) return;
    if (typeof setActiveCountry === 'function') setActiveCountry(code);
    var title = document.getElementById('cd-title');
    if (title) title.textContent = code;
    var body = document.getElementById('cd-body');
    if (body) body.innerHTML = '<div style="padding:14px;">Country: ' + code + '</div>';
    var sheet = document.getElementById('cdetail');
    if (sheet) sheet.classList.add('open');
  }
  window.openCountryDetail = window.openCountryDetail || openCountryDetail;

  function setActiveCountry(code, pos) {
    window.activeCountry = code;
    if (pos && pos.lat && pos.lng) {
      window.activeCountryPos = { lat: pos.lat, lng: pos.lng };
    }

    // Find country data for flag and name
    var countryData = (window.allCountries || []).find(function(c){ return c.code === code; });
    var flag = countryData ? countryData.flag : '🌍';
    var name = countryData ? countryData.name : code;

    // Update map badge
    var badgeFlag = document.getElementById('badge-flag');
    var badgeName = document.getElementById('badge-name');
    var badgeAdv  = document.getElementById('badge-adv');
    if (badgeFlag) badgeFlag.textContent = flag;
    if (badgeName) badgeName.textContent = name;
    if (badgeAdv && countryData) badgeAdv.textContent = countryData.advisoryLabel || '';

    // Update header country button
    var hdrFlag    = document.getElementById('hdr-flag');
    var hdrCountry = document.getElementById('hdr-country');
    if (hdrFlag)    hdrFlag.textContent    = flag;
    if (hdrCountry) hdrCountry.textContent = code;

    // Place marker on map
    if (typeof window.map !== 'undefined' && pos && pos.lat && pos.lng) {
      if (window.activeCountryMarker) {
        window.map.removeLayer(window.activeCountryMarker);
        window.activeCountryMarker = null;
      }
      window.activeCountryMarker = L.marker([pos.lat, pos.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:18px;height:18px;border-radius:50%;background:#0E7490;border:3px solid white;box-shadow:0 0 12px rgba(0,0,0,0.25);"></div>',
          iconAnchor: [9, 9]
        })
      }).addTo(window.map);
      window.map.setView([pos.lat, pos.lng], Math.max(window.map.getZoom(), 5));
    }
    return code;
  }
  window.setActiveCountry = window.setActiveCountry || setActiveCountry;

  window.switchFeedTab = window.switchFeedTab || function(tab) { switchFeedTab(tab); };

  document.addEventListener('DOMContentLoaded', function() {
    if (typeof switchFeedTab === 'function') switchFeedTab('news');
  });

  (function () {
    var _origLoadFeed = window.loadFeed;

    function formatDist(km) {
      if (km < 1) return (km * 1000).toFixed(0) + ' m away';
      if (km < 10) return km.toFixed(1) + ' km away';
      return Math.round(km) + ' km away';
    }

    function distColor(km) {
      if (km < 10) return '#ff3b30';
      if (km < 50) return '#ff9500';
      if (km < 200) return '#ffcc00';
      return '#8e8e93';
    }

    function injectDistanceBadge(card, km) {
      if (card.querySelector('.atlas-dist-badge')) return;
      var badge = document.createElement('span');
      badge.className = 'atlas-dist-badge';
      badge.textContent = formatDist(km);
      badge.style.cssText = [
        'display:inline-block',
        'margin-left:8px',
        'padding:2px 7px',
        'border-radius:10px',
        'font-size:11px',
        'font-weight:600',
        'color:#fff',
        'background:' + distColor(km),
        'vertical-align:middle'
      ].join(';');
      var heading = card.querySelector('h3,h4,.event-title,.feed-title,strong') || card.firstElementChild;
      if (heading) heading.appendChild(badge);
    }

    async function loadEventsWithGPS(countryCode) {
      var API = (typeof window.API_BASE !== 'undefined' ? window.API_BASE : '');
      var url = API + '/api/events?country_code=' + countryCode;
      var lat = (typeof currentLat !== 'undefined') ? currentLat : null;
      var lng = (typeof currentLng !== 'undefined') ? currentLng : null;
      if (lat && lng) url += '&lat=' + lat + '&lng=' + lng;
      try {
        var res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } });
        var data = await res.json();
        var container = document.querySelector('#incidents-list, .incidents-list, [data-tab="incidents"] .feed-list, #feed-panel .tab-content');
        if (!container) return;
        if (!data.length) {
          container.innerHTML = '<p style="text-align:center;color:#888;padding:24px">No incidents reported</p>';
          return;
        }
        container.innerHTML = data.map(function(ev) {
          var severityColor = ev.severity === 'critical' ? '#ff3b30' : ev.severity === 'high' ? '#ff9500' : '#ffcc00';
          var distBadge = (lat && lng && typeof ev.distance_km === 'number')
            ? '<span style="display:inline-block;margin-left:8px;padding:2px 7px;border-radius:10px;font-size:11px;font-weight:600;color:#fff;background:' + distColor(ev.distance_km) + '">' + formatDist(ev.distance_km) + '</span>'
            : '';
          var locTag = ev.location ? ' · ' + ev.location : '';
          var time = ev.created_at ? new Date(ev.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '';
          return [
            '<div class="feed-item" style="border-left:3px solid ' + severityColor + ';padding:10px 12px;margin-bottom:8px;background:rgba(255,255,255,0.04);border-radius:6px">',
            '  <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px">',
            '    <strong style="font-size:14px">' + (ev.title || 'Incident') + '</strong>',
            '    ' + distBadge,
            '  </div>',
            '  <div style="font-size:12px;color:#aaa;margin-top:4px">' + ev.source + locTag + (time ? ' · ' + time : '') + '</div>',
            '  ' + (ev.description ? '<div style="font-size:13px;margin-top:6px;color:#ccc">' + ev.description.slice(0,160) + '</div>' : ''),
            '</div>'
          ].join('');
        }).join('');
      } catch (e) {
        console.warn('Atlas GPS events load failed:', e);
      }
    }

    document.addEventListener('click', function(e) {
      var target = e.target.closest('[data-tab],[onclick]');
      if (!target) return;
      var label = (target.dataset.tab || target.getAttribute('onclick') || '').toLowerCase();
      if (label.includes('incident') || label.includes('event')) {
        var country = (typeof activeCountry !== 'undefined') ? activeCountry : null;
        if (!country && typeof currentCountry !== 'undefined') country = currentCountry;
        if (country) setTimeout(function() { loadEventsWithGPS(country); }, 150);
      }
    });

    Object.defineProperty(window, 'loadFeed', {
      get: function() { return _origLoadFeed; },
      set: function(fn) {
        _origLoadFeed = function() {
          if (fn) fn.apply(this, arguments);
          var country = (typeof activeCountry !== 'undefined') ? activeCountry : (typeof currentCountry !== 'undefined') ? currentCountry : null;
          if (country) loadEventsWithGPS(country);
        };
      },
      configurable: true
    });
  })();

  (function () {
    function formatNewsDist(km) {
      if (km < 1) return (km * 1000).toFixed(0) + ' m';
      if (km < 10) return km.toFixed(1) + ' km';
      return Math.round(km) + ' km';
    }

    function newsDistColor(km) {
      if (km < 10) return '#ff3b30';
      if (km < 50) return '#ff9500';
      if (km < 150) return '#34c759';
      return '#8e8e93';
    }

    async function loadNewsWithGPS(countryCode) {
      var API = (typeof window.API_BASE !== 'undefined' ? window.API_BASE : '');
      var url = API + '/api/news?country_code=' + encodeURIComponent(countryCode);
      var lat = (typeof currentLat !== 'undefined') ? currentLat : null;
      var lng = (typeof currentLng !== 'undefined') ? currentLng : null;
      if (lat && lng) url += '&lat=' + lat + '&lng=' + lng;
      try {
        var res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') } });
        var data = await res.json();
        var container = document.querySelector('#news-list, .news-list, [data-tab="news"] .feed-list, #feed-body');
        if (!container) return;
        if (!data || !data.length) {
          container.innerHTML = '<p style="text-align:center;color:#888;padding:24px;font-size:13px">No news within 150 km</p>';
          return;
        }
        container.innerHTML = data.map(function(article) {
          var distBadge = (lat && lng && typeof article.distance_km === 'number')
            ? '<span style="display:inline-block;padding:2px 7px;border-radius:10px;font-size:10px;font-weight:700;color:#fff;background:' + newsDistColor(article.distance_km) + ';margin-left:6px">' + formatNewsDist(article.distance_km) + '</span>'
            : '';
          var time = article.published_at ? new Date(article.published_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
          var src = (article.source_name || 'News').toUpperCase();
          var iconMap = {
            crime:   { emoji: '🔴', cls: 'fi-red' },
            event:   { emoji: '⚠️', cls: 'fi-amber' },
            weather: { emoji: '🌧️', cls: 'fi-blue' },
            health:  { emoji: '🏥', cls: 'fi-green' },
            politics:{ emoji: '🏛️', cls: 'fi-amber' }
          };
          var iMap = iconMap[article.category] || { emoji: '🗞️', cls: 'fi-gray' };
          var tagMap = {
            crime:   { label: 'URGENT',    cls: 'tag-urgent' },
            event:   { label: 'ADVISORY',  cls: 'tag-advisory' },
            weather: { label: 'WEATHER',   cls: 'tag-weather' },
            health:  { label: 'ALL CLEAR', cls: 'tag-allclear' }
          };
          var tMap = tagMap[article.category] || { label: src, cls: 'tag-default' };
          var distLabel = (lat && lng && typeof article.distance_km === 'number') ? Math.round(article.distance_km) + ' km' : 'Global';
          return [
            '<a class="fitem" href="' + (article.url || '#') + '" target="_blank" rel="noopener">',
            '  <div class="ficon ' + iMap.cls + '">' + iMap.emoji + '</div>',
            '  <div class="fbody">',
            '    <div class="fhead">' + (article.title || 'Untitled').slice(0,100) + '</div>',
            '    <div class="fsub">',
            '      <span class="ftag ' + tMap.cls + '">' + tMap.label + '</span>',
            '      <span class="ftime">' + distLabel + ' · ' + time + '</span>',
            '    </div>',
            '  </div>',
            '</a>'
          ].join('');
        }).join('');
      } catch (e) {
        console.warn('Atlas GPS news load failed:', e);
      }
    }

    document.addEventListener('click', function(e) {
      var target = e.target.closest('[data-tab],[onclick]');
      if (!target) return;
      var label = (target.dataset.tab || target.getAttribute('onclick') || '').toLowerCase();
      if (label.includes('news')) {
        var country = (typeof activeCountry !== 'undefined') ? activeCountry : (typeof currentCountry !== 'undefined') ? currentCountry : null;
        if (country) setTimeout(function() { loadNewsWithGPS(country); }, 150);
      }
    });

    var _origLoadFeedNews = window.loadFeed;
    Object.defineProperty(window, 'loadFeed', {
      get: function() { return _origLoadFeedNews; },
      set: function(fn) {
        _origLoadFeedNews = function() {
          if (fn) fn.apply(this, arguments);
          var country = (typeof activeCountry !== 'undefined') ? activeCountry : (typeof currentCountry !== 'undefined') ? currentCountry : null;
          if (country) loadNewsWithGPS(country);
        };
      },
      configurable: true
    });

    window.loadNewsWithGPS = window.loadNewsWithGPS || loadNewsWithGPS;
  })();
})();
