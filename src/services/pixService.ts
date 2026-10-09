import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type TitheInfo = Database['public']['Tables']['tithe_info']['Row']

export const pixService = {
  /**
   * Buscar informações de PIX da paróquia
   */
  async getTitheInfo(): Promise<TitheInfo | null> {
    const { data, error } = await supabase
      .from('tithe_info')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching tithe info:', error)
      throw error
    }

    return data || null
  },

  /**
   * Gerar QR Code PIX (geralmente usando uma lib como qrcode)
   * Retorna a string que deve ser codificada em QR
   */
  generatePixQrCodeString(pixKey: string, amount?: number): string {
    /**
     * Format EMV (BR Code) para PIX estático/dinâmico
     * Simplificado - em produção usar uma lib como brcode
     */
    if (!amount) {
      // PIX estático (sem valor definido)
      return pixKey
    }

    /**
     * Formato simplificado para PIX com valor
     * Em produção: usar API official do Bacen ou lib como 'brcode'
     */
    return `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${amount}5802BR5913PAROQUIA6009SAO PAULO62230503***63047D3D`
  },

  /**
   * Formatar valor em reais com separadores
   */
  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  },

  /**
   * Validar CNPJ (checksum)
   */
  validateCNPJ(cnpj: string): boolean {
    const cleanCNPJ = cnpj.replace(/\D/g, '')

    if (cleanCNPJ.length !== 14) {
      return false
    }

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
      return false
    }

    // Calcular primeiro dígito verificador
    let size = cleanCNPJ.length - 2
    let numbers = cleanCNPJ.substring(0, size)
    const digits = cleanCNPJ.substring(size)
    let sum = 0
    let pos = size - 7

    for (let i = size; i >= 1; i--) {
      sum += Number(numbers.charAt(size - i)) * pos--
      if (pos < 2) {
        pos = 9
      }
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    if (result !== parseInt(digits.charAt(0))) {
      return false
    }

    // Calcular segundo dígito verificador
    size = size + 1
    numbers = cleanCNPJ.substring(0, size)
    sum = 0
    pos = size - 7

    for (let i = size; i >= 1; i--) {
      sum += Number(numbers.charAt(size - i)) * pos--
      if (pos < 2) {
        pos = 9
      }
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    if (result !== parseInt(digits.charAt(1))) {
      return false
    }

    return true
  },

  /**
   * Formatar CNPJ para exibição
   */
  formatCNPJ(cnpj: string): string {
    const clean = cnpj.replace(/\D/g, '')
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  },

  /**
   * Valores pré-definidos para sugestão de doação
   */
  getSuggestedAmounts(): number[] {
    return [20, 50, 100, 200]
  },

  /**
   * Mensagem de agradecimento personalizada
   */
  generateThankYouMessage(amount: number, parishName: string): string {
    return `✨ Deus abençoe sua generosidade! Você transferiu ${this.formatCurrency(amount)} via PIX para ${parishName}. Sua contribuição ajuda a manter nossa comunidade forte na fé. 🙏`
  },
}
