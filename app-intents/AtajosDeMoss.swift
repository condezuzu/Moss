import AppIntents

// Las frases para Siri y el botón de Acción: solo las dos que se dicen a mano. Cada frase lleva el
// nombre de la app y una app tiene como mucho 10 atajos. Las frases van en inglés, el idioma de
// desarrollo del proyecto (developmentRegion = en); las de español están en es.lproj/AppShortcuts.strings.
struct AtajosDeMoss: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: MeVoyADormir(),
      phrases: [
        "\(.applicationName), I'm going to sleep",
        "Tell \(.applicationName) I'm going to sleep",
      ],
      shortTitle: "Me voy a dormir",
      systemImageName: "bed.double"
    )
    AppShortcut(
      intent: MeDesperte(),
      phrases: [
        "\(.applicationName), I woke up",
        "Tell \(.applicationName) I woke up",
      ],
      shortTitle: "Me desperté",
      systemImageName: "sun.max"
    )
  }
}
