import type { EngineInterface, Register } from 'claude-code'

// Each rule names what the user must have asked for in their current message
// for the action to pass. The check is on the prompt the turn started with,
// never on the model's own text, so the model cannot talk itself past a rule.

type Rule = {
  id: string
  test: RegExp
  // Words that, present in the user's prompt, mean they asked for it.
  asked: RegExp
  // Blocked even when asked, unless `/guard allow` was run first.
  isHard?: boolean
  why: string
}

const GIT_WRITE =
  /\bgit\b(?:\s+-[-\w=]+)*\s+(commit|push|merge|rebase|reset|tag|cherry-pick|revert|clean|restore|checkout\s+--|branch\s+-[dD]|stash\s+(?:drop|clear|pop)|filter-branch|update-ref|reflog\s+expire|gc\s+--prune)\b/i

const RULES: Rule[] = [
  {
    id: 'git-force',
    test: /\bgit\b.*\bpush\b.*(?:\s--force\b|\s-f\b|\s--force-with-lease\b|\s\+[\w/]+)/i,
    asked: /force|forzad|forzar|--force/i,
    isHard: true,
    why: 'git push forzado reescribe el historial remoto',
  },
  {
    id: 'git-history',
    test: /\bgit\b(?:\s+-[-\w=]+)*\s+(?:reset\s+--hard|rebase|filter-branch|reflog\s+expire|gc\s+--prune|clean\s+-\w*[fdx]|checkout\s+--\s|restore\b(?!\s+--staged)|stash\s+(?:drop|clear))/i,
    asked: /reset|rebase|limpia|clean|descarta|restaur|revert|stash|deshaz|deshacer/i,
    why: 'descarta trabajo local o reescribe historial',
  },
  {
    id: 'git-write',
    test: GIT_WRITE,
    asked:
      /\b(commit|commitea|push|pushea|sube|subir|súbelo|subelo|merge|mergea|fusiona|tag|etiqueta|revert|cherry[- ]pick|publica|release)\b/i,
    why: 'el usuario no pidió commit, push ni otra escritura de git en este mensaje',
  },
  {
    id: 'rm-outside',
    test: /\brm\b\s+(?:-[a-zA-Z]*[rR][a-zA-Z]*\s+|-[a-zA-Z]*\s+)*(?:"|')?(?:\/(?!(?:private\/)?tmp\/|Users\/[^/]+\/\.claude\/)|~|\$HOME|\.\.(?:\/|\s|$)|\*\s*$)/,
    asked: /borra todo|elimina todo|rm -rf|fuera del repo/i,
    isHard: true,
    why: 'rm recursivo fuera del repositorio',
  },
  {
    id: 'disk',
    test: /\b(?:mkfs(?:\.\w+)?|dd\s+if=|>\s*\/dev\/(?:sd|disk|nvme)|chmod\s+-R\s+777\s+\/|chown\s+-R\s+\w+\s+\/\s*$|diskutil\s+erase)/i,
    asked: /(?!)/,
    isHard: true,
    why: 'operación destructiva sobre disco o permisos del sistema',
  },
  {
    id: 'k8s-prod',
    test: /\b(?:kubectl|helm|oc)\b.*\b(?:apply|delete|rollout|scale|drain|cordon|patch|replace|install|upgrade|uninstall|exec)\b.*\b(?:prod|production|produccion|producción|prd)\b|\b(?:kubectl|helm|oc)\b.*--context[= ]\S*prod/i,
    asked: /\b(?:prod|production|producción|produccion|prd)\b/i,
    why: 'cambio en un clúster de producción',
  },
  {
    id: 'sql-drop',
    test: /\b(?:DROP\s+(?:TABLE|DATABASE|SCHEMA|INDEX)|TRUNCATE\s+(?:TABLE\s+)?\w+|DELETE\s+FROM\s+\w+\s*;?\s*$)\b/i,
    asked: /\b(?:drop|truncate|borra la tabla|elimina la tabla|vacía|vacia)\b/i,
    why: 'DROP, TRUNCATE o DELETE sin WHERE',
  },
]

const SECRET_FILE =
  /(^|\/)(\.env(?:\.(?!example|sample|template|dist)[\w.-]+)?|id_rsa|id_ed25519|[\w.-]+\.(?:pem|key|p12|pfx|jks|keystore)|credentials(?:\.json)?|service-account[\w.-]*\.json)$/i

const short = (text: string, max = 70) => text.replace(/\s+/g, ' ').trim().slice(0, max)

type Denial = { deny: string }

const FAILED: Denial = { deny: 'guard-rails: la comprobación falló, acción detenida por seguridad.' }

function block($: EngineInterface, log: string[], rule: string, why: string, what: string): Denial {
  log.push(`${rule}: ${what}`)
  if (log.length > 30) log.shift()
  $.ui.status(`guard: bloqueado ${rule}`)
  $.ui.toast(`guard-rails bloqueó ${rule}: ${short(what, 50)}`)

  return {
    deny: `guard-rails bloqueó esta acción (${rule}: ${why}). No la repitas ni la rodees. Si hace falta, deja el trabajo preparado y dile al usuario que la ejecute él, o que corra /guard allow y vuelva a pedirla.`,
  }
}

// Which rule a Bash command trips, given the user's prompt; null when none.
function judgeCommand(command: string, prompt: string, allowOnce: boolean): Rule | 'allowed-once' | null {
  for (const rule of RULES) {
    if (!rule.test.test(command)) continue
    if (allowOnce) return 'allowed-once'
    if (!rule.isHard && rule.asked.test(prompt)) return null

    return rule
  }

  return null
}

function judgeFile(filePath: string, prompt: string, allowOnce: boolean): 'blocked' | 'allowed-once' | null {
  if (!SECRET_FILE.test(filePath)) return null
  const name = filePath.split('/').pop() ?? filePath
  if (allowOnce) return 'allowed-once'
  if (prompt.includes(name) || (/\.env\b/i.test(prompt) && /\.env/i.test(name))) return null

  return 'blocked'
}

export const register: Register = on => {
  let isOn = true
  let allowOnce = false
  let prompt = ''
  const log: string[] = []

  on('session.start', async ($, e, next) => {
    isOn = (await $.store.get('enabled')) !== false
    await $.command.register({
      name: 'guard',
      description: 'guard-rails: status | on | off | allow (permite la próxima acción bloqueada) | log',
      argumentHint: '[status|on|off|allow|log]',
    })

    return next(e)
  })

  on('command.run', { command: 'guard' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'on' || arg === 'off') {
      isOn = arg === 'on'
      await $.store.set('enabled', isOn)

      return { text: `guard-rails ${isOn ? 'activado' : 'desactivado'}` }
    }
    if (arg === 'allow') {
      allowOnce = true

      return { text: 'guard-rails: la próxima acción que una regla bloquee pasará una vez. Vuelve a pedirla.' }
    }
    if (arg === 'log') {
      return {
        text: log.length
          ? ['guard-rails, últimos bloqueos:', ...log].join('\n')
          : 'guard-rails: sin bloqueos en esta sesión',
      }
    }

    return {
      text: [
        `guard-rails: ${isOn ? 'activo' : 'inactivo'}${allowOnce ? ', con un permiso pendiente' : ''}`,
        'reglas: git-force (dura), git-history, git-write, rm-outside (dura), disk (dura), k8s-prod, sql-drop, secret-file',
        'una regla pasa cuando el mensaje actual del usuario pide esa acción; las duras solo con /guard allow',
        `bloqueos en esta sesión: ${log.length}`,
      ].join('\n'),
    }
  })

  on('prompt.submit', ($, e, next) => {
    if (e.command === undefined && e.isMeta === undefined && e.origin.kind !== 'plugin') {
      prompt = e.text
    }

    return next(e)
  })

  on('tool.call', { tool: 'Bash' }, ($, e, next) => {
    if (!isOn) return next(e)
    const verdict = judgeCommand(e.command, prompt, allowOnce)
    if (verdict === null) return next(e)
    if (verdict === 'allowed-once') {
      allowOnce = false
      log.push(`permitido una vez: ${short(e.command)}`)

      return next(e)
    }

    return block($, log, verdict.id, verdict.why, short(e.command))
  }).catch(($, e, next) => (next.called ? next(e) : FAILED))

  on('tool.call', { tool: 'Edit' }, ($, e, next) => {
    if (!isOn) return next(e)
    const verdict = judgeFile(e.file_path, prompt, allowOnce)
    if (verdict === null) return next(e)
    if (verdict === 'allowed-once') {
      allowOnce = false

      return next(e)
    }

    return block($, log, 'secret-file', 'archivo de credenciales o entorno', e.file_path)
  }).catch(($, e, next) => (next.called ? next(e) : FAILED))

  on('tool.call', { tool: 'Write' }, ($, e, next) => {
    if (!isOn) return next(e)
    const verdict = judgeFile(e.file_path, prompt, allowOnce)
    if (verdict === null) return next(e)
    if (verdict === 'allowed-once') {
      allowOnce = false

      return next(e)
    }

    return block($, log, 'secret-file', 'archivo de credenciales o entorno', e.file_path)
  }).catch(($, e, next) => (next.called ? next(e) : FAILED))
}
