export type Totals = {
  usd: number
  turns: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
}

export type Ledger = {
  days: Record<string, Totals>
  projects: Record<string, Totals>
}

declare module 'claude-code' {
  interface PluginState {
    'cost-budget': { session: Totals }
  }
}
