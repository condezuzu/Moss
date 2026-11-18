// La sección de Ascent vinculada, como la galería (galeria/src/ascent.js; spec/ascent.md, «Ascent en Progreso»):
// abajo, lo principal (el titular de hoy, lo que lo decide, tu último entreno y cómo te sientes); subiendo, de lo más
// a lo menos importante: «Hoy, concéntrate en», de qué sale, tus músculos, tu fuerza, las marcas, las razones de
// estancamiento, tu año, lo que comparten las dos y en qué se basa. Las cuentas están en vista.ts.

import * as Haptics from 'expo-haptics';
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { deAscent, useAscent } from '@/almacen/ascent';
import { CONDICIONES, queFalla, buenDiaParaLaMarca, type Foco } from '@/dominio/diagnostico';
import { NOCHE_CORTA, SESIONES_MINIMAS, aDosYMedio } from '@/dominio/rendimiento';
import { POCAS_PESADAS, PROTEINA_POR_KG, UMBRAL_DE_ASCENT, type Razon } from '@/dominio/estancados';
import { diasEntre, type ClaveDia } from '@/dominio/fechas';
import type { Musculo } from '@/dominio/musculos';
import type { MusculoAhora } from '@/dominio/fatiga';
import { lista, plural, t } from '@/textos';
import { letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { conSigno, duracion, hora, numero, useEstado, useNumeros } from '../comida/datos';
import { usePersona, useSueno } from '../ganchos';
import { C, GRUPOS_DEL_ANIO } from './colores';
import { Cuerpo, Tendencia, type EstadoDibujado } from './Dibujos';
import { conMayuscula, cuandoDe, cuandoFue, cuandoTodos, enFrase, enLista, listaDeMusculos, nombreDelEjercicio, nombreDelMusculo, textosDelTitular, tx } from './palabras';
import { Cambia, Desplegable, Enlace, Escala, Etiqueta, Flecha, Fundido, Nota, Parte, Pildoras, Una, useTitulares, type EstadoDePildora } from './piezas';
import { calcularTodo, type DeLaMarca, type Estancado, type Hoy, type Todo } from './vista';

/** La barra del sueño va de 0 a 10 horas; la de la proteína, hasta 2,6 g por kilo. */
const SUENO_TOPE = 10 * 60;
const PROTEINA_TOPE = 2.6;

export type IrA = 'sueno' | 'manana' | 'corregir';

type Props = {
  h: Hoy;
  /** Las cuentas de todo lo demás: solo con la sección a la vista. */
  preparada: boolean;
  como: boolean;
  alComo: (abierto: boolean) => void;
  alMedirComo: (y: number) => void;
  alIr: (a: IrA) => void;
};

/** Lo de arriba de lo principal, de lo menos a lo más importante (se llega por abajo). */
export function RestoVinculada({ h, preparada, como, alComo, alMedirComo, alIr }: Props) {
  const e = useEstado();
  const d = useAscent();
  const numeros = useNumeros();
  const persona = usePersonaDeAscent();
  const todo = useMemo(
    () => (preparada ? calcularTodo(h, { e, d, sueno: persona.sueno, persona: persona.persona, ahora: new Date(h.ahora) }, (b) => enFrase(nombreDelEjercicio(b))) : null),
    [preparada, h, e, d, persona],
  );
  if (!todo) return <View style={st.esperando} />;
  const sinDeficit = !!e.perfil?.sinDeficit;
  return (
    <>
      <Como abierto={como} alTocar={() => alComo(!como)} alMedir={alMedirComo} necesidad={h.noche?.necesidad ?? persona.sueno.necesidad} />
      <Comparten h={h} todo={todo} ocultas={!numeros || sinDeficit} />
      <TuAnio h={h} todo={todo} />
      <Estancamiento todo={todo} />
      <Marcas h={h} todo={todo} />
      <Fuerza todo={todo} />
      <TusMusculos todo={todo} />
      <DeQueSale h={h} todo={todo} numeros={numeros} sinDeficit={sinDeficit} alIr={alIr} />
      <Concentrate h={h} todo={todo} numeros={numeros} alIr={alIr} />
    </>
  );
}

function usePersonaDeAscent() {
  const persona = usePersona();
  const sueno = useSueno();
  return useMemo(() => ({ persona, sueno }), [persona, sueno]);
}

// ------------------------------------------------------------ lo principal: el titular de hoy
export function CabezaDelDia({ h, alVerComo }: { h: Hoy; alVerComo: () => void }) {
  const fuente = useTitulares();
  const [queEs, setQueEs] = useState(false);
  const [titulo, texto] = textosDelTitular(h);
  const s = h.sesion;
  const linea = !s ? t('ascent.dia.descanso') : s.como === 'hecha' ? t('ascent.dia.hecha', { sesion: s.nombre }) : t('ascent.dia.sesion', { sesion: s.nombre, hora: hora(s.inicio) });
  const nombres = h.trabajados.slice(0, 4).map((m) => nombreDelMusculo(m.musculo));
  return (
    <View style={st.hoy}>
      <Text style={st.hoySesion}>{linea}</Text>
      <Cambia texto={titulo} style={[st.hoyTitulo, { fontFamily: fuente }]} />
      <Cambia texto={texto} style={st.hoyTexto} />
      {s?.como === 'prevista' && <Decide h={h} />}
      {h.ultima && nombres.length > 0 && (
        <View style={st.ultimo}>
          <Cuerpo ancho={84} clases={Object.fromEntries(h.trabajados.map((m) => [m.musculo, 'trabajado' as const]))} etiqueta={nombres.join(', ')} />
          <View style={st.ultimoTextos}>
            <Text style={st.ultimoEtq}>{t('ascent.ultimo.titulo')}</Text>
            <Text style={st.ultimoTexto}>{t('ascent.ultimo.texto', { dia: conMayuscula(cuandoFue(h.ultima.fecha, h.hoy).replace(/^el /, '')), musculos: nombres.join(', ') })}</Text>
          </View>
        </View>
      )}
      {s?.como === 'prevista' && <ComoTeSientes valor={h.comoTeSientes} />}
      <Enlace texto={t('ascent.porQueNo.enlace')} alTocar={() => setQueEs((x) => !x)} expandido={queEs} />
      <Desplegable abierto={queEs} style={st.explicacionCaja}>
        <Text style={st.explicacion}>{t('ascent.porQueNo.texto')}</Text>
        <Enlace texto={t('ascent.porQueNo.ver')} alTocar={alVerComo} />
      </Desplegable>
    </View>
  );
}

/** Lo que decide hoy, en tres: la noche, lo que entrenas y cómo te sientes. Lo que pone el límite lleva el único color. */
function Decide({ h }: { h: Hoy }) {
  const n = h.noche;
  const noche = !n ? t('ascent.decide.sinNoche') : n.seguidas && n.estado !== 'corta' && n.estado !== 'muyCorta' ? t('ascent.noche.seguidas') : tx(`ascent.noche.${n.estado}`);
  const items: [string, 'moon' | 'dumbbell' | 'heart', string, string, boolean][] = [
    ['noche', 'moon', t('ascent.decide.noche'), noche, h.titular.limita === 'sueno'],
    ['musculos', 'dumbbell', t('ascent.decide.musculos'), h.f.peor ? tx(`ascent.decide.estados.${h.f.peor}`) : '—', h.titular.limita === 'musculos'],
    ['siente', 'heart', t('ascent.decide.siente'), h.comoTeSientes === null ? '—' : t('ascent.siente.respuesta', { n: h.comoTeSientes }), h.titular.limita === 'teSientes'],
  ];
  return <DecideFila items={items} />;
}

export function DecideFila({ items, vacio }: { items: [string, 'moon' | 'dumbbell' | 'heart', string, string, boolean][]; vacio?: boolean }) {
  return (
    <View style={[st.decide, vacio && st.decideVacio]}>
      {items.map(([k, icono, nombre, valor, limita]) => (
        <View key={k} style={st.decideItem} accessible accessibilityLabel={`${nombre}: ${valor}`}>
          <View style={[st.decideIcono, limita && st.decideIconoLimita]}>
            <Icono nombre={icono} tam={15} color={limita ? C.lejos : C.sub} />
          </View>
          <Text style={st.decideNombre}>{nombre}</Text>
          <Cambia texto={valor} style={[st.decideValor, limita && { color: C.lejos }]} />
        </View>
      ))}
    </View>
  );
}

/** «¿Cómo te sientes para entrenar?», de 0 a 10: cambia el titular al tocar. Queda en el teléfono, ese día. */
function ComoTeSientes({ valor }: { valor: number | null }) {
  const elegir = (n: number) => {
    Haptics.selectionAsync().catch(() => {});
    deAscent().ponerComoTeSientes(valor === n ? null : n);
  };
  return (
    <View style={st.siente}>
      <Text style={st.sientePregunta}>{t('ascent.siente.pregunta')}</Text>
      <View style={st.sienteEscala} accessibilityRole="radiogroup" accessibilityLabel={t('ascent.siente.pregunta')}>
        {Array.from({ length: 11 }, (_, n) => (
          <Pressable key={n} onPress={() => elegir(n)} style={[st.sienteBoton, valor === n && st.sienteElegido]} accessibilityRole="radio" accessibilityState={{ selected: valor === n }} hitSlop={{ top: 6, bottom: 6 }}>
            <Text style={[st.sienteNumero, valor === n && { color: C.fondo }]}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <View style={st.sienteExtremos}>
        <Text style={st.sienteExtremo}>{t('ascent.siente.poco')}</Text>
        <Text style={st.sienteExtremo}>{t('ascent.siente.mucho')}</Text>
      </View>
    </View>
  );
}

// ------------------------------------------------------------ hoy, concéntrate en
function textosDelFoco(f: Foco, h: Hoy, todo: Todo, numeros: boolean): [string, string] {
  const comida = (c: string) => tx(`comida.comidas.${c}`);
  if (f.que === 'comer') {
    const l = f.linea;
    if (f.cuando === 'antes') {
      const titulo = l.clase === 'snackPrevio' ? t('ascent.foco.comer.snack') : l.clase === 'previaLiviana' ? t('ascent.foco.comer.liviana', { comida: comida(l.comida) })
        : l.clase === 'ayunasLarga' ? t('ascent.foco.comer.ayunas', { comida: comida(l.comida) }) : t('ascent.foco.comer.previa', { comida: comida(l.comida) });
      const c = numeros ? l.carbohidratos : undefined;
      const p = numeros ? l.proteina : undefined;
      let s = c && p ? t('ascent.foco.comer.cyp', { c, p }) : c ? t('ascent.foco.comer.soloC', { c }) : p ? t('ascent.foco.comer.soloP', { p }) : t('ascent.foco.comer.sinNumeros');
      if (l.durantePorHora) s += ' ' + (numeros ? t('entreno.durante', { a: l.durantePorHora[0], b: l.durantePorHora[1] }) : t('entreno.duranteSinNumeros'));
      if (l.cafeinaHasta != null) s += ' ' + t('ascent.foco.comer.cafe', { hora: hora(l.cafeinaHasta) });
      return [titulo, s];
    }
    if (f.cuando === 'dormir') return [t('ascent.foco.comer.dormir'), numeros && l.proteina ? t('ascent.foco.comer.dormirTexto', { p: l.proteina }) : t('ascent.foco.comer.dormirSinNumeros')];
    const g = numeros ? l.proteina : null;
    let texto = l.clase === 'reponer' ? t('entreno.reponer', { hora: hora(l.hora) }) : g ? t('ascent.foco.comer.despuesTexto', { p: g }) : t('ascent.foco.comer.despuesSinNumeros');
    if (l.clase === 'despuesPronto') texto += ' ' + t('ascent.diagnostico.pasos.pronto');
    if (todo.diag?.consejos.some((x) => x.que === 'sinApuro')) texto += ' ' + t('ascent.diagnostico.consejos.sinApuro');
    return [t('ascent.foco.comer.despues', { comida: comida(l.comida) }), texto];
  }
  if (f.que === 'entrenar') return [h.sesion?.nombre ?? '', tx(`ascent.foco.entrenar.${f.como}`, { ejercicio: f.ejercicio ?? '' })];
  if (f.que === 'terminar') return [t('ascent.foco.terminar.titulo', { hora: hora(f.antesDe) }), t('ascent.foco.terminar.texto', { dormir: hora(f.dormir), mejor: hora(f.mejor) })];
  if (f.que === 'dormir') {
    const deuda = h.deuda !== null && h.deuda >= 7 * 60;
    return [t('ascent.foco.dormir.titulo'), deuda ? t('ascent.diagnostico.consejos.deuda') : t('ascent.foco.dormir.texto', { horas: duracion(h.noche?.necesidad ?? 480) })];
  }
  if (f.que === 'proteina') return [t('ascent.foco.proteina.titulo'), numeros ? t('ascent.diagnostico.consejos.totalDelDia', { g: numero(f.gramos) }) : t('ascent.diagnostico.consejos.totalDelDiaSinNumeros')];
  if (f.que === 'descanso') {
    const falta = h.f.musculos.filter((m) => m.estado !== 'recuperado').sort((a, b) => b.residual - a.residual)[0];
    return [t('ascent.foco.descanso.titulo'), falta ? t('ascent.foco.descanso.cuando', { musculo: nombreDelMusculo(falta.musculo).toLowerCase(), cuando: cuandoDe(falta.cuando) }) : t('ascent.diagnostico.sub.recuperados')];
  }
  return [t('ascent.foco.faltaNoche.titulo'), t('ascent.foco.faltaNoche.texto')];
}

function Concentrate({ h, todo, numeros, alIr }: { h: Hoy; todo: Todo; numeros: boolean; alIr: (a: IrA) => void }) {
  if (!todo.foco.length) return null;
  return (
    <View style={st.foco}>
      <Etiqueta>{t('ascent.foco.titulo')}</Etiqueta>
      <Fundido clave={todo.foco.map((f) => f.que).join()}>
        {todo.foco.map((f, i) => {
          const [titulo, texto] = textosDelFoco(f, h, todo, numeros);
          return (
            <View key={`${f.que}${i}`} style={[st.focoItem, i === 0 && st.focoPrimero]}>
              <Text style={f.hora === null ? st.focoHoraSin : st.focoHora}>{f.hora === null ? t('ascent.foco.hoy') : hora(f.hora)}</Text>
              <View style={st.crece}>
                <Text style={st.focoTitulo}>{titulo}</Text>
                {!!texto && <Text style={st.focoTexto}>{texto}</Text>}
                {f.que === 'faltaNoche' && <Enlace texto={t('ascent.diagnostico.irA.sueno')} alTocar={() => alIr('sueno')} estilo={st.focoEnlace} />}
              </View>
            </View>
          );
        })}
      </Fundido>
    </View>
  );
}

// ------------------------------------------------------------ de qué sale
function Fila({ nombre, valor, palabra, limita, primera, children }: { nombre: string; valor?: string; palabra?: string; limita?: boolean; primera?: boolean; children?: ReactNode }) {
  return (
    <View style={[st.fila, primera && st.filaPrimera]}>
      <View style={st.filaCab}>
        <Text style={st.filaNombre}>{nombre}</Text>
        {!!valor && <Text style={st.filaValor}>{valor}</Text>}
        {!!palabra && <Text style={[st.filaPalabra, limita && { color: C.lejos }]}>{palabra}</Text>}
      </View>
      {children}
    </View>
  );
}
const horasDe = (min: number) => duracion(Math.round(min / 5) * 5);
const Texto = ({ children }: { children: ReactNode }) => <Text style={st.filaTexto}>{children}</Text>;
const Consejo = ({ children }: { children: ReactNode }) => <Text style={st.filaConsejo}>{children}</Text>;

function DeQueSale({ h, todo, numeros, sinDeficit, alIr }: { h: Hoy; todo: Todo; numeros: boolean; sinDeficit: boolean; alIr: (a: IrA) => void }) {
  const n = h.noche;
  const necesidad = n?.necesidad ?? 480;
  const antes = h.sesion?.como === 'prevista';
  const hecha = h.sesion?.como === 'hecha';
  const consejos = todo.diag ? todo.diag.consejos.map((x) => x.que) : [];
  const acostarse = (() => {
    const f = todo.foco.find((x) => x.que === 'dormir');
    return f && f.hora !== null ? hora(f.hora) : null;
  })();
  // El sueño
  const palabraNoche = !n ? '' : n.seguidas && n.estado !== 'corta' && n.estado !== 'muyCorta' ? t('ascent.noche.seguidas') : tx(`ascent.noche.${n.estado}`);
  const corta = !!n && (n.estado === 'corta' || n.estado === 'muyCorta' || n.seguidas);
  // Los músculos
  const ms = hecha && h.despues ? h.despues.musculos : h.f.musculos;
  const peor = hecha && h.despues ? h.despues.peor : h.f.peor;
  const cuando = cuandoTodos(ms);
  // La comida
  const c = todo.comida;
  return (
    <View style={st.filas}>
      <Etiqueta>{t('ascent.filas.titulo')}</Etiqueta>
      <Fila nombre={t('ascent.filas.sueno.nombre')} valor={n ? horasDe(n.dormido) : '—'} palabra={palabraNoche} limita={h.titular.limita === 'sueno'} primera>
        {!n ? (
          <>
            <Texto>{t('ascent.filas.sueno.sinNoche')}</Texto>
            <Enlace texto={t('ascent.diagnostico.irA.sueno')} alTocar={() => alIr('sueno')} />
          </>
        ) : (
          <>
            <Escala
              valor={n.dormido} tope={SUENO_TOPE} rayas={[[NOCHE_CORTA, t('ascent.filas.sueno.seis')], [necesidad, t('ascent.filas.sueno.tuyo', { horas: duracion(necesidad) })]]}
              limita={h.titular.limita === 'sueno'} zona={NOCHE_CORTA} etiqueta={t('ascent.filas.sueno.de', { horas: horasDe(n.dormido), necesidad: duracion(necesidad) })}
            />
            <Texto>
              {[t('ascent.filas.sueno.de', { horas: horasDe(n.dormido), necesidad: duracion(necesidad) }), ...((n.despertoAntes ?? 0) >= 60 ? [t('ascent.filas.sueno.antes', { tiempo: duracion(Math.round(n.despertoAntes! / 5) * 5) })] : [])].join(' ')}
            </Texto>
            {n.seguidas && <Texto>{t('ascent.filas.sueno.seguidas')}</Texto>}
            {n.calidad !== null && <Nota style={st.filaNota}>{t('ascent.filas.sueno.calidad', { n: Math.round(n.calidad) })}</Nota>}
            {corta && acostarse && <Consejo>{t(antes ? 'ascent.filas.sueno.consejos.cortaAntes' : 'ascent.filas.sueno.consejos.corta', { hora: acostarse })}</Consejo>}
            {!corta && n.estado === 'algoCorta' && acostarse && <Consejo>{t('ascent.filas.sueno.consejos.algoCorta', { hora: acostarse })}</Consejo>}
            {antes && consejos.includes('siesta') && <Consejo>{t('ascent.diagnostico.consejos.siesta')}</Consejo>}
            {consejos.includes('deuda') && <Nota style={st.filaNota}>{t('ascent.diagnostico.consejos.deuda')}</Nota>}
            <View style={st.enlaces}>
              {n.calidad === null && <Enlace texto={t('ascent.filas.sueno.anotar')} alTocar={() => alIr('manana')} />}
              <Enlace texto={t('ascent.filas.sueno.corregir')} alTocar={() => alIr('corregir')} />
            </View>
          </>
        )}
      </Fila>
      <Fila nombre={t('ascent.filas.musculos.nombre')} palabra={peor ? tx(`ascent.decide.estados.${peor}`) : ''} limita={h.titular.limita === 'musculos'}>
        {!ms.length ? (
          <Texto>{t('ascent.filas.musculos.nada')}</Texto>
        ) : (
          <>
            <PildorasDeMusculos musculos={ms} />
            <Texto>{tx(`ascent.filas.musculos.texto.${hecha ? 'hecha' : h.sesion ? 'prevista' : 'descanso'}`, { musculos: listaDeMusculos(h.musculosHoy) })}</Texto>
            {h.conEllos && !hecha && <Texto>{t('ascent.filas.musculos.ultima', { cuando: cuandoFue(h.conEllos.fecha, h.hoy), n: h.conEllos.series })}</Texto>}
            {antes ? (
              <Consejo>{tx(`ascent.filas.musculos.consejos.${peor ?? 'recuperado'}`, { cuando: cuandoDe(cuando) })}</Consejo>
            ) : (
              <Consejo>{cuando === 'ya' ? t('ascent.titular.descanso.listos') : t(hecha ? 'ascent.filas.musculos.listos' : 'ascent.filas.musculos.listosDescanso', { cuando: cuandoDe(cuando) })}</Consejo>
            )}
            <Nota style={st.filaNota}>{t('ascent.filas.musculos.nota')}</Nota>
          </>
        )}
      </Fila>
      <Fila nombre={t('ascent.filas.comida.nombre')} valor={c.gPorKg !== null && numeros && !sinDeficit ? t('ascent.filas.comida.valor', { g: numero(c.gPorKg, 1) }) : ''}>
        {sinDeficit ? (
          <Texto>{t('ascent.filas.comida.sinMetas')}</Texto>
        ) : c.gPorKg === null ? (
          <Texto>{t('ascent.filas.comida.sinDatos')}</Texto>
        ) : (
          <>
            {numeros ? (
              <>
                <Escala valor={c.gPorKg} tope={PROTEINA_TOPE} rayas={[[PROTEINA_POR_KG, t('ascent.filas.comida.raya')]]} etiqueta={t('ascent.filas.comida.texto', { g: numero(c.gPorKg, 1), n: c.dias })} />
                <Texto>{t('ascent.filas.comida.texto', { g: numero(c.gPorKg, 1), n: c.dias }) + (c.ayer ? ' ' + t('ascent.filas.comida.ayer', { p: numero(c.ayer.p), meta: numero(c.ayer.meta) }) : '')}</Texto>
              </>
            ) : (
              <Texto>{t('ascent.filas.comida.sinNumeros')}</Texto>
            )}
            <Nota style={st.filaNota}>{t('ascent.filas.comida.nota')}</Nota>
            {consejos.includes('noCompensar') && <Nota style={st.filaNota}>{t('ascent.diagnostico.consejos.noCompensar')}</Nota>}
          </>
        )}
      </Fila>
    </View>
  );
}

/** Un músculo en una línea: su estado y cuándo vuelve a lo suyo. */
const detalleDelMusculo = (m: MusculoAhora) => tx(`ascent.cuerpo.detalle.${m.estado}`, { musculo: nombreDelMusculo(m.musculo), cuando: cuandoDe(m.cuando) });
function PildorasDeMusculos({ musculos, chicas }: { musculos: MusculoAhora[]; chicas?: boolean }) {
  return <Pildoras chicas={chicas} items={musculos.map((m) => ({ clave: m.musculo, texto: nombreDelMusculo(m.musculo), estado: m.estado as EstadoDePildora, etiqueta: detalleDelMusculo(m) }))} />;
}

// ------------------------------------------------------------ tus músculos
function TusMusculos({ todo }: { todo: Todo }) {
  const peor = [...todo.todos].sort((a, b) => b.residual - a.residual)[0];
  const [elegido, setElegido] = useState<Musculo | null>(peor && peor.estado !== 'recuperado' ? peor.musculo : null);
  const m = elegido ? todo.todos.find((x) => x.musculo === elegido) : null;
  const clases = Object.fromEntries(todo.todos.filter((x) => x.estado !== 'recuperado').map((x) => [x.musculo, x.estado as EstadoDibujado]));
  return (
    <Parte titulo={t('ascent.cuerpo.titulo')}>
      <Una>{t('ascent.cuerpo.texto')}</Una>
      <View style={st.cuerpo}>
        <Cuerpo ancho={290} rotulos clases={clases} elegido={elegido} alTocar={(x) => { Haptics.selectionAsync().catch(() => {}); setElegido(x); }} etiqueta={t('ascent.cuerpo.titulo')} />
        <View style={st.cuerpoDetalle} accessibilityLiveRegion="polite">
          <Cambia texto={m ? detalleDelMusculo(m) : t('ascent.cuerpo.todosDescansados')} style={st.cuerpoDetalleTexto} />
        </View>
        <View style={st.leyendaCuerpo}>
          {(['recuperado', 'recuperandose', 'cargado'] as const).map((x) => (
            <View key={x} style={st.leyendaItem}>
              <View style={[st.leyendaPunto, x === 'recuperandose' && { backgroundColor: C.claro, opacity: 0.8 }, x === 'cargado' && { backgroundColor: C.lejos }]} />
              <Text style={st.leyendaTexto}>{tx(`ascent.cuerpo.estados.${x}`)}</Text>
            </View>
          ))}
        </View>
      </View>
    </Parte>
  );
}

// ------------------------------------------------------------ tu fuerza
const conSigno1 = (n: number) => conSigno(Math.round(n * 10) / 10, 1);
function veredicto(x: Todo['fuerza'][number]['t']): [string, string] {
  if (x.estado === 'sube') return [t('ascent.fuerza.sube', { n: conSigno1(x.porMes ?? 0) }), t('ascent.fuerza.rango', { a: conSigno1(x.rango![0]), b: conSigno1(x.rango![1]) }) + ' · ' + plural('ascent.fuerza.sesiones', x.sesiones)];
  if (x.estado === 'sinSubidaClara') return [t('ascent.fuerza.sinSubidaClara'), t('ascent.fuerza.enSemanas', { n: Math.round(x.semanas) }) + ' · ' + plural('ascent.fuerza.sesiones', x.sesiones)];
  return [t('ascent.fuerza.noSeSabe'), x.sesiones < SESIONES_MINIMAS ? plural('ascent.fuerza.faltanSesiones', x.sesiones) : t('ascent.fuerza.faltanSemanas', { n: Math.round(x.semanas) })];
}

function Fuerza({ todo }: { todo: Todo }) {
  const sigmas = todo.fuerza.filter((x) => x.t.ajuste).map((x) => x.t.sigma);
  return (
    <Parte titulo={t('ascent.fuerza.titulo')} derecha={t('ascent.fuerza.semanas')}>
      <Una>{t('ascent.fuerza.texto')}</Una>
      <View style={st.fuerzaLista}>
        {todo.fuerza.map(({ e, t: x, puntos }, i) => {
          const [v, dato] = veredicto(x);
          return (
            <View key={nombreDelEjercicio(e)} style={[st.fuerzaEj, i === 0 && st.sinBorde]} accessible accessibilityLabel={`${nombreDelEjercicio(e)}: ${v}. ${dato}`}>
              <View style={st.crece}>
                <Text style={st.fuerzaNombre}>{nombreDelEjercicio(e)}</Text>
                <Text style={[st.fuerzaVeredicto, x.estado === 'sube' && { color: C.claro }, x.estado === 'noSeSabe' && { color: C.sub }]}>{v}</Text>
                <Text style={st.fuerzaDato}>{dato}</Text>
              </View>
              <Tendencia t={x} puntos={puntos} ancho={128} alto={48} />
            </View>
          );
        })}
      </View>
      {sigmas.length > 0 && <Nota>{t('ascent.fuerza.ruido', { n: numero(sigmas.reduce((s, x) => s + x, 0) / sigmas.length, 1) })}</Nota>}
    </Parte>
  );
}

// ------------------------------------------------------------ marcas, sin probabilidad
/** Tu nivel de hoy con lo que cambia de un día a otro, y tu marca como una raya, en kg de 1RM estimado. */
function Alcance({ m }: { m: DeLaMarca }) {
  const [ancho, setAncho] = useState(0);
  const marca = m.pr.reps <= 1 ? m.pr.kilos : m.pr.kilos * (1 + m.pr.reps / 30);
  const nivel = m.t.nivel!;
  const s = m.t.sigma / 100;
  const lo = Math.min(nivel * Math.exp(-2.5 * s), marca * 0.97), hi = Math.max(nivel * Math.exp(1.5 * s), marca * 1.02);
  const x = (v: number) => ((v - lo) / (hi - lo)) * ancho;
  const enKg = (v: number) => numero(aDosYMedio(v), aDosYMedio(v) % 1 ? 1 : 0);
  const hoyTexto = t('ascent.marcas.nivel', { kg: enKg(nivel) });
  const marcaTexto = t('ascent.marcas.marca', { kg: enKg(marca) });
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${hoyTexto} · ${marcaTexto}`}>
      <View style={st.alcance} onLayout={(ev: LayoutChangeEvent) => setAncho(ev.nativeEvent.layout.width)}>
        <View style={st.alcancePista} />
        {ancho > 0 && (
          <>
            <View style={[st.alcanceRuido, { left: x(nivel * Math.exp(-s)), width: x(nivel * Math.exp(s)) - x(nivel * Math.exp(-s)) }]} />
            <View style={[st.alcanceMarca, { left: x(marca) - 1 }]} />
            <View style={[st.alcanceNivel, { left: x(nivel) - 7.5 }]} />
          </>
        )}
      </View>
      <View style={st.alcanceEje}>
        <View style={st.alcanceEtq}><View style={st.alcanceEtqHoy} /><Text style={st.alcanceTexto}>{hoyTexto}</Text></View>
        <View style={st.alcanceEtq}><View style={st.alcanceEtqMarca} /><Text style={st.alcanceTexto}>{marcaTexto}</Text></View>
      </View>
    </View>
  );
}

function Marcas({ h, todo }: { h: Hoy; todo: Todo }) {
  const s = h.sesion;
  if (!s) return <Parte titulo={t('ascent.marcas.titulo')}><Una>{t('ascent.marcas.sinSesion')}</Una></Parte>;
  if (s.como === 'hecha') return <Parte titulo={t('ascent.marcas.titulo')}><Una>{t('ascent.marcas.hecha', { sesion: enFrase(s.nombre) })}</Una></Parte>;
  const sinNivel = todo.marcas.filter((m) => m.cerca.distancia === null);
  return (
    <Parte titulo={t('ascent.marcas.titulo')}>
      <Una>{t('ascent.marcas.texto', { sesion: enFrase(s.nombre) })}</Una>
      {todo.marcas.filter((m) => m.cerca.distancia !== null).map((m, i) => {
        const buen = !!h.noche && buenDiaParaLaMarca(m);
        const fallan = queFalla(m.condiciones);
        return (
          <View key={nombreDelEjercicio(m.bloque)} style={[st.marca, i === 0 && st.sinBorde]}>
            <View style={st.marcaCab}>
              <Text style={st.marcaNombre}>{nombreDelEjercicio(m.bloque)}</Text>
              <Text style={[st.marcaEstado, m.cerca.cerca && { color: C.claro }]}>{m.cerca.cerca ? t('ascent.marcas.cerca') : t('ascent.marcas.lejos', { n: numero(Math.round(m.cerca.distancia!)) })}</Text>
            </View>
            <Alcance m={m} />
            {m.cerca.cerca && (
              <>
                <View style={st.condiciones}>
                  {CONDICIONES.map((cond) => {
                    // Sin la noche, lo del sueño no se sabe: ni sí ni no.
                    const sabe = !!h.noche || cond !== 'sueno';
                    const si = sabe && m.condiciones[cond];
                    return (
                      <View key={cond} style={[st.condicion, sabe && (si ? st.condicionSi : st.condicionNo)]}>
                        <Icono nombre={!sabe ? 'info.circle' : si ? 'checkmark' : 'xmark'} tam={11} color={!sabe ? C.sub : si ? C.tinta : C.lejos} peso="semibold" />
                        <Text style={[st.condicionTexto, sabe && { color: si ? C.tinta : C.lejos }]}>{tx(`ascent.marcas.condiciones.${cond}`)}</Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={[st.marcaLinea, buen && { color: C.tinta }]}>
                  {!h.noche ? t('ascent.marcas.sinNoche') : buen ? t('ascent.marcas.buenDia') : t('ascent.marcas.hoyNo', { razones: enLista(fallan.map((x) => tx(`ascent.marcas.fallas.${x}`))) })}
                </Text>
              </>
            )}
            {m.frecuencia.de > 0 && (
              <View style={st.frecuencia}>
                <View style={st.cuadros}>
                  {m.fechas.map((f) => <View key={f} style={[st.cuadro, m.conMarca.has(f) && st.cuadroLleno]} />)}
                </View>
                <Text style={st.frecuenciaTexto}>{t('ascent.marcas.frecuencia', { n: m.frecuencia.marcas, de: m.frecuencia.de })}</Text>
              </View>
            )}
          </View>
        );
      })}
      {sinNivel.length > 0 && <Text style={st.marcaLinea}>{t('ascent.marcas.sinNivelLista', { ejercicios: conMayuscula(enLista(sinNivel.map((m) => enFrase(nombreDelEjercicio(m.bloque))))) })}</Text>}
      <Nota>{t('ascent.marcas.entradaEnCalor')}</Nota>
      <Nota>{t('ascent.marcas.nota')}</Nota>
    </Parte>
  );
}

// ------------------------------------------------------------ el estancamiento y sus razones
const v1 = (n: number) => numero(Math.round(n * 10) / 10, Math.round(n * 10) % 10 ? 1 : 0);
/** Las series duras de cada semana: las de cuando subía, llenas; las de ahora, huecas. */
function Barras({ est }: { est: Estancado }) {
  const tope = Math.max(1, ...est.antes.map((s) => s.series), ...est.ahora.map((s) => s.series));
  const barra = (series: number, ahora: boolean, k: string) => <View key={k} style={[st.barra, ahora ? st.barraAhora : st.barraAntes, { height: `${Math.max(4, (series / tope) * 100)}%` }]} />;
  return (
    <View style={st.barras}>
      {est.antes.map((s) => barra(s.series, false, `a${s.lunes}`))}
      <View style={st.barrasDivisor} />
      {est.ahora.map((s) => barra(s.series, true, `h${s.lunes}`))}
    </View>
  );
}

function RazonVista({ x, est }: { x: Razon; est: Estancado }) {
  const cab = (titulo: string, valor?: string) => (
    <View style={st.razonCab}>
      <Text style={st.razonTitulo}>{titulo}</Text>
      {!!valor && <Text style={st.razonValor}>{valor}</Text>}
    </View>
  );
  const p = (texto: string) => <Text style={st.razonTexto}>{texto}</Text>;
  if (x.que === 'series') {
    const texto = t('ascent.estancados.series.texto', { antes: v1(x.antes), ahora: v1(x.ahora) });
    return (
      <View style={st.razon}>
        {cab(t('ascent.estancados.series.titulo', { musculo: nombreDelMusculo(est.musculo).toLowerCase() }), `${v1(x.antes)} → ${v1(x.ahora)}`)}
        <View accessible accessibilityRole="image" accessibilityLabel={texto}><Barras est={est} /></View>
        <View style={st.leyendaRazon}>
          <View style={st.leyendaItem}><View style={[st.leyendaCuadro, st.barraAntes]} /><Text style={st.leyendaTexto}>{t('ascent.estancados.leyenda.antes')}</Text></View>
          <View style={st.leyendaItem}><View style={[st.leyendaCuadro, st.barraAhora]} /><Text style={st.leyendaTexto}>{t('ascent.estancados.leyenda.ahora')}</Text></View>
        </View>
        {p(texto)}
      </View>
    );
  }
  if (x.que === 'frecuencia') return <View style={st.razon}>{cab(t('ascent.estancados.frecuencia.titulo'), `${v1(x.antes)} → ${v1(x.ahora)}`)}{p(t('ascent.estancados.frecuencia.texto', { antes: v1(x.antes), ahora: v1(x.ahora) }))}</View>;
  if (x.que === 'pesadas') {
    const texto = t('ascent.estancados.pesadas.texto', { n: x.pesadas, de: x.de });
    return <View style={st.razon}>{cab(t('ascent.estancados.pesadas.titulo'), `${x.pesadas} / ${x.de}`)}<Escala valor={x.pesadas / x.de} tope={1} rayas={[[POCAS_PESADAS, t('ascent.estancados.pesadas.raya')]]} etiqueta={texto} />{p(texto)}</View>;
  }
  if (x.que === 'bajando') return <View style={st.razon}>{cab(t('ascent.estancados.bajando.titulo'), t('ascent.estancados.bajando.valor', { n: numero(x.porSemana, 1) }))}{p(t('ascent.estancados.bajando.texto'))}</View>;
  if (x.que === 'definicion') return <View style={st.razon}>{cab(t('ascent.estancados.definicion.titulo'))}{p(t('ascent.estancados.definicion.texto'))}</View>;
  if (x.que === 'proteina') {
    const texto = t('ascent.estancados.proteina.texto', { g: numero(x.gPorKg, 1) });
    return <View style={st.razon}>{cab(t('ascent.estancados.proteina.titulo'), t('ascent.filas.comida.valor', { g: numero(x.gPorKg, 1) }))}<Escala valor={x.gPorKg} tope={PROTEINA_TOPE} rayas={[[PROTEINA_POR_KG, t('ascent.filas.comida.raya')]]} limita etiqueta={texto} />{p(texto)}</View>;
  }
  return (
    <View style={st.razon}>
      {cab(t('ascent.estancados.sueno.titulo'), horasDe(x.ahora))}
      <Escala valor={x.ahora} tope={SUENO_TOPE} rayas={[[NOCHE_CORTA, t('ascent.filas.sueno.seis')]]} zona={NOCHE_CORTA} etiqueta={horasDe(x.ahora)} />
      {p(x.antes !== null ? t('ascent.estancados.sueno.texto', { ahora: horasDe(x.ahora), antes: horasDe(x.antes) }) : t('ascent.estancados.sueno.sinAntes', { ahora: horasDe(x.ahora) }))}
    </View>
  );
}

/** Lo que es de la persona y no del ejercicio: si les toca a todos, va una vez, arriba. */
const DE_LA_PERSONA: readonly Razon['que'][] = ['bajando', 'definicion', 'proteina', 'sueno'];

function Estancamiento({ todo }: { todo: Todo }) {
  const est = todo.estancados;
  const comunes = est.length > 1 ? DE_LA_PERSONA.filter((q) => est.every((e) => e.r.razones.some((x) => x.que === q))) : [];
  return (
    <Parte titulo={t('ascent.estancados.titulo')}>
      <Una>{t('ascent.estancados.texto', { n: UMBRAL_DE_ASCENT })}</Una>
      {!est.length ? (
        <Text style={st.razonSin}>{t('ascent.estancados.ninguno')}</Text>
      ) : (
        <>
          {comunes.length > 0 && (
            <View style={[st.estancEj, st.sinBorde]}>
              <Text style={st.estancNombre}>{t('ascent.estancados.comunes')}</Text>
              <View style={st.razones}>{est[0].r.razones.filter((x) => comunes.includes(x.que)).map((x) => <RazonVista key={x.que} x={x} est={est[0]} />)}</View>
            </View>
          )}
          {est.map((e, i) => {
            const propias = e.r.razones.filter((x) => !comunes.includes(x.que));
            const marca = t('ascent.estancamiento.marca', { kg: numero(e.ultima.kilos, e.ultima.kilos % 1 ? 1 : 0), reps: e.ultima.reps });
            return (
              <View key={nombreDelEjercicio(e.e)} style={[st.estancEj, i === 0 && !comunes.length && st.sinBorde]}>
                <View style={st.estancCab}>
                  <Text style={st.estancNombre}>{nombreDelEjercicio(e.e)}</Text>
                  <Text style={st.estancDato}>{t('ascent.estancados.dato', { n: e.sinMarca, marca })}</Text>
                </View>
                {propias.length ? (
                  <View style={st.razones}>{propias.map((x) => <RazonVista key={x.que} x={x} est={e} />)}</View>
                ) : (
                  <Text style={st.razonSin}>{t(comunes.length ? 'ascent.estancados.soloComunes' : 'ascent.estancados.sinCausa')}</Text>
                )}
                {(e.r.faltan.includes('comida') || e.r.faltan.includes('sueno')) && <Nota>{t('ascent.estancados.faltan')}</Nota>}
              </View>
            );
          })}
          {est.some((e) => e.r.anios !== null) && <Text style={st.contexto}>{t('ascent.estancados.anios')}</Text>}
        </>
      )}
      <Nota>{t('ascent.estancamiento.nota')}</Nota>
    </Parte>
  );
}

// ------------------------------------------------------------ tu año
type CeldaDelAnio = { fecha: ClaveDia; clase: 'nada' | 'futuro' | 'hoy' | 'descanso' | keyof typeof GRUPOS_DEL_ANIO; marca: boolean };

/** Un día por cuadro, los meses en filas, con el color de lo que entrenaste y un punto en cada marca. */
export function MapaDelAnio({ hoy, dias, elegido, alElegir, vacio }: { hoy: ClaveDia; dias: Todo['anio']['dias']; elegido?: ClaveDia | null; alElegir?: (f: ClaveDia) => void; vacio?: boolean }) {
  const [ancho, setAncho] = useState(0);
  const anio = Number(hoy.slice(0, 4));
  const porFecha = useMemo(() => new Map(dias.map((x) => [x.fecha, x])), [dias]);
  const filas = useMemo(() => Array.from({ length: 12 }, (_, mes) => {
    const enElMes = new Date(anio, mes + 1, 0).getDate();
    return Array.from({ length: 31 }, (_, i): CeldaDelAnio => {
      const n = i + 1;
      const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      const x = porFecha.get(fecha);
      const clase = n > enElMes ? 'nada' : fecha > hoy ? 'futuro' : fecha === hoy ? 'hoy' : x?.grupo ?? 'descanso';
      return { fecha, clase, marca: !!x?.marca && clase !== 'nada' };
    });
  }), [anio, hoy, porFecha]);
  const MES = 24;
  const lado = ancho ? (ancho - MES - 30 * 1.5) / 31 : 0;
  const tocar = (x: number, y: number) => {
    if (!alElegir || !lado) return;
    const col = Math.floor((x - MES) / (lado + 1.5));
    const fila = Math.floor(y / (lado + 2));
    const c = filas[fila]?.[col];
    if (c && c.clase !== 'nada' && c.clase !== 'futuro') alElegir(c.fecha);
  };
  const meses = lista('fecha.mesesCortos');
  const total = dias.filter((x) => x.grupo).length;
  const marcas = dias.filter((x) => x.marca).length;
  return (
    <Pressable
      onLayout={(ev) => setAncho(ev.nativeEvent.layout.width)}
      onPress={(ev) => tocar(ev.nativeEvent.locationX, ev.nativeEvent.locationY)}
      disabled={!alElegir}
      style={st.mapa}
      accessibilityRole="image"
      accessibilityLabel={t('ascent.anio.mapa', { n: total, m: marcas })}
    >
      {lado > 0 && filas.map((fila, mes) => (
        <View key={mes} style={[st.mapaFila, { height: lado }]}>
          <Text style={[st.mapaMes, { width: MES }]}>{meses[mes]}</Text>
          {fila.map((c) => (
            <View
              key={c.fecha}
              style={[
                st.mapaDia, { width: lado, height: lado },
                vacio ? st.mapaVacio : c.clase === 'nada' ? st.mapaNada : c.clase === 'futuro' ? st.mapaFuturo : c.clase in GRUPOS_DEL_ANIO ? { backgroundColor: GRUPOS_DEL_ANIO[c.clase as keyof typeof GRUPOS_DEL_ANIO] } : null,
                !vacio && (c.clase === 'hoy' || c.fecha === elegido) && st.mapaHoy,
              ]}
            >
              {!vacio && c.marca && <View style={st.mapaMarca} />}
            </View>
          ))}
        </View>
      ))}
    </Pressable>
  );
}

function TuAnio({ h, todo }: { h: Hoy; todo: Todo }) {
  const [elegido, setElegido] = useState<ClaveDia | null>(null);
  const a = todo.anio;
  const detalle = (fecha: ClaveDia) => {
    const x = a.dias.find((y) => y.fecha === fecha);
    const [, m, dd] = fecha.split('-').map(Number);
    const cuando = t('fecha.corta', { num: dd, mes: lista('fecha.mesesCortos')[m - 1] });
    if (fecha === h.hoy) return t('ascent.anio.detalle.hoy', { cuando });
    if (!x?.grupo) return t('ascent.anio.detalle.descanso', { cuando });
    return t(x.marca ? 'ascent.anio.detalle.marca' : 'ascent.anio.detalle.entreno', { cuando, grupo: enFrase(tx(`ascent.hoy.grupos.${x.grupo}`)) });
  };
  const datos: [string, string][] = [
    ['entrenamientos', numero(a.datos.entrenamientos)],
    ['marcas', numero(a.datos.marcas)],
    ['habitos', numero(a.datos.diasConHabitos)],
    ['sueno', a.datos.sueno === null ? '—' : t('ascent.anio.horas', { h: Math.floor(a.datos.sueno / 60), m: String(Math.round(a.datos.sueno % 60)).padStart(2, '0') })],
    ['comida', numero(a.datos.diasConComida)],
  ];
  return (
    <Parte titulo={t('ascent.anio.titulo')} derecha={t('ascent.anio.hastaHoy', { anio: h.hoy.slice(0, 4) })}>
      <Una>{t('ascent.anio.texto2')}</Una>
      <MapaDelAnio hoy={h.hoy} dias={a.dias} elegido={elegido} alElegir={(f) => { Haptics.selectionAsync().catch(() => {}); setElegido(f); }} />
      <LeyendaDelAnio />
      <View style={st.anioDetalle} accessibilityLiveRegion="polite">{elegido && <Cambia texto={detalle(elegido)} style={st.anioDetalleTexto} />}</View>
      {a.ultimas.length > 0 && (
        <>
          <Etiqueta style={st.anioUltimasEtq}>{t('ascent.anio.ultimas')}</Etiqueta>
          <View style={st.anioUltimas}>
            {a.ultimas.map((m) => {
              const semanas = Math.floor(diasEntre(m.fecha, h.hoy) / 7);
              return (
                <View key={m.grupo} style={st.anioUltima}>
                  <View style={[st.leyendaCuadro, { backgroundColor: GRUPOS_DEL_ANIO[m.grupo] }]} />
                  <Text style={st.anioUltimaTexto}>{`${tx(`ascent.hoy.grupos.${m.grupo}`)}: ${enFrase(nombreDelEjercicio({ id: m.id, ejercicio: m.ejercicio }))} ${t('ascent.estancamiento.marca', { kg: numero(m.kilos, m.kilos % 1 ? 1 : 0), reps: m.reps })}`}</Text>
                  <Text style={st.anioUltimaCuando}>{semanas ? plural('ascent.anio.hace', semanas) : t('ascent.anio.estaSemana')}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
      <View style={st.grilla}>
        {datos.map(([k, v]) => (
          <View key={k} style={st.dato}>
            <Text style={st.datoValor}>{v}</Text>
            <Text style={st.datoNombre}>{tx(`ascent.anio.datos.${k}`)}</Text>
          </View>
        ))}
      </View>
    </Parte>
  );
}

function LeyendaDelAnio() {
  const items: [string, string, object][] = [
    ...(['pecho', 'piernas', 'espalda'] as const).map((g): [string, string, object] => [g, tx(`ascent.hoy.grupos.${g}`), { backgroundColor: GRUPOS_DEL_ANIO[g] }]),
    ['descanso', t('ascent.anio.descanso'), { backgroundColor: 'rgba(170, 178, 196, 0.1)' }],
    ['marca', t('ascent.anio.marca'), { backgroundColor: 'rgba(170, 178, 196, 0.25)' }],
  ];
  return (
    <View style={st.anioLeyenda}>
      {items.map(([k, texto, color]) => (
        <View key={k} style={st.leyendaItem}>
          <View style={[st.leyendaCuadro, color]}>{k === 'marca' && <View style={st.mapaMarca} />}</View>
          <Text style={st.leyendaTexto}>{texto}</Text>
        </View>
      ))}
    </View>
  );
}

// ------------------------------------------------------------ lo que comparten las dos
function Comparten({ h, todo, ocultas }: { h: Hoy; todo: Todo; ocultas: boolean }) {
  const e = useEstado();
  const conA = todo.comparten.conA;
  const peso = todo.comparten.peso;
  const filas: [string, string][] = [
    ['peso', peso ? t('ascent.funciones.peso.vivo', { kg: numero(peso.kg, 1), cuando: cuandoFue(peso.fecha, h.hoy) }) : t('ascent.funciones.peso.texto')],
    ['calorias', conA && !ocultas ? t('ascent.funciones.calorias.vivo', { entreno: numero(conA.gimnasio), descanso: numero(conA.descanso) }) : t('ascent.funciones.calorias.texto')],
    ['objetivo', e.perfil ? tx(`ascent.funciones.objetivo.vivo.${e.perfil.objetivo}`) : t('ascent.funciones.objetivo.texto')],
    ['proteina', conA && h.sesion?.como === 'hecha' && conA.extra > 0 && !ocultas ? t('ascent.funciones.proteina.vivo', { n: conA.extra }) : t('ascent.funciones.proteina.texto')],
  ];
  return (
    <Parte titulo={t('ascent.comparten.titulo')}>
      <View style={st.comp}>
        {filas.map(([k, valor], i) => (
          <View key={k} style={[st.compFila, i === 0 && st.sinBorde]}>
            <Text style={st.compTitulo}>{tx(`ascent.funciones.${k}.titulo`)}</Text>
            <Text style={st.compValor}>{valor}</Text>
          </View>
        ))}
      </View>
    </Parte>
  );
}

// ------------------------------------------------------------ en qué se basa
export function Como({ abierto, alTocar, alMedir, necesidad }: { abierto: boolean; alTocar: () => void; alMedir: (y: number) => void; necesidad: number }) {
  return (
    <View style={st.como} onLayout={(ev) => alMedir(ev.nativeEvent.layout.y)}>
      <Pressable onPress={alTocar} style={st.comoCab} accessibilityRole="button" accessibilityState={{ expanded: abierto }}>
        <Text style={st.comoTitulo}>{t('ascent.base.titulo')}</Text>
        <Flecha abierta={abierto} />
      </Pressable>
      <Desplegable abierto={abierto} style={st.comoCuerpo}>
        {(['porcentaje', 'titular', 'noche', 'musculos', 'fuerza', 'marca', 'estancamiento', 'comer', 'orientativo'] as const).map((k) => {
          const texto = tx(`ascent.base.${k}`, { necesidad: duracion(necesidad) });
          const i = texto.indexOf(':');
          return (
            <Text key={k} style={st.comoParrafo}>
              {i > 0 ? (
                <Fragment>
                  <Text style={st.comoNegrita}>{texto.slice(0, i + 1)}</Text>
                  {texto.slice(i + 1)}
                </Fragment>
              ) : texto}
            </Text>
          );
        })}
      </Desplegable>
    </View>
  );
}

const st = StyleSheet.create({
  esperando: { minHeight: 600 },
  crece: { flex: 1, minWidth: 0 },
  sinBorde: { borderTopWidth: 0 },
  // El titular
  hoy: { marginTop: 2 },
  hoySesion: { fontFamily: letras.textoMedio, fontSize: 10.5, lineHeight: 13, letterSpacing: 2, textTransform: 'uppercase', color: C.sub },
  hoyTitulo: { marginTop: 10, fontSize: 33, lineHeight: 36, letterSpacing: -0.5, color: C.claro },
  hoyTexto: { marginTop: 10, fontFamily: letras.texto, fontSize: 15, lineHeight: 21, color: C.tinta },
  explicacionCaja: { paddingTop: 10 },
  explicacion: { fontFamily: letras.texto, fontSize: 13, lineHeight: 19, color: C.sub },
  decide: { flexDirection: 'row', gap: 10, marginTop: 22, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  decideVacio: { marginTop: 12 },
  decideItem: { flex: 1, gap: 6, minWidth: 0 },
  decideIcono: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.lineaFuerte },
  decideIconoLimita: { borderColor: 'rgba(203, 133, 105, 0.6)', backgroundColor: 'rgba(203, 133, 105, 0.08)' },
  decideNombre: { fontFamily: letras.texto, fontSize: 11, lineHeight: 13, color: C.sub },
  decideValor: { fontFamily: letras.texto, fontSize: 14, lineHeight: 17, color: C.tinta },
  ultimo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  ultimoTextos: { flex: 1, minWidth: 0 },
  ultimoEtq: { fontFamily: letras.texto, fontSize: 11.5, lineHeight: 14, color: C.sub },
  ultimoTexto: { marginTop: 4, fontFamily: letras.texto, fontSize: 14.5, lineHeight: 19, color: C.tinta },
  siente: { marginTop: 18 },
  sientePregunta: { fontFamily: letras.texto, fontSize: 13.5, lineHeight: 17.5, color: C.tinta },
  sienteEscala: { flexDirection: 'row', gap: 3, marginTop: 10 },
  sienteBoton: { flex: 1, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: C.lineaFuerte },
  sienteElegido: { backgroundColor: C.claro, borderColor: C.claro },
  sienteNumero: { fontFamily: letras.numero, fontSize: 12, color: C.sub, fontVariant: ['tabular-nums'] },
  sienteExtremos: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sienteExtremo: { fontFamily: letras.texto, fontSize: 10.5, color: C.apagado },
  // Hoy, concéntrate en
  foco: { marginTop: 32, marginHorizontal: -22, paddingTop: 14, paddingHorizontal: 22, borderTopWidth: 1, borderTopColor: C.linea },
  focoItem: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  focoPrimero: { borderTopWidth: 0, paddingTop: 14 },
  focoHora: { width: 50, paddingTop: 1, fontFamily: letras.numeroLiviano, fontSize: 17, lineHeight: 20, color: C.claro, fontVariant: ['tabular-nums'] },
  focoHoraSin: { width: 50, fontFamily: letras.textoMedio, fontSize: 10, lineHeight: 19, letterSpacing: 1.6, textTransform: 'uppercase', color: C.sub },
  focoTitulo: { fontFamily: letras.texto, fontSize: 15.5, lineHeight: 20, color: C.tinta },
  focoTexto: { marginTop: 3, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 18.6, color: C.sub },
  focoEnlace: { marginTop: 8 },
  // De qué sale
  filas: { marginTop: 30, marginHorizontal: -22, paddingTop: 14, paddingHorizontal: 22, borderTopWidth: 1, borderTopColor: C.linea },
  fila: { paddingTop: 16, paddingBottom: 18, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  filaPrimera: { borderTopWidth: 0, paddingTop: 10 },
  filaCab: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  filaNombre: { fontFamily: letras.texto, fontSize: 16.5, lineHeight: 20, color: C.tinta },
  filaValor: { fontFamily: letras.numeroLiviano, fontSize: 15, color: C.sub, fontVariant: ['tabular-nums'] },
  filaPalabra: { marginLeft: 'auto', fontFamily: letras.texto, fontSize: 13.5, color: C.tinta },
  filaTexto: { marginTop: 10, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 19, color: C.sub },
  filaConsejo: { marginTop: 7, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 19, color: C.tinta },
  filaNota: { marginTop: 7 },
  enlaces: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18 },
  // Tus músculos
  cuerpo: { alignItems: 'center', marginTop: 10 },
  cuerpoDetalle: { minHeight: 38, marginTop: 10, alignSelf: 'stretch' },
  cuerpoDetalleTexto: { fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: C.tinta, textAlign: 'center' },
  leyendaCuerpo: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 8 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaPunto: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: 'rgba(170, 178, 196, 0.28)' },
  leyendaCuadro: { width: 9, height: 9, borderRadius: 1.5, alignItems: 'center', justifyContent: 'center' },
  leyendaTexto: { fontFamily: letras.texto, fontSize: 11, color: C.sub },
  // Tu fuerza
  fuerzaLista: { marginTop: 8 },
  fuerzaEj: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  fuerzaNombre: { fontFamily: letras.texto, fontSize: 15, lineHeight: 18, color: C.tinta },
  fuerzaVeredicto: { marginTop: 4, fontFamily: letras.texto, fontSize: 13, lineHeight: 17, color: C.tinta },
  fuerzaDato: { marginTop: 3, fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: C.sub, fontVariant: ['tabular-nums'] },
  // Marcas
  marca: { paddingTop: 13, paddingBottom: 14, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  marcaCab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  marcaNombre: { flexShrink: 1, fontFamily: letras.texto, fontSize: 15, color: C.tinta },
  marcaEstado: { fontFamily: letras.texto, fontSize: 13, color: C.sub },
  alcance: { height: 22, marginTop: 9 },
  alcancePista: { position: 'absolute', left: 0, right: 0, top: 10, height: 2, backgroundColor: C.linea },
  alcanceRuido: { position: 'absolute', top: 5, height: 12, borderRadius: 999, backgroundColor: C.claro, opacity: 0.2 },
  alcanceMarca: { position: 'absolute', top: 1, width: 2, height: 20, backgroundColor: C.claro },
  alcanceNivel: { position: 'absolute', top: 3.5, width: 15, height: 15, borderRadius: 7.5, borderWidth: 2.5, borderColor: '#090b11', backgroundColor: C.tinta },
  alcanceEje: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  alcanceEtq: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alcanceEtqHoy: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.tinta },
  alcanceEtqMarca: { width: 2, height: 11, backgroundColor: C.claro },
  alcanceTexto: { fontFamily: letras.texto, fontSize: 11, color: C.sub },
  marcaLinea: { marginTop: 8, fontFamily: letras.texto, fontSize: 13, lineHeight: 17.5, color: C.sub },
  condiciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  condicion: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingLeft: 7, paddingRight: 9, borderRadius: 999, borderWidth: 1, borderColor: C.lineaFuerte },
  condicionSi: { borderColor: 'rgba(210, 207, 197, 0.36)' },
  condicionNo: { borderColor: 'rgba(203, 133, 105, 0.5)' },
  condicionTexto: { fontFamily: letras.texto, fontSize: 11.5, color: C.sub },
  frecuencia: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  cuadros: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, flexShrink: 0, maxWidth: 200 },
  cuadro: { width: 7, height: 7, borderWidth: 1, borderColor: C.apagado },
  cuadroLleno: { backgroundColor: C.claro, borderColor: C.claro },
  frecuenciaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 12, lineHeight: 15.6, color: C.sub },
  // Estancamiento
  estancEj: { paddingTop: 14, paddingBottom: 8, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  estancCab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  estancNombre: { flexShrink: 1, fontFamily: letras.texto, fontSize: 15.5, lineHeight: 19, color: C.tinta },
  estancDato: { fontFamily: letras.texto, fontSize: 12, color: C.sub, textAlign: 'right', fontVariant: ['tabular-nums'] },
  razones: { marginTop: 12, gap: 14 },
  razon: { gap: 6 },
  razonCab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  razonTitulo: { flexShrink: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 17.5, color: C.tinta },
  razonValor: { fontFamily: letras.numero, fontSize: 12, color: C.sub, fontVariant: ['tabular-nums'] },
  razonTexto: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: C.sub },
  razonSin: { marginTop: 10, fontFamily: letras.texto, fontSize: 13, lineHeight: 17.5, color: C.sub },
  barras: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 38 },
  barra: { flex: 1, minWidth: 3 },
  barraAntes: { backgroundColor: C.claro, opacity: 0.7 },
  barraAhora: { borderWidth: 1.2, borderColor: C.principal },
  barrasDivisor: { width: 1, alignSelf: 'stretch', marginHorizontal: 4, backgroundColor: C.lineaFuerte },
  leyendaRazon: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 4 },
  contexto: { marginTop: 12, marginBottom: 2, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: C.apagado },
  // Tu año
  mapa: { marginTop: 14, gap: 2 },
  mapaFila: { flexDirection: 'row', alignItems: 'center', gap: 1.5 },
  mapaMes: { fontFamily: letras.texto, fontSize: 9.5, color: C.apagado, textTransform: 'capitalize' },
  mapaDia: { borderRadius: 1.5, backgroundColor: 'rgba(170, 178, 196, 0.1)', alignItems: 'center', justifyContent: 'center' },
  mapaVacio: { backgroundColor: 'rgba(170, 178, 196, 0.07)' },
  mapaNada: { opacity: 0 },
  mapaFuturo: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(170, 178, 196, 0.08)' },
  mapaHoy: { borderWidth: 1.5, borderColor: C.tinta },
  mapaMarca: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fbf8ef' },
  anioLeyenda: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, marginTop: 12 },
  anioDetalle: { minHeight: 17, marginTop: 10 },
  anioDetalleTexto: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: C.tinta },
  anioUltimasEtq: { marginTop: 18 },
  anioUltimas: { marginTop: 14, gap: 9 },
  anioUltima: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  anioUltimaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 17.5, color: C.tinta },
  anioUltimaCuando: { fontFamily: letras.texto, fontSize: 12, color: C.sub },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, marginTop: 18 },
  dato: { width: '33.3%', gap: 4, paddingRight: 10 },
  datoValor: { fontFamily: letras.numeroLiviano, fontSize: 21, letterSpacing: -0.2, color: C.tinta, fontVariant: ['tabular-nums'] },
  datoNombre: { fontFamily: letras.texto, fontSize: 11, lineHeight: 14, color: C.sub },
  // Lo que comparten
  comp: { marginTop: 8 },
  compFila: { gap: 3, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  compTitulo: { fontFamily: letras.texto, fontSize: 14, lineHeight: 17.5, color: C.tinta },
  compValor: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: C.sub, fontVariant: ['tabular-nums'] },
  // En qué se basa
  como: { marginTop: 30, marginHorizontal: -22, paddingHorizontal: 22, borderTopWidth: 1, borderTopColor: C.linea },
  comoCab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  comoTitulo: { fontFamily: letras.textoMedio, fontSize: 10.5, lineHeight: 13, letterSpacing: 2, textTransform: 'uppercase', color: C.sub },
  comoCuerpo: { marginTop: 0, paddingBottom: 6 },
  comoParrafo: { marginBottom: 12, fontFamily: letras.texto, fontSize: 13, lineHeight: 19, color: C.sub },
  comoNegrita: { fontFamily: letras.textoMedio, color: C.tinta },
});
