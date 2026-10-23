Pod::Spec.new do |s|
  s.name           = 'Respaldo'
  s.version        = '1.0.0'
  s.summary        = 'Saca la carpeta de SQLite de Moss de la copia de seguridad del iPhone'
  s.description    = 'Marca la carpeta donde Moss guarda sus datos para que no entre en la copia de seguridad de iCloud ni de la computadora (guía 5.1.3(ii) de Apple).'
  s.author         = 'Moss'
  s.homepage       = 'https://github.com/condezuzu/moss'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/condezuzu/moss.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
