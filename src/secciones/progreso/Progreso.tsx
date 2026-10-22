// Progreso, el de la galería (galeria/src/progreso.js; spec/progreso.md): el progreso al objetivo,
// el peso con su tendencia, las medidas, el rango de grasa corporal y el gasto con el balance. Abajo,
// la estrategia (el objetivo con su ritmo, el peso meta y las metas de hoy) y el próximo control con
// el día que se elige. «Metas de hoy» abre las metas: quién las pone, cómo se reparten los macros y
// repartir la semana. Sin datos propios, la persona de ejemplo, con su aviso arriba.

import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { elAlmacen } from '@/almacen';
import { conMayuscula } from '@/comida/buscar';
import { KG_POR_LIBRA, largoEn, pesoCorporalEn, type Sistema } from '@/dominio/cantidades';
import { cambioDe, cinturaAltura, rangoDeGrasa, SITIOS, ultimasMedidas } from '@/dominio/cuerpo';
import { diasEntre, sumarDias, type DiaSemana } from '@/dominio/fechas';
import { ESTILOS, EXTRAS, repartirSemana, RITMOS, type Macros, type Objetivo, type Ritmo } from '@/dominio/metas';
import type { EstadoDelObjetivo } from '@/dominio/progreso';
import { lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { COLOR_DE_MACRO, Icono, MACROS, Punto, type Macro } from '../comida/comunes';
import { conSigno, fechaCorta, fechaDiaMes, fechaLarga, numero, sistemaDe, useEstado } from '../comida/datos';
import { usePersona } from '../ganchos';
import { Balance, Linea } from '../graficos/Graficos';
import type { VistaDelMas } from '../HojaMas';
import type { Persona } from '../persona';
import {
  AvisoDeEjemplo, BotonChico, Cabecera, Camino, Carta, Chip, Cifra, ComoSeCalcula, Dias, Eje, EtiquetaDeGrupo, Nota, Parrafo, Recuadro, SEMANA, Segmento, type TipoDeChip,
} from '../tarjetas';

type Props = { ancho: number; arriba: number; abajo: number; alAbrirMas: (vista: VistaDelMas) => void };

const TIPO_DE_ESTADO: Record<EstadoDelObjetivo, TipoDeChip | undefined> = {
  llegaste: 'bien', enCamino: 'bien', estable: 'bien', despacio: 'atencion', quieto: 'atencion', alReves: 'atencion', seMueve: 'atencion', sinMeta: 'tenue', faltanDatos: 'tenue',
};

/** Los pesos en la unidad de cada uno: con lo redondeado para mostrar y sin redondear para las cuentas. */
function unidades(sistema: Sistema) {
  const unidad = pesoCorporalEn(1, sistema).unidad;
  return {
    unidad,
    peso: (kg: number, decimales = 1) => numero(pesoCorporalEn(kg, sistema).valor, decimales),
    enUnidad: (kg: number) => (sistema === 'imperial' ? kg / KG_POR_LIBRA : kg),
  };
}

export function PaginaDeProgreso({ ancho, arriba, abajo, alAbrirMas }: Props) {
  const [vista, setVista] = useState<'principal' | 'metas'>('principal');
  return (
    <View style={{ width: ancho }}>
      <ScrollView key={vista} contentContainerStyle={{ paddingTop: arriba + 18, paddingHorizontal: 20, paddingBottom: abajo + 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {vista === 'principal' ? <Principal ancho={ancho} alAbrirMas={alAbrirMas} alVerMetas={() => setVista('metas')} /> : <Metas alVolver={() => setVista('principal')} />}
      </ScrollView>
    </View>
  );
}

function Principal({ ancho, alAbrirMas, alVerMetas }: { ancho: number; alAbrirMas: Props['alAbrirMas']; alVerMetas: () => void }) {
  const e = useEstado();
  const p = usePersona();
  const [abierto, setAbierto] = useState<string | null>(null);
  const alternar = (cual: string) => setAbierto((antes) => (antes === cual ? null : cual));
  const u = unidades(sistemaDe(e));
  const interior = ancho - 40 - 34;
  return (
    <>
      <Cabecera fecha={fechaCorta(e.hoy)} titulo={t('progreso.titulo')} />
      {p.deEjemplo && <AvisoDeEjemplo texto={t('progreso.ejemplo')} />}
      <ElObjetivo p={p} hoy={e.hoy} u={u} />
      <ElPeso p={p} u={u} ancho={interior} alRegistrar={() => alAbrirMas('peso')} />
      <LasMedidas p={p} hoy={e.hoy} sistema={sistemaDe(e)} alMedir={() => alAbrirMas('medidas')} />
      <LaGrasa p={p} abierto={abierto === 'grasa'} alAbrir={() => alternar('grasa')} />
      <ElGasto p={p} u={u} abierto={abierto === 'gasto'} alAbrir={() => alternar('gasto')} />
      <Text style={s.seccion}>{t('progreso.estrategia')}</Text>
      <LaEstrategia p={p} u={u} abierto={abierto} alternar={alternar} alVerMetas={alVerMetas} />
      <ElControl p={p} />
    </>
  );
}

type U = ReturnType<typeof unidades>;

// ------------------------------------------------------------------ el objetivo
function ElObjetivo({ p, hoy, u }: { p: Persona; hoy: string; u: U }) {
  const g = p.progreso;
  const metaKg = p.perfil.pesoMeta;
  const objetivo = p.perfil.objetivo;
  const titulo = objetivo === 'mantener'
    ? t('progreso.mantenerEn', { kg: u.peso(p.pesoHoy ?? 0), unidad: u.unidad })
    : metaKg ? t(objetivo === 'bajar' ? 'progreso.objetivoA.bajar' : 'progreso.objetivoA.subir', { kg: u.peso(metaKg, metaKg % 1 ? 1 : 0), unidad: u.unidad }) : t(`progreso.objetivos.${objetivo}`);
  return (
    <Carta titulo={t('progreso.objetivo')} derecha={<Chip texto={t(`progreso.estados.${g.estado}`)} tipo={TIPO_DE_ESTADO[g.estado]} />}>
      <Text style={s.objetivoTitulo}>{titulo}</Text>
      {g.fecha && <Cifra valor={fechaDiaMes(g.fecha)} texto={t('progreso.llegarias')} />}
      {g.hecho !== null && p.pesoInicial !== null && g.peso !== null && metaKg ? (
        <Camino
          hecho={g.hecho}
          etiquetas={[t('progreso.empezaste', { kg: u.peso(p.pesoInicial) }), u.peso(g.peso), t('progreso.meta', { kg: u.peso(metaKg, metaKg % 1 ? 1 : 0) })]}
        />
      ) : null}
      <Parrafo>
        {t(`progreso.textos.${g.estado}`, {
          ritmo: g.ritmo === null ? '' : conSigno(u.enUnidad(g.ritmo), 2), plan: conSigno(u.enUnidad(g.ritmoPlan), 2),
          faltan: g.faltan === null ? '' : numero(u.enUnidad(g.faltan), 1), semanas: g.fecha ? Math.round(diasEntre(hoy, g.fecha) / 7) : '', unidad: u.unidad,
        })}
      </Parrafo>
    </Carta>
  );
}

// ------------------------------------------------------------------ el peso
function ElPeso({ p, u, ancho, alRegistrar }: { p: Persona; u: U; ancho: number; alRegistrar: () => void }) {
  return (
    <Carta titulo={t('progreso.peso')} derecha={<BotonChico texto={t('progreso.registrar')} icono="plus" alTocar={alRegistrar} />}>
      <Cifra valor={p.pesoHoy === null ? '—' : u.peso(p.pesoHoy)} texto={`${u.unidad} · ${t('progreso.tendencia')}`} />
      {p.cambio7 !== null && (
        <Nota>{t('progreso.cambios', { semana: conSigno(u.enUnidad(p.cambio7), 1), mes: p.cambio30 === null ? '—' : conSigno(u.enUnidad(p.cambio30), 1), unidad: u.unidad })}</Nota>
      )}
      <View style={s.grafico}>
        <Linea serie={p.serie} ancho={ancho} alto={92} meta={p.perfil.objetivo !== 'mantener' ? (p.perfil.pesoMeta ?? null) : null} />
      </View>
      <Eje izquierda={fechaDiaMes(p.serieDesde)} derecha={t('progreso.hoy')} />
      <Parrafo chico>{t('progreso.pesoLeyenda')}</Parrafo>
    </Carta>
  );
}

// ------------------------------------------------------------------ las medidas
function LasMedidas({ p, hoy, sistema, alMedir }: { p: Persona; hoy: string; sistema: Sistema; alMedir: () => void }) {
  const sitios = SITIOS.filter((x) => p.ultimasMedidas[x] !== undefined);
  const ultima = p.medidas.reduce<Persona['medidas'][number] | null>((a, m) => (!a || m.fecha > a.fecha ? m : a), null);
  const ratio = cinturaAltura(p.ultimasMedidas.cintura, p.perfil.alturaCm);
  return (
    <Carta titulo={t('progreso.medidas')} derecha={<BotonChico texto={t('progreso.medir')} icono="ruler" alTocar={alMedir} />}>
      {sitios.length ? (
        <View>
          {sitios.map((sitio, i) => {
            const l = largoEn(p.ultimasMedidas[sitio]!, sistema);
            const cambio = cambioDe(p.medidas, sitio, hoy, sumarDias(hoy, -30));
            const c = cambio === null ? null : largoEn(Math.abs(cambio), sistema).valor * Math.sign(cambio);
            return (
              <View key={sitio} style={[s.fila, i === sitios.length - 1 && s.filaUltima]}>
                <Text style={s.filaNombre}>{t(`cuerpo.sitios.${sitio}`)}</Text>
                <Text style={s.filaValor}>{`${numero(l.valor, 1)} ${l.unidad}`}</Text>
                <Text style={[s.filaCambio, c !== null && c < 0 && s.baja, c !== null && c > 0 && s.sube]}>{c === null ? '' : `${conSigno(c, 1)} ${l.unidad}`}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Parrafo>{t('progreso.sinMedidas')}</Parrafo>
      )}
      {ratio !== null && <Parrafo>{t('progreso.cinturaAltura', { n: numero(ratio, 2) })}</Parrafo>}
      {ultima && <Nota tenue>{t('progreso.medidasDel', { fecha: fechaDiaMes(ultima.fecha) })}</Nota>}
    </Carta>
  );
}

// ------------------------------------------------------------------ la grasa corporal
function LaGrasa({ p, abierto, alAbrir }: { p: Persona; abierto: boolean; alAbrir: () => void }) {
  const r = p.grasa;
  // Cómo vino cambiando: el rango de cada vez que se midió.
  const historia = [...p.medidas]
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
    .flatMap((m) => {
      const x = rangoDeGrasa(p.perfil.sexo, p.perfil.alturaCm, ultimasMedidas(p.medidas, m.fecha));
      return x ? [{ fecha: m.fecha, ...x }] : [];
    });
  if (!r && !historia.length) return null;
  return (
    <Carta titulo={t('progreso.grasa')}>
      <Cifra valor={r ? t('cuerpo.rango', { desde: r.desde, hasta: r.hasta }) : '—'} texto={t('cuerpo.estimacion')} />
      <Recuadro>{t('cuerpo.aviso')}</Recuadro>
      {historia.length > 1 && (
        <View style={s.historia}>
          {historia.map((h) => (
            <View key={h.fecha} style={s.historiaChip}>
              <Text style={s.historiaFecha}>{fechaDiaMes(h.fecha)}</Text>
              <Text style={s.historiaRango}>{t('cuerpo.rangoCorto', { desde: h.desde, hasta: h.hasta })}</Text>
            </View>
          ))}
        </View>
      )}
      <ComoSeCalcula abierto={abierto} alTocar={alAbrir}>
        <Parrafo>{t(p.perfil.sexo === 'm' ? 'cuerpo.comoSeEstimaHombre' : 'cuerpo.comoSeEstimaMujer')}</Parrafo>
      </ComoSeCalcula>
    </Carta>
  );
}

// ------------------------------------------------------------------ el gasto y el balance
function ElGasto({ p, u, abierto, alAbrir }: { p: Persona; u: U; abierto: boolean; alAbrir: () => void }) {
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
      {p.control && k && (
        <>
          <Parrafo>{t('progreso.controlTexto', { gasto: numero(k.gastoMedido ?? p.gasto), antes: numero(p.control.gastoAntes), ahora: numero(p.gasto) })}</Parrafo>
          <ComoSeCalcula abierto={abierto} alTocar={alAbrir}>
            <Parrafo>
              {t('progreso.comoSeCalculaTexto', { promedio: numero(k.comidaPromedio ?? 0), dias: k.dias ?? 21, cambio: conSigno(u.enUnidad(k.cambioDeTendencia ?? 0), 1), unidad: u.unidad })}
            </Parrafo>
          </ComoSeCalcula>
        </>
      )}
    </Carta>
  );
}

// ------------------------------------------------------------------ la estrategia
function Fila({ titulo, valor, abierta, alTocar }: { titulo: string; valor: string; abierta?: boolean; alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} style={({ pressed }) => [s.estrategiaFila, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityState={{ expanded: abierta }}>
      <Text style={s.estrategiaTitulo}>{titulo}</Text>
      <Text style={s.estrategiaValor} numberOfLines={1}>{valor}</Text>
      <View style={{ transform: [{ rotate: abierta ? '90deg' : '0deg' }] }}>
        <Icono nombre="chevron.right" tam={13} color="rgba(239, 230, 207, 0.4)" peso="semibold" />
      </View>
    </Pressable>
  );
}

const Eleccion = ({ children }: { children: ReactNode }) => <View style={s.eleccion}>{children}</View>;

function LaEstrategia({ p, u, abierto, alternar, alVerMetas }: { p: Persona; u: U; abierto: string | null; alternar: (cual: string) => void; alVerMetas: () => void }) {
  const perfil = p.perfil;
  const ponerEstrategia = elAlmacen().ponerEstrategia;
  const ritmo = perfil.objetivo === 'mantener' ? '' : ` · ${t(`progreso.ritmos.${perfil.ritmo}`)}`;
  const metaKg = perfil.pesoMeta;
  const m = p.meta;
  return (
    <Carta>
      <Fila titulo={t('progreso.objetivo')} valor={t(`progreso.objetivos.${perfil.objetivo}`) + ritmo} abierta={abierto === 'objetivo'} alTocar={() => alternar('objetivo')} />
      {abierto === 'objetivo' && (
        <Eleccion>
          <Segmento<Objetivo>
            opciones={(['bajar', 'mantener', 'subir'] as const).map((o) => [o, t(`progreso.objetivos.${o}`)] as const)}
            elegida={perfil.objetivo}
            alElegir={(objetivo) => ponerEstrategia({ objetivo })}
          />
          {perfil.objetivo !== 'mantener' && (
            <>
              <Segmento<Ritmo>
                opciones={(['suave', 'recomendado', 'rapido'] as const).map((r) => [r, t(`progreso.ritmos.${r}`)] as const)}
                elegida={perfil.ritmo}
                alElegir={(r) => ponerEstrategia({ ritmo: r })}
              />
              <Parrafo chico>
                {t('progreso.ritmoTexto', {
                  pct: numero(Math.abs(RITMOS[perfil.objetivo][perfil.ritmo]), 2),
                  kg: numero(u.enUnidad(Math.abs((RITMOS[perfil.objetivo][perfil.ritmo] / 100) * (p.pesoHoy ?? 0))), 2), unidad: u.unidad,
                })}
              </Parrafo>
            </>
          )}
          <Parrafo chico>{t('progreso.objetivoNota')}</Parrafo>
        </Eleccion>
      )}
      {perfil.objetivo !== 'mantener' && (
        <>
          <Fila
            titulo={t('progreso.pesoMeta')}
            valor={metaKg ? `${u.peso(metaKg, metaKg % 1 ? 1 : 0)} ${u.unidad}` : t('progreso.sinPesoMeta')}
            abierta={abierto === 'pesoMeta'}
            alTocar={() => alternar('pesoMeta')}
          />
          {abierto === 'pesoMeta' && (
            <Eleccion>
              <PasosDelPesoMeta kg={metaKg ?? Math.round(p.pesoHoy ?? 70)} u={u} alCambiar={(pesoMeta) => ponerEstrategia({ pesoMeta })} />
              <Parrafo chico>{t('progreso.pesoMetaNota')}</Parrafo>
            </Eleccion>
          )}
        </>
      )}
      {m && (
        <>
          <Fila titulo={t('progreso.metasActuales')} valor={`${numero(m.kcal)} kcal`} alTocar={alVerMetas} />
          <MacrosEnLinea meta={m} />
        </>
      )}
    </Carta>
  );
}

/** El peso meta de a medio kilo, o de a una libra. */
function PasosDelPesoMeta({ kg, u, alCambiar }: { kg: number; u: U; alCambiar: (kg: number) => void }) {
  const cambiar = (signo: 1 | -1) => {
    const nuevo = u.unidad === 'lb' ? Math.round((u.enUnidad(kg) + signo) * KG_POR_LIBRA * 10) / 10 : Math.round((kg + 0.5 * signo) * 2) / 2;
    if (nuevo >= 20 && nuevo <= 400) alCambiar(nuevo);
  };
  return (
    <View style={s.pasos}>
      <Pressable onPress={() => cambiar(-1)} style={s.paso} accessibilityRole="button" accessibilityLabel={t('progreso.bajarMeta')}>
        <Icono nombre="minus" tam={16} peso="semibold" />
      </Pressable>
      <Text style={s.pasoValor}>{`${u.peso(kg, kg % 1 && u.unidad === 'kg' ? 1 : 0)} ${u.unidad}`}</Text>
      <Pressable onPress={() => cambiar(1)} style={s.paso} accessibilityRole="button" accessibilityLabel={t('progreso.subirMeta')}>
        <Icono nombre="plus" tam={16} peso="semibold" />
      </Pressable>
    </View>
  );
}

const MacrosEnLinea = ({ meta }: { meta: Macros }) => (
  <View style={s.macros}>
    {MACROS.map((m) => (
      <View key={m} style={s.macro}>
        <Punto macro={m} tam={7} />
        <Text style={s.macroTexto}>{`${numero(meta[m])} g ${t(`comida.${m}`).toLowerCase()}`}</Text>
      </View>
    ))}
  </View>
);

// ------------------------------------------------------------------ el próximo control
function Requisito({ hecho, total, clave }: { hecho: number; total: number; clave: 'progreso.diasConComida' | 'progreso.pesadas' }) {
  const ok = hecho >= total;
  return (
    <View style={s.req}>
      <Text style={[s.reqNumero, ok && { color: colores.salvia }]}>{hecho}</Text>
      <View style={s.reqTextos}>
        <Text style={s.reqTexto}>{plural(clave, hecho)}</Text>
        <Text style={s.reqMinimo}>{t('progreso.minimo', { n: total })}</Text>
      </View>
    </View>
  );
}

function ElControl({ p }: { p: Persona }) {
  const ec = p.estadoControl;
  if (!ec) return null;
  // Mientras quedan días antes del control, todavía puede llegar: está en curso, no le falta nada.
  const quedan = Math.max(0, ec.faltan - 1);
  const estado = ec.alcanza ? 'alcanza' : ec.diasConComida + quedan >= ec.minimos.diasConComida ? 'enCurso' : 'faltanDatos';
  return (
    <Carta titulo={t('progreso.proximoControl')} derecha={<Chip texto={t(`progreso.${estado}`)} tipo={estado === 'alcanza' ? 'bien' : estado === 'faltanDatos' ? 'atencion' : undefined} />}>
      <Cifra valor={conMayuscula(fechaLarga(ec.fecha))} texto={ec.faltan === 0 ? t('progreso.hoy') : ec.faltan === 1 ? t('progreso.manana') : t('progreso.enDias', { n: ec.faltan })} />
      <View style={s.requisitos}>
        <Requisito hecho={ec.diasConComida} total={ec.minimos.diasConComida} clave="progreso.diasConComida" />
        <Requisito hecho={ec.pesadas} total={ec.minimos.pesadas} clave="progreso.pesadas" />
      </View>
      <Parrafo>{t(estado === 'alcanza' ? 'progreso.controlListo' : estado === 'enCurso' ? 'progreso.controlEnCurso' : 'progreso.controlFalta', { n: quedan })}</Parrafo>
      <EtiquetaDeGrupo>{t('progreso.diaDelControl')}</EtiquetaDeGrupo>
      <Dias elegidos={[p.diaDelControl]} alTocar={(d) => elAlmacen().ponerEstrategia({ diaDelControl: d })} />
      <Parrafo chico>{t('progreso.diaDelControlNota')}</Parrafo>
    </Carta>
  );
}

// ------------------------------------------------------------------ las metas
function Metas({ alVolver }: { alVolver: () => void }) {
  const e = useEstado();
  const p = usePersona();
  const almacen = elAlmacen();
  const ultima = e.metas[e.metas.length - 1];
  const quien = ultima?.motivo === 'manual' ? 'mano' : 'moss';
  const m = p.meta ?? { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 };
  const semana = p.perfil.semana;
  const estilo = p.perfil.estilo ?? 'equilibrada';
  const cambiarAltos = (d: DiaSemana) => {
    if (!semana) return;
    const altos = semana.altos.includes(d) ? semana.altos.filter((x) => x !== d) : [...semana.altos, d];
    // Un día alto al menos, y no todos: si no, no hay nada que repartir.
    if (altos.length >= 1 && altos.length <= 6) almacen.ponerEstrategia({ semana: { ...semana, altos } });
  };
  return (
    <>
      <View style={s.metasCab}>
        <Pressable onPress={alVolver} style={s.atras} accessibilityRole="button" accessibilityLabel={t('comun.atras')} hitSlop={6}>
          <Icono nombre="chevron.left" tam={20} color={colores.pergamino} />
        </Pressable>
        <Text style={s.metasTitulo}>{t('progreso.metas.titulo')}</Text>
      </View>
      {p.deEjemplo && <AvisoDeEjemplo texto={t('progreso.ejemplo')} />}
      <View style={s.heroe}>
        <Text style={s.heroeNumero}>{numero(m.kcal)}</Text>
        <Text style={s.heroeTexto}>{t('progreso.metas.porDia')}</Text>
        <MacrosEnLinea meta={m} />
      </View>

      <EtiquetaDeGrupo>{t('progreso.metas.quien')}</EtiquetaDeGrupo>
      <Segmento<'moss' | 'mano'>
        opciones={[['moss', t('progreso.metas.moss')], ['mano', t('progreso.metas.aMano')]]}
        elegida={quien}
        alElegir={(q) => {
          if (q === quien) return;
          if (q === 'moss') almacen.metasDeMoss();
          else almacen.ponerMetasAMano({ proteina: m.proteina, carbohidratos: m.carbohidratos, grasas: m.grasas });
        }}
      />
      <Parrafo chico>{t(quien === 'moss' ? 'progreso.metas.mossTexto' : 'progreso.metas.aManoTexto')}</Parrafo>

      {quien === 'moss' ? (
        <>
          <EtiquetaDeGrupo>{t('progreso.metas.reparto')}</EtiquetaDeGrupo>
          <View style={s.estilos}>
            {ESTILOS.map((x, i) => {
              const [nombre, texto] = lista(`progreso.metas.estilos.${x}`);
              const elegido = x === estilo;
              return (
                <Pressable
                  key={x}
                  onPress={() => almacen.ponerEstrategia({ estilo: x })}
                  style={[s.estilo, i > 0 && s.estiloSeparado]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: elegido }}
                >
                  <View style={[s.radio, elegido && s.radioElegido]}>{elegido && <View style={s.radioPunto} />}</View>
                  <View style={s.estiloTextos}>
                    <Text style={s.estiloNombre}>{nombre}</Text>
                    <Text style={s.estiloTexto}>{texto}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <>
          <EtiquetaDeGrupo>{t('progreso.metas.tusMacros')}</EtiquetaDeGrupo>
          {MACROS.map((macro) => (
            <CampoDeMacro key={`${macro}-${m[macro]}`} macro={macro} gramos={m[macro]} alCambiar={(g) => almacen.ponerMetasAMano({ proteina: m.proteina, carbohidratos: m.carbohidratos, grasas: m.grasas, [macro]: g })} />
          ))}
        </>
      )}

      <View style={s.semana}>
        <View style={s.llave}>
          <Text style={s.llaveTexto}>{t('progreso.metas.semana')}</Text>
          <Switch
            value={!!semana}
            onValueChange={(si) => almacen.ponerEstrategia({ semana: si ? { altos: [6, 0], extra: 300 } : undefined })}
            trackColor={{ true: colores.oro, false: 'rgba(239, 230, 207, 0.16)' }}
            thumbColor={colores.pergamino}
            accessibilityLabel={t('progreso.metas.semana')}
          />
        </View>
        <Parrafo chico>{t('progreso.metas.semanaTexto')}</Parrafo>
        {semana && (
          <>
            <Dias elegidos={semana.altos} alTocar={cambiarAltos} />
            <Segmento<number> opciones={EXTRAS.map((n) => [n, `+${numero(n)}`] as const)} elegida={semana.extra} alElegir={(extra) => almacen.ponerEstrategia({ semana: { ...semana, extra } })} />
            <Barras reparto={repartirSemana(m, semana.altos, semana.extra, p.perfil.sexo)} altos={semana.altos} />
          </>
        )}
      </View>
    </>
  );
}

/** Un macro a mano: se guarda al terminar de escribir. */
function CampoDeMacro({ macro, gramos, alCambiar }: { macro: Macro; gramos: number; alCambiar: (g: number) => void }) {
  const [texto, setTexto] = useState(String(gramos));
  const guardar = () => {
    const g = Math.round(Number(texto.replace(',', '.')));
    if (Number.isFinite(g) && g >= 0 && g <= 1000 && g !== gramos) alCambiar(g);
    else setTexto(String(gramos));
  };
  return (
    <View style={s.campo}>
      <View style={[s.campoPunto, { backgroundColor: COLOR_DE_MACRO[macro] }]} />
      <Text style={s.campoNombre}>{t(`comida.${macro}`)}</Text>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        onEndEditing={guardar}
        onSubmitEditing={guardar}
        keyboardType="number-pad"
        returnKeyType="done"
        selectTextOnFocus
        style={s.campoValor}
        accessibilityLabel={t(`comida.${macro}`)}
      />
      <Text style={s.campoUnidad}>g</Text>
    </View>
  );
}

/** La semana repartida: cada día con sus kcal; los altos, en oro. */
function Barras({ reparto, altos }: { reparto: Record<DiaSemana, Macros>; altos: readonly DiaSemana[] }) {
  const maximo = Math.max(...SEMANA.map((d) => reparto[d].kcal));
  return (
    <View style={s.barras}>
      {SEMANA.map((d) => (
        <View key={d} style={s.barra}>
          <Text style={s.barraKcal}>{numero(reparto[d].kcal)}</Text>
          <View style={s.barraPista}>
            <View style={[s.barraLlena, { height: `${(reparto[d].kcal / maximo) * 100}%` }, altos.includes(d) && s.barraAlta]} />
          </View>
          <Text style={s.barraDia}>{lista('fecha.diasCortos')[d].charAt(0)}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  seccion: { marginTop: 28, marginHorizontal: 2, fontFamily: letras.numeroMedio, fontSize: 19, color: colores.pergamino },
  objetivoTitulo: { fontFamily: letras.numeroMedio, fontSize: 19, lineHeight: 22, color: colores.pergamino },
  grafico: { marginTop: 8 },
  fila: { flexDirection: 'row', alignItems: 'baseline', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  filaUltima: { borderBottomWidth: 0 },
  filaNombre: { flex: 1, fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  filaValor: { fontFamily: letras.numero, fontSize: 15, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  filaCambio: { width: 70, textAlign: 'right', fontFamily: letras.numero, fontSize: 12, color: 'rgba(239, 230, 207, 0.45)', fontVariant: ['tabular-nums'] },
  baja: { color: colores.salvia },
  sube: { color: colores.oroClaro },
  historia: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  historiaChip: { gap: 3, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  historiaFecha: { fontFamily: letras.texto, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.48)' },
  historiaRango: { fontFamily: letras.numeroMedio, fontSize: 13, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  balance: { marginTop: 8, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  balanceTextos: { flex: 1, gap: 4, minWidth: 0 },
  balanceCifra: { fontFamily: letras.numero, fontSize: 24, color: colores.cifra, fontVariant: ['tabular-nums'] },
  balanceUnidad: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.55)' },
  balanceNota: { fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: 'rgba(239, 230, 207, 0.55)' },
  estrategiaFila: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  estrategiaTitulo: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  estrategiaValor: { flexShrink: 1, fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.6)', textAlign: 'right' },
  eleccion: { gap: 10, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  pasos: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  paso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  pasoValor: { minWidth: 84, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 18, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  macros: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, paddingTop: 12 },
  macro: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroTexto: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.8)', fontVariant: ['tabular-nums'] },
  requisitos: { flexDirection: 'row', gap: 8, marginTop: 6 },
  req: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  reqNumero: { fontFamily: letras.numero, fontSize: 22, color: colores.oroClaro, fontVariant: ['tabular-nums'] },
  reqTextos: { flex: 1, gap: 3 },
  reqTexto: { fontFamily: letras.texto, fontSize: 12, lineHeight: 15, color: 'rgba(239, 230, 207, 0.6)' },
  reqMinimo: { fontFamily: letras.texto, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.42)' },
  metasCab: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: -12, marginTop: -6 },
  atras: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  metasTitulo: { fontFamily: letras.numeroMedio, fontSize: 28, letterSpacing: -0.3, color: colores.pergamino },
  heroe: { marginTop: 18, gap: 6 },
  heroeNumero: { fontFamily: letras.numeroLiviano, fontSize: 52, lineHeight: 54, letterSpacing: -1, color: colores.cifra, fontVariant: ['tabular-nums'] },
  heroeTexto: { fontFamily: letras.texto, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)' },
  estilos: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(6, 10, 22, 0.55)' },
  estilo: { flexDirection: 'row', gap: 14, paddingVertical: 13, paddingHorizontal: 16 },
  estiloSeparado: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  radio: { marginTop: 3, width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(239, 230, 207, 0.35)', alignItems: 'center', justifyContent: 'center' },
  radioElegido: { borderColor: colores.oro },
  radioPunto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.oro },
  estiloTextos: { flex: 1, gap: 3 },
  estiloNombre: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  estiloTexto: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.6)' },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  campoPunto: { width: 7, height: 7, borderRadius: 3.5 },
  campoNombre: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  campoValor: { minWidth: 70, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(239, 230, 207, 0.06)', textAlign: 'right', fontFamily: letras.numero, fontSize: 17, color: colores.cifra },
  campoUnidad: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.55)' },
  semana: { marginTop: 26, gap: 6, paddingBottom: 8 },
  llave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  llaveTexto: { fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  barras: { marginTop: 14, height: 128, flexDirection: 'row', gap: 8 },
  barra: { flex: 1, alignItems: 'center', gap: 6 },
  barraKcal: { fontFamily: letras.numero, fontSize: 10, color: 'rgba(239, 230, 207, 0.6)', fontVariant: ['tabular-nums'] },
  barraPista: { flex: 1, width: '100%', maxWidth: 22, justifyContent: 'flex-end' },
  barraLlena: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: 'rgba(239, 230, 207, 0.18)' },
  barraAlta: { backgroundColor: colores.oro },
  barraDia: { fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.55)' },
});
