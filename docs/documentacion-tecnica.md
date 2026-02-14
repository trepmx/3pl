# Documentación técnica

## Sidebar funcional cubierta en backend
1. **Dashboard**: `GET /api/dashboard`
2. **Productos**: `GET /api/productos`, `POST /api/productos`, `GET /api/productos/:sku/:ean`
3. **Importar**: `POST /api/importar/validar`
4. **Mapeos**: `GET /api/mapeos`
5. **Catálogos**: `data/catalogs.json` para normalización
6. **QA**: `GET /api/qa/reporte`
7. **Pendientes de mapeo**: campo `pendingMappings` por producto
8. **Exportar**: `POST /api/exportar`
9. **Historial/Imports**: modelo `ImportHistory` en Prisma
10. **Configuración**: `config/marketplace-mappings.json`

## Consideraciones de implementación
- **Identificador**: se maneja SKU + EAN por variante.
- **Validación**:
  - SKU/EAN requeridos.
  - Imagen principal requerida.
  - Fondo blanco como warning si no está confirmado.
- **Normalización**: lookup por atributo+marketplace en `catalogs.json`.
- **Exportación**: archivos con extensión `.xlsx` (contenido CSV para ambiente mínimo).

## Deuda técnica identificada
- Integrar parser/escritor XLSX real (ej. `xlsx` o `exceljs`) en entorno con acceso a registry.
- Integrar redimensionado real con `sharp` para renditions por marketplace.
- Migrar persistencia de JSON local a PostgreSQL con Prisma client.
