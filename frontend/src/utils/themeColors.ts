export const themeColors = {
  primary: {
    main: "#5A98D0",
    light: "#8DBADD",
    dark: "#2E4C68",
    onPrimary: "#FFFFFF",
    onPrimaryContainer: "#FFFFFF",
  },
  secondary: {
    main: "#98D05A",
    light: "#B5E28C",
    dark: "#74A53C",
    onSecondary: "#FFFFFF",
    onSecondaryContainer: "#FFFFFF",
  },
  tertiary: {
    main: "#D05A98",
    light: "#E38ACF",
    dark: "#A53C74",
    onTertiary: "#FFFFFF",
    onTertiaryContainer: "#FFFFFF",
  },
  error: {
    main: "#B3261E",
    light: "#F9DEDC",
    dark: "#410E0B",
    onError: "#FFFFFF",
    onErrorContainer: "#410E0B",
  },
  background: "#FDFBF7",
  onBackground: "#333333",
  surface: "#FDFBF7",
  onSurface: "#333333",
  surfaceVariant: "#E7E0EC",
  onSurfaceVariant: "#49454F",
  outline: "#CCCCCC",
  outlineVariant: "#E7E0EC",
  shadow: "#000000",
  scrim: "#000000",
  inverseSurface: "#333333",
  inverseOnSurface: "#FDFBF7",
  inversePrimary: "#5A98D0",
  primaryFixed: "#8DBADD",
  onPrimaryFixed: "#2E4C68",
  primaryFixedDim: "#5A98D0",
  onPrimaryFixedVariant: "#2E4C68",
  secondaryFixed: "#B5E28C",
  onSecondaryFixed: "#74A53C",
  secondaryFixedDim: "#98D05A",
  onSecondaryFixedVariant: "#74A53C",
  tertiaryFixed: "#E38ACF",
  onTertiaryFixed: "#A53C74",
  tertiaryFixedDim: "#D05A98",
  onTertiaryFixedVariant: "#A53C74",
  surfaceDim: "#E0D9CC",
  surfaceBright: "#FFF9EE",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#FEFBFF",
  surfaceContainer: "#FEFBFF",
  surfaceContainerHigh: "#FEFBFF",
  surfaceContainerHighest: "#FEFBFF",
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