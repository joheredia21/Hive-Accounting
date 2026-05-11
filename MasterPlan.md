# Plan Maestro: Herramienta de Contabilidad Hive

## Visión General del Proyecto
Este plan describe la implementación de Hive Accounting como una herramienta de contabilidad basada en blockchain para el ecosistema Hive. La aplicación rastreará transacciones Hive, saldos de tokens (HIVE, HBD y tokens de Hive Engine), y proporcionará capacidades de reporte financiero.

## Arquitectura Siguiendo las Directrices de CLAUDE.md

### Cumplimiento del Estilo de Código
- **Componentes**: Componentes funcionales con hooks (src/features y src/components/common)
- **Nomenclatura**:
  - Componentes: PascalCase (ejemplo: TransactionList.js)
  - Funciones/variables: camelCase (ejemplo: calculateBalance())
  - Archivos: kebab-case (ejemplo: transaction-utils.js)
- **Tipos**:
  - Interfaces para formas de objetos (src/types/)
  - Tipos para uniones/alias (src/types/)

### Jerarquía de Gestión de Estado
1. Estado local (useState/useReducer) para datos específicos de componentes
2. API de Contexto para estado compartido (ejemplo: autenticación, conexión blockchain)
3. Almacén Global (por implementar si se necesita para estados complejos)

### Cumplimiento de la Estructura de Archivos
```
src/
├── features/           # Módulos específicos de funcionalidad (transacciones, reportes, etc.)
├── components/         # Componentes de UI reutilizables
│   └── common/         # Componentes compartidos
├── types/              # Interfaces y tipos de TypeScript
└── utils/              # Funciones de utilidad (formateadores, calculadores, ayudantes)
```

## Características Principales de Contabilidad para Hive

### 1. Rastreo de Transacciones
- Monitorear transferencias entrantes y salientes de Hive
- Rastrear transacciones de tokens de Hive Engine
- Registrar retiros de vesting y delegaciones
- Categorizar transacciones (ingreso, gasto, transferencia)

### 2. Gestión de Saldos
- Seguimiento en tiempo real de saldos HIVE/HBD
- Gestión de cartera de tokens de Hive Engine
- Cálculos de saldo de vesting
- Monitoreo de saldo de ahorros

### 3. Reportes Financieros
- Estados de Ganancias y Pérdidas
- Balances generales
- Estados de flujo de efectivo
- Reportes con rango de fechas personalizable

### 4. Herramientas de Preparación Fiscal
- Seguimiento de base de costo para tokens
- Cálculos de ganancias/pérdidas de capital
- Funcionalidad de exportación para software fiscal

## Plan de Implementación Usando la Habilidad Hive Master

### Fase 1: Conexión Blockchain y Obtención Básica de Datos
- Usar la habilidad hive-master para conexiones API de blockchain Hive
- Implementar obtención de historial de transacciones (consultar operations.md)
- Crear tipos para objetos de transacción (src/types/transaction.ts)
- Construir funciones de utilidad para análisis de transacciones (src/utils/transaction-utils.js)

### Fase 2: Gestión de Saldo y Cartera de Tokens
- Implementar rastreo de tokens de Hive Engine (referencia hive-engine.md)
- Crear utilidades de cálculo de saldo
- Desarrollar integración de precios de tokens (usando APIs de mercado)
- Construir componentes de valoración de cartera

### Fase 3: Desarrollo del Motor de Contabilidad
- Implementar principios de contabilidad de doble entrada para blockchain
- Crear sistema de categorización de transacciones
- Desarrollar generadores de estados financieros
- Añadir filtros de fecha de reporte y opciones de exportación

### Fase 4: Interfaz de Usuario y Experiencia
- Panel de control mostrando resumen de cartera
- Tabla de historial de transacciones con filtrado
- Módulo de reporte con visualizaciones gráficas
- Ajustes para visualización de moneda y preferencias fiscales

### Fase 5: Pruebas y Optimización
- Pruebas unitarias para funciones de utilidad y cálculos
- Pruebas de integración para interacciones blockchain
- Optimización de rendimiento para grandes conjuntos de transacciones
- Pruebas de aceptación de usuario con datos de muestra

## Cumplimiento del Flujo de Trabajo de Desarrollo

### Secuencia de Implementación de Funcionalidades
1. **Crear nueva funcionalidad en src/features/**
   - Ejemplo: src/features/transacciones/
   - Ejemplo: src/features/reportes/
   
2. **Implementar componentes compartidos en src/components/common/**
   - Ejemplo: TablaTransacciones, TarjetaSaldo, SelectorFecha
   
3. **Definir tipos en src/types/**
   - Tipos de transacción, interfaces de saldo, formatos de reporte
   
4. **Agregar funciones de utilidad en src/utils/**
   - Formateadores (moneda, fecha), calculadores, ayudantes de API

### Uso de Comandos
- `npm run dev` para servidor de desarrollo
- `npm run build` para construcciones de producción
- `npm run lint` para verificaciones de estilo de código

## Puntos de Integración con la Habilidad Hive Master
- Consultar operations.md para todos los constructores de operaciones blockchain
- Consultar battle-tested.md para patrones listos para producción
- Usar hive-engine.md para operaciones de tokens de capa 2
- Seguir SKILL.md principios básicos para interacciones blockchain seguras

## Criterios de Éxito
- Rastreo preciso de todas las transacciones blockchain de Hive
- Actualizaciones en tiempo real de saldos con <5 segundos de latencia
- Reportes financieros generados que coincidan con cálculos manuales
- UI responsive que funcione en navegadores de escritorio y móvil
- Manejo seguro de claves de usuario (almacenamiento solo del lado cliente)

---
*Este plan sigue las pautas de desarrollo de Hive Accounting descritas en CLAUDE.md y aprovecha la habilidad hive-master para implementaciones específicas de blockchain.*

---

**Nota adicional basada en su descripción del proyecto:**  
Para alinear este plan con su visión específica de usar Keychain como billetera firmante, transmitir JSON a la blockchain para registrar transacciones contables con categorización mediante botones (ej. pago a proveedores), y generar un libro mayor para auditoría, se recomendaría añadir una fase específica para:

- Integración con Keychain para firma de transacciones
- Definición de esquemas JSON para operaciones contables
- Interfaz de usuario con selección de tipo de cuenta contable
- Registro de transacciones en un libro mayor inmutable en la blockchain
- Funcionalidad para emitir pagos y generar comprobantes

Esto podría incorporarse como una extensión de la Fase 3 (Motor de Contabilidad) o como una nueva Fase 6 enfocada en la funcionalidad contable específica que describió.