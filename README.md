# 🏢 Digital+ ISP - Dashboard Administrativo

Sistema de gestión completo para proveedores de TV e Internet (ISP) construido con React, TypeScript, Tailwind CSS y Supabase.

## 📌 Estado importante (crítico)

Si ves el error: `credit_balance does not exist`, ve directamente a la sección de **3. Troubleshooting** y ejecuta la solución rápida desde `archives/EJECUTAR_AHORA.txt`.

---

## 📚 Tabla de contenidos

1. [Inicio rápido](#inicio-rápido)
2. [Funcionalidades](#funcionalidades)
3. [Problemas comunes / Troubleshooting](#problemas-comunes--troubleshooting)
4. [Tecnologías y seguridad](#tecnologías-y-seguridad)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Despliegue](#despliegue)
7. [Archivos de referencia](#archivos-de-referencia)
8. [Contribuir](#contribuir)

---

## 🚀 Inicio rápido

### 1. Crear esquema en Supabase

1. Abre [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor** → **New Query**
3. Copia y pega `database-schema-COMPLETO-FINAL.sql`
4. Haz clic en **Run**

### 2. Configura variables de entorno (local)

- Crea archivo `.env` siguiendo `.env.example` (si existe) o la documentación de tu host.
- Valores clave: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 3. Ejecutar la app

- `npm install`
- `npm run dev`
- Abre `http://localhost:5173` (o puerto que indique Vite)

---

## 🎯 Funcionalidades

- Gestión de clientes: listar, filtrar, crear, editar, eliminar
- Gestión de planes: creación, edición, precios, velocidades, plan "popular"
- Facturación: emitir facturas, estados (Pagado, Pendiente, Vencido), filtros por cliente
- Dashboard: métricas de clientes, morosidad, ingresos, gráficos
- Mapa de red y configuración en desarrollo

---

## 🐛 Problemas comunes / Troubleshooting

### 3.1 Error `credit_balance does not exist`

1. Ejecuta SQL en `archives/EJECUTAR_AHORA.txt` (o copia manual desde archivo)
2. Refresca la app
3. Verifica tablas `credit_balance` y `billings` creadas

### 3.2 Error `relation does not exist`

- Asegúrate de haber ejecutado `database-schema-COMPLETO-FINAL.sql` correctamente.
- Revisa en Supabase Table Editor si la tabla existe.

### 3.3 Error `duplicate key value`

- Asegúrate de no crear clientes con emails duplicados.

---

## 💻 Tecnologías y seguridad

- Frontend: React 18 + TypeScript
- UI: Tailwind CSS + shadcn/ui + Lucide React
- Backend: Supabase PostgreSQL (RLS habilitado)
- Autenticación: Supabase Auth (si aplica)
- Notificaciones: Sonner
- Deploy: Vercel / Netlify

### 🔒 Seguridad

- RLS habilitado y políticas según rol
- Validación frontend
- No almacenar datos sensibles sin controles extra

---

## 🗂️ Estructura del proyecto

```
/ (raíz)
  ├─ src/
  │   ├─ app/
  │   │   ├─ App.tsx
  │   │   ├─ routes.ts
  │   │   └─ components/ ...
  │   ├─ lib/ (supabase.ts, api.ts, initData.ts)
  │   └─ styles/
  ├─ database-schema-COMPLETO-FINAL.sql
  ├─ CONEXION_RAPIDA.md
  ├─ DEPLOYMENT_GUIDE.md
  ├─ SUPABASE_SETUP.md
  ├─ README.md
  ├─ archives/ ... (documentación histórica y scripts SQL)
  └─ ...
```

---

## 🚀 Despliegue

1. Configura variables de entorno en su plataforma (Vercel/Netlify).
2. `npm run build`
3. Despliega usando tu proveedor (ver `DEPLOYMENT_GUIDE.md`).

---

## 📁 Archivos de referencia

- `archives/database-schema.sql`, `archives/database-schema-v2.sql`, ...
- `archives/README_COMPLETO.md`, `archives/SOLUCION_RAPIDA.md`, ...
- `archives/EJECUTAR_AHORA.txt`, `archives/RESUMEN_EJECUTIVO.md`.

> Si necesitas una copia histórica completa usa los archivos dentro de `archives/`.

---

## 🤝 Contribuir

- Usa PRs y describe cambios claros
- Abre issues para bugs o mejoras
- Mantén la estructura de releases y seguimiento en `CHANGELOG` si decides usarlo.

---

## 📌 Nota final

- Aquí se conserva lo esencial para arranque rápido y mantenimiento.
- Todo contenido extra/antiguo está en `archives/`.
