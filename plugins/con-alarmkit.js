// AlarmKit existe desde iOS 26 y Moss abre desde 16.4: el framework se enlaza como opcional, así un
// iPhone viejo abre la app sin él (spec/sueno-sin-esfuerzo.md, «El despertador»). El enlace automático
// de Swift a un framework más nuevo que el mínimo no siempre queda opcional, por eso va explícito.

const { withXcodeProject } = require('expo/config-plugins');

const BANDERA = '"-weak_framework"';
const FRAMEWORK = '"AlarmKit"';

module.exports = function conAlarmKit(config) {
  return withXcodeProject(config, (config) => {
    const proyecto = config.modResults;
    const destino = proyecto.getFirstTarget();
    const listas = proyecto.pbxXCConfigurationList();
    const configuraciones = proyecto.pbxXCBuildConfigurationSection();
    const lista = listas[destino.firstTarget.buildConfigurationList];
    for (const { value } of lista.buildConfigurations) {
      const ajustes = configuraciones[value].buildSettings;
      const banderas = [].concat(ajustes.OTHER_LDFLAGS ?? ['"$(inherited)"']);
      if (!banderas.includes(FRAMEWORK)) banderas.push(BANDERA, FRAMEWORK);
      ajustes.OTHER_LDFLAGS = banderas;
    }
    return config;
  });
};
