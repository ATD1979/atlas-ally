/*
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

  // UI translations — 12 languages, ~60 strings each
  var I18N = {
    en:{
      feed:'Live Feed', news:'News', alerts:'Incidents', crime:'Crime', pack:'Pack Assistant',
      countries:'World Browser', account:'My Account', map:'Map',
      selectCountry:'Select a Country', loading:'Loading\u2026', noNews:'No News Found',
      safeCheckin:'Safe Check-in', language:'Language', homeCountry:'Home Country',
      save:'Save', cancel:'Cancel', profile:'Profile & Language',
      profileSub:'Set your home country and language',
      threatLevel:'Threat Level', total:'TOTAL', last7:'LAST 7 DAYS',
      incidents:'Incidents', perDay:'Per Day', critical:'Critical', highAlert:'High Alert',
      highThreat:'HIGH THREAT', elevated:'ELEVATED', monitor:'MONITOR', clear:'CLEAR',
      safetyScore:'Safety Score', generallySafe:'Generally Safe',
      exerciseCaution:'Exercise Caution', highRisk:'High Risk',
      recentIncidents:'RECENT INCIDENTS', noIncidents:'No active incidents',
      travelAdvisory:'Travel Advisory', doNotTravel:'DO NOT TRAVEL \u2014 contact your embassy',
      totalReports:'Total Reports', last90:'Last 90 days', trend:'Trend',
      sources:'Sources', dataProviders:'Data Providers', vsPrior:'vs prior period',
      monthBreakdown:'3-MONTH BREAKDOWN \u00b7 MEDIA', category:'CATEGORY',
      worldBankData:'LIVE WORLD BANK DATA', worldBankSrc:'World Bank \u00b7 Most recent year',
      benchmarkNote:'Bars scaled \u00b7 + indicates likely more incidents',
      rising:'Rising', falling:'Falling', stable:'Stable', high:'HIGH', med:'MED', low:'LOW',
      packTitle:'Pack Assistant', clothing:'CLOTHING', essentials:'ESSENTIALS',
      selectFirst:'Select a country on the map first',
      desert:'Desert / Arid', tropical:'Tropical', monsoon:'Monsoon',
      arctic:'Arctic / Subarctic', temperate:'Temperate',
      winter:'Winter', summer:'Summer', spring:'Spring', autumn:'Autumn',
      catAir:'Air/Missile', catExplosion:'Explosions', catArmed:'Armed',
      catUnrest:'Unrest', catDrug:'Drug Crime', catCrime:'Crime', catWeather:'Weather',
      retry:'Retry', urgent:'Urgent', advisory:'Advisory', info:'Info',
      official:'Official', noData:'No data available',
    },
    es:{
      feed:'Feed en Vivo', news:'Noticias', alerts:'Incidentes', crime:'Crimen', pack:'Asistente de Equipaje',
      countries:'Navegador Mundial', account:'Mi Cuenta', map:'Mapa',
      selectCountry:'Seleccionar Pa\u00eds', loading:'Cargando\u2026', noNews:'Sin noticias',
      safeCheckin:'Check-in Seguro', language:'Idioma', homeCountry:'Pa\u00eds de Origen',
      save:'Guardar', cancel:'Cancelar', profile:'Perfil e Idioma',
      profileSub:'Establece tu pa\u00eds de origen e idioma',
      threatLevel:'Nivel de Amenaza', total:'TOTAL', last7:'\u00daNTIMOS 7 D\u00cdAS',
      incidents:'Incidentes', perDay:'Por D\u00eda', critical:'Cr\u00edtico', highAlert:'Alta Alerta',
      highThreat:'AMENAZA ALTA', elevated:'ELEVADO', monitor:'MONITOREAR', clear:'DESPEJADO',
      safetyScore:'Puntuaci\u00f3n de Seguridad', generallySafe:'Generalmente Seguro',
      exerciseCaution:'Tenga Precauci\u00f3n', highRisk:'Alto Riesgo',
      recentIncidents:'INCIDENTES RECIENTES', noIncidents:'Sin incidentes activos',
      travelAdvisory:'Aviso de Viaje', doNotTravel:'NO VIAJAR \u2014 contacte su embajada',
      totalReports:'Total de Reportes', last90:'\u00daltimos 90 d\u00edas', trend:'Tendencia',
      sources:'Fuentes', dataProviders:'Proveedores de datos', vsPrior:'vs per\u00edodo anterior',
      monthBreakdown:'RESUMEN 3 MESES \u00b7 MEDIOS', category:'CATEGOR\u00cdA',
      worldBankData:'DATOS BANCO MUNDIAL EN VIVO', worldBankSrc:'Banco Mundial \u00b7 A\u00f1o m\u00e1s reciente',
      benchmarkNote:'Barras escaladas \u00b7 + indica m\u00e1s incidentes probables',
      rising:'Subiendo', falling:'Bajando', stable:'Estable', high:'ALTO', med:'MEDIO', low:'BAJO',
      packTitle:'Asistente de Equipaje', clothing:'ROPA', essentials:'ESENCIALES',
      selectFirst:'Selecciona un pa\u00eds en el mapa primero',
      desert:'Desierto / \u00c1rido', tropical:'Tropical', monsoon:'Monz\u00f3n',
      arctic:'\u00c1rtico / Sub\u00e1rtico', temperate:'Templado',
      winter:'Invierno', summer:'Verano', spring:'Primavera', autumn:'Oto\u00f1o',
      catAir:'Aire/Misil', catExplosion:'Explosiones', catArmed:'Armado',
      catUnrest:'Disturbios', catDrug:'Narcotr\u00e1fico', catCrime:'Crimen', catWeather:'Clima',
      retry:'Reintentar', urgent:'Urgente', advisory:'Aviso', info:'Info',
      official:'Oficial', noData:'Sin datos disponibles',
    },
    fr:{
      feed:'Fil en Direct', news:'Actualit\u00e9s', alerts:'Incidents', crime:'Criminalit\u00e9', pack:'Assistant Bagages',
      countries:'Navigateur Mondial', account:'Mon Compte', map:'Carte',
      selectCountry:'S\u00e9lectionner un Pays', loading:'Chargement\u2026', noNews:'Aucune actualit\u00e9',
      safeCheckin:'Check-in S\u00e9curis\u00e9', language:'Langue', homeCountry:"Pays d'origine",
      save:'Enregistrer', cancel:'Annuler', profile:'Profil & Langue',
      profileSub:"D\u00e9finissez votre pays d'origine et langue",
      threatLevel:'Niveau de Menace', total:'TOTAL', last7:'7 DERNIERS JOURS',
      incidents:'Incidents', perDay:'Par Jour', critical:'Critique', highAlert:'Haute Alerte',
      highThreat:'MENACE \u00c9LEV\u00c9E', elevated:'\u00c9LEV\u00c9', monitor:'SURVEILLER', clear:'D\u00c9GAG\u00c9',
      safetyScore:'Score de S\u00e9curit\u00e9', generallySafe:'G\u00e9n\u00e9ralement S\u00fbr',
      exerciseCaution:'Faire Preuve de Prudence', highRisk:'Risque \u00c9lev\u00e9',
      recentIncidents:'INCIDENTS R\u00c9CENTS', noIncidents:'Aucun incident actif',
      travelAdvisory:'Avis de Voyage', doNotTravel:'NE PAS VOYAGER \u2014 contactez votre ambassade',
      totalReports:'Total des Rapports', last90:'90 derniers jours', trend:'Tendance',
      sources:'Sources', dataProviders:'Fournisseurs de donn\u00e9es', vsPrior:'vs p\u00e9riode pr\u00e9c\u00e9dente',
      monthBreakdown:'BILAN 3 MOIS \u00b7 M\u00c9DIAS', category:'CAT\u00c9GORIE',
      worldBankData:'DONN\u00c9ES BANQUE MONDIALE', worldBankSrc:'Banque Mondiale \u00b7 Ann\u00e9e la plus r\u00e9cente',
      benchmarkNote:"Barres \u00e0 l'\u00e9chelle \u00b7 + indique plus d'incidents probables",
      rising:'En hausse', falling:'En baisse', stable:'Stable', high:'\u00c9LEV\u00c9', med:'MOYEN', low:'FAIBLE',
      packTitle:'Assistant Bagages', clothing:'V\u00caTEMENTS', essentials:'ESSENTIELS',
      selectFirst:"S\u00e9lectionnez un pays sur la carte d'abord",
      desert:'D\u00e9sert / Aride', tropical:'Tropical', monsoon:'Mousson',
      arctic:'Arctique / Subarctique', temperate:'Temp\u00e9r\u00e9',
      winter:'Hiver', summer:'\u00c9t\u00e9', spring:'Printemps', autumn:'Automne',
      catAir:'Air/Missile', catExplosion:'Explosions', catArmed:'Arm\u00e9',
      catUnrest:'Troubles', catDrug:'Trafic de drogues', catCrime:'Crime', catWeather:'M\u00e9t\u00e9o',
      retry:'R\u00e9essayer', urgent:'Urgent', advisory:'Avis', info:'Info',
      official:'Officiel', noData:'Aucune donn\u00e9e disponible',
    },
    ar:{
      feed:'\u0627\u0644\u0628\u062b \u0627\u0644\u0645\u0628\u0627\u0634\u0631', news:'\u0623\u062e\u0628\u0627\u0631', alerts:'\u062d\u0648\u0627\u062f\u062b', crime:'\u062c\u0631\u064a\u0645\u0629', pack:'\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u062d\u0642\u064a\u0628\u0629',
      countries:'\u0645\u062a\u0635\u0641\u062d \u0627\u0644\u0639\u0627\u0644\u0645', account:'\u062d\u0633\u0627\u0628\u064a', map:'\u062e\u0631\u064a\u0637\u0629',
      selectCountry:'\u0627\u062e\u062a\u0631 \u062f\u0648\u0644\u0629', loading:'\u062c\u0627\u0631 \u0627\u0644\u062a\u062d\u0645\u064a\u0644\u2026', noNews:'\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u062e\u0628\u0627\u0631',
      safeCheckin:'\u062a\u0633\u062c\u064a\u0644 \u0648\u0635\u0648\u0644 \u0622\u0645\u0646', language:'\u0627\u0644\u0644\u063a\u0629', homeCountry:'\u0628\u0644\u062f \u0627\u0644\u0623\u0635\u0644',
      save:'\u062d\u0641\u0638', cancel:'\u0625\u0644\u063a\u0627\u0621', profile:'\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a \u0648\u0627\u0644\u0644\u063a\u0629',
      profileSub:'\u062d\u062f\u062f \u0628\u0644\u062f \u0623\u0635\u0644\u0643 \u0648\u0644\u063a\u062a\u0643',
      threatLevel:'\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062a\u0647\u062f\u064a\u062f', total:'\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a', last7:'\u0622\u062e\u0631 7 \u0623\u064a\u0627\u0645',
      incidents:'\u062d\u0648\u0627\u062f\u062b', perDay:'\u064a\u0648\u0645\u064a\u0627', critical:'\u062d\u0631\u062c', highAlert:'\u062a\u0646\u0628\u064a\u0647 \u0639\u0627\u0644',
      highThreat:'\u062a\u0647\u062f\u064a\u062f \u0639\u0627\u0644', elevated:'\u0645\u0631\u062a\u0641\u0639', monitor:'\u0645\u0631\u0627\u0642\u0628\u0629', clear:'\u0622\u0645\u0646',
      safetyScore:'\u062f\u0631\u062c\u0629 \u0627\u0644\u0623\u0645\u0627\u0646', generallySafe:'\u0622\u0645\u0646 \u0628\u0634\u0643\u0644 \u0639\u0627\u0645',
      exerciseCaution:'\u062a\u0648\u062e \u0627\u0644\u062d\u0630\u0631', highRisk:'\u062e\u0637\u0631 \u0645\u0631\u062a\u0641\u0639',
      recentIncidents:'\u0627\u0644\u062d\u0648\u0627\u062f\u062b \u0627\u0644\u0623\u062e\u064a\u0631\u0629', noIncidents:'\u0644\u0627 \u062a\u0648\u062c\u062f \u062d\u0648\u0627\u062f\u062b \u0646\u0634\u0637\u0629',
      travelAdvisory:'\u062a\u062d\u0630\u064a\u0631 \u0633\u0641\u0631', doNotTravel:'\u0644\u0627 \u062a\u0633\u0627\u0641\u0631 \u2014 \u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0633\u0641\u0627\u0631\u062a\u0643',
      totalReports:'\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631', last90:'\u0622\u062e\u0631 90 \u064a\u0648\u0645\u0627', trend:'\u0627\u0644\u0627\u062a\u062c\u0627\u0647',
      sources:'\u0627\u0644\u0645\u0635\u0627\u062f\u0631', dataProviders:'\u0645\u0632\u0648\u062f\u0648 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a', vsPrior:'\u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0627\u0644\u0641\u062a\u0631\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629',
      monthBreakdown:'\u062a\u062d\u0644\u064a\u0644 3 \u0623\u0634\u0647\u0631', category:'\u0627\u0644\u0641\u0626\u0629',
      worldBankData:'\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0628\u0646\u0643 \u0627\u0644\u062f\u0648\u0644\u064a', worldBankSrc:'\u0627\u0644\u0628\u0646\u0643 \u0627\u0644\u062f\u0648\u0644\u064a \u00b7 \u0623\u062d\u062f\u062b \u0633\u0646\u0629',
      benchmarkNote:'\u0627\u0644\u0623\u0634\u0631\u0637\u0629 \u0645\u0642\u064a\u0627\u0633\u064a\u0629 \u00b7 + \u064a\u0639\u0646\u064a \u062d\u0648\u0627\u062f\u062b \u0625\u0636\u0627\u0641\u064a\u0629 \u0645\u062d\u062a\u0645\u0644\u0629',
      rising:'\u0627\u0631\u062a\u0641\u0627\u0639', falling:'\u0627\u0646\u062e\u0641\u0627\u0636', stable:'\u0645\u0633\u062a\u0642\u0631', high:'\u0645\u0631\u062a\u0641\u0639', med:'\u0645\u062a\u0648\u0633\u0637', low:'\u0645\u0646\u062e\u0641\u0636',
      packTitle:'\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u062d\u0642\u064a\u0628\u0629', clothing:'\u0627\u0644\u0645\u0644\u0627\u0628\u0633', essentials:'\u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0627\u062a',
      selectFirst:'\u0627\u062e\u062a\u0631 \u062f\u0648\u0644\u0629 \u0639\u0644\u0649 \u0627\u0644\u062e\u0631\u064a\u0637\u0629 \u0623\u0648\u0644\u0627',
      desert:'\u0635\u062d\u0631\u0627\u0648\u064a', tropical:'\u0627\u0633\u062a\u0648\u0627\u0626\u064a', monsoon:'\u0645\u0648\u0633\u0645\u064a',
      arctic:'\u0642\u0637\u0628\u064a', temperate:'\u0645\u0639\u062a\u062f\u0644',
      winter:'\u0634\u062a\u0627\u0621', summer:'\u0635\u064a\u0641', spring:'\u0631\u0628\u064a\u0639', autumn:'\u062e\u0631\u064a\u0641',
      catAir:'\u062c\u0648\u064a', catExplosion:'\u0627\u0646\u0641\u062c\u0627\u0631\u0627\u062a', catArmed:'\u0645\u0633\u0644\u062d',
      catUnrest:'\u0627\u0636\u0637\u0631\u0627\u0628\u0627\u062a', catDrug:'\u0645\u062e\u062f\u0631\u0627\u062a', catCrime:'\u062c\u0631\u064a\u0645\u0629', catWeather:'\u0637\u0642\u0633',
      retry:'\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629', urgent:'\u0639\u0627\u062c\u0644', advisory:'\u062a\u062d\u0630\u064a\u0631', info:'\u0645\u0639\u0644\u0648\u0645\u0629',
      official:'\u0631\u0633\u0645\u064a', noData:'\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a',
    },
    pt:{
      feed:'Feed ao Vivo', news:'Not\u00edcias', alerts:'Incidentes', crime:'Crime', pack:'Assistente de Mala',
      countries:'Navegador Mundial', account:'Minha Conta', map:'Mapa',
      selectCountry:'Selecionar Pa\u00eds', loading:'Carregando\u2026', noNews:'Sem not\u00edcias',
      safeCheckin:'Check-in Seguro', language:'Idioma', homeCountry:'Pa\u00eds de Origem',
      save:'Salvar', cancel:'Cancelar', profile:'Perfil e Idioma',
      profileSub:'Defina seu pa\u00eds de origem e idioma',
      threatLevel:'N\u00edvel de Amea\u00e7a', total:'TOTAL', last7:'\u00dALTIMOS 7 DIAS',
      incidents:'Incidentes', perDay:'Por Dia', critical:'Cr\u00edtico', highAlert:'Alta Alerta',
      highThreat:'AMEA\u00c7A ALTA', elevated:'ELEVADO', monitor:'MONITORAR', clear:'SEGURO',
      safetyScore:'Pontua\u00e7\u00e3o de Seguran\u00e7a', generallySafe:'Geralmente Seguro',
      exerciseCaution:'Tome Precau\u00e7\u00f5es', highRisk:'Alto Risco',
      recentIncidents:'INCIDENTES RECENTES', noIncidents:'Sem incidentes ativos',
      travelAdvisory:'Aviso de Viagem', doNotTravel:'N\u00c3O VIAJE \u2014 contate sua embaixada',
      totalReports:'Total de Relat\u00f3rios', last90:'\u00daltimos 90 dias', trend:'Tend\u00eancia',
      sources:'Fontes', dataProviders:'Fornecedores de dados', vsPrior:'vs per\u00edodo anterior',
      monthBreakdown:'RESUMO 3 MESES \u00b7 M\u00cdDIA', category:'CATEGORIA',
      worldBankData:'DADOS BANCO MUNDIAL AO VIVO', worldBankSrc:'Banco Mundial \u00b7 Ano mais recente',
      benchmarkNote:'Barras em escala \u00b7 + indica mais incidentes prov\u00e1veis',
      rising:'Subindo', falling:'Caindo', stable:'Est\u00e1vel', high:'ALTO', med:'M\u00c9DIO', low:'BAIXO',
      packTitle:'Assistente de Mala', clothing:'ROUPAS', essentials:'ESSENCIAIS',
      selectFirst:'Selecione um pa\u00eds no mapa primeiro',
      desert:'Deserto / \u00c1rido', tropical:'Tropical', monsoon:'Mon\u00e7\u00e3o',
      arctic:'\u00c1rtico / Sub\u00e1rtico', temperate:'Temperado',
      winter:'Inverno', summer:'Ver\u00e3o', spring:'Primavera', autumn:'Outono',
      catAir:'A\u00e9reo/M\u00edssil', catExplosion:'Explos\u00f5es', catArmed:'Armado',
      catUnrest:'Dist\u00farbios', catDrug:'Tr\u00e1fico', catCrime:'Crime', catWeather:'Clima',
      retry:'Tentar Novamente', urgent:'Urgente', advisory:'Aviso', info:'Info',
      official:'Oficial', noData:'Sem dados dispon\u00edveis',
    },
    ru:{
      feed:'\u041b\u0435\u043d\u0442\u0430', news:'\u041d\u043e\u0432\u043e\u0441\u0442\u0438', alerts:'\u0418\u043d\u0446\u0438\u0434\u0435\u043d\u0442\u044b', crime:'\u041f\u0440\u0435\u0441\u0442\u0443\u043f\u043d\u043e\u0441\u0442\u044c', pack:'\u041f\u043e\u043c\u043e\u0449\u043d\u0438\u043a',
      countries:'\u041e\u0431\u043e\u0437\u0440\u0435\u0432\u0430\u0442\u0435\u043b\u044c \u043c\u0438\u0440\u0430', account:'\u041c\u043e\u0439 \u0430\u043a\u043a\u0430\u0443\u043d\u0442', map:'\u041a\u0430\u0440\u0442\u0430',
      selectCountry:'\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0441\u0442\u0440\u0430\u043d\u0443', loading:'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026', noNews:'\u041d\u043e\u0432\u043e\u0441\u0442\u0435\u0439 \u043d\u0435\u0442',
      safeCheckin:'\u0411\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u044b\u0439 \u0447\u0435\u043a\u0438\u043d', language:'\u042f\u0437\u044b\u043a', homeCountry:'\u0421\u0442\u0440\u0430\u043d\u0430 \u043f\u0440\u043e\u0438\u0441\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u044f',
      save:'\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c', cancel:'\u041e\u0442\u043c\u0435\u043d\u0430', profile:'\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u0438 \u044f\u0437\u044b\u043a',
      profileSub:'\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043d\u0443 \u043f\u0440\u043e\u0438\u0441\u0445\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u0438 \u044f\u0437\u044b\u043a',
      threatLevel:'\u0423\u0440\u043e\u0432\u0435\u043d\u044c \u0443\u0433\u0440\u043e\u0437\u044b', total:'\u0418\u0422\u041e\u0413\u041e', last7:'\u041f\u041e\u0421\u041b\u0415\u0414\u041d\u0418\u0415 7 \u0414\u041d\u0415\u0419',
      incidents:'\u0418\u043d\u0446\u0438\u0434\u0435\u043d\u0442\u044b', perDay:'\u0412 \u0434\u0435\u043d\u044c', critical:'\u041a\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439', highAlert:'\u0412\u044b\u0441\u043e\u043a\u0430\u044f \u0442\u0440\u0435\u0432\u043e\u0433\u0430',
      highThreat:'\u0412\u042b\u0421\u041e\u041a\u0410\u042f \u0423\u0413\u0420\u041e\u0417\u0410', elevated:'\u041f\u041e\u0412\u042b\u0428\u0415\u041d\u041d\u042b\u0419', monitor:'\u041d\u0410\u0411\u041b\u042e\u0414\u0415\u041d\u0418\u0415', clear:'\u0427\u0418\u0421\u0422\u041e',
      safetyScore:'\u041e\u0446\u0435\u043d\u043a\u0430 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u0438', generallySafe:'\u0412 \u0446\u0435\u043b\u043e\u043c \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e',
      exerciseCaution:'\u0421\u043e\u0431\u043b\u044e\u0434\u0430\u0439\u0442\u0435 \u043e\u0441\u0442\u043e\u0440\u043e\u0436\u043d\u043e\u0441\u0442\u044c', highRisk:'\u0412\u044b\u0441\u043e\u043a\u0438\u0439 \u0440\u0438\u0441\u043a',
      recentIncidents:'\u041f\u041e\u0421\u041b\u0415\u0414\u041d\u0418\u0415 \u0418\u041d\u0426\u0418\u0414\u0415\u041d\u0422\u042b', noIncidents:'\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u0438\u043d\u0446\u0438\u0434\u0435\u043d\u0442\u043e\u0432 \u043d\u0435\u0442',
      travelAdvisory:'\u041f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435 \u043e \u043f\u043e\u0435\u0437\u0434\u043a\u0435', doNotTravel:'\u041d\u0415 \u0415\u0425\u0410\u0422\u042c \u2014 \u0441\u0432\u044f\u0436\u0438\u0442\u0435\u0441\u044c \u0441 \u043f\u043e\u0441\u043e\u043b\u044c\u0441\u0442\u0432\u043e\u043c',
      totalReports:'\u0412\u0441\u0435\u0433\u043e \u043e\u0442\u0447\u0451\u0442\u043e\u0432', last90:'\u0417\u0430 90 \u0434\u043d\u0435\u0439', trend:'\u0422\u0435\u043d\u0434\u0435\u043d\u0446\u0438\u044f',
      sources:'\u0418\u0441\u0442\u043e\u0447\u043d\u0438\u043a\u0438', dataProviders:'\u041f\u043e\u0441\u0442\u0430\u0432\u0449\u0438\u043a\u0438 \u0434\u0430\u043d\u043d\u044b\u0445', vsPrior:'\u043f\u043e \u0441\u0440\u0430\u0432\u043d\u0435\u043d\u0438\u044e \u0441 \u043f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0438\u043c',
      monthBreakdown:'\u0421\u0412\u041e\u0414\u041a\u0410 3 \u041c\u0415\u0421\u042f\u0426\u0410', category:'\u041a\u0410\u0422\u0415\u0413\u041e\u0420\u0418\u042f',
      worldBankData:'\u0414\u0410\u041d\u041d\u042b\u0415 \u0412\u0421\u0415\u041c\u0418\u0420\u041d\u041e\u0413\u041e \u0411\u0410\u041d\u041a\u0410', worldBankSrc:'\u0412\u0441\u0435\u043c\u0438\u0440\u043d\u044b\u0439 \u0431\u0430\u043d\u043a \u00b7 \u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 \u0433\u043e\u0434',
      benchmarkNote:'\u0428\u043a\u0430\u043b\u0430 \u043f\u043e \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044e \u00b7 + \u043e\u0437\u043d\u0430\u0447\u0430\u0435\u0442 \u0432\u0435\u0440\u043e\u044f\u0442\u043d\u043e \u0431\u043e\u043b\u044c\u0448\u0435 \u0438\u043d\u0446\u0438\u0434\u0435\u043d\u0442\u043e\u0432',
      rising:'\u0420\u043e\u0441\u0442', falling:'\u0421\u043d\u0438\u0436\u0435\u043d\u0438\u0435', stable:'\u0421\u0442\u0430\u0431\u0438\u043b\u044c\u043d\u043e', high:'\u0412\u042b\u0421\u041e\u041a\u0418\u0419', med:'\u0421\u0420\u0415\u0414\u041d\u0418\u0419', low:'\u041d\u0418\u0417\u041a\u0418\u0419',
      packTitle:'\u041f\u043e\u043c\u043e\u0449\u043d\u0438\u043a', clothing:'\u041e\u0414\u0415\u0416\u0414\u0410', essentials:'\u041d\u0415\u041e\u0411\u0425\u041e\u0414\u0418\u041c\u041e\u0415',
      selectFirst:'\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043d\u0443 \u043d\u0430 \u043a\u0430\u0440\u0442\u0435',
      desert:'\u041f\u0443\u0441\u0442\u044b\u043d\u044f', tropical:'\u0422\u0440\u043e\u043f\u0438\u0447\u0435\u0441\u043a\u0438\u0439', monsoon:'\u041c\u0443\u0441\u0441\u043e\u043d\u043d\u044b\u0439',
      arctic:'\u0410\u0440\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439', temperate:'\u0423\u043c\u0435\u0440\u0435\u043d\u043d\u044b\u0439',
      winter:'\u0417\u0438\u043c\u0430', summer:'\u041b\u0435\u0442\u043e', spring:'\u0412\u0435\u0441\u043d\u0430', autumn:'\u041e\u0441\u0435\u043d\u044c',
      catAir:'\u0412\u043e\u0437\u0434\u0443\u0445/\u0420\u0430\u043a\u0435\u0442\u044b', catExplosion:'\u0412\u0437\u0440\u044b\u0432\u044b', catArmed:'\u0412\u043e\u043e\u0440\u0443\u0436\u0451\u043d\u043d\u044b\u0435',
      catUnrest:'\u0411\u0435\u0441\u043f\u043e\u0440\u044f\u0434\u043a\u0438', catDrug:'\u041d\u0430\u0440\u043a\u043e\u0442\u0438\u043a\u0438', catCrime:'\u041f\u0440\u0435\u0441\u0442\u0443\u043f\u043d\u043e\u0441\u0442\u044c', catWeather:'\u041f\u043e\u0433\u043e\u0434\u0430',
      retry:'\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c', urgent:'\u0421\u0440\u043e\u0447\u043d\u043e', advisory:'\u041f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435', info:'\u0418\u043d\u0444\u043e',
      official:'\u041e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u043e', noData:'\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445',
    },
    zh:{
      feed:'\u5b9e\u65f6\u52a8\u6001', news:'\u65b0\u95fb', alerts:'\u4e8b\u4ef6', crime:'\u72af\u7f6a', pack:'\u884c\u674e\u52a9\u624b',
      countries:'\u4e16\u754c\u6d4f\u89c8\u5668', account:'\u6211\u7684\u8d26\u6237', map:'\u5730\u56fe',
      selectCountry:'\u9009\u62e9\u56fd\u5bb6', loading:'\u52a0\u8f7d\u4e2d\u2026', noNews:'\u672a\u627e\u5230\u65b0\u95fb',
      safeCheckin:'\u5b89\u5168\u7b7e\u5230', language:'\u8bed\u8a00', homeCountry:'\u539f\u7c4d\u56fd',
      save:'\u4fdd\u5b58', cancel:'\u53d6\u6d88', profile:'\u4e2a\u4eba\u8d44\u6599\u548c\u8bed\u8a00',
      profileSub:'\u8bbe\u7f6e\u60a8\u7684\u539f\u7c4d\u56fd\u548c\u8bed\u8a00',
      threatLevel:'\u5a01\u80c1\u7ea7\u522b', total:'\u603b\u8ba1', last7:'\u6700\u8fd17\u5929',
      incidents:'\u4e8b\u4ef6', perDay:'\u6bcf\u5929', critical:'\u4e25\u91cd', highAlert:'\u9ad8\u5ea6\u8b66\u6212',
      highThreat:'\u9ad8\u5a01\u80c1', elevated:'\u5347\u7ea7', monitor:'\u76d1\u63a7', clear:'\u5b89\u5168',
      safetyScore:'\u5b89\u5168\u8bc4\u5206', generallySafe:'\u603b\u4f53\u5b89\u5168',
      exerciseCaution:'\u4fdd\u6301\u8c28\u614e', highRisk:'\u9ad8\u98ce\u9669',
      recentIncidents:'\u8fd1\u671f\u4e8b\u4ef6', noIncidents:'\u65e0\u6d3b\u8dc3\u4e8b\u4ef6',
      travelAdvisory:'\u65c5\u884c\u8b66\u544a', doNotTravel:'\u7981\u6b62\u524d\u5f80 \u2014 \u8054\u7cfb\u60a8\u7684\u5927\u4f7f\u9986',
      totalReports:'\u62a5\u544a\u603b\u6570', last90:'\u8fc790\u5929', trend:'\u8d8b\u52bf',
      sources:'\u6765\u6e90', dataProviders:'\u6570\u636e\u63d0\u4f9b\u8005', vsPrior:'\u4e0e\u4e0a\u671f\u76f8\u6bd4',
      monthBreakdown:'3\u4e2a\u6708\u5206\u6790', category:'\u7c7b\u522b',
      worldBankData:'\u4e16\u754c\u9280\u884c\u5b9e\u65f6\u6570\u636e', worldBankSrc:'\u4e16\u754c\u9280\u884c \u00b7 \u6700\u65b0\u5e74\u4efd',
      benchmarkNote:'\u6761\u5f62\u56fe\u6309\u57fa\u51c6\u7f29\u653e \u00b7 +\u8868\u793a\u53ef\u80fd\u5b58\u5728\u66f4\u591a\u4e8b\u4ef6',
      rising:'\u4e0a\u5347', falling:'\u4e0b\u964d', stable:'\u7a33\u5b9a', high:'\u9ad8', med:'\u4e2d', low:'\u4f4e',
      packTitle:'\u884c\u674e\u52a9\u624b', clothing:'\u670d\u88c5', essentials:'\u5fc5\u5907\u54c1',
      selectFirst:'\u8bf7\u5148\u5728\u5730\u56fe\u4e0a\u9009\u62e9\u56fd\u5bb6',
      desert:'\u6c99\u6f20', tropical:'\u70ed\u5e26', monsoon:'\u5b63\u98ce',
      arctic:'\u5317\u6781', temperate:'\u6e29\u5e26',
      winter:'\u51ac\u5b63', summer:'\u590f\u5b63', spring:'\u6625\u5b63', autumn:'\u79cb\u5b63',
      catAir:'\u7a7a\u4e2d/\u5bfc\u5f39', catExplosion:'\u7206\u70b8', catArmed:'\u6b66\u88c5',
      catUnrest:'\u52a8\u4e71', catDrug:'\u6bd2\u54c1\u72af\u7f6a', catCrime:'\u72af\u7f6a', catWeather:'\u5929\u6c14',
      retry:'\u91cd\u8bd5', urgent:'\u7d27\u6025', advisory:'\u8b66\u544a', info:'\u4fe1\u606f',
      official:'\u5b98\u65b9', noData:'\u6682\u65e0\u6570\u636e',
    },
    de:{
      feed:'Live-Feed', news:'Nachrichten', alerts:'Vorf\u00e4lle', crime:'Kriminalit\u00e4t', pack:'Packassistent',
      countries:'Weltbrowser', account:'Mein Konto', map:'Karte',
      selectCountry:'Land ausw\u00e4hlen', loading:'Laden\u2026', noNews:'Keine Nachrichten',
      safeCheckin:'Sicher einchecken', language:'Sprache', homeCountry:'Heimatland',
      save:'Speichern', cancel:'Abbrechen', profile:'Profil & Sprache',
      profileSub:'Heimatland und Sprache festlegen',
      threatLevel:'Bedrohungsstufe', total:'GESAMT', last7:'LETZTE 7 TAGE',
      incidents:'Vorf\u00e4lle', perDay:'Pro Tag', critical:'Kritisch', highAlert:'Hohe Alarmbereitschaft',
      highThreat:'HOHE BEDROHUNG', elevated:'ERHOHT', monitor:'BEOBACHTEN', clear:'SICHER',
      safetyScore:'Sicherheitsbewertung', generallySafe:'Im Allgemeinen sicher',
      exerciseCaution:'Vorsicht walten lassen', highRisk:'Hohes Risiko',
      recentIncidents:'AKTUELLE VORF\u00c4LLE', noIncidents:'Keine aktiven Vorf\u00e4lle',
      travelAdvisory:'Reisewarnung', doNotTravel:'NICHT REISEN \u2014 Botschaft kontaktieren',
      totalReports:'Berichte gesamt', last90:'Letzte 90 Tage', trend:'Tendenz',
      sources:'Quellen', dataProviders:'Datenanbieter', vsPrior:'vs. Vorperiode',
      monthBreakdown:'3-MONATS-\u00dcBERSICHT \u00b7 MEDIEN', category:'KATEGORIE',
      worldBankData:'WELTBANK-LIVEDATEN', worldBankSrc:'Weltbank \u00b7 Aktuellstes Jahr',
      benchmarkNote:'Balken skaliert \u00b7 + bedeutet wahrscheinlich mehr Vorf\u00e4lle',
      rising:'Steigend', falling:'Fallend', stable:'Stabil', high:'HOCH', med:'MITTEL', low:'NIEDRIG',
      packTitle:'Packassistent', clothing:'KLEIDUNG', essentials:'NOTWENDIGES',
      selectFirst:'W\u00e4hlen Sie zuerst ein Land auf der Karte',
      desert:'W\u00fcste', tropical:'Tropisch', monsoon:'Monsun',
      arctic:'Arktisch', temperate:'Gem\u00e4\u00dfigt',
      winter:'Winter', summer:'Sommer', spring:'Fr\u00fchling', autumn:'Herbst',
      catAir:'Luft/Rakete', catExplosion:'Explosionen', catArmed:'Bewaffnet',
      catUnrest:'Unruhen', catDrug:'Drogenhandel', catCrime:'Kriminalit\u00e4t', catWeather:'Wetter',
      retry:'Erneut versuchen', urgent:'Dringend', advisory:'Warnung', info:'Info',
      official:'Offiziell', noData:'Keine Daten',
    },
    ja:{
      feed:'\u30e9\u30a4\u30d6\u30d5\u30a3\u30fc\u30c9', news:'\u30cb\u30e5\u30fc\u30b9', alerts:'\u30a4\u30f3\u30b7\u30c7\u30f3\u30c8', crime:'\u72af\u7f6a', pack:'\u30d1\u30c3\u30af\u30a2\u30b7\u30b9\u30bf\u30f3\u30c8',
      countries:'\u30ef\u30fc\u30eb\u30c9\u30d6\u30e9\u30a6\u30b6', account:'\u30de\u30a4\u30a2\u30ab\u30a6\u30f3\u30c8', map:'\u5730\u56f3',
      selectCountry:'\u56fd\u3092\u9078\u629e', loading:'\u8aad\u307f\u8fbc\u307f\u4e2d\u2026', noNews:'\u30cb\u30e5\u30fc\u30b9\u306a\u3057',
      safeCheckin:'\u5b89\u5168\u30c1\u30a7\u30c3\u30af\u30a4\u30f3', language:'\u8a00\u8a9e', homeCountry:'\u51fa\u8eab\u56fd',
      save:'\u4fdd\u5b58', cancel:'\u30ad\u30e3\u30f3\u30bb\u30eb', profile:'\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3068\u8a00\u8a9e',
      profileSub:'\u51fa\u8eab\u56fd\u3068\u8a00\u8a9e\u3092\u8a2d\u5b9a',
      threatLevel:'\u8105\u5a01\u30ec\u30d9\u30eb', total:'\u5408\u8a08', last7:'\u904e\u53bb7\u65e5\u9593',
      incidents:'\u30a4\u30f3\u30b7\u30c7\u30f3\u30c8', perDay:'1\u65e5\u3042\u305f\u308a', critical:'\u7dca\u6025', highAlert:'\u9ad8\u8b66\u6212',
      highThreat:'\u9ad8\u8105\u5a01', elevated:'\u4e0a\u6607', monitor:'\u76e3\u8996', clear:'\u5b89\u5168',
      safetyScore:'\u5b89\u5168\u30b9\u30b3\u30a2', generallySafe:'\u6982\u306d\u5b89\u5168',
      exerciseCaution:'\u6ce8\u610f\u304c\u5fc5\u8981', highRisk:'\u9ad8\u30ea\u30b9\u30af',
      recentIncidents:'\u6700\u8fd1\u306e\u30a4\u30f3\u30b7\u30c7\u30f3\u30c8', noIncidents:'\u6d3b\u767a\u306a\u30a4\u30f3\u30b7\u30c7\u30f3\u30c8\u306a\u3057',
      travelAdvisory:'\u6e21\u822a\u5371\u967a\u60c5\u5831', doNotTravel:'\u6e21\u822a\u7981\u6b62 \u2014 \u5927\u4f7f\u9928\u306b\u9023\u7d61',
      totalReports:'\u7dcf\u30ec\u30dd\u30fc\u30c8\u6570', last90:'\u904e\u53bb90\u65e5\u9593', trend:'\u50be\u5411',
      sources:'\u30bd\u30fc\u30b9', dataProviders:'\u30c7\u30fc\u30bf\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc', vsPrior:'\u524d\u671f\u6bd4',
      monthBreakdown:'3\u30f6\u6708\u5206\u6790', category:'\u30ab\u30c6\u30b4\u30ea\u30fc',
      worldBankData:'\u4e16\u754c\u9280\u884c\u30e9\u30a4\u30d6\u30c7\u30fc\u30bf', worldBankSrc:'\u4e16\u754c\u9280\u884c \u00b7 \u6700\u65b0\u5e74',
      benchmarkNote:'\u30d0\u30fc\u306f\u30d9\u30f3\u30c1\u30de\u30fc\u30af\u6bd4 \u00b7 +\u306f\u3055\u3089\u306b\u591a\u304f\u306e\u4e8b\u4f8b\u304c\u3042\u308b\u53ef\u80fd\u6027',
      rising:'\u4e0a\u6607', falling:'\u4f4e\u4e0b', stable:'\u5b89\u5b9a', high:'\u9ad8', med:'\u4e2d', low:'\u4f4e',
      packTitle:'\u30d1\u30c3\u30af\u30a2\u30b7\u30b9\u30bf\u30f3\u30c8', clothing:'\u8863\u985e', essentials:'\u5fc5\u9700\u54c1',
      selectFirst:'\u307e\u305a\u5730\u56f3\u3067\u56fd\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044',
      desert:'\u7802\u6f20', tropical:'\u71b1\u5e2f', monsoon:'\u30e2\u30f3\u30b9\u30fc\u30f3',
      arctic:'\u5317\u6975', temperate:'\u6e29\u5e2f',
      winter:'\u51ac', summer:'\u590f', spring:'\u6625', autumn:'\u79cb',
      catAir:'\u822a\u7a7a/\u30df\u30b5\u30a4\u30eb', catExplosion:'\u7206\u767a', catArmed:'\u6b66\u88c5',
      catUnrest:'\u9a12\u4e71', catDrug:'\u9ebb\u85ac\u72af\u7f6a', catCrime:'\u72af\u7f6a', catWeather:'\u6c17\u8c58',
      retry:'\u518d\u8a66\u884c', urgent:'\u7dca\u6025', advisory:'\u8b66\u544a', info:'\u60c5\u5831',
      official:'\u516c\u5f0f', noData:'\u30c7\u30fc\u30bf\u306a\u3057',
    },
    ko:{
      feed:'\ub77c\uc774\ube0c \ud53c\ub4dc', news:'\ub274\uc2a4', alerts:'\uc0ac\uac74', crime:'\ubc94\uc8c4', pack:'\uc9d0 \ub3c4\uc6b0\ubbf8',
      countries:'\uc138\uacc4 \ube0c\ub77c\uc6b0\uc800', account:'\ub0b4 \uacc4\uc815', map:'\uc9c0\ub3c4',
      selectCountry:'\uad6d\uac00 \uc120\ud0dd', loading:'\ub85c\ub529 \uc911\u2026', noNews:'\ub274\uc2a4 \uc5c6\uc74c',
      safeCheckin:'\uc548\uc804 \uccb4\ud06c\uc778', language:'\uc5b8\uc5b4', homeCountry:'\ucd9c\uc2e0 \uad6d\uac00',
      save:'\uc800\uc7a5', cancel:'\ucde8\uc18c', profile:'\ud504\ub85c\ud544 \ubc0f \uc5b8\uc5b4',
      profileSub:'\ucd9c\uc2e0 \uad6d\uac00\uc640 \uc5b8\uc5b4\ub97c \uc124\uc815\ud558\uc138\uc694',
      threatLevel:'\uc704\ud611 \uc218\uc900', total:'\ud569\uacc4', last7:'\ucd5c\uadfc 7\uc77c',
      incidents:'\uc0ac\uac74', perDay:'\ud558\ub8e8 \uae30\uc900', critical:'\uc704\uae09', highAlert:'\uace0\ub3c4 \uacbd\uacc4',
      highThreat:'\ub192\uc740 \uc704\ud611', elevated:'\uc0c1\uc2b9', monitor:'\ubaa8\ub2c8\ud130\ub9c1', clear:'\uc548\uc804',
      safetyScore:'\uc548\uc804 \uc810\uc218', generallySafe:'\uc77c\ubc18\uc801\uc73c\ub85c \uc548\uc804',
      exerciseCaution:'\uc8fc\uc758 \ud544\uc694', highRisk:'\ub192\uc740 \uc704\ud5d8',
      recentIncidents:'\ucd5c\uadfc \uc0ac\uac74', noIncidents:'\ud65c\uc131 \uc0ac\uac74 \uc5c6\uc74c',
      travelAdvisory:'\uc5ec\ud589 \uacbd\ubcf4', doNotTravel:'\uc5ec\ud589 \uae08\uc9c0 \u2014 \ub300\uc0ac\uad00\uc5d0 \uc5f0\ub77d',
      totalReports:'\ucd1d \ubcf4\uace0\uc11c', last90:'\ucd5c\uadfc 90\uc77c', trend:'\ucd94\uc138',
      sources:'\ucd9c\uccb4', dataProviders:'\ub370\uc774\ud130 \uc81c\uacf5\uc790', vsPrior:'\uc774\uc804 \uae30\uac04 \ub300\ube44',
      monthBreakdown:'3\uac1c\uc6d4 \ubd84\uc11d', category:'\uce74\ud14c\uace0\ub9ac',
      worldBankData:'\uc138\uacc4\uc740\ud589 \ub77c\uc774\ube0c \ub370\uc774\ud130', worldBankSrc:'\uc138\uacc4\uc740\ud589 \u00b7 \ucd5c\uadfc \uc5f0\ub3c4',
      benchmarkNote:'\ubc14 \uae30\uc900 \ucca5\ub3c4 \u00b7 +\ub294 \ub354 \ub9ce\uc740 \uc0ac\uac74 \uac00\ub2a5\uc131',
      rising:'\uc0c1\uc2b9', falling:'\ud558\ub77d', stable:'\uc548\uc815', high:'\ub192\uc74c', med:'\uc911\uac04', low:'\ub099\uc74c',
      packTitle:'\uc9d0 \ub3c4\uc6b0\ubbf8', clothing:'\uc758\ub958', essentials:'\ud544\uc218\ud488',
      selectFirst:'\uba3c\uc800 \uc9c0\ub3c4\uc5d0\uc11c \uad6d\uac00\ub97c \uc120\ud0dd\ud558\uc138\uc694',
      desert:'\uc0ac\ub9c9', tropical:'\uc5f4\ub300', monsoon:'\ubaa8\ub860',
      arctic:'\ubd81\uadf9', temperate:'\uc628\ub300',
      winter:'\uaca8\uc6b8', summer:'\uc5ec\ub984', spring:'\ubd04', autumn:'\uac00\uc744',
      catAir:'\uacf5\uc911/\ubbf8\uc0ac\uc77c', catExplosion:'\ud3ed\ubc1c', catArmed:'\ubb34\uc7a5',
      catUnrest:'\ubd88\uc548', catDrug:'\ub9c8\uc57d \ubc94\uc8c4', catCrime:'\ubc94\uc8c4', catWeather:'\ub0a0\uc528',
      retry:'\ub2e4\uc2dc \uc2dc\ub3c4', urgent:'\uae34\uae09', advisory:'\uacbd\ubcf4', info:'\uc815\ubcf4',
      official:'\uacf5\uc2dd', noData:'\ub370\uc774\ud130 \uc5c6\uc74c',
    },
    tr:{
      feed:'Canl\u0131 Ak\u0131\u015f', news:'Haberler', alerts:'Olaylar', crime:'Su\u00e7', pack:'Bavul Asistan\u0131',
      countries:'D\u00fcnya Taray\u0131c\u0131', account:'Hesab\u0131m', map:'Harita',
      selectCountry:'\u00dclke Se\u00e7', loading:'Y\u00fckleniyor\u2026', noNews:'Haber bulunamad\u0131',
      safeCheckin:'G\u00fcvenli Giri\u015f', language:'Dil', homeCountry:'Men\u015fei \u00dclke',
      save:'Kaydet', cancel:'\u0130ptal', profile:'Profil ve Dil',
      profileSub:'Ana \u00fclkenizi ve dilinizi ayarlay\u0131n',
      threatLevel:'Tehdit Seviyesi', total:'TOPLAM', last7:'SON 7 G\u00dcN',
      incidents:'Olaylar', perDay:'G\u00fcnl\u00fck', critical:'Kritik', highAlert:'Y\u00fcksek Alarm',
      highThreat:'Y\u00dcKSEK TEHD\u0130T', elevated:'Y\u00dcKSELM\u0130\u015e', monitor:'\u0130ZLE', clear:'G\u00dcVENL\u0130',
      safetyScore:'G\u00fcvenlik Puan\u0131', generallySafe:'Genel olarak G\u00fcvenli',
      exerciseCaution:'Dikkatli Olun', highRisk:'Y\u00fcksek Risk',
      recentIncidents:'SON OLAYLAR', noIncidents:'Aktif olay yok',
      travelAdvisory:'Seyahat Uyard\u0131s\u0131', doNotTravel:'SEYAHAT ETMEY\u0130N \u2014 B\u00fcy\u00fckelbiseli\u011finizi aray\u0131n',
      totalReports:'Toplam Rapor', last90:'Son 90 g\u00fcn', trend:'E\u011filim',
      sources:'Kaynaklar', dataProviders:'Veri sa\u011flay\u0131c\u0131lar\u0131', vsPrior:'\u00f6nceki d\u00f6neme k\u0131yasla',
      monthBreakdown:'3 AYLIK \u00d6ZET \u00b7 MEDYA', category:'KATEGOR\u0130',
      worldBankData:'D\u00dcNYA BANKASI CANLI VER\u0130', worldBankSrc:'D\u00fcnya Bankas\u0131 \u00b7 En g\u00fcncel y\u0131l',
      benchmarkNote:'\u00c7ubuklar \u00f6l\u00e7ekli \u00b7 + daha fazla olay olabilece\u011fini g\u00f6sterir',
      rising:'Y\u00fckseliyor', falling:'D\u00fc\u015f\u00fcyor', stable:'Stabil', high:'Y\u00dcKSEK', med:'ORTA', low:'D\u00dc\u015e\u00dcK',
      packTitle:'Bavul Asistan\u0131', clothing:'G\u0130YS\u0130', essentials:'TEMEL E\u015eYALAR',
      selectFirst:'\u00d6nce haritadan bir \u00fclke se\u00e7in',
      desert:'\u00c7\u00f6l', tropical:'Tropikal', monsoon:'Muson',
      arctic:'Arktik', temperate:'\u0131l\u0131man',
      winter:'K\u0131\u015f', summer:'Yaz', spring:'\u0130lkbahar', autumn:'Sonbahar',
      catAir:'Hava/F\u00fcze', catExplosion:'Patlamalar', catArmed:'Silahl\u0131',
      catUnrest:'Karga\u015fa', catDrug:'Uyu\u015fturucu Su\u00e7u', catCrime:'Su\u00e7', catWeather:'Hava Durumu',
      retry:'Tekrar Dene', urgent:'Acil', advisory:'Uyar\u0131', info:'Bilgi',
      official:'Resmi', noData:'Veri yok',
    },
    hi:{
      feed:'\u0932\u093e\u0907\u0935 \u092b\u093c\u0940\u0921', news:'\u0938\u092e\u093e\u091a\u093e\u0930', alerts:'\u0918\u091f\u0928\u093e\u090f\u0902', crime:'\u0905\u092a\u0930\u093e\u0927', pack:'\u092a\u0948\u0915 \u0938\u0939\u093e\u092f\u0915',
      countries:'\u0935\u093f\u0936\u094d\u0935 \u092c\u094d\u0930\u093e\u0909\u091c\u093c\u0930', account:'\u092e\u0947\u0930\u093e \u0916\u093e\u0924\u093e', map:'\u0928\u0915\u094d\u0936\u093e',
      selectCountry:'\u0926\u0947\u0936 \u091a\u0941\u0928\u0947\u0902', loading:'\u0932\u094b\u0921 \u0939\u094b \u0930\u0939\u093e \u0939\u0948\u2026', noNews:'\u0915\u094b\u0908 \u0938\u092e\u093e\u091a\u093e\u0930 \u0928\u0939\u0940\u0902',
      safeCheckin:'\u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u091a\u0947\u0915-\u0907\u0928', language:'\u092d\u093e\u0937\u093e', homeCountry:'\u092e\u0942\u0932 \u0926\u0947\u0936',
      save:'\u0938\u0939\u0947\u091c\u0947\u0902', cancel:'\u0930\u0926\u094d\u0926 \u0915\u0930\u0947\u0902', profile:'\u092a\u094d\u0930\u094b\u092b\u093c\u093e\u0907\u0932 \u0914\u0930 \u092d\u093e\u0937\u093e',
      profileSub:'\u0905\u092a\u0928\u093e \u092e\u0942\u0932 \u0926\u0947\u0936 \u0914\u0930 \u092d\u093e\u0937\u093e \u0938\u0947\u091f \u0915\u0930\u0947\u0902',
      threatLevel:'\u0916\u0924\u0930\u0947 \u0915\u093e \u0938\u094d\u0924\u0930', total:'\u0915\u0941\u0932', last7:'\u092a\u093f\u091b\u0932\u0947 7 \u0926\u093f\u0928',
      incidents:'\u0918\u091f\u0928\u093e\u090f\u0902', perDay:'\u092a\u094d\u0930\u0924\u093f \u0926\u093f\u0928', critical:'\u0917\u0902\u092d\u0940\u0930', highAlert:'\u0909\u091a\u094d\u091a \u0938\u0924\u0930\u094d\u0915\u0924\u093e',
      highThreat:'\u0909\u091a\u094d\u091a \u0916\u0924\u0930\u093e', elevated:'\u092c\u0922\u093c\u093e \u0939\u0941\u0906', monitor:'\u0928\u093f\u0917\u0930\u093e\u0928\u0940', clear:'\u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924',
      safetyScore:'\u0938\u0941\u0930\u0915\u094d\u0937\u093e \u0938\u094d\u0915\u094b\u0930', generallySafe:'\u0938\u093e\u092e\u093e\u0928\u094d\u092f\u0924\u0903 \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924',
      exerciseCaution:'\u0938\u093e\u0935\u0927\u093e\u0928\u0940 \u092c\u0930\u0924\u0947\u0902', highRisk:'\u0909\u091a\u094d\u091a \u091c\u094b\u0916\u093f\u092e',
      recentIncidents:'\u0939\u093e\u0932 \u0915\u0940 \u0918\u091f\u0928\u093e\u090f\u0902', noIncidents:'\u0915\u094b\u0908 \u0938\u0915\u094d\u0930\u093f\u092f \u0918\u091f\u0928\u093e \u0928\u0939\u0940\u0902',
      travelAdvisory:'\u092f\u093e\u0924\u094d\u0930\u093e \u0938\u0932\u093e\u0939', doNotTravel:'\u092f\u093e\u0924\u094d\u0930\u093e \u0928 \u0915\u0930\u0947\u0902 \u2014 \u0905\u092a\u0928\u0947 \u0926\u0942\u0924\u093e\u0935\u093e\u0938 \u0938\u0947 \u0938\u0902\u092a\u0930\u094d\u0915 \u0915\u0930\u0947\u0902',
      totalReports:'\u0915\u0941\u0932 \u0930\u093f\u092a\u094b\u0930\u094d\u091f', last90:'\u092a\u093f\u091b\u0932\u0947 90 \u0926\u093f\u0928', trend:'\u0930\u0941\u091d\u093e\u0928',
      sources:'\u0938\u094d\u0930\u094b\u0924', dataProviders:'\u0921\u0947\u091f\u093e \u092a\u094d\u0930\u0926\u093e\u0924\u093e', vsPrior:'\u092a\u093f\u091b\u0932\u0940 \u0905\u0935\u0927\u093f \u0915\u0940 \u0924\u0941\u0932\u0928\u093e \u092e\u0947\u0902',
      monthBreakdown:'3 \u092e\u0939\u0940\u0928\u0947 \u0915\u093e \u0935\u093f\u0936\u094d\u0932\u0947\u0937\u0923', category:'\u0936\u094d\u0930\u0947\u0923\u0940',
      worldBankData:'\u0935\u093f\u0936\u094d\u0935 \u092c\u0948\u0902\u0915 \u0921\u0947\u091f\u093e', worldBankSrc:'\u0935\u093f\u0936\u094d\u0935 \u092c\u0948\u0902\u0915 \u00b7 \u0938\u092c\u0938\u0947 \u0939\u093e\u0932\u093f\u092f\u093e \u0935\u0930\u094d\u0937',
      benchmarkNote:'\u092c\u093e\u0930 \u092c\u0947\u0902\u091a\u092e\u093e\u0930\u094d\u0915 \u092a\u0930 \u0906\u0927\u093e\u0930\u093f\u0924 \u00b7 + \u0915\u093e \u0905\u0930\u094d\u0925 \u0905\u0927\u093f\u0915 \u0918\u091f\u0928\u093e\u090f\u0902 \u0938\u0902\u092d\u0935 \u0939\u0948\u0902',
      rising:'\u092c\u0922\u093c \u0930\u0939\u093e \u0939\u0948', falling:'\u0918\u091f \u0930\u0939\u093e \u0939\u0948', stable:'\u0938\u094d\u0925\u093f\u0930', high:'\u0909\u091a\u094d\u091a', med:'\u092e\u0927\u094d\u092f\u092e', low:'\u0928\u093f\u092e\u094d\u0928',
      packTitle:'\u092a\u0948\u0915 \u0938\u0939\u093e\u092f\u0915', clothing:'\u0915\u092a\u0921\u093c\u0947', essentials:'\u0906\u0935\u0936\u094d\u092f\u0915 \u0935\u0938\u094d\u0924\u0941\u090f\u0902',
      selectFirst:'\u092a\u0939\u0932\u0947 \u0928\u0915\u094d\u0936\u0947 \u092a\u0930 \u0926\u0947\u0936 \u091a\u0941\u0928\u0947\u0902',
      desert:'\u0930\u0947\u0917\u093f\u0938\u094d\u0924\u093e\u0928', tropical:'\u0909\u0937\u094d\u0923\u0915\u091f\u093f\u092c\u0902\u0927\u0940\u092f', monsoon:'\u092e\u093e\u0928\u0938\u0942\u0928',
      arctic:'\u0906\u0930\u094d\u0915\u091f\u093f\u0915', temperate:'\u0938\u092e\u0936\u0940\u0924\u094b\u0937\u094d\u0923',
      winter:'\u0938\u0930\u094d\u0926\u0940', summer:'\u0917\u0930\u094d\u092e\u0940', spring:'\u0935\u0938\u0902\u0924', autumn:'\u0936\u0930\u0926 \u0943\u0924\u0941',
      catAir:'\u0935\u093e\u092f\u0941/\u092e\u093f\u0938\u093e\u0907\u0932', catExplosion:'\u0935\u093f\u0938\u094d\u092b\u094b\u091f', catArmed:'\u0938\u0936\u0938\u094d\u0924\u094d\u0930',
      catUnrest:'\u0905\u0936\u093e\u0902\u0924\u093f', catDrug:'\u0928\u0936\u0940\u0932\u0947 \u092a\u0926\u093e\u0930\u094d\u0925', catCrime:'\u0905\u092a\u0930\u093e\u0927', catWeather:'\u092e\u094c\u0938\u092e',
      retry:'\u092a\u0941\u0928\u0903 \u092a\u094d\u0930\u092f\u093e\u0938', urgent:'\u0905\u0924\u094d\u092f\u093e\u0935\u0936\u094d\u092f\u0915', advisory:'\u0938\u0932\u093e\u0939', info:'\u091c\u093e\u0928\u0915\u093e\u0930\u0940',
      official:'\u0906\u0927\u093f\u0915\u093e\u0930\u093f\u0915', noData:'\u0921\u0947\u091f\u093e \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902',
    },
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
        var threatLevel = critical > 0 ? [t('highThreat'),T.red] : high > 2 ? [t('elevated'),T.gold] : events.length > 0 ? [t('monitor'),'#3B82F6'] : [t('clear'),T.green];

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
        var scoreLabel = safeScore >= 70 ? t('generallySafe') : safeScore >= 40 ? t('exerciseCaution') : t('highRisk');
        html += '<div style="margin:8px 12px 0;background:#fff;border-radius:10px;border:1px solid '+T.border+';padding:12px 14px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
        html += '<div style="font-size:11px;font-weight:600;color:'+T.text+';">'+t('safetyScore')+'</div>';
        html += '<div style="font-size:13px;font-weight:800;color:'+scoreColor+';">'+safeScore+' <span style="font-size:10px;font-weight:600;">'+scoreLabel+'</span></div>';
        html += '</div>';
        html += '<div style="height:6px;background:'+T.border+';border-radius:3px;">';
        html += '<div style="height:100%;width:'+safeScore+'%;background:'+scoreColor+';border-radius:3px;transition:width 0.6s;"></div>';
        html += '</div></div>';

        // ── Tourist safety tips — country-specific ────────────
        var tips = [];
        var cData = (window.allCountries||[]).find(function(c){ return c.code===code; }) || {};
        var advisoryLevel = cData.advisoryLevel || 1;
        // Incident-driven tips first
        if (buckets.air && buckets.air.length)       tips.push('🚀 Air threat activity detected — know your nearest shelter and follow local emergency broadcasts');
        if (buckets.explosion && buckets.explosion.length) tips.push('💥 Explosion reports in the area — avoid crowded public spaces and markets');
        if (buckets.armed && buckets.armed.length)   tips.push('🔫 Armed incident reports — stay indoors, avoid confrontations, follow authority guidance');
        if (buckets.protest && buckets.protest.length) tips.push('✊ Civil unrest reported — avoid demonstrations even if peaceful, they can escalate rapidly');
        if (buckets.weather && buckets.weather.length) tips.push('⛈️ Adverse weather alerts active — check local forecasts before travel, follow evacuation orders');
        if (buckets.drug && buckets.drug.length)     tips.push('💊 Drug-related activity reported — avoid isolated areas at night, do not accept items from strangers');
        if (buckets.crime && buckets.crime.length)   tips.push('🔴 Crime activity reported — secure valuables, avoid displaying expensive items, use reputable transport');
        // Country-specific standing advice
        var countryTips = {
          JO:['🕌 Dress modestly near religious sites — cover shoulders and knees','🚗 Border areas with Syria and Iraq — avoid unless essential','💊 Drug trafficking is a serious issue — do not carry unexplained packages'],
          UA:['🚨 Active conflict zones — do not approach front-line regions','💣 UXO risk in liberated areas — stay on paved roads','📻 Keep emergency radio for air raid alerts'],
          LB:['⚡ Power outages are frequent — carry a power bank','🚧 Avoid south near Israeli border — active tension','💵 Carry USD — banking system is unstable'],
          SY:['🚫 Travel strongly discouraged — active conflict throughout','🏥 Medical infrastructure severely damaged','📞 Register with your embassy before any entry'],
          IQ:['💣 IED risk in rural areas — stay on established routes','🕌 Respect religious sites and holy days','📱 VPN recommended — internet monitoring common'],
          IL:['🚀 Red Alert app — install before arrival','🕌 Dress appropriately at religious sites','🚗 Check security before travel near Gaza border'],
          EG:['🌅 Sinai — only travel to resort areas','📷 Photography restrictions near military sites','🐪 Agree on prices upfront near tourist sites'],
          MX:['🚗 Avoid driving at night — carjacking risk on highways','🍺 Only buy sealed drinks — drink-spiking reported','💳 Use ATMs inside banks or hotels only'],
          CO:['🌿 Avoid rural coca-growing regions','🚕 Only use app-based taxis — never hail street taxis','🏔️ Altitude sickness risk in Bogotá — acclimatize slowly'],
          NG:['✈️ Northeast and Port Harcourt — high kidnapping risk','💵 Keep cash in multiple locations','🚗 Do not drive after dark outside major cities'],
          PH:['🌊 Typhoon season June-November — monitor PAGASA warnings','🏝️ Mindanao and Sulu — kidnapping and terrorism risk','🛵 Only use registered transport'],
          TH:['🚗 Road fatalities among highest in Asia — wear helmets on bikes','🌊 Tsunami coast — know evacuation routes','👮 Strict laws regarding the monarchy'],
          MM:['🚫 Travel advisories active — conflict ongoing in multiple states','📵 Internet shutdowns common — download content offline','💵 USD cash only — card machines unreliable'],
          VE:['🔦 Power cuts frequent — carry torch and power bank','🚗 Carjacking common — keep windows up and doors locked','🏥 Medical supplies scarce — bring all medications from home'],
          HT:['🚫 Gang control of major roads — avoid all non-essential travel','🏥 Medical infrastructure collapsed — carry full first aid kit','✈️ Use official channels only at airport'],
          IN:['🌡️ Heatwave risk May-June — stay hydrated, avoid midday sun','💧 Only drink bottled or purified water','🚕 Use app-based taxis — meter fraud common'],
          PK:['📍 FATA and Balochistan — only travel with security escort','📷 Photography near military — strictly prohibited','🕌 Respect fasting rules in public during Ramadan'],
          AF:['🚫 Do not travel — ongoing security crisis','🏥 Medical evacuation extremely difficult','📞 Emergency: ICRC +93 20 210 2288'],
          BR:['🏖️ No valuables on beach — robberies are common','🚗 Avoid favelas unless on guided tour','💊 Yellow fever vaccination recommended for Amazon'],
          ZA:['🚗 Smash-and-grab common — keep windows up at traffic lights','🏥 Use private hospitals — ensure insurance','⚡ Load shedding 2-12 hours daily — plan accordingly'],
          KE:['🦟 Malaria risk — take prophylaxis, use repellent','🌊 Coastal flooding risk in long rains (March-May)','🚕 Ride-apps safer than matatu minibus'],
        };
        var standing = countryTips[code] || [];
        if (advisoryLevel >= 4) tips.unshift('🚨 '+t('doNotTravel'));
        standing.slice(0,3).forEach(function(tip){ tips.push(tip); });
        if (!tips.length) {
          tips.push('✅ '+t('noIncidents')+' — '+( cData.name || code || t('selectCountry')));
          tips.push('📋 Register your trip with your home country\'s embassy online');
          if (cData.emergency) {
            var em=cData.emergency;
            tips.push('📱 Emergency: '+(em.police?'Police '+em.police:'')+(em.ambulance?' · Ambulance '+em.ambulance:''));
          }
        }
        if (tips.length) {
          html += '<div style="margin:8px 12px 0;background:'+T.tealLight+';border-radius:10px;border:1px solid rgba(14,116,144,0.2);padding:12px 14px;">';
          html += '<div style="font-size:10px;font-weight:700;color:'+T.teal+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">';
          html += cData.name ? '📍 '+cData.name+' \u2014 '+t('travelAdvisory') : t('travelAdvisory');
          html += '</div>';
          tips.forEach(function(tip) {
            html += '<div style="font-size:12px;color:'+T.text+';padding:5px 0;border-bottom:1px solid rgba(14,116,144,0.12);line-height:1.5;">'+tip+'</div>';
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
        html += summaryCard('\uD83D\uDD0D',t('totalReports'),total,t('last90'),T.teal);
        html += summaryCard(trendIcon,t('trend'),trend.charAt(0).toUpperCase()+trend.slice(1),t('vsPrior'),trendColor);
        html += summaryCard('\uD83D\uDCE1',t('sources'),(d.sources||[]).length,t('dataProviders'),T.muted);
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
    html += summaryCard('🔍','Total Events',total,t('last90'),T.teal);
    html += summaryCard(trendIcon,t('trend'),trendLabel,t('vsPrior'),trendColor);
    html += summaryCard('📊',t('sources'),sources||'GDELT',t('dataProviders'),T.muted);
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

      // Re-render current view with new language
      if (overlay && overlay.style.display !== 'none') {
        // Get the currently active tab and refresh it
        var currentTab = 'account'; // default assumption
        if (_feedTab && overlay.innerHTML.includes('aa-feed-body')) {
          currentTab = 'feed';
        } else if (overlay.innerHTML.includes('aa-pack-body')) {
          currentTab = 'pack';
        } else if (overlay.innerHTML.includes('aa-countries-body')) {
          currentTab = 'countries';
        } else if (overlay.innerHTML.includes('aa-account-body')) {
          currentTab = 'account';
        }
        // Refresh the current tab to show new language
        switchTab(currentTab);
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
