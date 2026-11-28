import { describe, expect, it } from '@jest/globals';

import { dondeEsta, loMovioLaPersona } from './pegado';

describe('quién movió el scroll de la sección', () => {
  const evento = (alto: number, y: number) => dondeEsta({ contentSize: { height: alto }, layoutMeasurement: { height: 800 }, contentOffset: { y } });

  it('la distancia al final, con el alto del contenido', () => {
    expect(evento(2000, 1000)).toEqual({ alto: 2000, alFinal: 200 });
  });

  it('el ajuste del ancla no es la persona: creció lo de arriba y el scroll corrió lo mismo', () => {
    expect(loMovioLaPersona(evento(2000, 1200), evento(2300, 1500))).toBe(false);
    expect(loMovioLaPersona(evento(2000, 700), evento(2300, 1000))).toBe(false);
    // Ni lo que creció abajo sin mover el scroll, ni volver al final.
    expect(loMovioLaPersona(evento(2000, 1200), evento(2200, 1200))).toBe(false);
    expect(loMovioLaPersona(evento(2000, 700), evento(2000, 1200))).toBe(false);
  });

  it('VoiceOver, Control por voz o el teclado: el mismo alto y otra distancia al final', () => {
    expect(loMovioLaPersona(evento(2000, 1200), evento(2000, 600))).toBe(true);
    // Medio punto de redondeo no cuenta.
    expect(loMovioLaPersona(evento(2000, 600), evento(2000, 600.5))).toBe(false);
  });
});
