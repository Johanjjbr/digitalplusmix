# 🚀 Guía de Configuración de Edge Functions en Supabase

## ⚡ Problema: El Frontend No Se Conecta con la Base de Datos

Si creaste las tablas en Supabase pero el frontend no guarda los datos, es porque **falta desplegar las Edge Functions**.

Las Edge Functions son el "backend" que conecta tu frontend con la base de datos de Supabase.

---

## 📋 Solución Rápida (3 Opciones)

### ✅ OPCIÓN 1: Desplegar Edge Functions Manualmente (Recomendado)

#### Paso 1: Instalar Supabase CLI

**En Windows:**
```bash
# Usando Chocolatey
choco install supabase

# O usando Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**En macOS:**
```bash
brew install supabase/tap/supabase
```

**En Linux:**
```bash
brew install supabase/tap/supabase
```

#### Paso 2: Login en Supabase CLI

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte. Copia el token de acceso que te muestra.

#### Paso 3: Listar tus Proyectos

```bash
supabase projects list
```

Copia el **Project ID** de tu proyecto (algo como `abcdefghijklmnop`).

#### Paso 4: Vincular tu Proyecto Local

```bash
# Navega a la carpeta de tu proyecto
cd ruta/a/tu/proyecto

# Vincula el proyecto (reemplaza con tu Project ID)
supabase link --project-ref TU_PROJECT_ID
```

#### Paso 5: Desplegar la Edge Function

```bash
supabase functions deploy make-server-5522dc1e
```

Si todo salió bien, verás:
```
Deployed Function make-server-5522dc1e version xxx
```

#### Paso 6: Verificar que Funciona

Abre tu navegador y ve a:
```
https://TU_PROJECT_ID.supabase.co/functions/v1/make-server-5522dc1e/clients
```

Deberías ver algo como:
```json
{"clients": []}
```

¡Listo! Ahora tu frontend se conectará con la base de datos.

---

### ✅ OPCIÓN 2: Copiar y Pegar en Supabase Dashboard

Si no puedes instalar el CLI, puedes crear la función directamente desde el dashboard:

#### Paso 1: Ir a Edge Functions

1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. En el menú lateral, haz clic en **"Edge Functions"**
3. Haz clic en **"Create a new function"**

#### Paso 2: Configurar la Función

- **Name**: `make-server-5522dc1e`
- **Method**: Deja en blanco (manejará todos los métodos)

#### Paso 3: Copiar el Código

Copia TODO el contenido del archivo `/supabase/functions/make-server-5522dc1e/index.ts` y pégalo en el editor.

#### Paso 4: Deploy

Haz clic en **"Deploy function"**

---

### ✅ OPCIÓN 3: Usar la API Directa de Supabase (Más Simple)

**Alternativa sin Edge Functions**: Modificar el código para usar directamente la API de Supabase.

Esta opción es más simple pero menos escalable. ¿Quieres que te ayude a implementar esta alternativa?

---

## 🧪 Probar que Todo Funciona

### Prueba 1: Desde el Navegador

Abre tu aplicación y:
1. Ve a la página de **"Clientes"**
2. Haz clic en **"Agregar Cliente"**
3. Llena el formulario y guarda
4. Ve a Supabase → **Table Editor** → **clients**
5. Deberías ver el nuevo cliente

### Prueba 2: Desde la Consola

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Verificar que las variables de entorno están configuradas
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Deberías ver la URL de tu proyecto y `true` para la key.

---

## 🔧 Solución de Problemas

### Error: "supabase: command not found"

**Solución**: No instalaste correctamente el CLI. Sigue los pasos de instalación según tu sistema operativo.

### Error: "Invalid API key"

**Solución**: 
1. Verifica que las variables de entorno estén configuradas
2. En Figma Make, ve a la configuración de Supabase
3. Vuelve a conectar tu proyecto

### Error: "Function not found"

**Solución**: La función no se desplegó correctamente. Intenta:
```bash
supabase functions deploy make-server-5522dc1e --no-verify-jwt
```

### Error: "Cross-origin request blocked"

**Solución**: Las políticas CORS ya están configuradas en la función. Si persiste:
1. Ve a Supabase → **Settings** → **API**
2. Verifica que tu dominio esté en la lista de orígenes permitidos

---

## 📊 Verificar el Estado de las Edge Functions

### Ver Logs de la Función

```bash
# Ver logs en tiempo real
supabase functions serve make-server-5522dc1e
```

O desde el Dashboard:
1. Ve a **Edge Functions**
2. Selecciona `make-server-5522dc1e`
3. Ve a la pestaña **"Logs"**

### Ver Invocaciones

En el Dashboard de Supabase:
1. **Edge Functions** → `make-server-5522dc1e`
2. Pestaña **"Invocations"**
3. Verás todas las llamadas a la API

---

## 🎯 Checklist de Verificación

Después de desplegar, verifica que:

- [ ] ✅ Las tablas existen en Supabase (Table Editor)
- [ ] ✅ La Edge Function está desplegada (Edge Functions dashboard)
- [ ] ✅ Las variables de entorno están configuradas
- [ ] ✅ Puedes crear un cliente desde el frontend
- [ ] ✅ El cliente aparece en la tabla de Supabase
- [ ] ✅ Puedes editar y eliminar clientes
- [ ] ✅ Puedes crear planes
- [ ] ✅ Puedes crear facturas

---

## 💡 Comandos Útiles de Supabase CLI

```bash
# Ver todos los proyectos
supabase projects list

# Ver todas las funciones desplegadas
supabase functions list

# Ver logs de una función
supabase functions serve make-server-5522dc1e

# Eliminar una función
supabase functions delete make-server-5522dc1e

# Actualizar una función
supabase functions deploy make-server-5522dc1e

# Probar una función localmente
supabase functions serve
```

---

## 🚀 Próximos Pasos

Una vez que las Edge Functions funcionen:

1. **Crear datos de prueba**: Usa el frontend para crear clientes, planes y facturas
2. **Verificar en Supabase**: Confirma que los datos se guardan correctamente
3. **Configurar backups**: En Supabase → Database → Backups
4. **Desplegar a producción**: Sigue la guía en `DEPLOYMENT_GUIDE.md`

---

## ❓ ¿Prefieres la Opción 3 (Sin Edge Functions)?

Si no quieres lidiar con Edge Functions, puedo modificar el código para que use directamente la API de Supabase. Esto es:

**Ventajas:**
- ✅ Más simple, sin CLI
- ✅ Menos pasos de configuración
- ✅ Funciona inmediatamente

**Desventajas:**
- ❌ Menos control sobre las operaciones
- ❌ Más difícil de escalar
- ❌ Lógica de negocio en el frontend

¿Quieres que implemente esta alternativa?
