// Los días son claves «AAAA-MM-DD» en la hora local del teléfono en el momento en que pasa cada
// cosa: si viajás, el día corta en tu hora, y lo que ya estaba anotado queda en el día en que se
// anotó. Las cuentas entre claves se hacen en UTC, así ninguna zona horaria las corre.

export type ClaveDia = string;
/** 0 es domingo, como Date.getDay(). */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** De lunes a domingo: el orden en que se muestra la semana. */
export const SEMANA: DiaSemana[] = [1, 2, 3, 4, 5, 6, 0];

const UN_DIA = 86_400_000;
const dos = (n: number) => String(n).padStart(2, '0');

/** El día de un instante en una zona horaria o, sin zona, en la del teléfono. */
export function claveDelDia(instante: Date, zona?: string): ClaveDia {
  if (!zona) return `${instante.getFullYear()}-${dos(instante.getMonth() + 1)}-${dos(instante.getDate())}`;
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instante);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${parte('year')}-${parte('month')}-${parte('day')}`;
}

function enUTC(clave: ClaveDia): Date {
  const [anio, mes, dia] = clave.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

const aClave = (fecha: Date): ClaveDia => fecha.toISOString().slice(0, 10);

export function diaDeLaSemana(clave: ClaveDia): DiaSemana {
  return enUTC(clave).getUTCDay() as DiaSemana;
}

export function sumarDias(clave: ClaveDia, dias: number): ClaveDia {
  return aClave(new Date(enUTC(clave).getTime() + dias * UN_DIA));
}

export function diasEntre(desde: ClaveDia, hasta: ClaveDia): number {
  return Math.round((enUTC(hasta).getTime() - enUTC(desde).getTime()) / UN_DIA);
}

/** El lunes de la semana de ese día. */
export function lunesDe(clave: ClaveDia): ClaveDia {
  return sumarDias(clave, -((diaDeLaSemana(clave) + 6) % 7));
}

/** El mes empieza en 0, como Date.getMonth(). */
export function partesDe(clave: ClaveDia) {
  const [anio, mes, dia] = clave.split('-').map(Number);
  return { anio, mes: mes - 1, dia, diaSemana: diaDeLaSemana(clave) };
}

// ------------------------------------------------------------ el día que empieza al despertarse
// D32 (lo pediste el 29/10/2026): el día no cambia a la medianoche sino a la hora que elijas (las 4
// de fábrica), así quien cena o se acuesta tarde lo anota en su día y no en el siguiente.

/** A qué hora empieza el día, en minutos desde la medianoche: de fábrica, las 4. */
export const CORTE_DE_FABRICA = 4 * 60;
/** Las horas que se pueden elegir: de la medianoche (como antes) a las 6. */
export const CORTES = [0, 60, 120, 180, 240, 300, 360] as const;

/** El minuto del reloj (de 0 a 1439) de un instante, en una zona horaria o, sin zona, en la del teléfono. */
function minutoDelReloj(instante: Date, zona?: string): number {
  if (!zona) return instante.getHours() * 60 + instante.getMinutes();
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: zona, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(instante);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  return (parte('hour') % 24) * 60 + parte('minute');
}

/**
 * El día de un instante con el corte: a las 2 de la mañana, con el corte a las 4, todavía es ayer.
 * Con el corte en 0, el día del calendario.
 */
export function diaLogico(instante: Date, corte: number, zona?: string): ClaveDia {
  const dia = claveDelDia(instante, zona);
  return corte > 0 && minutoDelReloj(instante, zona) < corte ? sumarDias(dia, -1) : dia;
}

/**
 * Los minutos de un instante en la cuenta de un día, desde su medianoche: la cena de las 0:30 del día
 * siguiente es la 1470 de su día. Así lo de después de la medianoche queda al final, no al principio.
 */
export function minutosEnElDia(instante: Date, dia: ClaveDia): number {
  return minutoDelReloj(instante) + diasEntre(dia, claveDelDia(instante)) * 1440;
}

/** Cuánto falta para la próxima vez que empieza un día (el corte, en la hora del teléfono). */
export function msHastaElCorte(ahora: Date, corte: number): number {
  const siguiente = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, corte);
  if (siguiente.getTime() <= ahora.getTime()) siguiente.setTime(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, corte).getTime());
  return siguiente.getTime() - ahora.getTime();
}
