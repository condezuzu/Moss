// De las marcas de afuera entra lo que acá se conoce, no cada edición de otro país (herramientas/marcas.mjs). Lo
// comprueba también herramientas/verificar-alimentos.mjs. Se prueba sobre el nombre llano (sin tildes ni signos) y
// sin la marca, que siempre está en el nombre: «Gazpacho Pepsi» no es de ninguna, y «Pepsi» sola es la de siempre.
export const LINEAS = {
  "Kellogg's": /corn ?flakes|zucaritas|froot ?loops|choco ?krispi|special ?k|all.?bran|krave|rice ?krispies|musli|muesli|granola|smacks|choco ?pops|cereal/i,
  Nesquik: /cacao|polvo|chocolate en|cereal|bebida|listo|leche/i,
  Quaker: /avena|oat|granola|barra|cereal/i,
  'Coca-Cola': /coca|sin azucar|zero|light|original|cherry/i,
  Pepsi: /cola|black|twist|zero|max|diet|light|sin azucar/i,
};
