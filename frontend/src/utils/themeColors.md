# Colores del Material Theme Builder

Este archivo contiene los colores generados por Material Theme Builder y las utilidades para usarlos en la aplicación.

## 🎨 Esquema de Colores

Los colores están basados en el esquema "light" del Material Theme Builder con el color semilla `#FFDE3F`.

### Colores Principales

- **Primary**: `#6D5E0F` (Amarillo dorado)
- **Secondary**: `#665E40` (Marrón cálido)
- **Tertiary**: `#43664E` (Verde bosque)
- **Error**: `#BA1A1A` (Rojo)

### Colores de Superficie

- **Background**: `#FFF9EE` (Crema claro)
- **Surface**: `#FFF9EE` (Crema claro)
- **Surface Variant**: `#EAE2D0` (Crema medio)

## 🛠️ Utilidades Disponibles

### `getContrastColor(backgroundColor: string): string`

Calcula automáticamente el color de texto apropiado (blanco o negro) basado en el color de fondo.

```typescript
import { getContrastColor } from "~/utils/themeColors";

const textColor = getContrastColor("#FFDE3F"); // Retorna "#000000" o "#FFFFFF"
```

### `getEventTypeColor(colorHex: string)`

Retorna un objeto con el color de fondo y el color de texto apropiado para chips de tipos de evento.

```typescript
import { getEventTypeColor } from "~/utils/themeColors";

const colors = getEventTypeColor("#FFDE3F");
// Retorna: { backgroundColor: "#FFDE3F", color: "#000000" }
```

### `getStateColors`

Objeto con colores predefinidos para diferentes estados de eventos:

```typescript
import { getStateColors } from "~/utils/themeColors";

// Estados disponibles:
// - PENDING: Gris neutro
// - APPROVED: Verde claro
// - REJECTED: Rojo claro
// - CANCELLED: Gris claro
```

### `getPriorityColors`

Objeto con colores predefinidos para diferentes niveles de prioridad:

```typescript
import { getPriorityColors } from "~/utils/themeColors";

// Prioridades disponibles:
// - LOW: Verde claro
// - MEDIUM: Marrón claro
// - HIGH: Rojo claro
```

## 📝 Ejemplos de Uso

### Chip de Tipo de Evento

```typescript
<Chip
  label={eventType.name}
  size="small"
  sx={{
    backgroundColor: eventType.color,
    color: getContrastColor(eventType.color),
    fontWeight: 'bold',
    borderRadius: '8px',
  }}
/>
```

### Chip de Estado

```typescript
<Chip
  label="Aprobado"
  size="small"
  sx={{
    backgroundColor: getStateColors.APPROVED.backgroundColor,
    color: getStateColors.APPROVED.color,
    fontWeight: 'bold',
    borderRadius: '8px',
  }}
/>
```

### Botón con Colores del Tema

```typescript
<Button
  variant="contained"
  sx={{
    backgroundColor: themeColors.primary.main,
    color: themeColors.primary.onPrimary,
    '&:hover': {
      backgroundColor: themeColors.primary.dark,
    },
  }}
>
  Botón
</Button>
```

## 🎯 Mejores Prácticas

1. **Siempre usar `getContrastColor()`** para texto sobre fondos de colores dinámicos
2. **Usar `borderRadius: '8px'`** para chips y botones para consistencia
3. **Usar `fontWeight: 'bold'`** para chips importantes
4. **Preferir colores del tema** sobre colores hardcodeados
5. **Usar las utilidades predefinidas** para estados y prioridades

## 🔄 Actualización de Colores

Para actualizar los colores del tema:

1. Exportar nuevo esquema desde Material Theme Builder
2. Actualizar `themeColors.ts` con los nuevos valores
3. Actualizar `theme.ts` con los colores principales
4. Probar la aplicación para asegurar contraste adecuado 