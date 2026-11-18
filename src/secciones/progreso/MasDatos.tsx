// «Más datos», plegado abajo de Progreso (galeria/src/progreso.js; lo pediste el 2/11/2026: que esté, sin
// llenar la pantalla): semana a semana, las medidas con su línea chiquita y el gasto con el balance.

import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ComidaDelDia } from '@/dominio/control';
import { largoEn, type Sistema } from '@/dominio/cantidades';
import { cambioDe, cinturaAltura, claseDeCintura, SITIOS } from '@/dominio/cuerpo';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { conSigno, fechaDiaMes, fechaLarga, numero } from '../comida/datos';
import { Balance, Barras, Chispa, Columnas } from '../graficos/Graficos';
import type { Persona } from '../persona';
import { Aparece, BotonChico, Carta, Cifra, ComoSeCalcula, Nota, Parrafo } from '../tarjetas';
import { Flecha } from './Plan';
import { conSignoFijo, fijo, type U } from './unidades';

/** La fila que despliega lo de abajo. */
export function MasDatos({ abierto, alTocar, children }: { abierto: boolean; alTocar: () => void; children: ReactNode }) {
  return (
    <View style={s.mas}>
      <Pressable onPress={alTocar} style={({ pressed }) => [s.masFila, pressed && { opacity: 0.75 }]} accessibilityRole="button" accessibilityState={{ expanded: abierto }}>
        <View style={s.masTextos}>
          <Text style={s.masTitulo}>{t('progreso.masDatos.titulo')}</Text>
          <Text style={s.masSub}>{t('progreso.masDatos.sub')}</Text>
        </View>
        <Flecha abierta={abierto} grados={180} tam={14} color="rgba(239, 230, 207, 0.45)" />
      </Pressable>
      {abierto && <Aparece>{children}</Aparece>}
    </View>
  );
}

// ------------------------------------------------------------------ semana a semana
const SEMANAS = 6;

const Valores = ({ valores, eje }: { valores: (string | null)[]; eje?: boolean }) => (
  <View style={[s.valores, eje && s.valoresEje]}>
    {valores.map((v, i) => (
      <Text key={i} style={[s.valor, eje && s.valorEje, v === null && s.valorTenue]} maxFontSizeMultiplier={1.2} numberOfLines={1}>{v ?? '—'}</Text>
    ))}
  </View>
);

/** Las últimas seis semanas: cuánto cambió la tendencia y lo que comió en promedio, contra la meta. */
export function Semanas({ p, hoy, comidas, ancho, u, numeros }: { p: Persona; hoy: ClaveDia; comidas: ComidaDelDia[]; ancho: number; u: U; numeros: boolean }) {
  const lista = useMemo(() => {
    const ayer = sumarDias(hoy, -1);
    return Array.from({ length: SEMANAS }, (_, i) => {
      const fin = sumarDias(ayer, -7 * (SEMANAS - 1 - i));
      const inicio = sumarDias(fin, -6);
      const antes = p.tendencia.get(sumarDias(inicio, -1));
      const despues = p.tendencia.get(fin);
      const conComida = comidas.filter((x) => x.kcal > 0 && x.fecha >= inicio && x.fecha <= fin);
      return {
        inicio,
        cambio: antes !== undefined && despues !== undefined ? u.enUnidad(despues - antes) : null,
        // Sin tres días anotados, la semana no cuenta.
        kcal: conComida.length >= 3 ? conComida.reduce((suma, x) => suma + x.kcal, 0) / conComida.length : null,
      };
    });
  }, [p.tendencia, comidas, hoy, u]);
  const meta = p.meta?.kcal ?? null;
  return (
    <Carta titulo={t('progreso.graficos.semanas')}>
      <Text style={s.etiqueta}>{u.texto(t('progreso.graficos.semanasCambio'))}</Text>
      <Barras valores={lista.map((x) => x.cambio)} ancho={ancho} alto={54} />
      <Valores valores={lista.map((x) => (x.cambio === null ? null : conSignoFijo(x.cambio, 1)))} />
      {meta !== null && (
        <>
          <Text style={s.etiqueta}>{t('progreso.graficos.semanasComida')}</Text>
          <Columnas valores={lista.map((x) => x.kcal)} meta={meta} ancho={ancho} alto={54} />
          {numeros && <Valores valores={lista.map((x) => (x.kcal === null ? null : numero(Math.round(x.kcal / 10) * 10)))} />}
        </>
      )}
      <Valores eje valores={lista.map((x) => fechaDiaMes(x.inicio))} />
      <Parrafo chico>{t('progreso.graficos.semanasTexto')}</Parrafo>
    </Carta>
  );
}

// ------------------------------------------------------------------ las medidas
export function LasMedidas({ p, hoy, sistema, alMedir }: { p: Persona; hoy: ClaveDia; sistema: Sistema; alMedir: () => void }) {
  const sitios = SITIOS.filter((x) => p.ultimasMedidas[x] !== undefined);
  const ordenadas = [...p.medidas].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const ultima = ordenadas[ordenadas.length - 1];
  // Con un IMC de 35 o más, la cintura sobre la altura no dice nada más (NICE): no se muestra.
  const conRatio = cinturaAltura(p.ultimasMedidas.cintura, p.perfil.alturaCm);
  const ratio = conRatio !== null && p.pesoHoy !== null && claseDeCintura(conRatio, p.pesoHoy / (p.perfil.alturaCm / 100) ** 2) ? conRatio : null;
  return (
    <Carta titulo={t('progreso.medidas')} derecha={<BotonChico texto={t('progreso.medir')} icono="ruler" alTocar={alMedir} />}>
      {sitios.length ? (
        <View>
          {sitios.map((sitio, i) => {
            const l = largoEn(p.ultimasMedidas[sitio]!, sistema);
            const cambio = cambioDe(p.medidas, sitio, hoy, sumarDias(hoy, -30));
            const c = cambio === null ? null : largoEn(Math.abs(cambio), sistema).valor * Math.sign(cambio);
            const historia = ordenadas.map((m) => m[sitio]).filter((v): v is number => v != null);
            return (
              <View key={sitio} style={[s.fila, i === sitios.length - 1 && s.filaUltima]}>
                <Text style={s.filaNombre}>{t(`cuerpo.sitios.${sitio}`)}</Text>
                <View style={s.chispa}>
                  <Chispa valores={historia} ancho={54} alto={18} />
                </View>
                <Text style={s.filaValor}>{`${numero(l.valor, 1)} ${l.unidad}`}</Text>
                <Text style={[s.filaCambio, c !== null && c < 0 && s.baja, c !== null && c > 0 && s.sube]}>{c === null ? '' : `${conSignoFijo(c, 1)} ${l.unidad}`}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Parrafo>{t('progreso.sinMedidas')}</Parrafo>
      )}
      {ratio !== null && <Parrafo>{t('progreso.cinturaAltura', { n: fijo(ratio, 2) })}</Parrafo>}
      {ultima && <Nota tenue>{t('progreso.medidasDel', { fecha: fechaDiaMes(ultima.fecha) })}</Nota>}
    </Carta>
  );
}

// ------------------------------------------------------------------ el gasto y el balance
export function ElGasto({ p, u, abierto, alAbrir }: { p: Persona; u: U; abierto: boolean; alAbrir: () => void }) {
  if (p.gasto === null) return null;
  const k = p.control?.datos;
  return (
    <Carta titulo={t('progreso.gasto')}>
      <Cifra valor={numero(p.gasto)} texto={t('progreso.kcalPorDia')} />
      <Nota>{p.control ? t('progreso.controlDel', { fecha: fechaLarga(p.control.fecha) }) : t('progreso.gastoInicial')}</Nota>
      <View style={s.balance}>
        <View style={s.balanceTextos}>
          <Text style={s.balanceCifra}>
            {p.balance.promedio === null ? '—' : conSigno(Math.round(p.balance.promedio))}
            <Text style={s.balanceUnidad}>{` ${t('inicio.kcalPorDia')}`}</Text>
          </Text>
          <Text style={s.balanceNota}>{p.balance.dias.length ? t('progreso.balanceTexto', { n: p.balance.dias.length }) : t('progreso.sinBalance')}</Text>
        </View>
        {p.balance.dias.length > 0 && <Balance dias={p.balance.dias} gasto={p.gasto} ancho={150} alto={52} />}
      </View>
      {p.control && k && k.gastoMedido === null && <Parrafo>{t('progreso.controlSinMedir')}</Parrafo>}
      {p.control && k && k.gastoMedido !== null && (
        <>
          <Parrafo>{t('progreso.controlTexto', { gasto: numero(k.gastoMedido), antes: numero(p.control.gastoAntes), ahora: numero(p.gasto) })}</Parrafo>
          <ComoSeCalcula abierto={abierto} alTocar={alAbrir}>
            <Parrafo>
              {t('progreso.comoSeCalculaTexto', { promedio: numero(k.comidaPromedio ?? 0), dias: k.dias ?? 21, cambio: conSignoFijo(u.enUnidad(k.cambioDeTendencia ?? 0), 1), unidad: u.unidad })}
            </Parrafo>
          </ComoSeCalcula>
        </>
      )}
    </Carta>
  );
}

const s = StyleSheet.create({
  mas: { marginTop: 12 },
  masFila: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', backgroundColor: 'rgba(8, 12, 26, 0.5)',
  },
  masTextos: { flex: 1, gap: 4 },
  masTitulo: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  masSub: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.5)' },
  etiqueta: { marginTop: 8, fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.55)' },
  valores: { flexDirection: 'row' },
  valoresEje: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  valor: { flex: 1, textAlign: 'center', fontFamily: letras.numero, fontSize: 11, color: 'rgba(239, 230, 207, 0.75)', fontVariant: ['tabular-nums'] },
  valorEje: { fontFamily: letras.texto, fontSize: 10, color: 'rgba(239, 230, 207, 0.42)' },
  valorTenue: { color: 'rgba(239, 230, 207, 0.3)' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  filaUltima: { borderBottomWidth: 0 },
  filaNombre: { flex: 1, fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  chispa: { width: 54, height: 18 },
  filaValor: { fontFamily: letras.numero, fontSize: 15, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  filaCambio: { width: 64, textAlign: 'right', fontFamily: letras.numero, fontSize: 12, color: 'rgba(239, 230, 207, 0.45)', fontVariant: ['tabular-nums'] },
  baja: { color: colores.salvia },
  sube: { color: colores.oroClaro },
  balance: { marginTop: 8, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  balanceTextos: { flex: 1, gap: 4, minWidth: 0 },
  balanceCifra: { fontFamily: letras.numero, fontSize: 24, color: colores.cifra, fontVariant: ['tabular-nums'] },
  balanceUnidad: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.55)' },
  balanceNota: { fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: 'rgba(239, 230, 207, 0.55)' },
});
