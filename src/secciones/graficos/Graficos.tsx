// En el teléfono, Skia está desde el arranque. En la web, Graficos.web.tsx carga CanvasKit antes.

export {
  BalanceSkia as Balance, HipnogramaSkia as Hipnograma, LineaSkia as Linea, MesSkia as MesDeCielos, MiniCieloSkia as MiniCielo, type CeldaDelMes, type PuntoDeLinea,
} from './GraficosSkia';
