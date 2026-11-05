// Pasa a CommonJS, en esta carpeta, los módulos del dominio que usa la simulación (el repo solo se lee).
const fs = require('fs');
const path = require('path');
const REPO = process.argv[2];
const ts = require(path.join(REPO, 'node_modules/typescript'));
for (const m of ['fechas', 'control', 'metas', 'progreso', 'cuerpo']) {
  const fuente = fs.readFileSync(path.join(REPO, 'src/dominio', m + '.ts'), 'utf8');
  const js = ts.transpileModule(fuente, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  fs.writeFileSync(path.join(__dirname, 'dominio', m + '.js'), js);
  console.log(m, js.length);
}
