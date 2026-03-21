import { PROBLEMS_PER_LEVEL } from '@/config'

// ── Types ──

interface VariableRange {
  min: number
  max: number
}

interface ProblemTemplate {
  id: string
  question: string
  variables: Record<string, VariableRange>
  derived?: Record<string, string>
  answer: string
  hints: string[]
  commonMistakes: string[]
}

interface LevelDef {
  level: number
  description: string
  templates: ProblemTemplate[]
}

interface ConceptFile {
  concept: string
  domain: string
  grade: number
  levels: LevelDef[]
}

export interface Problem {
  id: string
  question: string
  correctAnswer: number
  choices: number[]
  hints: string[]
}

// ── JSON imports ──

const conceptFiles: Record<string, () => Promise<ConceptFile>> = {
  // Grade 3
  'multiplication': () => import('./problems/grade3/multiplication.json').then((m) => m.default as ConceptFile),
  'division': () => import('./problems/grade3/division.json').then((m) => m.default as ConceptFile),
  // Grade 4
  'fractions': () => import('./problems/grade4/fractions.json').then((m) => m.default as ConceptFile),
  'angles': () => import('./problems/grade4/angles.json').then((m) => m.default as ConceptFile),
  // Grade 5
  'fractions-advanced': () => import('./problems/grade5/fractions-advanced.json').then((m) => m.default as ConceptFile),
  'decimals': () => import('./problems/grade5/decimals.json').then((m) => m.default as ConceptFile),
  // Grade 6
  'ratios': () => import('./problems/grade6/ratios.json').then((m) => m.default as ConceptFile),
  'expressions': () => import('./problems/grade6/expressions.json').then((m) => m.default as ConceptFile),
}

// ── Helpers ──

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Evaluate a simple math expression string like "3 * 7 + 1" */
function evalExpr(expr: string): number {
  // Only allow digits, spaces, and basic math operators for safety
  const sanitized = expr.replace(/[^0-9+\-*/() .]/g, '')
  return new Function(`return (${sanitized})`)() as number
}

/** Replace {varName} in a string with values from the vars map */
function interpolate(template: string, vars: Record<string, number>): string {
  return template.replace(/\{([^}]+)\}/g, (_, key: string) => {
    // Direct variable lookup
    if (key in vars) return String(vars[key])
    // Try evaluating as expression with variables substituted
    let expr = key
    for (const [name, val] of Object.entries(vars)) {
      expr = expr.replace(new RegExp(name, 'g'), String(val))
    }
    try {
      return String(evalExpr(expr))
    } catch {
      return `{${key}}`
    }
  })
}

function generateVariables(ranges: Record<string, VariableRange>): Record<string, number> {
  const vars: Record<string, number> = {}
  for (const [name, range] of Object.entries(ranges)) {
    vars[name] = randInt(range.min, range.max)
  }
  return vars
}

function computeDerived(derived: Record<string, string>, vars: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [name, expr] of Object.entries(derived)) {
    const interpolated = interpolate(expr, vars)
    result[name] = evalExpr(interpolated)
  }
  return result
}

function generateWrongChoices(
  correct: number,
  mistakeExprs: string[],
  vars: Record<string, number>,
  count: number,
): number[] {
  const wrongs = new Set<number>()

  // First try common mistakes from the template
  for (const expr of mistakeExprs) {
    if (wrongs.size >= count) break
    try {
      const val = evalExpr(interpolate(expr, vars))
      if (val !== correct && val > 0 && Number.isInteger(val)) {
        wrongs.add(val)
      }
    } catch {
      // skip bad expressions
    }
  }

  // Fill remaining with near-misses
  const offsets = [1, -1, 2, -2, 10, -10, 5, -5, 3, -3]
  for (const offset of offsets) {
    if (wrongs.size >= count) break
    const val = correct + offset
    if (val > 0 && val !== correct && !wrongs.has(val)) {
      wrongs.add(val)
    }
  }

  return [...wrongs].slice(0, count)
}

// ── Public API ──

export async function loadProblems(concept: string, level: number): Promise<Problem[]> {
  const loader = conceptFiles[concept]
  if (!loader) throw new Error(`Unknown concept: ${concept}`)

  const data = await loader()
  const levelDef = data.levels.find((l) => l.level === level)
  if (!levelDef) throw new Error(`No level ${level} for ${concept}`)

  const problems: Problem[] = []
  const seen = new Set<string>()

  // Generate enough unique problems
  let attempts = 0
  while (problems.length < PROBLEMS_PER_LEVEL && attempts < 200) {
    attempts++
    const template = levelDef.templates[Math.floor(Math.random() * levelDef.templates.length)]
    const baseVars = generateVariables(template.variables)
    const derived = template.derived ? computeDerived(template.derived, baseVars) : {}
    const allVars = { ...baseVars, ...derived }

    // Add some useful computed vars for hints
    allVars['half'] = Math.floor(allVars['b'] / 2)
    allVars['rest'] = allVars['b'] - allVars['half']
    allVars['low'] = Math.max(1, (allVars['a'] || 1) * (allVars['b'] || 1) - 10)
    allVars['high'] = (allVars['a'] || 1) * (allVars['b'] || 1) + 10
    allVars['bMinus10'] = Math.max(0, (allVars['b'] || 0) - 10)

    const question = interpolate(template.question, allVars)
    const answerExpr = interpolate(template.answer, allVars)
    const correctAnswer = evalExpr(answerExpr)

    // Skip if we've already generated this exact question
    const key = question
    if (seen.has(key)) continue
    seen.add(key)

    // Skip non-positive or non-integer answers
    if (correctAnswer <= 0 || !Number.isInteger(correctAnswer)) continue

    const wrongChoices = generateWrongChoices(correctAnswer, template.commonMistakes, allVars, 3)
    const choices = shuffle([correctAnswer, ...wrongChoices])
    const hints = template.hints.map((h) => interpolate(h, allVars))

    problems.push({
      id: `${template.id}-${problems.length}`,
      question,
      correctAnswer,
      choices,
      hints,
    })
  }

  return shuffle(problems)
}

// Cache concept data after first load
const conceptCache: Record<string, ConceptFile> = {}

export async function getMaxLevel(concept: string): Promise<number> {
  if (conceptCache[concept]) return conceptCache[concept].levels.length

  const loader = conceptFiles[concept]
  if (!loader) return 1

  const data = await loader()
  conceptCache[concept] = data
  return data.levels.length
}
