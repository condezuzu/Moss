import { StyleSheet, Text, View } from 'react-native';

import { t } from '@/textos';
import { colores } from '@/tema';

export default function Inicio() {
  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.texto}>{t('cielo.armandose')}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.noche0,
  },
  texto: {
    color: colores.pergamino,
  },
});
