/**
 * PIX "copia e cola" e QR Code estático no padrão BR Code (EMV® QRCPS-MPM) do Banco Central,
 * conforme o Manual de Padrões para Iniciação do Pix. Sem dependências: pode ser testado com Node puro.
 *
 * Estrutura: campos ID (2 dígitos) + TAMANHO (2 dígitos) + VALOR, terminando no CRC16 (campo 63).
 */

export type PixKeyType = 'CNPJ' | 'CPF' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA'

export interface PixPayloadInput {
  /** Chave PIX cadastrada no banco. */
  key: string
  /** Tipo da chave; define como ela é normalizada (CNPJ/CPF só dígitos, telefone em +55...). */
  keyType?: string
  /** Nome do recebedor (até 25 caracteres, sem acentos). */
  merchantName: string
  /** Cidade do recebedor (até 15 caracteres, sem acentos). */
  merchantCity: string
  /** Valor em reais; sem valor, quem paga digita no app do banco. */
  amount?: number
  /** Mensagem opcional exibida a quem paga (ex.: "Dizimo"). */
  description?: string
  /** Identificador da transação; "***" para QR estático reutilizável. */
  txid?: string
}

const field = (id: string, value: string): string => {
  if (value.length > 99) throw new Error(`Campo ${id} do PIX passou de 99 caracteres`)
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

/** Remove acentos e caracteres fora do conjunto aceito pelos bancos. */
export const sanitizePixText = (text: string, max: number): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 .,/@:+\-*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim()

/** Normaliza a chave conforme o tipo (o banco recusa CNPJ com pontuação, por exemplo). */
export const normalizePixKey = (key: string, keyType?: string): string => {
  const type = (keyType ?? '').toUpperCase()
  const raw = key.trim()
  if (type === 'CNPJ' || type === 'CPF') return raw.replace(/\D/g, '')
  if (type === 'TELEFONE' || type === 'PHONE' || type === 'CELULAR') {
    const digits = raw.replace(/\D/g, '')
    return digits.startsWith('55') && digits.length > 11 ? `+${digits}` : `+55${digits}`
  }
  if (type === 'EMAIL' || raw.includes('@')) return raw.toLowerCase()
  return raw
}

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63. */
export const crc16 = (payload: string): string => {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export const formatPixAmount = (amount: number): string => {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Valor do PIX deve ser maior que zero')
  const value = amount.toFixed(2)
  if (value.length > 13) throw new Error('Valor do PIX acima do limite')
  return value
}

/** Monta o código PIX (o mesmo texto vai no QR Code e no "copia e cola"). */
export const buildPixPayload = (input: PixPayloadInput): string => {
  const key = normalizePixKey(input.key, input.keyType)
  if (!key) throw new Error('Chave PIX vazia')

  const name = sanitizePixText(input.merchantName, 25)
  const city = sanitizePixText(input.merchantCity, 15)
  if (!name || !city) throw new Error('Nome e cidade do recebedor são obrigatórios no PIX')

  const description = input.description ? sanitizePixText(input.description, 72) : ''
  const txid = (input.txid ?? '***').replace(/[^A-Za-z0-9*]/g, '').slice(0, 25) || '***'

  const merchantAccount = field('00', 'br.gov.bcb.pix') + field('01', key) + (description ? field('02', description) : '')

  const payload =
    field('00', '01') +
    field('26', merchantAccount) +
    field('52', '0000') +
    field('53', '986') +
    (input.amount !== undefined ? field('54', formatPixAmount(input.amount)) : '') +
    field('58', 'BR') +
    field('59', name) +
    field('60', city) +
    field('62', field('05', txid)) +
    '6304'

  return payload + crc16(payload)
}

/** Lê os campos de um código PIX (usado nos testes e para conferir códigos recebidos). */
export const parsePixPayload = (payload: string): Record<string, string> => {
  const out: Record<string, string> = {}
  let i = 0
  while (i < payload.length) {
    const id = payload.slice(i, i + 2)
    const length = Number(payload.slice(i + 2, i + 4))
    if (!/^\d{2}$/.test(id) || !Number.isInteger(length)) throw new Error('Código PIX malformado')
    out[id] = payload.slice(i + 4, i + 4 + length)
    i += 4 + length
  }
  return out
}

/** Confere se o CRC do código bate (é o que o app do banco faz ao ler o QR). */
export const isValidPixPayload = (payload: string): boolean =>
  payload.length > 8 && payload.slice(-8, -4) === '6304' && crc16(payload.slice(0, -4)) === payload.slice(-4)
