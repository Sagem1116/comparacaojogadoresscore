/**
 * Football Manager HTML export parser.
 * FM exports attribute squads as a single <table> with <thead> + <tbody>.
 * Returns a CSV-like shape compatible with our existing CSV pipeline.
 */

export interface ParsedHtmlTable {
  headers: string[]
  rows: Record<string, any>[]
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .trim()
}

function tryNumber(value: string): string | number {
  if (value === '' || value === '-') return value
  const cleaned = value.replace(/[,\s]+/g, '').replace(/[£€¥$]/g, '')
  // Special FM values (e.g., "1-20", "5-10") should remain strings — only convert pure numeric
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : value
  }
  return value
}

export async function parseFMAttributesHTML(file: File): Promise<ParsedHtmlTable> {
  const text = await file.text()
  const doc = new DOMParser().parseFromString(text, 'text/html')
  let table = doc.querySelector('table')

  if (!table) {
    // Detect Excel "Workbook Frameset" exports — the real data is in a linked sheet file (e.g. sheet001.html)
    const isExcelFrameset = /Excel Workbook Frameset|ProgId.+Excel\.Sheet|x:ExcelWorkbook/i.test(text)
    if (isExcelFrameset) {
      throw new Error(
        'Este HTML é um "Workbook Frameset" do Excel (apenas o índice). Os dados estão na pasta "<nome>_ficheiros/sheet001.html". ' +
        'Abra esse ficheiro sheet001.html e faça upload dele, ou no Excel use "Guardar Como → Página Web num só ficheiro (.mht)" e converta para HTML, ou exporte diretamente do Football Manager em HTML.'
      )
    }
    throw new Error('Nenhuma tabela encontrada no HTML.')
  }


  // Headers: prefer <thead>, fallback to first <tr>
  let headerRow: HTMLTableRowElement | null = table.querySelector('thead tr')
  if (!headerRow) headerRow = table.querySelector('tr')
  if (!headerRow) throw new Error('Tabela HTML sem cabeçalhos.')

  const headers = Array.from(headerRow.children).map((c) => decodeEntities((c as HTMLElement).textContent || ''))

  // Body rows
  let bodyRows: HTMLTableRowElement[] = Array.from(table.querySelectorAll('tbody tr'))
  if (bodyRows.length === 0) {
    bodyRows = Array.from(table.querySelectorAll('tr')).slice(1)
  }

  const rows: Record<string, any>[] = []
  for (const tr of bodyRows) {
    const cells = Array.from(tr.children)
    if (cells.length === 0) continue
    const row: Record<string, any> = {}
    headers.forEach((h, i) => {
      const raw = cells[i] ? decodeEntities((cells[i] as HTMLElement).textContent || '') : ''
      row[h] = raw === '' ? null : tryNumber(raw)
    })
    rows.push(row)
  }

  return { headers, rows }
}
