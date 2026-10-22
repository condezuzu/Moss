// El editor de un hábito (spec/plan.md, etapa 9): sin listas, se abre manteniendo apretada su
// estrella o con el «+» de Hábitos. El nombre, el ícono, los días y cómo se cumple: a mano, solo con
// Salud (pasos, sueño, agua, atención plena) o solo con la comida. Un día que cambia de cantidad pasa
// a otra constelación.

import type { SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { elAlmacen } from '@/almacen';
import type { DiaSemana } from '@/dominio/fechas';
import type { DatoDeSalud, Fuente, Habito } from '@/dominio/habitos';
import { idioma, t } from '@/textos';
import { colores, letras } from '@/tema';
import { decimal } from '@/comida/porciones';
import { Boton, Icono, Pastilla } from '../comida/comunes';
import { numero, useEstado } from '../comida/datos';
import { avisar } from '../comida/registro';
import { HojaModal } from '../HojaModal';
import { Dias, EtiquetaDeGrupo, Parrafo, Segmento } from '../tarjetas';

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
    if (original) elAlmacen().ponerHabito({ ...original, ...datos });
    else elAlmacen().crearHabito(datos);
    avisar(t('habitos.guardado', { habito: nombreFinal }));
    alCerrar();
  };
  const archivar = () => {
    if (!original) return;
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
        <View style={st.opciones}>
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
        </View>
      )}
      {fuente.tipo === 'comida' && (
        <View style={st.opciones}>
          {(['proteina', 'registrar', 'calorias'] as const).map((meta) => (
            <Pastilla key={meta} texto={t(`habitos.comidas.${meta}`)} elegida={fuente.meta === meta} alTocar={() => cambiarFuente({ tipo: 'comida', meta }, ICONO_DE_COMIDA[meta])} />
          ))}
        </View>
      )}

      <EtiquetaDeGrupo>{t('habitos.dias')}</EtiquetaDeGrupo>
      <Dias elegidos={dias} alTocar={(d) => setDias((antes) => (antes.includes(d) ? antes.filter((x) => x !== d) : [...antes, d]))} />
      <Parrafo chico>{t('habitos.cambiaLaConstelacion')}</Parrafo>

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
});
