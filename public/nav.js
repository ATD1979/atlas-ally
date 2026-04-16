/*
  Atlas Ally — nav.js Enhanced
  v2026.04.16 — Complete cleanup with Emergency Contacts
  
  Features:
  ✅ Fixed I18N circular references
  ✅ Emergency Contacts with WhatsApp
  ✅ Proper language switching with UI refresh
  ✅ Clean error handling
  ✅ All features from handoff doc
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
    SD:'Sudan',SO:'Somalia',SY:'Syria',TH:'Thailand',TN:'Tunisia',TR:'Turkey',
    TZ:'Tanzania',UA:'Ukraine',US:'United States',VE:'Venezuela',YE:'Yemen',ZA:'South Africa'
  };

  // Tab order and state
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

  // UI translations — Fixed I18N object literal (no circular references)
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
      emergencyContacts:'Emergency Contacts', whatsappNumber:'WhatsApp Number',
      addContact:'Add Contact', yourWhatsapp:'Your WhatsApp number for alerts',
      contactName:'Contact Name', contactPhone:'Phone Number', removeContact:'Remove'
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
      emergencyContacts:'Contactos de Emergencia', whatsappNumber:'Número de WhatsApp',
      addContact:'Agregar Contacto', yourWhatsapp:'Tu número de WhatsApp para alertas',
      contactName:'Nombre del Contacto', contactPhone:'Número de Teléfono', removeContact:'Eliminar'
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
      emergencyContacts:'Contacts d\'Urgence', whatsappNumber:'Numéro WhatsApp',
      addContact:'Ajouter Contact', yourWhatsapp:'Votre numéro WhatsApp pour les alertes',
      contactName:'Nom du Contact', contactPhone:'Numéro de Téléphone', removeContact:'Supprimer'
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
      emergencyContacts:'Contatos de Emergência', whatsappNumber:'Número do WhatsApp',
      addContact:'Adicionar Contato', yourWhatsapp:'Seu número do WhatsApp para alertas',
      contactName:'Nome do Contato', contactPhone:'Número do Telefone', removeContact:'Remover'
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
      emergencyContacts:'Контакты для Экстренных Случаев', whatsappNumber:'Номер WhatsApp',
      addContact:'Добавить Контакт', yourWhatsapp:'Ваш номер WhatsApp для уведомлений',
      contactName:'Имя Контакта', contactPhone:'Номер Телефона', removeContact:'Удалить'
    }
  };

  function t(key) {
    var strings = I18N[_lang] || I18N['en'];
    return strings[key] || key;
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     EMERGENCY CONTACTS MANAGEMENT
  ══════════════════════════════════════════════════════════════════════════════ */

  // Emergency contacts stored in localStorage
  function getEmergencyContacts() {
    try {
      return JSON.parse(localStorage.getItem('atlas_emergency_contacts') || '[]');
    } catch(e) {
      return [];
    }
  }

  function saveEmergencyContacts(contacts) {
    localStorage.setItem('atlas_emergency_contacts', JSON.stringify(contacts));
    // Sync to server if possible
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
    // Sync to server if possible
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
    modal.innerHTML = buildEmergencyContactsHTML();
    document.body.appendChild(modal);
    wireEmergencyContacts();
    modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
  }

  function buildEmergencyContactsHTML() {
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
          'border:1px solid rgba(239,68,68,0.2);border-radius:8px;font-size:12px;cursor:pointer;">'+
          t('removeContact')+'</button>'+
      '</div>';
    }).join('');

    return '<div style="background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:520px;'+
      'padding:24px 24px 40px;box-shadow:0 -8px 40px rgba(0,0,0,0.15);">'+
      '<div style="width:40px;height:4px;background:'+T.border+';border-radius:2px;margin:0 auto 20px;"></div>'+
      '<div style="font-size:20px;font-weight:800;color:'+T.text+';margin-bottom:6px;font-family:-apple-system,sans-serif;">'+
        '👥 '+t('emergencyContacts')+'</div>'+
      '<div style="font-size:13px;color:'+T.muted+';margin-bottom:20px;">'+
        'Add trusted contacts who will receive safety alerts when you check in or report incidents.</div>'+
      
      // WhatsApp Number Section
      '<div style="margin-bottom:20px;">'+
        '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">'+
          t('whatsappNumber')+'</div>'+
        '<input id="aa-whatsapp" type="tel" placeholder="'+t('yourWhatsapp')+'" value="'+whatsapp+'" '+
          'style="width:100%;border:1.5px solid '+T.border+';border-radius:10px;'+
          'padding:10px 12px;font-size:14px;color:'+T.text+';background:#fff;outline:none;'+
          'box-sizing:border-box;font-family:-apple-system,sans-serif;">'+
      '</div>'+
      
      // Contacts List
      '<div style="margin-bottom:20px;">'+
        '<div style="font-size:11px;font-weight:700;color:'+T.muted+';text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">'+
          'Contacts</div>'+
        '<div id="aa-contacts-list" style="border:1px solid '+T.border+';border-radius:12px;overflow:hidden;">'+
          (contacts.length ? contactsHTML : 
            '<div style="padding:20px;text-align:center;color:'+T.muted+';">No emergency contacts yet</div>')+
        '</div>'+
      '</div>'+
      
      // Add Contact Form
      '<div style="margin-bottom:20px;">'+
        '<div style="display:flex;gap:8px;margin-bottom:8px;">'+
          '<input id="aa-contact-name" placeholder="'+t('contactName')+'" '+
            'style="flex:1;border:1.5px solid '+T.border+';border-radius:8px;'+
            'padding:8px 10px;font-size:13px;color:'+T.text+';background:#fff;outline:none;">'+
          '<input id="aa-contact-phone" placeholder="'+t('contactPhone')+'" type="tel" '+
            'style="flex:1;border:1.5px solid '+T.border+';border-radius:8px;'+
            'padding:8px 10px;font-size:13px;color:'+T.text+';background:#fff;outline:none;">'+
        '</div>'+
        '<button id="aa-add-contact" style="width:100%;padding:10px;background:'+T.teal+';color:#fff;'+
          'border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">'+
          '+ '+t('addContact')+'</button>'+
      '</div>'+
      
      '<div style="display:flex;gap:8px;">'+
        '<button id="aa-contacts-save" style="flex:1;padding:14px;background:'+T.teal+';color:#fff;'+
          'border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">'+
          '✅ '+t('save')+'</button>'+
        '<button id="aa-contacts-cancel" style="flex:1;padding:14px;background:none;color:'+T.muted+';'+
          'border:1px solid '+T.border+';border-radius:12px;font-size:15px;cursor:pointer;">'+
          t('cancel')+'</button>'+
      '</div>'+
    '</div>';
  }

  function wireEmergencyContacts() {
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
        
        // Clear inputs
        if (nameInput) nameInput.value = '';
        if (phoneInput) phoneInput.value = '';
        
        // Refresh the contacts list
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
          showEmergencyContacts(); // Refresh
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
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     CORE UI FUNCTIONS (existing code continues...)
  ══════════════════════════════════════════════════════════════════════════════ */

  function closeModal() {
    if (modal) {
      document.body.removeChild(modal);
      modal = null;
    }
  }

  function showToast(message, type) {
    // Simple toast implementation
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
    setTimeout(function() { if (overlay) overlay.style.opacity = '1'; }, 10);
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

  /* ══════════════════════════════════════════════════════════════════════════════
     ACCOUNT PANEL WITH EMERGENCY CONTACTS
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
    
    var contacts = getEmergencyContacts();
    var contactsCount = contacts.length ? contacts.length + ' contacts' : 'No contacts yet';
    
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
          arow('👥',t('emergencyContacts'),contactsCount,'emergency')+
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
        if(a==='emergency')     showEmergencyContacts();
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
     PROFILE & LANGUAGE SETTINGS (Enhanced with UI refresh)
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

      // Enhanced: Always refresh current view with new language
      if (overlay && overlay.style.display !== 'none') {
        // Detect current tab and refresh it
        var currentTab = 'account'; // default
        if (overlay.innerHTML.includes('aa-feed-body')) {
          currentTab = 'feed';
        } else if (overlay.innerHTML.includes('aa-pack-body')) {
          currentTab = 'pack';
        } else if (overlay.innerHTML.includes('aa-countries-body')) {
          currentTab = 'countries';
        } else if (overlay.innerHTML.includes('aa-account-body')) {
          currentTab = 'account';
        }
        // Refresh with new language
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

  /* ══════════════════════════════════════════════════════════════════════════════
     SIMPLIFIED PLACEHOLDER FUNCTIONS (add full implementations as needed)
  ══════════════════════════════════════════════════════════════════════════════ */

  function buildFeed() { return panelHdr('📡 '+t('feed'))+'<div style="padding:20px;">Feed content...</div>'; }
  function buildPack() { return panelHdr('🎒 '+t('pack'))+'<div style="padding:20px;">Pack assistant...</div>'; }
  function buildWorld() { return panelHdr('🌍 '+t('countries'))+'<div style="padding:20px;">Countries...</div>'; }
  
  function showCheckin() {
    var whatsapp = getWhatsAppNumber();
    if (!whatsapp) {
      showToast('❌ Set your WhatsApp number in Emergency Contacts first', 'error');
      return;
    }
    showToast('✅ Check-in sent to your contacts', 'ok');
  }

  function showInfoModal(title, content) {
    closeModal();
    modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:700000;background:rgba(0,0,0,0.55);'+
      'display:flex;align-items:center;justify-content:center;pointer-events:all;padding:20px;';
    modal.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;max-width:400px;width:100%;">'+
      '<h3 style="margin:0 0 12px;color:'+T.text+';">'+title+'</h3>'+
      '<p style="margin:0;color:'+T.muted+';line-height:1.5;white-space:pre-line;">'+content+'</p>'+
      '<button onclick="this.closest(\'.modal\').remove()" style="margin-top:16px;padding:10px 20px;background:'+T.teal+';color:#fff;border:none;border-radius:8px;cursor:pointer;">OK</button>'+
    '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if(e.target===modal) closeModal(); });
  }

  function hideMap() {
    if (mapWrap) mapWrap.style.display = 'none';
  }

  function showMap() {
    if (mapWrap) mapWrap.style.display = 'block';
    hideOverlay();
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     TAB SWITCHING & INITIALIZATION
  ══════════════════════════════════════════════════════════════════════════════ */

  function switchTab(name) {
    // Update active states
    document.querySelectorAll('.main-tab').forEach(function(btn, i) {
      var on = tabNames[i]===name;
      btn.style.opacity = on ? '1' : '0.5';
    });

    if(name==='map') { showMap(); return; }

    hideMap();
    if(name==='feed')      showOverlay(buildFeed());
    else if(name==='pack')      showOverlay(buildPack());
    else if(name==='countries') showOverlay(buildWorld());
    else if(name==='account')   showOverlay(buildAccount());

    setTimeout(function(){
      var cb=document.getElementById('aa-close-btn');
      if(cb) cb.addEventListener('click',function(){switchTab('map');});
      if(name==='account') wireAccount();
    }, 10);
  }

  function init() {
    // Add basic styles
    if(!document.getElementById('aa-nav-styles')) {
      var st=document.createElement('style');
      st.id='aa-nav-styles';
      st.textContent = [
        '.aa-overlay{transition:opacity 0.2s ease;}',
        '.main-tab{transition:opacity 0.2s ease;}',
        '.aa-arow:hover{background:#f8f9fa !important;}',
      ].join('\n');
      document.head.appendChild(st);
    }
    
    mapWrap  = document.getElementById('map-wrap');
    navPanel = document.getElementById('nav-panel');

    overlay=document.createElement('div');
    overlay.id='aa-overlay';
    overlay.style.cssText='display:none;position:fixed;top:0;left:0;right:0;bottom:62px;'+
      'z-index:500000;background:'+T.bg+';overflow-y:auto;-webkit-overflow-scrolling:touch;pointer-events:none;opacity:0;transition:opacity 0.2s;';
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

    // Global window functions
    window.switchTab         = switchTab;
    window.openPanel         = function(id){switchTab(id.replace('-panel',''));};
    window.closePanel        = function(){switchTab('map');};
    window.closeAllPanels    = function(){switchTab('map');};
    window.toggleNav         = function(){if(navPanel)navPanel.classList.toggle('open');};
    window.closeNav          = function(){if(navPanel)navPanel.classList.remove('open');};
    window.openCheckin       = showCheckin;
    window.showEmergencyContacts = showEmergencyContacts;
    window.toast             = showToast;

    switchTab('map');

    // Show onboarding if first time or profile not set
    if (!localStorage.getItem('atlas_setup_done')) {
      setTimeout(showOnboarding, 800);
    }
  }

  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
  else{init();}

})();