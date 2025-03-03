# Sistema 3PL para Ecommerce 🚀

Este es un sistema diseñado para gestionar pedidos, inventarios y logística 3PL en múltiples marketplaces.

## 📌 Funcionalidades Principales:
- Gestión de inventarios y productos.
- Conexión con Amazon, Mercado Libre, Shopify, Liverpool y Claro Shop.
- Generación de guías de envío y monitoreo de pedidos.
- Personalización de costos de almacenaje y picking.

## 🔧 Instalación y Configuración:
1. Clonar el repositorio:

   ```bash
   git clone https://github.com/trepmx/3pl.git
   cd 3pl
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Configurar la base de datos en el archivo .env:

   ```plaintext
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/3pl_db"
   JWT_SECRET="clave_secreta_segura"
   PORT=5000
   ```

4. Crear las tablas con Prisma:

   ```bash
   npx prisma migrate dev --name init
   ```

5. Iniciar el servidor:

   ```bash
   npm run dev
   ```

## 📞 Soporte
Para cualquier duda, contáctanos. 
