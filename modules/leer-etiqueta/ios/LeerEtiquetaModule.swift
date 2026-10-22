import ExpoModulesCore
import UIKit
import Vision

// Lee el texto de la foto de una etiqueta con Vision, en el teléfono y sin conexión
// (spec/nutricion.md, «Escáner de etiqueta»). Devuelve las filas de arriba abajo: lo que está a la
// misma altura va en la misma fila, de izquierda a derecha, así una fila de la tabla
// («Proteínas 2,4 g 3») llega junta aunque Vision la vea en pedazos. Lo que significa cada fila lo
// decide el lector en TypeScript (src/comida/etiqueta.ts).
public class LeerEtiquetaModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LeerEtiqueta")

    AsyncFunction("leer") { (uri: String, promise: Promise) in
      guard let url = URL(string: uri), let datos = try? Data(contentsOf: url), let imagen = UIImage(data: datos), let cg = imagen.cgImage else {
        promise.reject("E_FOTO", "No se pudo abrir la foto")
        return
      }
      let pedido = VNRecognizeTextRequest { hecho, error in
        if let error = error {
          promise.reject("E_VISION", error.localizedDescription)
          return
        }
        let vistos = (hecho.results as? [VNRecognizedTextObservation]) ?? []
        promise.resolve(LeerEtiquetaModule.filas(vistos))
      }
      pedido.recognitionLevel = .accurate
      // Los números importan más que las palabras: sin corrección, un «8» no se vuelve «B».
      pedido.usesLanguageCorrection = false
      pedido.recognitionLanguages = ["es-ES", "en-US", "pt-BR"]
      let manejador = VNImageRequestHandler(cgImage: cg, orientation: LeerEtiquetaModule.orientacion(imagen.imageOrientation), options: [:])
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          try manejador.perform([pedido])
        } catch {
          promise.reject("E_VISION", error.localizedDescription)
        }
      }
    }
  }

  struct Pieza {
    let texto: String
    let y: CGFloat
    let alto: CGFloat
    let x: CGFloat
  }

  /// Las piezas en filas: dos piezas están en la misma fila si sus centros están a menos de media altura.
  static func filas(_ vistos: [VNRecognizedTextObservation]) -> [String] {
    // Las coordenadas de Vision van de 0 a 1, con el origen abajo a la izquierda.
    let piezas = vistos.compactMap { o -> Pieza? in
      guard let texto = o.topCandidates(1).first?.string else { return nil }
      let caja = o.boundingBox
      return Pieza(texto: texto, y: caja.midY, alto: caja.height, x: caja.minX)
    }.sorted { $0.y > $1.y }
    var filas: [[Pieza]] = []
    for pieza in piezas {
      if let primera = filas.last?.first, abs(primera.y - pieza.y) < max(primera.alto, pieza.alto) * 0.5 {
        filas[filas.count - 1].append(pieza)
      } else {
        filas.append([pieza])
      }
    }
    return filas.map { fila in fila.sorted { $0.x < $1.x }.map { $0.texto }.joined(separator: " ") }
  }

  /// La foto del iPhone viene de costado con una marca de cómo girarla: Vision la lee derecha.
  static func orientacion(_ o: UIImage.Orientation) -> CGImagePropertyOrientation {
    switch o {
    case .up: return .up
    case .down: return .down
    case .left: return .left
    case .right: return .right
    case .upMirrored: return .upMirrored
    case .downMirrored: return .downMirrored
    case .leftMirrored: return .leftMirrored
    case .rightMirrored: return .rightMirrored
    @unknown default: return .up
    }
  }
}
