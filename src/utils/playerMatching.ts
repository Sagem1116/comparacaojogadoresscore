import { Player, PlayerStatistics, PlayerRoleScores } from '../types/index'
import {
  createPlayerKey,
  fuzzyMatchNames,
  extractPlayerInfoColumns,
} from './csvParser'

const normalizeHeaderKey = (key: string) => key.trim().toLowerCase().replace(/[_\s]+/g, '')

const lookupFieldByKeys = (data: Record<string, any>, keys: Array<string | undefined>) => {
  const normalizedData = Object.entries(data).reduce<Record<string, any>>((result, [key, value]) => {
    result[normalizeHeaderKey(key)] = value
    return result
  }, {})

  for (const key of keys) {
    if (!key) continue
    const normalizedKey = normalizeHeaderKey(key)
    if (normalizedKey in normalizedData) {
      return normalizedData[normalizedKey]
    }
  }

  return undefined
}

/**
 * Player Matching and Merging Utilities
 * Matches players between statistics and role scores datasets
 */

export interface MatchResult {
  statisticsIndex: number
  roleScorerIndex: number
  confidence: number
  matchType: 'exact' | 'fuzzy' | 'partial'
}

/**
 * Match players between two datasets using multiple strategies
 */
export function matchPlayers(
  statistics: Record<string, any>[],
  roleScores: Record<string, any>[],
  statisticsHeaders: string[],
  roleScoresHeaders: string[]
): Map<number, number> {
  const matches = new Map<number, number>()

  // Extract column names for each dataset
  const statsColumns = extractPlayerInfoColumns(statisticsHeaders)
  const roleColumns = extractPlayerInfoColumns(roleScoresHeaders)

  // Create indices for faster lookup
  const exactMatches = new Map<string, number>()
  const uidMatches = new Map<string, number>()

  const haveUid = Boolean(statsColumns.uid && roleColumns.uid)

  // First pass: build UID index + name/club/age key index from role scores
  for (let i = 0; i < roleScores.length; i++) {
    const rolePlayer = roleScores[i]
    if (haveUid) {
      const uidVal = String(rolePlayer[roleColumns.uid!] ?? '').trim()
      if (uidVal) uidMatches.set(uidVal, i)
    }
    const key = createPlayerKey(
      rolePlayer[roleColumns.playerName],
      rolePlayer[roleColumns.club],
      rolePlayer[roleColumns.age]
    )
    exactMatches.set(key, i)
  }

  // Second pass: find matches in statistics — UID first, then exact, then fuzzy
  for (let i = 0; i < statistics.length; i++) {
    const statsPlayer = statistics[i]

    if (haveUid) {
      const uidVal = String(statsPlayer[statsColumns.uid!] ?? '').trim()
      if (uidVal && uidMatches.has(uidVal)) {
        matches.set(i, uidMatches.get(uidVal)!)
        continue
      }
    }

    const key = createPlayerKey(
      statsPlayer[statsColumns.playerName],
      statsPlayer[statsColumns.club],
      statsPlayer[statsColumns.age]
    )

    if (exactMatches.has(key)) {
      matches.set(i, exactMatches.get(key)!)
      continue
    }

    // Fuzzy matching as fallback
    let bestMatch: { index: number; score: number } | null = null

    for (let j = 0; j < roleScores.length; j++) {
      const rolePlayer = roleScores[j]

      const nameScore = fuzzyMatchNames(
        String(statsPlayer[statsColumns.playerName] ?? ''),
        String(rolePlayer[roleColumns.playerName] ?? '')
      )
      const clubMatch =
        String(statsPlayer[statsColumns.club] ?? '').toLowerCase() ===
        String(rolePlayer[roleColumns.club] ?? '').toLowerCase()
      const ageMatch = String(statsPlayer[statsColumns.age] ?? '').trim() === String(rolePlayer[roleColumns.age] ?? '').trim()

      // Calculate confidence
      let confidence = nameScore * 0.5
      if (clubMatch) confidence += 0.3
      if (ageMatch) confidence += 0.2

      if (confidence > 0.7 && (!bestMatch || confidence > bestMatch.score)) {
        bestMatch = { index: j, score: confidence }
      }
    }

    if (bestMatch && bestMatch.score > 0.75) {
      matches.set(i, bestMatch.index)
    }
  }

  return matches
}

/**
 * Merge matched players into unified Player objects
 */
export function mergePlayerData(
  statistics: Record<string, any>[],
  roleScores: Record<string, any>[],
  matches: Map<number, number>,
  statisticsHeaders: string[],
  roleScoresHeaders: string[]
): Player[] {
  const players: Player[] = []

  const statsColumns = extractPlayerInfoColumns(statisticsHeaders)
  const roleColumns = extractPlayerInfoColumns(roleScoresHeaders)

  let playerId = 0

  matches.forEach((roleIndex, statsIndex) => {
    const statsData = statistics[statsIndex]
    const roleData = roleScores[roleIndex]

    const uidVal = statsColumns.uid
      ? String(statsData[statsColumns.uid] ?? '').trim() || undefined
      : undefined

    const player: Player = {
      id: `player-${playerId++}`,
      uid: uidVal,
      playerName: String(statsData[statsColumns.playerName] ?? '').trim(),
      club: String(statsData[statsColumns.club] ?? '').trim(),
      age: parseInt(String(statsData[statsColumns.age] ?? '0'), 10) || 0,
      position: String(statsData[statsColumns.position] ?? '').trim(),
      minutes:
        Number(
          lookupFieldByKeys(statsData, [
            statsColumns.minutes,
            'minutes',
            'minutes played',
            'mins',
            'mp',
            'minutes_played',
            'minutesplayed',
            'played minutes',
            'play time',
          ])
        ) || 0,
      marketValue:
        Number(
          lookupFieldByKeys(statsData, [
            statsColumns.marketValue,
            'market value',
            'market_value',
            'value',
            'transfer value',
            'transfer_value',
          ])
        ) || undefined,
      statistics: statsData as PlayerStatistics,
      roleScores: roleData as PlayerRoleScores,
    }

    players.push(player)
  })

  return players
}

/**
 * Create unified player dataset from imported data
 */
export function createUnifiedPlayerDataset(
  statisticsData: Record<string, any>[],
  roleScoresData: Record<string, any>[],
  statisticsHeaders: string[],
  roleScoresHeaders: string[]
): { players: Player[]; matchedCount: number; unmatched: number } {
  const matches = matchPlayers(
    statisticsData,
    roleScoresData,
    statisticsHeaders,
    roleScoresHeaders
  )

  const players = mergePlayerData(
    statisticsData,
    roleScoresData,
    matches,
    statisticsHeaders,
    roleScoresHeaders
  )

  return {
    players,
    matchedCount: matches.size,
    unmatched: statisticsData.length - matches.size,
  }
}

/**
 * Validate player data completeness
 */
export function validatePlayerData(
  player: Player
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!player.playerName || player.playerName.trim() === '') {
    errors.push('Player name is required')
  }
  if (!player.club || player.club.trim() === '') {
    errors.push('Club is required')
  }
  if (player.age <= 0 || player.age > 50) {
    errors.push('Invalid player age')
  }
  if (!player.statistics || Object.keys(player.statistics).length === 0) {
    errors.push('No statistics data')
  }
  if (!player.roleScores || Object.keys(player.roleScores).length === 0) {
    errors.push('No role score data')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Deduplicate players by composite key
 */
export function deduplicatePlayers(players: Player[]): Player[] {
  const seen = new Set<string>()
  const deduplicated: Player[] = []

  for (const player of players) {
    const key = createPlayerKey(player.playerName, player.club, player.age)
    if (!seen.has(key)) {
      seen.add(key)
      deduplicated.push(player)
    }
  }

  return deduplicated
}

/**
 * Get player matching statistics
 */
export function getMatchingStats(
  statisticsCount: number,
  matchedCount: number,
  unmatchedCount: number
) {
  return {
    total: statisticsCount,
    matched: matchedCount,
    unmatched: unmatchedCount,
    matchRate: (matchedCount / statisticsCount) * 100,
  }
}
