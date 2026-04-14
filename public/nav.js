(function(){
  function init() {
    var tabs    = document.querySelectorAll('.main-tab');
    var mapWrap = document.getElementById('map-wrap');

    /* ── Tab activation styling ── */
    function activateTab(btn) {
      tabs.forEach(function(t){
        var icon = t.querySelector('.tbi-icon');
        var lbl  = t.querySelector('.tbi-label');
        if (icon) icon.classList.remove('on');
        if (lbl)  lbl.classList.remove('on');
        t.classList.remove('active');
      });
      var icon = btn.querySelector('.tbi-icon');
      var lbl  = btn.querySelector('.tbi-label');
      if (icon) icon.classList.add('on');
      if (lbl)  lbl.classList.add('on');
      btn.classList.add('active');
    }

    /* ── Panel management via inline styles (bypasses CSS conflicts) ── */
    var PANEL_IDS = ['feed-panel','pack-panel','countries-panel','account-panel'];

    function hideAllPanels() {
      PANEL_IDS.forEach(function(id){
        var p = document.getElementById(id);
        if (!p) return;
        p.classList.remove('open');
        p.style.cssText = 'transform:translateY(100%);pointer-events:none;z-index:9000;';
      });
    }

    function showPanel(id) {
      hideAllPanels();
      var p = document.getElementById(id);
      if (!p) return;
      p.classList.add('open');
      p.style.position      = 'fixed';
      p.style.inset         = '0';
      p.style.zIndex        = '99998';
      p.style.display       = 'flex';
      p.style.flexDirection = 'column';
      p.style.background    = '#F8FAFB';
      p.style.transform     = 'translateY(0)';
      p.style.pointerEvents = 'all';
      p.style.overflow      = 'hidden';
    }

    function hideMap() {
      if (!mapWrap) return;
      mapWrap.style.visibility   = 'hidden';
      mapWrap.style.pointerEvents = 'none';
    }

    function showMap() {
      if (!mapWrap) return;
      mapWrap.style.visibility   = 'visible';
      mapWrap.style.pointerEvents = '';
      if (window.map && typeof window.map.invalidateSize === 'function') {
        setTimeout(function(){ window.map.invalidateSize(); }, 150);
      }
    }

    /* ── Main tab switcher ── */
    function switchTab(tabName) {
      var tabNames = ['map','feed','pack','countries','account'];
      var idx = tabNames.indexOf(tabName);
      if (idx >= 0 && tabs[idx]) activateTab(tabs[idx]);

      if (tabName === 'map') {
        hideAllPanels();
        showMap();
      } else {
        hideMap();
        var panelMap = {
          feed:      'feed-panel',
          pack:      'pack-panel',
          countries: 'countries-panel',
          account:   'account-panel'
        };
        if (panelMap[tabName]) showPanel(panelMap[tabName]);
        if (tabName === 'feed'      && typeof window.refreshFeedPanel === 'function') window.refreshFeedPanel();
        if (tabName === 'countries' && typeof window.loadCountries    === 'function') window.loadCountries();
      }
    }

    /* ── Wire tab buttons ── */
    var tabNames = ['map','feed','pack','countries','account'];
    tabs.forEach(function(btn, index){
      btn.removeAttribute('onclick');
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        switchTab(tabNames[index]);
      });
    });

    /* ── Hamburger — toggle open class directly on #nav-panel ── */
    var navPanel  = document.getElementById('nav-panel');
    var hamburger = document.getElementById('hamburger');

    if (hamburger) {
      hamburger.removeAttribute('onclick');
      hamburger.addEventListener('click', function(e){
        e.stopPropagation();
        if (navPanel) navPanel.classList.toggle('open');
      });
    }

    /* ── Close nav when clicking outside it ── */
    document.addEventListener('click', function(e){
      if (!navPanel || !navPanel.classList.contains('open')) return;
      if (!navPanel.contains(e.target) && e.target.id !== 'hamburger' && !hamburger.contains(e.target)) {
        navPanel.classList.remove('open');
      }
    });

    /* ── Expose globals ── */
    window.switchTab = switchTab;

    window.openPanel = function(id) { showPanel(id); };

    window.closePanel = function(id) {
      var p = document.getElementById(id);
      if (p) {
        p.classList.remove('open');
        p.style.cssText = 'transform:translateY(100%);pointer-events:none;z-index:9000;';
      }
    };

    window.closeAllPanels = hideAllPanels;

    window.toggleNav = function() {
      if (navPanel) navPanel.classList.toggle('open');
    };

    window.closeNav = function() {
      if (navPanel) navPanel.classList.remove('open');
    };

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

    // Boot on map tab
    switchTab('map');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
