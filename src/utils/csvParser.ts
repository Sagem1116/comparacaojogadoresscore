import Papa, { ParseResult } from 'papaparse'
import { Dataset } from '../types/index'

/**
 * CSV Parsing Utilities
 * Handles dynamic column detection and large file processing
 */

export interface ParsedCSV {
  headers: string[]
  rows: Record<string, any>[]
  originalData: ParseResult<any>
}

/**
 * Parse CSV file with streaming for large datasets
 */
export function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (h) => h.trim(),
      transform: (value) => {
        if (value === '' || value === null || value === undefined) {
          return null
        }

        const stringValue = String(value).trim()
        if (stringValue === '') {
          return null
        }

        // Normalize numeric strings that may include commas or currency symbols
        const cleanedValue = stringValue
          .replace(/[,\s]+/g, '')
          .replace(/[£€¥$]/g, '')

        const num = parseFloat(cleanedValue)
        return Number.isFinite(num) ? num : value
      },
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
          return
        }

        const headers = Object.keys(results.data[0] || {})
        resolve({
          headers,
          rows: results.data as Record<string, any>[],
          originalData: results,
        })
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      },
    })
  })
}

/**
 * Detect role score columns from CSV
 * Role score columns typically end with "Score" or contain role names
 */
export function detectRoleColumns(headers: string[], rows: Record<string, any>[] = []): string[] {
  const roleIndicators = [
    'score',
    'role',
    'position score',
    'attribute',
    'rating',
  ]

  const excludedPatterns = [
    'player',
    'club',
    'age',
    'position',
    'minutes',
    'name',
    'id',
    'quality',
    'team',
    'market',
    'value',
    'rank',
  ]

  const keywordMatches = headers.filter((header) => {
    const lowerHeader = header.toLowerCase()
    return (
      roleIndicators.some((indicator) => lowerHeader.includes(indicator)) &&
      !excludedPatterns.some((pattern) => lowerHeader.includes(pattern))
    )
  })

  const numericCandidates = headers.filter((header) => {
    const lowerHeader = header.toLowerCase()
    if (excludedPatterns.some((pattern) => lowerHeader.includes(pattern))) {
      return false
    }
    if (rows.length === 0) {
      return true
    }

    let numericCount = 0
    let totalCount = 0

    for (let i = 0; i < Math.min(rows.length, 50); i++) {
      const value = rows[i][header]
      if (value === null || value === undefined || value === '') {
        continue
      }
      totalCount += 1
      if (typeof value === 'number' || !Number.isNaN(Number(value))) {
        numericCount += 1
      }
    }

    if (totalCount === 0) {
      return false
    }

    return numericCount / totalCount >= 0.8
  })

  if (keywordMatches.length > 0 && keywordMatches.length >= Math.min(5, numericCandidates.length)) {
    return keywordMatches
  }

  return numericCandidates
}

/**
 * Detect statistics columns from CSV
 * Excludes player info columns
 */
export function detectStatisticColumns(headers: string[]): string[] {
  const excludedPatterns = [
    'player',
    'club',
    'position',
    'age',
    'name',
    'id',
    'pk',
    'role',
    'score',
  ]

  return headers.filter((header) => {
    const lowerHeader = header.toLowerCase()
    return !excludedPatterns.some((pattern) => lowerHeader.includes(pattern))
  })
}

/**
 * Extract player info columns
 * Looks for standard FM player data columns
 */
export function extractPlayerInfoColumns(
  headers: string[]
): {
  uid?: string
  playerName: string
  club: string
  age: string
  position: string
  minutes?: string
  marketValue?: string
} {
  const playerNameHeaders = ['player', 'player name', 'name', 'player_name']
  const clubHeaders = ['club', 'team', 'club_name', 'current club']
  const ageHeaders = ['age', 'player age', 'birth date']
  const positionHeaders = ['position', 'pos', 'main position', 'player position']
  const minutesHeaders = ['minutes', 'minutes played', 'mins', 'mp', 'minutes_played', 'minutesplayed', 'played minutes', 'play time']
  const marketValueHeaders = ['market value', 'market_value', 'value', 'transfer value', 'transfer_value']

  const norm = (s: string) => s.toLowerCase().trim()

  const findHeader = (patterns: string[], headers: string[]): string => {
    const found = headers.find((h) =>
      patterns.some((p) => norm(h).includes(norm(p)))
    )
    return found || headers[0] // Fallback to first header
  }

  const findOptionalHeader = (patterns: string[], headers: string[]): string | undefined => {
    return headers.find((h) =>
      patterns.some((p) => norm(h).includes(norm(p)))
    )
  }

  // UID: prefer exact 'uid' / 'player uid' / 'unique id' — avoid false positives like 'fluid'
  const uidCandidate = headers.find((h) => {
    const n = norm(h).replace(/[_\s-]+/g, '')
    return n === 'uid' || n === 'idu' || n === 'playeruid' || n === 'uniqueid' || n === 'fmuid' || n === 'playerid'
  })

  return {
    uid: uidCandidate,
    playerName: findHeader(playerNameHeaders, headers),
    club: findHeader(clubHeaders, headers),
    age: findHeader(ageHeaders, headers),
    position: findHeader(positionHeaders, headers),
    minutes: findOptionalHeader(minutesHeaders, headers),
    marketValue: findOptionalHeader(marketValueHeaders, headers),
  }
}

/**
 * Create a Dataset object from parsed CSV
 */
export function createDataset(
  csvData: ParsedCSV,
  type: 'statistics' | 'roleScores'
): Dataset {
  return {
    id: `${type}-${Date.now()}`,
    name: `${type} Dataset`,
    type,
    uploadedAt: new Date().toISOString(),
    rowCount: csvData.rows.length,
    columns: csvData.headers,
    data: csvData.rows,
  }
}

/**
 * Validate CSV contains required columns
 */
export function validateStatisticsCSV(headers: string[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  const playerInfoCols = extractPlayerInfoColumns(headers)
  if (!playerInfoCols.playerName) {
    errors.push('Missing player name column')
  }
  if (!playerInfoCols.club) {
    errors.push('Missing club column')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate role scores CSV
 */
export function validateRoleScouresCSV(headers: string[], rows: Record<string, any>[] = []): {
  isValid: boolean
  errors: string[]
  roleColumns: string[]
} {
  const errors: string[] = []
  const roleColumns = detectRoleColumns(headers, rows)

  if (roleColumns.length === 0) {
    errors.push('No role score columns detected')
  }

  return {
    isValid: errors.length === 0,
    errors,
    roleColumns,
  }
}

/**
 * Safely access nested values with fallback
 */
export function safeGet(obj: any, path: string, defaultValue: any = null) {
  try {
    const value = path
      .split('.')
      .reduce((curr, prop) => curr?.[prop], obj)
    return value !== undefined ? value : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Create a composite player key for matching
 */
export function createPlayerKey(
  playerName: string,
  club: string,
  age: number | string
): string {
  return `${String(playerName ?? '').toLowerCase().trim()}|${String(club ?? '').toLowerCase().trim()}|${String(age ?? '').trim()}`
}

/**
 * Fuzzy match player names (simple Levenshtein distance)
 */
export function fuzzyMatchNames(name1: string, name2: string): number {
  const s1 = String(name1 ?? '').toLowerCase()
  const s2 = String(name2 ?? '').toLowerCase()

  if (s1 === s2) return 1.0

  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance for string matching
 */
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = []

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue
    }
  }

  return costs[s2.length]
}
