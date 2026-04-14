(function(){
  function renderCountryBrowser(list) {
    list = list || window.allCountries || [];
    var pinned = document.getElementById('pinned-countries');
    var browser = document.getElementById('country-browser');
    if (pinned) {
      var pinnedList = (window.pinnedCountries || []).map(function(code) {
        return list.find(function(country){ return country.code === code; });
      }).filter(Boolean);
      pinned.innerHTML = pinnedList.length ? '<div style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--dm);">Pinned countries</div>' + pinnedList.map(function(country){
        var active = (window.activeCountry === country.code);
        return '<div style="padding:14px;border-radius:16px;background:rgba(14,116,144,0.06);display:flex;justify-content:space-between;align-items:center;gap:14px;">' +
               '<div><div style="font-size:15px;font-weight:700;">' + country.flag + ' ' + country.name + '</div>' +
               '<div style="font-size:12px;color:var(--dm);margin-top:5px;">' + country.advisoryLabel + ' · ' + country.capital + '</div></div>' +
               '<button onclick="togglePinnedCountry(\'' + country.code + '\')" style="border:none;padding:8px 12px;border-radius:12px;background:' + (active ? 'var(--teal)' : 'rgba(14,116,144,0.12)') + ';color:' + (active ? '#fff' : 'var(--text)') + ';cursor:pointer;font-size:13px;">' + (active ? 'Selected' : 'Remove') + '</button>' +
               '</div>';
      }).join('') : '<div style="padding:14px;border-radius:16px;background:rgba(14,116,144,0.05);color:var(--dm);font-size:13px;">No pinned countries yet. Use the browser or add a country to start monitoring.</div>';
    }
    if (browser) {
      browser.innerHTML = list.length ? list.map(function(country){
        var pinned = (window.pinnedCountries || []).includes(country.code);
        return '<div style="padding:14px;border-radius:16px;background:rgba(255,255,255,0.95);border:1px solid var(--border);display:grid;gap:10px;">' +
               '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
               '<div><div style="font-size:15px;font-weight:700;">' + country.flag + ' ' + country.name + '</div>' +
               '<div style="font-size:12px;color:var(--dm);margin-top:4px;">' + country.advisoryLabel + ' | ' + country.capital + '</div></div>' +
               '<button onclick="togglePinnedCountry(\'' + country.code + '\')" style="border:none;padding:8px 12px;border-radius:12px;background:' + (pinned ? 'var(--teal)' : 'rgba(14,116,144,0.12)') + ';color:' + (pinned ? '#fff' : 'var(--text)') + ';cursor:pointer;font-size:13px;">' + (pinned ? 'Unpin' : 'Pin') + '</button>' +
               '</div>' +
               '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--muted);">' +
               '<span>Score ' + country.advisoryEmoji + ' ' + country.advisoryLabel + '</span>' +
               '<span>' + country.language + '</span>' +
               '<span>' + country.currency + '</span>' +
               '</div>' +
               '</div>';
      }).join('') : '<div style="padding:18px;color:var(--muted);font-size:14px;text-align:center;">No countries found. Try a different search term.</div>';
    }
  }

  function renderPickerList(list) {
    list = list || window.allCountries || [];
    var picker = document.getElementById('cplist');
    if (!picker) return;
    picker.innerHTML = list.length ? list.map(function(country){
      var pinned = (window.pinnedCountries || []).includes(country.code);
      return '<div class="ccard" data-code="' + country.code + '" style="padding:14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;">' +
             '<div>' +
             '<div style="font-size:15px;font-weight:700;">' + country.flag + ' ' + country.name + '</div>' +
             '<div style="font-size:12px;color:var(--dm);margin-top:4px;">' + country.advisoryLabel + ' · ' + country.capital + '</div>' +
             '</div>' +
             '<button style="border:none;padding:8px 10px;border-radius:12px;background:' + (pinned ? 'var(--teal)' : 'rgba(14,116,144,0.12)') + ';color:' + (pinned ? '#fff' : 'var(--text)') + ';font-size:13px;">' + (pinned ? 'Pinned' : 'Pin') + '</button>' +
             '</div>';
    }).join('') : '<div style="padding:18px;color:var(--muted);font-size:14px;text-align:center;">Search for a country by name or code.</div>';
  }

  function savePinnedCountries() {
    try { localStorage.setItem('atlas_pinned_countries', JSON.stringify(window.pinnedCountries || [])); } catch (e) {}
    renderCountryBrowser();
    renderPickerList();
  }

  function togglePinnedCountry(code) {
    window.pinnedCountries = window.pinnedCountries || [];
    var wasPinned = window.pinnedCountries.includes(code);
    if (wasPinned) {
      window.pinnedCountries = window.pinnedCountries.filter(function(item){ return item !== code; });
    } else {
      window.pinnedCountries.push(code);
    }
    savePinnedCountries();
    if (!wasPinned && typeof setActiveCountry === 'function') {
      var country = (window.allCountries || []).find(function(c){ return c.code === code; });
      if (country && Array.isArray(country.center) && country.center.length === 2) {
        setActiveCountry(code, { lat: country.center[0], lng: country.center[1] });
      } else {
        setActiveCountry(code, window.activeCountryPos || getFeedLocation());
      }
    }
  }

  function filterCountries(query) {
    query = String(query || '').trim().toLowerCase();
    if (!window.allCountries || !window.allCountries.length) return;
    var filtered = window.allCountries.filter(function(country) {
      return country.name.toLowerCase().indexOf(query) >= 0 || country.code.toLowerCase().indexOf(query) >= 0 || country.capital.toLowerCase().indexOf(query) >= 0;
    });
    renderCountryBrowser(filtered);
    renderPickerList(filtered);
  }

  function loadCountries() {
    if (window.allCountries && window.allCountries.length) {
      renderCountryBrowser();
      renderPickerList();
      return;
    }
    fetch('/api/countries').then(function(r){ return r.json(); }).then(function(data){
      window.allCountries = Array.isArray(data) ? data : [];
      renderCountryBrowser();
      renderPickerList();
    }).catch(function(){
      window.allCountries = window.allCountries || [];
      renderCountryBrowser();
      renderPickerList();
    });
  }

  window.togglePinnedCountry = window.togglePinnedCountry || togglePinnedCountry;
  window.filterCountries = window.filterCountries || filterCountries;
  window.loadCountries = window.loadCountries || loadCountries;
  window.pinnedCountries = window.pinnedCountries || JSON.parse(localStorage.getItem('atlas_pinned_countries') || '[]');

  document.addEventListener('DOMContentLoaded', function() {
    if (typeof loadCountries === 'function') loadCountries();
  });

  document.addEventListener('click', function(e) {
    var card = e.target.closest('[data-code], .ccard, .country-card, .cpcard');
    if (!card) return;
    var code = card.dataset.code || card.getAttribute('data-code');
    if (code && typeof setActiveCountry === 'function') setActiveCountry(code);
  });
})();
