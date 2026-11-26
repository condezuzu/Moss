internal import ExpoModulesCore
import StoreKit
import UIKit

// Pedir la reseña de la App Store. iOS decide si muestra el cartel (como mucho 3 veces en 365 días) y nunca dice si lo
// mostró: Moss solo elige cuándo pedirlo (src/dominio/resena.ts y src/lib/resena.ts). Sin una escena activa, no pide.
// El nombre de la clase es el del archivo: así lo registran los módulos en línea.
final class Resena: Module {
  public func definition() -> ExpoModulesCore.ModuleDefinition {
    Name("Resena")

    AsyncFunction("pedir") { () async -> Bool in
      await MainActor.run {
        guard let escena = UIApplication.shared.connectedScenes
          .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene else { return false }
        AppStore.requestReview(in: escena)
        return true
      }
    }
  }
}
