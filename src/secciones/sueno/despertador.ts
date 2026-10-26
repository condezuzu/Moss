// El despertador de Moss (app-intents/Despertador.swift, con AlarmKit, iOS 26 o más): una sola alarma,
// la que pone la persona en Sueño; nunca una «hora de dormir». Sin el módulo (la web, un iPhone con
// un iOS anterior al 26) no está y la fila no aparece. Al pararla, el sistema avisa a Moss como un
// Atajo (despertadorParado).

import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import type { DiaSemana } from '@/dominio/fechas';

export type PermisoDeAlarmas = 'noDisponible' | 'sinPedir' | 'denegado' | 'permitido';
/** La hora y los minutos, y los días (0 es domingo); sin días suena una sola vez. */
export type Alarma = { hora: number; minuto: number; dias: DiaSemana[] };

type Modulo = {
  disponible(): boolean;
  permiso(): Promise<PermisoDeAlarmas>;
  pedirPermiso(): Promise<PermisoDeAlarmas>;
  programada(): Promise<Alarma | null>;
  programar(hora: number, minuto: number, dias: number[], titulo: string, detener: string): Promise<string>;
  cancelar(): Promise<boolean>;
};

const modulo = Platform.OS === 'ios' ? requireOptionalNativeModule<Modulo>('Despertador') : null;

export const hayDespertador = (): boolean => !!modulo?.disponible();
export const permisoDeAlarmas = async (): Promise<PermisoDeAlarmas> => (modulo ? modulo.permiso() : 'noDisponible');
export const pedirAlarmas = async (): Promise<PermisoDeAlarmas> => (modulo ? modulo.pedirPermiso() : 'noDisponible');
/** La que está puesta en el sistema: es la verdad (una alarma de una vez, después de sonar, ya no está). */
export const alarmaPuesta = async (): Promise<Alarma | null> => (modulo ? modulo.programada() : null);

/** Pone la alarma (reemplaza la que había). `titulo` y `detener` son los textos de la alarma, ya traducidos. */
export async function ponerAlarma(a: Alarma, titulo: string, detener: string): Promise<void> {
  if (!modulo) return;
  await modulo.programar(a.hora, a.minuto, [...a.dias].sort((x, y) => x - y), titulo, detener);
}

export async function sacarAlarma(): Promise<void> {
  if (modulo) await modulo.cancelar();
}
