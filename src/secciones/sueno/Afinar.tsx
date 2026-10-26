// «Afinar», el de la galería (galeria/src/sueno.js; spec/sueno-sin-esfuerzo.md): sin reloj, lo que le
// da a Moss horas exactas de la noche. El despertador de Moss (AlarmKit, iOS 26 o más), con su hora,
// sus días y lo que hay que saber; y la guía para armar en Atajos las automatizaciones que avisan a
// Moss, con lo que llegó estos días (la lista sirve también para ver que andan).

import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { claveDelDia, sumarDias, type ClaveDia, type DiaSemana } from '@/dominio/fechas';
import { esProgramado, type QueSenal, type Senal } from '@/dominio/sinReloj';
import { useSenales } from '@/salud/anclas';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { horaDelDia } from '../comida/datos';
import { HojaModal } from '../HojaModal';
import { Aparece, Carta, Dias, EtiquetaDeGrupo, Parrafo } from '../tarjetas';
import { alarmaPuesta, hayDespertador, pedirAlarmas, permisoDeAlarmas, ponerAlarma, sacarAlarma, type Alarma, type PermisoDeAlarmas } from './despertador';

const SEMANA_LABORAL: DiaSemana[] = [1, 2, 3, 4, 5];
/** Cada automatización y lo que avisa. */
const AUTOMATIZACIONES = [['alarma', 'alarmaParada'], ['conectar', 'cargadorConectado'], ['desconectar', 'cargadorDesconectado'], ['empieza', 'enfoqueEmpezo'], ['termina', 'enfoqueTermino']] as const;
const zonaEn = (ms: number) => -new Date(ms).getTimezoneOffset();
const reloj = (a: Pick<Alarma, 'hora' | 'minuto'>) => horaDelDia(a.hora * 60 + a.minuto);

/** «07:00 · de lunes a viernes». */
function resumen(a: Alarma): string {
  const d = [...a.dias].sort((x, y) => x - y).join(',');
  const dias = !a.dias.length ? t('sueno.afinar.despertador.unaVez')
    : a.dias.length === 7 ? t('sueno.afinar.despertador.todos')
    : d === '1,2,3,4,5' ? t('sueno.afinar.despertador.semana')
    : d === '0,6' ? t('sueno.afinar.despertador.finDe')
    : [...a.dias].sort((x, y) => ((x + 6) % 7) - ((y + 6) % 7)).map((x) => lista('fecha.diasCortos')[x]).join(' ');
  return `${reloj(a)} · ${dias}`;
}

/** «hoy, 07:31», «ayer, 23:48» o «mar, 22:10». */
function cuando(ms: number, hoy: ClaveDia): string {
  const fecha = new Date(ms);
  const clave = claveDelDia(fecha);
  const hora = horaDelDia(fecha.getHours() * 60 + fecha.getMinutes());
  if (clave === hoy) return t('sueno.afinar.hoy', { hora });
  if (clave === sumarDias(hoy, -1)) return t('sueno.afinar.ayer', { hora });
  return t('sueno.afinar.dia', { dia: lista('fecha.diasCortos')[fecha.getDay()], hora });
}

/** El despertador: lo que está puesto en el sistema, el permiso y lo que se está eligiendo. */
function useDespertador() {
  const disponible = hayDespertador();
  const [puesta, setPuesta] = useState<Alarma | null>(null);
  const [permiso, setPermiso] = useState<PermisoDeAlarmas>('sinPedir');
  const [elegida, setElegida] = useState<Alarma>({ hora: 7, minuto: 0, dias: SEMANA_LABORAL });
  const [error, setError] = useState(false);
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!disponible) return;
    let vivo = true;
    // Al volver a Moss: una alarma de una vez, después de sonar, ya no está.
    const leer = () => {
      Promise.all([alarmaPuesta(), permisoDeAlarmas()]).then(([a, p]) => {
        if (!vivo) return;
        setPuesta(a);
        setPermiso(p);
        if (a) setElegida(a);
      }, () => {});
    };
    leer();
    const suscripcion = AppState.addEventListener('change', (estado) => estado === 'active' && leer());
    return () => {
      vivo = false;
      suscripcion.remove();
      clearTimeout(espera.current);
    };
  }, [disponible]);

  const poner = async (a: Alarma) => {
    setError(false);
    let p = permiso;
    if (p !== 'permitido') {
      p = await pedirAlarmas().catch((): PermisoDeAlarmas => 'denegado');
      setPermiso(p);
    }
    if (p !== 'permitido') return;
    try {
      await ponerAlarma(a, t('sueno.afinar.despertador.alarma'), t('sueno.afinar.despertador.detener'));
      setPuesta(a);
    } catch {
      setError(true);
    }
  };
  return {
    disponible, puesta, permiso, elegida, error,
    async prender(si: boolean) {
      if (si) return poner(elegida);
      setError(false);
      try {
        await sacarAlarma();
        setPuesta(null);
      } catch {
        setError(true);
      }
    },
    /** Cambia la hora o los días; si está prendido, la vuelve a poner cuando se dejan de tocar. */
    cambiar(a: Alarma) {
      setElegida(a);
      if (!puesta) return;
      clearTimeout(espera.current);
      espera.current = setTimeout(() => poner(a), 700);
    },
  };
}

export function Afinar({ hoy }: { hoy: ClaveDia }) {
  const [hoja, setHoja] = useState<'despertador' | 'atajos' | null>(null);
  const d = useDespertador();
  const senales = useSenales(15);
  return (
    <Carta titulo={t('sueno.afinar.titulo')}>
      <Parrafo chico>{t('sueno.afinar.texto')}</Parrafo>
      {d.disponible && (
        <View style={[st.fila, st.separada]}>
          <Pressable onPress={() => setHoja('despertador')} style={st.filaTextos} accessibilityRole="button">
            <Text style={st.filaTitulo}>{t('sueno.afinar.despertador.titulo')}</Text>
            <Text style={st.filaDetalle}>{d.puesta ? resumen(d.puesta) : t('sueno.afinar.despertador.apagado')}</Text>
          </Pressable>
          <Switch
            value={!!d.puesta}
            onValueChange={(si) => { d.prender(si).catch(() => {}); }}
            trackColor={{ true: colores.oro, false: 'rgba(239, 230, 207, 0.16)' }}
            thumbColor={colores.pergamino}
            accessibilityLabel={t('sueno.afinar.despertador.titulo')}
          />
        </View>
      )}
      <Pressable onPress={() => setHoja('atajos')} style={({ pressed }) => [st.fila, st.separada, pressed && st.apretada]} accessibilityRole="button">
        <View style={st.filaTextos}>
          <Text style={st.filaTitulo}>{t('sueno.afinar.atajos.titulo')}</Text>
          <Text style={st.filaDetalle}>{t('sueno.afinar.atajos.fila')}</Text>
        </View>
        <Icono nombre="chevron.right" tam={13} peso="semibold" color="rgba(239, 230, 207, 0.45)" />
      </Pressable>
      {d.disponible && (
        <HojaModal abierta={hoja === 'despertador'} titulo={t('sueno.afinar.despertador.titulo')} alCerrar={() => setHoja(null)}>
          <ElDespertador d={d} />
        </HojaModal>
      )}
      <HojaModal abierta={hoja === 'atajos'} titulo={t('sueno.afinar.atajos.titulo')} alCerrar={() => setHoja(null)}>
        <LosAtajos senales={senales ?? []} hoy={hoy} />
      </HojaModal>
    </Carta>
  );
}

function ElDespertador({ d }: { d: ReturnType<typeof useDespertador> }) {
  const a = d.elegida;
  const mover = (minutos: number) => {
    const total = (((a.hora * 60 + a.minuto + minutos) % 1440) + 1440) % 1440;
    d.cambiar({ ...a, hora: Math.floor(total / 60), minuto: total % 60 });
  };
  const paso = (texto: string, etiqueta: string, alTocar: () => void) => (
    <Pressable onPress={alTocar} style={({ pressed }) => [st.paso, pressed && st.apretada]} accessibilityRole="button" accessibilityLabel={etiqueta} hitSlop={4}>
      <Text style={st.pasoTexto}>{texto}</Text>
    </Pressable>
  );
  return (
    <View style={st.hoja}>
      <View style={st.fila}>
        <Text style={[st.filaTitulo, st.filaTextos]}>{t('sueno.afinar.despertador.titulo')}</Text>
        <Switch
          value={!!d.puesta}
          onValueChange={(si) => { d.prender(si).catch(() => {}); }}
          trackColor={{ true: colores.oro, false: 'rgba(239, 230, 207, 0.16)' }}
          thumbColor={colores.pergamino}
          accessibilityLabel={t('sueno.afinar.despertador.titulo')}
        />
      </View>
      <EtiquetaDeGrupo>{t('sueno.afinar.despertador.hora')}</EtiquetaDeGrupo>
      <View style={st.hora}>
        {paso('−', '−1 h', () => mover(-60))}
        {paso('−5', '−5 min', () => mover(-5))}
        <Text style={st.horaValor} accessibilityLiveRegion="polite">{reloj(a)}</Text>
        {paso('+5', '+5 min', () => mover(5))}
        {paso('+', '+1 h', () => mover(60))}
      </View>
      <EtiquetaDeGrupo>{t('sueno.afinar.despertador.dias')}</EtiquetaDeGrupo>
      <Dias elegidos={a.dias} alTocar={(x) => d.cambiar({ ...a, dias: a.dias.includes(x) ? a.dias.filter((y) => y !== x) : [...a.dias, x] })} />
      {!a.dias.length && <Aparece><Parrafo chico>{t('sueno.afinar.despertador.sinDias')}</Parrafo></Aparece>}
      {d.permiso === 'denegado' && (
        <Aparece style={st.aviso}>
          <Parrafo>{t('sueno.afinar.despertador.sinPermiso')}</Parrafo>
          <Pressable onPress={() => { Linking.openSettings().catch(() => {}); }} accessibilityRole="button" hitSlop={6}>
            <Text style={st.enlace}>{t('sueno.afinar.despertador.ajustes')}</Text>
          </Pressable>
        </Aparece>
      )}
      {d.error && <Aparece style={st.aviso}><Parrafo>{t('sueno.afinar.despertador.error')}</Parrafo></Aparece>}
      <View style={st.notas}>
        <Parrafo chico>{t('sueno.afinar.despertador.texto')}</Parrafo>
        <Parrafo chico>{t('sueno.afinar.despertador.reloj')}</Parrafo>
        <Parrafo chico>{t('sueno.afinar.despertador.oculta')}</Parrafo>
      </View>
    </View>
  );
}

function LosAtajos({ senales, hoy }: { senales: Senal[]; hoy: ClaveDia }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const semana = senales.filter((s) => claveDelDia(new Date(s.en)) > sumarDias(hoy, -7));
  const ultima = (que: QueSenal) => semana.filter((s) => s.que === que).at(-1);
  const pasos = lista('sueno.afinar.atajos.pasos');
  return (
    <View style={st.hoja}>
      <Parrafo>{t('sueno.afinar.atajos.texto')}</Parrafo>
      <Pressable onPress={() => { Linking.openURL('shortcuts://').catch(() => {}); }} style={({ pressed }) => [st.boton, pressed && st.botonApretado]} accessibilityRole="button">
        <Text style={st.botonTexto}>{t('sueno.afinar.atajos.abrir')}</Text>
      </Pressable>
      {AUTOMATIZACIONES.map(([cual, que]) => {
        const llego = ultima(que);
        const esta = abierta === cual;
        return (
          <View key={cual} style={st.separada}>
            <Pressable onPress={() => setAbierta(esta ? null : cual)} style={st.fila} accessibilityRole="button" accessibilityState={{ expanded: esta }}>
              <View style={st.filaTextos}>
                <Text style={st.filaTitulo}>{t(`sueno.afinar.atajos.cuales.${cual}.titulo`)}</Text>
                <Text style={[st.filaDetalle, llego && st.llego]}>{llego ? t('sueno.afinar.atajos.llego', { cuando: cuando(llego.en, hoy) }) : t('sueno.afinar.atajos.noLlego')}</Text>
              </View>
              <Icono nombre={esta ? 'chevron.up' : 'chevron.down'} tam={13} peso="semibold" color="rgba(239, 230, 207, 0.45)" />
            </Pressable>
            {esta && (
              <Aparece style={st.pasos}>
                {pasos.map((p, i) => (
                  <View key={i} style={st.pasoFila}>
                    <Text style={st.pasoNumero}>{i + 1}</Text>
                    <Text style={st.pasoLinea}>
                      {p.replace('{activador}', t(`sueno.afinar.atajos.cuales.${cual}.activador`)).replace('{accion}', t(`sueno.afinar.atajos.cuales.${cual}.accion`))}
                    </Text>
                  </View>
                ))}
              </Aparece>
            )}
          </View>
        );
      })}
      <View style={st.notas}>
        <Parrafo chico>{t('sueno.afinar.atajos.siri')}</Parrafo>
      </View>
      <EtiquetaDeGrupo>{t('sueno.afinar.atajos.recientes')}</EtiquetaDeGrupo>
      {!semana.length && <Parrafo chico>{t('sueno.afinar.atajos.nada')}</Parrafo>}
      {[...semana].reverse().map((s) => (
        <View key={s.id} style={[st.reciente, st.separada]}>
          <Text style={st.recienteQue}>
            {t(`sueno.afinar.atajos.senales.${s.que}`)}
            {esProgramado(s, senales, zonaEn) ? <Text style={st.recienteNota}>{` · ${t('sueno.afinar.atajos.horario')}`}</Text> : null}
          </Text>
          <Text style={st.recienteHora}>{cuando(s.en, hoy)}</Text>
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  separada: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  apretada: { backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  filaTextos: { flex: 1, paddingVertical: 10 },
  filaTitulo: { fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  filaDetalle: { marginTop: 3, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  llego: { color: colores.salvia },
  hoja: { gap: 6, paddingBottom: 12 },
  hora: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  horaValor: { flex: 1, textAlign: 'center', fontFamily: letras.numero, fontSize: 34, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  paso: { minWidth: 44, height: 40, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  pasoTexto: { fontFamily: letras.texto, fontSize: 15, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  aviso: { marginTop: 8, gap: 6 },
  enlace: { fontFamily: letras.texto, fontSize: 13.5, color: colores.oroClaro },
  notas: { marginTop: 10, gap: 4 },
  boton: { alignSelf: 'flex-start', minHeight: 38, paddingHorizontal: 16, marginVertical: 8, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.pergamino },
  botonApretado: { backgroundColor: '#d9d0b8' },
  botonTexto: { fontFamily: letras.textoMedio, fontSize: 14, color: '#0b0f1d' },
  pasos: { gap: 8, paddingBottom: 12 },
  pasoFila: { flexDirection: 'row', gap: 10 },
  pasoNumero: { width: 18, fontFamily: letras.numero, fontSize: 13, lineHeight: 19, color: colores.oroClaro, textAlign: 'right' },
  pasoLinea: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 19, color: 'rgba(239, 230, 207, 0.82)' },
  reciente: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 9 },
  recienteQue: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, color: colores.pergamino },
  recienteNota: { color: 'rgba(239, 230, 207, 0.45)' },
  recienteHora: { fontFamily: letras.numero, fontSize: 13, color: 'rgba(239, 230, 207, 0.6)', fontVariant: ['tabular-nums'] },
});
