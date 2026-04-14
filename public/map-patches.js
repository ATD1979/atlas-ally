window.map = L.map('map', {
  center: [20, 10],
  zoom: 2,
  zoomControl: false,
  attributionControl: false
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(window.map);
L.control.zoom({position: 'bottomright'}).addTo(window.map);
L.control.attribution({position: 'bottomleft', prefix: false}).addAttribution('© <a href="https://openstreetmap.org">OSM</a>').addTo(window.map);

/* PATCH: Temperature gradient overlay */
(function(){
  var tempCircle = null;
  var tempLabel  = null;

  function getColor(temp){
    if(temp <= 0)  return '#3B9FE8';
    if(temp <= 10) return '#74C0F5';
    if(temp <= 20) return '#90D4A0';
    if(temp <= 30) return '#F5C842';
    if(temp <= 40) return '#F58C2A';
    return '#E83B3B';
  }

  window.showTempOverlay = function(lat, lng, temp){
    if(typeof window.map === 'undefined') return;
    if(tempCircle){ window.map.removeLayer(tempCircle); tempCircle = null; }
    if(tempLabel){  window.map.removeLayer(tempLabel);  tempLabel  = null; }
    var color = getColor(temp);
    tempCircle = L.circle([lat, lng], {
      radius: 150000,
      color: color, fillColor: color, fillOpacity: 0.15, weight: 2, opacity: 0.6
    }).addTo(window.map);
    tempLabel = L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="background:'+color+';color:#fff;font-family:monospace;font-size:13px;font-weight:700;padding:4px 8px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">'+Math.round(temp)+'°C</div>',
        iconAnchor: [30, 0]
      })
    }).addTo(window.map);
  };

  window.map.on('click', function(e){
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
})();

/* PATCH: Flame button GPS temp */
(function(){
  var _active   = false;
  var _interval = null;

  function updateGpsTemp(){
    navigator.geolocation.getCurrentPosition(function(pos){
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      fetch('/api/weather/point?lat='+lat+'&lng='+lng)
        .then(function(r){ return r.json(); })
        .then(function(d){ if(d.temp !== undefined) window.showTempOverlay(lat, lng, d.temp); })
        .catch(function(){});
    });
  }

  window.handleFlameBtn = function(){
    var btn = document.getElementById('heatmap-toggle');
    if(!_active){
      _active = true;
      if(btn){ btn.style.background = '#0E7490'; btn.style.color = 'white'; }
      updateGpsTemp();
      _interval = setInterval(updateGpsTemp, 30000);
    } else {
      _active = false;
      clearInterval(_interval);
      if(btn){ btn.style.background = 'rgba(255,255,255,0.97)'; btn.style.color = ''; }
    }
  };

  function bindFlameButton(){
    var btn = document.getElementById('heatmap-toggle');
    if(btn){ btn.removeAttribute('onclick'); btn.addEventListener('click', window.handleFlameBtn); }
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindFlameButton);
  } else {
    bindFlameButton();
  }
})();

/* PATCH: Map click to detect country */
(function(){
  function register(){
    if(typeof window.setActiveCountry === 'undefined') return setTimeout(register, 300);
    window.map.on('click', async function(e){
      var lat = e.latlng.lat, lng = e.latlng.lng;
      try {
        var res = await fetch('/api/detect-country', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({lat: lat, lng: lng})
        });
        var data = await res.json();
        if(data && data.country_code){
          window.setActiveCountry(data.country_code, { lat: lat, lng: lng });
          if(typeof toast === 'function')
            toast('📍 ' + ((data.country && data.country.name) ? data.country.name : data.country_code), 'ok');
        }
      } catch(err){}
    });
  }
  register();
})();

/* PATCH: Fix map zoom to fill screen — corrected for mobile */
(function(){
  function atlasFit(){
    if(typeof window.map === 'undefined') return;
    var w = window.innerWidth;
    // Zoom so the world fills the screen width exactly once (no repeating)
    // At zoom 1, one world tile = 512px. At zoom 2 = 1024px etc.
    // We want: 256 * 2^z = w  =>  z = log2(w/256)
    var z = Math.log2(w / 256);
    // Clamp: never below 1.8 (prevents repeat), never above 3
    z = Math.max(1.8, Math.min(z, 3));
    window.map.options.zoomSnap = 0.1;
    window.map.setMinZoom(z); // prevent zooming out past this
    window.map.setMaxBounds(null);
    window.map.setView([20, 10], z, {animate: false});
  }

  setTimeout(atlasFit, 300);
  setTimeout(atlasFit, 1000);
  setTimeout(atlasFit, 2500);
  window.addEventListener('resize', function(){ setTimeout(atlasFit, 200); });
})();

/* PATCH: Fix map canvas background */
(function(){
  function fixBg(){
    var lc = document.querySelector('.leaflet-container');
    if(lc) lc.style.background = '#a8d0e0';
    var mapEl = document.getElementById('map');
    if(mapEl) mapEl.style.background = '#a8d0e0';
  }
  setTimeout(fixBg, 300);
  setTimeout(fixBg, 1200);
})();

/* PATCH: Invalidate map size after render */
(function(){
  function fixSize(){
    if(typeof window.map !== 'undefined') window.map.invalidateSize({reset: true});
  }
  setTimeout(fixSize, 800);
  setTimeout(fixSize, 2000);
  window.addEventListener('resize', function(){ setTimeout(fixSize, 200); });
})();
