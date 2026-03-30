# 🔄 Diagrama de Flujo - Sistema de Saldo a Favor

## Flujo 1: Registrar Pago con Excedente

```
┌─────────────────────────────────────────────────────────────────┐
│ INICIO: Usuario registra pago de $100 para factura de $30      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ ¿Pago > Balance?     │
              │ ($100 > $30)         │
              └──────┬───────────────┘
                     │ SÍ
                     ▼
         ┌───────────────────────────┐
         │ Aplicar $30 a factura     │
         │ actual                    │
         │ ✅ Factura PAGADA         │
         └───────────┬───────────────┘
                     │
                     │ Excedente: $70
                     ▼
         ┌───────────────────────────┐
         │ ¿Hay más facturas         │
         │ pendientes?               │
         └──────┬──────────┬─────────┘
                │ SÍ       │ NO
                ▼          ▼
    ┌─────────────────┐   ┌─────────────────────┐
    │ Pagar facturas  │   │ Guardar como        │
    │ pendientes      │   │ SALDO A FAVOR       │
    │ (orden: fecha)  │   │ en cliente          │
    └────────┬────────┘   │ credit_balance      │
             │            └─────────┬───────────┘
             │ Sobra: $20           │
             └────────┬─────────────┘
                      ▼
          ┌───────────────────────────┐
          │ Actualizar saldo a favor  │
          │ del cliente: +$20         │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ Mostrar notificación:     │
          │ • Pago: $100              │
          │ • Factura actual: $30     │
          │ • Otras facturas: $50     │
          │ • Saldo a favor: $20      │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ FIN: Cliente tiene $20    │
          │ de saldo a favor          │
          └───────────────────────────┘
```

---

## Flujo 2: Crear Factura con Saldo a Favor

```
┌─────────────────────────────────────────────────────────────────┐
│ INICIO: Usuario crea factura de $30 para cliente               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Obtener datos del    │
              │ cliente              │
              └──────┬───────────────┘
                     │
                     ▼
              ┌──────────────────────┐
              │ ¿Cliente tiene       │
              │ saldo a favor?       │
              │ credit_balance > 0   │
              └──────┬───────────────┘
                     │ SÍ
                     │ Saldo: $50
                     ▼
         ┌───────────────────────────┐
         │ ¿Saldo ≥ Factura?         │
         │ ($50 ≥ $30)               │
         └──────┬──────────┬─────────┘
                │ SÍ       │ NO
                │          │
                ▼          ▼
    ┌─────────────────┐   ┌─────────────────────┐
    │ Aplicar $30 del │   │ Ejemplo: Saldo $20  │
    │ saldo           │   │ Factura $30         │
    └────────┬────────┘   └─────────┬───────────┘
             │                      │
             ▼                      ▼
    ┌─────────────────┐   ┌─────────────────────┐
    │ Factura:        │   │ Aplicar $20 del     │
    │ • Monto: $30    │   │ saldo               │
    │ • Pagado: $30   │   │                     │
    │ • Balance: $0   │   │ Factura:            │
    │ • Estado: PAID  │   │ • Monto: $30        │
    └────────┬────────┘   │ • Pagado: $20       │
             │            │ • Balance: $10      │
             │            │ • Estado: PENDING   │
             │            └─────────┬───────────┘
             │                      │
             ▼                      ▼
    ┌─────────────────┐   ┌─────────────────────┐
    │ Actualizar      │   │ Actualizar          │
    │ saldo cliente:  │   │ saldo cliente:      │
    │ $50 - $30 = $20 │   │ $20 - $20 = $0      │
    └────────┬────────┘   └─────────┬───────────┘
             │                      │
             └──────────┬───────────┘
                        │
                        ▼
          ┌───────────────────────────┐
          │ Guardar factura en BD     │
          │ con datos actualizados    │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ Mostrar notificación:     │
          │ • Factura creada          │
          │ • Saldo aplicado: $30     │
          │ • Saldo restante: $20     │
          │ • Estado: PAGADA          │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────────┐
          │ FIN: Factura creada y     │
          │ saldo a favor actualizado │
          └───────────────────────────┘
```

---

## Flujo 3: Visualización de Saldo a Favor

```
┌─────────────────────────────────────────────────────────────────┐
│ INICIO: Usuario abre perfil de cliente                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Cargar datos del     │
              │ cliente desde BD     │
              └──────┬───────────────┘
                     │
                     ▼
              ┌──────────────────────┐
              │ ¿credit_balance > 0? │
              └──────┬───────────────┘
                     │ SÍ
                     │ Saldo: $50.00
                     ▼
         ┌───────────────────────────┐
         │ Mostrar Tarjeta Verde:    │
         │                           │
         │ ┌───────────────────────┐ │
         │ │ 💰 Saldo a Favor      │ │
         │ │ $50.00                │ │
         │ │                       │ │
         │ │ ℹ️ Se aplicará        │ │
         │ │   automáticamente a   │ │
         │ │   futuras facturas    │ │
         │ └───────────────────────┘ │
         └───────────┬───────────────┘
                     │
                     ▼
              ┌──────────────────────┐
              │ Cliente puede ver:   │
              │ • Monto disponible   │
              │ • Mensaje claro      │
              │ • Destacado visual   │
              └──────┬───────────────┘
                     │
                     ▼
              ┌──────────────────────┐
              │ FIN: Usuario informado│
              │ sobre saldo a favor  │
              └──────────────────────┘
```

---

## Flujo 4: Historial de Facturación (Fechas Corregidas)

```
┌─────────────────────────────────────────────────────────────────┐
│ INICIO: Usuario ve historial de facturación                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Cargar facturas      │
              │ del cliente          │
              └──────┬───────────────┘
                     │
                     ▼
              ┌──────────────────────┐
              │ Para cada factura:   │
              │ usar invoice.createdAt│
              └──────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │ Formatear fecha:          │
         │ toLocaleDateString('es-ES'│
         │ {                         │
         │   year: 'numeric',        │
         │   month: 'short',         │
         │   day: 'numeric'          │
         │ })                        │
         └───────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │ Mostrar en tabla:         │
         │                           │
         │ Factura | Fecha | ...     │
         │ --------|-------|----     │
         │ abc123  | 10 feb| ...     │
         │ def456  | 5 feb | ...     │
         │ ghi789  | 1 feb | ...     │
         └───────────┬───────────────┘
                     │
                     ▼
              ┌──────────────────────┐
              │ FIN: Fechas mostradas│
              │ correctamente        │
              └──────────────────────┘
```

---

## Estados del Saldo a Favor

```
┌─────────────────────────────────────────────────────────┐
│                    ESTADOS POSIBLES                      │
└─────────────────────────────────────────────────────────┘

Estado 1: Sin Saldo a Favor
┌────────────────────┐
│ credit_balance: $0 │
│                    │
│ 📊 No se muestra   │
│    tarjeta verde   │
└────────────────────┘

Estado 2: Con Saldo a Favor
┌────────────────────┐
│ credit_balance: >0 │
│                    │
│ 💚 Tarjeta verde   │
│    visible         │
│                    │
│ ✅ Se aplica auto  │
│    a facturas      │
└────────────────────┘

Estado 3: Saldo Aplicado Parcialmente
┌────────────────────┐
│ Saldo anterior: $50│
│ Factura: $30       │
│                    │
│ ➡️ Aplicar $30     │
│                    │
│ Saldo nuevo: $20   │
└────────────────────┘

Estado 4: Saldo Aplicado Completamente
┌────────────────────┐
│ Saldo anterior: $30│
│ Factura: $50       │
│                    │
│ ➡️ Aplicar $30     │
│                    │
│ Saldo nuevo: $0    │
│ Balance: $20       │
└────────────────────┘
```

---

## Ciclo de Vida del Saldo a Favor

```
    CREACIÓN
       │
       ▼
┌──────────────────┐
│ Pago excedente   │──── Ejemplo: Paga $100, debe $30
│ registrado       │     → Saldo: +$70
└────────┬─────────┘
         │
         ▼
    ALMACENADO
         │
┌────────┴─────────┐
│ credit_balance   │──── Se guarda en tabla clients
│ en base de datos │     → Persistente
└────────┬─────────┘
         │
         ▼
   VISUALIZADO
         │
┌────────┴─────────┐
│ Tarjeta verde    │──── Se muestra en perfil
│ en perfil        │     → Usuario informado
└────────┬─────────┘
         │
         ▼
    APLICADO
         │
┌────────┴─────────┐
│ Nueva factura    │──── Se descuenta automáticamente
│ creada           │     → Saldo reducido
└────────┬─────────┘
         │
         ▼
   ACTUALIZADO
         │
┌────────┴─────────┐
│ Saldo recalculado│──── Nuevo valor guardado
│ en BD            │     → Ciclo continúa
└────────┬─────────┘
         │
         ▼
    ┌────────┐
    │ REPETIR│
    └────────┘
```

---

## Interacciones del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPONENTES DEL SISTEMA                    │
└─────────────────────────────────────────────────────────────┘

        USUARIO                  FRONTEND              BACKEND
           │                         │                    │
           │  1. Registra pago       │                    │
           ├────────────────────────►│                    │
           │                         │                    │
           │                         │  2. Valida datos   │
           │                         ├───────────────────►│
           │                         │                    │
           │                         │  3. Calcula        │
           │                         │     excedente      │
           │                         │◄───────────────────┤
           │                         │                    │
           │                         │  4. Paga factura   │
           │                         ├───────────────────►│
           │                         │                    │
           │                         │  5. Guarda saldo   │
           │                         │     a favor        │
           │                         │◄───────────────────┤
           │                         │                    │
           │  6. Muestra             │                    │
           │     confirmación        │                    │
           │◄────────────────────────┤                    │
           │                         │                    │
           │  7. Abre perfil         │                    │
           ├────────────────────────►│                    │
           │                         │                    │
           │                         │  8. Carga cliente  │
           │                         │     con saldo      │
           │                         ├───────────────────►│
           │                         │                    │
           │                         │  9. Devuelve datos │
           │                         │     + credit_balance│
           │                         │◄───────────────────┤
           │                         │                    │
           │  10. Muestra            │                    │
           │      tarjeta verde      │                    │
           │◄────────────────────────┤                    │
           │                         │                    │
```

---

## Diagrama de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                      BASE DE DATOS                          │
└─────────────────────────────────────────────────────────────┘

Tabla: clients
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ id           │ name         │ monthly_fee  │credit_balance│
├──────────────┼──────────────┼──────────────┼──────────────┤
│ uuid-1234    │ Juan Pérez   │ 30.00        │ 50.00        │ ←─┐
│ uuid-5678    │ María García │ 50.00        │ 0.00         │   │
│ uuid-9012    │ Pedro López  │ 40.00        │ 25.00        │   │
└──────────────┴──────────────┴──────────────┴──────────────┘   │
                                                                 │
                                                                 │
Tabla: invoices                                                  │
┌──────────────┬──────────────┬──────┬───────┬─────────┬───────┤
│ id           │ client_id    │amount│balance│am_paid  │status │
├──────────────┼──────────────┼──────┼───────┼─────────┼───────┤
│ inv-001      │ uuid-1234 ───┼─────►│ 30.00 │ 0.00    │ 30.00 │paid  │
│ inv-002      │ uuid-1234    │ 40.00│ 40.00 │ 0.00    │pending│
│ inv-003      │ uuid-5678    │ 50.00│ 20.00 │ 30.00   │pending│
└──────────────┴──────────────┴──────┴───────┴─────────┴───────┘

Relación:
- invoices.client_id → clients.id
- clients.credit_balance: Saldo a favor acumulado
- invoices.balance: Saldo pendiente de la factura
- invoices.amount_paid: Monto ya pagado de la factura
```

---

## Leyenda

```
Símbolos Usados en los Diagramas:

│  = Flujo vertical
├─ = Bifurcación
▼  = Dirección del flujo
┌─ = Inicio de bloque
└─ = Fin de bloque
✅ = Acción exitosa
💰 = Dinero/Saldo
💚 = Saldo a favor (positivo)
ℹ️  = Información
➡️  = Aplicación/Transformación
📊 = Datos/Estadísticas
```

---

**Nota**: Estos diagramas muestran el flujo lógico del sistema de saldo a favor. Para implementación técnica detallada, consulta el archivo `CAMBIOS_IMPLEMENTADOS.md`.
