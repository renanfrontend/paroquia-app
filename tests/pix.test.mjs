// Testes do gerador de PIX (BR Code). Rodar com: npm test (Node 22.6+).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPixPayload,
  crc16,
  isValidPixPayload,
  normalizePixKey,
  parsePixPayload,
  sanitizePixText,
} from '../src/lib/pix.ts'

// Exemplo de QR Code estático do Manual de Padrões para Iniciação do Pix (Banco Central).
const BCB_EXAMPLE =
  '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D'

test('CRC16 confere com o exemplo oficial do Banco Central', () => {
  assert.equal(crc16(BCB_EXAMPLE.slice(0, -4)), '1D3D')
  assert.equal(isValidPixPayload(BCB_EXAMPLE), true)
})

test('reproduz exatamente o exemplo oficial do Banco Central', () => {
  const payload = buildPixPayload({
    key: '123e4567-e12b-12d1-a456-426655440000',
    keyType: 'ALEATORIA',
    merchantName: 'Fulano de Tal',
    merchantCity: 'BRASILIA',
  })
  assert.equal(payload, BCB_EXAMPLE)
})

test('com valor: campo 54 formatado e CRC válido', () => {
  const payload = buildPixPayload({
    key: '12.345.678/0001-95',
    keyType: 'CNPJ',
    merchantName: 'Paróquia Nossa Senhora das Graças',
    merchantCity: 'São Paulo',
    amount: 50,
    description: 'Dízimo',
  })
  const fields = parsePixPayload(payload)
  assert.equal(fields['54'], '50.00')
  assert.equal(fields['59'], 'Paroquia Nossa Senhora da')
  assert.equal(fields['60'], 'Sao Paulo')
  const account = parsePixPayload(fields['26'])
  assert.equal(account['00'], 'br.gov.bcb.pix')
  assert.equal(account['01'], '12345678000195')
  assert.equal(account['02'], 'Dizimo')
  assert.equal(isValidPixPayload(payload), true)
})

test('sem valor: não inclui o campo 54 (quem paga digita o valor)', () => {
  const fields = parsePixPayload(
    buildPixPayload({ key: 'contato@paroquia.org.br', merchantName: 'Paroquia', merchantCity: 'Recife' }),
  )
  assert.equal(fields['54'], undefined)
  assert.equal(parsePixPayload(fields['62'])['05'], '***')
})

test('valores com centavos e arredondamento', () => {
  const fields = parsePixPayload(
    buildPixPayload({ key: 'a@b.com', merchantName: 'X', merchantCity: 'Y', amount: 19.999 }),
  )
  assert.equal(fields['54'], '20.00')
})

test('normaliza a chave conforme o tipo', () => {
  assert.equal(normalizePixKey('123.456.789-09', 'CPF'), '12345678909')
  assert.equal(normalizePixKey('(11) 98765-4321', 'TELEFONE'), '+5511987654321')
  assert.equal(normalizePixKey('+55 11 98765-4321', 'TELEFONE'), '+5511987654321')
  assert.equal(normalizePixKey('Contato@Paroquia.ORG.br', 'EMAIL'), 'contato@paroquia.org.br')
})

test('recusa dados que o banco não aceitaria', () => {
  assert.throws(() => buildPixPayload({ key: '', merchantName: 'X', merchantCity: 'Y' }))
  assert.throws(() => buildPixPayload({ key: 'a@b.com', merchantName: '', merchantCity: 'Y' }))
  assert.throws(() => buildPixPayload({ key: 'a@b.com', merchantName: 'X', merchantCity: 'Y', amount: 0 }))
  assert.equal(sanitizePixText('Igreja São João Batista — Matriz', 25), 'Igreja Sao Joao Batista M')
})

test('detecta código adulterado', () => {
  const payload = buildPixPayload({ key: 'a@b.com', merchantName: 'X', merchantCity: 'Y', amount: 10 })
  assert.equal(isValidPixPayload(payload.replace('10.00', '99.00')), false)
})
