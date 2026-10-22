// En el teléfono, Skia está desde el arranque. En la web hay que cargar CanvasKit antes
// (PantallaDelCielo.web.tsx). En los dos, el cielo espera a que el almacén abra sus datos, que
// tarda unos milisegundos: mientras, sigue la pantalla de arranque.

import { useAlmacenListo } from '@/almacen';
import Cielo, { type PropsDelCielo } from './Cielo';

export default function PantallaDelCielo(props: PropsDelCielo) {
  return useAlmacenListo() ? <Cielo {...props} /> : null;
}
