(function(){
  var tabs = document.querySelectorAll('.main-tab');
  var drawer = document.getElementById('content-drawer');
  var mapWrap = document.getElementById('map-wrap');

  function activateTab(btn) {
    tabs.forEach(function(t){
      var icon = t.querySelector('.tbi-icon');
      var lbl  = t.querySelector('.tbi-label');
      if (icon) icon.classList.remove('on');
      if (lbl) lbl.classList.remove('on');
      t.classList.remove('active');
    });
    var icon = btn.querySelector('.tbi-icon');
    var lbl  = btn.querySelector('.tbi-label');
    if (icon) icon.classList.add('on');
    if (lbl) lbl.classList.add('on');
    btn.classList.add('active');
  }

  function closeAllPanels() {
    document.querySelectorAll('.panel.open').forEach(function(panel){ panel.classList.remove('open'); });
  }

  function openPanel(id) {
    closeAllPanels();
    var panel = document.getElementById(id);
    if (panel) panel.classList.add('open');
  }

  function switchTab(tabName) {
    closeAllPanels();

    var tabButtons = {
      map: tabs[0],
      feed: tabs[1],
      pack: tabs[2],
      countries: tabs[3],
      account: tabs[4]
    };
    var btn = tabButtons[tabName];
    if (btn) activateTab(btn);

    if (tabName === 'map') {
      if (mapWrap) mapWrap.style.display = 'block';
      if (drawer) drawer.style.display = 'none';
    } else {
      if (mapWrap) mapWrap.style.display = 'none';
      if (drawer) drawer.style.display = 'flex';
      var panelMap = {
        feed: 'feed-panel',
        pack: 'pack-panel',
        countries: 'countries-panel',
        account: 'account-panel'
      };
      if (panelMap[tabName]) openPanel(panelMap[tabName]);
      if (tabName === 'feed' && typeof refreshFeedPanel === 'function') refreshFeedPanel();
    }
  }

  tabs.forEach(function(btn, index){
    btn.addEventListener('click', function(){
      var tabNames = ['map', 'feed', 'pack', 'countries', 'account'];
      switchTab(tabNames[index]);
    });
  });

  window.switchTab = window.switchTab || switchTab;
  window.openPanel = window.openPanel || openPanel;
  window.closePanel = window.closePanel || function(id) {
    var panel = document.getElementById(id);
    if (panel) panel.classList.remove('open');
  };
  window.openNavSection = window.openNavSection || function(panelId) {
    var section = panelId.replace('-panel', '');
    switchTab(section);
    if (typeof closeNav === 'function') closeNav();
  };
  window.toggleNav = window.toggleNav || function() {
    var app = document.getElementById('app');
    if (app) app.classList.toggle('nav-open');
  };
  window.closeNav = window.closeNav || function() {
    var app = document.getElementById('app');
    if (app) app.classList.remove('nav-open');
  };
  window.showPicker = window.showPicker || function() {
    var picker = document.getElementById('cpicker');
    if (picker) picker.classList.add('open');
    if (typeof closeNav === 'function') closeNav();
  };
  window.hidePicker = window.hidePicker || function() {
    var picker = document.getElementById('cpicker');
    if (picker) picker.classList.remove('open');
  };
  window.showCountryPicker = window.showCountryPicker || function() {
    if (typeof showPicker === 'function') showPicker();
  };
  window.closeSheet = window.closeSheet || function(id) {
    var sheet = document.getElementById(id);
    if (sheet) sheet.classList.remove('open');
  };
})();
