// `types/`: Para centralizar todas las definiciones de tipos e
// interfaces de TypeScript que se comparten en la aplicación. Esto
// evita la duplicación y facilita la gestión de los tipos.

export interface EventType {
  id: number;
  name: string;
  description: string;
  color: string;
}