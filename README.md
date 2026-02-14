# PIM Ligero para Listings Multi‑Marketplace (México)

Implementación base de un sistema interno para creación de listings (1 usuario) con foco en variantes por SKU+EAN y exportación por marketplace.

## Incluye
- Arquitectura y diseño técnico base (`docs/arquitectura-pim.md`).
- Modelo de datos completo en Prisma (`prisma/schema.prisma`).
- Configuración de mapeos por marketplace (`config/marketplace-mappings.json`).
- API para:
  - Catálogo maestro y filtros.
  - Validación de importaciones Excel.
  - Normalización por catálogo.
  - QA y reporte `Reporte_QA.xlsx`.
  - Exportación por marketplace a `.xlsx` y `.zip`.
  - Pipeline de imágenes con `sharp`.

## Requisitos
```bash
npm install
```

## Variables de entorno
```dotenv
DATABASE_URL="postgresql://usuario:password@localhost:5432/pim"
PORT=5000
```

## Ejecutar
```bash
npm run dev
```

## Estructura relevante
- `server.js`: API principal.
- `prisma/schema.prisma`: modelo relacional.
- `config/marketplace-mappings.json`: reglas de transformación.
- `data/catalogs.json`: normalización de atributos.
- `docs/arquitectura-pim.md`: arquitectura y flujo.

## Notas
- Esta versión usa archivos JSON locales para ejecución rápida del flujo sin migraciones.
- El modelo Prisma está listo para migrar a PostgreSQL en una siguiente etapa.
