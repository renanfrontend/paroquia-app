// Leitura das fontes externas, sem dependências (testado em tests/update-content.test.mjs).
// Da liturgia guardamos só dados (cor, título, referências), não o texto das leituras,
// que tem direitos autorais; o app leva a pessoa à fonte para ler o texto completo.

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã', eacute: 'é', ecirc: 'ê', iacute: 'í',
  oacute: 'ó', ocirc: 'ô', otilde: 'õ', uacute: 'ú', ccedil: 'ç', ordf: 'ª', ordm: 'º',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ccedil: 'Ç', hellip: '…',
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
}

export const decodeEntities = (text) =>
  text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name] ?? match)

export const htmlToText = (html) =>
  decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()

const COLORS = { VERDE: 'VERDE', VERMELHO: 'VERMELHO', VERMELHA: 'VERMELHO', ROXO: 'ROXO', ROXA: 'ROXO', BRANCO: 'BRANCO', BRANCA: 'BRANCO', ROSA: 'ROSA', ROSACEO: 'ROSA' }
const MONTHS = { jan: 1, feb: 2, fev: 2, mar: 3, apr: 4, abr: 4, may: 5, mai: 5, jun: 6, jul: 7, aug: 8, ago: 8, sep: 9, set: 9, oct: 10, out: 10, nov: 11, dec: 12, dez: 12 }

/**
 * Lê o resumo da Liturgia Diária da Canção Nova:
 * "Cor Litúrgica: Verde 10 Oct 2026 27ª Semana do Tempo Comum | Sábado A+ A- 1ª Leitura Gl 3,22-29
 *  Salmo Sl 104(105),2-3 (R. 8a) Evangelho Lc 11,27-28 Primeira Leitura (..."
 */
export const parseLiturgy = (html) => {
  const text = htmlToText(html)
  const colorWord = text.match(/Cor Lit[uú]rgica:\s*([A-Za-zÀ-ú]+)/i)?.[1]
  const color = colorWord ? COLORS[colorWord.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()] : undefined
  const header = text.match(/Cor Lit[uú]rgica:\s*\S+\s+(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4})\s+(.+?)\s+A\+\s*A-\s*(?:-->\s*)?(.+?)\s+Primeira Leitura\s*\(/i)
  if (!color || !header) throw new Error('Formato da página de liturgia mudou: cor ou resumo não encontrados')

  const [, day, monthName, year, title, refsBlock] = header
  const month = MONTHS[monthName.toLowerCase()]
  if (!month) throw new Error(`Mês desconhecido na liturgia: ${monthName}`)
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const ref = (label, next) => refsBlock.match(new RegExp(`${label}\\s+(.+?)(?=\\s+(?:${next})\\s|$)`))?.[1]?.trim() ?? null
  const gospel = ref('Evangelho', '$^')
  if (!gospel) throw new Error('Formato da página de liturgia mudou: evangelho não encontrado')

  return {
    date,
    liturgical_color: color,
    title: title.replace(/\s*\|\s*/g, ' · ').trim(),
    first_reading_ref: ref('1ª Leitura', '2ª Leitura|Salmo|Evangelho'),
    second_reading_ref: ref('2ª Leitura', 'Salmo|Evangelho'),
    psalm_ref: ref('Salmo', 'Evangelho|2ª Leitura'),
    gospel_ref: gospel,
  }
}

const tag = (xml, name) => {
  const match = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  if (!match) return ''
  return match[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim()
}

/** Lê os itens de um feed RSS 2.0 (Vatican News, CNBB). */
export const parseRss = (xml, source, limit = 15) => {
  const items = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0])
  return items
    .map((item) => {
      const title = htmlToText(tag(item, 'title'))
      const link = decodeEntities(tag(item, 'link')).trim()
      const date = new Date(tag(item, 'pubDate') || tag(item, 'dc:date'))
      const description = htmlToText(tag(item, 'description'))
      const image =
        item.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ??
        item.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] ??
        item.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/i)?.[1] ??
        null
      return {
        source,
        title,
        summary: description ? (description.length > 280 ? `${description.slice(0, 277).trimEnd()}…` : description) : null,
        link,
        image_url: image ? decodeEntities(image) : null,
        published_at: Number.isNaN(date.getTime()) ? null : date.toISOString(),
      }
    })
    .filter((item) => item.title && /^https:\/\//.test(item.link) && item.published_at)
    .slice(0, limit)
}

/** Data de hoje (AAAA-MM-DD) no horário de Brasília. */
export const todayInBrazil = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
