internal import ExpoModulesCore
import StoreKit

// La suscripción (spec/suscripcion.md), con StoreKit 2: sin servidor ni terceros. El teléfono le pregunta a
// Apple qué tiene comprado, así que anda sin conexión y en cualquier aparato con el mismo Apple ID. Lo que
// se le muestra a la persona lo decide JavaScript (src/lib/premium.ts). El nombre de la clase es el del
// archivo: así lo registran los módulos en línea.
final class Compras: Module {
  private var oyente: Task<Void, Never>?

  public func definition() -> ExpoModulesCore.ModuleDefinition {
    Name("Compras")

    Events("alCambiar")

    // Lo que pasa fuera de la compra: renovaciones, reembolsos y lo que aprueba quien administra la familia.
    OnStartObserving {
      self.oyente?.cancel()
      self.oyente = Task { [weak self] in
        for await resultado in StoreKit.Transaction.updates {
          if case .verified(let transaccion) = resultado {
            await transaccion.finish()
          }
          self?.sendEvent("alCambiar", [:])
        }
      }
    }

    OnStopObserving {
      self.oyente?.cancel()
      self.oyente = nil
    }

    AsyncFunction("productos") { (ids: [String]) async throws -> [[String: Any]] in
      var lista: [[String: Any]] = []
      for producto in try await StoreKit.Product.products(for: ids) {
        lista.append(await Compras.datos(de: producto))
      }
      return lista
    }

    // Lo vigente, o null. Un pago que falló y está en su gracia sigue acá.
    AsyncFunction("estado") { () async throws -> [String: Any]? in
      return await Compras.estadoActual()
    }

    // La última que se conoce, aunque haya vencido, o null: sin conexión, Apple no puede saber que renovó.
    AsyncFunction("ultima") { (ids: [String]) async throws -> [String: Any]? in
      var ultima: StoreKit.Transaction?
      for id in ids {
        guard let resultado = await StoreKit.Transaction.latest(for: id),
              case .verified(let transaccion) = resultado,
              transaccion.revocationDate == nil else {
          continue
        }
        if (transaccion.expirationDate ?? .distantPast) > (ultima?.expirationDate ?? .distantPast) {
          ultima = transaccion
        }
      }
      guard let transaccion = ultima else {
        return nil
      }
      return await Compras.datos(de: transaccion)
    }

    // «comprado», «cancelado», «pendiente» (lo tiene que aprobar otra persona) o «error».
    AsyncFunction("comprar") { (id: String) async throws -> String in
      guard let producto = try await StoreKit.Product.products(for: [id]).first else {
        return "error"
      }
      switch try await producto.purchase() {
      case .success(let verificacion):
        guard case .verified(let transaccion) = verificacion else {
          return "error"
        }
        await transaccion.finish()
        return "comprado"
      case .userCancelled:
        return "cancelado"
      case .pending:
        return "pendiente"
      @unknown default:
        return "error"
      }
    }

    AsyncFunction("restaurar") { () async throws -> [String: Any]? in
      do {
        try await AppStore.sync()
      } catch StoreKitError.userCancelled {
        // No quiso entrar a su cuenta de Apple: no es un error, y se dice lo que ya se sabe.
      }
      return await Compras.estadoActual()
    }
  }

  /** El precio lo da Apple en la moneda de cada país, y lo escribe con sus decimales: nunca se escribe a mano. */
  private static func datos(de producto: StoreKit.Product) async -> [String: Any] {
    var prueba = 0
    if let suscripcion = producto.subscription,
       let oferta = suscripcion.introductoryOffer,
       oferta.paymentMode == .freeTrial,
       await suscripcion.isEligibleForIntroOffer {
      switch oferta.period.unit {
      case .day: prueba = oferta.period.value
      case .week: prueba = oferta.period.value * 7
      case .month: prueba = oferta.period.value * 30
      case .year: prueba = oferta.period.value * 365
      @unknown default: prueba = 0
      }
    }
    return [
      "id": producto.id,
      "precio": producto.displayPrice,
      "valor": NSDecimalNumber(decimal: producto.price).doubleValue,
      "porMes": (producto.price / 12).formatted(producto.priceFormatStyle),
      "prueba": prueba,
    ]
  }

  private static func estadoActual() async -> [String: Any]? {
    var actual: StoreKit.Transaction?
    for await resultado in StoreKit.Transaction.currentEntitlements {
      guard case .verified(let transaccion) = resultado,
            transaccion.productType == .autoRenewable,
            transaccion.revocationDate == nil else {
        continue
      }
      if (transaccion.expirationDate ?? .distantPast) > (actual?.expirationDate ?? .distantPast) {
        actual = transaccion
      }
    }
    guard let transaccion = actual else {
      return nil
    }
    return await datos(de: transaccion)
  }

  private static func datos(de transaccion: StoreKit.Transaction) async -> [String: Any] {
    var enPrueba = false
    if #available(iOS 17.2, *) {
      enPrueba = transaccion.offer?.type == .introductory
    } else {
      enPrueba = transaccion.offerType == .introductory
    }
    var renueva: Any = NSNull()
    if let estado = await estadoDeLaSuscripcion(de: transaccion), case .verified(let info) = estado.renewalInfo {
      renueva = info.willAutoRenew
    }
    return [
      "producto": transaccion.productID,
      "vence": (transaccion.expirationDate?.timeIntervalSince1970 ?? 0) * 1000,
      "prueba": enPrueba,
      "renueva": renueva,
    ]
  }

  // Moss abre desde iOS 16.4 y la transacción trae su estado recién desde iOS 17. Antes, sale del producto: de
  // los estados de su grupo (puede haber otro, de la familia), el de la misma suscripción. Si Apple no
  // contesta, nil: no se sabe si renueva.
  private static func estadoDeLaSuscripcion(de transaccion: StoreKit.Transaction) async -> StoreKit.Product.SubscriptionInfo.Status? {
    if #available(iOS 17.0, *) {
      return await transaccion.subscriptionStatus
    }
    let estados = (try? await StoreKit.Product.products(for: [transaccion.productID]).first?.subscription?.status) ?? []
    return estados.first { estado in
      guard case .verified(let suya) = estado.transaction else {
        return false
      }
      return suya.originalID == transaccion.originalID
    }
  }
}
