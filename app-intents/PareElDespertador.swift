import AppIntents
internal import ExpoAppIntents

/// Lo que corre el sistema cuando la persona para el despertador de Moss (el stopIntent de AlarmKit,
/// en AlarmasDeMoss.swift): deja constancia, como los Atajos, sin abrir la app. AlarmKit ya para la
/// alarma solo. No aparece en Atajos: es del despertador.
@available(iOS 26.0, *)
struct PareElDespertador: LiveActivityIntent {
  static let title: LocalizedStringResource = "Paré el despertador de Moss"
  static let isDiscoverable = false

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "despertadorParado")
    return .result()
  }
}
