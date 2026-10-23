import ExpoModulesCore

// Saca una carpeta de la copia de seguridad del iPhone (iCloud y la computadora): la de SQLite, donde
// Moss guarda lo comido, el peso y las noches. La guía 5.1.3(ii) de Apple no deja guardar datos de
// salud en iCloud, y lo de la cuenta ya está en el servidor. Lo de adentro hereda la marca.
public class RespaldoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Respaldo")

    // true si quedó marcada; false si la carpeta no existe o no se pudo.
    Function("excluir") { (ruta: String) -> Bool in
      var url = URL(fileURLWithPath: ruta, isDirectory: true)
      guard FileManager.default.fileExists(atPath: url.path) else { return false }
      var valores = URLResourceValues()
      valores.isExcludedFromBackup = true
      do {
        try url.setResourceValues(valores)
        return true
      } catch {
        return false
      }
    }
  }
}
