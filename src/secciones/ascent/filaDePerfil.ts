// La fila de Ascent en Perfil › Conexiones, como en la galería: vinculada, con quién y desde
// cuándo, y desvincular; sin vincular, lleva a la sección de Ascent, donde se vincula.

import { Alert } from 'react-native';

import { deAscent, useAscent } from '@/almacen/ascent';
import { claveDelDia } from '@/dominio/fechas';
import { t } from '@/textos';
import { avisar } from '../comida/registro';
import { fechaDiaMes } from '../comida/datos';
import { abrirAscent } from './abrir';

export type FilaDeAscent = { clave: string; titulo: string; valor: string; tipo: 'ok' | 'accion'; alTocar: () => void };

function desvincular() {
  Alert.alert(t('ascent.perfil.desvincularTitulo'), t('ascent.perfil.desvincularTexto'), [
    { text: t('comun.cancelar'), style: 'cancel' },
    {
      text: t('ascent.perfil.desvincular'),
      style: 'destructive',
      onPress: () => {
        deAscent().desvincular().then(() => avisar(t('ascent.perfil.hecho')), () => avisar(t('ascent.perfil.error')));
      },
    },
  ]);
}

export function useFilaDeAscent(): FilaDeAscent {
  const { vinculo } = useAscent();
  if (!vinculo.vinculada) return { clave: 'ascent', titulo: t('perfil.ascent'), valor: t('perfil.vincular'), tipo: 'accion', alTocar: abrirAscent };
  const usuario = vinculo.nombre ? `@${vinculo.nombre.replace(/^@/, '')}` : null;
  const fecha = fechaDiaMes(claveDelDia(vinculo.desde ? new Date(vinculo.desde) : new Date()));
  return {
    clave: 'ascent', titulo: t('perfil.ascent'), valor: usuario ?? t('perfil.vinculada'), tipo: 'ok',
    alTocar: () => Alert.alert(t('perfil.ascent'), usuario ? t('ascent.perfil.vinculada', { usuario, fecha }) : t('ascent.perfil.vinculadaSinNombre', { fecha }), [
      { text: t('ascent.perfil.ver'), onPress: abrirAscent },
      { text: t('ascent.perfil.desvincular'), style: 'destructive', onPress: desvincular },
      { text: t('comun.cancelar'), style: 'cancel' },
    ]),
  };
}
