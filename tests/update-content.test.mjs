// Testes da leitura das fontes do robô de conteúdo (páginas e feeds de exemplo, escritos à mão).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeEntities, parseLiturgy, parseRss, todayInBrazil } from '../scripts/content-parsers.mjs'

// Mesmo formato do resumo da Liturgia Diária da Canção Nova (sem o texto das leituras).
const weekday = `
<div class="cor"><span>Cor Lit&uacute;rgica: Verde</span> <span class='dia'>10 Oct 2026</span></div>
<h2>27&ordf; Semana do Tempo Comum | S&aacute;bado</h2> <span>A+</span> <span>A-</span> -->
<ul><li>1&ordf; Leitura <b>Gl 3,22-29</b></li><li>Salmo <b>Sl 104(105),2-3.4-5.6-7 (R. 8a)</b></li>
<li>Evangelho <b>Lc 11,27-28</b></li></ul>
<div id="liturgia-1"><h3>Primeira Leitura (Gl 3,22-29)</h3><p>...</p></div>`

const sunday = `
<span>Cor Lit&uacute;rgica: Branca</span> <span class='dia'>4 Apr 2027</span>
<h2>Domingo de P&aacute;scoa | Domingo</h2> A+ A-
1&ordf; Leitura At 10,34a.37-43 Salmo Sl 117(118),1-2.16ab-17.22-23 (R. 24) 2&ordf; Leitura Cl 3,1-4 Evangelho Jo 20,1-9
Primeira Leitura (At 10,34a.37-43)`

test('liturgia de dia de semana: cor, data, título e referências', () => {
  assert.deepEqual(parseLiturgy(weekday), {
    date: '2026-10-10',
    liturgical_color: 'VERDE',
    title: '27ª Semana do Tempo Comum · Sábado',
    first_reading_ref: 'Gl 3,22-29',
    second_reading_ref: null,
    psalm_ref: 'Sl 104(105),2-3.4-5.6-7 (R. 8a)',
    gospel_ref: 'Lc 11,27-28',
  })
})

test('liturgia de domingo: segunda leitura e cor no feminino', () => {
  const liturgy = parseLiturgy(sunday)
  assert.equal(liturgy.date, '2027-04-04')
  assert.equal(liturgy.liturgical_color, 'BRANCO')
  assert.equal(liturgy.second_reading_ref, 'Cl 3,1-4')
  assert.equal(liturgy.psalm_ref, 'Sl 117(118),1-2.16ab-17.22-23 (R. 24)')
  assert.equal(liturgy.gospel_ref, 'Jo 20,1-9')
})

test('se a página mudar de formato, avisa em vez de gravar dados errados', () => {
  assert.throws(() => parseLiturgy('<html><body>Manutenção</body></html>'), /Formato da página/)
})

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel>
  <item>
    <title><![CDATA[Papa convida à oração pela paz]]></title>
    <link>https://www.vaticannews.va/pt/papa/news/2026-10/oracao-paz.html</link>
    <pubDate>Sat, 10 Oct 2026 12:30:00 +0200</pubDate>
    <description><![CDATA[<p>Na audiência, o Papa pediu orações &amp; gestos concretos.</p>]]></description>
    <media:content url="https://www.vaticannews.va/img/paz.jpg" medium="image"/>
  </item>
  <item>
    <title>Item sem link válido</title>
    <link>javascript:alert(1)</link>
    <pubDate>Sat, 10 Oct 2026 10:00:00 +0200</pubDate>
  </item>
</channel></rss>`

test('feed RSS: título, link, data, resumo sem HTML e imagem', () => {
  const [item, ...rest] = parseRss(rss, 'VATICAN_NEWS')
  assert.equal(rest.length, 0, 'itens sem link https são descartados')
  assert.equal(item.source, 'VATICAN_NEWS')
  assert.equal(item.title, 'Papa convida à oração pela paz')
  assert.equal(item.link, 'https://www.vaticannews.va/pt/papa/news/2026-10/oracao-paz.html')
  assert.equal(item.published_at, '2026-10-10T10:30:00.000Z')
  assert.equal(item.summary, 'Na audiência, o Papa pediu orações & gestos concretos.')
  assert.equal(item.image_url, 'https://www.vaticannews.va/img/paz.jpg')
})

test('entidades HTML e data no horário de Brasília', () => {
  assert.equal(decodeEntities('S&aacute;bado &#8211; 27&ordf;'), 'Sábado – 27ª')
  // 02:00 UTC de 11/10 ainda é 10/10 em Brasília (UTC-3).
  assert.equal(todayInBrazil(new Date('2026-10-11T02:00:00Z')), '2026-10-10')
})
