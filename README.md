# Sistema de Identificación APS (Atención Primaria en Salud) 🏥

El **Sistema de Identificación APS** es una plataforma integral desarrollada para la recolección, tabulación y análisis epidemiológico de datos demográficos y de salud en microterritorios, siguiendo rigurosamente los lineamientos del Ministerio de Salud (Colombia).

La aplicación cuenta con un levantamiento de información de campo estructurado en 5 pasos jerárquicos y un panel de control con métricas analíticas e integraciones avanzadas de bases de datos.

---

## 🌟 Características Principales

### 📋 Formulario de Caracterización (Ficha de Hogar MoH)
Un Wizard inteligente segmentado en 5 pasos que agiliza el trabajo de campo:
1. **Paso 1 - Info General**: Control de territorio, fechas, ubicación GPS, responsable/EPS.
2. **Paso 2 - Vivienda**: Componente estructural, vectores ambientales, y zoonosis.
3. **Paso 3 - Familia**: Composición, puntuación dinámica del APGAR familiar, escala de Zarit condicional, Ecomapa y factores de vulnerabilidad.
4. **Paso 4 - Integrantes**: Gestión dinámica de miembros del hogar (Cálculo automático de edades, ciclos de vida y etnia controlada).
5. **Paso 5 - Salud**: Perfil exhaustivo antropométrico, factores biomédicos transmisibles/crónicos y esquema de remisión.

### 🛡️ Dashboard Administrativo y Control de Accesos (RBAC)
- **Role-Based Access Control jerárquico**: Modelos de restricción (`SUPER_ADMIN`, `ADMIN`, `OPERADOR`) bloqueando rutas e impidiendo manipulaciones.
- **Gráficos Analíticos**: Panel en tiempo real soportado por Recharts:
  - Pirámide Poblacional de Género
  - Mapa de Dispersión por Entidad Territorial
  - Tarjetas de Riesgo Vital Crítico (Primera Infancia, Gestantes y 3era Edad).
- **Control de Fichas (Admin Base)**: Búsquedas eficientes por Cédula o número de hogar y descarga PDF.
- **Gestión de Personal**: Altas y Bajas restrictivas operando de forma cifrada.

---

## 🚀 Arquitectura Tecnológica (Tech Stack)

* **Frontend**: Next.js 15 (App Router, Turbopack) + React 18 + Tailwind CSS.
* **Componentes**: Lucide React + Recharts + React Hook Form + Zod (Validaciones continuas).
* **Backend y Base de Datos**: 
  - Prisma ORM para modelado relacional riguroso e integridad transaccional (OnDelete Cascade).
  - Integración nativa a **Supabase (PostgreSQL)**.
* **Autenticación (Auth)**: Supabase Authentication Server-Side para Tokens seguros JWT sin exposición de sesiones. Gestión de creación asíncrona usando `SUPABASE_SERVICE_ROLE_KEY`.

---

## 🏗️ Requisitos e Instalación Local

Antes de empezar, necesitarás tener instalado **Node.js (18 o superior)** y configurar un proyecto en **Supabase**.

1. **Clonar proyecto e Instalar Dependencias**
```bash
git clone https://github.com/tu_usuario/formulario-identificacion-aps.git
cd identificacion-aps
npm install
```

2. **Variables de Entorno (`.env`)**
Configura tu cadena de conexión directa PostgreSQL hacia Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<TU-PROYECTO>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...

# Cadenas hacia Supabase (Transaction Mode & Direct Mode)
DATABASE_URL="postgresql://postgres.[PROYECTO]:[PASSWORD]@aws-0-...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROYECTO]:[PASSWORD]@aws-0-...:5432/postgres"

# Master Key - Obligatorio para crear cuentas via Backend
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

3. **Sincronización del Eschema Prisma (Push)**
```bash
npx prisma db push
```

4. **Ejecutar Seed / Poblado del Super Administrador**
Para habilitar el acceso al panel, crea obligatoriamente la cuenta raíz:
```bash
npx ts-node prisma/seed.ts
```

5. **Iniciar Servidor De Desarrollo**
```bash
npm run dev
```
Navega a `http://localhost:3000`. Acceso Administrativo oculto en Sidebar inferior o `/login`.

---

## 📃 Licencia / Atribuciones
Desplegado y empaquetado como Solución de Software de Código Cerrado o Corporativo (Dependiendo de la licencia aplicable para el propietario actual). Formateado e instruido según lineamientos del Ministerio de Salud Nacional.
