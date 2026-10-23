Pod::Spec.new do |s|
  s.name           = 'Movimiento'
  s.version        = '1.0.0'
  s.summary        = 'Lee el historial de movimiento del iPhone para estimar la noche sin reloj'
  s.description    = 'Lee el historial de movimiento del iPhone (CMMotionActivityManager) de los últimos días, en el teléfono, para estimar cuándo dormiste sin un reloj.'
  s.author         = 'Moss'
  s.homepage       = 'https://github.com/condezuzu/moss'
  s.license        = { :type => 'UNLICENSED' }
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/condezuzu/moss.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreMotion'

  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
