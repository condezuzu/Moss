Pod::Spec.new do |s|
  s.name           = 'LeerEtiqueta'
  s.version        = '1.0.0'
  s.summary        = 'Lee la tabla de una etiqueta nutricional con Vision'
  s.description    = 'Lee las filas de texto de la foto de una etiqueta nutricional con Vision, en el teléfono y sin conexión.'
  s.author         = 'Moss'
  s.homepage       = 'https://github.com/condezuzu/moss'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/condezuzu/moss.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
