import CoreMotion
import ExpoModulesCore

// El historial de movimiento del iPhone (CMMotionActivityManager), para estimar la noche sin reloj
// (spec/sueno.md, «Sin reloj»). El teléfono guarda los últimos 7 días aunque Moss esté cerrada: se
// consulta a la mañana y nada corre de noche. Lo que significa cada cambio lo decide el dominio
// (src/dominio/sinReloj.ts).
public class MovimientoModule: Module {
  private let gestor = CMMotionActivityManager()
  private let cola = OperationQueue()

  public func definition() -> ModuleDefinition {
    Name("Movimiento")

    Function("permiso") { () -> String in
      MovimientoModule.permiso()
    }

    // La primera consulta muestra el pedido del sistema: vuelve cuando la persona contesta.
    AsyncFunction("pedir") { (promise: Promise) in
      guard CMMotionActivityManager.isActivityAvailable() else {
        promise.resolve("noDisponible")
        return
      }
      let ahora = Date()
      self.gestor.queryActivityStarting(from: ahora.addingTimeInterval(-60), to: ahora, to: self.cola) { _, _ in
        promise.resolve(MovimientoModule.permiso())
      }
    }

    // Los cambios entre `desde` y `hasta` (en milisegundos): desde cuándo y qué, con su confianza (0 a 2).
    AsyncFunction("consultar") { (desde: Double, hasta: Double, promise: Promise) in
      guard MovimientoModule.permiso() == "permitido" else {
        promise.resolve([[String: Any]]())
        return
      }
      let inicio = Date(timeIntervalSince1970: desde / 1000)
      let fin = Date(timeIntervalSince1970: hasta / 1000)
      self.gestor.queryActivityStarting(from: inicio, to: fin, to: self.cola) { actividades, error in
        if let error = error {
          promise.reject("E_MOVIMIENTO", error.localizedDescription)
          return
        }
        let lista = (actividades ?? []).map { a -> [String: Any] in
          [
            "en": a.startDate.timeIntervalSince1970 * 1000,
            "quieto": a.stationary,
            "caminando": a.walking,
            "corriendo": a.running,
            "auto": a.automotive,
            "bici": a.cycling,
            "confianza": a.confidence.rawValue,
          ]
        }
        promise.resolve(lista)
      }
    }
  }

  /// Si el teléfono puede y qué contestó la persona.
  static func permiso() -> String {
    if !CMMotionActivityManager.isActivityAvailable() {
      return "noDisponible"
    }
    switch CMMotionActivityManager.authorizationStatus() {
    case .authorized: return "permitido"
    case .denied: return "negado"
    case .restricted: return "restringido"
    case .notDetermined: return "sinPreguntar"
    @unknown default: return "sinPreguntar"
    }
  }
}
