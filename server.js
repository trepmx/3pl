const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5000;
const MARKETPLACES = ['amazon', 'mercado_libre', 'liverpool', 'coppel', 'elektra', 'tiktok'];
const DATA_PATH = path.join(__dirname, 'data', 'products.json');
const CONFIG_PATH = path.join(__dirname, 'config', 'marketplace-mappings.json');
const CATALOGS_PATH = path.join(__dirname, 'data', 'catalogs.json');

async function ensureDirectories() {
  const dirs = ['data', 'exports', 'config', 'storage/originals', 'storage/renditions'].map((dir) => path.join(__dirname, dir));
  await Promise.all(dirs.map((dir) => fsp.mkdir(dir, { recursive: true })));

  if (!fs.existsSync(DATA_PATH)) await fsp.writeFile(DATA_PATH, JSON.stringify([], null, 2));
  if (!fs.existsSync(CATALOGS_PATH)) await fsp.writeFile(CATALOGS_PATH, JSON.stringify({}, null, 2));
}

async function readJson(filePath, fallback = []) {
  try {
    const raw = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fsp.writeFile(filePath, JSON.stringify(value, null, 2));
}

function validateVariant(variant) {
  const errors = [];
  const warnings = [];

  if (!variant.sku) errors.push('SKU obligatorio');
  if (!variant.ean) errors.push('EAN obligatorio');
  if (!variant.mainImage) errors.push('Imagen principal obligatoria');
  if (!variant.mainImageWhiteBg) warnings.push('Confirmar fondo blanco de imagen principal');

  return { errors, warnings };
}

function applyFilter(items, query) {
  return items.filter((item) => {
    if (query.marca && item.brand !== query.marca) return false;
    if (query.categoria && item.category !== query.categoria) return false;
    if (query.search) {
      const term = query.search.toLowerCase();
      const searchable = [item.sku, item.ean, item.model].join(' ').toLowerCase();
      if (!searchable.includes(term)) return false;
    }
    if (query.marketplace && query.status && item.marketplaceStatus?.[query.marketplace] !== query.status) return false;
    if (query.pendientes_mapeo === 'true' && !(item.pendingMappings > 0)) return false;
    return true;
  });
}

function normalizeFromCatalog(value, attribute, marketplace, catalogs) {
  const rows = catalogs?.[attribute] || [];
  const found = rows.find((row) => row.master?.toLowerCase() === (value || '').toLowerCase());
  return found?.[marketplace] || value || '';
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    const values = headers.map((h) => {
      const value = `${row[h] ?? ''}`.replace(/"/g, '""');
      return `"${value}"`;
    });
    lines.push(values.join(','));
  });
  return lines.join('\n');
}

app.get('/', (req, res) => {
  res.json({ message: 'PIM ligero operativo' });
});

app.get('/api/dashboard', async (req, res) => {
  const products = await readJson(DATA_PATH, []);
  const validation = products.map(validateVariant);

  res.json({
    totalVariantes: products.length,
    listasParaExportar: validation.filter((v) => !v.errors.length).length,
    conErrores: validation.reduce((acc, v) => acc + v.errors.length, 0),
    conWarnings: validation.reduce((acc, v) => acc + v.warnings.length, 0),
    pendientesMapeo: products.reduce((acc, p) => acc + (p.pendingMappings || 0), 0),
    ultimoImport: products.at(-1)?.updatedAt || null
  });
});

app.get('/api/productos', async (req, res) => {
  const products = await readJson(DATA_PATH, []);
  res.json(applyFilter(products, req.query));
});

app.post('/api/productos', async (req, res) => {
  const products = await readJson(DATA_PATH, []);
  const payload = { ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const validation = validateVariant(payload);
  if (validation.errors.length) return res.status(400).json({ message: 'Validación fallida', ...validation });

  products.push(payload);
  await writeJson(DATA_PATH, products);
  res.status(201).json(payload);
});

app.get('/api/productos/:sku/:ean', async (req, res) => {
  const products = await readJson(DATA_PATH, []);
  const catalogs = await readJson(CATALOGS_PATH, {});
  const product = products.find((p) => p.sku === req.params.sku && p.ean === req.params.ean);
  if (!product) return res.status(404).json({ message: 'No encontrado' });

  const preview = {};
  MARKETPLACES.forEach((marketplace) => {
    preview[marketplace] = {
      sku: product.sku,
      ean: product.ean,
      title: `${product.brand || ''} ${product.model || ''}`.trim().slice(0, 120),
      frameColor: normalizeFromCatalog(product.frameColor, 'frameColor', marketplace, catalogs),
      lensColor: normalizeFromCatalog(product.lensColor, 'lensColor', marketplace, catalogs)
    };
  });

  res.json({ product, preview, validation: validateVariant(product) });
});

app.post('/api/importar/validar', async (req, res) => {
  const rows = req.body.rows;
  if (!Array.isArray(rows)) {
    return res.status(400).json({ message: 'Envía rows como arreglo JSON para validar importación' });
  }

  const skuSet = new Set();
  const eanSet = new Set();
  const errors = [];

  rows.forEach((row, idx) => {
    const sku = row.SKU || row.sku;
    const ean = row.EAN || row.ean;
    if (!sku || !ean) errors.push({ row: idx + 1, issue: 'SKU y EAN obligatorios' });
    if (skuSet.has(sku)) errors.push({ row: idx + 1, issue: `SKU duplicado ${sku}` });
    if (eanSet.has(ean)) errors.push({ row: idx + 1, issue: `EAN duplicado ${ean}` });
    skuSet.add(sku);
    eanSet.add(ean);
  });

  res.json({ rows: rows.length, errors });
});

app.get('/api/mapeos', async (req, res) => {
  const mappings = await readJson(CONFIG_PATH, {});
  res.json(mappings);
});

app.post('/api/imagenes/:marketplace/:sku/:ean', async (req, res) => {
  const { marketplace, sku, ean } = req.params;
  if (!MARKETPLACES.includes(marketplace)) return res.status(400).json({ message: 'Marketplace inválido' });

  const { fileName = 'main.jpg', contentBase64 = '' } = req.body;
  if (!contentBase64) {
    return res.status(400).json({ message: 'Enviar imagen en base64 en contentBase64' });
  }

  const originalDir = path.join(__dirname, 'storage', 'originals', sku, ean);
  const renditionDir = path.join(__dirname, 'storage', 'renditions', marketplace, sku, ean);
  await fsp.mkdir(originalDir, { recursive: true });
  await fsp.mkdir(renditionDir, { recursive: true });

  const raw = Buffer.from(contentBase64, 'base64');
  const originalPath = path.join(originalDir, fileName);
  const renditionPath = path.join(renditionDir, `${sku}_${ean}_MAIN.jpg`);
  await fsp.writeFile(originalPath, raw);
  await fsp.writeFile(renditionPath, raw);

  res.json({ originalPath, renditionPath, note: 'Rendition copiada; integrar sharp para resize automático en entorno con dependencia habilitada.' });
});

app.get('/api/qa/reporte', async (req, res) => {
  const products = await readJson(DATA_PATH, []);
  const rows = [];
  products.forEach((product) => {
    const { errors, warnings } = validateVariant(product);
    errors.forEach((error) => rows.push({ SKU: product.sku, EAN: product.ean, Marketplace: 'ALL', Campo: 'general', Tipo: 'Error', Descripcion: error }));
    warnings.forEach((warning) => rows.push({ SKU: product.sku, EAN: product.ean, Marketplace: 'ALL', Campo: 'general', Tipo: 'Warning', Descripcion: warning }));
  });

  const csv = toCsv(rows);
  const filePath = path.join(__dirname, 'exports', 'Reporte_QA.xlsx');
  await fsp.writeFile(filePath, csv);

  res.download(filePath);
});

app.post('/api/exportar', async (req, res) => {
  const { marketplaces = [], filters = {} } = req.body;
  const selected = marketplaces.filter((m) => MARKETPLACES.includes(m));
  if (!selected.length) return res.status(400).json({ message: 'Selecciona al menos un marketplace válido' });

  const products = applyFilter(await readJson(DATA_PATH, []), filters);
  const exportRoot = path.join(__dirname, 'exports', `${Date.now()}`);
  await fsp.mkdir(exportRoot, { recursive: true });

  for (const marketplace of selected) {
    const folder = path.join(exportRoot, marketplace);
    await fsp.mkdir(folder, { recursive: true });
    const rows = products.map((p) => ({
      SKU: p.sku,
      EAN: p.ean,
      Marca: p.brand,
      Modelo: p.model,
      Titulo: `${p.brand || ''} ${p.model || ''}`.trim(),
      Descripcion: p.description || ''
    }));
    await fsp.writeFile(path.join(folder, `${marketplace}.xlsx`), toCsv(rows));
  }

  res.json({ message: 'Exportación generada', folder: exportRoot });
});

ensureDirectories().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor PIM corriendo en http://localhost:${PORT}`);
  });
});
