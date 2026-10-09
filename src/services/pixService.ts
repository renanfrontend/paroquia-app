import { supabase } from '@/lib/supabase'
import { buildPixPayload } from '@/lib/pix'
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
   * Código PIX "copia e cola" no padrão BR Code do Banco Central (src/lib/pix.ts).
   * O mesmo texto vai no QR Code. Sem valor, quem contribui digita o valor no app do banco.
   * Devolve string vazia se os dados da paróquia estiverem incompletos.
   */
  generatePixQrCodeString(info: Pick<TitheInfo, 'pix_key' | 'pix_key_type' | 'parish_name' | 'city'>, amount?: number): string {
    try {
      return buildPixPayload({
        key: info.pix_key,
        keyType: info.pix_key_type,
        merchantName: info.parish_name,
        merchantCity: info.city,
        amount,
        description: 'Dizimo',
      })
    } catch (error) {
      console.error('Dados de PIX inválidos:', error)
      return ''
    }
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
