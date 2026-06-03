import {
  parseCSV,
  detectRoleColumns,
  validateStatisticsCSV,
  validateRoleScouresCSV,
  createDataset,
} from '../utils/csvParser'
import {
  matchPlayers,
  mergePlayerData,
  createUnifiedPlayerDataset,
  deduplicatePlayers,
} from '../utils/playerMatching'
import { Player, Role, Dataset } from '../types/index'
import { v4 as uuidv4 } from 'uuid'

/**
 * Import Service
 * Handles complete CSV import workflow
 */

export interface ImportProgress {
  stage: 'parsing' | 'validating' | 'matching' | 'merging' | 'complete'
  progress: number
  message: string
}

export interface ImportResult {
  success: boolean
  players: Player[]
  detectedRoles: Role[]
  statistics: {
    totalPlayers: number
    matchedPlayers: number
    unmatchedPlayers: number
    detectedRoles: number
  }
  errors: string[]
  warnings: string[]
}

/**
 * Main import workflow
 */
export async function importScoutingData(
  statisticsFile: File,
  roleScoresFile: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Step 1: Parse CSV files
    if (onProgress) {
      onProgress({
        stage: 'parsing',
        progress: 0,
        message: 'Parsing statistics CSV...',
      })
    }

    const statisticsCSV = await parseCSV(statisticsFile)

    if (onProgress) {
      onProgress({
        stage: 'parsing',
        progress: 25,
        message: 'Parsing role scores CSV...',
      })
    }

    const roleScoresCSV = await parseCSV(roleScoresFile)

    // Step 2: Validate data
    if (onProgress) {
      onProgress({
        stage: 'validating',
        progress: 35,
        message: 'Validating data structure...',
      })
    }

    const statsValidation = validateStatisticsCSV(statisticsCSV.headers)
    if (!statsValidation.isValid) {
      errors.push(...statsValidation.errors)
      return {
        success: false,
        players: [],
        detectedRoles: [],
        statistics: {
          totalPlayers: 0,
          matchedPlayers: 0,
          unmatchedPlayers: 0,
          detectedRoles: 0,
        },
        errors,
        warnings,
      }
    }

    const roleValidation = validateRoleScouresCSV(roleScoresCSV.headers, roleScoresCSV.rows)
    if (!roleValidation.isValid) {
      errors.push(...roleValidation.errors)
      return {
        success: false,
        players: [],
        detectedRoles: [],
        statistics: {
          totalPlayers: 0,
          matchedPlayers: 0,
          unmatchedPlayers: 0,
          detectedRoles: 0,
        },
        errors,
        warnings,
      }
    }

    // Step 3: Detect roles
    if (onProgress) {
      onProgress({
        stage: 'matching',
        progress: 45,
        message: `Detected ${roleValidation.roleColumns.length} roles...`,
      })
    }

    const detectedRoles = createRolesFromColumns(roleValidation.roleColumns)

    if (detectedRoles.length === 0) {
      warnings.push('No role score columns detected')
    }

    // Step 4: Match and merge players
    if (onProgress) {
      onProgress({
        stage: 'matching',
        progress: 60,
        message: 'Matching players between datasets...',
      })
    }

    const { players, matchedCount, unmatched } = createUnifiedPlayerDataset(
      statisticsCSV.rows,
      roleScoresCSV.rows,
      statisticsCSV.headers,
      roleScoresCSV.headers
    )

    if (matchedCount < statisticsCSV.rows.length * 0.8) {
      warnings.push(
        `Low match rate: Only ${((matchedCount / statisticsCSV.rows.length) * 100).toFixed(1)}% of players matched`
      )
    }

    // Step 5: Deduplicate
    if (onProgress) {
      onProgress({
        stage: 'merging',
        progress: 80,
        message: 'Finalizing player data...',
      })
    }

    const deduplicatedPlayers = deduplicatePlayers(players)

    if (deduplicatedPlayers.length < players.length) {
      warnings.push(
        `Removed ${players.length - deduplicatedPlayers.length} duplicate players`
      )
    }

    if (onProgress) {
      onProgress({
        stage: 'complete',
        progress: 100,
        message: 'Import complete!',
      })
    }

    return {
      success: true,
      players: deduplicatedPlayers,
      detectedRoles,
      statistics: {
        totalPlayers: statisticsCSV.rows.length,
        matchedPlayers: matchedCount,
        unmatchedPlayers: unmatched,
        detectedRoles: detectedRoles.length,
      },
      errors,
      warnings,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    errors.push(`Import failed: ${errorMessage}`)
    return {
      success: false,
      players: [],
      detectedRoles: [],
      statistics: {
        totalPlayers: 0,
        matchedPlayers: 0,
        unmatchedPlayers: 0,
        detectedRoles: 0,
      },
      errors,
      warnings,
    }
  }
}

/**
 * Create Role entities from detected role columns
 */
function createRolesFromColumns(columns: string[]): Role[] {
  return columns.map((column) => ({
    id: uuidv4(),
    name: cleanRoleName(column),
    columnName: column,
    description: `FMDataLab role score for ${cleanRoleName(column)}`,
    detectedAt: new Date().toISOString(),
    isActive: true,
  }))
}

/**
 * Clean role name for display
 * Removes common suffixes like "Score"
 */
function cleanRoleName(columnName: string): string {
  let name = columnName.trim()

  // Remove common suffixes
  name = name.replace(/\s*Score\s*$/i, '')
  name = name.replace(/\s*Rating\s*$/i, '')
  name = name.replace(/\s*\(\d+\)\s*$/i, '')

  return name
}

/**
 * Validate import files before processing
 */
export function validateImportFiles(
  statisticsFile: File | null,
  roleScoresFile: File | null
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!statisticsFile) {
    errors.push('Statistics CSV file is required')
  } else if (!statisticsFile.name.toLowerCase().endsWith('.csv')) {
    errors.push('Statistics file must be a CSV file')
  }

  if (!roleScoresFile) {
    errors.push('Role scores CSV file is required')
  } else if (!roleScoresFile.name.toLowerCase().endsWith('.csv')) {
    errors.push('Role scores file must be a CSV file')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Get file size in MB
 */
export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024)
}

/**
 * Check if file is too large (threshold: 100MB)
 */
export function isFileTooLarge(file: File, maxMB: number = 100): boolean {
  return getFileSizeMB(file) > maxMB
}

/**
 * Generate a realistic error message based on error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('CSV')) {
      return `CSV parsing error: ${error.message}`
    }
    if (error.message.includes('memory')) {
      return 'File is too large. Please use a smaller dataset.'
    }
    return error.message
  }
  return String(error)
}

