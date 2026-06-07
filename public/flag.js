// Atlas Ally — country flag image helper.
// Windows fonts (Segoe UI Emoji) don't render regional-indicator flag emoji,
// so we serve real SVGs from /flags/. Falls back to the country code via the
// img alt attribute if an asset is missing (zero-JS, same as old behaviour).
(function () {
  window.flagImg = function (code, size) {
    var px = size || 22;
    if (!code) {
      return '<span style="display:inline-block;width:' + px + 'px;text-align:center;">\uD83C\uDF0D</span>';
    }
    var c = String(code).toLowerCase();
    return '<img class="flag" src="/flags/' + c + '.svg" alt="' + String(code).toUpperCase() + '" loading="lazy" ' +
      'style="width:' + px + 'px;height:' + (px * 0.75) + 'px;border-radius:4px;' +
      'border:0.5px solid rgba(0,0,0,0.18);object-fit:cover;vertical-align:middle;display:inline-block;" />';
  };
})();
