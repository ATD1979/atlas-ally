(function(){
  function init() {
    var tabs = document.querySelectorAll('.main-tab');
    var mapWrap = document.getElementById('map-wrap');
    var drawer = document.getElementById('content-drawer');

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

    function closeAllPanels() {
      document.querySelectorAll('.panel.open').forEach(function(p){ p.classList.remove('open'); });
    }

    function openPanel(id) {
      closeAllPanels();
      var panel = document.getElementById(id);
      if (panel) panel.classList.add('open');
    }

    function switchTab(tabName) {
      closeAllPanels();

      var tabNames = ['map', 'feed', 'pack', 'countries', 'account'];
      var idx = tabNames.indexOf(tabName);
      if (idx >= 0 && tabs[idx]) activateTab(tabs[idx]);

      if (tabName === 'map') {
        if (mapWrap) mapWrap.classList.remove('map-hidden');
        if (drawer)  drawer.style.display = 'none';
      } else {
        if (mapWrap) mapWrap.classList.add('map-hidden');
        if (drawer) {
          drawer.style.display = 'flex';
          drawer.style.flexDirection = 'column';
        }
        var panelMap = {
          feed:      'feed-panel',
          pack:      'pack-panel',
          countries: 'countries-panel',
          account:   'account-panel'
        };
        if (panelMap[tabName]) openPanel(panelMap[tabName]);
        if (tabName === 'feed' && typeof window.refreshFeedPanel === 'function') window.refreshFeedPanel();
        if (tabName === 'countries' && typeof window.loadCountries === 'function') window.loadCountries();
      }
    }

    // Wire tab buttons — remove any existing onclick to avoid conflicts
    var tabNames = ['map', 'feed', 'pack', 'countries', 'account'];
    tabs.forEach(function(btn, index){
      btn.removeAttribute('onclick');
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        switchTab(tabNames[index]);
      });
    });

    // Hamburger
    var hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.removeAttribute('onclick');
      hamburger.addEventListener('click', function(e){
        e.stopPropagation();
        var app = document.getElementById('app');
        if (app) app.classList.toggle('nav-open');
      });
    }

    // Expose globals
    window.switchTab = switchTab;
    window.openPanel = openPanel;
    window.closePanel = function(id) {
      var panel = document.getElementById(id);
      if (panel) panel.classList.remove('open');
    };
    window.closeAllPanels = closeAllPanels;
    window.toggleNav = function() {
      var app = document.getElementById('app');
      if (app) app.classList.toggle('nav-open');
    };
    window.closeNav = function() {
      var app = document.getElementById('app');
      if (app) app.classList.remove('nav-open');
    };
    window.showPicker = function() {
      var picker = document.getElementById('cpicker');
      if (picker) picker.classList.add('open');
      if (typeof window.closeNav === 'function') window.closeNav();
      if (typeof window.loadCountries === 'function') window.loadCountries();
    };
    window.hidePicker = function() {
      var picker = document.getElementById('cpicker');
      if (picker) picker.classList.remove('open');
    };
    window.showCountryPicker = window.showPicker;
    window.closeSheet = function(id) {
      var sheet = document.getElementById(id);
      if (sheet) sheet.classList.remove('open');
    };
    window.openNavSection = function(panelId) {
      var section = panelId.replace('-panel', '');
      switchTab(section);
      if (typeof window.closeNav === 'function') window.closeNav();
    };

    // Start on map tab
    switchTab('map');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
