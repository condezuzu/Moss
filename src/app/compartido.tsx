// moss://compartido?d=… (D12): lo que otra persona compartió desde Moss, una receta, una comida
// guardada o un alimento propio. Se muestra qué es y se suma a lo tuyo con un toque.

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elAlmacen } from '@/almacen';
import { leerCompartido, porPorcion } from '@/dominio/compartir';
import { Boton } from '@/secciones/comida/comunes';
import { cantidadDeTexto, numero, sistemaDe, useEstado } from '@/secciones/comida/datos';
import { avisar } from '@/secciones/comida/registro';
import { t } from '@/textos';
import { colores, letras } from '@/tema';

export default function Compartido() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  const insets = useSafeAreaInsets();
  const e = useEstado();
  const c = useMemo(() => (d ? leerCompartido(d) : null), [d]);
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const agregar = () => {
    if (!c) return;
    if (c.tipo === 'receta') elAlmacen().guardarReceta({ ...c.receta });
    else elAlmacen().guardarPropio({ ...c.propio });
    avisar(t('compartir.agregado', { nombre: c.tipo === 'receta' ? c.receta.nombre : c.propio.nombre }));
    volver();
  };
  const valores = c ? (c.tipo === 'receta' ? porPorcion(c.receta) : c.propio.por100g) : null;
  const macros = valores && { kcal: numero(Math.round(valores.kcal)), p: numero(Math.round(valores.proteina)), c: numero(Math.round(valores.carbohidratos)), g: numero(Math.round(valores.grasas)) };
  return (
    <View style={[st.fondo, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 16 }]}>
      <Stack.Screen options={{ presentation: 'modal', headerShown: false }} />
      <ScrollView contentContainerStyle={st.cuerpo}>
        <Text style={st.etiqueta}>{t('compartir.titulo')}</Text>
        {!c || !macros ? (
          <Text style={st.texto}>{t('compartir.invalido')}</Text>
        ) : (
          <>
            <Text style={st.tipo}>{t(`compartir.tipos.${c.tipo === 'receta' ? c.receta.tipo : 'propio'}`)}</Text>
            <Text style={st.nombre}>{c.tipo === 'receta' ? c.receta.nombre : c.propio.marca ? `${c.propio.nombre} · ${c.propio.marca}` : c.propio.nombre}</Text>
            <Text style={st.texto}>
              {c.tipo === 'receta'
                ? `${c.receta.tipo === 'receta' ? `${t('compartir.rinde', { n: numero(c.receta.porciones) })}. ` : ''}${t('compartir.porPorcion', macros)}`
                : t('compartir.por100', macros)}
            </Text>
            {c.tipo === 'receta' && (
              <View style={st.lista}>
                <Text style={st.etiqueta}>{t('compartir.ingredientes')}</Text>
                {c.receta.items.map((i, k) => (
                  <Text key={k} style={st.item}>{`${i.nombre}${i.cantidad ? ` · ${cantidadDeTexto(i.cantidad, sistemaDe(e))}` : ''}`}</Text>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
      <View style={st.pie}>
        {c && <Boton tipo="principal" texto={t('compartir.agregar')} alTocar={agregar} desactivado={!e.listo} />}
        <Boton tipo="contorno" texto={t('entrada.cuestionario.ahoraNo')} alTocar={volver} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  fondo: { flex: 1, paddingHorizontal: 22, backgroundColor: colores.noche1 },
  cuerpo: { gap: 10, paddingBottom: 20 },
  etiqueta: { marginTop: 8, fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  tipo: { marginTop: 14, fontFamily: letras.textoMedio, fontSize: 12, color: colores.oroClaro },
  nombre: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 30, lineHeight: 34, color: colores.pergamino },
  texto: { fontFamily: letras.texto, fontSize: 14.5, lineHeight: 21, color: 'rgba(239, 230, 207, 0.78)' },
  lista: { marginTop: 8, gap: 6 },
  item: { fontFamily: letras.texto, fontSize: 14, lineHeight: 20, color: colores.pergamino },
  pie: { gap: 10 },
});
