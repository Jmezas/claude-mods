export type Tier = 'simple' | 'medium' | 'complex'

export type Decision = {
  tier: Tier
  model: string
  effort: string
  reason: 'classified' | 'forced' | 'fallback'
  at: number
}

declare module 'claude-code' {
  interface PluginState {
    'model-router': { last: Decision | null }
  }
}
