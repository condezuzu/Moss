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

/** Cuánto falta para la medianoche del teléfono: ahí cambia el día con la app abierta. */
export function msHastaMedianoche(ahora: Date): number {
  const medianoche = new Date(ahora);
  medianoche.setHours(24, 0, 0, 0);
  return medianoche.getTime() - ahora.getTime();
}
