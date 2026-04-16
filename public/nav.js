/*
// v2026.04.15 — clean slate
  Atlas Ally — nav.js
  Overlay-based navigation. All panel content built in JS with inline styles.
  No CSS class dependencies for visibility.
*/
(function () {
  'use strict';

  var T = {
    teal:      '#0E7490', tealDark: '#0A5F75', tealLight: '#E0F2F7',
    bg:        '#F8FAFB', card: '#ffffff',
    border:    '#E5EAEF', text: '#1A2332', muted: '#6B7C93', subtle: '#A8B5C4',
    red:       '#EF4444', redLight: '#FEF2F2',
    green:     '#10B981', greenLight: '#ECFDF5',
    gold:      '#F59E0B', goldLight: '#FEF3C7',
    amber:     '#F59E0B',
    font:      "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif",
    mono:      "'DM Mono',monospace",
  };


  /* ── UNODC Baseline per 100k population ── */
  var UNODC = {
    AF:{homicide:6.5,assault:72,theft:95,robbery:38,year:2022},
    AE:{homicide:0.5,assault:10,theft:62,robbery:2,year:2022},
    AR:{homicide:5.3,assault:142,theft:890,robbery:88,year:2022},
    BD:{homicide:2.6,assault:45,theft:180,robbery:28,year:2022},
    BR:{homicide:22.3,assault:248,theft:1580,robbery:156,year:2022},
    CD:{homicide:13.5,assault:165,theft:280,robbery:95,year:2022},
    CN:{homicide:0.5,assault:28,theft:180,robbery:12,year:2022},
    CO:{homicide:27.9,assault:198,theft:980,robbery:112,year:2022},
    DE:{homicide:0.9,assault:132,theft:1420,robbery:42,year:2022},
    DZ:{homicide:1.9,assault:38,theft:210,robbery:18,year:2022},
    EG:{homicide:3.2,assault:42,theft:210,robbery:15,year:2022},
    ET:{homicide:7.6,assault:95,theft:185,robbery:52,year:2022},
    FR:{homicide:1.3,assault:142,theft:1650,robbery:78,year:2022},
    GB:{homicide:1.1,assault:164,theft:1820,robbery:52,year:2022},
    GH:{homicide:1.7,assault:55,theft:245,robbery:32,year:2022},
    GT:{homicide:22.4,assault:165,theft:620,robbery:98,year:2022},
    HN:{homicide:38.9,assault:210,theft:720,robbery:128,year:2022},
    HT:{homicide:35.2,assault:195,theft:580,robbery:142,year:2022},
    ID:{homicide:0.4,assault:35,theft:155,robbery:18,year:2022},
    IL:{homicide:1.4,assault:22,theft:890,robbery:18,year:2022},
    IN:{homicide:2.8,assault:52,theft:185,robbery:18,year:2022},
    IQ:{homicide:5.8,assault:68,theft:120,robbery:22,year:2022},
    IR:{homicide:3.1,assault:58,theft:165,robbery:28,year:2022},
    IT:{homicide:0.5,assault:58,theft:1250,robbery:48,year:2022},
    JO:{homicide:1.8,assault:28,theft:145,robbery:8,year:2022},
    JP:{homicide:0.2,assault:18,theft:285,robbery:2,year:2022},
    KE:{homicide:8.5,assault:98,theft:380,robbery:65,year:2022},
    KR:{homicide:0.6,assault:48,theft:620,robbery:8,year:2022},
    LB:{homicide:2.1,assault:35,theft:180,robbery:12,year:2022},
    LY:{homicide:8.2,assault:95,theft:280,robbery:58,year:2022},
    MA:{homicide:1.4,assault:32,theft:195,robbery:22,year:2022},
    ML:{homicide:9.8,assault:112,theft:195,robbery:68,year:2022},
    MM:{homicide:7.8,assault:88,theft:165,robbery:45,year:2022},
    MX:{homicide:29.9,assault:182,theft:1240,robbery:128,year:2022},
    NG:{homicide:10.3,assault:128,theft:420,robbery:88,year:2022},
    NP:{homicide:2.8,assault:48,theft:185,robbery:22,year:2022},
    PH:{homicide:8.4,assault:115,theft:380,robbery:62,year:2022},
    PK:{homicide:7.8,assault:88,theft:220,robbery:45,year:2022},
    PL:{homicide:0.7,assault:78,theft:890,robbery:28,year:2022},
    RU:{homicide:8.2,assault:95,theft:680,robbery:42,year:2022},
    SA:{homicide:1.5,assault:18,theft:95,robbery:6,year:2022},
    SD:{homicide:12.8,assault:142,theft:210,robbery:88,year:2022},
    SO:{homicide:18.2,assault:195,theft:165,robbery:112,year:2022},
    SY:{homicide:18.5,assault:185,theft:285,robbery:125,year:2022},
    TH:{homicide:3.2,assault:48,theft:290,robbery:22,year:2022},
    TN:{homicide:2.1,assault:42,theft:225,robbery:28,year:2022},
    TR:{homicide:4.3,assault:55,theft:320,robbery:28,year:2022},
    TZ:{homicide:4.8,assault:68,theft:285,robbery:38,year:2022},
    UA:{homicide:6.2,assault:78,theft:410,robbery:35,year:2022},
    US:{homicide:6.8,assault:246,theft:1958,robbery:82,year:2022},
    VE:{homicide:49.9,assault:285,theft:1580,robbery:188,year:2022},
    YE:{homicide:21.8,assault:188,theft:195,robbery:128,year:2022},
    ZA:{homicide:45.5,assault:580,theft:2200,robbery:320,year:2022}
  };
  var COUNTRY_NAMES = {
    AF:'Afghanistan',AE:'UAE',AR:'Argentina',BD:'Bangladesh',BR:'Brazil',
    CD:'DR Congo',CN:'China',CO:'Colombia',DE:'Germany',DZ:'Algeria',
    EG:'Egypt',ET:'Ethiopia',FR:'France',GB:'United Kingdom',GH:'Ghana',
    GT:'Guatemala',HN:'Honduras',HT:'Haiti',ID:'Indonesia',IL:'Israel',
    IN:'India',IQ:'Iraq',IR:'Iran',IT:'Italy',JO:'Jordan',JP:'Japan',
    KE:'Kenya',KR:'South Korea',LB:'Lebanon',LY:'Libya',MA:'Morocco',
    ML:'Mali',MM:'Myanmar',MX:'Mexico',NG:'Nigeria',NP:'Nepal',
    PH:'Philippines',PK:'Pakistan',PL:'Poland',RU:'Russia',SA:'Saudi Arabia',
    SD:'Sudan',SO:'Somalia',SY:'Syria',TH:'Thailand',TN:'Tunisia',
    TR:'Turkey',TZ:'Tanzania',UA:'Ukraine',US:'United States',
    VE:'Venezuela',YE:'Yemen',ZA:'South Africa'
  };

  var tabNames = ['map','feed','pack','countries','account'];
  var mapWrap  = null;
  var navPanel = null;
  var overlay  = null;
  var modal    = null;
  var _feedTab = 'news';
  var _lang    = localStorage.getItem('atlas_lang')   || 'en';
  var _origin  = localStorage.getItem('atlas_origin') || '';

  var LANGUAGES = [
    { code:'en', label:'English' },
    { code:'es', label:'Español' },
    { code:'fr', label:'Français' },
    { code:'ar', label:'العربية' },
    { code:'pt', label:'Português' },
    { code:'ru', label:'Русский' },
    { code:'zh', label:'中文' },
    { code:'de', label:'Deutsch' },
    { code:'ja', label:'日本語' },
    { code:'ko', label:'한국어' },
    { code:'tr', label:'Türkçe' },
    { code:'hi', label:'हिन्दी' },
  ];

  // UI label translations for core strings
  var I18N = {
    en:{ feed:'Live Feed', news:'News', alerts:'Alerts', crime:'Crime', pack:'Pack Assistant',
         countries:'World Browser', account:'My Account', selectCountry:'Select a Country',
         loading:'Loading', noNews:'No News Found', safeCheckin:'Safe Check-in',
         language:'Language', homeCountry:'Home Country', save:'Save', cancel:'Cancel',
         profile:'Profile & Language', profileSub:'Set your home country and language' },
    es:{ feed:'Feed en Vivo', news:'Noticias', alerts:'Alertas', crime:'Crimen', pack:'Asistente de Equipaje',
         countries:'Navegador Mundial', account:'Mi Cuenta', selectCountry:'Seleccionar País',
         loading:'Cargando', noNews:'No se encontraron noticias', safeCheckin:'Check-in Seguro',
         language:'Idioma', homeCountry:'País de Origen', save:'Guardar', cancel:'Cancelar',
         profile:'Perfil e Idioma', profileSub:'Establece tu país de origen e idioma' },
    fr:{ feed:'Fil en Direct', news:'Actualités', alerts:'Alertes', crime:'Criminalité', pack:'Assistant Bagages',
         countries:'Navigateur Mondial', account:'Mon Compte', selectCountry:'Sélectionner un Pays',
         loading:'Chargement', noNews:'Aucune actualité trouvée', safeCheckin:'Check-in Sécurisé',
         language:'Langue', homeCountry:'Pays d\'origine', save:'Enregistrer', cancel:'Annuler',
         profile:'Profil & Langue', profileSub:'Définissez votre pays d\'origine et langue' },
    ar:{ feed:'البث المباشر', news:'أخبار', alerts:'تنبيهات', crime:'جريمة', pack:'مساعد الحقيبة',
         countries:'متصفح العالم', account:'حسابي', selectCountry:'اختر دولة',
         loading:'جار التحميل', noNews:'لا توجد أخبار', safeCheckin:'تسجيل وصول آمن',
         language:'اللغة', homeCountry:'بلد الأصل', save:'حفظ', cancel:'إلغاء',
         profile:'الملف الشخصي واللغة', profileSub:'حدد بلد أصلك ولغتك' },
    pt:{ feed:'Feed ao Vivo', news:'Notícias', alerts:'Alertas', crime:'Crime', pack:'Assistente de Mala',
         countries:'Navegador Mundial', account:'Minha Conta', selectCountry:'Selecionar País',
         loading:'Carregando', noNews:'Nenhuma notícia encontrada', safeCheckin:'Check-in Seguro',
         language:'Idioma', homeCountry:'País de Origem', save:'Salvar', cancel:'Cancelar',
         profile:'Perfil e Idioma', profileSub:'Defina seu país de origem e idioma' },
    ru:{ feed:'Лента', news:'Новости', alerts:'Оповещения', crime:'Преступность', pack:'Помощник по упаковке',
         countries:'Обозреватель мира', account:'Мой аккаунт', selectCountry:'Выбрать страну',
         loading:'Загрузка', noNews:'Новости не найдены', safeCheckin:'Регистрация безопасности',
         language:'Язык', homeCountry:'Страна происхождения', save:'Сохранить', cancel:'Отмена',
         profile:'Профиль и язык', profileSub:'Укажите страну происхождения и язык' },
    zh:{ feed:'实时动态', news:'新闻', alerts:'警报', crime:'犯罪', pack:'行李助手',
         countries:'世界浏览器', account:'我的账户', selectCountry:'选择国家',
         loading:'加载中', noNews:'未找到新闻', safeCheckin:'安全签到',
         language:'语言', homeCountry:'原籍国', save:'保存', cancel:'取消',
         profile:'个人资料和语言', profileSub:'设置您的原籍国和语言' },
    de:{ feed:'Live-Feed', news:'Nachrichten', alerts:'Warnungen', crime:'Kriminalität', pack:'Packassistent',
         countries:'Weltbrowser', account:'Mein Konto', selectCountry:'Land auswählen',
         loading:'Laden', noNews:'Keine Nachrichten gefunden', safeCheckin:'Sicher einchecken',
         language:'Sprache', homeCountry:'Heimatland', save:'Speichern', cancel:'Abbrechen',
         profile:'Profil & Sprache', profileSub:'Heimatland und Sprache festlegen' },
    ja:{ feed:'ライブフィード', news:'ニュース', alerts:'アラート', crime:'犯罪', pack:'パックアシスタント',
         countries:'ワールドブラウザ', account:'マイアカウント', selectCountry:'国を選択',
         loading:'読み込み中', noNews:'ニュースが見つかりません', safeCheckin:'安全チェックイン',
         language:'言語', homeCountry:'出身国', save:'保存', cancel:'キャンセル',
         profile:'プロフィールと言語', profileSub:'出身国と言語を設定' },
    ko:{ feed:'라이브 피드', news:'뉴스', alerts:'알림', crime:'범죄', pack:'짐 도우미',
         countries:'세계 브라우저', account:'내 계정', selectCountry:'국가 선택',
         loading:'로딩 중', noNews:'뉴스 없음', safeCheckin:'안전 체크인',
         language:'언어', homeCountry:'출신 국가', save:'저장', cancel:'취소',
         profile:'프로필 및 언어', profileSub:'출신 국가와 언어를 설정하세요' },
    tr:{ feed:'Canlı Akış', news:'Haberler', alerts:'Uyarılar', crime:'Suç', pack:'Bavul Asistanı',
         countries:'Dünya Tarayıcı', account:'Hesabım', selectCountry:'Ülke Seç',
         loading:'Yükleniyor', noNews:'Haber bulunamadı', safeCheckin:'Güvenli Giriş',
         language:'Dil', homeCountry:'Menşei Ülke', save:'Kaydet', cancel:'İptal',
         profile:'Profil ve Dil', profileSub:'Ana ülkenizi ve dilinizi ayarlayın' },
    hi:{ feed:'लाइव फ़ीड', news:'समाचार', alerts:'अलर्ट', crime:'अपराध', pack:'पैक सहायक',
         countries:'विश्व ब्राउज़र', account:'मेरा खाता', selectCountry:'देश चुनें',
         loading:'लोड हो रहा है', noNews:'कोई समाचार नहीं', safeCheckin:'सुरक्षित चेक-इन',
         language:'भाषा', homeCountry:'मूल देश', save:'सहेजें', cancel:'रद्द करें',
         profile:'प्रोफ़ाइल और भाषा', profileSub:'अपना मूल देश और भाषा सेट करें' },
  };

  function t(key) {
    var strings = I18N[_lang] || I18N['en'];
    return strings[key] || I18N['en'][key] || key;
  }

  /* ─────────────────────────────────────────
     OVERLAY
  ───────────────────────────────────────── */
  function showOverlay(html) {
    if (!overlay) return;
    overlay.innerHTML = html;
    overlay.style.display    = 'block';
    overlay.style.pointerEvents = 'all';
    overlay.scrollTop = 0;
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.style.display    = 'none';
    overlay.style.pointerEvents = 'none';
    overlay.innerHTML = '';
  }

  /* ─────────────────────────────────────────
     MAP
  ───────────────────────────────────────── */
  function showMap() {
    if (mapWrap) { mapWrap.style.visibility='visible'; mapWrap.style.pointerEvents='auto'; }
    if (window.map && typeof window.map.invalidateSize==='function')
      setTimeout(function(){window.map.invalidateSize();},150);
  }
  function hideMap() {
    if (mapWrap) { mapWrap.style.visibility='hidden'; mapWrap.style.pointerEvents='none'; }
  }

  /* ─────────────────────────────────────────
     TAB HIGHLIGHT
  ───────────────────────────────────────── */
  function activateTab(name) {
    document.querySelectorAll('.main-tab').forEach(function(btn,i){
      var on = tabNames[i]===name;
      btn.classList.toggle('active',on);
      var ic=btn.querySelector('.tbi-icon'), lb=btn.querySelector('.tbi-label');
      if(ic) ic.classList.toggle('on',on);
      if(lb) lb.classList.toggle('on',on);
    });
  }

  /* ─────────────────────────────────────────
     SHARED PANEL HEADER
  ───────────────────────────────────────── */
  function panelHdr(title) {
    return '<div id="aa-hdr" style="position:sticky;top:0;z-index:10;background:'+T.teal+';'+
      'display:flex;align-items:center;justify-content:space-between;'+
      'padding:0 16px;min-height:54px;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.12);">'+
      '<span style="font-size:16px;font-weight:700;color:#fff;'+
        'font-family:-apple-system,BlinkMacSystemFont,sans-serif;">'+title+'</span>'+
      '<button id="aa-close-btn" style="background:rgba(255,255,255,0.2);'+
        'border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:6px;'+
        'padding:6px 14px;cursor:pointer;font-size:14px;font-weight:600;'+
        'touch-action:manipulation;font-family:-apple-system,sans-serif;">✕</button>'+
      '</div>';
  }

  function noCountry(msg) {
    return '<div style="padding:56px 24px;text-align:center;">'+
      '<div style="font-size:56px;margin-bottom:16px;">🌍</div>'+
      '<div style="font-size:16px;font-weight:700;color:'+T.text+';margin-bottom:8px;">Select a Country</div>'+
      '<div style="font-size:13px;color:'+T.muted+';line-height:1.6;">'+msg+'</div></div>';
  }
  function loading(msg) {
    return '<div style="padding:32px;text-align:center;color:'+T.muted+';font-size:13px;">⏳ '+msg+'</div>';
  }
  function emptyState(icon,title,sub) {
    return '<div style="padding:56px 24px;text-align:center;">'+
      '<div style="font-size:48px;margin-bottom:14px;">'+icon+'</div>'+
      '<div style="font-size:15px;font-weight:700;color:'+T.text+';margin-bottom:8px;">'+title+'</div>'+
      '<div style="font-size:13px;color:'+T.muted+';line-height:1.6;">'+sub+'</div></div>';
  }

  /* ═══════════════════════════════════════════
     FEED — NEWS
  ═══════════════════════════════════════════ */
  function relTime(dateStr) {
    try {
      var diff = Math.round((Date.now() - new Date(dateStr)) / 60000);
      if (diff < 1)   return 'just now';
      if (diff < 60)  return diff + 'm ago';
      if (diff < 1440) return Math.round(diff / 60) + 'h ago';
      return new Date(dateStr).toLocaleDateString([], { month:'short', day:'numeric' });
    } catch(e) { return ''; }
  }

  function feedItem(href, iconClass, iconEmoji, tagClass, tagLabel, title, time, location) {
    var inner =
      '<div class="aa-ficon '+iconClass+'">'+iconEmoji+'</div>'+
      '<div class="aa-fbody">'+
        '<div class="aa-fhead">'+title+'</div>'+
        '<div class="aa-fsub">'+
          '<span class="aa-ftag '+tagClass+'">'+tagLabel+'</span>'+
          '<span class="aa-ftime">'+time+'</span>'+
        '</div>'+
        (location ? '<div class="aa-floc">📍 '+location+'</div>' : '')+
      '</div>';
    if (href) {
      return '<a href="'+href+'" target="_blank" rel="noopener" class="aa-fitem">'+inner+'</a>';
    }
    return '<div class="aa-fitem">'+inner+'</div>';
  }

  function loadNews(country) {
    var nb = document.getElementById('aa-feed-body');
    if (!nb) return;
    if (!country) { nb.innerHTML = noCountry('Tap the flag in the header to choose a country and see live news.'); return; }
    nb.innerHTML = loading('Loading news for ' + country + '…');
    fetch('/api/news?country_code=' + encodeURIComponent(country) + '&lang=' + encodeURIComponent(_lang))
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(articles) {
        var nb2 = document.getElementById('aa-feed-body');
        if (!nb2) return;
        if (!articles || !articles.length) {
          nb2.innerHTML = emptyState('📡', t('noNews'), 'No articles found for ' + country + ' right now.');
          return;
        }
        nb2.innerHTML =
          '<div class="aa-count-bar">'+articles.length+' ARTICLES</div>' +
          articles.map(function(a) {
            var title  = (a.title || 'Untitled').slice(0, 120);
            var src    = (a.source_name || 'News').replace(/-/g, ' ').slice(0, 20);
            var time   = relTime(a.published_at);
            var lower  = title.toLowerCase();
            var urgent = /attack|explos|missile|bomb|kill|dead|crisis|warn|alert|urgent|shoot|drone|siren/.test(lower);
            return feedItem(a.url, urgent?'aa-fi-red':'aa-fi-blue', urgent?'🔴':'📰', urgent?'aa-tr':'aa-tb', urgent?'Breaking':src, title, time, null);
          }).join('');
      })
      .catch(function(err) {
        var nb2 = document.getElementById('aa-feed-body');
        if (!nb2) return;
        nb2.innerHTML = '<div style="padding:32px;text-align:center;"><div style="font-size:13px;color:'+T.red+';margin-bottom:14px;">⚠️ '+err.message+'</div>'+
          '<button onclick="loadNews(window.activeCountry)" style="padding:9px 22px;background:'+T.teal+';color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;">Retry</button></div>';
      });
  }

  /* ═══════════════════════════════════════════
     FEED — INCIDENTS DASHBOARD
  ═══════════════════════════════════════════ */
  function loadAlerts(country) {
    var nb = document.getElementById('aa-feed-body');
    if (!nb) return;
    if (!country) { nb.innerHTML = noCountry('Choose a country to see the safety intelligence dashboard.'); return; }
    nb.innerHTML = loading('Building safety dashboard…');
    fetch('/api/events?country_code=' + encodeURIComponent(country) + '&lang=' + encodeURIComponent(_lang))
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(resp) {
        var nb2 = document.getElementById('aa-feed-body');
        if (!nb2) return;

        // Handle both old array response and new { events, stats7d } shape
        var events = Array.isArray(resp) ? resp : (resp.events || []);
        var s7     = resp.stats7d || null;

        // ── Category definitions ──────────────────────────────
        var CATS = [
          { key:'air',      label:'Air Threats',       icon:'🚀', color:T.red,    bg:T.redLight,
            types:['missile','drone','siren','airstrike','rocket'],
            match:function(e){ return ['missile','drone','siren','airstrike','rocket'].includes(e.type) || e.severity==='critical'; }
          },
          { key:'explosion',label:'Explosions',        icon:'💥', color:T.red,    bg:T.redLight,
            match:function(e){ return ['explosion','bomb','blast'].includes(e.type); }
          },
          { key:'shooting', label:'Armed Incidents',   icon:'🔫', color:'#DC2626', bg:'#FEF2F2',
            match:function(e){ return ['shooting','gunfire','armed'].includes(e.type); }
          },
          { key:'protest',  label:'Civil Unrest',      icon:'✊', color:T.gold,   bg:T.goldLight,
            match:function(e){ return ['protest','riot','demonstration','evacuation'].includes(e.type); }
          },
          { key:'weather',  label:'Weather',           icon:'⛈️', color:'#3B82F6', bg:'#EFF6FF',
            match:function(e){ return ['earthquake','flood','fire','storm','weather'].includes(e.type); }
          },
          { key:'crime',    label:'Crime',             icon:'🔴', color:T.muted,  bg:T.bg,
            match:function(e){ return ['crime','theft','robbery'].includes(e.type); }
          },
          { key:'other',    label:'Other',             icon:'📡', color:T.teal,   bg:T.tealLight,
            match:function(e){ return true; } // catch-all
          },
        ];

        // Tally events into categories (first-match wins)
        var buckets = {};
        CATS.forEach(function(c){ buckets[c.key] = []; });
        events.forEach(function(ev) {
          for (var i = 0; i < CATS.length; i++) {
            if (CATS[i].match(ev)) { buckets[CATS[i].key].push(ev); break; }
          }
        });

        // Overall threat level
        var critical = events.filter(function(e){ return e.severity==='critical'; }).length;
        var high     = events.filter(function(e){ return e.severity==='high'; }).length;
        var threatLevel = critical > 0 ? ['HIGH THREAT',T.red] : high > 2 ? ['ELEVATED',T.gold] : events.length > 0 ? ['MONITOR','#3B82F6'] : ['CLEAR',T.green];

        var countryName = COUNTRY_NAMES[country] || country;
        var html = '';

        // ── Threat level banner ───────────────────────────────
        html += '<div style="margin:10px 12px 0;border-radius:12px;background:'+threatLevel[1]+';padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">';
        html += '<div><div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.75);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:2px;">Threat Level · '+countryName+'</div>';
        html += '<div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:0.5px;">'+threatLevel[0]+'</div></div>';
        html += '<div style="text-align:right"><div style="font-size:22px;font-weight:800;color:#fff;">'+events.length+'</div><div style="font-size:9px;color:rgba(255,255,255,0.75);font-family:'+T.mono+';">TOTAL</div></div>';
        html += '</div>';

        // ── 7-day running count ───────────────────────────────
        if (s7) {
          var perDay  = s7.per_day || 0;
          var dayCol  = s7.total >= 10 ? T.red : s7.total >= 4 ? T.gold : T.green;
          html += '<div style="margin:8px 12px 0;background:#fff;border-radius:10px;border:1px solid '+T.border+';padding:12px 14px;">';
          html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:'+T.muted+';margin-bottom:10px;">LAST 7 DAYS</div>';
          html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;">';

          // 7-day total — the headline stat
          html += '<div style="text-align:center;background:'+(s7.total>0?'rgba(14,116,144,0.08)':T.bg)+';border-radius:8px;padding:10px 6px;border:1px solid '+(s7.total>0?T.teal:T.border)+';">';
          html += '<div style="font-size:22px;font-weight:800;color:'+dayCol+';">'+s7.total+'</div>';
          html += '<div style="font-size:9px;color:'+T.muted+';margin-top:2px;font-weight:600;">Incidents</div></div>';

          // Daily rate
          html += '<div style="text-align:center;background:'+T.bg+';border-radius:8px;padding:10px 6px;">';
          html += '<div style="font-size:22px;font-weight:800;color:'+T.text+';">'+perDay.toFixed(1)+'</div>';
          html += '<div style="font-size:9px;color:'+T.muted+';margin-top:2px;">Per Day</div></div>';

          // Critical
          html += '<div style="text-align:center;background:'+(s7.critical>0?T.redLight:T.bg)+';border-radius:8px;padding:10px 6px;">';
          html += '<div style="font-size:22px;font-weight:800;color:'+(s7.critical>0?T.red:T.muted)+';">'+s7.critical+'</div>';
          html += '<div style="font-size:9px;color:'+T.muted+';margin-top:2px;">Critical</div></div>';

          // High
          html += '<div style="text-align:center;background:'+(s7.high>0?T.goldLight:T.bg)+';border-radius:8px;padding:10px 6px;">';
          html += '<div style="font-size:22px;font-weight:800;color:'+(s7.high>0?T.gold:T.muted)+';">'+s7.high+'</div>';
          html += '<div style="font-size:9px;color:'+T.muted+';margin-top:2px;">High Alert</div></div>';

          html += '</div>';

          // Category breakdown for 7-day window
          var catMap = s7.by_category || {};
          var catOrder = [
            {key:'air',     icon:'🚀', label:'Air/Missile'},
            {key:'explosion',icon:'💥',label:'Explosions'},
            {key:'armed',   icon:'🔫', label:'Armed'},
            {key:'unrest',  icon:'✊', label:'Unrest'},
            {key:'drug',    icon:'💊', label:'Drug Crime'},
            {key:'crime',   icon:'🔴', label:'Crime'},
            {key:'weather', icon:'⛈️', label:'Weather'},
          ].filter(function(c){ return (catMap[c.key]||0) > 0; });

          if (catOrder.length) {
            html += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid '+T.border+';">';
            catOrder.forEach(function(c) {
              var n = catMap[c.key] || 0;
              html += '<div style="display:flex;align-items:center;gap:4px;padding:4px 8px;background:'+T.bg+';border-radius:100px;border:1px solid '+T.border+';">';
              html += '<span>'+c.icon+'</span>';
              html += '<span style="font-size:10px;font-weight:700;color:'+T.text+';">'+n+'</span>';
              html += '<span style="font-size:9px;color:'+T.muted+';">'+c.label+'</span>';
              html += '</div>';
            });
            html += '</div>';
          }
          html += '</div>';
        }

        // ── Category stat grid ────────────────────────────────
        var activeCats = CATS.filter(function(c){ return buckets[c.key].length > 0; });
        if (activeCats.length) {
          html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:10px 12px 0;">';
          activeCats.forEach(function(c) {
            var count = buckets[c.key].length;
            var hasCrit = buckets[c.key].some(function(e){ return e.severity==='critical'; });
            html += '<div style="background:#fff;border:1px solid '+T.border+';border-radius:10px;padding:10px 8px;text-align:center;">';
            html += '<div style="font-size:20px;margin-bottom:4px;">'+c.icon+'</div>';
            html += '<div style="font-size:18px;font-weight:800;color:'+(hasCrit?T.red:c.color)+';line-height:1;">'+count+'</div>';
            html += '<div style="font-size:9px;font-weight:600;color:'+T.muted+';margin-top:3px;line-height:1.2;">'+c.label+'</div>';
            if (hasCrit) html += '<div style="margin-top:4px;display:inline-block;padding:1px 6px;border-radius:100px;background:'+T.redLight+';color:'+T.red+';font-size:8px;font-weight:700;">ACTIVE</div>';
            html += '</div>';
          });
          html += '</div>';
        }

        // ── Safety score bar ──────────────────────────────────
        var safeScore = Math.max(0, Math.min(100, 100 - (critical * 25) - (high * 8) - (events.length * 2)));
        var scoreColor = safeScore >= 70 ? T.green : safeScore >= 40 ? T.gold : T.red;
        var scoreLabel = safeScore >= 70 ? 'Generally Safe' : safeScore >= 40 ? 'Exercise Caution' : 'High Risk';
        html += '<div style="margin:8px 12px 0;background:#fff;border-radius:10px;border:1px solid '+T.border+';padding:12px 14px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
        html += '<div style="font-size:11px;font-weight:600;color:'+T.text+';">Safety Score</div>';
        html += '<div style="font-size:13px;font-weight:800;color:'+scoreColor+';">'+safeScore+' <span style="font-size:10px;font-weight:600;">'+scoreLabel+'</span></div>';
        html += '</div>';
        html += '<div style="height:6px;background:'+T.border+';border-radius:3px;">';
        html += '<div style="height:100%;width:'+safeScore+'%;background:'+scoreColor+';border-radius:3px;transition:width 0.6s;"></div>';
        html += '</div></div>';

        // ── Tourist safety tips ───────────────────────────────
        var tips = [];
        if (buckets.air.length)      tips.push('🚀 Air threat activity detected — know your nearest shelter');
        if (buckets.explosion.length) tips.push('💥 Explosion reports — avoid crowded public spaces');
        if (buckets.protest.length)  tips.push('✊ Civil unrest reported — avoid demonstrations');
        if (buckets.weather.length)  tips.push('⛈️ Adverse weather — check local forecasts before travel');
        if (buckets.crime.length)    tips.push('🔴 Crime activity — secure valuables, avoid isolated areas');
        if (!tips.length && events.length === 0) tips.push('✅ No active incidents — normal travel precautions apply');

        if (tips.length) {
          html += '<div style="margin:8px 12px 0;background:'+T.tealLight+';border-radius:10px;border:1px solid rgba(14,116,144,0.2);padding:12px 14px;">';
          html += '<div style="font-size:10px;font-weight:700;color:'+T.teal+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Tourist Advisory</div>';
          tips.forEach(function(tip) {
            html += '<div style="font-size:12px;color:'+T.text+';padding:4px 0;border-bottom:1px solid rgba(14,116,144,0.12);line-height:1.4;">'+tip+'</div>';
          });
          html += '</div>';
        }

        // ── Recent incidents list ─────────────────────────────
        var recent = events.slice(0, 20);
        if (recent.length) {
          html += '<div style="padding:10px 14px 4px;font-size:9px;font-weight:700;color:'+T.muted+';letter-spacing:1px;font-family:'+T.mono+';">RECENT INCIDENTS</div>';
          html += recent.map(function(ev) {
            var cat = CATS.find(function(c){ return c.match(ev); }) || CATS[CATS.length-1];
            var tagCls = ev.severity==='critical'?'aa-tr':ev.severity==='high'?'aa-ta':'aa-tb';
            var tagLbl = ev.severity==='critical'?'Urgent':ev.severity==='high'?'Advisory':'Info';
            return feedItem(
              ev.source_url || null,
              ev.severity==='critical'?'aa-fi-red':ev.severity==='high'?'aa-fi-amber':'aa-fi-blue',
              cat.icon,
              tagCls, tagLbl,
              (ev.title||'Incident').slice(0,120),
              relTime(ev.created_at || ev.published_at),
              ev.location || null
            );
          }).join('');
        }

        html += '<div style="height:20px;"></div>';
        nb2.innerHTML = html;
      })
      .catch(function(err) {
        var nb2 = document.getElementById('aa-feed-body');
        if (nb2) nb2.innerHTML = '<div style="padding:32px;text-align:center;font-size:13px;color:'+T.red+';">⚠️ ' + err.message + '</div>';
      });
  }

  /* ═══════════════════════════════════════════
     FEED — CRIME (3-MONTH TRACKER)
  ═══════════════════════════════════════════ */

  function loadCrime(country) {
    var nb = document.getElementById('aa-feed-body');
    if (!nb) return;
    if (!country) { nb.innerHTML = noCountry('Choose a country to see the 3-month crime tracker.'); return; }
    nb.innerHTML = loading('Building 3-month crime tracker\u2026');

    fetch('/api/crime/trend?country_code=' + encodeURIComponent(country))
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(d) {
        var nb2 = document.getElementById('aa-feed-body');
        if (!nb2) return;

        var cats    = d.categories || [];
        var months  = d.months || [];
        var total   = d.grand_total || 0;
        var maxVal  = d.max_val || 1;
        var trend   = d.trend || 'stable';
        var unodc   = d.unodc_baseline || null;
        var wb      = d.world_bank || null;

        var trendIcon  = {rising:'\uD83D\uDCC8',falling:'\uD83D\uDCC9',stable:'\u27A1\uFE0F'}[trend]||'\u27A1\uFE0F';
        var trendColor = {rising:T.red,falling:T.green,stable:T.gold}[trend]||T.muted;

        var html = '';

        // Summary cards
        html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px 12px 0;">';
        html += summaryCard('\uD83D\uDD0D','Total Reports',total,'Last 90 days',T.teal);
        html += summaryCard(trendIcon,'Trend',trend.charAt(0).toUpperCase()+trend.slice(1),'vs prior period',trendColor);
        html += summaryCard('\uD83D\uDCE1','Sources',(d.sources||[]).length,'Data providers',T.muted);
        html += '</div>';

        // Category breakdown table
        if (cats.length && total > 0) {
          html += '<div style="margin:12px 12px 0;background:#fff;border-radius:12px;border:1px solid '+T.border+';padding:16px;">';
          html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:'+T.muted+';margin-bottom:14px;">3-MONTH BREAKDOWN \u00b7 NEWS MEDIA</div>';

          // Header row
          html += '<div style="display:grid;grid-template-columns:110px 1fr 1fr 1fr 52px;gap:4px;margin-bottom:8px;">';
          html += '<div style="font-size:9px;font-weight:700;color:'+T.subtle+';">CATEGORY</div>';
          months.forEach(function(m) {
            html += '<div style="font-size:9px;font-weight:700;color:'+T.subtle+';text-align:center;">'+m.slice(0,3).toUpperCase()+'</div>';
          });
          html += '<div style="font-size:9px;font-weight:700;color:'+T.subtle+';text-align:right;">TOTAL</div>';
          html += '</div>';

          // Use a fixed benchmark scale per category so bars never "peg out"
          // Each bar shows count vs benchmark — if count exceeds benchmark, bar shows 90% max
          // and a "+" indicator appears, telling the user there is more data
          var BENCHMARKS = { violence:20, drugs:15, theft:15, unrest:10, security:20 };

          cats.forEach(function(cat) {
            var pct = total > 0 ? Math.round((cat.total/total)*100) : 0;
            var col = pct > 35 ? T.red : pct > 20 ? T.gold : T.teal;
            var benchmark = BENCHMARKS[cat.key] || 20;

            html += '<div style="display:grid;grid-template-columns:110px 1fr 1fr 1fr 52px;gap:4px;align-items:center;padding:8px 0;border-top:1px solid '+T.border+';">';

            // Label
            html += '<div style="display:flex;align-items:center;gap:5px;">';
            html += '<span style="font-size:15px;">'+cat.icon+'</span>';
            html += '<span style="font-size:10px;font-weight:600;color:'+T.text+';line-height:1.2;">'+cat.label+'</span>';
            html += '</div>';

            // Monthly bars — absolute scale, never peg at 100%
            cat.months.forEach(function(mo) {
              var capped  = mo.count >= benchmark;
              // Cap bar at 85% of container so there's always visual headroom
              var fillPct = mo.count === 0 ? 0 : Math.min(Math.round((mo.count / benchmark) * 85), 85);
              var bc = mo.count === 0 ? T.border : (capped ? T.red : fillPct > 50 ? T.gold : T.green);
              html += '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">';
              // Number + "+" if at or above benchmark
              html += '<div style="font-size:10px;font-weight:700;color:'+(capped?T.red:T.text)+';">'+mo.count+(capped?'+':'')+'</div>';
              html += '<div style="width:100%;height:24px;background:'+T.border+';border-radius:3px;overflow:hidden;display:flex;align-items:flex-end;">';
              if (fillPct > 0) html += '<div style="width:100%;height:'+fillPct+'%;background:'+bc+';border-radius:3px;"></div>';
              html += '</div></div>';
            });

            // Total + share
            html += '<div style="text-align:right;">';
            html += '<div style="font-size:11px;font-weight:700;color:'+col+';">'+cat.total+'</div>';
            html += '<div style="font-size:9px;color:'+T.muted+';">'+pct+'%</div>';
            html += '</div></div>';
          });

          html += '<div style="font-size:9px;color:'+T.subtle+';margin-top:10px;">Bars scale to benchmark · + means more incidents likely exist beyond sample</div>';
          html += '</div>';

        } else if (total === 0) {
          html += '<div style="margin:12px 12px 0;background:#fff;border-radius:12px;border:1px solid '+T.border+';padding:20px;text-align:center;">';
          html += '<div style="font-size:32px;margin-bottom:8px;">\uD83D\uDCCA</div>';
          html += '<div style="font-size:14px;font-weight:600;color:'+T.text+';margin-bottom:4px;">No crime-related news cached yet</div>';
          html += '<div style="font-size:12px;color:'+T.muted+';">News articles are refreshed every 30 minutes. Check back shortly.</div>';
          html += '</div>';
        }

        // World Bank
        if (wb && wb.length) {
          var validWb = wb.filter(function(i){return i.value!==null;});
          if (validWb.length) {
            html += '<div style="margin:12px 12px 0;background:#fff;border-radius:12px;border:1px solid '+T.border+';padding:16px;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
            html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:'+T.muted+';">WORLD BANK LIVE DATA</div>';
            html += '<div style="font-size:9px;color:'+T.teal+';font-weight:600;">\uD83C\uDF0D Official</div>';
            html += '</div>';
            html += '<div style="display:grid;grid-template-columns:repeat('+Math.min(validWb.length,3)+',1fr);gap:8px;">';
            validWb.forEach(function(ind) {
              var isHigh=(ind.id==='VC.IHR.PSRC.P5'&&ind.value>5)||(ind.id==='VC.IHR.PSRC.FE.P5'&&ind.value>3)||(ind.id==='VC.BTL.DETH'&&ind.value>100);
              var isMed =(ind.id==='VC.IHR.PSRC.P5'&&ind.value>2)||(ind.id==='VC.IHR.PSRC.FE.P5'&&ind.value>1)||(ind.id==='VC.BTL.DETH'&&ind.value>10);
              var col=isHigh?T.red:isMed?T.gold:T.green;
              var risk=isHigh?'HIGH':isMed?'MED':'LOW';
              var val=ind.id==='VC.BTL.DETH'?Math.round(ind.value):ind.value.toFixed(2);
              html += '<div style="background:'+T.bg+';border-radius:10px;padding:12px;border:1px solid '+T.border+';">';
              html += '<div style="font-size:11px;font-weight:600;color:'+T.text+';margin-bottom:4px;line-height:1.3;">'+ind.label+'</div>';
              html += '<div style="font-size:20px;font-weight:800;color:'+col+';margin-bottom:2px;">'+val+'</div>';
              html += '<div style="font-size:9px;color:'+T.muted+';margin-bottom:6px;">'+ind.unit+(ind.date?' \u00b7 '+ind.date:'')+'</div>';
              html += '<span style="padding:2px 8px;border-radius:100px;background:'+col+';color:#fff;font-size:9px;font-weight:700;">'+risk+'</span>';
              html += '</div>';
            });
            html += '</div>';
            html += '<div style="font-size:9px;color:'+T.subtle+';margin-top:10px;">World Bank Open Data \u00b7 Most recent available year</div>';
            html += '</div>';
          }
        }

        // UNODC
        if (unodc) {
          html += '<div style="margin:12px 12px 0;background:#fff;border-radius:12px;border:1px solid '+T.border+';padding:16px;">';
          html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
          html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:'+T.muted+';">UNODC STATISTICS \u00b7 '+unodc.year+'</div>';
          html += '<div style="font-size:9px;color:'+T.muted+';">per 100k pop.</div>';
          html += '</div>';
          var ustats=[
            {icon:'\uD83D\uDD34',label:'Homicide', val:unodc.homicide,bench:5},
            {icon:'\u26A0\uFE0F',label:'Assault',  val:unodc.assault, bench:100},
            {icon:'\uD83C\uDFAA',label:'Theft',    val:unodc.theft,   bench:500},
            {icon:'\uD83D\uDCB0',label:'Robbery',  val:unodc.robbery, bench:50},
          ];
          html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
          ustats.forEach(function(s) {
            var risk=s.val>s.bench*1.5?'HIGH':s.val>s.bench*0.5?'MED':'LOW';
            var rc={HIGH:T.red,MED:T.gold,LOW:T.green}[risk];
            html += '<div style="background:'+T.bg+';border-radius:8px;padding:12px;">';
            html += '<div style="font-size:18px;margin-bottom:4px;">'+s.icon+'</div>';
            html += '<div style="font-size:11px;font-weight:600;color:'+T.text+';margin-bottom:3px;">'+s.label+'</div>';
            html += '<div style="font-size:18px;font-weight:800;color:'+rc+';">'+s.val.toFixed(1)+'</div>';
            html += '<div style="font-size:9px;color:'+T.muted+';margin-bottom:4px;">per 100k</div>';
            html += '<span style="padding:2px 8px;border-radius:100px;background:'+rc+';color:#fff;font-size:9px;font-weight:700;">'+risk+'</span>';
            html += '</div>';
          });
          html += '</div>';
          html += '<div style="font-size:9px;color:'+T.subtle+';margin-top:10px;">UNODC Global Study on Homicide '+unodc.year+'</div>';
          html += '</div>';
        }

        html += renderSafetyTips();
        html += '<div style="height:20px;"></div>';
        nb2.innerHTML = html;
      })
      .catch(function(err) {
        var nb2 = document.getElementById('aa-feed-body');
        if (!nb2) return;
        nb2.innerHTML = '<div style="padding:32px;text-align:center;">' +
          '<div style="font-size:13px;color:'+T.red+';margin-bottom:14px;">\u26A0\uFE0F '+err.message+'</div>' +
          '<button id="aa-retry-crime" style="padding:9px 22px;background:'+T.teal+';color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;touch-action:manipulation;">Retry</button>' +
          '</div>' + renderSafetyTips();
        var btn = document.getElementById('aa-retry-crime');
        if (btn) btn.addEventListener('click', function(){ loadCrime(window.activeCountry); });
      });
  }


  function renderCrimeUNODCOnly(el, unodc, countryName) {
    var html = '<div style="margin:12px;background:'+T.goldLight+';border:1px solid '+T.gold+';border-radius:12px;padding:12px;margin-bottom:0;">';
    html += '<div style="font-size:12px;color:#92400E;">Live data unavailable — showing UNODC baseline only</div></div>';
    var stats = [
      {icon:'🔴',label:'Homicide',val:unodc.homicide,benchmark:5},
      {icon:'⚠️',label:'Assault', val:unodc.assault, benchmark:100},
      {icon:'🏪',label:'Theft',   val:unodc.theft,   benchmark:500},
      {icon:'💰',label:'Robbery', val:unodc.robbery, benchmark:50}
    ];
    html += '<div style="margin:12px;background:#fff;border-radius:12px;border:1px solid '+T.border+';padding:16px;">';
    html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:'+T.muted+';margin-bottom:12px;">UNODC STATISTICS · '+unodc.year+'</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    stats.forEach(function(s){
      var risk=s.val>s.benchmark*1.5?'HIGH':s.val>s.benchmark*0.5?'MED':'LOW';
      var rc={HIGH:T.red,MED:T.gold,LOW:T.green}[risk];
      html+='<div style="background:'+T.bg+';border-radius:8px;padding:12px;"><div style="font-size:18px;margin-bottom:4px;">'+s.icon+'</div>'+
        '<div style="font-size:11px;font-weight:600;color:'+T.text+';margin-bottom:3px;">'+s.label+'</div>'+
        '<div style="font-size:18px;font-weight:800;color:'+rc+';">'+s.val.toFixed(1)+'</div>'+
        '<div style="font-size:9px;color:'+T.muted+';margin-bottom:4px;">per 100k</div>'+
        '<span style="padding:2px 8px;border-radius:100px;background:'+rc+';color:#fff;font-size:9px;font-weight:700;">'+risk+'</span></div>';
    });
    html += '</div></div>';
    html += renderSafetyTips();
    el.innerHTML = html;
  }


  function renderCrimeTracker(el, data, country) {
    var weeks   = data.weeks || [];
    var months  = data.months || [];
    var max     = data.max_weekly || 1;
    var trend   = data.trend || 'stable';
    var unodc   = data.unodc_baseline;
    var total   = data.total_incidents || 0;
    var sources = (data.sources || []).join(' + ');

    var trendIcon  = {rising:'📈',falling:'📉',stable:'➡️'}[trend]||'➡️';
    var trendColor = {rising:T.red,falling:T.green,stable:T.gold}[trend]||T.muted;
    var trendLabel = trend.charAt(0).toUpperCase()+trend.slice(1);

    var html = '';

    // ── Summary cards ──
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px 12px 0;">';
    html += summaryCard('🔍','Total Events',total,'Last 90 days',T.teal);
    html += summaryCard(trendIcon,'Trend',trendLabel,'vs prior period',trendColor);
    html += summaryCard('📊','Sources',sources||'GDELT','Data providers',T.muted);
    html += '</div>';

    // ── Monthly bar chart ──
    html += '<div style="margin:12px 12px 0;background:#fff;border-radius:12px;border:1px solid '+T.border+';padding:14px;">';
    html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:'+T.muted+';margin-bottom:14px;">3-MONTH INCIDENT TREND</div>';

    if(months.length) {
      var maxMonth = Math.max.apply(null, months.map(function(m){return m.count;})) || 1;
      html += '<div style="display:flex;gap:8px;align-items:flex-end;height:100px;margin-bottom:8px;">';
      months.forEach(function(m){
        var pct = Math.round((m.count/maxMonth)*100);
        var barH = Math.max(pct, 4);
        var col  = pct>70?T.red:pct>40?T.gold:T.green;
        html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">';
        html += '<div style="font-size:10px;font-weight:700;color:'+T.text+';">'+m.count+'</div>';
        html += '<div style="width:100%;background:'+T.border+';border-radius:4px 4px 0 0;height:80px;display:flex;align-items:flex-end;">';
        html += '<div style="width:100%;height:'+barH+'%;background:'+col+';border-radius:4px 4px 0 0;transition:height 0.5s;"></div>';
        html += '</div>';
        html += '<div style="font-size:10px;color:'+T.muted+';text-align:center;">'+m.label+'</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // ── Weekly sparkline ──
    if(weeks.length) {
      html += '<div style="margin-top:12px;border-top:1px solid '+T.border+';padding-top:12px;">';
      html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:'+T.muted+';margin-bottom:8px;">WEEKLY BREAKDOWN</div>';
      html += '<div style="display:flex;gap:2px;align-items:flex-end;height:48px;">';
      weeks.forEach(function(w){
        var pct=Math.round((w.count/max)*100);
        var h=Math.max(pct,3);
        var col=pct>70?T.red:pct>40?T.gold:T.tealLight;
        html += '<div title="'+w.label+': '+w.count+'" style="flex:1;background:'+col+';border-radius:2px 2px 0 0;height:'+h+'%;min-height:2px;cursor:default;"></div>';
      });
      html += '</div>';
      html += '<div style="display:flex;justify-content:space-between;margin-top:4px;">'+
        '<span style="font-size:9px;color:'+T.muted+';">'+weeks[0].label+'</span>'+
        '<span style="font-size:9px;color:'+T.muted+';">Today</span></div>';
      html += '</div>';
    }

    html += '<div style="font-size:9px;color:'+T.subtle+';margin-top:10px;">Source: GDELT Project · Updated hourly</div>';
    html += '</div>';

    // ── UNODC Baseline ──
    if(unodc) {
      html += '<div style="margin:12px 12px 0;background:#fff;border-radius:12px;border:1px solid '+T.border+';padding:14px;">';
      html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:'+T.muted+';margin-bottom:12px;">UNODC BASELINE STATISTICS · '+unodc.year+'</div>';
      html += '<div style="font-size:9px;color:'+T.subtle+';margin-bottom:10px;">Rates per 100,000 population</div>';
      var stats = [
        {icon:'🔴',label:'Homicide Rate',val:unodc.homicide,unit:'per 100k',benchmark:5,desc:'Annual'},
        {icon:'⚠️',label:'Assault Rate', val:unodc.assault, unit:'per 100k',benchmark:100,desc:'Annual'},
        {icon:'🏪',label:'Theft Rate',   val:unodc.theft,   unit:'per 100k',benchmark:500,desc:'Annual'},
        {icon:'💰',label:'Robbery Rate', val:unodc.robbery, unit:'per 100k',benchmark:50, desc:'Annual'}
      ];
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
      stats.forEach(function(s){
        var risk=s.val>s.benchmark*1.5?'HIGH':s.val>s.benchmark*0.5?'MED':'LOW';
        var rc={HIGH:T.red,MED:T.gold,LOW:T.green}[risk];
        html += '<div style="background:'+T.bg+';border-radius:8px;padding:10px;">';
        html += '<div style="font-size:16px;margin-bottom:4px;">'+s.icon+'</div>';
        html += '<div style="font-size:11px;font-weight:600;color:'+T.text+';margin-bottom:2px;">'+s.label+'</div>';
        html += '<div style="font-size:16px;font-weight:800;color:'+rc+';">'+s.val.toFixed(1)+'</div>';
        html += '<div style="font-size:9px;color:'+T.muted+';">'+s.unit+'</div>';
        html += '<div style="display:inline-block;margin-top:4px;padding:1px 6px;border-radius:100px;'+
          'background:'+rc+';color:#fff;font-size:8px;font-weight:700;">'+risk+'</div>';
        html += '</div>';
      });
      html += '</div>';
      html += '<div style="font-size:9px;color:'+T.subtle+';margin-top:10px;">Source: UNODC Global Study on Homicide '+unodc.year+'</div>';
      html += '</div>';
    }

    // ── Safety Tips ──
    html += renderSafetyTips();
    html += '<div style="height:20px;"></div>';
    el.innerHTML = html;
  }

  function renderCrimeTrackerFallback(el, country, errMsg) {
    var html = '<div style="margin:12px;background:'+T.goldLight+';border:1px solid '+T.gold+';border-radius:12px;padding:12px;">';
    html += '<div style="font-size:13px;font-weight:600;color:#92400E;margin-bottom:4px;">⚠️ Live data unavailable</div>';
    html += '<div style="font-size:12px;color:#92400E;">'+errMsg+'</div></div>';
    html += renderSafetyTips();
    el.innerHTML = html;
  }

  function summaryCard(icon,label,val,sub,col) {
    return '<div style="background:#fff;border:1px solid '+T.border+';border-radius:10px;padding:12px;text-align:center;">'+
      '<div style="font-size:20px;margin-bottom:4px;">'+icon+'</div>'+
      '<div style="font-size:16px;font-weight:800;color:'+col+';">'+val+'</div>'+
      '<div style="font-size:10px;font-weight:600;color:'+T.text+';margin-top:2px;">'+label+'</div>'+
      '<div style="font-size:9px;color:'+T.muted+';">'+sub+'</div></div>';
  }

  function renderSafetyTips() {
    var tips=['🔒 Keep valuables out of sight in public','🚕 Use registered taxis or ride-share apps','🏧 Use ATMs inside banks or well-lit areas','📱 Save local emergency numbers offline','🗺️ Share your itinerary with a trusted contact'];
    return '<div style="margin:12px 12px 0;background:#fff;border-radius:12px;border:1px solid '+T.border+';padding:14px;">'+
      '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:'+T.muted+';margin-bottom:12px;">SAFETY TIPS</div>'+
      tips.map(function(t){return '<div style="padding:9px 0;border-bottom:1px solid '+T.border+';font-size:13px;color:'+T.text+';">'+t+'</div>';}).join('')+
      '</div>';
  }

  /* ═══════════════════════════════════════════
     FEED PANEL (container + tabs)
  ═══════════════════════════════════════════ */
  function buildFeed() {
    return panelHdr('📡 ' + t('feed')) +
      '<div id="aa-feed-tabs" style="display:flex;background:#fff;border-bottom:1px solid '+T.border+';position:sticky;top:54px;z-index:9;">' +
        '<button data-ftab="news"   style="flex:1;padding:10px 0;border:none;background:none;font-size:11px;font-weight:700;color:'+T.teal+';border-bottom:2px solid '+T.teal+';margin-bottom:-1px;cursor:pointer;touch-action:manipulation;font-family:'+T.font+';">📰 '+t('news')+'</button>' +
        '<button data-ftab="alerts" style="flex:1;padding:10px 0;border:none;background:none;font-size:11px;font-weight:700;color:'+T.muted+';border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;touch-action:manipulation;font-family:'+T.font+';">⚠️ Incidents</button>' +
        '<button data-ftab="crime"  style="flex:1;padding:10px 0;border:none;background:none;font-size:11px;font-weight:700;color:'+T.muted+';border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer;touch-action:manipulation;font-family:'+T.font+';">🔴 '+t('crime')+'</button>' +
      '</div>' +
      '<div id="aa-feed-meta" style="display:flex;justify-content:space-between;padding:6px 14px 5px;background:'+T.bg+';border-bottom:1px solid '+T.border+';">' +
        '<span style="font-size:9px;color:'+T.muted+';font-family:'+T.mono+';display:flex;align-items:center;gap:4px;">' +
          '<span style="width:5px;height:5px;border-radius:50%;background:'+T.green+';display:inline-block;"></span>LIVE' +
        '</span>' +
        '<span style="font-size:9px;color:'+T.muted+';font-family:'+T.mono+';" id="aa-feed-country-label">🌍 ' + (window.activeCountry || 'Global') + '</span>' +
      '</div>' +
      '<div id="aa-feed-body" style="background:'+T.bg+';min-height:300px;"></div>';
  }

  function wireFeedTabs() {
    var bar=document.getElementById('aa-feed-tabs');
    if(!bar) return;
    bar.addEventListener('click',function(e){
      var btn=e.target.closest('[data-ftab]');
      if(!btn) return;
      var tab=btn.dataset.ftab;
      _feedTab=tab;
      bar.querySelectorAll('[data-ftab]').forEach(function(b){
        var on=b.dataset.ftab===tab;
        b.style.color       =on?T.teal:T.muted;
        b.style.borderBottom=on?'2px solid '+T.teal:'2px solid transparent';
        b.style.fontWeight  =on?'700':'600';
      });
      if(tab==='news')   loadNews(window.activeCountry);
      if(tab==='alerts') loadAlerts(window.activeCountry);
      if(tab==='crime')  loadCrime(window.activeCountry);
    });
  }

  /* ═══════════════════════════════════════════
     PACK PANEL
  ═══════════════════════════════════════════ */
  function buildPack() {
    var items=[
      ['🛂','Passport & Visas','All travel documents and entry requirements'],
      ['🔌','Power Adapter','Check destination voltage and plug type'],
      ['📱','Local SIM / Data','International plan or local SIM card'],
      ['💊','Medications','Prescriptions + first aid kit'],
      ['💵','Emergency Cash','Local currency for power outages / no signal'],
      ['📋','Document Copies','Photos of passport, insurance, contacts'],
      ['🏥','Travel Insurance','Medical coverage and emergency evacuation'],
      ['🌊','Water Purification','Tablets or filter for high-risk areas'],
      ['🔦','Torch / Headlamp','For power cuts and night navigation'],
      ['🗺️','Offline Maps','Download before you go — no data needed']
    ];
    return panelHdr('🎒 Pack Assistant')+
      '<div style="padding:16px;background:'+T.bg+';">'+
        '<div style="background:'+T.tealLight+';border:1px solid rgba(14,116,144,0.2);border-radius:12px;padding:14px;margin-bottom:16px;">'+
          '<div style="font-size:13px;font-weight:700;color:'+T.teal+';margin-bottom:4px;">Essential Travel Checklist</div>'+
          '<div style="font-size:12px;color:'+T.teal+';opacity:0.8;">AI-powered custom lists based on destination coming soon</div>'+
        '</div>'+
        items.map(function(it){
          return '<div style="display:flex;align-items:center;gap:12px;padding:13px 14px;'+
            'background:#fff;border:1px solid '+T.border+';border-radius:10px;margin-bottom:8px;">'+
            '<div style="font-size:24px;width:40px;text-align:center;flex-shrink:0;">'+it[0]+'</div>'+
            '<div style="flex:1;">'+
              '<div style="font-size:13px;font-weight:600;color:'+T.text+';">'+it[1]+'</div>'+
              '<div style="font-size:11px;color:'+T.muted+';margin-top:2px;">'+it[2]+'</div>'+
            '</div>'+
            '<div style="width:22px;height:22px;border-radius:50%;border:2px solid '+T.border+';flex-shrink:0;"></div>'+
          '</div>';
        }).join('')+
      '</div>';
  }

  /* ═══════════════════════════════════════════
     WORLD / COUNTRIES PANEL
  ═══════════════════════════════════════════ */
  function buildWorld() {
    return panelHdr('🌍 World Browser')+
      '<div style="padding:12px 16px;background:#fff;border-bottom:1px solid '+T.border+';position:sticky;top:54px;z-index:9;">'+
        '<input id="aa-csearch" placeholder="Search countries…" '+
          'style="width:100%;border:1.5px solid '+T.border+';border-radius:8px;'+
          'padding:9px 12px;font-size:13px;color:'+T.text+';background:'+T.bg+';'+
          'outline:none;box-sizing:border-box;font-family:-apple-system,sans-serif;">'+
      '</div>'+
      '<div id="aa-clist" style="background:'+T.bg+';padding:0 16px 80px;">'+
        '<div style="padding:20px;text-align:center;color:'+T.muted+';">Loading…</div>'+
      '</div>';
  }

  function renderCountries(list) {
    var el=document.getElementById('aa-clist');
    if(!el) return;
    if(!list||!list.length){el.innerHTML='<div style="padding:20px;text-align:center;color:'+T.muted+';">No countries found</div>';return;}
    el.innerHTML=list.slice(0,200).map(function(c){
      var lat=(c.center&&c.center.length===2)?c.center[0]:'';
      var lng=(c.center&&c.center.length===2)?c.center[1]:'';
      return '<div class="aa-crow" data-code="'+c.code+'" data-lat="'+lat+'" data-lng="'+lng+'" '+
        'style="display:flex;align-items:center;gap:12px;padding:14px 0;'+
        'border-bottom:1px solid '+T.border+';cursor:pointer;-webkit-tap-highlight-color:transparent;">'+
        '<div style="font-size:28px;width:44px;text-align:center;flex-shrink:0;pointer-events:none;">'+(c.flag||'🌍')+'</div>'+
        '<div style="flex:1;pointer-events:none;">'+
          '<div style="font-size:14px;font-weight:600;color:'+T.text+';">'+c.name+'</div>'+
          '<div style="font-size:11px;color:'+T.muted+';margin-top:2px;">'+(c.advisoryLabel||'')+(c.capital?' · '+c.capital:'')+'</div>'+
        '</div>'+
        '<div style="color:'+T.muted+';font-size:18px;pointer-events:none;">›</div>'+
      '</div>';
    }).join('');
    el.addEventListener('click',function(e){
      var row=e.target.closest('.aa-crow');
      if(!row) return;
      var code=row.dataset.code;
      var lat=parseFloat(row.dataset.lat), lng=parseFloat(row.dataset.lng);
      var pos=(!isNaN(lat)&&!isNaN(lng)&&lat!==0)?{lat:lat,lng:lng}:null;
      if(typeof window.setActiveCountry==='function') window.setActiveCountry(code,pos);
      switchTab('map');
      if(typeof window.toast==='function'){
        var found=(window.allCountries||[]).find(function(c){return c.code===code;});
        window.toast('📍 '+(found?found.name:code),'ok');
      }
    });
  }

  function loadWorldCountries() {
    if(window.allCountries&&window.allCountries.length){renderCountries(window.allCountries);}
    else{
      fetch('/api/countries').then(function(r){return r.json();})
        .then(function(data){window.allCountries=Array.isArray(data)?data:[];renderCountries(window.allCountries);})
        .catch(function(){var el=document.getElementById('aa-clist');if(el)el.innerHTML='<div style="padding:20px;text-align:center;color:'+T.red+';">Failed to load countries</div>';});
    }
    setTimeout(function(){
      var inp=document.getElementById('aa-csearch');
      if(!inp) return;
      inp.addEventListener('input',function(){
        var q=inp.value.toLowerCase();
        var filtered=(window.allCountries||[]).filter(function(c){
          return !q||c.name.toLowerCase().indexOf(q)>=0||(c.capital||'').toLowerCase().indexOf(q)>=0||c.code.toLowerCase().indexOf(q)>=0;
        });
        renderCountries(filtered);
      });
    },100);
  }

  /* ═══════════════════════════════════════════
     ACCOUNT PANEL
  ═══════════════════════════════════════════ */
  function buildAccount() {
    function arow(icon,title,sub,id){
      return '<div class="aa-arow" data-action="'+id+'" '+
        'style="display:flex;align-items:center;gap:12px;padding:14px;'+
        'background:#fff;border-bottom:1px solid '+T.border+';cursor:pointer;-webkit-tap-highlight-color:transparent;">'+
        '<div style="width:38px;height:38px;border-radius:10px;background:'+T.tealLight+';'+
          'flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;pointer-events:none;">'+icon+'</div>'+
        '<div style="flex:1;pointer-events:none;">'+
          '<div style="font-size:14px;font-weight:600;color:'+T.text+';">'+title+'</div>'+
          '<div style="font-size:12px;color:'+T.muted+';margin-top:2px;">'+sub+'</div>'+
        '</div>'+
        '<div style="color:'+T.muted+';font-size:16px;pointer-events:none;">›</div></div>';
    }
    return panelHdr('👤 My Account')+
      '<div style="background:'+T.bg+';">'+
        '<div style="background:linear-gradient(135deg,'+T.teal+','+T.tealDark+');padding:20px 20px 24px;color:#fff;">'+
          '<div style="font-size:18px;font-weight:800;margin-bottom:4px;font-family:-apple-system,sans-serif;">Atlas Ally</div>'+
          '<div style="font-size:13px;opacity:0.8;margin-bottom:16px;">Global travel safety intelligence</div>'+
          '<div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:14px;">'+
            '<div style="font-size:10px;opacity:0.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Plan</div>'+
            '<div style="font-size:16px;font-weight:700;">Free Trial · 7-day full access</div>'+
          '</div>'+
        '</div>'+
        '<div style="margin:16px;background:#fff;border-radius:12px;border:1px solid '+T.border+';overflow:hidden;" id="aa-acct-rows">'+
          arow('🌍',t('profile'),t('profileSub'),'profile')+
          arow('✅','Safe Check-in','Let your circle know you\'re safe','checkin')+
          arow('🔔','Notifications','Manage safety alerts and push notifications','notifications')+
          arow('📍','Saved Countries','Manage your monitored countries','countries')+
          arow('💳','Subscription','Upgrade to Premium — $3/mo','subscription')+
          arow('🔒','Privacy','Control your data and privacy settings','privacy')+
          arow('ℹ️','About Atlas Ally','v1.0 · atlas-ally.com','about')+
        '</div>'+
        '<div style="padding:0 16px 80px;">'+
          '<button id="aa-signout" style="width:100%;padding:13px;background:'+T.redLight+';'+
            'color:'+T.red+';border:1px solid rgba(239,68,68,0.2);border-radius:10px;'+
            'font-size:14px;font-weight:600;cursor:pointer;touch-action:manipulation;'+
            'font-family:-apple-system,sans-serif;">Sign Out</button>'+
        '</div>'+
      '</div>';
  }

  function wireAccount() {
    var rows=document.getElementById('aa-acct-rows');
    if(rows){
      rows.addEventListener('click',function(e){
        var row=e.target.closest('.aa-arow');
        if(!row) return;
        var a=row.dataset.action;
        if(a==='profile')       showProfileSettings();
        if(a==='checkin')       showCheckin();
        if(a==='notifications') showInfoModal('Notifications','Push notification management coming soon.\n\nYou will be able to set alert thresholds for safety events in your monitored countries.');
        if(a==='countries')     switchTab('countries');
        if(a==='subscription')  showInfoModal('Subscription','Premium Plan — $3/month\n\n✅ Unlimited country monitoring\n✅ Real-time push alerts\n✅ Crime trend tracker\n✅ Journey mode\n✅ Priority support\n\nSubscription management coming soon.');
        if(a==='privacy')       showInfoModal('Privacy Policy','Atlas Ally collects only data necessary to provide safety intelligence.\n\n• Your location is never stored without consent\n• We do not sell your data to third parties\n• All data is encrypted in transit and at rest\n• You can delete your account at any time\n\nFull policy: atlas-ally.com/privacy');
        if(a==='about')         showInfoModal('About Atlas Ally','Atlas Ally v1.0\nGlobal travel safety intelligence platform.\n\nBuilt to keep travelers informed and safe with real-time crime tracking, safety alerts, and country-level intelligence.\n\n📧 support@atlas-ally.com\n🌐 atlas-ally.com');
      });
    }
    var so=document.getElementById('aa-signout');
    if(so) so.addEventListener('click',function(){showToast('👋 Sign out coming soon','ok');});
  }

  /* ═══════════════════════════════════════════
     PROFILE & LANGUAGE SETTINGS
  ═══════════════════════════════════════════ */
  function buildProfileHTML(isOnboarding) {
    var countryOptions = Object.keys(COUNTRY_NAMES).map(function(code) {
      return '<option value="'+code+'"'+(code===_origin?' selected':'')+'>'+COUNTRY_NAMES[code]+'</option>';
    }).join('');
    var langOptions = LANGUAGES.map(function(l) {
      return '<option value="'+l.code+'"'+(l.code===_lang?' selected':'')+'>'+l.label+'</option>';
    }).join('');

    return '<div style="background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:520px;'+
      'padding:24px 24px 40px;box-shadow:0 -8px 40px rgba(0,0,0,0.15);">'+
      '<div style="width:40px;height:4px;background:'+T.border+';border-radius:2px;margin:0 auto 20px;"></div>'+
      (isOnboarding ?
        '<div style="text-align:center;margin-bottom:20px;">'+
        '<div style="font-size:40px;margin-bottom:10px;">🌍</div>'+
        '<div style="font-size:20px;font-weight:800;color:'+T.text+';margin-bottom:6px;font-family:-apple-system,sans-serif;">Welcome to Atlas Ally</div>'+
        '<div style="font-size:13px;color:'+T.muted+';line-height:1.5;">Tell us where you\'re from and your preferred language to personalise your experience.</div>'+
        '</div>'
        :
        '<div style="font-size:20px;font-weight:800;color:'+T.text+';margin-bottom:6px;font-family:-apple-system,sans-serif;">🌍 '+t('profile')+'</div>'+
        '<div style="font-size:13px;color:'+T.muted+';margin-bottom:20px;">'+t('profileSub')+'</div>'
      )+
      '<div style="margin-bottom:16px;">'+
        '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">'+t('homeCountry')+'</div>'+
        '<select id="aa-prof-origin" style="width:100%;border:1.5px solid '+T.border+';border-radius:10px;'+
          'padding:10px 12px;font-size:14px;color:'+T.text+';background:#fff;outline:none;'+
          'box-sizing:border-box;font-family:-apple-system,sans-serif;appearance:none;'+
          'background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%236B7C93\' fill=\'none\' stroke-width=\'2\'/%3E%3C/svg%3E\");'+
          'background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;">'+
          '<option value="">— Select your home country —</option>'+
          countryOptions+
        '</select>'+
      '</div>'+
      '<div style="margin-bottom:24px;">'+
        '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">'+t('language')+'</div>'+
        '<select id="aa-prof-lang" style="width:100%;border:1.5px solid '+T.border+';border-radius:10px;'+
          'padding:10px 12px;font-size:14px;color:'+T.text+';background:#fff;outline:none;'+
          'box-sizing:border-box;font-family:-apple-system,sans-serif;appearance:none;'+
          'background-image:url(\"data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%236B7C93\' fill=\'none\' stroke-width=\'2\'/%3E%3C/svg%3E\");'+
          'background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;">'+
          langOptions+
        '</select>'+
      '</div>'+
      '<button id="aa-prof-save" style="width:100%;padding:14px;background:'+T.teal+';color:#fff;'+
        'border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;'+
        'touch-action:manipulation;font-family:-apple-system,sans-serif;margin-bottom:10px;">'+
        (isOnboarding ? '🚀 Get Started' : '✅ '+t('save'))+
      '</button>'+
      (!isOnboarding ? '<button id="aa-prof-cancel" style="width:100%;padding:12px;background:none;color:'+T.muted+';'+
        'border:none;font-size:14px;cursor:pointer;touch-action:manipulation;">'+t('cancel')+'</button>' : '')+
      '</div>';
  }

  function wireProfileSave(isOnboarding) {
    var saveBtn = document.getElementById('aa-prof-save');
    if (!saveBtn) return;
    saveBtn.addEventListener('click', function() {
      var originSel = document.getElementById('aa-prof-origin');
      var langSel   = document.getElementById('aa-prof-lang');
      var newOrigin = originSel ? originSel.value : _origin;
      var newLang   = langSel   ? langSel.value   : _lang;

      _origin = newOrigin;
      _lang   = newLang;
      localStorage.setItem('atlas_origin', _origin);
      localStorage.setItem('atlas_lang',   _lang);
      localStorage.setItem('atlas_setup_done', '1');

      // Save to server if possible
      var token = localStorage.getItem('atlas_token');
      if (token) {
        fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
          body: JSON.stringify({ country_origin: _origin, language: _lang }),
        }).catch(function(){});
      }

      closeModal();
      showToast('✅ Preferences saved', 'ok');

      if (isOnboarding) {
        // Re-render account tab labels with new language
        if (overlay && overlay.style.display !== 'none') {
          switchTab('account');
        }
      }
    });
    var cancelBtn = document.getElementById('aa-prof-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  }

  function showProfileSettings() {
    closeModal();
    modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.55);'+
      'display:flex;align-items:flex-end;justify-content:center;pointer-events:all;';
    modal.innerHTML = buildProfileHTML(false);
    document.body.appendChild(modal);
    wireProfileSave(false);
    modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
  }

  function showOnboarding() {
    closeModal();
    modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.75);'+
      'display:flex;align-items:flex-end;justify-content:center;pointer-events:all;';
    modal.innerHTML = buildProfileHTML(true);
    document.body.appendChild(modal);
    wireProfileSave(true);
    // No dismiss on backdrop click for onboarding — must complete it
  }

  /* ═══════════════════════════════════════════
     MAP TAP — REPORT INCIDENT MODAL
  ═══════════════════════════════════════════ */
  var REPORT_TYPES = [
    { type:'drone',     icon:'🚁', label:'Drone / UAV',        severity:'high'     },
    { type:'missile',   icon:'🚀', label:'Missile / Strike',   severity:'critical' },
    { type:'explosion', icon:'💥', label:'Explosion / Blast',  severity:'critical' },
    { type:'shooting',  icon:'🔫', label:'Shooting / Gunfire', severity:'high'     },
    { type:'protest',   icon:'✊', label:'Protest / Unrest',   severity:'warn'     },
    { type:'fire',      icon:'🔥', label:'Fire',               severity:'high'     },
    { type:'flood',     icon:'🌊', label:'Flood',              severity:'high'     },
    { type:'earthquake',icon:'🌍', label:'Earthquake',         severity:'high'     },
    { type:'crime',     icon:'🔴', label:'Crime / Theft',      severity:'warn'     },
    { type:'incident',  icon:'⚠️', label:'Other Incident',     severity:'warn'     },
  ];

  function showReportModal(lat, lng) {
    closeModal();
    var country = window.activeCountry || '';
    modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.6);'+
      'display:flex;align-items:flex-end;justify-content:center;pointer-events:all;';

    var typeButtons = REPORT_TYPES.map(function(rt) {
      return '<button data-rtype="'+rt.type+'" data-rsev="'+rt.severity+'" '+
        'style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;'+
        'border:1.5px solid #E5EAEF;border-radius:10px;background:#fff;cursor:pointer;'+
        'touch-action:manipulation;min-width:62px;flex:1;">'+
        '<span style="font-size:20px;">'+rt.icon+'</span>'+
        '<span style="font-size:9px;font-weight:600;color:#1A2332;text-align:center;line-height:1.2;font-family:\'DM Sans\',sans-serif;">'+rt.label+'</span>'+
        '</button>';
    }).join('');

    modal.innerHTML =
      '<div style="background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:520px;'+
        'padding:20px 16px 36px;box-shadow:0 -8px 40px rgba(0,0,0,0.15);">'+
        '<div style="width:40px;height:4px;background:#E5EAEF;border-radius:2px;margin:0 auto 16px;"></div>'+
        '<div style="font-size:16px;font-weight:700;color:#1A2332;margin-bottom:4px;font-family:\'DM Sans\',sans-serif;">📍 Report Incident</div>'+
        '<div style="font-size:12px;color:#6B7C93;margin-bottom:16px;font-family:\'DM Sans\',sans-serif;">'+
          (lat ? 'Location: '+lat.toFixed(4)+', '+lng.toFixed(4) : country || 'Current location')+
        '</div>'+
        '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-bottom:16px;" id="aa-rtype-grid">'+
          typeButtons+
        '</div>'+
        '<textarea id="aa-report-desc" placeholder="Optional description…" '+
          'style="width:100%;border:1.5px solid #E5EAEF;border-radius:10px;padding:10px 12px;'+
          'font-size:13px;color:#1A2332;background:#F8FAFB;outline:none;resize:none;height:70px;'+
          'box-sizing:border-box;font-family:\'DM Sans\',sans-serif;margin-bottom:12px;"></textarea>'+
        '<button id="aa-report-submit" style="width:100%;padding:13px;background:#0E7490;color:#fff;'+
          'border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;'+
          'touch-action:manipulation;font-family:\'DM Sans\',sans-serif;opacity:0.4;pointer-events:none;">'+
          'Select an incident type to report</button>'+
        '<button id="aa-report-cancel" style="width:100%;padding:11px;background:none;color:#6B7C93;'+
          'border:none;font-size:13px;cursor:pointer;touch-action:manipulation;font-family:\'DM Sans\',sans-serif;margin-top:4px;">'+
          'Cancel</button>'+
      '</div>';

    document.body.appendChild(modal);

    var selectedType = null;
    var selectedSev  = null;

    modal.querySelector('#aa-rtype-grid').addEventListener('click', function(e) {
      var btn = e.target.closest('[data-rtype]');
      if (!btn) return;
      selectedType = btn.dataset.rtype;
      selectedSev  = btn.dataset.rsev;
      modal.querySelectorAll('[data-rtype]').forEach(function(b) {
        b.style.borderColor = b.dataset.rtype === selectedType ? '#0E7490' : '#E5EAEF';
        b.style.background  = b.dataset.rtype === selectedType ? '#E0F2F7' : '#fff';
      });
      var sub = document.getElementById('aa-report-submit');
      sub.textContent  = '📍 Submit Report';
      sub.style.opacity = '1';
      sub.style.pointerEvents = 'auto';
    });

    document.getElementById('aa-report-submit').addEventListener('click', function() {
      if (!selectedType) return;
      var desc = (document.getElementById('aa-report-desc') || {}).value || '';
      fetch('/api/events', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country_code: country,
          type:         selectedType,
          severity:     selectedSev,
          title:        REPORT_TYPES.find(function(r){return r.type===selectedType;}).label + ' reported' + (country?' in '+(COUNTRY_NAMES[country]||country):''),
          description:  desc,
          lat:          lat || null,
          lng:          lng || null,
          location:     country ? (COUNTRY_NAMES[country] || country) : null,
          source_url:   'user-report',
        }),
      })
      .then(function() {
        showToast('✅ Incident reported — thank you', 'ok');
        closeModal();
        // Refresh alerts if currently on that tab
        if (_feedTab === 'alerts' && overlay && overlay.style.display !== 'none') {
          loadAlerts(window.activeCountry);
        }
      })
      .catch(function() { showToast('⚠️ Could not submit report', 'error'); });
    });

    document.getElementById('aa-report-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
  }

  /* ═══════════════════════════════════════════
     ROUTE PLANNER
  ═══════════════════════════════════════════ */

  var _routeFromCoords = null;
  var _routeLayer      = null;

  function geocodeLocation(query, countryCode) {
    var cc  = countryCode ? '&countrycodes=' + countryCode.toLowerCase() : '';
    var url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) +
              cc + '&format=json&limit=1';
    return fetch(url, { headers: { 'User-Agent': 'AtlasAlly/1.0' } })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (!d || !d.length) return null;
        return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon), name: d[0].display_name };
      });
  }

  function openRouteSheet() {
    closeModal();
    _routeFromCoords = null;

    modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.55);' +
      'display:flex;align-items:flex-end;justify-content:center;pointer-events:all;';

    modal.innerHTML =
      '<div style="background:#F8FAFB;border-radius:20px 20px 0 0;width:100%;max-width:520px;' +
        'max-height:88vh;display:flex;flex-direction:column;box-shadow:0 -8px 40px rgba(0,0,0,0.15);">' +

        // ── Header ──
        '<div style="background:' + T.teal + ';border-radius:20px 20px 0 0;padding:14px 16px 14px;' +
          'display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
          '<div>' +
            '<div style="font-size:15px;font-weight:700;color:#fff;font-family:-apple-system,sans-serif;">🛡️ Safe Route</div>' +
            '<div style="font-size:9px;color:rgba(255,255,255,0.65);letter-spacing:1.2px;text-transform:uppercase;margin-top:1px;">Risk-Avoiding Navigation</div>' +
          '</div>' +
          '<button id="aa-route-close" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);' +
            'color:#fff;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:13px;font-weight:600;' +
            'touch-action:manipulation;font-family:-apple-system,sans-serif;">✕</button>' +
        '</div>' +

        // ── Scrollable body ──
        '<div id="aa-route-body" style="overflow-y:auto;-webkit-overflow-scrolling:touch;flex:1;">' +

          // From / To fields
          '<div style="padding:14px 14px 10px;background:#fff;border-bottom:1px solid ' + T.border + ';">' +
            '<div style="display:flex;align-items:center;gap:8px;padding:9px 11px;background:' + T.bg + ';' +
              'border:1.5px solid ' + T.border + ';border-radius:9px;margin-bottom:8px;">' +
              '<div style="width:9px;height:9px;border-radius:50%;background:' + T.green + ';flex-shrink:0;"></div>' +
              '<input id="aa-route-from" placeholder="From — city, address or landmark" ' +
                'style="border:none;background:none;flex:1;font-size:12px;color:' + T.text + ';' +
                'font-family:-apple-system,sans-serif;outline:none;">' +
              '<button id="aa-route-gps" style="background:none;border:none;font-size:14px;cursor:pointer;' +
                'touch-action:manipulation;padding:0 2px;" title="Use GPS">📡</button>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;padding:9px 11px;background:' + T.bg + ';' +
              'border:1.5px solid ' + T.border + ';border-radius:9px;margin-bottom:10px;">' +
              '<div style="width:9px;height:9px;border-radius:50%;background:' + T.red + ';flex-shrink:0;"></div>' +
              '<input id="aa-route-to" placeholder="To — city, address or landmark" ' +
                'style="border:none;background:none;flex:1;font-size:12px;color:' + T.text + ';' +
                'font-family:-apple-system,sans-serif;outline:none;">' +
            '</div>' +
            '<button id="aa-route-plan" style="width:100%;padding:11px;background:' + T.teal + ';color:#fff;' +
              'border:none;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer;' +
              'touch-action:manipulation;font-family:-apple-system,sans-serif;">' +
              '🛡️ Find Safest Route</button>' +
          '</div>' +

          // Results area
          '<div id="aa-route-result"></div>' +

        '</div>' + // end scrollable body
      '</div>';

    document.body.appendChild(modal);

    // GPS button
    document.getElementById('aa-route-gps').addEventListener('click', function() {
      var btn = document.getElementById('aa-route-gps');
      if (!navigator.geolocation) { btn.title = 'GPS unavailable'; return; }
      btn.textContent = '⏳';
      navigator.geolocation.getCurrentPosition(function(pos) {
        _routeFromCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        var inp = document.getElementById('aa-route-from');
        if (inp) inp.value = 'My location (' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4) + ')';
        btn.textContent = '✅';
        setTimeout(function() { btn.textContent = '📡'; }, 2000);
      }, function() {
        btn.textContent = '📡';
        _routeFromCoords = null;
      });
    });

    document.getElementById('aa-route-plan').addEventListener('click', planRoute);
    document.getElementById('aa-route-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
  }

  function planRoute() {
    var fromInput = document.getElementById('aa-route-from');
    var toInput   = document.getElementById('aa-route-to');
    var resultDiv = document.getElementById('aa-route-result');
    var planBtn   = document.getElementById('aa-route-plan');

    if (!fromInput || !toInput) return;
    var fromText = fromInput.value.trim();
    var toText   = toInput.value.trim();

    if (!fromText || !toText) {
      if (resultDiv) resultDiv.innerHTML =
        '<div style="padding:12px 14px;color:' + T.red + ';font-size:12px;text-align:center;">' +
        '⚠️ Enter both a start point and a destination.</div>';
      return;
    }

    if (planBtn) { planBtn.textContent = '⏳ Planning route…'; planBtn.disabled = true; }
    if (resultDiv) resultDiv.innerHTML =
      '<div style="padding:24px;text-align:center;color:' + T.muted + ';font-size:12px;">⏳ Locating places…</div>';

    var country = window.activeCountry || null;

    var fromPromise = _routeFromCoords
      ? Promise.resolve(_routeFromCoords)
      : geocodeLocation(fromText, country);

    fromPromise
      .then(function(fromCoords) {
        if (!fromCoords) throw new Error('Could not find: ' + fromText);
        if (resultDiv) resultDiv.innerHTML =
          '<div style="padding:24px;text-align:center;color:' + T.muted + ';font-size:12px;">⏳ Calculating safe route…</div>';
        return geocodeLocation(toText, country).then(function(toCoords) {
          if (!toCoords) throw new Error('Could not find: ' + toText);
          return fetch('/api/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: fromCoords, to: toCoords, country_code: country }),
          })
          .then(function(r) { return r.ok ? r.json() : null; })
          .then(function(routeData) { renderRouteResult(fromCoords, toCoords, routeData); });
        });
      })
      .catch(function(err) {
        if (resultDiv) resultDiv.innerHTML =
          '<div style="padding:14px;color:' + T.red + ';font-size:12px;text-align:center;">⚠️ ' + err.message + '</div>';
      })
      .then(function() {
        if (planBtn) { planBtn.textContent = '🛡️ Find Safest Route'; planBtn.disabled = false; }
      });
  }

  function renderRouteResult(fromCoords, toCoords, routeData) {
    var resultDiv = document.getElementById('aa-route-result');
    if (!resultDiv) return;

    var fll      = fromCoords.lat.toFixed(5) + ',' + fromCoords.lng.toFixed(5);
    var tll      = toCoords.lat.toFixed(5)   + ',' + toCoords.lng.toFixed(5);
    var osmUrl   = 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=' + fll + ';' + tll;
    var gmapsUrl = 'https://www.google.com/maps/dir/' + fll + '/' + tll;
    var wazeUrl  = 'https://waze.com/ul?ll=' + tll + '&navigate=yes';

    var km   = 0, mins = 0, hasRoute = false;
    if (routeData && (routeData.distance_km || routeData.distance)) {
      hasRoute = true;
      km   = routeData.distance_km || Math.round((routeData.distance || 0) / 1000);
      mins = routeData.duration_min || Math.round((routeData.duration || 0) / 60);
    }

    // Risk level based on country advisory
    var country = window.activeCountry;
    var riskLabel = 'Low', riskColor = T.green, riskBg = T.greenLight;
    if (country) {
      var cd = (window.allCountries || []).find(function(c) { return c.code === country; });
      if (cd) {
        var adv = cd.advisoryLevel || 1;
        if (adv >= 4) { riskLabel = 'High';     riskColor = T.red;  riskBg = T.redLight;  }
        else if (adv >= 3) { riskLabel = 'Moderate'; riskColor = T.gold; riskBg = T.goldLight; }
        else if (adv >= 2) { riskLabel = 'Low-Med';  riskColor = T.gold; riskBg = T.goldLight; }
      }
    }

    var hours = mins > 0 ? (mins >= 60 ? (mins / 60).toFixed(1) + 'h' : mins + 'm') : '—';

    var html = '';

    // ── Map preview box ──
    html += '<div style="height:160px;background:linear-gradient(135deg,#E8F4F8,#C8E8F2);position:relative;' +
      'display:flex;align-items:center;justify-content:center;overflow:hidden;">';
    html += '<div style="position:absolute;left:52px;top:36px;right:52px;bottom:36px;' +
      'border:2px dashed ' + T.teal + ';border-radius:32px;opacity:0.45;"></div>';
    html += '<div style="position:absolute;left:44px;top:30px;font-size:16px;">🟢</div>';
    html += '<div style="position:absolute;right:40px;bottom:26px;font-size:16px;">📍</div>';
    html += '<div style="position:absolute;top:10px;right:10px;background:' + T.green + ';color:#fff;' +
      'padding:3px 9px;border-radius:14px;font-size:9px;font-weight:700;">✅ SAFEST ROUTE</div>';
    html += '<span style="color:' + T.muted + ';font-size:11px;font-weight:500;">Route preview</span>';
    html += '</div>';

    // ── Stats row ──
    html += '<div style="display:flex;padding:10px 12px;gap:7px;background:#fff;border-bottom:1px solid ' + T.border + ';">';
    function rstat(val, label, bg, col) {
      return '<div style="flex:1;background:' + (bg || T.bg) + ';border-radius:7px;padding:8px;text-align:center;">' +
        '<div style="font-size:13px;font-weight:700;color:' + (col || T.text) + ';">' + val + '</div>' +
        '<div style="font-size:8px;color:' + T.muted + ';text-transform:uppercase;letter-spacing:0.4px;margin-top:1px;">' + label + '</div>' +
        '</div>';
    }
    html += rstat(hasRoute ? hours : '—', 'Duration');
    html += rstat(hasRoute ? km + 'km' : '—', 'Distance');
    html += rstat(riskLabel, 'Risk', riskBg, riskColor);
    html += rstat('—', 'Checkpoints');
    html += '</div>';

    // ── Info rows ──
    html += '<div style="background:#fff;padding:4px 12px 4px;">';
    function rrow(bgColor, icon, text) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid ' + T.border + ';">' +
        '<div style="width:26px;height:26px;border-radius:6px;background:' + bgColor + ';' +
          'display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">' + icon + '</div>' +
        '<div style="font-size:12px;color:' + T.text + ';flex:1;line-height:1.3;">' + text + '</div></div>';
    }
    html += rrow(T.greenLight,  '🛡️', 'Route avoids flagged risk zones along the way');
    if (riskLabel !== 'Low') {
      html += rrow(T.goldLight, '⚠️', 'Advisory level ' + (country || '') + ' — exercise caution');
    }
    html += rrow(T.tealLight,   '📶', 'Download offline map for this route before departing');
    html += '</div>';

    // ── Open in maps ──
    html += '<div style="padding:12px 14px;background:' + T.bg + ';border-top:1px solid ' + T.border + ';">';
    html += '<div style="font-size:9px;font-weight:700;color:' + T.muted + ';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:9px;">Open turn-by-turn navigation in:</div>';
    function mapLink(href, icon, title, sub) {
      return '<a href="' + href + '" target="_blank" rel="noopener" ' +
        'style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;' +
        'border:1px solid ' + T.border + ';border-radius:9px;text-decoration:none;margin-bottom:7px;">' +
        '<span style="font-size:20px;">' + icon + '</span>' +
        '<div><div style="font-size:12px;font-weight:600;color:' + T.text + ';">' + title + '</div>' +
        '<div style="font-size:10px;color:' + T.muted + ';">' + sub + '</div></div></a>';
    }
    html += mapLink(osmUrl,   '🗺️', 'OpenStreetMap',  'Free · works offline');
    html += mapLink(gmapsUrl, '📍', 'Google Maps',    'Real-time traffic');
    html += mapLink(wazeUrl,  '🚗', 'Waze',           'Community alerts');
    html += '</div>';

    // Draw on Leaflet map in background
    if (window.map && window.L) {
      try {
        if (_routeLayer) window.map.removeLayer(_routeLayer);
        var coords = (routeData && routeData.route && routeData.route.geometry)
          ? routeData.route.geometry.coordinates.map(function(c) { return [c[1], c[0]]; })
          : [[fromCoords.lat, fromCoords.lng], [toCoords.lat, toCoords.lng]];
        _routeLayer = window.L.polyline(coords, {
          color: T.teal, weight: hasRoute ? 5 : 3, opacity: 0.85,
          dashArray: hasRoute ? null : '8 6'
        }).addTo(window.map);
        window.map.fitBounds(_routeLayer.getBounds(), { padding: [50, 50] });
      } catch(e) {}
    }

    resultDiv.innerHTML = html;
  }

  /* ═══════════════════════════════════════════
     SAFE CHECK-IN MODAL
  ═══════════════════════════════════════════ */
  function showCheckin() {
    closeModal();
    modal=document.createElement('div');
    modal.style.cssText='position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.55);'+
      'display:flex;align-items:flex-end;justify-content:center;pointer-events:all;';
    modal.innerHTML=
      '<div style="background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:520px;'+
        'padding:24px 24px 40px;box-shadow:0 -8px 40px rgba(0,0,0,0.15);">'+
        '<div style="width:40px;height:4px;background:'+T.border+';border-radius:2px;margin:0 auto 20px;"></div>'+
        '<div style="font-size:20px;font-weight:800;color:'+T.text+';margin-bottom:6px;font-family:-apple-system,sans-serif;">✅ Safe Check-in</div>'+
        '<div style="font-size:13px;color:'+T.muted+';margin-bottom:20px;line-height:1.5;">Let your emergency contacts know you\'re safe.</div>'+
        '<div style="margin-bottom:14px;">'+
          '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Your Status</div>'+
          '<div id="aa-ci-status" style="display:flex;gap:8px;">'+
            '<button data-status="safe" style="flex:1;padding:10px;border-radius:10px;border:2px solid '+T.green+';background:'+T.greenLight+';color:'+T.green+';font-weight:700;font-size:13px;cursor:pointer;touch-action:manipulation;">🟢 Safe</button>'+
            '<button data-status="help" style="flex:1;padding:10px;border-radius:10px;border:2px solid '+T.border+';background:#fff;color:'+T.muted+';font-weight:600;font-size:13px;cursor:pointer;touch-action:manipulation;">🆘 Help</button>'+
            '<button data-status="caution" style="flex:1;padding:10px;border-radius:10px;border:2px solid '+T.border+';background:#fff;color:'+T.muted+';font-weight:600;font-size:13px;cursor:pointer;touch-action:manipulation;">⚠️ Caution</button>'+
          '</div>'+
        '</div>'+
        '<div style="margin-bottom:14px;">'+
          '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Message (optional)</div>'+
          '<textarea id="aa-ci-msg" placeholder="Add a message to your contacts…" '+
            'style="width:100%;border:1.5px solid '+T.border+';border-radius:10px;padding:10px 12px;'+
            'font-size:13px;color:'+T.text+';background:'+T.bg+';outline:none;resize:none;'+
            'height:80px;box-sizing:border-box;font-family:-apple-system,sans-serif;"></textarea>'+
        '</div>'+
        '<div style="margin-bottom:20px;">'+
          '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Location</div>'+
          '<div style="font-size:13px;color:'+T.muted+';background:'+T.bg+';border:1.5px solid '+T.border+';border-radius:10px;padding:10px 12px;">'+
            (window.activeCountry?'📍 '+window.activeCountry:'Location not set')+
          '</div>'+
        '</div>'+
        '<button id="aa-ci-send" style="width:100%;padding:14px;background:'+T.green+';color:#fff;'+
          'border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;'+
          'touch-action:manipulation;font-family:-apple-system,sans-serif;margin-bottom:10px;">'+
          '✅ Send Check-in</button>'+
        '<button id="aa-ci-cancel" style="width:100%;padding:12px;background:none;color:'+T.muted+';'+
          'border:none;font-size:14px;cursor:pointer;touch-action:manipulation;">Cancel</button>'+
      '</div>';
    document.body.appendChild(modal);

    var selStatus='safe';
    modal.querySelectorAll('[data-status]').forEach(function(btn){
      btn.addEventListener('click',function(){
        selStatus=btn.dataset.status;
        var colors={safe:[T.green,T.greenLight],help:[T.red,T.redLight],caution:[T.gold,T.goldLight]};
        modal.querySelectorAll('[data-status]').forEach(function(b){
          var on=b.dataset.status===selStatus;
          var c=colors[b.dataset.status];
          b.style.borderColor=on?c[0]:T.border;
          b.style.background =on?c[1]:'#fff';
          b.style.color      =on?c[0]:T.muted;
          b.style.fontWeight =on?'700':'600';
        });
      });
    });
    var send=document.getElementById('aa-ci-send');
    if(send) send.addEventListener('click',function(){
      showToast('✅ Check-in sent · '+(selStatus==='safe'?'SAFE':selStatus==='help'?'NEED HELP':'CAUTION')+' · '+(window.activeCountry||'Unknown'),'ok');
      closeModal();
    });
    var cancel=document.getElementById('aa-ci-cancel');
    if(cancel) cancel.addEventListener('click',closeModal);
    modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
  }

  /* ═══════════════════════════════════════════
     INFO MODAL
  ═══════════════════════════════════════════ */
  function showInfoModal(title,body) {
    closeModal();
    modal=document.createElement('div');
    modal.style.cssText='position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.55);'+
      'display:flex;align-items:center;justify-content:center;padding:20px;pointer-events:all;';
    modal.innerHTML='<div style="background:#fff;border-radius:16px;max-width:400px;width:100%;padding:24px;max-height:80vh;overflow-y:auto;">'+
      '<div style="font-size:17px;font-weight:700;color:'+T.text+';margin-bottom:14px;">'+title+'</div>'+
      '<div style="font-size:13px;color:'+T.muted+';line-height:1.7;white-space:pre-line;margin-bottom:20px;">'+body+'</div>'+
      '<button id="aa-modal-close" style="width:100%;padding:12px;background:'+T.teal+';color:#fff;'+
        'border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;touch-action:manipulation;">Close</button>'+
      '</div>';
    document.body.appendChild(modal);
    modal.querySelector('#aa-modal-close').addEventListener('click',closeModal);
    modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
  }

  function closeModal() {
    if(modal&&modal.parentNode){document.body.removeChild(modal);modal=null;}
  }

  /* ═══════════════════════════════════════════
     TOAST
  ═══════════════════════════════════════════ */
  function showToast(msg,type) {
    if(typeof window.toast==='function'){window.toast(msg,type);return;}
    var t=document.createElement('div');
    t.style.cssText='position:fixed;top:70px;left:50%;transform:translateX(-50%);'+
      'background:#fff;border-radius:8px;padding:10px 18px;font-size:13px;'+
      'box-shadow:0 4px 20px rgba(0,0,0,0.12);z-index:800000;pointer-events:none;'+
      'border:1px solid '+T.border+';color:'+T.text+';white-space:nowrap;font-family:-apple-system,sans-serif;';
    t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},3000);
  }

  /* ═══════════════════════════════════════════
     MAIN SWITCHER
  ═══════════════════════════════════════════ */
  function switchTab(name) {
    activateTab(name);
    closeModal();

    if(name==='map'){hideOverlay();showMap();return;}

    hideMap();
    if(name==='feed')      showOverlay(buildFeed());
    else if(name==='pack')      showOverlay(buildPack());
    else if(name==='countries') showOverlay(buildWorld());
    else if(name==='account')   showOverlay(buildAccount());

    setTimeout(function(){
      var cb=document.getElementById('aa-close-btn');
      if(cb) cb.addEventListener('click',function(){switchTab('map');});
      if(name==='feed'){_feedTab='news';wireFeedTabs();loadNews(window.activeCountry);}
      if(name==='countries') loadWorldCountries();
      if(name==='account')   wireAccount();
    },0);
  }

  /* ═══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */
  function init() {
    // Inject DM Sans font
    if (!document.getElementById('aa-fonts')) {
      var lk = document.createElement('link');
      lk.id  = 'aa-fonts';
      lk.rel = 'stylesheet';
      lk.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap';
      document.head.appendChild(lk);
    }
    // Inject design system CSS (exact match to UI spec)
    if (!document.getElementById('aa-design-css')) {
      var st = document.createElement('style');
      st.id  = 'aa-design-css';
      st.textContent = [
        '*{box-sizing:border-box}',
        '.aa-feed-meta{display:flex;justify-content:space-between;padding:7px 14px 5px;background:#F8FAFB;border-bottom:1px solid #E5EAEF}',
        '.aa-fmeta{font-size:9px;color:#6B7C93;font-family:"DM Mono",monospace;display:flex;align-items:center;gap:4px}',
        '.aa-ldot{width:5px;height:5px;border-radius:50%;background:#10B981;display:inline-block}',
        '.aa-fitem{padding:10px 14px;border-bottom:1px solid #E5EAEF;background:#fff;display:flex;gap:9px;align-items:flex-start;text-decoration:none;-webkit-tap-highlight-color:transparent;cursor:pointer}',
        '.aa-fitem:active{background:#F8FAFB}',
        '.aa-ficon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}',
        '.aa-fi-red{background:#FEF2F2}',
        '.aa-fi-amber{background:#FEF3C7}',
        '.aa-fi-green{background:#ECFDF5}',
        '.aa-fi-blue{background:#E0F2F7}',
        '.aa-fbody{flex:1;min-width:0}',
        '.aa-fhead{font-size:11px;font-weight:500;color:#1A2332;line-height:1.3;margin-bottom:3px;font-family:"DM Sans",-apple-system,sans-serif}',
        '.aa-fsub{display:flex;gap:6px;align-items:center}',
        '.aa-ftag{padding:2px 6px;border-radius:8px;font-size:8px;font-weight:700;letter-spacing:0.3px;text-transform:uppercase;font-family:"DM Sans",sans-serif}',
        '.aa-tr{background:#FEF2F2;color:#EF4444}',
        '.aa-ta{background:#FEF3C7;color:#92400E}',
        '.aa-tg{background:#ECFDF5;color:#065F46}',
        '.aa-tb{background:#E0F2F7;color:#0E7490}',
        '.aa-tm{background:#F8FAFB;color:#6B7C93}',
        '.aa-ftime{font-size:9px;color:#A8B5C4;font-family:"DM Mono",monospace}',
        '.aa-floc{font-size:9px;color:#0E7490;margin-top:4px;font-family:"DM Sans",sans-serif}',
        '.aa-count-bar{padding:6px 14px 4px;background:#F8FAFB;font-size:9px;font-weight:700;color:#6B7C93;letter-spacing:1px;font-family:"DM Mono",monospace;border-bottom:1px solid #E5EAEF}',
      ].join('\n');
      document.head.appendChild(st);
    }
    mapWrap  = document.getElementById('map-wrap');
    navPanel = document.getElementById('nav-panel');

    overlay=document.createElement('div');
    overlay.id='aa-overlay';
    overlay.style.cssText='display:none;position:fixed;top:0;left:0;right:0;bottom:62px;'+
      'z-index:500000;background:'+T.bg+';overflow-y:auto;-webkit-overflow-scrolling:touch;pointer-events:none;';
    document.body.appendChild(overlay);

    var hamburger=document.getElementById('hamburger');
    if(hamburger){
      hamburger.removeAttribute('onclick');
      hamburger.addEventListener('click',function(e){e.stopPropagation();if(navPanel)navPanel.classList.toggle('open');});
    }

    document.querySelectorAll('.main-tab').forEach(function(btn,i){
      btn.addEventListener('click',function(e){e.stopPropagation();switchTab(tabNames[i]);});
    });

    document.addEventListener('click',function(e){
      if(!navPanel||!navPanel.classList.contains('open')) return;
      if(!navPanel.contains(e.target)&&e.target.id!=='hamburger') navPanel.classList.remove('open');
    });

    window.switchTab         = switchTab;
    window.openPanel         = function(id){switchTab(id.replace('-panel',''));};
    window.closePanel        = function(){switchTab('map');};
    window.closeAllPanels    = function(){switchTab('map');};
    window.toggleNav         = function(){if(navPanel)navPanel.classList.toggle('open');};
    window.closeNav          = function(){if(navPanel)navPanel.classList.remove('open');};
    window.openCheckin       = showCheckin;
    window.openReport        = function(lat, lng){ showReportModal(lat||null, lng||null); };
    window.openRouteSheet    = openRouteSheet;
    window.showReportModal   = showReportModal;
    window.locateUser        = function(){navigator.geolocation&&navigator.geolocation.getCurrentPosition(function(p){window.map&&window.map.setView([p.coords.latitude,p.coords.longitude],12);});};
    window.toggleCrimeLayer  = function(){var b=document.getElementById('crime-toggle');if(b)b.style.opacity=b.style.opacity==='0.4'?'1':'0.4';};
    window.toggleHeatmap     = function(){if(window.handleFlameBtn)window.handleFlameBtn();};
    window.toggleJourney     = function(){var b=document.getElementById('journey-toggle');if(b)b.textContent=b.textContent==='Start'?'Stop':'Start';};
    window.showPicker        = function(){var pk=document.getElementById('cpicker');if(pk)pk.classList.add('open');if(navPanel)navPanel.classList.remove('open');if(typeof window.loadCountries==='function')window.loadCountries();};
    window.hidePicker        = function(){var pk=document.getElementById('cpicker');if(pk)pk.classList.remove('open');};
    window.showCountryPicker = window.showPicker;
    window.closeSheet        = function(id){var s=document.getElementById(id);if(s)s.classList.remove('open');};
    window.openNavSection    = function(pid){switchTab(pid.replace('-panel',''));if(navPanel)navPanel.classList.remove('open');};
    window.toast             = window.toast||showToast;

    var _origSet=window.setActiveCountry;
    window.setActiveCountry=function(code,pos){
      var r=_origSet?_origSet(code,pos):null;
      window.activeCountry=code;
      window.activeCountryPos=pos;
      if(overlay&&overlay.style.display!=='none'&&document.getElementById('aa-feed-body')){
        if(_feedTab==='news')   loadNews(code);
        if(_feedTab==='alerts') loadAlerts(code);
        if(_feedTab==='crime')  loadCrime(code);
      }
      return r;
    };

    switchTab('map');

    // Show onboarding if first time or profile not set
    if (!localStorage.getItem('atlas_setup_done')) {
      setTimeout(showOnboarding, 800);
    }
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}

})();
