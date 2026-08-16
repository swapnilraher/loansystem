/**
 * Minimal ambient types for `papaparse`, which ships no declarations and has no
 * `@types` package installed. Only the CSV-parsing surface the CRM uses is
 * described here — extend it rather than reaching for `any`.
 */
declare module "papaparse" {
  export interface ParseError {
    type: string
    code: string
    message: string
    row?: number
  }

  export interface ParseResult<T> {
    data: T[]
    errors: ParseError[]
    meta: {
      delimiter: string
      linebreak: string
      aborted: boolean
      truncated: boolean
      fields?: string[]
    }
  }

  export interface ParseConfig<T> {
    header?: boolean
    skipEmptyLines?: boolean | "greedy"
    dynamicTyping?: boolean
    delimiter?: string
    complete?: (results: ParseResult<T>) => void
    error?: (error: ParseError) => void
  }

  export function parse<T = Record<string, unknown>>(input: string, config?: ParseConfig<T>): ParseResult<T>

  export function unparse(data: unknown, config?: { header?: boolean; delimiter?: string }): string

  const Papa: {
    parse: typeof parse
    unparse: typeof unparse
  }

  export default Papa
}
