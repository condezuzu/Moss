import AlarmKit
import AppIntents
import SwiftUI

// Lo de AlarmKit del despertador de Moss (Despertador.swift), todo desde iOS 26. AlarmKit se enlaza
// como opcional (plugins/con-alarmkit.js): en un iPhone más viejo nada de esto se toca. Sin cuenta
// regresiva ni «posponer», así que no hace falta una Live Activity en una extensión.

/// Lo que AlarmKit guarda de cada alarma además de lo de fábrica: nada.
@available(iOS 26.0, *)
struct MetadatosDelDespertador: AlarmMetadata {}

@available(iOS 26.0, *)
enum AlarmasDeMoss {
  /// De domingo a sábado, como los días de JavaScript.
  static let semana: [Locale.Weekday] = [.sunday, .monday, .tuesday, .wednesday, .thursday, .friday, .saturday]

  static func permiso() -> String {
    return nombre(de: AlarmManager.shared.authorizationState)
  }

  static func pedirPermiso() async throws -> String {
    let estado = try await AlarmManager.shared.requestAuthorization()
    return nombre(de: estado)
  }

  /// La alarma de Moss, si hay: la hora, los minutos y los días (sin días, suena una vez).
  static func programada() throws -> [String: Any]? {
    for alarma in try AlarmManager.shared.alarms {
      guard case .relative(let relativa)? = alarma.schedule else { continue }
      var dias: [Int] = []
      if case .weekly(let lista) = relativa.repeats {
        dias = lista.compactMap { semana.firstIndex(of: $0) }
      }
      return ["hora": relativa.time.hour, "minuto": relativa.time.minute, "dias": dias]
    }
    return nil
  }

  /// Reemplaza la alarma de Moss por una nueva: siempre hay una sola.
  static func programar(hora: Int, minuto: Int, dias: [Int], titulo: String, detener: String) async throws -> String {
    try cancelar()
    let repetir = dias.compactMap { semana.indices.contains($0) ? semana[$0] : nil }
    let horario = Alarm.Schedule.relative(
      Alarm.Schedule.Relative(
        time: Alarm.Schedule.Relative.Time(hour: hora, minute: minuto),
        repeats: repetir.isEmpty ? .never : .weekly(repetir)
      )
    )
    let atributos = AlarmAttributes<MetadatosDelDespertador>(
      presentation: AlarmPresentation(alert: alerta(titulo: titulo, detener: detener)),
      metadata: nil,
      tintColor: Color(red: 0.91, green: 0.77, blue: 0.42)
    )
    let id = UUID()
    let configuracion = AlarmManager.AlarmConfiguration(
      countdownDuration: nil,
      schedule: horario,
      attributes: atributos,
      stopIntent: PareElDespertador(),
      secondaryIntent: nil
    )
    _ = try await AlarmManager.shared.schedule(id: id, configuration: configuracion)
    return id.uuidString
  }

  static func cancelar() throws {
    for alarma in try AlarmManager.shared.alarms {
      try AlarmManager.shared.cancel(id: alarma.id)
    }
  }

  private static func alerta(titulo: String, detener: String) -> AlarmPresentation.Alert {
    let texto = LocalizedStringResource(stringLiteral: titulo)
    if #available(iOS 26.1, *) {
      return AlarmPresentation.Alert(title: texto)
    }
    // En iOS 26.0 el botón de parar lo pone la app; desde la 26.1 lo pone el sistema.
    return AlarmPresentation.Alert(
      title: texto,
      stopButton: AlarmButton(text: LocalizedStringResource(stringLiteral: detener), textColor: .white, systemImageName: "stop.fill"),
      secondaryButton: nil,
      secondaryButtonBehavior: nil
    )
  }

  private static func nombre(de estado: AlarmManager.AuthorizationState) -> String {
    switch estado {
    case .authorized: return "permitido"
    case .denied: return "denegado"
    case .notDetermined: return "sinPedir"
    @unknown default: return "sinPedir"
    }
  }
}
