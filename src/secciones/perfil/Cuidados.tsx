// Perfil › Cuidados, el de la galería (galeria/src/perfil.js, pintarCuidados; D44): lo que es tu caso, para
// marcar y desmarcar cuando quieras (src/dominio/cuidados.ts). Arriba, cómo cambia tu dieta: la meta de antes
// y la de ahora, el objetivo, la banda del embarazo, lo que Moss mira primero, lo que te muestra, lo que deja
// de decirte y lo que te recuerda. Abajo, la lista en grupos, cada una con lo que se pregunta además y su
// línea. La primera vez, lo marcado espera el sí: se guarda solo en este iPhone, nunca en la cuenta.

import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import type { Estado } from '@/almacen/almacen';
import {
  fechaProbableDe, gruposPara, imcDe, metaConCuidados, objetivoConCuidados, PREGUNTA, rangoDelEmbarazo, referenciaConCuidados, reglasDe, ritmoConCuidados,
  semanaDeEmbarazo, semanasDesdeElParto, type Cuidado, type CuidadosGuardados, type DatosDelCuidado, type Reglas,
} from '@/dominio/cuidados';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { edadDe, metaPara, pisoDe, ritmoPermitido, type Macros, type Objetivo, type Ritmo } from '@/dominio/metas';
import { UNIDAD } from '@/dominio/micronutrientes';
import { plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Boton, Icono, Pastilla } from '../comida/comunes';
import { fechaCorta, numero, useNumeros } from '../comida/datos';
import { usePersona } from '../ganchos';
import { HojaModal } from '../HojaModal';
import { BotonDePaso } from '../paso';
import { ACOMODA, Aparece, EtiquetaDeGrupo, Parrafo } from '../tarjetas';

const LLAVE = { true: colores.oro, false: 'rgba(239, 230, 207, 0.16)' };
const MACROS = ['kcal', 'proteina', 'carbohidratos', 'grasas'] as const;
/** Un chip que llega crece apenas; el que se va se apaga. Un fundido no es movimiento: también con Reducir movimiento. */
const ENTRA_CHIP = FadeIn.duration(320).reduceMotion(ReduceMotion.Never);
const SALE_CHIP = FadeOut.duration(240).reduceMotion(ReduceMotion.Never);
const SE_ACOMODA = LinearTransition.duration(300);

/** Lo que se pregunta además de cada una, mientras se edita: en semanas, como en la galería. */
type Borrador = { semana: number; pesoAntes: number | null; mellizos: boolean; semanasParto: number; soloPecho: boolean; bajaElAzucar: boolean | null; dialisis: boolean };

function borradorDe(d: DatosDelCuidado, hoy: ClaveDia): Borrador {
  return {
    semana: d.embarazo ? Math.min(42, Math.max(1, semanaDeEmbarazo(d.embarazo.fechaProbable, hoy))) : 20,
    pesoAntes: d.embarazo?.pesoAntes ?? null,
    mellizos: d.embarazo?.mellizos ?? false,
    semanasParto: d.lactancia ? semanasDesdeElParto(d.lactancia.parto, hoy) : 8,
    soloPecho: d.lactancia?.soloPecho ?? true,
    bajaElAzucar: d.diabetes2?.bajaElAzucar ?? null,
    dialisis: d.renal?.dialisis ?? false,
  };
}

/** Lo que se guarda: solo lo de las que están marcadas. */
function datosDe(b: Borrador, marcados: readonly Cuidado[], hoy: ClaveDia): DatosDelCuidado {
  return {
    ...(marcados.includes('embarazo') ? { embarazo: { fechaProbable: fechaProbableDe(b.semana, hoy), pesoAntes: b.pesoAntes, mellizos: b.mellizos } } : {}),
    ...(marcados.includes('lactancia') ? { lactancia: { parto: sumarDias(hoy, -7 * b.semanasParto), soloPecho: b.soloPecho } } : {}),
    ...(marcados.includes('diabetes2') ? { diabetes2: { bajaElAzucar: b.bajaElAzucar } } : {}),
    ...(marcados.includes('renal') ? { renal: { dialisis: b.dialisis } } : {}),
  };
}

export function Cuidados({ e, alCerrar, alPonerAMano }: { e: Estado; alCerrar: () => void; alPonerAMano: () => void }) {
  const persona = usePersona();
  const guardados = e.cuidados;
  // Con el sí ya dado, lo que se toca se guarda al momento; antes, lo marcado espera abajo.
  const consentido = guardados !== null;
  const [marcados, setMarcados] = useState<Cuidado[]>(guardados?.marcados ?? []);
  const [b, setB] = useState<Borrador>(() => borradorDe(guardados?.datos ?? {}, e.hoy));
  const p = persona.perfil;
  const edad = edadDe(p, e.hoy);
  const pesoKg = persona.pesoHoy ?? e.pesos[e.pesos.length - 1]?.kg ?? 70;
  const quien = { sexo: p.sexo, edad, alturaCm: p.alturaCm, pesoKg, actividad: p.actividad, dieta: p.comer?.dieta };

  const guardar = (m: Cuidado[], borrador: Borrador) => {
    const g: CuidadosGuardados = { marcados: m, datos: datosDe(borrador, m, e.hoy) };
    // Con un trastorno de la alimentación, los números se ocultan de entrada (D9); se vuelven a ver en Perfil.
    if (m.includes('tca') && !guardados?.marcados.includes('tca')) elAlmacen().ponerNumeros(false);
    elAlmacen().ponerCuidados(g);
  };
  const alternar = (c: Cuidado) => {
    const nuevos = marcados.includes(c) ? marcados.filter((x) => x !== c) : [...marcados, c];
    setMarcados(nuevos);
    if (consentido) guardar(nuevos, b);
  };
  const cambiar = (cambios: Partial<Borrador>) => {
    const nuevo = { ...b, ...cambios };
    setB(nuevo);
    if (consentido) guardar(marcados, nuevo);
  };
  const pendiente = !consentido && marcados.length > 0;
  // Lo que cuenta es lo guardado: lo marcado antes del sí todavía no cambia nada.
  const reglas = reglasDe(consentido ? marcados : [], datosDe(b, marcados, e.hoy), quien, e.hoy);

  return (
    <HojaModal
      abierta
      titulo={t('perfil.cuidado')}
      alCerrar={alCerrar}
      pie={pendiente ? (
        <Animated.View entering={FadeInDown.duration(320)}>
          <View style={st.consentir}>
            <Icono nombre="lock" tam={15} color={colores.salvia} />
            <Text style={st.consentirTexto}>{t('cuidados.consentimiento.texto')}</Text>
          </View>
          <View style={st.consentirBotones}>
            <Boton tipo="principal" texto={t('cuidados.consentimiento.guardar')} alTocar={() => guardar(marcados, b)} estilo={{ flex: 1 }} />
            <Boton texto={t('cuidados.consentimiento.ahoraNo')} alTocar={() => setMarcados([])} estilo={{ flex: 1 }} />
          </View>
        </Animated.View>
      ) : undefined}
    >
      <Parrafo>{t('cuidados.intro')}</Parrafo>
      <View style={st.privado}>
        <Icono nombre="lock" tam={14} color={colores.salvia} />
        <Text style={st.privadoTexto}>{t('cuidados.soloEnElIphone')}</Text>
      </View>
      {reglas.cuidados.length > 0 && (
        <Aparece>
          <ComoCambia e={e} reglas={reglas} b={b} pesoKg={pesoKg} gasto={persona.gasto ?? e.metas[e.metas.length - 1]?.gasto ?? null} alPonerAMano={alPonerAMano} />
        </Aparece>
      )}
      {gruposPara(p.sexo).map(({ grupo, cuidados }) => (
        <Animated.View key={grupo} layout={ACOMODA}>
          <EtiquetaDeGrupo>{t(`cuidados.grupos.${grupo}`)}</EtiquetaDeGrupo>
          <Animated.View layout={ACOMODA} style={st.grupo}>
            {cuidados.map((c, i) => {
              const si = marcados.includes(c);
              return (
                <Animated.View key={c} layout={ACOMODA} style={i > 0 && st.separada}>
                  <Pressable onPress={() => alternar(c)} style={st.cuidadoFila} accessibilityRole="switch" accessibilityState={{ checked: si }}>
                    <View style={{ flex: 1 }}>
                      <Text style={st.cuidadoNombre}>{t(`cuidados.nombres.${c}`)}</Text>
                      {(c === 'glp1' || c === 'otra') && <Text style={st.cuidadoDetalle}>{t(`cuidados.detalles.${c}`)}</Text>}
                    </View>
                    {/* La llave se mira: la mueve el toque de toda la fila. */}
                    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                      <Switch value={si} trackColor={LLAVE} thumbColor={colores.pergamino} />
                    </View>
                  </Pressable>
                  {si && (
                    <Aparece style={st.cuidadoDentro}>
                      {PREGUNTA[c] && <Preguntas c={c} b={b} pesoKg={pesoKg} cambiar={cambiar} />}
                      <Text style={st.linea}>{t(`cuidados.lineas.${c}`)}</Text>
                    </Aparece>
                  )}
                </Animated.View>
              );
            })}
          </Animated.View>
        </Animated.View>
      ))}
      <Animated.View layout={ACOMODA}>
        <Parrafo chico>{t('cuidados.alergias')}</Parrafo>
      </Animated.View>
    </HojaModal>
  );
}

/** Un valor con «−» y «+». */
function Pasos({ valor, nombre, alMover, tenue }: { valor: string; nombre: string; alMover: (signo: 1 | -1) => boolean | void; tenue?: boolean }) {
  return (
    <View style={st.pasos}>
      <BotonDePaso alPaso={() => alMover(-1)} etiqueta={`${nombre} −`} lado={30} style={st.paso}>
        <Icono nombre="minus" tam={14} peso="semibold" />
      </BotonDePaso>
      <Animated.Text key={valor} entering={ENTRA_CHIP} style={[st.pasoValor, tenue && { color: 'rgba(239, 230, 207, 0.45)' }]}>{valor}</Animated.Text>
      <BotonDePaso alPaso={() => alMover(1)} etiqueta={`${nombre} +`} lado={30} style={st.paso}>
        <Icono nombre="plus" tam={14} peso="semibold" />
      </BotonDePaso>
    </View>
  );
}

const Pregunta = ({ texto, children }: { texto: string; children: ReactNode }) => (
  <View style={st.pregunta}>
    {texto ? <Text style={st.preguntaTexto}>{texto}</Text> : <View style={{ flex: 1 }} />}
    <View style={st.preguntaLado}>{children}</View>
  </View>
);

function Llave({ si, nombre, alCambiar }: { si: boolean; nombre: string; alCambiar: (si: boolean) => void }) {
  return <Switch value={si} onValueChange={alCambiar} trackColor={LLAVE} thumbColor={colores.pergamino} accessibilityLabel={nombre} />;
}

/** Lo que se pregunta además al marcar una, como en el cuestionario. */
function Preguntas({ c, b, pesoKg, cambiar }: { c: Cuidado; b: Borrador; pesoKg: number; cambiar: (x: Partial<Borrador>) => void }) {
  if (c === 'embarazo') {
    const base = Math.round(pesoKg * 2) / 2;
    const kilos = (x: number) => `${numero(x, x % 1 ? 1 : 0)} kg`;
    return (
      <>
        <Pregunta texto={t('cuidados.preguntas.semana')}>
          <Pasos
            valor={t('cuidados.preguntas.semanaN', { n: b.semana })}
            nombre={t('cuidados.preguntas.semana')}
            alMover={(s) => {
              const n = Math.min(42, Math.max(1, b.semana + s));
              if (n === b.semana) return false;
              cambiar({ semana: n });
            }}
          />
        </Pregunta>
        <Text style={st.preguntaTexto}>{t('cuidados.preguntas.pesoAntes')}</Text>
        <Pregunta texto="">
          <Pastilla texto={t('cuidados.preguntas.noSe')} elegida={b.pesoAntes === null} alTocar={() => cambiar({ pesoAntes: b.pesoAntes === null ? base : null })} />
          <Pasos
            valor={kilos(b.pesoAntes ?? base)}
            tenue={b.pesoAntes === null}
            nombre={t('cuidados.preguntas.pesoAntes')}
            alMover={(s) => cambiar({ pesoAntes: Math.min(200, Math.max(35, (b.pesoAntes ?? base) + s * 0.5)) })}
          />
        </Pregunta>
        <Pregunta texto={t('cuidados.preguntas.mellizos')}>
          <Llave si={b.mellizos} nombre={t('cuidados.preguntas.mellizos')} alCambiar={(si) => cambiar({ mellizos: si })} />
        </Pregunta>
      </>
    );
  }
  if (c === 'lactancia') {
    return (
      <>
        <Pregunta texto={t('cuidados.preguntas.parto')}>
          <Pasos
            valor={plural('cuidados.preguntas.partoN', b.semanasParto)}
            nombre={t('cuidados.preguntas.parto')}
            alMover={(s) => {
              const n = Math.min(104, Math.max(0, b.semanasParto + s));
              if (n === b.semanasParto) return false;
              cambiar({ semanasParto: n });
            }}
          />
        </Pregunta>
        <View style={st.chips}>
          <Pastilla texto={t('cuidados.preguntas.soloPecho')} elegida={b.soloPecho} alTocar={() => cambiar({ soloPecho: true })} />
          <Pastilla texto={t('cuidados.preguntas.conFormula')} elegida={!b.soloPecho} alTocar={() => cambiar({ soloPecho: false })} />
        </View>
      </>
    );
  }
  if (c === 'diabetes2') {
    return (
      <>
        <Text style={st.preguntaTexto}>{t('cuidados.preguntas.insulina')}</Text>
        <View style={st.chips}>
          <Pastilla texto={t('cuidados.preguntas.si')} elegida={b.bajaElAzucar === true} alTocar={() => cambiar({ bajaElAzucar: true })} />
          <Pastilla texto={t('cuidados.preguntas.no')} elegida={b.bajaElAzucar === false} alTocar={() => cambiar({ bajaElAzucar: false })} />
          <Pastilla texto={t('cuidados.preguntas.noLoSe')} elegida={b.bajaElAzucar === null} alTocar={() => cambiar({ bajaElAzucar: null })} />
        </View>
      </>
    );
  }
  return (
    <Pregunta texto={t('cuidados.preguntas.dialisis')}>
      <Llave si={b.dialisis} nombre={t('cuidados.preguntas.dialisis')} alCambiar={(si) => cambiar({ dialisis: si })} />
    </Pregunta>
  );
}

type Chip = { clave: string; texto: string; tipo: 'meta' | 'muestra' | 'apaga' | 'prende' | 'objetivo' | 'antes'; icono?: 'eye' | 'bell.slash' | 'bell' | 'arrow.down' | 'arrow.up' | 'target' };

/** Los chips de un grupo, por su clave: el que llega entra, el que se va sale y los demás se acomodan. */
function Chips({ chips, titulo }: { chips: Chip[]; titulo?: string }) {
  if (!chips.length) return null;
  return (
    <Aparece style={st.chipsGrupo}>
      {titulo ? <Text style={st.chipsTitulo}>{titulo}</Text> : null}
      <View style={st.chips}>
        {chips.map((c) => (
          <Animated.View key={c.clave} entering={ENTRA_CHIP} exiting={SALE_CHIP} layout={SE_ACOMODA} style={[st.chip, CHIP[c.tipo]]}>
            {c.icono && <Icono nombre={c.icono} tam={12} color={c.tipo === 'apaga' ? 'rgba(239, 230, 207, 0.42)' : COLOR_DEL_CHIP[c.tipo]} />}
            <Text style={[st.chipTexto, { color: COLOR_DEL_CHIP[c.tipo] }, c.tipo === 'antes' && st.chipTachado]}>{c.texto}</Text>
          </Animated.View>
        ))}
      </View>
    </Aparece>
  );
}

/** Cómo cambia tu dieta: la meta (cuatro mosaicos, con la de antes si cambió), el objetivo, la banda del embarazo y lo demás en chips. */
function ComoCambia({ e, reglas: r, b, pesoKg, gasto, alPonerAMano }: { e: Estado; reglas: Reglas; b: Borrador; pesoKg: number; gasto: number | null; alPonerAMano: () => void }) {
  const numeros = useNumeros();
  const persona = usePersona();
  const p = persona.perfil;
  const edad = edadDe(p, e.hoy);
  const c = { edad, sexo: p.sexo, pesoKg, objetivo: p.objetivo, ritmo: p.ritmo };
  const estilo = p.estilo ?? 'equilibrada';
  const antes = gasto === null ? null : metaPara(gasto, c, estilo);
  const ahora = gasto === null ? null : metaConCuidados(gasto, c, estilo, r);
  const valor = (m: Macros, k: (typeof MACROS)[number]) => (k === 'kcal' ? numero(m.kcal) : `${numero(m[k])} g`);

  const nombre = (o: Objetivo, ritmo: Ritmo) => t(`progreso.objetivos.${o}`) + (o === 'mantener' ? '' : ` · ${t(`progreso.ritmos.${ritmo}`)}`);
  const ritmoAntes = ritmoPermitido(c);
  const de = nombre(c.objetivo, ritmoAntes);
  const objetivoAhora = objetivoConCuidados(c.objetivo, r);
  const ritmoAhora = ritmoConCuidados(ritmoAntes, objetivoAhora, r);
  let a = nombre(objetivoAhora, ritmoAhora);
  if (c.objetivo === 'bajar' && objetivoAhora === 'mantener') a = r.deficitDesde ? t('cuidados.cambia.deficitDesde', { fecha: fechaCorta(r.deficitDesde) }) : t('cuidados.cambia.sinBajar');
  else if (ritmoAhora !== ritmoAntes) a = t('cuidados.cambia.hastaRitmo', { ritmo: t(`progreso.ritmos.${ritmoAhora}`).toLowerCase() });
  const flecha = (o: Objetivo) => (o === 'bajar' ? 'arrow.down' : o === 'subir' ? 'arrow.up' : 'target') as Chip['icono'];
  const objetivo: Chip[] = a === de
    ? [{ clave: `ahora:${a}`, texto: a, tipo: 'objetivo', icono: flecha(objetivoAhora) }]
    : [{ clave: `antes:${de}`, texto: de, tipo: 'antes', icono: flecha(c.objetivo) }, { clave: `ahora:${a}`, texto: a, tipo: 'meta', icono: flecha(objetivoAhora) }];

  // El embarazo: la banda del IOM según la semana, sin juicios; el punto, si se sabe el peso de antes.
  const rango = r.cuidados.includes('embarazo') ? rangoDelEmbarazo(imcDe(b.pesoAntes ?? pesoKg, p.alturaCm), b.semana, b.mellizos) : null;
  const alTermino = rango ? rangoDelEmbarazo(imcDe(b.pesoAntes ?? pesoKg, p.alturaCm), 40, b.mellizos) ?? rango : null;
  const escala = rango && alTermino ? Math.max(rango[1], alTermino[1]) * 1.15 : 1;
  const subido = b.pesoAntes === null ? null : pesoKg - b.pesoAntes;
  const kilos = (x: number) => numero(x, Math.round(x * 10) % 10 ? 1 : 0);

  const metas: Chip[] = [];
  const pon = (clave: string, texto: string) => metas.push({ clave, texto, tipo: 'meta' });
  // Con los números ocultos, sin calorías.
  if (r.extraKcal > 0 && numeros) pon('extra', t('cuidados.cambia.extra', { n: numero(r.extraKcal) }));
  if (r.piso && r.piso > pisoDe(c.sexo) && numeros) pon('piso', t('cuidados.cambia.piso', { n: numero(r.piso) }));
  if (r.control !== 'normal') pon('control', t(`cuidados.cambia.${r.control}`));
  if (r.sodioMax) pon('sodio', t('cuidados.cambia.sodio', { n: numero(r.sodioMax) }));
  if (typeof r.potasio === 'number') pon('potasio', t('cuidados.cambia.potasio', { n: numero(r.potasio) }));
  else if (r.potasio === 'sinMeta') pon('potasio', t('cuidados.cambia.potasioSinMeta'));
  if (r.saturadasMax) pon('saturadas', t('cuidados.cambia.saturadas', { n: numero(r.saturadasMax * 100) }));
  if (r.colesterolMax) pon('colesterol', t('cuidados.cambia.colesterol', { n: numero(r.colesterolMax) }));
  if (r.fibra) pon('fibra', t('cuidados.cambia.fibra', { a: r.fibra[0], b: r.fibra[1] }));
  if (r.agua === 'noPedir') pon('agua', t('cuidados.cambia.aguaNoPedir'));
  else if (r.agua) pon('agua', t('cuidados.cambia.agua', { n: numero(r.agua / 1000, 1) }));
  if (r.cafeinaTope) pon('cafeina', t('cuidados.cambia.cafeina', { n: numero(r.cafeinaTope) }));
  if (r.alcoholTope === 0) pon('alcohol', t('cuidados.cambia.alcoholNada'));
  else if (r.alcoholTope) pon('alcohol', t('cuidados.cambia.alcoholTope', { n: numero(r.alcoholTope) }));
  if (r.estilosSin.includes('keto')) pon('keto', t('cuidados.cambia.sinKeto'));
  if (r.etapa) pon('etapa', t(`cuidados.cambia.vitaminas.${r.etapa}`));
  if (r.numerosOcultos) pon('numeros', t('cuidados.cambia.numerosOcultos'));
  if (!r.pesoMeta) pon('pesoMeta', t('cuidados.cambia.sinPesoMeta'));

  // Lo que mira primero, con su referencia de ahora (la cafeína y el potasio ya están arriba).
  const para = { sexo: p.sexo, edad };
  const mira: Chip[] = r.mirar.filter((m) => !(m === 'cafeina' && r.cafeinaTope) && !(m === 'potasio' && r.potasio !== null)).map((m) => {
    const ref = referenciaConCuidados(m, para, r);
    const unidad = UNIDAD[m];
    const v = !ref ? t('cuidados.cambia.sinMeta') : 'meta' in ref ? `${numero(ref.meta, ref.meta % 1 ? 1 : 0)} ${unidad}` : t('cuidados.cambia.hasta', { n: numero(ref.tope), u: unidad });
    return { clave: `mira:${m}`, texto: `${t(`comida.micros.nombres.${m}`)} · ${v}`, tipo: 'muestra' };
  });
  const lineas: string[] = [];
  if (r.manuales) lineas.push(t(r.cuidados.includes('renal') && b.dialisis ? 'cuidados.manuales.dialisis' : 'cuidados.manuales.menor'));
  else if (a === de && antes && ahora && MACROS.every((k) => ahora[k] === antes[k])) lineas.push(t('cuidados.cambia.igual'));
  if (r.profesional) lineas.push(t(`cuidados.profesional.${r.profesional}`));
  const nota = lineas.join(' ');

  return (
    <Animated.View layout={ACOMODA} style={st.cambia}>
      <Text style={st.cambiaTitulo}>{t('cuidados.cambia.titulo')}</Text>
      {antes && (
        <View style={st.mosaicos}>
          {MACROS.map((k) => {
            const cambia = !ahora || ahora[k] !== antes[k];
            // Con los números ocultos, solo hacia dónde va cada uno.
            const hacia = !ahora ? '—' : ahora[k] > antes[k] ? t('cuidados.cambia.sube') : ahora[k] < antes[k] ? t('cuidados.cambia.baja') : t('cuidados.cambia.mismo');
            const grande = !ahora ? '—' : numeros ? valor(ahora, k) : hacia;
            const chico = cambia && numeros ? `${t('cuidados.cambia.antes')} ${valor(antes, k)}` : '';
            return (
              <View key={k} style={[st.mosaico, cambia && st.mosaicoCambia]}>
                <Text style={st.mosaicoEtiqueta} numberOfLines={1}>{t(`cuidados.cambia.${k}`)}</Text>
                <View style={st.mosaicoFila}>
                  <Animated.Text key={grande} entering={ENTRA_CHIP} style={st.mosaicoValor} numberOfLines={1}>{grande}</Animated.Text>
                  <Animated.Text key={chico} entering={ENTRA_CHIP} style={st.mosaicoAntes} numberOfLines={1}>{chico}</Animated.Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <Chips chips={objetivo} />
      {rango && (
        <Aparece>
          <Text style={st.cambiaNota}>{t('cuidados.cambia.embarazo', { n: b.semana, a: kilos(rango[0]), b: kilos(rango[1]) })}</Text>
          <View style={st.banda}>
            <Animated.View layout={SE_ACOMODA} style={[st.bandaRango, { left: `${(rango[0] / escala) * 100}%`, width: `${((rango[1] - rango[0]) / escala) * 100}%` }]} />
            {subido !== null && <Animated.View layout={SE_ACOMODA} style={[st.bandaHoy, { left: `${Math.min(1, Math.max(0, subido / escala)) * 100}%` }]} />}
          </View>
        </Aparece>
      )}
      <Chips chips={metas} />
      <Chips chips={mira} titulo={t('cuidados.cambia.mira')} />
      <Chips chips={r.marcar.map((m) => ({ clave: `marca:${m}`, texto: t(`cuidados.marcas.${m}`), tipo: 'muestra', icono: 'eye' }))} titulo={t('cuidados.cambia.muestra')} />
      <Chips chips={r.apagar.map((x) => ({ clave: `apaga:${x}`, texto: t(`cuidados.dice.${x}`), tipo: 'apaga', icono: 'bell.slash' }))} titulo={t('cuidados.cambia.dejaDe')} />
      <Chips chips={r.prender.map((x) => ({ clave: `prende:${x}`, texto: t(`cuidados.dice.${x}`), tipo: 'prende', icono: 'bell' }))} titulo={t('cuidados.cambia.empieza')} />
      {nota ? <Animated.Text key={nota} entering={ENTRA_CHIP} layout={ACOMODA} style={st.cambiaNota}>{nota}</Animated.Text> : null}
      {(r.manuales || r.profesional === 'necesario') && (
        <Aparece style={{ marginTop: 10, alignSelf: 'flex-start' }}>
          <Boton texto={t('cuidados.ponerAMano')} alTocar={alPonerAMano} />
        </Aparece>
      )}
    </Animated.View>
  );
}

const COLOR_DEL_CHIP: Record<Chip['tipo'], string> = {
  meta: colores.oroClaro, muestra: '#c9d8f8', apaga: 'rgba(239, 230, 207, 0.58)', prende: '#c6d9b6', objetivo: colores.pergamino, antes: 'rgba(239, 230, 207, 0.5)',
};
const CHIP = StyleSheet.create({
  meta: { borderColor: 'rgba(232, 196, 106, 0.42)' },
  muestra: { borderColor: 'rgba(169, 196, 245, 0.36)' },
  apaga: {},
  prende: { borderColor: 'rgba(166, 191, 148, 0.48)' },
  objetivo: { borderColor: 'rgba(239, 230, 207, 0.2)' },
  antes: { borderColor: 'rgba(239, 230, 207, 0.2)' },
});

const st = StyleSheet.create({
  privado: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8, marginBottom: 6, marginHorizontal: 2 },
  privadoTexto: { flex: 1, fontFamily: letras.texto, fontSize: 12.5, color: colores.salvia },
  cambia: {
    marginTop: 8, paddingTop: 14, paddingHorizontal: 13, paddingBottom: 13, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.22)',
    backgroundColor: 'rgba(30, 38, 74, 0.6)',
  },
  cambiaTitulo: { marginBottom: 10, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.62)' },
  mosaicos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mosaico: { flexBasis: '48%', flexGrow: 1, gap: 5, paddingTop: 9, paddingHorizontal: 11, paddingBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(6, 10, 22, 0.35)' },
  mosaicoCambia: { borderColor: 'rgba(232, 196, 106, 0.55)', backgroundColor: 'rgba(232, 196, 106, 0.08)' },
  mosaicoEtiqueta: { fontFamily: letras.texto, fontSize: 9, letterSpacing: 0.9, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.56)' },
  mosaicoFila: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  mosaicoValor: { fontFamily: letras.numero, fontSize: 18, color: '#fbf2d9', fontVariant: ['tabular-nums'] },
  mosaicoAntes: { flexShrink: 1, textAlign: 'right', fontFamily: letras.numero, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.45)', fontVariant: ['tabular-nums'] },
  chipsGrupo: { marginTop: 10 },
  chipsTitulo: { marginBottom: 6, fontFamily: letras.texto, fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.5)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.13)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  chipTexto: { flexShrink: 1, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 15 },
  chipTachado: { textDecorationLine: 'line-through' },
  cambiaNota: { marginTop: 10, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.74)' },
  banda: { height: 8, marginTop: 9, marginBottom: 4, borderRadius: 4, backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  bandaRango: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4, backgroundColor: 'rgba(166, 191, 148, 0.55)' },
  bandaHoy: { position: 'absolute', top: -3, width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: '#fbf2d9', shadowColor: '#fbf2d9', shadowOpacity: 0.55, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  grupo: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(8, 12, 26, 0.5)' },
  separada: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  cuidadoFila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingLeft: 14, paddingRight: 12 },
  cuidadoNombre: { fontFamily: letras.texto, fontSize: 15, lineHeight: 19, color: colores.pergamino },
  cuidadoDetalle: { marginTop: 2, fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: 'rgba(239, 230, 207, 0.5)' },
  cuidadoDentro: { gap: 10, paddingHorizontal: 14, paddingBottom: 13 },
  linea: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.62)' },
  pregunta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  preguntaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 16.5, color: 'rgba(239, 230, 207, 0.68)' },
  preguntaLado: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pasos: { flexDirection: 'row', alignItems: 'center', gap: 2, padding: 3, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  paso: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  pasoValor: { minWidth: 84, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 14.5, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  consentir: { flexDirection: 'row', gap: 9, marginBottom: 11 },
  consentirTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 19, color: colores.pergamino },
  consentirBotones: { flexDirection: 'row', gap: 8 },
});
