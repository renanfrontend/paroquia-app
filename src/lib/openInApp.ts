import { Linking } from 'react-native'
import * as WebBrowser from 'expo-web-browser'

/**
 * Abre um texto da fonte (leituras completas, matéria da Igreja) dentro do app:
 * no Android é uma tela por cima do app (Custom Tab) com botão de fechar; no iOS, a folha do Safari;
 * na versão web, uma nova aba. O conteúdo continua vindo do site da fonte, sem copiar textos protegidos.
 */
export async function openInApp(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#dc2626',
      controlsColor: '#ffffff',
      secondaryToolbarColor: '#991b1b',
      showTitle: true,
      enableBarCollapsing: true,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    })
  } catch {
    // Sem navegador integrado disponível: abre no navegador do aparelho.
    await Linking.openURL(url)
  }
}
