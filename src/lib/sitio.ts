// El sitio de Moss: la política de privacidad y los términos (docs/, en GitHub Pages; spec/revision.md).
// Si cambia el dominio, se cambia acá y en la ficha de la App Store.

import { idioma } from '@/textos';

export const SITIO = 'https://condezuzu.github.io/moss';

const PAGINAS = {
  privacidad: { es: '/privacidad/', en: '/en/privacy/' },
  terminos: { es: '/terminos/', en: '/en/terms/' },
} as const;

/** La página en el idioma de la app. El contacto está al final de la política de privacidad. */
export function urlDe(pagina: keyof typeof PAGINAS | 'contacto'): string {
  return SITIO + PAGINAS[pagina === 'contacto' ? 'privacidad' : pagina][idioma()];
}
