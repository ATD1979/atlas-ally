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

  function showTempOverlay(lat, lng, temp){
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
  }

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
          showTempOverlay(lat, lng, temp);
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
            if(d.temp !== undefined) showTempOverlay(lat, lng, d.temp);
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
    if(tempCircle){ map.removeLayer(tempCircle); tempCircle = null; }
    if(tempLabel){ map.removeLayer(tempLabel); tempLabel = null; }
  }
}

// Override flame button click
document.addEventListener('DOMContentLoaded', function(){
  var btn = document.getElementById('heatmap-toggle');
  if(btn) btn.onclick = handleFlameBtn;
});
