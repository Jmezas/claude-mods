import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Ledger, Totals } from '../types'

const EMPTY: Totals = { usd: 0, turns: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 }
const session = atom({ plugin: 'cost-budget', key: 'session' } as const, EMPTY)

const pad = (n: number) => String(n).padStart(2, '0')
const dayOf = (ms: number) => {
  const d = new Date(ms)

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const usd = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2)}`
const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

const add = (a: Totals, b: Totals): Totals => ({
  usd: a.usd + b.usd,
  turns: a.turns + b.turns,
  inputTokens: a.inputTokens + b.inputTokens,
  outputTokens: a.outputTokens + b.outputTokens,
  cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
})

const isLedger = (value: unknown): value is Ledger =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Ledger).days === 'object' &&
  typeof (value as Ledger).projects === 'object'

const line = (label: string, t: Totals) =>
  `${label.padEnd(12)} ${usd(t.usd).padStart(8)}  ${String(t.turns).padStart(4)} turnos  in ${k(t.inputTokens + t.cacheReadTokens).padStart(7)} (${k(t.cacheReadTokens)} caché)  out ${k(t.outputTokens).padStart(6)}`

async function loadLedger($: EngineInterface): Promise<Ledger> {
  const stored = await $.store.get('ledger')

  return isLedger(stored) ? stored : { days: {}, projects: {} }
}

export const register: Register = (on, options) => {
  const budget = Number(options.dailyBudgetUsd) || 0
  let lastUsd = 0
  let hasLedger = true
  let project = ''
  let warnedAt = 0

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'budget',
      description: 'cost-budget: resumen | hoy | proyectos | dias | set <usd> | reset',
      argumentHint: '[hoy|proyectos|dias|set <usd>|reset]',
    })
    project = await $.session.root()
    const started = await next(e)
    const usage = await $.session.usage()
    hasLedger = usage.cost !== undefined
    lastUsd = usage.cost?.usd ?? 0
    if (!hasLedger) $.ui.log('cost-budget: este host no informa coste en USD; se cuentan solo tokens.')

    return started
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const usage = await $.session.usage()
    const nowUsd = usage.cost?.usd ?? lastUsd
    const delta: Totals = {
      usd: Math.max(0, nowUsd - lastUsd),
      turns: 1,
      inputTokens: e.usage?.input_tokens ?? 0,
      outputTokens: e.usage?.output_tokens ?? 0,
      cacheReadTokens: e.usage?.cache_read_input_tokens ?? 0,
    }
    lastUsd = nowUsd

    const current = add(await read($, session), delta)
    await update($, session, () => current)

    const day = dayOf(await $.clock.now())
    const ledger = await loadLedger($)
    ledger.days[day] = add(ledger.days[day] ?? EMPTY, delta)
    ledger.projects[project] = add(ledger.projects[project] ?? EMPTY, delta)
    const days = Object.keys(ledger.days).sort()
    for (const old of days.slice(0, Math.max(0, days.length - 90))) delete ledger.days[old]
    await $.store.set('ledger', ledger)

    const today = ledger.days[day] ?? EMPTY
    $.ui.status(
      hasLedger
        ? `coste: turno ${usd(delta.usd)} · sesión ${usd(current.usd)} · hoy ${usd(today.usd)}${budget > 0 ? ` / ${usd(budget)}` : ''}`
        : `tokens: sesión in ${k(current.inputTokens + current.cacheReadTokens)} out ${k(current.outputTokens)}`,
    )
    if (hasLedger && budget > 0 && today.usd >= budget) {
      const step = Math.floor((today.usd / budget) * 2)
      if (step > warnedAt) {
        warnedAt = step
        $.ui.toast(`cost-budget: hoy llevas ${usd(today.usd)}, presupuesto ${usd(budget)}`)
      }
    }

    return next(e)
  })

  on('command.run', { command: 'budget' }, async ($, e) => {
    const [verb = '', value = ''] = e.args.trim().split(/\s+/)
    const ledger = await loadLedger($)
    const day = dayOf(await $.clock.now())

    if (verb === 'reset') {
      await $.store.delete('ledger')

      return { text: 'cost-budget: historial de días y proyectos borrado' }
    }
    if (verb === 'set') {
      const n = Number(value)
      if (!(n >= 0)) return { text: 'uso: /budget set <usd por día>' }
      await $.config.set({ key: 'cost-budget.dailyBudgetUsd', value: String(n) })

      return { text: `cost-budget: presupuesto diario ${usd(n)} (el plugin se recarga con el nuevo valor)` }
    }
    if (verb === 'proyectos' || verb === 'projects') {
      const rows = Object.entries(ledger.projects)
        .sort((a, b) => b[1].usd - a[1].usd)
        .slice(0, 15)
        .map(([root, t]) => line(root.split('/').pop() ?? root, t))

      return { text: rows.length ? ['coste por proyecto:', ...rows].join('\n') : 'sin datos de proyectos' }
    }
    if (verb === 'dias' || verb === 'días' || verb === 'days') {
      const rows = Object.keys(ledger.days)
        .sort()
        .slice(-14)
        .map(d => line(d, ledger.days[d] ?? EMPTY))

      return { text: rows.length ? ['coste por día (últimos 14):', ...rows].join('\n') : 'sin datos de días' }
    }

    const current = await read($, session)
    const today = ledger.days[day] ?? EMPTY
    const thisProject = ledger.projects[project] ?? EMPTY
    const month = Object.entries(ledger.days)
      .filter(([d]) => d.startsWith(day.slice(0, 7)))
      .reduce((sum, [, t]) => add(sum, t), EMPTY)

    return {
      text: [
        hasLedger ? `presupuesto diario: ${budget > 0 ? usd(budget) : 'sin límite'}` : 'este host no informa USD: solo tokens',
        line('sesión', current),
        line('hoy', today),
        line('mes', month),
        line('proyecto', thisProject),
        'subcomandos: hoy | proyectos | dias | set <usd> | reset',
      ].join('\n'),
    }
  })
}
