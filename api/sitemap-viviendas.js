const { list } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const items = await list();
    const urls = ['https://www.olara-re.com/viviendas']
      .concat(items.map(p => `https://www.olara-re.com/viviendas/${p.id}`));
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n') + '\n</urlset>\n';
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (e) {
    res.status(502).send('');
  }
};
