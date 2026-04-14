(function(){
  function init() {
    var tabs    = document.querySelectorAll('.main-tab');
    var mapWrap = document.getElementById('map-wrap');
    var navPanel = document.getElementById('nav-panel');

    var PANEL_IDS = ['feed-panel','pack-panel','countries-panel','account-panel'];

    /* ── Activate tab styling ── */
    function activateTab(btn) {
      tabs.forEach(function(t){
        var icon = t.querySelector('.tbi-icon');
        var lbl  = t.querySelector('.tbi-label');
        if (icon) icon.classList.remove('on');
        if (lbl)  lbl.classList.remove('on');
        t.classList.remove('active');
      });
      if (!btn) return;
      var icon = btn.querySelector('.tbi-icon');
      var lbl  = btn.querySelector('.tbi-label');
      if (icon) icon.classList.add('on');
      if (lbl)  lbl.classList.add('on');
      btn.classList.add('active');
    }

    /* ── Hide all panels ── */
    function hideAllPanels() {
      PANEL_IDS.forEach(function(id){
        var p = document.getElementById(id);
        if (!p) return;
        p.classList.remove('open');
        p.style.cssText = ''; // Clear any lingering inline styles — CSS handles hidden state
      });
    }

    /* ── Show one panel — class only, no inline styles ── */
    /* NOTE: !important in style.cssText is silently stripped by browsers and doesn't work.
       The fix is to drive everything through .panel.open in styles.css which CAN use !important. */
    function showPanel(id) {
      hideAllPanels();
      var p = document.getElementById(id);
      if (!p) { console.warn('Panel not found:', id); return; }
      p.classList.add('open');
    }

    /* ── Map show/hide ── */
    function hideMap() {
      if (mapWrap) {
        mapWrap.style.cssText = mapWrap.style.cssText.replace(/visibility:[^;]*/g,'');
        mapWrap.style.visibility = 'hidden';
        mapWrap.style.pointerEvents = 'none';
      }
    }

    function showMap() {
      if (mapWrap) {
        mapWrap.style.visibility = 'visible';
        mapWrap.style.pointerEvents = '';
      }
      if (window.map && typeof window.map.invalidateSize === 'function') {
        setTimeout(function(){ window.map.invalidateSize(); }, 150);
      }
    }

    /* ── Main switcher ── */
    function switchTab(name) {
      var names = ['map','feed','pack','countries','account'];
      var idx = names.indexOf(name);
      if (idx >= 0 && tabs[idx]) activateTab(tabs[idx]);

      if (name === 'map') {
        hideAllPanels();
        showMap();
      } else {
        hideMap();
        var map = { feed:'feed-panel', pack:'pack-panel', countries:'countries-panel', account:'account-panel' };
        if (map[name]) showPanel(map[name]);
        if (name === 'feed'      && typeof window.refreshFeedPanel === 'function') setTimeout(window.refreshFeedPanel, 100);
        if (name === 'countries' && typeof window.loadCountries    === 'function') setTimeout(window.loadCountries, 100);
      }
    }

    /* ── Wire tabs ── */
    var tabNames = ['map','feed','pack','countries','account'];
    tabs.forEach(function(btn, i){
      btn.removeAttribute('onclick');
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        switchTab(tabNames[i]);
      });
    });

    /* ── Hamburger — toggles open directly on nav-panel ── */
    var hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.removeAttribute('onclick');
      hamburger.addEventListener('click', function(e){
        e.stopPropagation();
        if (navPanel) navPanel.classList.toggle('open');
      });
    }

    /* ── Close nav on outside click ── */
    document.addEventListener('click', function(e){
      if (!navPanel || !navPanel.classList.contains('open')) return;
      if (!navPanel.contains(e.target)) navPanel.classList.remove('open');
    });

    /* ── Globals ── */
    window.switchTab = switchTab;
    window.openPanel = showPanel;
    window.closePanel = function(id) {
      var p = document.getElementById(id);
      if (p) { p.classList.remove('open'); p.style.cssText = ''; }
    };
    window.closeAllPanels = hideAllPanels;
    window.toggleNav  = function() { if (navPanel) navPanel.classList.toggle('open'); };
    window.closeNav   = function() { if (navPanel) navPanel.classList.remove('open'); };
    window.showPicker = function() {
      var picker = document.getElementById('cpicker');
      if (picker) picker.classList.add('open');
      window.closeNav();
      if (typeof window.loadCountries === 'function') window.loadCountries();
    };
    window.hidePicker = function() {
      var picker = document.getElementById('cpicker');
      if (picker) picker.classList.remove('open');
    };
    window.showCountryPicker = window.showPicker;
    window.closeSheet = function(id) {
      var s = document.getElementById(id);
      if (s) s.classList.remove('open');
    };
    window.openNavSection = function(panelId) {
      switchTab(panelId.replace('-panel',''));
      window.closeNav();
    };

    /* ── Debug helper ── */
    window._debugNav = function() {
      console.log('tabs found:', tabs.length);
      PANEL_IDS.forEach(function(id){
        var p = document.getElementById(id);
        if (!p) { console.log(id, 'NOT FOUND'); return; }
        var cs = window.getComputedStyle(p);
        console.log(id,
          '| class:', p.className,
          '| computed display:', cs.display,
          '| computed transform:', cs.transform,
          '| computed visibility:', cs.visibility
        );
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
