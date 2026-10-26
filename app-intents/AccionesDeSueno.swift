import AppIntents
internal import ExpoAppIntents

// Las acciones de Moss para las automatizaciones de Atajos (spec/sueno-sin-esfuerzo.md): cada una solo
// deja constancia de qué pasó, y JavaScript la guarda como ancla de la noche al abrir Moss
// (src/secciones/sueno/RecibirAnclas.tsx). La hora es la de la invocación. Sin openAppWhenRun corren
// en segundo plano, sin abrir la app. Los títulos se traducen con Localizable.strings («Localizable.strings»
// en locales/es.json y locales/en.json).

struct PareLaAlarma: AppIntent {
  static let title: LocalizedStringResource = "Paré la alarma"

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "alarmaParada")
    return .result()
  }
}

struct ConecteElCargador: AppIntent {
  static let title: LocalizedStringResource = "Conecté el cargador"

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "cargadorConectado")
    return .result()
  }
}

struct DesconecteElCargador: AppIntent {
  static let title: LocalizedStringResource = "Desconecté el cargador"

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "cargadorDesconectado")
    return .result()
  }
}

struct EmpezoElEnfoqueSueno: AppIntent {
  static let title: LocalizedStringResource = "Empezó el enfoque Sueño"

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "enfoqueEmpezo")
    return .result()
  }
}

struct TerminoElEnfoqueSueno: AppIntent {
  static let title: LocalizedStringResource = "Terminó el enfoque Sueño"

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "enfoqueTermino")
    return .result()
  }
}

struct MeVoyADormir: AppIntent {
  static let title: LocalizedStringResource = "Me voy a dormir"

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "meVoyADormir")
    return .result()
  }
}

struct MeDesperte: AppIntent {
  static let title: LocalizedStringResource = "Me desperté"

  @MainActor
  func perform() async throws -> some IntentResult {
    await AppIntentDispatcher.shared.dispatch(name: "meDesperte")
    return .result()
  }
}
