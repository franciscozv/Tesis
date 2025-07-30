// Colores del Material Theme Builder - Esquema Light
export const themeColors = {
  // Colores principales
  primary: {
    main: "#6D5E0F",
    light: "#F8E287",
    dark: "#534600",
    onPrimary: "#FFFFFF",
    onPrimaryContainer: "#534600",
  },
  secondary: {
    main: "#665E40",
    light: "#EEE2BC",
    dark: "#4E472A",
    onSecondary: "#FFFFFF",
    onSecondaryContainer: "#4E472A",
  },
  tertiary: {
    main: "#43664E",
    light: "#C5ECCE",
    dark: "#2C4E38",
    onTertiary: "#FFFFFF",
    onTertiaryContainer: "#2C4E38",
  },
  error: {
    main: "#BA1A1A",
    light: "#FFDAD6",
    dark: "#93000A",
    onError: "#FFFFFF",
    onErrorContainer: "#93000A",
  },
  
  // Colores de superficie
  background: "#FFF9EE",
  onBackground: "#1E1B13",
  surface: "#FFF9EE",
  onSurface: "#1E1B13",
  surfaceVariant: "#EAE2D0",
  onSurfaceVariant: "#4B4739",
  
  // Colores de contorno
  outline: "#7C7767",
  outlineVariant: "#CDC6B4",
  
  // Colores de sombra
  shadow: "#000000",
  scrim: "#000000",
  
  // Colores inversos
  inverseSurface: "#333027",
  inverseOnSurface: "#F7F0E2",
  inversePrimary: "#DBC66E",
  
  // Colores fijos
  primaryFixed: "#F8E287",
  onPrimaryFixed: "#221B00",
  primaryFixedDim: "#DBC66E",
  onPrimaryFixedVariant: "#534600",
  
  secondaryFixed: "#EEE2BC",
  onSecondaryFixed: "#211B04",
  secondaryFixedDim: "#D1C6A1",
  onSecondaryFixedVariant: "#4E472A",
  
  tertiaryFixed: "#C5ECCE",
  onTertiaryFixed: "#00210F",
  tertiaryFixedDim: "#A9D0B3",
  onTertiaryFixedVariant: "#2C4E38",
  
  // Contenedores de superficie
  surfaceDim: "#E0D9CC",
  surfaceBright: "#FFF9EE",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#FAF3E5",
  surfaceContainer: "#F4EDDF",
  surfaceContainerHigh: "#EEE8DA",
  surfaceContainerHighest: "#E8E2D4",
};

// Función para obtener el color de contraste para texto sobre un fondo
export const getContrastColor = (backgroundColor: string): string => {
  // Convertir el color hex a RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calcular la luminancia
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retornar blanco o negro según la luminancia
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Función para obtener el color de un tipo de evento
export const getEventTypeColor = (colorHex: string) => {
  return {
    backgroundColor: colorHex,
    color: getContrastColor(colorHex),
  };
};

// Función para obtener colores de estado
export const getStateColors = {
  PENDING: {
    backgroundColor: themeColors.surfaceVariant,
    color: themeColors.onSurfaceVariant,
  },
  APPROVED: {
    backgroundColor: themeColors.tertiary.light,
    color: themeColors.tertiary.onTertiaryContainer,
  },
  REJECTED: {
    backgroundColor: themeColors.error.light,
    color: themeColors.error.onErrorContainer,
  },
  CANCELLED: {
    backgroundColor: themeColors.outlineVariant,
    color: themeColors.onSurfaceVariant,
  },
};

// Función para obtener colores de prioridad
export const getPriorityColors = {
  LOW: {
    backgroundColor: themeColors.tertiary.light,
    color: themeColors.tertiary.onTertiaryContainer,
  },
  MEDIUM: {
    backgroundColor: themeColors.secondary.light,
    color: themeColors.secondary.onSecondaryContainer,
  },
  HIGH: {
    backgroundColor: themeColors.error.light,
    color: themeColors.error.onErrorContainer,
  },
}; 