export type TurnRecord = {
  id: string
  prompt: string
  startedAt: number
  durationMs: number
  tools: number
  model: string
  inputTokens: number
  outputTokens: number
  reason: string
}

export type Running = {
  turnId: string
  prompt: string
  startedAt: number
  tools: number
}

export type Task = {
  name: string
  startedAt: number
  endedAt: number | null
  turns: number
  activeMs: number
}

declare module 'claude-code' {
  interface PluginState {
    'task-timer': {
      turns: TurnRecord[]
      running: Running | null
      task: Task | null
      tasks: Task[]
      tick: number
      isHidden: boolean
    }
  }
}
