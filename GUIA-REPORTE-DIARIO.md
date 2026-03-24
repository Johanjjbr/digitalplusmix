# 📊 Reporte de Cierre Diario - Guía de Uso

## 🎯 ¿Qué es el Reporte Diario?

El **Reporte de Cierre Diario** es una herramienta completa para generar reportes de ventas y pagos del día. Incluye:

- ✅ Listado detallado de todas las transacciones
- ✅ Información completa de cada cliente
- ✅ Desglose por método de pago (Efectivo, Transferencia, Tarjeta, Punto)
- ✅ Resumen financiero con totales
- ✅ Función de impresión
- ✅ Exportación a Excel (CSV)

---

## 🚀 Acceso Rápido

1. Inicia sesión en el sistema
2. En el menú lateral, haz clic en **"Reporte Diario"** (primer elemento del menú)
3. Por defecto, verás el reporte del día actual

---

## 📋 Características Principales

### 1. **Selector de Fecha**
- Puedes ver reportes de cualquier día
- Usa el selector de fecha para cambiar
- Botón "Hoy" para volver rápidamente al día actual

### 2. **Resumen General (Cards Superiores)**
- **Total Recaudado**: Suma total del día en dinero
- **Total de Transacciones**: Cantidad de pagos registrados
- **Clientes Atendidos**: Número de clientes únicos

### 3. **Desglose por Método de Pago**
Muestra cuánto se recaudó por cada método:
- 💵 **Efectivo** (verde)
- 💳 **Tarjeta** (azul)
- 📲 **Transferencia** (morado)
- 📱 **Punto de Venta** (naranja)
- ⚪ **Otros** (gris)

### 4. **Tabla Detallada de Transacciones**
Para cada pago registrado muestra:
- Número consecutivo
- Nombre del cliente
- Teléfono del cliente
- Descripción del pago (factura)
- Método de pago (badge de color)
- Referencia (número de transferencia, etc.)
- Monto individual
- **TOTAL al final de la tabla**

---

## 🖨️ Imprimir Reporte

1. Haz clic en el botón **"Imprimir"**
2. Se abrirá una vista de impresión profesional con:
   - Encabezado con logo y fecha
   - Resumen general
   - Desglose por método de pago
   - Detalle de todas las transacciones
   - Total destacado
   - Pie de página con fecha y hora de generación

3. Usa la función de impresión de tu navegador para:
   - Imprimir físicamente
   - Guardar como PDF

---

## 📥 Exportar a Excel

1. Haz clic en el botón **"Exportar CSV"**
2. Se descargará un archivo `reporte-diario-YYYY-MM-DD.csv`
3. El archivo incluye:
   - Todos los datos de las transacciones
   - Información completa de clientes
   - Métodos de pago y referencias
   - Fila con el total al final

4. Abre el archivo con:
   - Microsoft Excel
   - Google Sheets
   - LibreOffice Calc
   - Cualquier programa de hojas de cálculo

---

## 💡 Casos de Uso

### Cierre de Caja Diario
1. Al final del día, accede al Reporte Diario
2. Revisa el **Total Recaudado**
3. Compara con el dinero físico en caja
4. Imprime o exporta para archivo

### Contabilidad
1. Exporta el reporte a CSV
2. Importa los datos en tu software contable
3. Usa el desglose por método de pago para conciliación bancaria

### Auditoría
1. Selecciona cualquier fecha del pasado
2. Revisa las transacciones de ese día
3. Verifica nombres, montos y referencias

### Reportes Semanales/Mensuales
1. Exporta los reportes diarios de cada día
2. Consolida los datos en una hoja de cálculo
3. Genera gráficos y análisis

---

## 🔍 Detalles de Cada Transacción

Cada fila de la tabla muestra:

| Campo | Descripción |
|-------|-------------|
| **#** | Número consecutivo del día |
| **Cliente** | Nombre completo del cliente que pagó |
| **Descripción** | Descripción de la factura pagada (ej: "Factura mensual de servicio - 2024-03") |
| **Método** | Forma de pago utilizada (con badge de color) |
| **Referencia** | Número de referencia bancaria o voucher |
| **Monto** | Cantidad pagada en esta transacción (en verde) |

---

## 📊 Interpretación del Reporte

### Ejemplo de Lectura:

```
RESUMEN GENERAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Recaudado:        $5,450.00
Total de Transacciones:  23
Clientes Atendidos:      18
```

**Interpretación:**
- Se recaudaron $5,450 en el día
- Se registraron 23 pagos diferentes
- 18 clientes distintos realizaron pagos
- Algunos clientes pagaron más de una factura

### Desglose por Método:

```
EFECTIVO:       $2,100.00 (10 transacciones)
TRANSFERENCIA:  $2,350.00 (8 transacciones)
TARJETA:        $800.00   (4 transacciones)
PUNTO:          $200.00   (1 transacción)
```

**Interpretación:**
- La mayoría de los clientes pagó en efectivo o transferencia
- El promedio por transacción en efectivo: $210
- El promedio por transacción en transferencia: $293.75

---

## ⚠️ Notas Importantes

### Datos que se Muestran
- ✅ Solo se muestran pagos **completados**
- ✅ Los pagos se filtran por la fecha de registro (`payment_date`)
- ✅ Si un pago se registra hoy pero tiene fecha de ayer, aparece en el reporte de ayer

### Zona Horaria
- Los reportes usan la fecha **local del servidor**
- Asegúrate de que la configuración de fecha del sistema sea correcta

### Permisos
- Todos los usuarios autenticados pueden ver reportes diarios
- No se requieren permisos especiales de administrador

---

## 🛠️ Solución de Problemas

### "No hay transacciones registradas para esta fecha"
- Verifica que sea la fecha correcta
- Asegúrate de que se hayan registrado pagos ese día
- Los pagos deben tener `payment_date` igual a la fecha seleccionada

### El total no coincide
- Verifica que todos los pagos se hayan registrado
- Revisa si hay pagos eliminados o modificados
- Consulta los Logs de Auditoría para ver cambios

### No se puede imprimir
- Permite ventanas emergentes en tu navegador
- Verifica que no haya bloqueadores de pop-ups activos

### El archivo CSV se ve mal
- Asegúrate de abrirlo con un programa de hojas de cálculo
- El archivo está codificado en UTF-8 para soportar caracteres especiales
- En Excel: Datos → Desde Texto/CSV para importar correctamente

---

## 📞 Preguntas Frecuentes

### ¿Puedo ver reportes de meses anteriores?
**Sí**, usa el selector de fecha para elegir cualquier día del pasado.

### ¿Los datos se actualizan en tiempo real?
**Sí**, cada vez que cambias la fecha, se cargan los datos más recientes de la base de datos.

### ¿Puedo modificar un pago desde el reporte?
**No**, este es un reporte de solo lectura. Para modificar pagos, ve a la sección de Facturación o al detalle de la factura específica.

### ¿Cómo genero un reporte mensual?
Actualmente, el reporte es diario. Para un reporte mensual:
1. Exporta cada día del mes a CSV
2. Consolida los archivos en Excel
3. O implementa un reporte mensual personalizado

### ¿Los totales incluyen pagos parciales?
**Sí**, todos los pagos registrados se incluyen, sean parciales o completos.

---

## 🎨 Personalización

Si necesitas personalizar el reporte (ej: agregar logo, cambiar formato), edita:
- **Archivo**: `/src/app/components/DailyReport.tsx`
- **Función de impresión**: `handlePrint()`
- **Función de exportación**: `handleExportCSV()`

---

## ✅ Checklist de Cierre Diario

- [ ] Abrir Reporte Diario
- [ ] Verificar la fecha (debe ser hoy)
- [ ] Revisar el Total Recaudado
- [ ] Comparar con efectivo en caja
- [ ] Verificar transacciones con banco (transferencias)
- [ ] Exportar reporte a CSV
- [ ] Guardar copia del reporte impreso
- [ ] Archivar para contabilidad

---

**¿Necesitas ayuda?** Contacta al administrador del sistema o consulta los Logs de Auditoría para más detalles sobre las transacciones.
