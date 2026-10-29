/* Olara RE — portal de propiedades. Lee la colección "Propiedades" del CMS de Wix
   con un token de visitante (cliente público). Sin datos inventados: si no hay
   inmuebles publicados, se muestra un estado vacío honesto. */
(function () {
  var CLIENT_ID = 'cabed414-66cb-4a79-8068-8ea486765bb0';
  var API = 'https://www.wixapis.com';
  var COLLECTION = 'Propiedades';
  var KEY = 'olara-visitor-' + CLIENT_ID;
  var FAV_KEY = 'olara-favs';

  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  async function mint(body) {
    var r = await fetch(API + '/oauth2/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('token ' + r.status);
    var d = await r.json();
    return { access: d.access_token, refresh: d.refresh_token, exp: Date.now() + d.expires_in * 1000 };
  }
  async function token() {
    var t = load(KEY);
    if (t && t.exp > Date.now() + 60000) return t.access;
    if (t && t.refresh) {
      try { var r = await mint({ clientId: CLIENT_ID, grantType: 'refresh_token', refreshToken: t.refresh }); save(KEY, r); return r.access; } catch (e) {}
    }
    var f = await mint({ clientId: CLIENT_ID, grantType: 'anonymous' });
    save(KEY, f);
    return f.access;
  }
  async function api(path, body) {
    var r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: await token() }, body: JSON.stringify(body) });
    if (!r.ok) { var e = new Error('Wix ' + r.status); e.status = r.status; throw e; }
    return r.json();
  }

  /* Todos los inmuebles visibles (publicados y no retirados ni vendidos hace tiempo). */
  async function fetchAll() {
    if (window.__OLARA_DATA__) return window.__OLARA_DATA__;
    var out = [], cursor = null, guard = 0;
    do {
      var q = cursor ? { cursorPaging: { limit: 100, cursor: cursor } }
        : { filter: { estado: { $in: ['activa', 'reservada', 'vendida'] } }, sort: [{ fieldName: '_createdDate', order: 'DESC' }], cursorPaging: { limit: 100 } };
      var d = await api('/wix-data/v2/items/query', { dataCollectionId: COLLECTION, query: q });
      (d.dataItems || []).forEach(function (it) { var x = it.data || {}; x._id = x._id || it.id; out.push(x); });
      cursor = d.pagingMetadata && d.pagingMetadata.cursors && d.pagingMetadata.cursors.next;
      guard++;
    } while (cursor && guard < 20);
    return out;
  }
  async function fetchOne(key) {
    if (window.__OLARA_ONE__) return window.__OLARA_ONE__;
    var filter = { $or: [{ slug: { $eq: key } }, { _id: { $eq: key } }] };
    var d = await api('/wix-data/v2/items/query', { dataCollectionId: COLLECTION, query: { filter: filter, cursorPaging: { limit: 1 } } });
    var it = d.dataItems && d.dataItems[0];
    if (!it) return null;
    var x = it.data || {}; x._id = x._id || it.id; return x;
  }

  function img(v) {
    if (!v) return null;
    if (typeof v === 'object') v = v.src || v.url || null;
    if (!v || typeof v !== 'string') return null;
    if (v.indexOf('//') === 0) return 'https:' + v;
    if (v.indexOf('http') === 0) return v;
    if (v.indexOf('wix:image://') === 0) { var id = v.slice('wix:image://v1/'.length).split('/')[0]; return id ? 'https://static.wixstatic.com/media/' + id : null; }
    return null;
  }
  function gallery(p) {
    var g = Array.isArray(p.galeria) ? p.galeria.map(function (x) { return img(x && (x.src || x)); }).filter(Boolean) : [];
    var c = img(p.portada);
    if (c && g.indexOf(c) < 0) g.unshift(c);
    return g;
  }
  function thumb(u, w, h) {
    if (!u) return null;
    if (u.indexOf('static.wixstatic.com/media/') >= 0 && u.indexOf('/v1/') < 0) return u + '/v1/fill/w_' + w + ',h_' + h + ',q_80/foto.jpg';
    return u;
  }
  function dateOf(v) { var d = new Date(v && v.$date ? v.$date : v); return isNaN(d) ? null : d; }
  var eur = function (n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n); };
  var num = function (n) { return new Intl.NumberFormat('es-ES').format(n); };
  function short(n) {
    if (n >= 1e6) return (Math.round(n / 1e5) / 10).toString().replace('.', ',') + ' M€';
    return Math.round(n / 1e3) + ' k€';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function link(p) { return '/propiedades/' + encodeURIComponent(p.slug || p._id); }
  function isNew(p) { var d = dateOf(p._createdDate); return d && (Date.now() - d.getTime()) < 14 * 864e5; }
  function drop(p) { return p.precioAnterior && p.precio && p.precioAnterior > p.precio ? p.precioAnterior - p.precio : 0; }
  function zona(p) { return [p.barrio, p.distrito, p.municipio].filter(Boolean)[0] || 'Madrid'; }

  function favs() { return load(FAV_KEY) || []; }
  function toggleFav(id) { var f = favs(); var i = f.indexOf(id); if (i < 0) f.push(id); else f.splice(i, 1); save(FAV_KEY, f); return i < 0; }

  function badges(p) {
    var b = [];
    if (p.estado === 'reservada') b.push('<span class="tag tag-res">Reservada</span>');
    if (p.estado === 'vendida') b.push('<span class="tag tag-sold">Vendida</span>');
    if (drop(p)) b.push('<span class="tag tag-drop">Bajada ' + short(drop(p)) + '</span>');
    if (isNew(p) && p.estado === 'activa') b.push('<span class="tag tag-new">Nuevo</span>');
    if (p.situacion) b.push('<span class="tag">' + esc(p.situacion) + '</span>');
    return b.join('');
  }
  function facts(p) {
    var f = [];
    if (p.dormitorios) f.push(p.dormitorios + ' hab.');
    if (p.banos) f.push(p.banos + (p.banos === 1 ? ' baño' : ' baños'));
    if (p.superficie) f.push(num(p.superficie) + ' m²');
    if (p.precio && p.superficie) f.push(num(Math.round(p.precio / p.superficie)) + ' €/m²');
    return f.join(' · ');
  }
  function card(p) {
    var g = gallery(p), fav = favs().indexOf(p._id) >= 0;
    return '<article class="card" data-id="' + esc(p._id) + '">' +
      '<a class="card-media" href="' + link(p) + '">' +
        (g[0] ? '<img src="' + esc(thumb(g[0], 640, 480)) + '" alt="' + esc(p.title) + '" loading="lazy">' : '<span class="card-ph">Sin fotografía</span>') +
        '<span class="card-tags">' + badges(p) + '</span>' +
      '</a>' +
      '<button class="fav' + (fav ? ' on' : '') + '" type="button" aria-label="Guardar" aria-pressed="' + fav + '" data-fav="' + esc(p._id) + '">&#9825;</button>' +
      '<a class="card-body" href="' + link(p) + '">' +
        '<div class="card-price">' + (p.precio ? eur(p.precio) : 'Precio a consultar') + (drop(p) ? ' <s>' + eur(p.precioAnterior) + '</s>' : '') + '</div>' +
        '<div class="card-facts">' + facts(p) + '</div>' +
        '<div class="card-title">' + esc(p.title || p.tipologia || 'Inmueble') + '</div>' +
        '<div class="card-zone">' + esc(zona(p)) + (p.tipologia ? ' · ' + esc(p.tipologia) : '') + '</div>' +
      '</a>' +
    '</article>';
  }
  function coords(p) {
    if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return null;
    if (!p.ubicacionAproximada) return [p.lat, p.lng];
    /* desplazamiento estable de ~150 m para no revelar el portal exacto */
    var h = 0; String(p._id).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 997; });
    return [p.lat + ((h % 20) - 10) * 0.00014, p.lng + ((Math.floor(h / 20) % 20) - 10) * 0.00018];
  }

  /* Envío a Wix Forms (formularios creados en el panel de Wix). */
  var FORMS = { contacto: '97224611-d769-4299-9b31-ff46ea230c36', alertas: '46919424-73bc-47a7-9c97-fb0973164ead' };
  async function submitForm(key, values) {
    var d = await api('/form-submission-service/v4/submissions', { submission: { formId: FORMS[key], submissions: values } });
    var st = d.submission && d.submission.status;
    if (['CONFIRMED', 'PENDING', 'PAYMENT_WAITING'].indexOf(st) < 0) throw new Error('estado ' + st);
    return d.submission;
  }

  /* Ficha completa (la usan el servidor y el navegador) */
  function yn(v) { return v === true ? 'Sí' : v === false ? 'No' : null; }
  function ref(p) { return p.referencia || String(p._id).slice(0, 8).toUpperCase(); }
  function renderFicha(p) {
    var g = gallery(p), r = ref(p);
    var subject = encodeURIComponent('Visita ' + r + ' — ' + (p.title || ''));
    var feats = [
      ['Tipología', p.tipologia], ['Situación', p.situacion], ['Planta', p.planta],
      ['Ascensor', yn(p.ascensor)], ['Terraza', yn(p.terraza)], ['Garaje', yn(p.garaje)],
      ['Zona', zona(p)], ['Referencia', r]
    ].filter(function (x) { return x[1]; });
    var kv = [
      [p.superficie ? num(p.superficie) : null, 'm² construidos'],
      [p.dormitorios, 'dormitorios'],
      [p.banos, p.banos === 1 ? 'baño' : 'baños'],
      [p.precio && p.superficie ? num(Math.round(p.precio / p.superficie)) + ' €' : null, 'por m²']
    ].filter(function (x) { return x[0]; });
    var galHtml = g.length
      ? '<div class="gal' + (g.length < 3 ? ' one' : '') + '">' + g.slice(0, g.length < 3 ? 1 : 3).map(function (u, i) {
          return '<button type="button" data-i="' + i + '"><img src="' + esc(thumb(u, i ? 800 : 1400, i ? 600 : 1050)) + '" alt="' + esc(p.title) + ' — foto ' + (i + 1) + '"' + (i ? ' loading="lazy"' : '') + '>' + (i === Math.min(2, g.length - 1) && g.length > 1 ? '<span class="more">Ver ' + g.length + ' fotos</span>' : '') + '</button>';
        }).join('') + '</div>'
      : '';
    return '<p class="crumbs"><a href="/propiedades">Propiedades</a> · ' + esc(zona(p)) + '</p>' + galHtml +
      '<div class="f-grid"><div>' +
        '<div class="f-price">' + (p.precio ? eur(p.precio) : 'Precio a consultar') + (drop(p) ? '<s>' + eur(p.precioAnterior) + '</s>' : '') + '</div>' +
        '<h1 class="f-title">' + esc(p.title || p.tipologia || 'Inmueble') + '</h1>' +
        '<p class="f-zone">' + esc(zona(p)) + (p.municipio && p.municipio !== zona(p) ? ' · ' + esc(p.municipio) : '') + '</p>' +
        '<div class="f-tags">' + badges(p) + '</div>' +
        (kv.length ? '<div class="kv">' + kv.map(function (x) { return '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') + '</div>' : '') +
        (p.descripcion ? '<section class="f-sec"><h2>El <em>inmueble</em></h2><p class="f-desc">' + esc(p.descripcion) + '</p></section>' : '') +
        (feats.length ? '<section class="f-sec"><h2>Características</h2><ul class="feat">' + feats.map(function (x) { return '<li><span>' + x[0] + '</span><span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul></section>' : '') +
        (coords(p) ? '<section class="f-sec"><h2>Ubicación</h2><div id="fmap"></div>' + (p.ubicacionAproximada ? '<p class="f-desc" style="margin-top:.75rem;font-size:.8125rem">Ubicación aproximada. Le facilitamos la dirección al concertar la visita.</p>' : '') + '</section>' : '') +
      '</div>' +
      '<aside class="aside">' +
        '<h3>¿Le interesa? <em>Véalo en persona.</em></h3>' +
        '<p>Organizamos visitas privadas y le enviamos el dossier completo. Respondemos en menos de 24 horas laborables.</p>' +
        '<a class="btn btn-solid" href="https://calendly.com/olarrea76/30min" target="_blank" rel="noopener">Solicitar visita</a>' +
        '<a class="btn btn-ghost" href="mailto:info@olara-re.com?subject=' + subject + '">Pedir dossier por email</a>' +
        '<button class="btn btn-ghost" type="button" id="share" style="width:100%;margin-top:.625rem">Compartir</button>' +
        '<p class="ref">Ref. ' + esc(r) + '</p>' +
      '</aside></div>';
  }

  window.OlaraPortal = { renderFicha: renderFicha, ref: ref, submitForm: submitForm, fetchAll: fetchAll, fetchOne: fetchOne, card: card, badges: badges, facts: facts, gallery: gallery, thumb: thumb, coords: coords, eur: eur, num: num, short: short, esc: esc, link: link, zona: zona, drop: drop, favs: favs, toggleFav: toggleFav, dateOf: dateOf };
})();

/* menú: idioma compartido con la portada */
(function () {
  if (typeof document === 'undefined' || !document.body.classList.contains('p-body')) return;
  var EN = { navP: 'Properties', nav1: 'Services', nav2: 'How we work', nav3: 'Areas', nav4: 'Contact' };
  var ES = {};
  document.querySelectorAll('.nav [data-i18n]').forEach(function (e) { ES[e.dataset.i18n] = e.textContent; });
  function set(l) {
    var d = l === 'en' ? EN : ES;
    document.querySelectorAll('.nav [data-i18n]').forEach(function (e) { if (d[e.dataset.i18n]) e.textContent = d[e.dataset.i18n]; });
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === l)); });
    try { localStorage.setItem('olara-lang', l); } catch (e) {}
  }
  document.querySelectorAll('.lang button').forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.lang); }); });
  try { if (localStorage.getItem('olara-lang') === 'en') set('en'); } catch (e) {}
})();
