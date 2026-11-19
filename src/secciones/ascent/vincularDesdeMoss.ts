// El botón de vincular de Moss (la sección de Ascent sin vincular y la invitación de Inicio; spec/ascent.md, «Con un
// código»): con la sesión de Ascent en el llavero, la hoja de siempre (dos toques); sin ella, un código de un uso que se
// abre en Ascent, y si al volver quedó vinculada, una vez, «Vinculada con @usuario» con «Listo» y «No fui yo». Sin
// cuenta de Moss, la hoja, que dice que hace falta entrar. La hoja que llega por moss://vincular no pasa por aquí.

import { Alert, Linking } from 'react-native';

import { deAscent } from '@/almacen/ascent';
import { crearCodigoDeVinculo } from '@/lib/ascentRemoto';
import { codigoVencido, confirmarElVinculo, enlaceDeVincular } from '@/lib/codigoDeVinculo';
import { sesionDeAscent, vigente } from '@/lib/llavero';
import { t } from '@/textos';
import { avisar } from '../comida/registro';

/** Cuándo se pidió el último código; null sin ninguno pendiente. */
let pedido: number | null = null;
let dejarDeMirar: (() => void) | null = null;
let enCamino = false;

/** Lo que pase desde ahora ya no es del código: otro toque o la hoja de vincular abierta. */
export function olvidarElCodigo(): void {
  pedido = null;
  dejarDeMirar?.();
  dejarDeMirar = null;
}

function confirmar(nombre: string | null) {
  const usuario = nombre ? `@${nombre.replace(/^@/, '')}` : t('ascent.titulo');
  Alert.alert(t('ascent.codigo.titulo', { usuario }), t('ascent.codigo.texto'), [
    {
      text: t('ascent.codigo.noFuiYo'),
      style: 'destructive',
      onPress: () => {
        deAscent().desvincular().then(() => avisar(t('ascent.codigo.deshecho')), () => avisar(t('ascent.perfil.error')));
      },
    },
    { text: t('comun.listo'), style: 'cancel' },
  ]);
}

// El almacén de Ascent revisa el vínculo cada vez que Moss vuelve a primer plano: aquí se mira si pasó a vinculada.
function mirarElVinculo() {
  const a = deAscent();
  let antes = a.estado().vinculo.vinculada;
  const quitar = a.suscribir(() => {
    const { vinculo } = a.estado();
    const ahora = Date.now();
    const toca = confirmarElVinculo({ pedido, ahora, antes, vinculada: vinculo.vinculada });
    antes = vinculo.vinculada;
    if (toca) {
      olvidarElCodigo();
      confirmar(vinculo.nombre);
    } else if (codigoVencido(pedido, ahora)) olvidarElCodigo();
  });
  dejarDeMirar = () => {
    quitar();
  };
}

/** `abrirHoja` abre la hoja de vincular de siempre. */
export async function vincularDesdeMoss(abrirHoja: () => void): Promise<void> {
  if (enCamino) return;
  olvidarElCodigo();
  if (!deAscent().estado().conCuenta) return abrirHoja();
  enCamino = true;
  try {
    const s = await sesionDeAscent();
    if (s && vigente(s)) return abrirHoja();
    let codigo: string | null;
    try {
      codigo = await crearCodigoDeVinculo();
    } catch {
      avisar(t('ascent.vincularHoja.errores.red'));
      return;
    }
    // Sin sesión de Moss: la hoja lo dice.
    if (!codigo) return abrirHoja();
    pedido = Date.now();
    mirarElVinculo();
    await Linking.openURL(enlaceDeVincular(codigo)).catch(() => {
      olvidarElCodigo();
      avisar(t('ascent.vincularHoja.errores.red'));
    });
  } finally {
    enCamino = false;
  }
}
