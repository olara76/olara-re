const { list } = require('./_lib');
const { LANGS, listUrl, itemUrl } = require('./_i18n');

const D = 'https://www.olara-re.com';

function entry(pathFor) {
  const alts = LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${D}${pathFor(l)}"/>`).join('\n');
  return LANGS.map(l => `  <url><loc>${D}${pathFor(l)}</loc>\n${alts}\n  </url>`).join('\n');
}

module.exports = async (req, res) => {
  try {
    const items = await list();
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
      [entry(l => listUrl(l))].concat(items.map(p => entry(l => itemUrl(l, p.id)))).join('\n') + '\n</urlset>\n';
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (e) {
    res.status(502).send('');
  }
};
