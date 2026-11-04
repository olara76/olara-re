// Textos del portal en 7 idiomas. 'es' es el idioma por defecto (/viviendas).
const LANGS = ['es', 'en', 'de', 'fr', 'it', 'ru', 'zh'];
const LOCALE = { es: 'es-ES', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', ru: 'ru-RU', zh: 'zh-CN' };
const NAMES = { es: 'Español', en: 'English', de: 'Deutsch', fr: 'Français', it: 'Italiano', ru: 'Русский', zh: '中文' };
const SHORT = { es: 'ES', en: 'EN', de: 'DE', fr: 'FR', it: 'IT', ru: 'RU', zh: '中文' };

const T = {
  es: {
    nav: ['Viviendas', 'Servicios', 'Cómo trabajamos', 'Zonas', 'Contacto'],
    operator: 'Sitio operado por Olara Capital SL · CIF B26977355 · Carretera de Fuencarral 56, of. 46, 28108 Alcobendas (Madrid) · info@olara-re.com',
    legal: ['Aviso legal', 'Privacidad', 'Cookies'],
    disclaimer: 'Información orientativa, sin valor contractual. Precios sin impuestos ni gastos.',
    metaTitle: 'Viviendas en venta en Madrid · Olara Real Estate',
    metaDesc: 'Pisos, áticos y dúplex en venta en Madrid, reformados o en reforma. Busque por precio, superficie y dormitorios, y véalos en el mapa.',
    eyebrow: 'Viviendas en venta · Madrid',
    h1: 'Viviendas en <em>Madrid</em>, listas para entrar a vivir',
    sub: 'Pisos, áticos y dúplex reformados o terminando la reforma, en los barrios más demandados de la ciudad. La cartera se actualiza a diario.',
    allTypes: 'Todos los tipos', priceMin: 'Precio mín. €', priceMax: 'Precio máx. €', m2min: 'm² mín.', beds: 'Dormitorios',
    garage: 'Garaje', terrace: 'Terraza', availNow: 'Disponibles ya',
    sort: ['Más recientes', 'Precio ascendente', 'Precio descendente', '€/m² ascendente', 'Mayor superficie'],
    count1: 'vivienda', countN: 'viviendas', onMap: 'en el mapa', loading: 'Cargando…', reset: 'Limpiar',
    empty: 'No hay viviendas con estos filtros.', resetFilters: 'Limpiar filtros', more: 'Ver más viviendas',
    mapBtn: 'Ver mapa', listBtn: 'Ver lista', loadErr: 'No hemos podido cargar las viviendas. Vuelva a intentarlo en unos minutos.',
    bedShort: 'dorm.', bathShort: 'baños', garageS: 'garaje', terraceS: 'terraza',
    soon: 'Próximamente',
    types: { flat: 'Piso', penthouse: 'Ático', duplex: 'Dúplex', house: 'Casa', other: 'Vivienda' },
    works: { delivery: 'En entrega', furnishing: 'Amueblando', finishing: 'Acabados finales', renovation: 'En reforma' },
    orient: { north: 'Norte', south: 'Sur', east: 'Este', west: 'Oeste', northeast: 'Noreste', northwest: 'Noroeste', southeast: 'Sureste', southwest: 'Suroeste' },
    nameTpl: '{type} en {street}',
    f: { price: 'Precio', eurm2: '€/m²', area: 'Superficie útil', beds: 'Dormitorios', baths: 'Baños', type: 'Tipo', floor: 'Planta', exterior: 'exterior', orient: 'Orientación', status: 'Estado', available: 'Disponible', garage: 'Garaje', storage: 'Trastero', terrace: 'Terraza', ac: 'Aire acondicionado', elevator: 'Ascensor', yes: 'Sí', no: 'No' },
    floorFmt: '{n}ª',
    ctaWa: 'Consultar por WhatsApp', ctaMail: 'Pedir información',
    approx: 'Ubicación aproximada.', morePhotos: '+{n} fotos', photo: 'foto',
    noDesc: 'Solicítenos la información completa de esta vivienda.',
    origNote: '',
    waMsg: 'Hola, me interesa la vivienda {name} ({price}): {url}', mailSubj: 'Información · {name}',
    goneTitle: 'Vivienda no disponible', goneH: 'Esta vivienda ya no está a la venta', goneBtn: 'Ver viviendas disponibles',
    homes: 'Viviendas', units: { m2: 'm²', beds: 'dormitorios', baths: 'baños' }
  },
  en: {
    nav: ['Homes', 'Services', 'How we work', 'Areas', 'Contact'],
    operator: 'Site operated by Olara Capital SL · Tax ID B26977355 · Carretera de Fuencarral 56, of. 46, 28108 Alcobendas (Madrid) · info@olara-re.com',
    legal: ['Legal notice', 'Privacy', 'Cookies'],
    disclaimer: 'For guidance only; not contractually binding. Prices exclude taxes and transaction costs.',
    metaTitle: 'Homes for sale in Madrid · Olara Real Estate',
    metaDesc: 'Apartments, penthouses and duplexes for sale in Madrid, renovated or nearing completion. Search by price, size and bedrooms, and see them on the map.',
    eyebrow: 'Homes for sale · Madrid',
    h1: 'Homes in <em>Madrid</em>, ready to move into',
    sub: 'Renovated apartments, penthouses and duplexes, or ones in the final stage of renovation, in the city\'s most sought-after neighbourhoods. Listings are updated daily.',
    allTypes: 'All types', priceMin: 'Min. price €', priceMax: 'Max. price €', m2min: 'Min. m²', beds: 'Bedrooms',
    garage: 'Parking', terrace: 'Terrace', availNow: 'Available now',
    sort: ['Newest', 'Price: low to high', 'Price: high to low', '€/m²: low to high', 'Largest first'],
    count1: 'home', countN: 'homes', onMap: 'on the map', loading: 'Loading…', reset: 'Clear',
    empty: 'No homes match these filters.', resetFilters: 'Clear filters', more: 'Show more homes',
    mapBtn: 'Show map', listBtn: 'Show list', loadErr: 'We couldn\'t load the homes. Please try again in a few minutes.',
    bedShort: 'bed', bathShort: 'bath', garageS: 'parking', terraceS: 'terrace',
    soon: 'Coming soon',
    types: { flat: 'Apartment', penthouse: 'Penthouse', duplex: 'Duplex', house: 'House', other: 'Home' },
    works: { delivery: 'Handover in progress', furnishing: 'Being furnished', finishing: 'Final finishes', renovation: 'Under renovation' },
    orient: { north: 'North', south: 'South', east: 'East', west: 'West', northeast: 'North-east', northwest: 'North-west', southeast: 'South-east', southwest: 'South-west' },
    nameTpl: '{type} on {street}',
    f: { price: 'Price', eurm2: '€/m²', area: 'Usable area', beds: 'Bedrooms', baths: 'Bathrooms', type: 'Type', floor: 'Floor', exterior: 'street-facing', orient: 'Orientation', status: 'Status', available: 'Available', garage: 'Parking space', storage: 'Storage room', terrace: 'Terrace', ac: 'Air conditioning', elevator: 'Lift', yes: 'Yes', no: 'No' },
    floorFmt: 'Floor {n}',
    ctaWa: 'Ask on WhatsApp', ctaMail: 'Request information',
    approx: 'Approximate location.', morePhotos: '+{n} photos', photo: 'photo',
    noDesc: 'Contact us for full details of this home.',
    origNote: 'Original description in Spanish.',
    waMsg: 'Hello, I am interested in the home {name} ({price}): {url}', mailSubj: 'Information · {name}',
    goneTitle: 'Home not available', goneH: 'This home is no longer for sale', goneBtn: 'See available homes',
    homes: 'Homes', units: { m2: 'm²', beds: 'bedrooms', baths: 'bathrooms' }
  },
  de: {
    nav: ['Immobilien', 'Leistungen', 'Arbeitsweise', 'Lagen', 'Kontakt'],
    operator: 'Betreiber: Olara Capital SL · USt-ID B26977355 · Carretera de Fuencarral 56, Büro 46, 28108 Alcobendas (Madrid) · info@olara-re.com',
    legal: ['Impressum', 'Datenschutz', 'Cookies'],
    disclaimer: 'Unverbindliche Angaben. Preise ohne Steuern und Erwerbsnebenkosten.',
    metaTitle: 'Wohnungen zum Kauf in Madrid · Olara Real Estate',
    metaDesc: 'Wohnungen, Penthäuser und Maisonetten zum Kauf in Madrid, saniert oder kurz vor Fertigstellung. Suche nach Preis, Fläche und Schlafzimmern, mit Kartenansicht.',
    eyebrow: 'Immobilien zum Kauf · Madrid',
    h1: 'Wohnungen in <em>Madrid</em>, bezugsfertig',
    sub: 'Sanierte oder kurz vor der Fertigstellung stehende Wohnungen, Penthäuser und Maisonetten in den gefragtesten Vierteln der Stadt. Das Angebot wird täglich aktualisiert.',
    allTypes: 'Alle Arten', priceMin: 'Preis ab €', priceMax: 'Preis bis €', m2min: 'm² ab', beds: 'Schlafzimmer',
    garage: 'Stellplatz', terrace: 'Terrasse', availNow: 'Sofort verfügbar',
    sort: ['Neueste', 'Preis aufsteigend', 'Preis absteigend', '€/m² aufsteigend', 'Größte Fläche'],
    count1: 'Immobilie', countN: 'Immobilien', onMap: 'auf der Karte', loading: 'Wird geladen…', reset: 'Zurücksetzen',
    empty: 'Keine Immobilien für diese Filter.', resetFilters: 'Filter zurücksetzen', more: 'Weitere Immobilien',
    mapBtn: 'Karte', listBtn: 'Liste', loadErr: 'Die Immobilien konnten nicht geladen werden. Bitte versuchen Sie es in einigen Minuten erneut.',
    bedShort: 'Schlafz.', bathShort: 'Bäder', garageS: 'Stellplatz', terraceS: 'Terrasse',
    soon: 'Demnächst',
    types: { flat: 'Wohnung', penthouse: 'Penthouse', duplex: 'Maisonette', house: 'Haus', other: 'Immobilie' },
    works: { delivery: 'In Übergabe', furnishing: 'Wird möbliert', finishing: 'Letzte Arbeiten', renovation: 'In Sanierung' },
    orient: { north: 'Nord', south: 'Süd', east: 'Ost', west: 'West', northeast: 'Nordost', northwest: 'Nordwest', southeast: 'Südost', southwest: 'Südwest' },
    nameTpl: '{type} in der {street}',
    f: { price: 'Preis', eurm2: '€/m²', area: 'Wohnfläche', beds: 'Schlafzimmer', baths: 'Bäder', type: 'Art', floor: 'Etage', exterior: 'Außenlage', orient: 'Ausrichtung', status: 'Status', available: 'Verfügbar', garage: 'Stellplatz', storage: 'Abstellraum', terrace: 'Terrasse', ac: 'Klimaanlage', elevator: 'Aufzug', yes: 'Ja', no: 'Nein' },
    floorFmt: '{n}. OG',
    ctaWa: 'Per WhatsApp anfragen', ctaMail: 'Informationen anfordern',
    approx: 'Ungefähre Lage.', morePhotos: '+{n} Fotos', photo: 'Foto',
    noDesc: 'Fordern Sie die vollständigen Informationen zu dieser Immobilie an.',
    origNote: 'Originalbeschreibung auf Spanisch.',
    waMsg: 'Hallo, ich interessiere mich für die Immobilie {name} ({price}): {url}', mailSubj: 'Anfrage · {name}',
    goneTitle: 'Immobilie nicht verfügbar', goneH: 'Diese Immobilie steht nicht mehr zum Verkauf', goneBtn: 'Verfügbare Immobilien ansehen',
    homes: 'Immobilien', units: { m2: 'm²', beds: 'Schlafzimmer', baths: 'Bäder' }
  },
  fr: {
    nav: ['Biens', 'Services', 'Notre méthode', 'Quartiers', 'Contact'],
    operator: 'Site exploité par Olara Capital SL · N° fiscal B26977355 · Carretera de Fuencarral 56, bureau 46, 28108 Alcobendas (Madrid) · info@olara-re.com',
    legal: ['Mentions légales', 'Confidentialité', 'Cookies'],
    disclaimer: 'Informations indicatives, sans valeur contractuelle. Prix hors taxes et frais d\'acquisition.',
    metaTitle: 'Appartements à vendre à Madrid · Olara Real Estate',
    metaDesc: 'Appartements, penthouses et duplex à vendre à Madrid, rénovés ou en fin de rénovation. Recherchez par prix, surface et chambres, et visualisez-les sur la carte.',
    eyebrow: 'Biens à vendre · Madrid',
    h1: 'Appartements à <em>Madrid</em>, prêts à vivre',
    sub: 'Appartements, penthouses et duplex rénovés ou en fin de rénovation, dans les quartiers les plus recherchés de la ville. Le portefeuille est mis à jour chaque jour.',
    allTypes: 'Tous les types', priceMin: 'Prix min. €', priceMax: 'Prix max. €', m2min: 'm² min.', beds: 'Chambres',
    garage: 'Parking', terrace: 'Terrasse', availNow: 'Disponibles',
    sort: ['Plus récents', 'Prix croissant', 'Prix décroissant', '€/m² croissant', 'Plus grande surface'],
    count1: 'bien', countN: 'biens', onMap: 'sur la carte', loading: 'Chargement…', reset: 'Effacer',
    empty: 'Aucun bien ne correspond à ces filtres.', resetFilters: 'Effacer les filtres', more: 'Voir plus de biens',
    mapBtn: 'Voir la carte', listBtn: 'Voir la liste', loadErr: 'Impossible de charger les biens. Veuillez réessayer dans quelques minutes.',
    bedShort: 'ch.', bathShort: 'sdb', garageS: 'parking', terraceS: 'terrasse',
    soon: 'Bientôt',
    types: { flat: 'Appartement', penthouse: 'Penthouse', duplex: 'Duplex', house: 'Maison', other: 'Bien' },
    works: { delivery: 'En cours de livraison', furnishing: 'En cours d\'ameublement', finishing: 'Finitions', renovation: 'En rénovation' },
    orient: { north: 'Nord', south: 'Sud', east: 'Est', west: 'Ouest', northeast: 'Nord-est', northwest: 'Nord-ouest', southeast: 'Sud-est', southwest: 'Sud-ouest' },
    nameTpl: '{type} rue {street}',
    f: { price: 'Prix', eurm2: '€/m²', area: 'Surface habitable', beds: 'Chambres', baths: 'Salles de bains', type: 'Type', floor: 'Étage', exterior: 'sur rue', orient: 'Orientation', status: 'État', available: 'Disponible', garage: 'Place de parking', storage: 'Cave', terrace: 'Terrasse', ac: 'Climatisation', elevator: 'Ascenseur', yes: 'Oui', no: 'Non' },
    floorFmt: '{n}e étage',
    ctaWa: 'Contacter sur WhatsApp', ctaMail: 'Demander des informations',
    approx: 'Emplacement approximatif.', morePhotos: '+{n} photos', photo: 'photo',
    noDesc: 'Contactez-nous pour obtenir toutes les informations sur ce bien.',
    origNote: 'Description originale en espagnol.',
    waMsg: 'Bonjour, ce bien m\'intéresse : {name} ({price}) : {url}', mailSubj: 'Demande · {name}',
    goneTitle: 'Bien non disponible', goneH: 'Ce bien n\'est plus à vendre', goneBtn: 'Voir les biens disponibles',
    homes: 'Biens', units: { m2: 'm²', beds: 'chambres', baths: 'salles de bains' }
  },
  it: {
    nav: ['Immobili', 'Servizi', 'Come lavoriamo', 'Zone', 'Contatti'],
    operator: 'Sito gestito da Olara Capital SL · C.F. B26977355 · Carretera de Fuencarral 56, uff. 46, 28108 Alcobendas (Madrid) · info@olara-re.com',
    legal: ['Note legali', 'Privacy', 'Cookie'],
    disclaimer: 'Informazioni indicative, senza valore contrattuale. Prezzi al netto di imposte e spese.',
    metaTitle: 'Appartamenti in vendita a Madrid · Olara Real Estate',
    metaDesc: 'Appartamenti, attici e duplex in vendita a Madrid, ristrutturati o in fase finale di ristrutturazione. Cerca per prezzo, superficie e camere, e visualizzali sulla mappa.',
    eyebrow: 'Immobili in vendita · Madrid',
    h1: 'Case a <em>Madrid</em>, pronte da abitare',
    sub: 'Appartamenti, attici e duplex ristrutturati o in fase finale di ristrutturazione, nei quartieri più richiesti della città. L\'offerta viene aggiornata ogni giorno.',
    allTypes: 'Tutte le tipologie', priceMin: 'Prezzo min. €', priceMax: 'Prezzo max. €', m2min: 'm² min.', beds: 'Camere',
    garage: 'Posto auto', terrace: 'Terrazza', availNow: 'Disponibili subito',
    sort: ['Più recenti', 'Prezzo crescente', 'Prezzo decrescente', '€/m² crescente', 'Superficie maggiore'],
    count1: 'immobile', countN: 'immobili', onMap: 'sulla mappa', loading: 'Caricamento…', reset: 'Azzera',
    empty: 'Nessun immobile corrisponde a questi filtri.', resetFilters: 'Azzera filtri', more: 'Mostra altri immobili',
    mapBtn: 'Mappa', listBtn: 'Elenco', loadErr: 'Impossibile caricare gli immobili. Riprova tra qualche minuto.',
    bedShort: 'camere', bathShort: 'bagni', garageS: 'posto auto', terraceS: 'terrazza',
    soon: 'Prossimamente',
    types: { flat: 'Appartamento', penthouse: 'Attico', duplex: 'Duplex', house: 'Casa', other: 'Immobile' },
    works: { delivery: 'In consegna', furnishing: 'In arredamento', finishing: 'Finiture', renovation: 'In ristrutturazione' },
    orient: { north: 'Nord', south: 'Sud', east: 'Est', west: 'Ovest', northeast: 'Nord-est', northwest: 'Nord-ovest', southeast: 'Sud-est', southwest: 'Sud-ovest' },
    nameTpl: '{type} in via {street}',
    f: { price: 'Prezzo', eurm2: '€/m²', area: 'Superficie utile', beds: 'Camere', baths: 'Bagni', type: 'Tipologia', floor: 'Piano', exterior: 'esterno', orient: 'Esposizione', status: 'Stato', available: 'Disponibile', garage: 'Posto auto', storage: 'Ripostiglio', terrace: 'Terrazza', ac: 'Aria condizionata', elevator: 'Ascensore', yes: 'Sì', no: 'No' },
    floorFmt: '{n}º piano',
    ctaWa: 'Scrivici su WhatsApp', ctaMail: 'Richiedi informazioni',
    approx: 'Posizione approssimativa.', morePhotos: '+{n} foto', photo: 'foto',
    noDesc: 'Contattaci per ricevere tutte le informazioni su questo immobile.',
    origNote: 'Descrizione originale in spagnolo.',
    waMsg: 'Buongiorno, mi interessa l\'immobile {name} ({price}): {url}', mailSubj: 'Richiesta · {name}',
    goneTitle: 'Immobile non disponibile', goneH: 'Questo immobile non è più in vendita', goneBtn: 'Vedi gli immobili disponibili',
    homes: 'Immobili', units: { m2: 'm²', beds: 'camere', baths: 'bagni' }
  },
  ru: {
    nav: ['Недвижимость', 'Услуги', 'Как мы работаем', 'Районы', 'Контакты'],
    operator: 'Сайт принадлежит Olara Capital SL · ИНН B26977355 · Carretera de Fuencarral 56, оф. 46, 28108 Alcobendas (Мадрид) · info@olara-re.com',
    legal: ['Правовая информация', 'Конфиденциальность', 'Cookies'],
    disclaimer: 'Информация носит ознакомительный характер и не является офертой. Цены без учёта налогов и расходов.',
    metaTitle: 'Квартиры на продажу в Мадриде · Olara Real Estate',
    metaDesc: 'Квартиры, пентхаусы и дуплексы на продажу в Мадриде — с ремонтом или на завершающем этапе ремонта. Поиск по цене, площади и числу спален, просмотр на карте.',
    eyebrow: 'Недвижимость на продажу · Мадрид',
    h1: 'Квартиры в <em>Мадриде</em>, готовые к заселению',
    sub: 'Квартиры, пентхаусы и дуплексы с ремонтом или на завершающем этапе ремонта в самых востребованных районах города. Каталог обновляется ежедневно.',
    allTypes: 'Все типы', priceMin: 'Цена от, €', priceMax: 'Цена до, €', m2min: 'Площадь от, м²', beds: 'Спальни',
    garage: 'Парковка', terrace: 'Терраса', availNow: 'Доступны сейчас',
    sort: ['Новые', 'Цена по возрастанию', 'Цена по убыванию', '€/м² по возрастанию', 'Самые большие'],
    count1: 'объект', countN: 'объектов', onMap: 'на карте', loading: 'Загрузка…', reset: 'Сбросить',
    empty: 'Нет объектов по этим фильтрам.', resetFilters: 'Сбросить фильтры', more: 'Показать ещё',
    mapBtn: 'Карта', listBtn: 'Список', loadErr: 'Не удалось загрузить объекты. Попробуйте через несколько минут.',
    bedShort: 'спал.', bathShort: 'ван.', garageS: 'парковка', terraceS: 'терраса',
    soon: 'Скоро в продаже',
    types: { flat: 'Квартира', penthouse: 'Пентхаус', duplex: 'Дуплекс', house: 'Дом', other: 'Объект' },
    works: { delivery: 'Передача объекта', furnishing: 'Меблировка', finishing: 'Финишная отделка', renovation: 'Идёт ремонт' },
    orient: { north: 'Север', south: 'Юг', east: 'Восток', west: 'Запад', northeast: 'Северо-восток', northwest: 'Северо-запад', southeast: 'Юго-восток', southwest: 'Юго-запад' },
    nameTpl: '{type}, улица {street}',
    f: { price: 'Цена', eurm2: '€/м²', area: 'Полезная площадь', beds: 'Спальни', baths: 'Ванные', type: 'Тип', floor: 'Этаж', exterior: 'окна на улицу', orient: 'Ориентация', status: 'Статус', available: 'Доступен', garage: 'Парковочное место', storage: 'Кладовая', terrace: 'Терраса', ac: 'Кондиционер', elevator: 'Лифт', yes: 'Да', no: 'Нет' },
    floorFmt: '{n}-й этаж',
    ctaWa: 'Написать в WhatsApp', ctaMail: 'Запросить информацию',
    approx: 'Примерное расположение.', morePhotos: '+{n} фото', photo: 'фото',
    noDesc: 'Запросите у нас полную информацию об этом объекте.',
    origNote: 'Оригинальное описание на испанском языке.',
    waMsg: 'Здравствуйте, меня интересует объект {name} ({price}): {url}', mailSubj: 'Запрос · {name}',
    goneTitle: 'Объект недоступен', goneH: 'Этот объект больше не продаётся', goneBtn: 'Смотреть доступные объекты',
    homes: 'Недвижимость', units: { m2: 'м²', beds: 'спальни', baths: 'ванные' }
  },
  zh: {
    nav: ['房产', '服务', '工作方式', '区域', '联系我们'],
    operator: '网站运营方：Olara Capital SL · 税号 B26977355 · Carretera de Fuencarral 56, 46号办公室, 28108 Alcobendas（马德里）· info@olara-re.com',
    legal: ['法律声明', '隐私政策', 'Cookie'],
    disclaimer: '信息仅供参考，不构成合同依据。价格不含税费及交易费用。',
    metaTitle: '马德里在售住宅 · Olara Real Estate',
    metaDesc: '马德里在售公寓、顶层公寓和复式公寓，已翻新或即将完成翻新。可按价格、面积和卧室数量筛选，并在地图上查看。',
    eyebrow: '在售房产 · 马德里',
    h1: '<em>马德里</em>精选住宅，拎包入住',
    sub: '位于马德里最热门街区的公寓、顶层公寓和复式公寓，已完成翻新或处于翻新收尾阶段。房源每日更新。',
    allTypes: '全部类型', priceMin: '最低价格 €', priceMax: '最高价格 €', m2min: '最小面积 m²', beds: '卧室',
    garage: '车位', terrace: '露台', availNow: '现房',
    sort: ['最新上架', '价格从低到高', '价格从高到低', '单价从低到高', '面积从大到小'],
    count1: '套房源', countN: '套房源', onMap: '（地图范围内）', loading: '加载中…', reset: '清除',
    empty: '没有符合条件的房源。', resetFilters: '清除筛选', more: '查看更多房源',
    mapBtn: '查看地图', listBtn: '查看列表', loadErr: '房源加载失败，请稍后重试。',
    bedShort: '卧', bathShort: '卫', garageS: '车位', terraceS: '露台',
    soon: '即将上市',
    types: { flat: '公寓', penthouse: '顶层公寓', duplex: '复式公寓', house: '独栋住宅', other: '住宅' },
    works: { delivery: '交付中', furnishing: '家具布置中', finishing: '收尾装修', renovation: '翻新中' },
    orient: { north: '朝北', south: '朝南', east: '朝东', west: '朝西', northeast: '东北朝向', northwest: '西北朝向', southeast: '东南朝向', southwest: '西南朝向' },
    nameTpl: '{street}街{type}',
    f: { price: '价格', eurm2: '单价（€/m²）', area: '使用面积', beds: '卧室', baths: '卫生间', type: '类型', floor: '楼层', exterior: '临街', orient: '朝向', status: '状态', available: '可售', garage: '车位', storage: '储藏室', terrace: '露台', ac: '空调', elevator: '电梯', yes: '有', no: '无' },
    floorFmt: '{n}楼',
    ctaWa: 'WhatsApp 咨询', ctaMail: '索取资料',
    approx: '大致位置。', morePhotos: '另有{n}张照片', photo: '照片',
    noDesc: '请联系我们获取该房源的完整信息。',
    origNote: '西班牙语原文描述。',
    waMsg: '您好，我对这套房源感兴趣：{name}（{price}）：{url}', mailSubj: '房源咨询 · {name}',
    goneTitle: '房源已下架', goneH: '该房源已不再出售', goneBtn: '查看在售房源',
    homes: '房产', units: { m2: 'm²', beds: '卧室', baths: '卫生间' }
  }
};

const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : ''));
const base = lang => (lang === 'es' ? '' : '/' + lang);
const listUrl = lang => `${base(lang)}/viviendas`;
const itemUrl = (lang, id) => `${base(lang)}/viviendas/${id}`;
const pick = l => (LANGS.includes(l) ? l : 'es');

function langSwitch(lang, pathFor) {
  return `<div class="lang" role="group" aria-label="Idioma">` + LANGS.map(l => `<a href="${pathFor(l)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ''} title="${NAMES[l]}">${SHORT[l]}</a>`).join('<span>/</span>') + `</div>`;
}
function hreflang(pathFor) {
  return LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="https://www.olara-re.com${pathFor(l)}">`).join('\n') +
    `\n<link rel="alternate" hreflang="x-default" href="https://www.olara-re.com${pathFor('es')}">`;
}
function header(lang, pathFor, t) {
  const home = lang === 'en' ? '/?lang=en' : '/';
  const L = t.nav;
  return `<header class="nav solid" id="nav">
  <a class="brand" href="/" aria-label="Olara RE"><img src="/logo-olara-re-horizontal-crema.svg" alt="Olara Real Estate" width="118" height="34"></a>
  <nav class="nav-links" id="navLinks">
    <a href="${listUrl(lang)}" class="on">${L[0]}</a>
    <a href="/#servicios">${L[1]}</a>
    <a href="/#proceso">${L[2]}</a>
    <a href="/#zonas">${L[3]}</a>
    <a href="/#contacto">${L[4]}</a>
  </nav>
  <div style="display:flex;align-items:center;gap:1.5rem">
    ${langSwitch(lang, pathFor)}
    <button class="burger" id="burger" aria-label="Menú" aria-expanded="false"><i></i><i></i></button>
  </div>
</header>
<script>(function(){var n=document.getElementById('nav'),l=document.getElementById('navLinks'),b=document.getElementById('burger');b.addEventListener('click',function(){var o=!l.classList.contains('open');l.classList.toggle('open',o);n.classList.toggle('menu-open',o);b.setAttribute('aria-expanded',String(o));document.body.style.overflow=o?'hidden':''});l.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){l.classList.remove('open');n.classList.remove('menu-open');b.setAttribute('aria-expanded','false');document.body.style.overflow=''})})})();</script>`;
}
function footer(t) {
  return `<footer class="ft"><div class="wrap">
  <div><strong style="color:var(--ink);letter-spacing:.2em">OLARA REAL ESTATE</strong><br>${t.operator}</div>
  <div><a href="/aviso-legal">${t.legal[0]}</a> · <a href="/privacidad">${t.legal[1]}</a> · <a href="/cookies">${t.legal[2]}</a><br>${t.disclaimer}</div>
</div></footer>`;
}

module.exports = { LANGS, LOCALE, T, fill, listUrl, itemUrl, pick, header, footer, hreflang };
