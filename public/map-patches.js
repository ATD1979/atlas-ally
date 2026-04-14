/* PATCH: Temperature gradient overlay */
(function(){
  var tempCircle = null;
  var tempLabel = null;

  function getColor(temp){
    if(temp <= 0) return '#3B9FE8';
    if(temp <= 10) return '#74C0F5';
    if(temp <= 20) return '#90D4A0';
    if(temp <= 30) return '#F5C842';
    if(temp <= 40) return '#F58C2A';
    return '#E83B3B';
  }

  window.showTempOverlay = function(lat, lng, temp){
    if(typeof window.map === 'undefined') return;
    if(tempCircle){ map.removeLayer(tempCircle); tempCircle = null; }
    if(tempLabel){ map.removeLayer(tempLabel); tempLabel = null; }
    var color = getColor(temp);
    tempCircle = L.circle([lat, lng], {
      radius: 150000,
      color: color,
      fillColor: color,
      fillOpacity: 0.15,
      weight: 2,
      opacity: 0.6
    }).addTo(map);
    tempLabel = L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="background:'+color+';color:#fff;font-family:monospace;font-size:13px;font-weight:700;padding:4px 8px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">'+Math.round(temp)+'°C</div>',
        iconAnchor: [30, 0]
      })
    }).addTo(map);
  };

  function waitForMap(){
    if(typeof window.map === 'undefined') return setTimeout(waitForMap, 500);
    map.on('click', function(e){
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      fetch('/api/weather/point?lat='+lat+'&lng='+lng)
        .then(function(r){ return r.json(); })
        .then(function(d){
          var temp = d && d.temp !== undefined ? d.temp : d && d.temperature;
          if(temp === undefined || temp === null) return;
          window.showTempOverlay(lat, lng, temp);
        })
        .catch(function(){});
    });
  }
  setTimeout(waitForMap, 1000);
})();

/* PATCH: Flame button GPS temp + heatmap toggle */
var _tempGpsActive = false;
var _tempGpsInterval = null;

function handleFlameBtn(){
  if(!_tempGpsActive){
    _tempGpsActive = true;
    document.getElementById('heatmap-toggle').style.background = '#0E7490';
    document.getElementById('heatmap-toggle').style.color = 'white';
    function updateGpsTemp(){
      navigator.geolocation.getCurrentPosition(function(pos){
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        fetch('/api/weather/point?lat='+lat+'&lng='+lng)
          .then(function(r){ return r.json(); })
          .then(function(d){
            if(d.temp !== undefined) window.showTempOverlay(lat, lng, d.temp);
          }).catch(function(){});
      });
    }
    updateGpsTemp();
    _tempGpsInterval = setInterval(updateGpsTemp, 30000);
  } else {
    _tempGpsActive = false;
    clearInterval(_tempGpsInterval);
    document.getElementById('heatmap-toggle').style.background = 'rgba(255,255,255,0.97)';
    document.getElementById('heatmap-toggle').style.color = '';
    if(typeof window.map !== 'undefined' && tempCircle){ map.removeLayer(tempCircle); tempCircle = null; }
    if(typeof window.map !== 'undefined' && tempLabel){ map.removeLayer(tempLabel); tempLabel = null; }
  }
}

// Override flame button click
document.addEventListener('DOMContentLoaded', function(){
  var btn = document.getElementById('heatmap-toggle');
  if(btn) btn.onclick = handleFlameBtn;
});

/* === PATCH: Map click to detect country === */
(function waitForMap() {
  if (typeof map === 'undefined' || typeof setActiveCountry === 'undefined') {
    return setTimeout(waitForMap, 300);
  }
  map.on('click', async function(e) {
    var lat = e.latlng.lat, lng = e.latlng.lng;
    try {
      var res = await fetch('/api/detect-country', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({lat: lat, lng: lng})
      });
      var data = await res.json();
      if (data && data.country_code) {
        if (typeof myCountries !== 'undefined' && !myCountries.includes(data.country_code))
          myCountries.push(data.country_code);
        setActiveCountry(data.country_code);
        if (typeof toast === 'function')
          toast('📍 ' + ((data.country && data.country.name) ? data.country.name : data.country_code), 'ok');
      }
    } catch(err) {}
  });
})();

/* === PATCH: Country panel card click to select country === */
(function waitForPanel() {
  if (typeof setActiveCountry === 'undefined') return setTimeout(waitForPanel, 500);
  document.addEventListener('click', function(e) {
    var card = e.target.closest('[data-code], .ccard, .country-card, .cpcard');
    if (!card) return;
    var code = card.dataset.code || card.getAttribute('data-code');
    if (code && typeof setActiveCountry === 'function') setActiveCountry(code);
  });

  if (typeof openCountryDetail === 'function') {
    var _origDetail = openCountryDetail;
    window.openCountryDetail = function(code) {
      if (code && typeof setActiveCountry === 'function') setActiveCountry(code);
      return _origDetail.apply(this, arguments);
    };
  }
})();

/* === PATCH: Fix map zoom to fill screen === */
(function() {
  var _atlasFit = function() {
    if (typeof window.map === 'undefined') return;
    map.options.zoomSnap = 0;
    map.setMaxBounds(null);
    map._limitZoom = function(z) { return z; };
    var w = window.innerWidth;
    var z = Math.max(1, Math.log2(w / 256));
    map.setMinZoom(z);
    map.setView([20, 0], z, {animate: false});
  };
  setTimeout(_atlasFit, 600);
  setTimeout(_atlasFit, 1500);
  setTimeout(_atlasFit, 3500);
  window.addEventListener('resize', function() { setTimeout(_atlasFit, 200); });
})();

/* === PATCH: Fix map canvas background to match ocean === */
(function() {
  function fixBg() {
    var lc = document.querySelector('.leaflet-container');
    if (lc) lc.style.background = '#a8d0e0';
    var mapEl = document.getElementById('map');
    if (mapEl) mapEl.style.background = '#a8d0e0';
  }
  setTimeout(fixBg, 300);
  setTimeout(fixBg, 1200);
})();

/* === PATCH: Fix map size === */
(function(){
  function fixSize(){
    var mw = document.getElementById('map-wrap');
    var m = document.getElementById('map');
    if(!mw || !m) return setTimeout(fixSize, 300);
    if(typeof window.map !== 'undefined'){
      window.map.invalidateSize({reset:true});
    }
  }
  setTimeout(fixSize, 800);
  setTimeout(fixSize, 2000);
})();

/* === PATCH: Fix map float and pixelation === */
(function(){
  function patchMap(){
    if(typeof window.map==='undefined'||!window.map._loaded) return setTimeout(patchMap,500);
    map.options.worldCopyJump=true;
    map.invalidateSize({reset:true});
    map.eachLayer(function(l){
      if(l instanceof L.TileLayer){
        l.options.maxNativeZoom=19;
        l.options.detectRetina=true;
        l.redraw();
      }
    });
  }
  setTimeout(patchMap,1000);
  setTimeout(patchMap,3000);
})();

