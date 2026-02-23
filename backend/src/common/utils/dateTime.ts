import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ_CHILE = 'America/Santiago';

/**
 * Parsea fecha (YYYY-MM-DD) y hora_inicio (HH:mm o HH:mm:ss) como hora local de Chile.
 * Retorna un objeto dayjs anclado a la zona America/Santiago.
 */
export function parseActividadInicio(fecha: string, hora_inicio: string, tz = TZ_CHILE): dayjs.Dayjs {
  const hora = hora_inicio.length === 5 ? `${hora_inicio}:00` : hora_inicio;
  return dayjs.tz(`${fecha}T${hora}`, tz);
}

/**
 * Parsea fecha (YYYY-MM-DD) y hora_fin (HH:mm o HH:mm:ss) como hora local de Chile.
 * Retorna un objeto dayjs anclado a la zona America/Santiago.
 */
export function parseActividadFin(fecha: string, hora_fin: string, tz = TZ_CHILE): dayjs.Dayjs {
  const hora = hora_fin.length === 5 ? `${hora_fin}:00` : hora_fin;
  return dayjs.tz(`${fecha}T${hora}`, tz);
}

/**
 * Retorna el instante actual en la zona horaria especificada.
 */
export function nowEnZona(tz = TZ_CHILE): dayjs.Dayjs {
  return dayjs().tz(tz);
}

/**
 * Retorna la fecha de "hoy" en la zona horaria especificada (YYYY-MM-DD).
 */
export function hoyCL(tz = TZ_CHILE): string {
  return dayjs().tz(tz).format('YYYY-MM-DD');
}
