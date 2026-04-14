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

  var tabs = [];
  var tabNames = ['map', 'feed', 'pack', 'countries', 'account'];

  function activateTab(name) {
    tabs.forEach(function (btn, i) {
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
      setTimeout(function () {
        if (typeof window.refreshFeedPanel === 'function') window.refreshFeedPanel();
        setTimeout(function () {
          if (typeof window.loadFeedNews === 'function') window.loadFeedNews();
        }, 300);
      }, 150);
    }
    if (name === 'countries' && typeof window.loadCountries === 'function') {
      setTimeout(window.loadCountries, 150);
    }
  }

  function init() {
    mapWrap = document.getElementById('map-wrap');
    tabs    = Array.from(document.querySelectorAll('.main-tab'));

    tabs.forEach(function (btn, i) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); switchTab(tabNames[i]); });
    });

    var hamburger = document.getElementById('hamburger');
    var navPanel  = document.getElementById('nav-panel');

    if (hamburger) {
      hamburger.addEventListener('click', function (e) {
        e.stopPropagation();
        if (navPanel) navPanel.classList.toggle('open');
      });
    }
    document.addEventListener('click', function (e) {
      if (!navPanel || !navPanel.classList.contains('open')) return;
      if (!navPanel.contains(e.target) && e.target !== hamburger) navPanel.classList.remove('open');
    });

    window.switchTab        = switchTab;
    window.openPanel        = showPanel;
    window.closePanel       = function (id) { var p = document.getElementById(id); if (p) { p.classList.remove('open'); p.style.setProperty('display','none','important'); } };
    window.closeAllPanels   = hideAllPanels;
    window.toggleNav        = function () { if (navPanel) navPanel.classList.toggle('open'); };
    window.closeNav         = function () { if (navPanel) navPanel.classList.remove('open'); };
    window.showPicker       = function () { var pk=document.getElementById('cpicker'); if(pk) pk.classList.add('open'); if(navPanel) navPanel.classList.remove('open'); if(typeof window.loadCountries==='function') window.loadCountries(); };
    window.hidePicker       = function () { var pk=document.getElementById('cpicker'); if(pk) pk.classList.remove('open'); };
    window.showCountryPicker = window.showPicker;
    window.closeSheet       = function (id) { var s=document.getElementById(id); if(s) s.classList.remove('open'); };
    window.openNavSection   = function (pid) { switchTab(pid.replace('-panel','')); if(navPanel) navPanel.classList.remove('open'); };

    window._debugNav = function () {
      console.log('tabs:', tabs.length);
      PANEL_IDS.forEach(function (id) {
        var p = document.getElementById(id);
        if (!p) { console.log(id,'NOT FOUND'); return; }
        var cs = getComputedStyle(p);
        console.log(id,'display:',cs.display,'visibility:',cs.visibility,'transform:',cs.transform,'class:',p.className);
      });
    };

    switchTab('map');
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }

})();
