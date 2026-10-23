// El editor de un hábito (spec/plan.md, etapa 9): sin listas, se abre manteniendo apretada su
// estrella o con el «+» de Hábitos. El nombre, el ícono, los días y cómo se cumple: a mano, solo con
// Salud (pasos, sueño, agua, atención plena) o solo con la comida. Un día que cambia de cantidad pasa
// a otra constelación.

import type { SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { elAlmacen } from '@/almacen';
import type { AvisoDeHabito, Cuando, Evento } from '@/dominio/avisos';
import { pedirPermisoDeAvisos } from '@/recordatorios/programar';
import type { DiaSemana } from '@/dominio/fechas';
import type { DatoDeSalud, Fuente, Habito } from '@/dominio/habitos';
import { idioma, t } from '@/textos';
import { colores, letras } from '@/tema';
import { decimal } from '@/comida/porciones';
import { Boton, Icono, Pastilla } from '../comida/comunes';
import { numero, useEstado } from '../comida/datos';
import { avisar } from '../comida/registro';
import { HojaModal } from '../HojaModal';
import { Aparece, Dias, EtiquetaDeGrupo, Parrafo, Segmento } from '../tarjetas';

export const ICONOS: readonly SFSymbol[] = [
  'star', 'figure.walk', 'figure.run', 'dumbbell', 'bicycle', 'figure.mind.and.body', 'moon', 'bed.double', 'book', 'pencil', 'drop', 'cup.and.saucer',
  'fork.knife', 'leaf', 'heart', 'brain.head.profile', 'pills', 'sun.max', 'music.note', 'paintbrush', 'graduationcap', 'phone.down', 'pawprint', 'house',
];

/** Las metas que se ofrecen de cada dato de Salud: pasos, minutos de sueño, ml de agua y minutos de atención plena. */
export const METAS: Record<Exclude<DatoDeSalud, 'acostarse'>, readonly number[]> = {
  pasos: [4000, 6000, 8000, 10000, 12000],
  sueno: [360, 420, 480],
  agua: [1500, 2000, 2500, 3000],
  mindfulness: [5, 10, 15, 20],
};
const ICONO_DE_SALUD: Record<keyof typeof METAS, SFSymbol> = { pasos: 'figure.walk', sueno: 'moon', agua: 'drop', mindfulness: 'figure.mind.and.body' };
const ICONO_DE_COMIDA = { proteina: 'fork.knife', registrar: 'list.bullet', calorias: 'flame' } as const satisfies Record<string, SFSymbol>;
const TODOS: DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];

/** Lo que dice la meta de un dato de Salud: «8.000 pasos», «Dormir 7 h». */
export function textoDeMeta(dato: keyof typeof METAS, meta: number): string {
  if (dato === 'pasos') return t('habitos.metas.pasos', { n: numero(meta) });
  if (dato === 'sueno') return t('habitos.metas.sueno', { n: decimal(meta / 60, idioma()) });
  if (dato === 'agua') return t('habitos.metas.agua', { n: decimal(meta / 1000, idioma()) });
  return t('habitos.metas.mindfulness', { n: meta });
}

/** El nombre que se propone para un hábito automático; a mano, ninguno. */
export function nombreDe(f: Fuente): string | null {
  if (f.tipo === 'salud' && f.dato !== 'acostarse') return textoDeMeta(f.dato, f.meta);
  if (f.tipo === 'comida') return t(`habitos.comidas.${f.meta}`);
  return null;
}

type Como = 'manual' | 'salud' | 'comida';

export function EditorDeHabito({ id, alCerrar }: { id: string | null; alCerrar: () => void }) {
  const e = useEstado();
  const original = id ? (e.habitos.find((h) => h.id === id) ?? null) : null;
  const [nombre, setNombre] = useState(original?.nombre ?? '');
  const [icono, setIcono] = useState<string>(original?.icono ?? 'star');
  const [dias, setDias] = useState<DiaSemana[]>(original?.dias ?? TODOS);
  const [fuente, setFuente] = useState<Fuente>(original?.fuente ?? { tipo: 'manual' });
  // Mientras el nombre sea el propuesto, sigue a la meta que se elige.
  const [nombrePropio, setNombrePropio] = useState(!!original && original.nombre !== nombreDe(original.fuente));
  const guardado = original ? e.avisos.habitos?.find((a) => a.habito === original.id) : undefined;
  const [aviso, setAviso] = useState<Omit<AvisoDeHabito, 'habito'> | null>(guardado ? { cuando: guardado.cuando, dias: guardado.dias, ...(guardado.mensaje ? { mensaje: guardado.mensaje } : {}) } : null);
  const [sinPermiso, setSinPermiso] = useState(false);
  const como: Como = fuente.tipo === 'salud' ? 'salud' : fuente.tipo === 'comida' ? 'comida' : 'manual';

  const cambiarFuente = (f: Fuente, iconoSugerido?: SFSymbol) => {
    setFuente(f);
    if (!nombrePropio) setNombre(nombreDe(f) ?? '');
    if (iconoSugerido && (!original || icono === 'star')) setIcono(iconoSugerido);
  };
  const elegirComo = (c: Como) => {
    if (c === como) return;
    if (c === 'manual') cambiarFuente({ tipo: 'manual' });
    else if (c === 'salud') cambiarFuente({ tipo: 'salud', dato: 'pasos', meta: 8000 }, 'figure.walk');
    else cambiarFuente({ tipo: 'comida', meta: 'proteina' }, 'fork.knife');
  };
  const nombreFinal = nombre.trim() || nombreDe(fuente) || '';
  const valido = nombreFinal.length > 0 && nombreFinal.length <= 80 && dias.length > 0;

  const guardar = () => {
    if (!valido) return;
    const datos = { nombre: nombreFinal, icono, dias: [...dias].sort(), fuente };
    let habito = original?.id;
    if (original) elAlmacen().ponerHabito({ ...original, ...datos });
    else habito = elAlmacen().crearHabito(datos).id;
    // Los días del aviso que el hábito ya no tiene se van; sin ninguno, son todos los del hábito.
    const diasDelAviso = aviso ? aviso.dias.filter((d) => dias.includes(d)) : [];
    const mensaje = aviso?.mensaje?.trim();
    if (habito && (aviso || guardado)) elAlmacen().ponerAvisoDeHabito(habito, aviso ? { cuando: aviso.cuando, dias: diasDelAviso, ...(mensaje ? { mensaje } : {}) } : null);
    avisar(t('habitos.guardado', { habito: nombreFinal }));
    alCerrar();
  };
  const activos = e.habitos.filter((x) => !x.hasta || x.hasta >= e.hoy).length;
  const archivar = () => {
    if (!original) return;
    // Menos de 3 no arman constelación.
    if (activos <= 3) {
      avisar(t('habitos.minimo'));
      return;
    }
    elAlmacen().archivarHabito(original.id);
    avisar(t('habitos.archivado', { habito: original.nombre }));
    alCerrar();
  };

  return (
    <HojaModal
      abierta
      titulo={original ? t('habitos.editar') : t('habitos.nuevo')}
      alCerrar={alCerrar}
      pie={(
        <>
          <Boton tipo="principal" texto={t('habitos.guardar')} alTocar={guardar} desactivado={!valido} />
          {original && <Boton tipo="quitar" texto={t('habitos.archivar')} alTocar={archivar} />}
        </>
      )}
    >
      <EtiquetaDeGrupo>{t('habitos.nombre')}</EtiquetaDeGrupo>
      <TextInput
        value={nombre}
        onChangeText={(x) => {
          setNombre(x);
          setNombrePropio(x.trim().length > 0);
        }}
        placeholder={nombreDe(fuente) ?? t('habitos.nombreEjemplo')}
        placeholderTextColor="rgba(239, 230, 207, 0.35)"
        maxLength={80}
        style={st.campo}
        returnKeyType="done"
      />

      <EtiquetaDeGrupo>{t('habitos.como')}</EtiquetaDeGrupo>
      <Segmento<Como>
        opciones={[['manual', t('habitos.aMano')], ['salud', t('habitos.conSalud')], ['comida', t('habitos.conComida')]]}
        elegida={como}
        alElegir={elegirComo}
      />
      <Parrafo chico>{t(como === 'manual' ? 'habitos.aManoTexto' : como === 'salud' ? 'habitos.saludTexto' : 'habitos.comidaTexto')}</Parrafo>
      {fuente.tipo === 'salud' && fuente.dato !== 'acostarse' && (
        <Aparece key="salud" style={st.opciones}>
          <View style={st.fila}>
            {(Object.keys(METAS) as (keyof typeof METAS)[]).map((dato) => (
              <Pastilla
                key={dato}
                texto={t(`habitos.datos.${dato}`)}
                elegida={fuente.dato === dato}
                alTocar={() => cambiarFuente({ tipo: 'salud', dato, meta: METAS[dato][Math.floor(METAS[dato].length / 2)] }, ICONO_DE_SALUD[dato])}
              />
            ))}
          </View>
          <View style={st.fila}>
            {METAS[fuente.dato].map((meta) => (
              <Pastilla key={meta} texto={textoDeMeta(fuente.dato as keyof typeof METAS, meta)} elegida={fuente.meta === meta} alTocar={() => cambiarFuente({ ...fuente, meta })} />
            ))}
          </View>
          <TextInput
            key={fuente.dato}
            defaultValue={METAS[fuente.dato].includes(fuente.meta) ? '' : String(fuente.meta)}
            onChangeText={(x) => {
              const n = Number(x.replace(',', '.'));
              if (Number.isFinite(n) && n > 0) cambiarFuente({ ...fuente, meta: Math.round(n) });
            }}
            placeholder={t('habitos.metaPropia')}
            placeholderTextColor="rgba(239, 230, 207, 0.35)"
            keyboardType="number-pad"
            maxLength={6}
            style={[st.campo, st.mensaje]}
            accessibilityLabel={t('habitos.metaPropia')}
          />
        </Aparece>
      )}
      {fuente.tipo === 'comida' && (
        <Aparece key="comida" style={st.opciones}>
          {(['proteina', 'registrar', 'calorias'] as const).map((meta) => (
            <Pastilla key={meta} texto={t(`habitos.comidas.${meta}`)} elegida={fuente.meta === meta} alTocar={() => cambiarFuente({ tipo: 'comida', meta }, ICONO_DE_COMIDA[meta])} />
          ))}
        </Aparece>
      )}

      <EtiquetaDeGrupo>{t('habitos.dias')}</EtiquetaDeGrupo>
      <Dias elegidos={dias} alTocar={(d) => setDias((antes) => (antes.includes(d) ? antes.filter((x) => x !== d) : [...antes, d]))} />
      <Parrafo chico>{t('habitos.cambiaLaConstelacion')}</Parrafo>

      <EditorDeAviso
        aviso={aviso}
        dias={dias}
        nombre={nombreFinal}
        sinPermiso={sinPermiso}
        alCambiar={(nuevo) => {
          // El primer aviso pide permiso; sin permiso queda elegido, y se dice cómo darlo.
          if (nuevo && !aviso) pedirPermisoDeAvisos().then((ok) => setSinPermiso(!ok)).catch(() => setSinPermiso(true));
          setAviso(nuevo);
        }}
      />

      <EtiquetaDeGrupo>{t('habitos.icono')}</EtiquetaDeGrupo>
      <View style={st.iconos}>
        {ICONOS.map((x) => (
          <Pressable key={x} onPress={() => setIcono(x)} style={[st.icono, icono === x && st.iconoElegido]} accessibilityRole="radio" accessibilityState={{ selected: icono === x }} accessibilityLabel={x}>
            <Icono nombre={x} tam={19} color={icono === x ? colores.oroClaro : 'rgba(239, 230, 207, 0.7)'} />
          </Pressable>
        ))}
      </View>
      {original ? <Parrafo chico>{t('habitos.archivarTexto')}</Parrafo> : <Text style={st.nota}>{t('habitos.mantener')}</Text>}
    </HojaModal>
  );
}

const CUANDO_DE_FABRICA: Record<Cuando['tipo'], Cuando> = {
  hora: { tipo: 'hora', minutos: 9 * 60 },
  despertar: { tipo: 'despertar', despues: 15 },
  dormir: { tipo: 'dormir', antes: 30 },
  evento: { tipo: 'evento', evento: 'almuerzo', despues: 0 },
};
const EVENTOS: readonly Exclude<Evento, 'entrenamiento'>[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];
const SEMANA: readonly DiaSemana[] = [1, 2, 3, 4, 5, 6, 0];

/**
 * El aviso de un hábito (lo pediste el 22/10): a una hora, al despertar, antes de dormir o después de
 * comer, con los minutos, los días del hábito que elijas y tu mensaje (src/dominio/avisos.ts).
 */
function EditorDeAviso({ aviso, dias, nombre, sinPermiso, alCambiar }: {
  aviso: Omit<AvisoDeHabito, 'habito'> | null; dias: DiaSemana[]; nombre: string; sinPermiso: boolean; alCambiar: (a: Omit<AvisoDeHabito, 'habito'> | null) => void;
}) {
  const tipo = aviso?.cuando.tipo ?? 'no';
  const poner = (cuando: Cuando) => aviso && alCambiar({ ...aviso, cuando });
  const c = aviso?.cuando;
  const enLosDias = aviso && aviso.dias.length ? aviso.dias.filter((d) => dias.includes(d)) : dias;
  return (
    <>
      <EtiquetaDeGrupo>{t('habitos.aviso.titulo')}</EtiquetaDeGrupo>
      <View style={st.fila}>
        {(['no', 'hora', 'despertar', 'dormir', 'evento'] as const).map((x) => (
          <Pastilla
            key={x}
            texto={t(`habitos.aviso.${x}`)}
            elegida={tipo === x}
            alTocar={() => alCambiar(x === 'no' ? null : { cuando: { ...CUANDO_DE_FABRICA[x] }, dias: [], ...(aviso?.mensaje ? { mensaje: aviso.mensaje } : {}) })}
          />
        ))}
      </View>
      {aviso && c && (
        <Aparece key={c.tipo} style={st.opciones}>
          {c.tipo === 'hora' && (
            <View style={st.hora}>
              <Pressable onPress={() => poner({ ...c, minutos: (c.minutos + 1440 - 15) % 1440 })} style={st.paso} accessibilityRole="button" accessibilityLabel="−15" hitSlop={6}>
                <Icono nombre="minus" tam={16} peso="semibold" />
              </Pressable>
              <Text style={st.horaTexto}>{`${String(Math.floor(c.minutos / 60)).padStart(2, '0')}:${String(c.minutos % 60).padStart(2, '0')}`}</Text>
              <Pressable onPress={() => poner({ ...c, minutos: (c.minutos + 15) % 1440 })} style={st.paso} accessibilityRole="button" accessibilityLabel="+15" hitSlop={6}>
                <Icono nombre="plus" tam={16} peso="semibold" />
              </Pressable>
            </View>
          )}
          {c.tipo === 'evento' && (
            <View style={st.fila}>
              {EVENTOS.map((ev) => <Pastilla key={ev} texto={t(`comida.comidas.${ev}`)} elegida={c.evento === ev} alTocar={() => poner({ ...c, evento: ev })} />)}
            </View>
          )}
          {c.tipo === 'dormir' && (
            <View style={st.fila}>
              {[15, 30, 60].map((n) => <Pastilla key={n} texto={t('habitos.aviso.antes', { n })} elegida={c.antes === n} alTocar={() => poner({ ...c, antes: n })} />)}
            </View>
          )}
          {(c.tipo === 'despertar' || c.tipo === 'evento') && (
            <View style={st.fila}>
              {[0, 15, 30, 60].map((n) => (
                <Pastilla key={n} texto={n ? t('habitos.aviso.despues', { n }) : t('habitos.aviso.enElMomento')} elegida={c.despues === n} alTocar={() => poner({ ...c, despues: n })} />
              ))}
            </View>
          )}
          <Dias
            elegidos={enLosDias}
            alTocar={(d) => {
              if (!dias.includes(d)) return;
              const nuevos = enLosDias.includes(d) ? enLosDias.filter((x) => x !== d) : SEMANA.filter((x) => x === d || enLosDias.includes(x));
              // Sin ninguno no queda: el aviso se saca con «Sin aviso».
              if (!nuevos.length) return;
              alCambiar({ ...aviso, dias: nuevos.length === dias.length ? [] : nuevos });
            }}
          />
          <TextInput
            value={aviso.mensaje ?? ''}
            onChangeText={(x) => alCambiar({ ...aviso, mensaje: x.slice(0, 120) })}
            placeholder={t('habitos.aviso.mensajeEjemplo', { habito: nombre || t('habitos.nombreEjemplo') })}
            placeholderTextColor="rgba(239, 230, 207, 0.35)"
            maxLength={120}
            style={[st.campo, st.mensaje]}
            accessibilityLabel={t('habitos.aviso.mensaje')}
          />
          <Parrafo chico>{t('habitos.aviso.texto')}</Parrafo>
          {sinPermiso && <Parrafo chico>{t('perfil.recordatoriosSinPermiso')}</Parrafo>}
        </Aparece>
      )}
    </>
  );
}

/** Para los sugeridos y el «+»: un hábito armado con su nombre propuesto. */
export const habitoSugerido = (fuente: Fuente, icono: SFSymbol, nombre?: string, dias: DiaSemana[] = TODOS): Pick<Habito, 'nombre' | 'icono' | 'dias' | 'fuente'> => ({
  nombre: nombre ?? nombreDe(fuente) ?? '', icono, dias, fuente,
});

const st = StyleSheet.create({
  campo: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)', backgroundColor: 'rgba(6, 10, 22, 0.6)', fontFamily: letras.texto, fontSize: 16, color: colores.pergamino },
  opciones: { marginTop: 10, gap: 8, flexDirection: 'row', flexWrap: 'wrap' },
  fila: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icono: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(6, 10, 22, 0.45)' },
  iconoElegido: { borderColor: 'rgba(232, 196, 106, 0.75)', backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  nota: { marginTop: 16, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.5)' },
  mensaje: { width: '100%', marginTop: 4 },
  hora: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  horaTexto: { minWidth: 70, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 22, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  paso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.36)', backgroundColor: 'rgba(232, 196, 106, 0.06)' },
});
