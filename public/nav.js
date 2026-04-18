/*
  Atlas Ally — nav.js (Surgical Enhancement v2026.04.16)
  ✅ Add Emergency Contacts feature (missing from handoff doc)
  ✅ Enhance Pack Assistant with AI backend integration
  ✅ Keep all other working functionality unchanged
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
    { code:'it', label:'Italiano' },
    { code:'ja', label:'日本語' },
    { code:'ko', label:'한국어' },
    { code:'tr', label:'Türkçe' },
    { code:'hi', label:'हिन्दी' },
  ];

  var I18N = {
    en:{
      feed:'Live Feed', news:'News', alerts:'Incidents', crime:'Crime', pack:'Pack Assistant',
      countries:'World Browser', account:'My Account', map:'Map',
      selectCountry:'Select a Country', loading:'Loading…', noNews:'No News Found',
      safeCheckin:'Safe Check-in', language:'Language', homeCountry:'Home Country',
      save:'Save', cancel:'Cancel', profile:'Profile & Language',
      profileSub:'Set your home country and language',
      threatLevel:'Threat Level', total:'TOTAL', last7:'LAST 7 DAYS',
      incidents:'Incidents', perDay:'Per Day', critical:'Critical', highAlert:'High Alert',
      highThreat:'HIGH THREAT', elevated:'ELEVATED', monitor:'MONITOR', clear:'CLEAR',
      safetyScore:'Safety Score', generallySafe:'Generally Safe',
      exerciseCaution:'Exercise Caution', highRisk:'High Risk',
      recentIncidents:'RECENT INCIDENTS', noIncidents:'No active incidents',
      travelAdvisory:'Travel Advisory', doNotTravel:'DO NOT TRAVEL — contact your embassy',
      totalReports:'Total Reports', last90:'Last 90 days', trend:'Trend',
      sources:'Sources', dataProviders:'Data Providers', vsPrior:'vs prior period',
      monthBreakdown:'3-MONTH BREAKDOWN · MEDIA', category:'CATEGORY',
      worldBankData:'LIVE WORLD BANK DATA', worldBankSrc:'World Bank · Most recent year',
      benchmarkNote:'Bars scaled · + indicates likely more incidents',
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
      selectCountry:'Seleccionar País', loading:'Cargando…', noNews:'Sin noticias',
      safeCheckin:'Check-in Seguro', language:'Idioma', homeCountry:'País de Origen',
      save:'Guardar', cancel:'Cancelar', profile:'Perfil e Idioma',
      profileSub:'Establece tu país de origen e idioma',
      threatLevel:'Nivel de Amenaza', total:'TOTAL', last7:'ÚLTIMOS 7 DÍAS',
      incidents:'Incidentes', perDay:'Por Día', critical:'Crítico', highAlert:'Alta Alerta',
      highThreat:'AMENAZA ALTA', elevated:'ELEVADO', monitor:'MONITOREAR', clear:'DESPEJADO',
      safetyScore:'Puntuación de Seguridad', generallySafe:'Generalmente Seguro',
      exerciseCaution:'Tenga Precaución', highRisk:'Alto Riesgo',
      recentIncidents:'INCIDENTES RECIENTES', noIncidents:'Sin incidentes activos',
      travelAdvisory:'Aviso de Viaje', doNotTravel:'NO VIAJAR — contacte su embajada',
      totalReports:'Total de Reportes', last90:'Últimos 90 días', trend:'Tendencia',
      sources:'Fuentes', dataProviders:'Proveedores de datos', vsPrior:'vs período anterior',
      monthBreakdown:'RESUMEN 3 MESES · MEDIOS', category:'CATEGORÍA',
      worldBankData:'DATOS BANCO MUNDIAL EN VIVO', worldBankSrc:'Banco Mundial · Año más reciente',
      benchmarkNote:'Barras escaladas · + indica más incidentes probables',
      rising:'Subiendo', falling:'Bajando', stable:'Estable', high:'ALTO', med:'MEDIO', low:'BAJO',
      packTitle:'Asistente de Equipaje', clothing:'ROPA', essentials:'ESENCIALES',
      selectFirst:'Selecciona un país en el mapa primero',
      desert:'Desierto / Árido', tropical:'Tropical', monsoon:'Monzón',
      arctic:'Ártico / Subártico', temperate:'Templado',
      winter:'Invierno', summer:'Verano', spring:'Primavera', autumn:'Otoño',
      catAir:'Aire/Misil', catExplosion:'Explosiones', catArmed:'Armado',
      catUnrest:'Disturbios', catDrug:'Narcotráfico', catCrime:'Crimen', catWeather:'Clima',
      retry:'Reintentar', urgent:'Urgente', advisory:'Aviso', info:'Info',
      official:'Oficial', noData:'Sin datos disponibles',
    },
    fr:{
      feed:'Fil en Direct', news:'Actualités', alerts:'Incidents', crime:'Criminalité', pack:'Assistant Bagages',
      countries:'Navigateur Mondial', account:'Mon Compte', map:'Carte',
      selectCountry:'Sélectionner un Pays', loading:'Chargement…', noNews:'Aucune actualité',
      safeCheckin:'Check-in Sécurisé', language:'Langue', homeCountry:"Pays d'origine",
      save:'Enregistrer', cancel:'Annuler', profile:'Profil & Langue',
      profileSub:"Définissez votre pays d'origine et langue",
      threatLevel:'Niveau de Menace', total:'TOTAL', last7:'7 DERNIERS JOURS',
      incidents:'Incidents', perDay:'Par Jour', critical:'Critique', highAlert:'Haute Alerte',
      highThreat:'MENACE ÉLEVÉE', elevated:'ÉLEVÉ', monitor:'SURVEILLER', clear:'DÉGAGÉ',
      safetyScore:'Score de Sécurité', generallySafe:'Généralement Sûr',
      exerciseCaution:'Faire Preuve de Prudence', highRisk:'Risque Élevé',
      recentIncidents:'INCIDENTS RÉCENTS', noIncidents:'Aucun incident actif',
      travelAdvisory:'Avis de Voyage', doNotTravel:'NE PAS VOYAGER — contactez votre ambassade',
      totalReports:'Total des Rapports', last90:'90 derniers jours', trend:'Tendance',
      sources:'Sources', dataProviders:'Fournisseurs de données', vsPrior:'vs période précédente',
      monthBreakdown:'BILAN 3 MOIS · MÉDIAS', category:'CATÉGORIE',
      worldBankData:'DONNÉES BANQUE MONDIALE', worldBankSrc:'Banque Mondiale · Année la plus récente',
      benchmarkNote:"Barres à l'échelle · + indique plus d'incidents probables",
      rising:'En hausse', falling:'En baisse', stable:'Stable', high:'ÉLEVÉ', med:'MOYEN', low:'FAIBLE',
      packTitle:'Assistant Bagages', clothing:'VÊTEMENTS', essentials:'ESSENTIELS',
      selectFirst:"Sélectionnez un pays sur la carte d'abord",
      desert:'Désert / Aride', tropical:'Tropical', monsoon:'Mousson',
      arctic:'Arctique / Subarctique', temperate:'Tempéré',
      winter:'Hiver', summer:'Été', spring:'Printemps', autumn:'Automne',
      catAir:'Air/Missile', catExplosion:'Explosions', catArmed:'Armé',
      catUnrest:'Troubles', catDrug:'Trafic de drogues', catCrime:'Crime', catWeather:'Météo',
      retry:'Réessayer', urgent:'Urgent', advisory:'Avis', info:'Info',
      official:'Officiel', noData:'Aucune donnée disponible',
    },
    ar:{
      feed:'البث المباشر', news:'أخبار', alerts:'حوادث', crime:'جريمة', pack:'مساعد التعبئة',
      countries:'متصفح العالم', account:'حسابي', map:'الخريطة',
      selectCountry:'اختر دولة', loading:'جاري التحميل…', noNews:'لا توجد أخبار',
      safeCheckin:'تسجيل آمن', language:'اللغة', homeCountry:'البلد الأصلي',
      save:'حفظ', cancel:'إلغاء', profile:'الملف الشخصي واللغة',
      profileSub:'حدد بلدك الأصلي واللغة',
      threatLevel:'مستوى التهديد', total:'الإجمالي', last7:'آخر 7 أيام',
      incidents:'حوادث', perDay:'في اليوم', critical:'حرجة', highAlert:'تنبيه عالي',
      highThreat:'تهديد عالي', elevated:'مرتفع', monitor:'مراقبة', clear:'واضح',
      safetyScore:'نقاط الأمان', generallySafe:'آمن عموماً',
      exerciseCaution:'توخي الحذر', highRisk:'مخاطر عالية',
      recentIncidents:'حوادث حديثة', noIncidents:'لا توجد حوادث نشطة',
      travelAdvisory:'نصائح السفر', doNotTravel:'لا تسافر — اتصل بسفارتك',
      totalReports:'إجمالي التقارير', last90:'آخر 90 يوماً', trend:'الاتجاه',
      sources:'المصادر', dataProviders:'مزودو البيانات', vsPrior:'مقابل الفترة السابقة',
      monthBreakdown:'تفصيل 3 أشهر · وسائل الإعلام', category:'الفئة',
      worldBankData:'بيانات البنك الدولي المباشرة', worldBankSrc:'البنك الدولي · أحدث عام',
      benchmarkNote:'أشرطة متدرجة · + يشير إلى حوادث محتملة أكثر',
      rising:'ارتفاع', falling:'انخفاض', stable:'مستقر', high:'عالي', med:'متوسط', low:'منخفض',
      packTitle:'مساعد التعبئة', clothing:'ملابس', essentials:'أساسيات',
      selectFirst:'اختر دولة على الخريطة أولاً',
      desert:'صحراوي / جاف', tropical:'استوائي', monsoon:'موسمي',
      arctic:'قطبي / شبه قطبي', temperate:'معتدل',
      winter:'شتاء', summer:'صيف', spring:'ربيع', autumn:'خريف',
      catAir:'جوي/صاروخ', catExplosion:'انفجارات', catArmed:'مسلح',
      catUnrest:'اضطرابات', catDrug:'مخدرات', catCrime:'جريمة', catWeather:'طقس',
      retry:'إعادة المحاولة', urgent:'عاجل', advisory:'استشاري', info:'معلومات',
      official:'رسمي', noData:'لا توجد بيانات متاحة',
    },
    pt:{
      feed:'Feed ao Vivo', news:'Notícias', alerts:'Incidentes', crime:'Crime', pack:'Assistente de Mala',
      countries:'Navegador Mundial', account:'Minha Conta', map:'Mapa',
      selectCountry:'Selecionar País', loading:'Carregando…', noNews:'Sem notícias',
      safeCheckin:'Check-in Seguro', language:'Idioma', homeCountry:'País de Origem',
      save:'Salvar', cancel:'Cancelar', profile:'Perfil e Idioma',
      profileSub:'Defina seu país de origem e idioma',
      threatLevel:'Nível de Ameaça', total:'TOTAL', last7:'ÚLTIMOS 7 DIAS',
      incidents:'Incidentes', perDay:'Por Dia', critical:'Crítico', highAlert:'Alta Alerta',
      highThreat:'AMEAÇA ALTA', elevated:'ELEVADO', monitor:'MONITORAR', clear:'SEGURO',
      safetyScore:'Pontuação de Segurança', generallySafe:'Geralmente Seguro',
      exerciseCaution:'Tome Precauções', highRisk:'Alto Risco',
      recentIncidents:'INCIDENTES RECENTES', noIncidents:'Sem incidentes ativos',
      travelAdvisory:'Aviso de Viagem', doNotTravel:'NÃO VIAJE — contate sua embaixada',
      totalReports:'Total de Relatórios', last90:'Últimos 90 dias', trend:'Tendência',
      sources:'Fontes', dataProviders:'Fornecedores de dados', vsPrior:'vs período anterior',
      monthBreakdown:'RESUMO 3 MESES · MÉDIA', category:'CATEGORIA',
      worldBankData:'DADOS BANCO MUNDIAL AO VIVO', worldBankSrc:'Banco Mundial · Ano mais recente',
      benchmarkNote:'Barras em escala · + indica mais incidentes prováveis',
      rising:'Subindo', falling:'Caindo', stable:'Estável', high:'ALTO', med:'MÉDIO', low:'BAIXO',
      packTitle:'Assistente de Mala', clothing:'ROUPAS', essentials:'ESSENCIAIS',
      selectFirst:'Selecione um país no mapa primeiro',
      desert:'Deserto / Árido', tropical:'Tropical', monsoon:'Monção',
      arctic:'Ártico / Subártico', temperate:'Temperado',
      winter:'Inverno', summer:'Verão', spring:'Primavera', autumn:'Outono',
      catAir:'Aéreo/Míssil', catExplosion:'Explosões', catArmed:'Armado',
      catUnrest:'Distúrbios', catDrug:'Tráfico', catCrime:'Crime', catWeather:'Clima',
      retry:'Tentar Novamente', urgent:'Urgente', advisory:'Aviso', info:'Info',
      official:'Oficial', noData:'Sem dados disponíveis',
    },
    ru:{
      feed:'Лента', news:'Новости', alerts:'Инциденты', crime:'Преступность', pack:'Помощник',
      countries:'Обозреватель мира', account:'Мой аккаунт', map:'Карта',
      selectCountry:'Выбрать страну', loading:'Загрузка…', noNews:'Новостей нет',
      safeCheckin:'Безопасный чекин', language:'Язык', homeCountry:'Страна происхождения',
      save:'Сохранить', cancel:'Отмена', profile:'Профиль и язык',
      profileSub:'Укажите страну происхождения и язык',
      threatLevel:'Уровень угрозы', total:'ИТОГО', last7:'ПОСЛЕДНИЕ 7 ДНЕЙ',
      incidents:'Инциденты', perDay:'В день', critical:'Критический', highAlert:'Высокая тревога',
      highThreat:'ВЫСОКАЯ УГРОЗА', elevated:'ПОВЫШЕННЫЙ', monitor:'НАБЛЮДЕНИЕ', clear:'ЧИСТО',
      safetyScore:'Оценка безопасности', generallySafe:'В целом безопасно',
      exerciseCaution:'Соблюдайте осторожность', highRisk:'Высокий риск',
      recentIncidents:'ПОСЛЕДНИЕ ИНЦИДЕНТЫ', noIncidents:'Активных инцидентов нет',
      travelAdvisory:'Предупреждение о поездке', doNotTravel:'НЕ ЕХАТЬ — свяжитесь с посольством',
      totalReports:'Всего отчётов', last90:'За 90 дней', trend:'Тенденция',
      sources:'Источники', dataProviders:'Поставщики данных', vsPrior:'по сравнению с предыдущим',
      monthBreakdown:'СВОДКА 3 МЕСЯЦА', category:'КАТЕГОРИЯ',
      worldBankData:'ДАННЫЕ ВСЕМИРНОГО БАНКА', worldBankSrc:'Всемирный банк · Последний год',
      benchmarkNote:'Шкала по показателю · + означает вероятно больше инцидентов',
      rising:'Рост', falling:'Снижение', stable:'Стабильно', high:'ВЫСОКИЙ', med:'СРЕДНИЙ', low:'НИЗКИЙ',
      packTitle:'Помощник', clothing:'ОДЕЖДА', essentials:'НЕОБХОДИМОЕ',
      selectFirst:'Сначала выберите страну на карте',
      desert:'Пустыня', tropical:'Тропический', monsoon:'Муссонный',
      arctic:'Арктический', temperate:'Умеренный',
      winter:'Зима', summer:'Лето', spring:'Весна', autumn:'Осень',
      catAir:'Воздух/Ракеты', catExplosion:'Взрывы', catArmed:'Вооружённые',
      catUnrest:'Беспорядки', catDrug:'Наркотики', catCrime:'Преступность', catWeather:'Погода',
      retry:'Повторить', urgent:'Срочно', advisory:'Предупреждение', info:'Инфо',
      official:'Официально', noData:'Нет данных',
    }
  };

  function t(key) {
    var strings = I18N[_lang] || I18N['en'];
    return strings[key] || key;
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     EMERGENCY CONTACTS - NEW FEATURE
  ══════════════════════════════════════════════════════════════════════════════ */

  function getEmergencyContacts() {
    try {
      return JSON.parse(localStorage.getItem('atlas_emergency_contacts') || '[]');
    } catch(e) {
      return [];
    }
  }

  function saveEmergencyContacts(contacts) {
    localStorage.setItem('atlas_emergency_contacts', JSON.stringify(contacts));
    var token = localStorage.getItem('atlas_token');
    if (token) {
      fetch('/api/user/emergency-contacts', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
        body: JSON.stringify({ contacts: contacts }),
      }).catch(function(){});
    }
  }

  function getWhatsAppNumber() {
    return localStorage.getItem('atlas_whatsapp') || '';
  }

  function saveWhatsAppNumber(number) {
    localStorage.setItem('atlas_whatsapp', number);
    var token = localStorage.getItem('atlas_token');
    if (token) {
      fetch('/api/user/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
        body: JSON.stringify({ whatsapp: number }),
      }).catch(function(){});
    }
  }

  function showEmergencyContacts() {
    closeModal();
    modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.55);'+
      'display:flex;align-items:flex-end;justify-content:center;pointer-events:all;';
    
    var contacts = getEmergencyContacts();
    var whatsapp = getWhatsAppNumber();
    
    var contactsHTML = contacts.map(function(contact, i) {
      return '<div style="display:flex;align-items:center;gap:12px;padding:12px;'+
        'background:#fff;border-bottom:1px solid '+T.border+';">'+
        '<div style="flex:1;">'+
          '<div style="font-size:14px;font-weight:600;color:'+T.text+';">'+contact.name+'</div>'+
          '<div style="font-size:12px;color:'+T.muted+';margin-top:2px;">'+contact.phone+'</div>'+
        '</div>'+
        '<button data-remove="'+i+'" style="padding:6px 12px;background:'+T.redLight+';color:'+T.red+';'+
          'border:1px solid rgba(239,68,68,0.2);border-radius:8px;font-size:12px;cursor:pointer;">Remove</button>'+
      '</div>';
    }).join('');

    modal.innerHTML = 
      '<div style="background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:520px;'+
        'padding:24px 24px 40px;box-shadow:0 -8px 40px rgba(0,0,0,0.15);">'+
        '<div style="width:40px;height:4px;background:'+T.border+';border-radius:2px;margin:0 auto 20px;"></div>'+
        '<div style="font-size:20px;font-weight:800;color:'+T.text+';margin-bottom:6px;font-family:-apple-system,sans-serif;">'+
          '👥 Emergency Contacts</div>'+
        '<div style="font-size:13px;color:'+T.muted+';margin-bottom:20px;">'+
          'Add trusted contacts who will receive safety alerts.</div>'+
        
        '<div style="margin-bottom:20px;">'+
          '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">'+
            'WhatsApp Number</div>'+
          '<input id="aa-whatsapp" type="tel" placeholder="Your WhatsApp number for alerts" value="'+whatsapp+'" '+
            'style="width:100%;border:1.5px solid '+T.border+';border-radius:10px;'+
            'padding:10px 12px;font-size:14px;color:'+T.text+';background:#fff;outline:none;'+
            'box-sizing:border-box;font-family:-apple-system,sans-serif;">'+
        '</div>'+
        
        '<div style="margin-bottom:20px;">'+
          '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">'+
            'Contacts</div>'+
          '<div id="aa-contacts-list" style="border:1px solid '+T.border+';border-radius:12px;overflow:hidden;">'+
            (contacts.length ? contactsHTML : 
              '<div style="padding:20px;text-align:center;color:'+T.muted+';">No emergency contacts yet</div>')+
          '</div>'+
        '</div>'+
        
        '<div style="margin-bottom:20px;">'+
          '<div style="display:flex;gap:8px;margin-bottom:8px;">'+
            '<input id="aa-contact-name" placeholder="Contact Name" '+
              'style="flex:1;border:1.5px solid '+T.border+';border-radius:8px;'+
              'padding:8px 10px;font-size:13px;color:'+T.text+';background:#fff;outline:none;">'+
            '<input id="aa-contact-phone" placeholder="Phone Number" type="tel" '+
              'style="flex:1;border:1.5px solid '+T.border+';border-radius:8px;'+
              'padding:8px 10px;font-size:13px;color:'+T.text+';background:#fff;outline:none;">'+
          '</div>'+
          '<button id="aa-add-contact" style="width:100%;padding:10px;background:'+T.teal+';color:#fff;'+
            'border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">'+
            '+ Add Contact</button>'+
        '</div>'+
        
        '<div style="display:flex;gap:8px;">'+
          '<button id="aa-contacts-save" style="flex:1;padding:14px;background:'+T.teal+';color:#fff;'+
            'border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">'+
            '✅ Save</button>'+
          '<button id="aa-contacts-cancel" style="flex:1;padding:14px;background:none;color:'+T.muted+';'+
            'border:1px solid '+T.border+';border-radius:12px;font-size:15px;cursor:pointer;">'+
            'Cancel</button>'+
        '</div>'+
      '</div>';
    
    document.body.appendChild(modal);
    
    // Wire up the emergency contacts functionality
    var addBtn = document.getElementById('aa-add-contact');
    var saveBtn = document.getElementById('aa-contacts-save');
    var cancelBtn = document.getElementById('aa-contacts-cancel');
    var contactsList = document.getElementById('aa-contacts-list');

    if (addBtn) {
      addBtn.addEventListener('click', function() {
        var nameInput = document.getElementById('aa-contact-name');
        var phoneInput = document.getElementById('aa-contact-phone');
        var name = nameInput ? nameInput.value.trim() : '';
        var phone = phoneInput ? phoneInput.value.trim() : '';
        
        if (!name || !phone) {
          showToast('❌ Name and phone required', 'error');
          return;
        }
        
        var contacts = getEmergencyContacts();
        contacts.push({ name: name, phone: phone });
        saveEmergencyContacts(contacts);
        
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        showEmergencyContacts();
      });
    }

    if (contactsList) {
      contactsList.addEventListener('click', function(e) {
        var removeBtn = e.target.closest('[data-remove]');
        if (removeBtn) {
          var index = parseInt(removeBtn.dataset.remove);
          var contacts = getEmergencyContacts();
          contacts.splice(index, 1);
          saveEmergencyContacts(contacts);
          showEmergencyContacts();
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        var whatsappInput = document.getElementById('aa-whatsapp');
        var whatsapp = whatsappInput ? whatsappInput.value.trim() : '';
        
        if (whatsapp) {
          saveWhatsAppNumber(whatsapp);
        }
        
        closeModal();
        showToast('✅ Emergency contacts saved', 'ok');
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
    
    modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     KEEP ALL ORIGINAL UTILITY FUNCTIONS EXACTLY AS-IS
  ══════════════════════════════════════════════════════════════════════════════ */

  function closeModal() {
    if (modal) {
      document.body.removeChild(modal);
      modal = null;
    }
  }

  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);'+
      'background:' + (type === 'error' ? T.red : T.green) + ';color:#fff;'+
      'padding:12px 20px;border-radius:8px;z-index:800000;font-size:14px;font-weight:600;';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(function() {
      if (toast && toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  function panelHdr(title) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;'+
      'padding:18px 20px 14px;background:'+T.card+';border-bottom:1px solid '+T.border+';">'+
      '<div style="font-size:16px;font-weight:700;color:'+T.text+';">'+title+'</div>'+
      '<button id="aa-close-btn" style="width:28px;height:28px;border-radius:50%;background:'+T.bg+';'+
      'border:1px solid '+T.border+';color:'+T.muted+';font-size:16px;cursor:pointer;display:flex;'+
      'align-items:center;justify-content:center;font-weight:700;">×</button></div>';
  }

  function showOverlay(content) {
    if (!overlay) return;
    overlay.innerHTML = content;
    overlay.style.display = 'block';
    overlay.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    setTimeout(function() { 
      if (overlay) {
        overlay.style.display = 'none';
        overlay.innerHTML = '';
      }
    }, 200);
  }

  function hideMap() {
    if (mapWrap) mapWrap.style.display = 'none';
  }

  function showMap() {
    if (mapWrap) mapWrap.style.display = 'block';
    hideOverlay();
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     FEED PANEL - KEEP ORIGINAL IMPLEMENTATION EXACTLY AS-IS
  ══════════════════════════════════════════════════════════════════════════════ */

  function buildFeed() {
    return panelHdr('📡 '+t('feed'))+
      '<div style="display:flex;background:#fff;border-bottom:1px solid '+T.border+';overflow-x:auto;-webkit-overflow-scrolling:touch;" id="aa-feed-tabs">'+
        ['news','alerts','crime'].map(function(tab){
          var on=tab===_feedTab;
          return '<div data-ftab="'+tab+'" style="padding:12px 16px;cursor:pointer;color:'+(on?T.teal:T.muted)+';'+
            'border-bottom:2px solid '+(on?T.teal:'transparent')+';font-weight:'+(on?'700':'600')+';'+
            'font-size:13px;white-space:nowrap;transition:all 0.2s;text-transform:uppercase;letter-spacing:0.5px;">'+
            t(tab)+'</div>';
        }).join('')+
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

  function loadNews(country) {
    var body = document.getElementById('aa-feed-body');
    if (!body) return;
    body.innerHTML = '<div style="padding:20px;text-align:center;color:'+T.muted+';">'+t('loading')+'</div>';
    
    var apiUrl = '/api/news' + (country ? '?country_code=' + encodeURIComponent(country) : '');
    console.log('Loading news from:', apiUrl);
    
    fetch(apiUrl)
      .then(function(r) { 
        console.log('News API response status:', r.status);
        if (!r.ok) throw new Error('HTTP ' + r.status + ' - ' + r.statusText);
        return r.json(); 
      })
      .then(function(data) {
        console.log('News data received:', data);
        // Handle different response formats
        var articles = data.articles || data.data || data || [];
        if (!Array.isArray(articles)) articles = [articles];
        
        if (!articles.length) {
          body.innerHTML = '<div style="padding:20px;text-align:center;color:'+T.muted+';">'+t('noNews')+'</div>';
          return;
        }
        body.innerHTML = '<div style="padding:8px 16px;background:'+T.bg+';border-bottom:1px solid '+T.border+';font-size:10px;color:'+T.muted+';font-family:'+T.mono+';">'+articles.length+' ARTICLES</div>' +
          articles.map(function(article) {
            var title = article.title || article.headline || 'Untitled';
            var source = article.source || article.source_name || 'Unknown';
            var published = article.published || article.published_at || article.date || 'Recent';
            return '<div style="padding:14px 16px;background:#fff;border-bottom:1px solid '+T.border+';">'+
              '<div style="font-size:13px;font-weight:600;color:'+T.text+';line-height:1.4;margin-bottom:6px;">'+title+'</div>'+
              '<div style="font-size:11px;color:'+T.muted+';">'+source+' · '+published+'</div>'+
            '</div>';
          }).join('');
      })
      .catch(function(err) {
        console.error('News API error:', err);
        body.innerHTML = '<div style="padding:20px;text-align:center;">'+
          '<div style="font-size:13px;color:'+T.red+';margin-bottom:12px;">⚠️ News feed temporarily unavailable</div>'+
          '<div style="font-size:11px;color:'+T.muted+';margin-bottom:16px;">API: '+apiUrl+'<br>Error: '+err.message+'</div>'+
          '<button onclick="loadNews(window.activeCountry)" style="padding:8px 16px;background:'+T.teal+';color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">Retry</button>'+
        '</div>';
      });
  }

  function loadAlerts(country) {
    var body = document.getElementById('aa-feed-body');
    if (!body) return;
    body.innerHTML = '<div style="padding:20px;text-align:center;color:'+T.muted+';">'+t('loading')+'</div>';
    
    var apiUrl = '/api/events' + (country ? '?country_code=' + encodeURIComponent(country) : '');
    console.log('Loading alerts from:', apiUrl);
    
    fetch(apiUrl)
      .then(function(r) { 
        console.log('Events API response status:', r.status);
        if (!r.ok) throw new Error('HTTP ' + r.status + ' - ' + r.statusText);
        return r.json(); 
      })
      .then(function(data) {
        console.log('Events data received:', data);
        // Handle different response formats
        var events = data.events || data.data || data || [];
        if (!Array.isArray(events)) events = [events];
        var stats = data.stats7d || null;
        
        if (!events.length) {
          body.innerHTML = '<div style="padding:20px;text-align:center;color:'+T.muted+';">'+t('noIncidents')+'</div>';
          return;
        }
        var pillsHtml = '';
        if (stats && stats.by_category) {
          var catMeta = {
            armed:     { icon: '\uD83D\uDCA5', label: 'Armed' },
            explosion: { icon: '\uD83D\uDCA3', label: 'Explosion' },
            weather:   { icon: '\uD83C\uDF0A', label: 'Weather' },
            unrest:    { icon: '\u270A',       label: 'Unrest' },
            crime:     { icon: '\uD83D\uDD2B', label: 'Crime' },
            drug:      { icon: '\uD83D\uDC8A', label: 'Drug' },
            other:     { icon: '\uD83D\uDCCB', label: 'Other' }
          };
          var catEntries = Object.keys(stats.by_category)
            .map(function(k){ return { key: k, count: stats.by_category[k] }; })
            .filter(function(e){ return e.count > 0; })
            .sort(function(a, b){ return b.count - a.count; });
          if (catEntries.length) {
            pillsHtml = '<div style="padding:10px 16px;background:'+T.bg+';border-bottom:1px solid '+T.border+';display:flex;flex-wrap:wrap;gap:6px;align-items:center;">' +
              catEntries.map(function(e){
                var meta = catMeta[e.key] || { icon: '�', label: e.key };
                return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#fff;border:1px solid '+T.border+';border-radius:999px;font-size:11px;color:'+T.text+';"><span>'+meta.icon+'</span><span>'+meta.label+'</span><span style="font-weight:700;color:'+T.text+';">'+e.count+'</span></span>';
              }).join('') +
              '<span style="margin-left:auto;font-size:10px;color:'+T.muted+';font-family:'+T.mono+';">PAST 7 DAYS � '+stats.total+' TOTAL</span>' +
            '</div>';
          }
        }
        body.innerHTML = pillsHtml + '<div style="padding:8px 16px;background:'+T.bg+';border-bottom:1px solid '+T.border+';font-size:10px;color:'+T.muted+';font-family:'+T.mono+';">'+events.length+' INCIDENTS</div>' +
          events.map(function(event) {
            var sev = event.severity || event.level || 'info';
            var color = sev === 'critical' ? T.red : sev === 'high' ? T.amber : T.muted;
            var title = event.title || event.description || event.summary || 'Security incident';
            var location = event.location || event.area || event.region || 'Unknown location';
            var date = event.date || event.timestamp || event.occurred_at || 'Recent';
            return '<div style="padding:14px 16px;background:#fff;border-bottom:1px solid '+T.border+';">'+
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'+
                '<div style="width:6px;height:6px;border-radius:50%;background:'+color+';"></div>'+
                '<div style="font-size:11px;color:'+color+';text-transform:uppercase;font-weight:700;">'+sev+'</div>'+
              '</div>'+
              '<div style="font-size:13px;font-weight:600;color:'+T.text+';line-height:1.4;margin-bottom:6px;">'+title+'</div>'+
              '<div style="font-size:11px;color:'+T.muted+';">'+location+' · '+date+'</div>'+
            '</div>';
          }).join('');
      })
      .catch(function(err) {
        console.error('Events API error:', err);
        body.innerHTML = '<div style="padding:20px;text-align:center;">'+
          '<div style="font-size:13px;color:'+T.red+';margin-bottom:12px;">⚠️ Security alerts temporarily unavailable</div>'+
          '<div style="font-size:11px;color:'+T.muted+';margin-bottom:16px;">API: '+apiUrl+'<br>Error: '+err.message+'</div>'+
          '<button onclick="loadAlerts(window.activeCountry)" style="padding:8px 16px;background:'+T.teal+';color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">Retry</button>'+
        '</div>';
      });
  }

  function loadCrime(country) {
    var body = document.getElementById('aa-feed-body');
    if (!body) return;
    
    var countryCode = country;
    var countryName = COUNTRY_NAMES[countryCode] || countryCode;
    var stats = UNODC[countryCode];
    
    // Always show UNODC baseline data for now (until crime API is working)
    if (!stats) {
      body.innerHTML = '<div style="padding:20px;text-align:center;">'+
        '<div style="font-size:13px;color:'+T.muted+';margin-bottom:12px;">No crime data available for '+countryName+'</div>'+
      '</div>';
      return;
    }
    
    body.innerHTML = 
      '<div style="padding:8px 16px;background:'+T.bg+';border-bottom:1px solid '+T.border+';font-size:10px;color:'+T.muted+';font-family:'+T.mono+';">UNODC BASELINE DATA</div>'+
      '<div style="padding:16px;">'+
        '<div style="background:#fff;border:1px solid '+T.border+';border-radius:12px;padding:16px;">'+
          '<div style="font-size:13px;font-weight:700;color:'+T.text+';margin-bottom:12px;">📊 Crime Statistics (per 100k population)</div>'+
          '<div style="display:grid;gap:12px;">'+
            '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid '+T.border+';">'+
              '<span style="font-size:12px;color:'+T.text+';">Homicide</span>'+
              '<span style="font-size:12px;font-weight:600;color:'+T.red+';">'+stats.homicide+'</span>'+
            '</div>'+
            '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid '+T.border+';">'+
              '<span style="font-size:12px;color:'+T.text+';">Assault</span>'+
              '<span style="font-size:12px;font-weight:600;color:'+T.amber+';">'+stats.assault+'</span>'+
            '</div>'+
            '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid '+T.border+';">'+
              '<span style="font-size:12px;color:'+T.text+';">Theft</span>'+
              '<span style="font-size:12px;font-weight:600;color:'+T.muted+';">'+stats.theft+'</span>'+
            '</div>'+
            '<div style="display:flex;justify-content:space-between;padding:8px 0;">'+
              '<span style="font-size:12px;color:'+T.text+';">Robbery</span>'+
              '<span style="font-size:12px;font-weight:600;color:'+T.muted+';">'+stats.robbery+'</span>'+
            '</div>'+
          '</div>'+
          '<div style="margin-top:12px;font-size:10px;color:'+T.muted+';text-align:center;">'+
            'Source: UNODC '+stats.year+' baseline data'+
          '</div>'+
        '</div>'+
      '</div>';
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     ENHANCED PACK PANEL - UPGRADE ORIGINAL TO USE AI BACKEND
  ══════════════════════════════════════════════════════════════════════════════ */

  function buildPack() {
    var country = window.activeCountry;
    var countryName = country ? (COUNTRY_NAMES[country] || country) : '';
    
    var defaultItems = [
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

    return panelHdr('🎒 '+t('packTitle'))+
      '<div style="padding:16px;background:'+T.bg+';">'+
        // AI Pack Generator Section
        '<div style="background:#fff;border:1px solid '+T.border+';border-radius:12px;padding:16px;margin-bottom:16px;">'+
          '<div style="font-size:13px;font-weight:700;color:'+T.text+';margin-bottom:12px;">🤖 AI Pack Assistant</div>'+
          '<div style="margin-bottom:12px;">'+
            '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Destination</div>'+
            '<input id="aa-pack-dest" type="text" placeholder="Enter destination..." value="'+countryName+'" '+
              'style="width:100%;border:1.5px solid '+T.border+';border-radius:8px;'+
              'padding:8px 12px;font-size:13px;color:'+T.text+';background:#fff;outline:none;'+
              'box-sizing:border-box;font-family:-apple-system,sans-serif;">'+
          '</div>'+
          '<div style="display:flex;gap:8px;margin-bottom:12px;">'+
            '<div style="flex:1;">'+
              '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Days</div>'+
              '<input id="aa-pack-days" type="number" value="7" min="1" max="30" '+
                'style="width:100%;border:1.5px solid '+T.border+';border-radius:8px;'+
                'padding:8px 12px;font-size:13px;color:'+T.text+';background:#fff;outline:none;'+
                'box-sizing:border-box;font-family:-apple-system,sans-serif;">'+
            '</div>'+
            '<div style="flex:1;">'+
              '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Trip Type</div>'+
              '<select id="aa-pack-type" '+
                'style="width:100%;border:1.5px solid '+T.border+';border-radius:8px;'+
                'padding:8px 12px;font-size:13px;color:'+T.text+';background:#fff;outline:none;'+
                'box-sizing:border-box;font-family:-apple-system,sans-serif;appearance:none;">'+
                '<option value="leisure">Leisure</option>'+
                '<option value="business">Business</option>'+
                '<option value="adventure">Adventure</option>'+
                '<option value="family">Family</option>'+
                '<option value="solo">Solo</option>'+
              '</select>'+
            '</div>'+
          '</div>'+
          '<button id="aa-generate-pack" style="width:100%;padding:10px;background:'+T.teal+';color:#fff;'+
            'border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">'+
            '🤖 Generate AI Pack List</button>'+
        '</div>'+
        
        // AI Results container (hidden by default)
        '<div id="aa-pack-ai-results" style="display:none;margin-bottom:16px;">'+
        '</div>'+
        
        // Default checklist
        '<div id="aa-pack-default">'+
          '<div style="background:'+T.tealLight+';border:1px solid rgba(14,116,144,0.2);border-radius:12px;padding:14px;margin-bottom:16px;">'+
            '<div style="font-size:13px;font-weight:700;color:'+T.teal+';margin-bottom:4px;">Essential Travel Checklist</div>'+
            '<div style="font-size:12px;color:'+T.teal+';opacity:0.8;">Tap "Generate AI Pack List" for personalized recommendations</div>'+
          '</div>'+
          defaultItems.map(function(item) {
            return '<div style="display:flex;align-items:center;gap:12px;padding:13px 14px;'+
              'background:#fff;border:1px solid '+T.border+';border-radius:10px;margin-bottom:8px;">'+
              '<div style="font-size:24px;width:40px;text-align:center;flex-shrink:0;">'+item[0]+'</div>'+
              '<div style="flex:1;">'+
                '<div style="font-size:13px;font-weight:600;color:'+T.text+';">'+item[1]+'</div>'+
                '<div style="font-size:11px;color:'+T.muted+';margin-top:2px;">'+item[2]+'</div>'+
              '</div>'+
              '<div style="width:22px;height:22px;border-radius:50%;border:2px solid '+T.border+';flex-shrink:0;cursor:pointer;" onclick="this.style.background=this.style.background?\'\':\'' + T.teal + '\';this.style.borderColor=this.style.background?\'' + T.teal + '\':\'' + T.border + '\';"></div>'+
            '</div>';
          }).join('')+
        '</div>'+
      '</div>';
  }

  function wirePackGenerator() {
    var generateBtn = document.getElementById('aa-generate-pack');
    if (!generateBtn) return;
    
    generateBtn.addEventListener('click', function() {
      var destInput = document.getElementById('aa-pack-dest');
      var daysInput = document.getElementById('aa-pack-days');
      var typeSelect = document.getElementById('aa-pack-type');
      
      var destination = destInput ? destInput.value.trim() : '';
      var days = daysInput ? parseInt(daysInput.value) || 7 : 7;
      var tripType = typeSelect ? typeSelect.value : 'leisure';
      
      if (!destination) {
        showToast('❌ Please enter a destination', 'error');
        return;
      }
      
      generateBtn.textContent = '🤖 Generating...';
      generateBtn.disabled = true;
      
      fetch('/api/pack/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination,
          duration: days,
          trip_type: tripType,
          country_code: window.activeCountry
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) {
          showToast('❌ '+data.error, 'error');
          return;
        }
        displayPackResults(data);
      })
      .catch(function() {
        showToast('❌ Failed to generate pack list', 'error');
      })
      .finally(function() {
        generateBtn.textContent = '🤖 Generate AI Pack List';
        generateBtn.disabled = false;
      });
    });
  }

  function displayPackResults(packData) {
    var resultsDiv = document.getElementById('aa-pack-ai-results');
    var defaultDiv = document.getElementById('aa-pack-default');
    
    if (!resultsDiv || !packData.categories) return;
    
    resultsDiv.innerHTML = 
      '<div style="background:'+T.greenLight+';border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:14px;margin-bottom:16px;">'+
        '<div style="font-size:13px;font-weight:700;color:'+T.green+';margin-bottom:4px;">✅ AI Pack List Generated</div>'+
        '<div style="font-size:12px;color:'+T.green+';opacity:0.8;">'+(packData.summary || 'Customized for your trip')+'</div>'+
      '</div>'+
      packData.categories.map(function(category) {
        return '<div style="margin-bottom:20px;">'+
          '<div style="font-size:13px;font-weight:700;color:'+T.text+';margin-bottom:12px;display:flex;align-items:center;gap:8px;">'+
            '<span style="font-size:18px;">'+category.icon+'</span>'+category.name+
          '</div>'+
          category.items.map(function(item) {
            var essential = item.essential ? 'border:2px solid '+T.teal+';background:'+T.tealLight : 'border:2px solid '+T.border+';background:#fff';
            return '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;'+
              essential+';border-radius:10px;margin-bottom:8px;">'+
              '<div style="flex:1;">'+
                '<div style="font-size:13px;font-weight:600;color:'+T.text+';">'+item.text+'</div>'+
                (item.essential ? '<div style="font-size:10px;color:'+T.teal+';font-weight:700;text-transform:uppercase;margin-top:2px;">Essential</div>' : '')+
              '</div>'+
              '<div style="width:22px;height:22px;border-radius:50%;border:2px solid '+(item.essential?T.teal:T.border)+';background:'+(item.essential?T.teal:'transparent')+';flex-shrink:0;cursor:pointer;" onclick="this.style.background=this.style.background===\'transparent\'?\'' + T.teal + '\':(this.style.background?\'\':\'transparent\');this.style.borderColor=this.style.background?\'' + T.teal + '\':\'' + T.border + '\';"></div>'+
            '</div>';
          }).join('')+
        '</div>';
      }).join('');
    
    resultsDiv.style.display = 'block';
    if (defaultDiv) defaultDiv.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     WORLD/COUNTRIES PANEL - KEEP ORIGINAL EXACTLY AS-IS  
  ══════════════════════════════════════════════════════════════════════════════ */

  function buildWorld() {
    return panelHdr('🌍 '+t('countries'))+
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
      window.activeCountry=row.dataset.code;
      if(window.map&&row.dataset.lat&&row.dataset.lng) window.map.setView([parseFloat(row.dataset.lat),parseFloat(row.dataset.lng)],6);
      switchTab('map');
    });
  }

  function loadWorldCountries() {
    var el = document.getElementById('aa-clist');
    if (!el) return;
    el.innerHTML = '<div style="padding:20px;text-align:center;color:'+T.muted+';">Loading…</div>';
    
    fetch('/api/countries')
      .then(function(r) { return r.json(); })
      .then(function(countries) {
        renderCountries(countries);
      })
      .catch(function() {
        el.innerHTML = '<div style="padding:20px;text-align:center;color:'+T.muted+';">Failed to load countries</div>';
      });
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     ACCOUNT PANEL - ENHANCED WITH EMERGENCY CONTACTS
  ══════════════════════════════════════════════════════════════════════════════ */

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

    // Get emergency contacts count for display
    var contacts = getEmergencyContacts();
    var contactsCount = contacts.length ? contacts.length + ' contacts' : 'Set up emergency contacts';

    return panelHdr('👤 '+t('account'))+
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
          arow('👥','Emergency Contacts',contactsCount,'emergency')+  // NEW ROW
          arow('✅',t('safeCheckin'),'Let your circle know you\'re safe','checkin')+
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
        if(a==='emergency')     showEmergencyContacts(); // NEW HANDLER
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

  /* ══════════════════════════════════════════════════════════════════════════════
     KEEP ALL ORIGINAL PROFILE, CHECKIN, AND OTHER MODAL FUNCTIONS EXACTLY AS-IS
  ══════════════════════════════════════════════════════════════════════════════ */

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
    var cancelBtn = document.getElementById('aa-prof-cancel');
    if (saveBtn) {
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
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
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
  }

  function showInfoModal(title, content) {
    closeModal();
    modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.55);'+
      'display:flex;align-items:center;justify-content:center;pointer-events:all;padding:20px;';
    modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;max-width:400px;width:100%;">'+
      '<h3 style="margin:0 0 12px;color:'+T.text+';">'+title+'</h3>'+
      '<p style="margin:0;color:'+T.muted+';line-height:1.5;white-space:pre-line;">'+content+'</p>'+
      '<button id="aa-info-ok" style="margin-top:16px;padding:10px 20px;background:'+T.teal+';color:#fff;border:none;border-radius:8px;cursor:pointer;">OK</button>'+
    '</div>';
    document.body.appendChild(modal);
    
    document.getElementById('aa-info-ok').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
  }

  // Keep all original Check-in and Report modal functions exactly as they were
  function showCheckin() {
    closeModal();
    modal=document.createElement('div');
    modal.style.cssText='position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.55);'+
      'display:flex;align-items:flex-end;justify-content:center;pointer-events:all;';
    modal.innerHTML=
      '<div style="background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:520px;'+
        'padding:24px 24px 40px;box-shadow:0 -8px 40px rgba(0,0,0,0.15);">'+
        '<div style="width:40px;height:4px;background:'+T.border+';border-radius:2px;margin:0 auto 20px;"></div>'+
        '<div style="font-size:20px;font-weight:800;color:'+T.text+';margin-bottom:6px;font-family:-apple-system,sans-serif;">✅ '+t('safeCheckin')+'</div>'+
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
            (window.activeCountry?'📍 '+(COUNTRY_NAMES[window.activeCountry]||window.activeCountry):'Location not set')+
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
  }

  // Keep all original tab switching and initialization exactly as-is
  function switchTab(name) {
    document.querySelectorAll('.main-tab').forEach(function(btn,i){
      var on=tabNames[i]===name;
      btn.style.opacity=on?'1':'0.5';
    });

    if(name==='map'){ showMap(); return; }

    hideMap();
    if(name==='feed')      showOverlay(buildFeed());
    else if(name==='pack')      showOverlay(buildPack());
    else if(name==='countries') showOverlay(buildWorld());
    else if(name==='account')   showOverlay(buildAccount());

    setTimeout(function(){
      var cb=document.getElementById('aa-close-btn');
      if(cb) cb.addEventListener('click',function(){switchTab('map');});
      if(name==='feed'){_feedTab='news';wireFeedTabs();loadNews(window.activeCountry);}
      if(name==='pack') wirePackGenerator(); // WIRE THE NEW AI PACK GENERATOR
      if(name==='countries') loadWorldCountries();
      if(name==='account')   wireAccount();
    },0);
  }

  function init() {
    if(!document.getElementById('aa-nav-styles')){
      var st=document.createElement('style');
      st.id='aa-nav-styles';
      st.textContent=[
        '.aa-overlay{transition:opacity 0.2s ease;}',
        '.main-tab{transition:opacity 0.2s ease;}',
        '.aa-arow:hover{background:#f8f9fa !important;}',
        '.aa-crow:hover{background:#f8f9fa !important;}',
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
      // Update pack destination when country changes
      var packDest = document.getElementById('aa-pack-dest');
      if (packDest && code) {
        packDest.value = COUNTRY_NAMES[code] || code;
      }
      return r;
    };

    switchTab('map');

    // Show onboarding if first time or profile not set
    if (!localStorage.getItem('atlas_setup_done')) {
      setTimeout(showOnboarding, 800);
    }
  }

  // Keep all missing functions that were referenced but not defined
  function showReportModal(lat, lng) {
    showInfoModal('Report Incident', 'Incident reporting functionality coming soon.\n\nThis will allow you to report safety incidents and contribute to the Atlas Ally intelligence network.');
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}

})();
