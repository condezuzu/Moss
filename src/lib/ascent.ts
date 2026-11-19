// Ascent, la otra app del equipo (spec/ascent.md): si está en este iPhone y su página en la
// App Store. Para saber si está, app.json declara su esquema en LSApplicationQueriesSchemes.

import { Linking } from 'react-native';

const ESQUEMA = 'ascent://';
export const ASCENT_EN_LA_APP_STORE = 'https://apps.apple.com/app/id6815006917';

/** Si Ascent está instalada en este iPhone. */
export async function hayAscent(): Promise<boolean> {
  try {
    return await Linking.canOpenURL(ESQUEMA);
  } catch {
    return false;
  }
}

export function irALaAppStore(): void {
  Linking.openURL(ASCENT_EN_LA_APP_STORE).catch(() => {});
}
