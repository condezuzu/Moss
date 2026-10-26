internal import ExpoModulesCore

// El despertador de Moss (spec/sueno-sin-esfuerzo.md, «El despertador»): una sola alarma de AlarmKit,
// la que pone la persona en Sueño, con su hora y sus días. Lo de AlarmKit está en AlarmasDeMoss.swift;
// antes de iOS 26 el módulo dice que no está disponible y Sueño no muestra la fila. El nombre de la
// clase es el del archivo: así lo registran los módulos en línea.
final class Despertador: Module {
  public func definition() -> ExpoModulesCore.ModuleDefinition {
    Name("Despertador")

    Function("disponible") { () -> Bool in
      if #available(iOS 26.0, *) {
        return true
      }
      return false
    }

    AsyncFunction("permiso") { () async -> String in
      if #available(iOS 26.0, *) {
        return AlarmasDeMoss.permiso()
      }
      return "noDisponible"
    }

    // La primera vez muestra el pedido del sistema; después, dice lo que contestó la persona.
    AsyncFunction("pedirPermiso") { () async throws -> String in
      if #available(iOS 26.0, *) {
        return try await AlarmasDeMoss.pedirPermiso()
      }
      return "noDisponible"
    }

    // La alarma puesta, con su hora y sus días (0 es domingo), o null.
    AsyncFunction("programada") { () async throws -> [String: Any]? in
      if #available(iOS 26.0, *) {
        return try AlarmasDeMoss.programada()
      }
      return nil
    }

    // Los textos de la alarma llegan de JavaScript (src/textos/es.json y en.json).
    AsyncFunction("programar") { (hora: Int, minuto: Int, dias: [Int], titulo: String, detener: String) async throws -> String in
      if #available(iOS 26.0, *) {
        return try await AlarmasDeMoss.programar(hora: hora, minuto: minuto, dias: dias, titulo: titulo, detener: detener)
      }
      return ""
    }

    AsyncFunction("cancelar") { () async throws -> Bool in
      if #available(iOS 26.0, *) {
        try AlarmasDeMoss.cancelar()
      }
      return true
    }
  }
}
