// «Sin déficit» con el peso que sube como en el embarazo (IOM 2009: unos 0,42 kg por semana en el 2.º y 3.er
// trimestre con IMC normal): ¿qué hace el control de cada semana con las calorías?
const { sumarDias } = require('./dominio/fechas');
const { controlSemanal } = require('./dominio/control');
const INICIO = '2026-01-05';
const perfil = { edad: 30, sexo: 'f', pesoKg: 62, objetivo: 'mantener', ritmo: 'recomendado', sinDeficit: true };
let gasto = 2200, metas = { kcal: 2200, proteina: 99, carbohidratos: 300, grasas: 66 };
const pesadas = [], comidas = [];
for (let t = 0; t < 7 * 16; t++) {
  const fecha = sumarDias(INICIO, t);
  pesadas.push({ fecha, kg: 62 + (0.42 / 7) * t });
  comidas.push({ fecha, kcal: 2200 }); // come siempre lo mismo
}
for (let semana = 1; semana <= 16; semana++) {
  const hoy = sumarDias(INICIO, 7 * semana);
  const c = controlSemanal({ hoy, pesadas: pesadas.filter((p) => p.fecha < hoy), comidas: comidas.filter((x) => x.fecha < hoy), gastoAnterior: gasto, metasAnteriores: metas, perfil });
  gasto = c.gasto; metas = c.metas;
  if ([1, 2, 4, 8, 12, 16].includes(semana)) console.log(`semana ${semana}: gasto medido ${c.datos.gastoMedido}, gasto que toma ${c.gasto}, meta ${c.metas.kcal} kcal (${c.motivo})`);
}
