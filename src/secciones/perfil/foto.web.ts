// En la web de prueba no hay cámara ni carpeta de la app: sin foto, Perfil muestra la inicial
// (en el teléfono, foto.ts).

export const hayFotoDePerfil = false;

export const fotoDePerfil = (): string | null => null;

export const elegirFotoDePerfil = async (_desde: 'camara' | 'carrete'): Promise<string | null> => null;

export const guardarFotoDePerfil = async (_uri: string): Promise<string | null> => null;

export const borrarFotoDePerfil = (): void => {};
