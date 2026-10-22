import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Running, Task, TurnRecord } from '../types'

const PANE = 'task-timer'
const MAX_TURNS = 200
const MAX_TASKS = 50

const turns = atom({ plugin: 'task-timer', key: 'turns' } as const, [])
const running = atom({ plugin: 'task-timer', key: 'running' } as const, null)
const task = atom({ plugin: 'task-timer', key: 'task' } as const, null)
const tasks = atom({ plugin: 'task-timer', key: 'tasks' } as const, [])
const tick = atom({ plugin: 'task-timer', key: 'tick' } as const, 0)
const isHidden = atom({ plugin: 'task-timer', key: 'isHidden' } as const, false)

const pad = (n: number) => String(n).padStart(2, '0')

const fmt = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

const short = (model: string) =>
  model.replace(/^claude-/, '').replace(/-\d{8}$/, '').slice(0, 14)

const snippet = (text: string, max: number) => {
  const flat = text.replace(/\s+/g, ' ').trim()

  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

const isTaskList = (value: unknown): value is Task[] =>
  Array.isArray(value) &&
  value.every(
    one =>
      typeof one === 'object' &&
      one !== null &&
      typeof (one as Task).name === 'string' &&
      typeof (one as Task).startedAt === 'number',
  )

export const register: Register = on => {
  let nextPrompt = ''
  let ticker: { cancel: () => void } | null = null

  const stopTicker = () => {
    ticker?.cancel()
    ticker = null
  }

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'timer',
      description: 'Task stopwatch: pane | start <name> | stop | reset | hide | show',
      argumentHint: '[start <name>|stop|reset|hide|show]',
    })
    const stored = await $.store.get('tasks')
    if (isTaskList(stored)) await update($, tasks, () => stored)
    const open = await $.store.get('task')
    if (isTaskList([open])) await update($, task, () => open as Task)

    return next(e)
  })

  on('command.run', { command: 'timer' }, async ($, e) => {
    const [verb = '', ...rest] = e.args.trim().split(/\s+/)
    const name = rest.join(' ').trim()
    const now = await $.clock.now()

    if (verb === 'start') {
      const current = await read($, task)
      if (current !== null) {
        return { text: `timer: task "${current.name}" is still running, /timer stop first` }
      }
      const started: Task = {
        name: name || `task ${(await read($, tasks)).length + 1}`,
        startedAt: now,
        endedAt: null,
        turns: 0,
        activeMs: 0,
      }
      await update($, task, () => started)
      await $.store.set('task', started)
      await $.ui.open({ id: PANE, title: 'Timer' })

      return { text: `timer: started "${started.name}"` }
    }

    if (verb === 'stop') {
      const current = await read($, task)
      if (current === null) return { text: 'timer: no task running' }
      const done: Task = { ...current, endedAt: now }
      const list = [...(await read($, tasks)), done].slice(-MAX_TASKS)
      await update($, tasks, () => list)
      await update($, task, () => null)
      await $.store.set('tasks', list)
      await $.store.delete('task')

      return {
        text: `timer: "${done.name}" took ${fmt(now - done.startedAt)} wall, ${fmt(done.activeMs)} active over ${done.turns} turns`,
      }
    }

    if (verb === 'reset') {
      await update($, turns, () => [])
      await update($, tasks, () => [])
      await update($, task, () => null)
      await $.store.delete('tasks')
      await $.store.delete('task')

      return { text: 'timer: history cleared' }
    }

    if (verb === 'hide' || verb === 'show') {
      await update($, isHidden, () => verb === 'hide')

      return { text: `timer: band ${verb === 'hide' ? 'hidden' : 'shown'}` }
    }

    const opened = await $.ui.open({ id: PANE, title: 'Timer' })

    return {
      text: opened.isPlaced
        ? 'Timer pane opened.'
        : `Timer pane waits for a wider terminal (${opened.reason}).`,
    }
  })

  on('prompt.submit', ($, e, next) => {
    if (e.command === undefined && e.isMeta === undefined && e.turnId === undefined) {
      nextPrompt = e.text
    }

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const startedAt = await $.clock.now()
    const run: Running = {
      turnId: e.turnId,
      prompt: snippet(nextPrompt, 60),
      startedAt,
      tools: 0,
    }
    nextPrompt = ''
    await update($, running, () => run)

    stopTicker()
    ticker = $.clock.every(1000, () => {
      void (async () => {
        const now = await $.clock.now()
        const current = await read($, running)
        if (current === null) return
        const open = await read($, task)
        $.ui.status(
          `⏱ ${fmt(now - current.startedAt)} · ${current.tools} tools${open ? ` · ${open.name}` : ''}`,
        )
        await update($, tick, () => now)
      })()
    })

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId === undefined) {
      await update($, running, current =>
        current === null ? null : { ...current, tools: current.tools + 1 },
      )
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    stopTicker()
    const current = await read($, running)
    const startedAt = current?.startedAt ?? (await $.clock.now()) - e.durationMs
    const record: TurnRecord = {
      id: e.turnId,
      prompt: current?.prompt ?? '',
      startedAt,
      durationMs: e.durationMs,
      tools: current?.tools ?? 0,
      model: e.usage?.model ?? '',
      inputTokens:
        (e.usage?.input_tokens ?? 0) + (e.usage?.cache_read_input_tokens ?? 0),
      outputTokens: e.usage?.output_tokens ?? 0,
      reason: e.reason,
    }
    await update($, turns, list => [...list, record].slice(-MAX_TURNS))
    await update($, running, () => null)

    const open = await read($, task)
    if (open !== null) {
      const grown: Task = {
        ...open,
        turns: open.turns + 1,
        activeMs: open.activeMs + e.durationMs,
      }
      await update($, task, () => grown)
      await $.store.set('task', grown)
    }

    $.ui.status(
      `⏱ last ${fmt(e.durationMs)} · ${record.tools} tools${record.model ? ` · ${short(record.model)}` : ''}`,
    )
    if (e.durationMs > 120_000) $.ui.toast(`Turn took ${fmt(e.durationMs)}`)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const hidden = await read($, isHidden)
    if (hidden || e.props.hasSurvey) return next(e)
    const current = await read($, running)
    const list = await read($, turns)
    const open = await read($, task)
    const now = await read($, tick)
    const { Box, Text } = $.ui.resolve(e)

    if (current !== null) {
      return (
        <Box>
          <Text>
            ⏱ {fmt(Math.max(now, current.startedAt) - current.startedAt)}
          </Text>
          <Text dimColor>
            {' '}· {current.tools} tools
            {open ? ` · ${open.name} (${open.turns + 1}ª vuelta)` : ''}
          </Text>
        </Box>
      )
    }

    const lastTurn = list[list.length - 1]
    if (lastTurn === undefined && open === null) return next(e)

    return (
      <Box>
        {lastTurn && (
          <Text dimColor>
            ⏱ last {fmt(lastTurn.durationMs)} · {lastTurn.tools} tools
            {lastTurn.model ? ` · ${short(lastTurn.model)}` : ''}
          </Text>
        )}
        {open && (
          <Text dimColor>
            {lastTurn ? ' · ' : ''}task {open.name}: {open.turns} turns,{' '}
            {fmt(open.activeMs)} active
          </Text>
        )}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const list = await read($, turns)
    const current = await read($, running)
    const open = await read($, task)
    const done = await read($, tasks)
    const now = await read($, tick)
    const width = e.props.bodyColumns
    const rows = Math.max(3, e.props.scroll.bodyRows - 8)

    const totalMs = list.reduce((sum, one) => sum + one.durationMs, 0)
    const totalTools = list.reduce((sum, one) => sum + one.tools, 0)
    const totalOut = list.reduce((sum, one) => sum + one.outputTokens, 0)
    const promptWidth = Math.max(8, width - 34)

    return (
      <Box flexDirection="column">
        {current !== null ? (
          <Text>
            ⏱ running {fmt(Math.max(now, current.startedAt) - current.startedAt)} ·{' '}
            {current.tools} tools · {current.prompt}
          </Text>
        ) : (
          <Text dimColor>idle</Text>
        )}
        {open !== null && (
          <Text>
            task {open.name}: {open.turns} turns · {fmt(open.activeMs)} active ·{' '}
            {fmt(Math.max(now, open.startedAt) - open.startedAt)} wall
          </Text>
        )}
        <Text dimColor>
          session: {list.length} turns · {fmt(totalMs)} · {totalTools} tools ·{' '}
          {totalOut} out tokens
        </Text>
        <Text> </Text>
        <Text dimColor>
          {'#'.padStart(3)} {'time'.padStart(7)} {'tools'.padStart(5)}{' '}
          {'model'.padEnd(14)} prompt
        </Text>
        {list.slice(-rows).map((one, i) => (
          <Text key={one.id} wrap="truncate-end">
            {String(list.length - Math.min(rows, list.length) + i + 1).padStart(3)}{' '}
            {fmt(one.durationMs).padStart(7)} {String(one.tools).padStart(5)}{' '}
            {short(one.model).padEnd(14)} {snippet(one.prompt, promptWidth)}
          </Text>
        ))}
        {done.length > 0 && <Text> </Text>}
        {done.length > 0 && <Text dimColor>finished tasks</Text>}
        {done.slice(-5).map(one => (
          <Text key={`${one.name}-${one.startedAt}`} dimColor wrap="truncate-end">
            {one.name}: {fmt((one.endedAt ?? one.startedAt) - one.startedAt)} wall ·{' '}
            {fmt(one.activeMs)} active · {one.turns} turns
          </Text>
        ))}
      </Box>
    )
  })
}
