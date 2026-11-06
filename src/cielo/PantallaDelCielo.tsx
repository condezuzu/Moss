// En el teléfono, Skia está desde el arranque. En la web hay que cargar CanvasKit antes
// (PantallaDelCielo.web.tsx). En los dos, el cielo espera a que el almacén abra sus datos, que
// tarda unos milisegundos, y a la calidad medida en otro arranque: mientras, sigue la pantalla de
// arranque.

import { useAlmacenListo } from '@/almacen';
import Cielo, { type PropsDelCielo } from './Cielo';
import { useCalidadLeida } from './dia';

export default function PantallaDelCielo(props: PropsDelCielo) {
  const almacen = useAlmacenListo();
  const calidad = useCalidadLeida();
  return almacen && calidad ? <Cielo {...props} /> : null;
}
