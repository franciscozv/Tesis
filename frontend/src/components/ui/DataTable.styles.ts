import { themeColors } from "~/utils/themeColors";

export const tableStyles = {
  container: {
    overflowX: "auto" as const,
    backgroundColor: themeColors.surface,
    border: `1px solid ${themeColors.outlineVariant}`,
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  
  table: {
    width: "100%" as const,
    tableLayout: "fixed" as const,
  },
  
  tableHead: {
    backgroundColor: themeColors.surfaceVariant,
  },
  
  headerCell: {
    position: "relative" as const,
    backgroundColor: themeColors.surfaceVariant,
    color: themeColors.onSurfaceVariant,
    fontWeight: 'bold' as const,
    borderBottom: `2px solid ${themeColors.outline}`,
    padding: '12px 16px',
  },
  
  headerContent: {
    cursor: "pointer" as const,
    position: "relative" as const,
    background: themeColors.surfaceVariant,
    color: themeColors.onSurfaceVariant,
    fontWeight: 'bold' as const,
    padding: '4px 0',
  },
  
  bodyCell: {
    position: "relative" as const,
    color: themeColors.onSurface,
    borderBottom: `1px solid ${themeColors.outlineVariant}`,
    padding: '12px 16px',
  },
  
  rowEven: {
    backgroundColor: themeColors.surface,
  },
  
  rowOdd: {
    backgroundColor: themeColors.surfaceContainer,
  },
  
  rowHover: {
    backgroundColor: themeColors.surfaceContainerHigh,
    transition: 'background-color 0.2s ease',
  },
  
  columnResizer: {
    position: "absolute" as const,
    right: 0,
    top: 0,
    height: "100%",
    width: "3px",
    cursor: "col-resize" as const,
    userSelect: "none" as const,
    touchAction: "none" as const,
  },
  
  columnResizerActive: {
    background: themeColors.primary.main,
  },
  
  columnResizerInactive: {
    background: themeColors.outlineVariant,
  },
  
  toolbar: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "1rem",
    marginBottom: "1rem",
    padding: "1rem",
    backgroundColor: themeColors.surfaceContainer,
    borderRadius: '8px',
    border: `1px solid ${themeColors.outlineVariant}`,
  },
  
  pagination: {
    display: "flex" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginTop: "1rem",
    gap: "1rem",
    padding: "1rem",
    backgroundColor: themeColors.surfaceContainer,
    borderRadius: '8px',
    border: `1px solid ${themeColors.outlineVariant}`,
  },
  
  paginationText: {
    margin: "0 1rem",
    color: themeColors.onSurface,
    fontWeight: 'medium' as const,
  },
  
  paginationNumber: {
    color: themeColors.primary.main,
    fontWeight: 'bold' as const,
  },
  
  noData: {
    textAlign: "center" as const,
    margin: "2rem 0",
    color: themeColors.onSurfaceVariant,
    padding: "2rem",
    backgroundColor: themeColors.surfaceContainer,
    borderRadius: '8px',
    border: `1px solid ${themeColors.outlineVariant}`,
  },
  
  filterPopover: {
    padding: 16,
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 4,
    backgroundColor: themeColors.surface,
    borderRadius: '8px',
  },
  
  searchInput: {
    width: "350px",
    backgroundColor: themeColors.surface,
    border: `1px solid ${themeColors.outlineVariant}`,
    borderRadius: '4px',
    padding: '8px 12px',
    color: themeColors.onSurface,
    '&:focus': {
      borderColor: themeColors.primary.main,
      outline: 'none',
    },
  },
  
  button: {
    backgroundColor: themeColors.primary.main,
    color: themeColors.primary.onPrimary,
    border: `1px solid ${themeColors.primary.main}`,
    borderRadius: '4px',
    padding: '8px 16px',
    fontWeight: 'medium' as const,
    cursor: 'pointer' as const,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: themeColors.primary.dark,
    },
    '&:disabled': {
      backgroundColor: themeColors.surfaceVariant,
      color: themeColors.onSurfaceVariant,
      borderColor: themeColors.outlineVariant,
      cursor: 'not-allowed' as const,
    },
  },
  
  select: {
    backgroundColor: themeColors.surface,
    border: `1px solid ${themeColors.outlineVariant}`,
    borderRadius: '4px',
    color: themeColors.onSurface,
    padding: '8px 12px',
    minWidth: '120px',
  },
}; 