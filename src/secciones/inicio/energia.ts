// Tu energía de ahora con lo guardado (spec/entreno.md 5.13): arma la entrada de la regla (energiaDeAhora, en
// src/dominio/energia.ts) como la galería (galeria/src/inicio.js, energiaDeHoy) y dice la frase de arriba.
// Moss sola habla de tu día: sin Ascent no hay sesión, ni músculos, ni «para entrenar». La usan el botón de Inicio
// y la tarjeta de Sueño.

import type { Estado } from '@/almacen/almacen';
import { comidasHabituales } from '@/dominio/alrededorDelEntreno';
import { horaDeReloj, horasDeSueno } from '@/dominio/avisos';
import { CON_HORA, type Comida } from '@/dominio/comidas';
import { kcalDelDia } from '@/dominio/cuestionario';
import { energiaDeAhora, energiaDeEstosDias, type DiaDeEnergia, type EnergiaDeAhora } from '@/dominio/energia';
import { diaDeLaSemana, minutosEnElDia, sumarDias } from '@/dominio/fechas';
import { REPARTO } from '@/dominio/plan';
import { delDia, vigentes } from '@/dominio/registros';
import { estadoDeLaNoche, nochesCortasSeguidas } from '@/dominio/rendimiento';
import { senalDeEnergia } from '@/dominio/segunElDeporte';
import { deudaDeSueno, juicioDeLaDeuda, ultimasNoches } from '@/dominio/sueno';
import { suenoParaAvisos } from '@/recordatorios/programar';
import { t } from '@/textos';
import { horasDeComer, metaDelDia } from '../comida/datos';
import type { Persona, Sueno } from '../persona';
import { entradaDelDeporte, entrenoDicho } from './paraHoy';

export type ComidaDelDia = { comida: Comida; hora: number; anotada: boolean };

export type EnergiaDeHoy = {
  /** null: todavía no hay con qué decirla (ni el sueño ni la comida de estos días). */
  dia: EnergiaDeAhora | null;
  /** En minutos del día de Moss. */
  ahora: number;
  /** De despertarte a ir a la cama, para la tira; sin saberlo, null. */
  despertar: number | null;
  cama: number | null;
  comidas: ComidaDelDia[];
};

/** Las kcal de cada día: lo comido, lo de entrenar según Perfil › Entrenamiento, cuántas comidas y la meta. */
function diasAnotados(e: Estado, pesoKg: number, dias: number): DiaDeEnergia[] {
  const comidos = vigentes(e.registros.values()).filter((r) => !r.planificado);
  const entreno = entrenoDicho(e.entreno);
  return Array.from({ length: dias }, (_, i) => sumarDias(e.hoy, -(i + 1))).flatMap((dia) => {
    const lista = comidos.filter((r) => r.dia === dia);
    if (!lista.length) return [];
    return [{
      dia,
      kcal: lista.reduce((s, r) => s + r.valores.kcal, 0),
      entreno: kcalDelDia(entreno, diaDeLaSemana(dia), pesoKg),
      anotadas: new Set(lista.map((r) => r.comida)).size,
      meta: metaDelDia(e, dia)?.kcal,
    }];
  });
}

/** Tu energía de ahora. Con la persona de ejemplo, null: no es tuya. */
export function energiaDeHoy(e: Estado, p: Persona, s: Sueno, ahora: Date): EnergiaDeHoy | null {
  if (p.deEjemplo || !e.perfil) return null;
  const pesoKg = p.pesoHoy ?? e.pesos[e.pesos.length - 1]?.kg;
  if (!pesoKg) return null;
  const minutos = minutosEnElDia(ahora, e.hoy);
  const habituales = comidasHabituales(e.registros.values(), e.hoy);
  const deporte = entradaDelDeporte(e);
  const dosSemanas = diasAnotados(e, pesoKg, 14);
  const senal = deporte ? senalDeEnergia({ ...deporte, energia: { objetivo: e.perfil.objetivo, tendencia: p.tendencia, dias: dosSemanas, masaMagra: null } }) : null;
  const deEstosDias = energiaDeEstosDias({
    hoy: e.hoy, sexo: e.perfil.sexo, objetivo: e.perfil.objetivo, pesoKg, alturaCm: e.perfil.alturaCm,
    grasaPct: p.grasa ? p.grasa.estimado : null, dias: dosSemanas, comidasDeSiempre: habituales, senal: senal?.senal ?? null,
  });
  // El sueño: la noche de anoche, si es tuya; las dos de las tres últimas cortas; y la deuda de las dos semanas.
  const noches = s.deEjemplo ? [] : ultimasNoches(s.noches, e.hoy, 14);
  const anoche = noches[noches.length - 1];
  const deuda = s.deEjemplo ? null : deudaDeSueno(noches, s.necesidad);
  const sueno = s.deEjemplo ? null : {
    anoche: anoche ? estadoDeLaNoche({ dormido: anoche.dormido, necesidad: s.necesidad, despertoAntes: null }) : null,
    seguidas: nochesCortasSeguidas(noches.slice(-3).flatMap((n) => (n ? [n.dormido] : []))),
    deuda: deuda ? juicioDeLaDeuda(deuda) : null,
  };
  const paraAvisos = suenoParaAvisos(e);
  const horas = paraAvisos ? horasDeSueno(e.hoy, paraAvisos) : null;
  const horaDe = horasDeComer(e);
  const anotadoHoy = delDia(e.registros.values(), e.hoy).filter((r) => !r.planificado);
  const comidas = CON_HORA.filter((c) => REPARTO[habituales][c] != null).map((c) => ({ comida: c, hora: horaDe(c), anotada: anotadoHoy.some((r) => r.comida === c) }));
  const meta = metaDelDia(e, e.hoy);
  const ultima = anotadoHoy.length ? Math.max(...anotadoHoy.map((r) => minutosEnElDia(new Date(r.momento), e.hoy))) : null;
  const dia = energiaDeAhora({
    deEstosDias,
    sueno,
    musculos: null,
    entrenaHoy: false,
    ahora: minutos,
    despertar: horas?.despertar ?? null,
    cama: horas?.acostarse ?? null,
    sesion: null,
    hoy: meta ? { meta: meta.kcal, comido: anotadoHoy.reduce((suma, r) => suma + r.valores.kcal, 0), comidas: comidas.map((c) => ({ hora: c.hora, parte: REPARTO[habituales][c.comida] ?? 0 })), ultima } : null,
  });
  return { dia, ahora: minutos, despertar: horas?.despertar ?? null, cama: horas?.acostarse ?? null, comidas };
}

export type EstadoDelBoton = 'baja' | 'suficiente' | 'alta' | 'sinDatos';
export const estadoDe = (x: EnergiaDeHoy): EstadoDelBoton => x.dia?.estado ?? 'sinDatos';

/** Cuándo es, para la etiqueta: el momento, o la parte del día. */
export function cuandoEs(x: EnergiaDeHoy): string {
  const m = x.dia?.momento;
  const clave = m === 'recienDespierto' ? 'alDespertar' : m === 'antesDeEntrenar' ? 'antes' : m === 'despuesDeEntrenar' ? 'despues' : m === 'noche' ? 'noche'
    : x.ahora < 12 * 60 ? 'manana' : x.ahora < 20 * 60 ? 'tarde' : 'noche';
  return t(`inicio.energia.cuando.${clave}`);
}

const CLAVE_DEL_MOMENTO = { recienDespierto: 'manana', antesDeEntrenar: 'antes', despuesDeEntrenar: 'despues', noche: 'noche', dia: 'dia' } as const;

/** La frase de arriba: cómo está, según el momento; alta, por qué. */
export function fraseDeEnergia(x: EnergiaDeHoy): string {
  const en = x.dia;
  if (!en) return t('inicio.energia.texto.sinDatos');
  const momento = CLAVE_DEL_MOMENTO[en.momento];
  const hora = en.sesion ? horaDeReloj(en.sesion.inicio) : '';
  const cama = x.cama !== null ? horaDeReloj(x.cama) : '';
  if (en.estado !== 'alta') {
    if (momento === 'dia') return t(en.estado === 'suficiente' && en.entrenaHoy ? 'inicio.energia.texto.suficienteEntrena' : `inicio.energia.texto.${en.estado}`);
    return t(`inicio.energia.momento.${momento}.${en.estado}`, { hora, cama });
  }
  const sueno = en.deuda === 'muyBien' || en.deuda === 'bien' ? en.deuda : 'soloAnoche';
  const razones = { comida: t(`inicio.energia.razon.comida.${en.comida?.como ?? 'alcanza'}`), sueno: t(`inicio.energia.razon.sueno.${sueno}`), hora };
  if (momento === 'dia') return t(en.entrenaHoy ? 'inicio.energia.texto.altaEntrena' : 'inicio.energia.texto.alta', razones);
  return t(`inicio.energia.momento.${momento}.alta`, razones);
}

// «Más en Sueño»: Inicio pide la tarjeta de la energía y Sueño, al llegar, baja hasta ella.
const pedidos = new Set<() => void>();
/** Para Sueño: lo que hace cuando Inicio pide ver la energía. Devuelve con qué dejar de escuchar. */
export function alPedirEnergia(hacer: () => void): () => void {
  pedidos.add(hacer);
  return () => {
    pedidos.delete(hacer);
  };
}
export function pedirEnergia() {
  pedidos.forEach((hacer) => hacer());
}
