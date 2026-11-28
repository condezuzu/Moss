// El final de la sección de Ascent (Ascent.tsx): se llega abajo de todo y ahí se queda mientras se arma lo de arriba,
// hasta que la persona mueve el scroll. Lo que lo mueve sin tocar la pantalla (VoiceOver con tres dedos o el foco que se
// sale de ella, Control por voz, el teclado) llega solo como un scroll; el ajuste del ancla (maintainVisibleContentPosition)
// también, pero ese corre el scroll lo mismo que creció lo de arriba.

/** Dónde está el scroll: el alto del contenido y cuánto falta para el final. */
export type DondeEsta = { alto: number; alFinal: number };

export const dondeEsta = (e: { contentSize: { height: number }; layoutMeasurement: { height: number }; contentOffset: { y: number } }): DondeEsta => ({
  alto: e.contentSize.height,
  alFinal: e.contentSize.height - e.layoutMeasurement.height - e.contentOffset.y,
});

/**
 * Si a un scroll lo movió la persona: cambió la distancia al final sin que cambiara el alto del contenido, y no quedó en
 * el final. El ajuste del ancla cambia el alto y corre el scroll lo mismo, así que esa distancia queda igual.
 */
export const loMovioLaPersona = (antes: DondeEsta, ahora: DondeEsta) =>
  ahora.alto === antes.alto && Math.abs(ahora.alFinal - antes.alFinal) > 1 && ahora.alFinal > 2;
