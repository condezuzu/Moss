// El sitio de Moss: la portada, la política de privacidad y los términos. Las páginas se escriben en
// docs/ y se publican en un repo público aparte, github.com/condezuzu/moss-app, con GitHub Pages
// (spec/revision.md). Si cambia el dominio, se cambia acá y en la ficha de la App Store.

import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { idioma } from '@/textos';
import { colores } from '@/tema';

export const SITIO = 'https://condezuzu.github.io/moss-app';

/** El correo de contacto: el mismo de las páginas del sitio. */
export const CORREO = 'nodoexpweb@gmail.com';

const PAGINAS = {
  privacidad: { es: '/privacidad/', en: '/en/privacy/' },
  terminos: { es: '/terminos/', en: '/en/terms/' },
} as const;

/** La página en el idioma de la app. El contacto está al final de la política de privacidad. */
export function urlDe(pagina: keyof typeof PAGINAS | 'contacto'): string {
  return SITIO + PAGINAS[pagina === 'contacto' ? 'privacidad' : pagina][idioma()];
}

/** La página dentro de Moss, en una hoja con el cielo de fondo (lo pediste el 29/10/2026: no en Safari). Si no se puede, en el navegador. */
export function abrirPagina(pagina: keyof typeof PAGINAS | 'contacto'): void {
  const url = urlDe(pagina);
  WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    toolbarColor: colores.noche0,
    controlsColor: colores.oro,
    dismissButtonStyle: 'close',
    enableBarCollapsing: true,
  }).catch(() => Linking.openURL(url).catch(() => {}));
}
