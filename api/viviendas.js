const { list } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const items = await list();
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify({ updated: new Date().toISOString(), count: items.length, items }));
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'No se pudo cargar la cartera' });
  }
};
