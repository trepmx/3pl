# Arquitectura PIM Ligero (México)

## 1. Componentes
- **API Node/Express**: catálogo maestro, validación QA, importaciones, exportaciones XLSX y pipeline de imágenes.
- **Persistencia**:
  - Modelo relacional en Prisma/PostgreSQL (`prisma/schema.prisma`).
  - Persistencia local JSON para ejecución rápida (`data/products.json`, `data/catalogs.json`).
- **Configuración de mapeos**: JSON declarativo por marketplace (`config/marketplace-mappings.json`).
- **Storage de imágenes**:
  - Originales: `/storage/originals/{sku}/{ean}/`
  - Renditions: `/storage/renditions/{marketplace}/{sku}/{ean}/`
- **Exportador**:
  - Genera XLSX por marketplace.
  - Empaqueta ZIP final con estructura por canal.

## 2. Flujo funcional
1. **Importar** archivo proveedor.
2. Validar duplicados SKU/EAN y campos obligatorios.
3. Normalizar atributos usando catálogos por marketplace.
4. Cargar/editar producto maestro por variante (1 fila = 1 EAN publicable).
5. Ejecutar QA y generar estados por marketplace.
6. Exportar XLSX/ZIP según filtros.

## 3. Endpoints principales
- `GET /api/dashboard`
- `GET /api/productos`
- `POST /api/productos`
- `GET /api/productos/:sku/:ean`
- `POST /api/importar/validar`
- `GET /api/mapeos`
- `POST /api/imagenes/:marketplace/:sku/:ean`
- `GET /api/qa/reporte`
- `POST /api/exportar`

## 4. Reglas no negociables implementadas
- SKU + EAN obligatorios.
- Una variante publicable por EAN.
- Imagen principal obligatoria para alta de variante.
- Exportación a XLSX.
- Filtros por marca, categoría, estado por marketplace y búsqueda SKU/EAN/modelo.

## 5. Escalabilidad recomendada
- Migrar persistencia JSON a PostgreSQL con Prisma.
- Añadir cola (BullMQ) para procesamiento de imágenes masivo.
- Versionar mapeos por marketplace y fecha de vigencia.
