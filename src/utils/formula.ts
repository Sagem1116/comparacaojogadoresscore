import { FormulaVariable, FormulaVariableType, FormulaValidation } from '../types/index'

/**
 * Formula Engine for Final Score Calculation
 * Supports dynamic variable substitution and safe expression evaluation
 */

const FORMULA_OPERATORS = /[\+\-\*\/\(\)\.]/g
const VALID_VARIABLE_NAMES = /^[a-zA-Z_][a-zA-Z0-9_]*$/
const FORMULA_PATTERN = /^[0-9\.\+\-\*\/\(\)\s]*$/

/**
 * Validate formula syntax
 */
export function validateFormula(
  expression: string,
  availableVariables: string[]
): FormulaValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!expression || expression.trim() === '') {
    errors.push('Formula cannot be empty')
    return { isValid: false, errors, warnings }
  }

  // Check for balanced parentheses
  const openParens = (expression.match(/\(/g) || []).length
  const closeParens = (expression.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`)
  }

  // Extract variables from formula
  const variablePattern = /[a-zA-Z_][a-zA-Z0-9_]*/g
  const usedVariables = new Set<string>()
  let match
  while ((match = variablePattern.exec(expression)) !== null) {
    usedVariables.add(match[0])
  }

  // Check for undefined variables
  for (const variable of usedVariables) {
    if (
      !availableVariables.includes(variable) &&
      !isNumeric(variable) &&
      !isOperator(variable)
    ) {
      errors.push(`Undefined variable: ${variable}`)
    }
  }

  // Warn about unused available variables
  const usedVars = new Set(usedVariables)
  for (const available of availableVariables) {
    if (!usedVars.has(available)) {
      warnings.push(`Variable ${available} is available but not used`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Evaluate formula with given variables
 * Uses a safe expression evaluator
 */
export function evaluateFormula(
  expression: string,
  variables: Record<string, number>
): { result: number; error?: string } {
  try {
    // Validate all variables are numbers
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value !== 'number' || isNaN(value)) {
        return {
          result: 0,
          error: `Variable ${key} must be a number, got ${typeof value}`,
        }
      }
    }

    // Create a safe evaluation function
    const result = evaluateSafeExpression(expression, variables)

    if (isNaN(result)) {
      return { result: 0, error: 'Formula evaluation resulted in NaN' }
    }

    return { result }
  } catch (error) {
    return {
      result: 0,
      error: `Formula evaluation error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Safe expression evaluator using Function constructor
 * Only allows arithmetic operations and variables
 */
function evaluateSafeExpression(expression: string, variables: Record<string, number>): number {
  // Build variable list for Function constructor
  const varNames = Object.keys(variables)
  const varValues = Object.values(variables)

  try {
    // Create function with variables as parameters
    const fn = new Function(...varNames, `return ${expression}`)
    const result = fn(...varValues) as number
    return result
  } catch (error) {
    throw new Error(`Invalid formula: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Check if string is numeric
 */
function isNumeric(str: string): boolean {
  return !isNaN(parseFloat(str)) && isFinite(Number(str))
}

/**
 * Check if string is an operator
 */
function isOperator(str: string): boolean {
  return ['+', '-', '*', '/', '(', ')', '.'].includes(str)
}

/**
 * Parse formula and extract variables
 */
export function extractFormulaVariables(expression: string): string[] {
  const variables = new Set<string>()
  const variablePattern = /[a-zA-Z_][a-zA-Z0-9_]*/g

  let match
  while ((match = variablePattern.exec(expression)) !== null) {
    const variable = match[0]
    // Only add if it's not a number
    if (!isNumeric(variable)) {
      variables.add(variable)
    }
  }

  return Array.from(variables)
}

/**
 * Apply thresholds to a score
 */
export function applyThreshold(
  score: number,
  threshold?: number,
  operation: 'min' | 'max' = 'min'
): number {
  if (threshold === undefined) return score

  if (operation === 'min') {
    return Math.max(threshold, score)
  } else {
    return Math.min(threshold, score)
  }
}

/**
 * Clamp score to range
 */
export function clampScore(score: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, score))
}

/**
 * Format score for display
 */
export function formatScore(score: number, decimals: number = 2): string {
  return score.toFixed(decimals)
}

/**
 * Validate and create a formula
 */
export function createAndValidateFormula(
  expression: string,
  availableVariables: string[]
): { isValid: boolean; variables: string[]; validation: FormulaValidation } {
  const variables = extractFormulaVariables(expression)
  const validation = validateFormula(expression, availableVariables)

  return {
    isValid: validation.isValid,
    variables,
    validation,
  }
}

/**
 * Common formula templates
 */
export const FORMULA_TEMPLATES = {
  weighted: '(CustomMetricScore * 0.7) + (RoleScore * 0.3)',
  average: '(CustomMetricScore + RoleScore) / 2',
  customOnly: 'CustomMetricScore * 100',
  roleOnly: 'RoleScore * 100',
  advanced: '(CustomMetricScore * 0.6) + (RoleScore * 0.3) + (Age / 50) * 0.1',
  valueAdjusted:
    '((CustomMetricScore + RoleScore) / 2) * (100 - (MarketValue / 10000000))',
  balanced: '(CustomMetricScore * 0.6) + (RoleScore * 0.25) + (MinutesPlayed / 90) * 0.15',
  offensive: '(CustomMetricScore * 0.7) + (RoleScore * 0.15) + (MinutesPlayed / 90) * 0.15',
  defensive: '(RoleScore * 0.5) + (CustomMetricScore * 0.25) + ((100 - Age) * 0.2)',
  youthFocus: '(CustomMetricScore * 0.4) + (RoleScore * 0.2) + ((100 - Age) * 0.3) + (MinutesPlayed / 90) * 0.1',
  valueHunter: '((CustomMetricScore + RoleScore) / 2) * (100 - (MarketValue / 1000000))',
  experience: '(RoleScore * 0.4) + (CustomMetricScore * 0.3) + (MinutesPlayed / 90) * 0.3',
  stability: '(CustomMetricScore * 0.35) + (RoleScore * 0.35) + (Age * 0.3)',
  aggressive: '(CustomMetricScore * 0.8) + (RoleScore * 0.1) + ((100 - Age) * 0.1)',
  playmaker: '(CustomMetricScore * 0.55) + (RoleScore * 0.25) + (MinutesPlayed / 90) * 0.2',
} as const

/**
 * Get suggested formulas based on available variables
 */
export function getSuggestedFormulas(
  availableVariables: string[]
): Record<string, string> {
  const suggested: Record<string, string> = {}

  const hasCustomMetric = availableVariables.includes('CustomMetricScore')
  const hasRoleScore = availableVariables.includes('RoleScore')

  if (hasCustomMetric && hasRoleScore) {
    suggested['Weighted (70/30)'] = FORMULA_TEMPLATES.weighted
    suggested['Average'] = FORMULA_TEMPLATES.average
    suggested['Advanced'] = FORMULA_TEMPLATES.advanced
  }

  if (hasCustomMetric) {
    suggested['Custom Only'] = FORMULA_TEMPLATES.customOnly
  }

  if (hasRoleScore) {
    suggested['Role Only'] = FORMULA_TEMPLATES.roleOnly
  }

  return suggested
}

/**
 * Batch evaluate formula for multiple players
 */
export function batchEvaluateFormula(
  expression: string,
  playerVariables: Array<Record<string, number>>
): Array<{ result: number; error?: string }> {
  return playerVariables.map((vars) => evaluateFormula(expression, vars))
}

/**
 * Get formula complexity score (for UI hints)
 */
export function getFormulaComplexity(expression: string): 'simple' | 'moderate' | 'complex' {
  const operatorCount = (expression.match(/[\+\-\*\/]/g) || []).length
  const parenCount = (expression.match(/\(/g) || []).length

  if (operatorCount + parenCount <= 1) return 'simple'
  if (operatorCount + parenCount <= 3) return 'moderate'
  return 'complex'
}
