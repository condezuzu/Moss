import { describe, expect, it } from '@jest/globals';

import { inicialDe, LARGO_DEL_NOMBRE, leerNombre, limpiarNombre, nombreDeLasPartes } from './nombre';

describe('tu nombre', () => {
  it('se guarda sin espacios de más ni saltos de línea', () => {
    expect(limpiarNombre('  Agustín   Conde \n')).toBe('Agustín Conde');
    expect(limpiarNombre('   ')).toBe('');
  });

  it('no pasa de lo que guarda la cuenta, contando letras y no pedazos', () => {
    expect([...limpiarNombre('a'.repeat(80))]).toHaveLength(LARGO_DEL_NOMBRE);
    // Una letra fuera del plano básico cuenta como una y no queda partida.
    const largo = limpiarNombre('𝒜'.repeat(LARGO_DEL_NOMBRE + 5));
    expect([...largo]).toHaveLength(LARGO_DEL_NOMBRE);
    expect(largo.endsWith('𝒜')).toBe(true);
    // Cortado justo después de un espacio, no queda el espacio al final.
    expect(limpiarNombre(`${'a'.repeat(LARGO_DEL_NOMBRE - 1)} b`)).toBe('a'.repeat(LARGO_DEL_NOMBRE - 1));
  });

  it('la inicial es la primera letra, en mayúscula; sin nombre, nada', () => {
    expect(inicialDe('agustín')).toBe('A');
    expect(inicialDe('  Ñandú')).toBe('Ñ');
    expect(inicialDe('élodie')).toBe('É');
    expect(inicialDe('')).toBe('');
  });

  it('lo que trae Apple: el de pila y el apellido, o lo que haya', () => {
    expect(nombreDeLasPartes({ givenName: 'Agustín', familyName: 'Conde' })).toBe('Agustín Conde');
    expect(nombreDeLasPartes({ givenName: 'Agustín', familyName: null })).toBe('Agustín');
    expect(nombreDeLasPartes({ givenName: null, familyName: null })).toBe('');
    expect(nombreDeLasPartes(null)).toBe('');
  });

  it('lo guardado se lee solo si tiene forma', () => {
    expect(leerNombre({ valor: ' Ana ', actualizado: '2026-10-26T12:00:00.000Z' })).toEqual({ valor: 'Ana', actualizado: '2026-10-26T12:00:00.000Z' });
    expect(leerNombre({ valor: '', actualizado: '2026-10-26T12:00:00.000Z' })).toEqual({ valor: '', actualizado: '2026-10-26T12:00:00.000Z' });
    expect(leerNombre({ valor: 'Ana' })).toBeNull();
    expect(leerNombre({ valor: 3, actualizado: '2026-10-26T12:00:00.000Z' })).toBeNull();
    expect(leerNombre({ valor: 'Ana', actualizado: 'ayer' })).toBeNull();
    expect(leerNombre(null)).toBeNull();
  });
});
