/*
 * Minimal yargs compatibility layer implemented on top of cli-nano.
 * Exports small Option/Argv types so other TS modules can `import type` them
 * using the './yargs-compat.js' path that the codebase already uses.
 */
import { basename } from 'node:path';

import * as cliNano from 'cli-nano';

export interface OptMeta {
  alias?: string | string[];
  type?: 'string' | 'boolean' | 'number' | 'array';
  describe?: string;
  group?: string;
  required?: boolean;
  hidden?: boolean;
  requiresArg?: boolean;
  defaultDescription?: string;
  default?: any;
  conflicts?: string | string[];
  variadic?: boolean;
}

export type Options = OptMeta;

export type Argv<T = any> = {
  options: (opts: Record<string, OptMeta>) => Argv<T>;
  usage: (s: string) => Argv<T>;
  option: (key: string, opt: OptMeta) => Argv<T>;
  parserConfiguration: (opts: Record<string, any>) => Argv<T>;
  group: (keys: string[] | object, label: string) => Argv<T>;
  command: (...args: any[]) => Argv<T>;
  positional: (name: string, opt: OptMeta) => Argv<T>;
  getOptions: () => { hiddenOptions: string[] } & Record<string, any>;
  recommendCommands: () => Argv<T>;
  demandCommand: (n: number, msg?: string) => Argv<T>;
  strict: () => Argv<T>;
  fail: (fn: (msg: string | undefined, err?: Error) => void) => Argv<T>;
  alias: (a: string, b: string) => Argv<T>;
  wrap: (w: number | null) => Argv<T>;
  epilogue: (s: string) => Argv<T>;
  exitProcess: (b: boolean) => Argv<T>;
  detectLocale: (b: boolean) => Argv<T>;
  showHelpOnFail: (b: boolean) => Argv<T>;
  parse: (argv?: string[] | string, context?: any) => any;
  exit: (code: number, err?: Error) => void;
  terminalWidth: () => number;
} & ((argv?: any[], cwd?: string) => Argv<T>);

class YargsInstance {
  private commands: Array<any> = [];
  private optsMeta: Record<string, OptMeta> = {};
  private positionalMeta: Record<string, OptMeta> = {};
  private _hiddenOptions: string[] = [];
  private failFn: ((msg: string | undefined, err?: Error) => void) | null = null;
  private recommend = false;
  private demandCmdCount = 0;
  private strictMode = false;
  private _exitProcess = true;
  public parsed: any = { argv: {} };
  private _usage: string | null = null;
  private _parserConfiguration: Record<string, any> | null = null;
  private _checkFn: ((argv: any) => boolean | void) | null = null;

  constructor(
    private argvIn?: any[],
    private cwd?: string
  ) {}

  options(opts: Record<string, OptMeta>) {
    for (const k of Object.keys(opts)) {
      this.optsMeta[k] = opts[k];
      if (opts[k].hidden) this._hiddenOptions.push(k);
    }
    return this;
  }

  usage(s: string) {
    this._usage = s;
    return this;
  }

  parserConfiguration(opts: Record<string, any>) {
    this._parserConfiguration = opts;
    return this;
  }

  option(key: string, opt: OptMeta) {
    return this.options({ [key]: opt });
  }

  group(_keys: string[] | object, _label: string) {
    return this;
  }

  positional(name: string, opt: OptMeta) {
    this.positionalMeta[name] = opt;
    return this;
  }

  getOptions() {
    return Object.assign({ hiddenOptions: this._hiddenOptions }, this.optsMeta as any);
  }

  recommendCommands() {
    this.recommend = true;
    return this;
  }

  check(fn: (argv: any) => boolean | void) {
    this._checkFn = fn;
    return this;
  }

  demandCommand(n: number) {
    this.demandCmdCount = n;
    return this;
  }

  strict() {
    this.strictMode = true;
    return this;
  }

  fail(fn: (msg: string | undefined, err?: Error) => void) {
    this.failFn = fn;
    return this;
  }

  alias(a: string, b: string) {
    if (this.optsMeta[b]) {
      const cur = this.optsMeta[b];
      cur.alias = cur.alias ? (Array.isArray(cur.alias) ? [...cur.alias, a] : [cur.alias, a]) : a;
      this.optsMeta[b] = cur;
    } else {
      this.optsMeta[a] = { alias: b } as any;
    }
    return this;
  }

  wrap(_w: number | null) {
    return this;
  }

  epilogue(_s: string) {
    return this;
  }

  exitProcess(b: boolean) {
    this._exitProcess = b;
    return this;
  }

  detectLocale(_b: boolean) {
    return this;
  }

  locale(_loc: string) {
    return this;
  }

  showHelpOnFail(_b: boolean) {
    return this;
  }

  terminalWidth() {
    return (process.stdout as any)?.columns || 80;
  }

  command(...args: any[]) {
    if (typeof args[0] === 'string') {
      const name = args[0];
      const describe = args[1];
      const builder = args[2];
      const handler = args[3];
      this.commands.push({ name, describe, builder, handler });
      return this;
    }

    const mod = args[0];
    const name = mod.command || (mod as any).default?.command || (mod as any).command;
    const describe = mod.describe || (mod as any).default?.describe || (mod as any).describe;
    const builder = mod.builder || (mod as any).default?.builder;
    const handler = mod.handler || (mod as any).default?.handler;
    this.commands.push({ name, describe, builder, handler, module: mod });
    return this;
  }

  parse(
    argvIn?: string[] | string,
    context?: any,
    parseFn?: (err: Error | undefined, parsedArgv: any, yargsOutput: string) => void
  ) {
    if (typeof context === 'function') {
      parseFn = context as any;
      // callers passed a bare callback (no context object). Clear `context`
      // so later checks that test for an object (e.g. `context.onRejected`)
      // won't treat the function as a context and prematurely invoke the
      // callback before handlers run.
      context = undefined;
    }

    if (context && typeof context === 'object' && context.cwd) this.cwd = context.cwd;

    const raw = Array.isArray(argvIn) ? argvIn.slice() : typeof argvIn === 'string' ? argvIn.split(/\s+/) : this.argvIn || [];
    this.parsed = { argv: { _: raw.slice() } } as any;
    let parseFnCalled = false;

    const cmd = raw[0] && !raw[0].startsWith('-') ? raw[0] : undefined;

    const matched = this.commands.find((c) => {
      if (!c) return false;
      if (typeof c.name === 'string') return c.name.split(' ')[0] === cmd;
      return false;
    });

    if (this.demandCmdCount > 0 && !cmd) {
      const msg = 'A command is required.';
      const err = new Error(msg);
      if (typeof parseFn === 'function') {
        parseFn(err, undefined, '');
        parseFnCalled = true;
      }
      if (this.failFn) this.failFn(msg, undefined);
      throw err;
    }

    if (!matched && cmd && this.strictMode) {
      const exitErr = new Error(`Unknown argument: ${cmd}`);
      if (typeof parseFn === 'function') {
        parseFn(exitErr, undefined, '');
        parseFnCalled = true;
      }
      if (this.failFn) {
        // build candidates and pick best fuzzy match
        const candidates = this.commands
          .map((c: any) => (typeof c.name === 'string' ? c.name.split(' ')[0] : null))
          .filter(Boolean) as string[];
        function lev(a: string, b: string) {
          const A = a.split('');
          const B = b.split('');
          const dp: number[][] = Array.from({ length: A.length + 1 }, () => Array(B.length + 1).fill(0));
          for (let i = 0; i <= A.length; i++) dp[i][0] = i;
          for (let j = 0; j <= B.length; j++) dp[0][j] = j;
          for (let i = 1; i <= A.length; i++) {
            for (let j = 1; j <= B.length; j++) {
              const cost = A[i - 1] === B[j - 1] ? 0 : 1;
              dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
            }
          }
          return dp[A.length][B.length];
        }
        let best: string | null = null;
        let bestScore = Infinity;
        for (const c of candidates) {
          const s = lev(cmd, c);
          if (s < bestScore) {
            bestScore = s;
            best = c;
          }
        }

        const message = best ? `Did you mean ${best}?` : `Unknown command "${cmd}"`;
        this.failFn(message);
      }
      throw exitErr;
    }

    const optsMeta = { ...this.optsMeta };
    let commandPositionalMeta: Record<string, OptMeta> = {};
    // Note: we previously used a local parity shim here. cli-nano now provides
    // the required yargs-like parity features; call it directly.
    if (typeof matched?.builder === 'function') {
      const child: any = new YargsInstance();
      matched.builder(child);
      Object.assign(optsMeta, child.optsMeta);
      if (child._checkFn) this._checkFn = child._checkFn;
      if (child.failFn) this.failFn = child.failFn;
      commandPositionalMeta = { ...(child.positionalMeta || {}) };
    }

    const rawForParse = raw.slice();
    if (matched && cmd) rawForParse.shift();

    let parsed: any;
    // make `config` and `argvForParse` available to subsequent normalization
    // logic outside the cli-nano branch
    let config: any = { options: {} };
    let argvForParse: any = rawForParse || [];
    try {
      if (cliNano && typeof (cliNano as any).parseArgs === 'function') {
        config = { options: {} };
        for (const [k, v] of Object.entries(optsMeta)) {
          config.options[k] = {
            alias: v.alias,
            type: v.type === 'array' ? 'array' : v.type,
            describe: v.describe,
            // `required` means the option must be present; keep that
            // semantics only when explicitly declared. `requiresArg` is
            // a separate hint that the option expects a value.
            required: (v as any).required === true ? true : undefined,
            requiresArg: (v as any).requiresArg === true ? true : undefined,
          };
        }
        // Ensure command structure exists; cli-nano expects a positionals array
        if (!config.command) config.command = { name: undefined, positionals: [] };
        if (matched?.module?.command) {
          config.command.name = matched.module.command;
          const posSource = Object.entries(commandPositionalMeta).length ? commandPositionalMeta : this.positionalMeta;
          for (const [pk, pm] of Object.entries(posSource as Record<string, any>)) {
            const posMeta = pm as any;
            config.command.positionals.push({
              name: pk,
              type: posMeta.type as any,
              variadic: posMeta.variadic,
              required: posMeta.required,
            });
          }
        }
        const originalArgv = process.argv;
        try {
          // Remove explicit empty-string tokens (tests pass '' to mean "no arg").
          // Preserve `--` tokens which signal a passthrough.
          argvForParse = rawForParse || [];
          let argvForParseFiltered = argvForParse.filter((a: any) => a === '--' || (typeof a === 'string' && a.length > 0));

          // Normalize grouped values: convert `--opt a b` into
          // `--opt a --opt b` so cli-nano treats adjacent values as
          // multiple occurrences instead of unknown positional args.
          try {
            const opts = config.options || {};
            const normalized: any[] = [];
            for (let i = 0; i < argvForParseFiltered.length; i++) {
              const tok = argvForParseFiltered[i];
              if (typeof tok === 'string' && tok.startsWith('--')) {
                const optName = tok.slice(2);
                // Normalize multi-valued grouped tokens only for known opts
                // that historically accepted adjacent values (e.g. scope/ignore).
                const shouldNormalize =
                  Object.prototype.hasOwnProperty.call(opts, optName) &&
                  (optName === 'scope' || optName === 'ignore' || (opts[optName] as any)?.type === 'array');
                if (shouldNormalize) {
                  // push the flag and its first value (if any)
                  normalized.push(tok);
                  const val = argvForParseFiltered[i + 1];
                  if (val !== undefined && val !== '--' && !(typeof val === 'string' && val.startsWith('-'))) {
                    normalized.push(val);
                    // consume additional adjacent non-option tokens as extra occurrences
                    let j = i + 2;
                    while (j < argvForParseFiltered.length) {
                      const extra = argvForParseFiltered[j];
                      if (extra === '--' || (typeof extra === 'string' && extra.startsWith('-'))) break;
                      // represent as another occurrence of the flag
                      normalized.push(tok);
                      normalized.push(extra);
                      j++;
                    }
                    i = j - 1;
                    continue;
                  }
                }
              }
              normalized.push(tok);
            }
            argvForParseFiltered = normalized;
          } catch (e) {
            /* ignore normalization errors */
          }

          // Pre-flight: detect flags that require an argument but are missing
          // their value (e.g. `--scope` with no following token) and throw
          // the yargs-like message tests expect ('Not enough arguments').
          const opts = config.options || {};
          for (const optKey of Object.keys(opts)) {
            if ((opts[optKey] as any)?.requiresArg) {
              const idx = argvForParseFiltered.indexOf(`--${optKey}`);
              if (idx !== -1) {
                const next = argvForParseFiltered[idx + 1];
                if (next === undefined || (typeof next === 'string' && next.startsWith('--'))) {
                  throw new Error('Not enough arguments');
                }
              }
            }
          }

          process.argv = [originalArgv[0], originalArgv[1], ...(argvForParseFiltered || [])];
          parsed = (cliNano as any).parseArgs(config);
        } finally {
          process.argv = originalArgv;
        }
      } else {
        // very small fallback: treat everything as positional
        parsed = { _: rawForParse.slice() };
      }
    } catch (err) {
      // Surface parse errors to callers/tests: invoke parse callback/fail
      // handlers then rethrow so upstream can react to validation failures.
      if (typeof parseFn === 'function') {
        try {
          parseFn(err as Error, undefined, '');
          parseFnCalled = true;
        } catch (e) {
          /* ignore */
        }
      }
      if (this.failFn) {
        try {
          this.failFn((err as Error).message, err as Error);
        } catch (e) {
          /* ignore */
        }
      }
      throw err;
    }

    // Note: do not expose `__rawArgs` or `--` here to preserve the
    // historical yargs-shim shape returned by this helper. Tests expect
    // a minimal options object (no `__rawArgs` or `--` properties).

    if (!parsed || typeof parsed !== 'object') parsed = { _: rawForParse.slice() };

    // Apply option defaults from declared metadata when parsed value is missing
    try {
      for (const [optKey, meta] of Object.entries(optsMeta)) {
        const kebab = optKey;
        const camel = optKey.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
        const curVal = parsed[optKey] ?? parsed[camel] ?? parsed[kebab];
        if ((curVal === undefined || curVal === null) && (meta as any)?.default !== undefined) {
          const def = (meta as any).default;
          parsed[optKey] = def;
          parsed[camel] = def;
          parsed[kebab] = def;
        }
      }
    } catch (e) {
      /* ignore */
    }

    // Support multiple occurrences of the same option (e.g. `--scope a --scope b`)
    for (const optKey of Object.keys(optsMeta)) {
      const occurrences: string[] = [];
      if (Array.isArray(rawForParse)) {
        for (let i = 0; i < rawForParse.length; i++) {
          if (rawForParse[i] === `--${optKey}`) {
            // collect all adjacent non-option tokens after the flag
            for (let j = i + 1; j < rawForParse.length; j++) {
              const val = rawForParse[j];
              if (val === '--' || (typeof val === 'string' && val.startsWith('-'))) break;
              occurrences.push(val);
            }
          }
        }
      }

      if (occurrences.length > 1) {
        const camel = optKey.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
        parsed[optKey] = occurrences;
        if (parsed[camel] === undefined) parsed[camel] = occurrences;
      }
    }

    // Enforce conflicts declared in option metadata (throw on incompatible flags)
    for (const [optKey, meta] of Object.entries(optsMeta)) {
      const conflicts = (meta as any)?.conflicts;
      if (!conflicts) continue;
      const conflictList = Array.isArray(conflicts) ? conflicts : [conflicts];

      const provided = (name: string, m?: any) => {
        // consider the option provided if the raw argv contains the long
        // form, the negated --no- form, or any short alias token.
        try {
          if (!Array.isArray(rawForParse)) return false;
          if (rawForParse.indexOf(`--${name}`) !== -1) return true;
          if (rawForParse.indexOf(`--no-${name}`) !== -1) return true;
          const alias = (m || meta)?.alias;
          if (alias) {
            const list = Array.isArray(alias) ? alias : [alias];
            for (const a of list) {
              const short = String(a).replace(/^-+/, '');
              if (short.length === 1 && rawForParse.indexOf(`-${short}`) !== -1) return true;
            }
          }
        } catch (e) {
          /* ignore */
        }
        return false;
      };

      for (const c of conflictList) {
        if (provided(optKey, meta) && provided(c, optsMeta[c])) {
          throw new Error(`Conflicting options: ${optKey} and ${c}`);
        }
      }
    }

    // Handle inverted alias declarations where the option key is a short
    // letter and the `alias` points to the canonical long name (e.g.
    // `{ a: { alias: 'all' } }`). Ensure the canonical long property is
    // set when the parser returned the short form or when the long-form
    // token was supplied on the CLI.
    try {
      for (const [optKey, meta] of Object.entries(optsMeta)) {
        const alias = (meta as any)?.alias;
        if (!alias) continue;
        const aliasList = Array.isArray(alias) ? alias : [alias];
        for (const a of aliasList) {
          if (!a) continue;
          const long = String(a).replace(/^-+/, '');
          const camel = long.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
          if (Object.prototype.hasOwnProperty.call(parsed, optKey) && parsed[optKey] !== undefined) {
            if (parsed[long] === undefined) parsed[long] = parsed[optKey];
            if (parsed[camel] === undefined) parsed[camel] = parsed[optKey];
          }
          if (Array.isArray(rawForParse) && rawForParse.indexOf(`--${long}`) !== -1) {
            if (parsed[long] === undefined) parsed[long] = true;
            if (parsed[camel] === undefined) parsed[camel] = true;
          }
        }
      }
    } catch (e) {
      /* ignore */
    }

    // Support multiple occurrences of the same option (e.g. `--scope a --scope b`)
    {
      const optsMeta2 = config.options || {};
      for (const optKey of Object.keys(optsMeta2)) {
        const occurrences: string[] = [];
        if (Array.isArray(argvForParse)) {
          for (let i = 0; i < argvForParse.length; i++) {
            if (argvForParse[i] === `--${optKey}`) {
              for (let j = i + 1; j < argvForParse.length; j++) {
                const val = argvForParse[j];
                if (val === '--' || (typeof val === 'string' && val.startsWith('-'))) break;
                occurrences.push(val);
              }
            }
          }
        }

        if (occurrences.length > 1) {
          const camel = optKey.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
          parsed[optKey] = occurrences;
          if (parsed[camel] === undefined) parsed[camel] = occurrences;
        }
      }
    }

    // Enforce conflicts declared in option metadata (throw on incompatible flags)
    {
      const optsMeta2 = config.options || {};
      for (const [optKey, meta] of Object.entries(optsMeta2)) {
        const conflicts = (meta as any)?.conflicts;
        if (!conflicts) continue;
        const conflictList = Array.isArray(conflicts) ? conflicts : [conflicts];

        const provided2 = (name: string, m?: any) => {
          try {
            if (!Array.isArray(argvForParse)) return false;
            if (argvForParse.indexOf(`--${name}`) !== -1) return true;
            if (argvForParse.indexOf(`--no-${name}`) !== -1) return true;
            const alias = (m || meta)?.alias;
            if (alias) {
              const list = Array.isArray(alias) ? alias : [alias];
              for (const a of list) {
                const short = String(a).replace(/^-+/, '');
                if (short.length === 1 && argvForParse.indexOf(`-${short}`) !== -1) return true;
              }
            }
          } catch (e) {
            /* ignore */
          }
          return false;
        };

        for (const c of conflictList) {
          if (provided2(optKey, meta) && provided2(c, optsMeta2[c])) {
            throw new Error(`Conflicting options: ${optKey} and ${c}`);
          }
        }
      }
    }

    // Defensive: ensure --no-private maps to the positive `private: false`
    try {
      if (parsed && (parsed['no-private'] === true || parsed.noPrivate === true)) {
        parsed.private = false;
      }
    } catch (e) {
      /* ignore */
    }

    // Defensive: ensure --no-private maps to the positive `private: false`
    // since downstream code checks `options.private === false`.
    try {
      if (parsed && (parsed['no-private'] === true || parsed.noPrivate === true)) {
        parsed.private = false;
      }
    } catch (e) {
      /* ignore */
    }

    // Remove boolean options that were not explicitly provided and have no default.
    // cli-nano sets booleans to false by default; preserve yargs semantics by
    // leaving them undefined unless the user passed them or a default exists.
    try {
      for (const [optKey, meta] of Object.entries(optsMeta)) {
        if ((meta as any)?.type === 'boolean' && (meta as any).default === undefined) {
          const providedLong = `--${optKey}`;
          const providedNoLong = `--no-${optKey}`;
          const provided =
            Array.isArray(rawForParse) &&
            (rawForParse.indexOf(providedLong) !== -1 || rawForParse.indexOf(providedNoLong) !== -1);
          if (!provided) {
            const camel = optKey.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
            delete parsed[optKey];
            delete parsed[camel];
            const noCamel = `no${camel[0] ? camel[0].toUpperCase() + camel.slice(1) : ''}`;
            delete parsed[noCamel];
            delete parsed[`no-${optKey}`];
          }
        }
      }
    } catch (e) {
      /* ignore */
    }

    // cli-nano now defaults boolean options to false; no-op here.

    // Ensure --no- variants map to the positive option names (yargs parity).
    // Handle cases where the config itself contains `no-` prefixed keys (e.g.
    // 'no-private') by mapping the negation to the canonical positive name
    // (e.g. 'private') so downstream consumers can test `options.private === false`.
    try {
      for (const optKey of Object.keys(optsMeta)) {
        const kebabRaw = optKey;
        // derive canonical base name (strip leading 'no-' if present)
        const baseKebab = kebabRaw.startsWith('no-') ? kebabRaw.slice(3) : kebabRaw;
        const camelBase = baseKebab.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
        const kebab = baseKebab;

        const noKebab = `no-${kebab}`;
        const noCamel = `no${camelBase[0] ? camelBase[0].toUpperCase() + camelBase.slice(1) : ''}`;

        const negToken1 = `--${noKebab}`;
        const negToken2 = `--${noCamel}`;
        const negativeProvided =
          Array.isArray(rawForParse) && (rawForParse.indexOf(negToken1) !== -1 || rawForParse.indexOf(negToken2) !== -1);

        const positiveFalse =
          (Object.prototype.hasOwnProperty.call(parsed, camelBase) && parsed[camelBase] === false) ||
          (Object.prototype.hasOwnProperty.call(parsed, kebab) && parsed[kebab] === false) ||
          (Object.prototype.hasOwnProperty.call(parsed, baseKebab) && parsed[baseKebab] === false);

        if (negativeProvided) {
          // set canonical positive forms to false
          parsed[camelBase] = false;
          parsed[kebab] = false;
          parsed[baseKebab] = false;

          // also preserve the explicit no- variants as true for parity
          parsed[noCamel] = true;
          parsed[noKebab] = true;
          // If the config declared a separate `no-` key, mirror the positive
          // false there as well to keep earlier code paths working.
          if (kebabRaw !== baseKebab) parsed[kebabRaw] = true;
        } else if (positiveFalse) {
          parsed[noCamel] = true;
          parsed[noKebab] = true;
        }
      }
    } catch (e) {
      /* ignore */
    }

    parsed.$0 = basename(process.argv[1] || '') || '';

    this.parsed = { argv: parsed };

    if (this._checkFn) {
      try {
        this._checkFn(parsed);
      } catch (err) {
        if (this.failFn) this.failFn((err as Error).message, err as Error);
        throw err;
      }
    }

    if (matched) {
      // If the command module provides a `runWithCliNano` pilot runner, prefer
      // invoking it so consumers/tests can opt into `cli-nano` parsing without
      // changing the module's default export. This mirrors the handler
      // invocation semantics (sync/async) expected by callers.
      const runner = (matched.module && (matched.module.runWithCliNano || matched.module.default?.runWithCliNano)) as any;
      if (typeof runner === 'function') {
        if (context && typeof parseFn === 'function') {
          try {
            parseFn(undefined, parsed, '');
            parseFnCalled = true;
          } catch (e) {
            /* ignore */
          }
        }

        try {
          const res = runner(Array.isArray(rawForParse) ? rawForParse : undefined, context);
          if (res && typeof res.then === 'function') {
            res.then(
              () => {
                if (!context && typeof parseFn === 'function') {
                  parseFn(undefined, parsed, '');
                  parseFnCalled = true;
                }
              },
              (err: any) => {
                if (!context && typeof parseFn === 'function') {
                  parseFn(err, parsed, '');
                  parseFnCalled = true;
                }
                if (context && typeof context.onRejected === 'function') context.onRejected(err);
              }
            );
          } else {
            if (!context && typeof parseFn === 'function') {
              parseFn(undefined, parsed, '');
              parseFnCalled = true;
            }
          }
        } catch (err) {
          if (!context && typeof parseFn === 'function') parseFn(err as Error, parsed, '');
          if (context && typeof context.onRejected === 'function') context.onRejected(err as Error);
        }

        // runner handled the command; skip normal handler
        return parsed;
      }

      const handler = (matched.handler || matched.module?.handler || matched.module?.default?.handler) as any;
      if (typeof handler === 'function') {
        const handlerArgv = Object.assign({}, parsed);
        if (context && typeof context === 'object') {
          for (const [k, v] of Object.entries(context)) {
            if (k === 'onResolved' || k === 'onRejected') handlerArgv[k] = v;
            else if (handlerArgv[k] === undefined) handlerArgv[k] = v;
          }
        }
        if (context && typeof parseFn === 'function') {
          try {
            parseFn(undefined, parsed, '');
            parseFnCalled = true;
          } catch (e) {
            // ignore
          }
        }
        try {
          const res = handler(handlerArgv);
          if (res && typeof res.then === 'function') {
            res.then(
              () => {
                if (!context && typeof parseFn === 'function') {
                  parseFn(undefined, parsed, '');
                  parseFnCalled = true;
                }
              },
              (err: any) => {
                if (typeof parseFn === 'function') {
                  parseFn(err, parsed, '');
                  parseFnCalled = true;
                }
                if (context && typeof context.onRejected === 'function') context.onRejected(err);
              }
            );
          } else {
            if (!context && typeof parseFn === 'function') {
              parseFn(undefined, parsed, '');
              parseFnCalled = true;
            }
          }
        } catch (err) {
          if (!context && typeof parseFn === 'function') {
            parseFn(err as Error, parsed, '');
            parseFnCalled = true;
          }
          if (context && typeof context.onRejected === 'function') context.onRejected(err as Error);
        }
      }
    }

    // Ensure parse callback is invoked in all synchronous paths to avoid
    // leaving callers waiting for a callback (tests rely on this).
    if (typeof parseFn === 'function' && !parseFnCalled) {
      try {
        parseFn(undefined, parsed, '');
      } catch (e) {
        /* ignore */
      }
    }

    return parsed;
  }

  exit(_code?: number, _err?: Error) {
    // record exit but don't exit process during tests
  }
}

export default function yargsFactory(argv?: any[], cwd?: string) {
  return new YargsInstance(argv, cwd) as any;
}

export { yargsFactory as yargs };

// Shared helper: parse a subcommand using cli-nano with yargs-compatible
// normalization. Exported so pilots in command modules can reuse the same
// orchestration used by `YargsInstance.parse`.
export function parseSubcommand(cliNanoConfig: any, rawArgs?: string[], context?: any, extraGlobalOptions?: Record<string, any>) {
  function expandShortFlags(args: string[] = []) {
    const out: string[] = [];
    const idx = args.indexOf('--');
    const head = idx === -1 ? args : args.slice(0, idx);
    const tail = idx === -1 ? [] : args.slice(idx);

    for (const a of head) {
      if (a.startsWith('-') && !a.startsWith('--') && a.length > 2 && /^-[A-Za-z]+$/.test(a)) {
        for (let i = 1; i < a.length; i++) out.push('-' + a[i]);
      } else {
        out.push(a);
      }
    }

    return out.concat(tail);
  }

  const globalOptions = Object.assign({}, extraGlobalOptions || {});

  const config: any = {
    command: Object.assign({}, cliNanoConfig.command || {}, {
      options: cliNanoConfig.options || {},
    }),
    options: Object.assign({}, globalOptions, cliNanoConfig.options || {}),
  };
  // Treat empty-string tokens as absent (yargs historically ignores `` as no-arg)
  const inputArgs = Array.isArray(rawArgs) ? rawArgs.filter((a) => a !== '' && a !== undefined && a !== null) : [];
  const expanded = expandShortFlags(inputArgs || []);

  const originalArgv = process.argv;
  try {
    const cmdName = (cliNanoConfig.command as any)?.name;
    const cmdPositionals = (cliNanoConfig.command as any)?.positionals || [];
    const shouldInjectCmd = cmdName && Array.isArray(cmdPositionals) && cmdPositionals.length > 0;
    const argvForParse = shouldInjectCmd ? [cmdName, ...expanded] : [...expanded];
    process.argv = [process.argv[0], process.argv[1], ...argvForParse];
    const parsed: any = (cliNano as any).parseArgs(config as any);
    // parse complete

    if (!Array.isArray(parsed._)) parsed._ = [];

    const pos = (cliNanoConfig.command as any)?.positionals || [];
    // If we prepended the command name into argvForParse to scope parsing,
    // cli-nano will include that token as parsed._[0]. Adjust positional
    // mapping to account for the injected token so named positionals map
    // to the user-provided values (not the subcommand token).
    const injectedCmd = (cliNanoConfig.command as any)?.name;
    const injectedAtFront = injectedCmd && Array.isArray(parsed._) && parsed._[0] === injectedCmd;
    const offset = injectedAtFront ? 1 : 0;

    if (Array.isArray(parsed._) && pos.length) {
      for (let i = 0; i < pos.length; i++) {
        const name = pos[i].name;
        if (pos[i].variadic) {
          parsed[name] = parsed._.slice(i + offset);
          break;
        }
        if (parsed._[i + offset] !== undefined) parsed[name] = parsed._[i + offset];
      }
    }

    if (context && typeof context === 'object') {
      for (const [k, v] of Object.entries(context)) {
        if (k === 'onResolved' || k === 'onRejected') parsed[k] = v;
        else if (parsed[k] === undefined) parsed[k] = v;
      }
    }

    // expose any -- tokens and raw args if the parser didn't provide them
    if (parsed.__rawArgs === undefined) parsed.__rawArgs = argvForParse.slice();
    const doubledashIndex = Array.isArray(argvForParse) ? argvForParse.indexOf('--') : -1;
    if (doubledashIndex !== -1 && parsed['--'] === undefined) parsed['--'] = argvForParse.slice(doubledashIndex + 1);

    // If we injected the subcommand token (e.g. 'exec') to scope parsing,
    // remove it from the public-facing arrays so downstream code sees the
    // same argv shape as before (no leading subcommand token).
    if (injectedAtFront) {
      if (Array.isArray(parsed.__rawArgs) && parsed.__rawArgs[0] === injectedCmd) parsed.__rawArgs.shift();
      if (Array.isArray(parsed._) && parsed._[0] === injectedCmd) parsed._.shift();
      // If the parser assigned the injected token to a named positional
      // property (e.g. `parsed.bump === 'version'`), remove it so callers
      // see the same shape as before injection.
      try {
        const posMeta = (cliNanoConfig.command as any)?.positionals || [];
        for (const p of posMeta) {
          const name = p.name;
          if (parsed[name] === injectedCmd) {
            delete parsed[name];
          }
        }
      } catch (e) {
        /* ignore */
      }
      // If we injected the subcommand token but there are no remaining
      // positional args or passthrough args, the user did not supply a
      // command. Clear any `cmd` property set by cli-nano so callers can
      // detect the missing command and throw as expected.
      if ((!Array.isArray(parsed._) || parsed._.length === 0) && (!parsed['--'] || parsed['--'].length === 0)) {
        if (parsed.cmd === injectedCmd) delete parsed.cmd;
      }
    }

    // Ensure parsed._ contains only true positional args (strip any
    // option-like tokens that some parsers may leave in the array).
    // Downstream code expects positional-only tokens here.
    if (Array.isArray(parsed._)) {
      parsed._ = parsed._.filter((t: any) => typeof t === 'string' && !t.startsWith('-'));
    }

    // Ensure kebab-cased option names are available as camelCase properties
    try {
      const opts = config.options || {};
      for (const optKey of Object.keys(opts)) {
        const kebabRaw = optKey;
        // derive canonical base name (strip leading 'no-' if present)
        const baseKebab = kebabRaw.startsWith('no-') ? kebabRaw.slice(3) : kebabRaw;
        const camelBase = baseKebab.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
        const kebab = baseKebab;

        const noKebab = `no-${kebab}`;
        const noCamel = `no${camelBase[0] ? camelBase[0].toUpperCase() + camelBase.slice(1) : ''}`;

        const negToken1 = `--${noKebab}`;
        const negToken2 = `--${noCamel}`;
        const negativeProvided =
          Array.isArray(argvForParse) && (argvForParse.indexOf(negToken1) !== -1 || argvForParse.indexOf(negToken2) !== -1);

        const positiveFalse =
          (Object.prototype.hasOwnProperty.call(parsed, camelBase) && parsed[camelBase] === false) ||
          (Object.prototype.hasOwnProperty.call(parsed, kebab) && parsed[kebab] === false) ||
          (Object.prototype.hasOwnProperty.call(parsed, baseKebab) && parsed[baseKebab] === false);

        if (negativeProvided) {
          // set canonical positive forms to false
          parsed[camelBase] = false;
          parsed[kebab] = false;
          parsed[baseKebab] = false;

          // also preserve the explicit no- variants as true for parity
          parsed[noCamel] = true;
          parsed[noKebab] = true;
          // If the config declared a separate `no-` key, mirror the positive
          // false there as well to keep earlier code paths working.
          if (kebabRaw !== baseKebab) parsed[kebabRaw] = true;
        } else if (positiveFalse) {
          parsed[noCamel] = true;
          parsed[noKebab] = true;
        }
      }
    } catch (e) {
      /* ignore */
    }

    // Ensure parser-returned short aliases (e.g. 'a', 'l') map to the
    // canonical option names declared in the config (e.g. 'all', 'long').
    try {
      const opts = config.options || {};
      for (const [optKey, meta] of Object.entries(opts)) {
        const aliases = (meta as any)?.alias || undefined;
        if (!aliases) continue;
        const aliasList = Array.isArray(aliases) ? aliases : [aliases];
        for (const a of aliasList) {
          if (!a) continue;
          // If parser yielded the alias name (e.g. parsed.a) and the canonical
          // property is not set, copy the value across to the canonical keys.
          if (Object.prototype.hasOwnProperty.call(parsed, a) && parsed[a] !== undefined) {
            if (parsed[optKey] === undefined) parsed[optKey] = parsed[a];
            const camel = optKey.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
            if (parsed[camel] === undefined) parsed[camel] = parsed[a];
            if (parsed[optKey] === undefined) parsed[optKey] = parsed[a];
          }
        }
      }
    } catch (e) {
      /* ignore */
    }

    // Map single-letter aliases (e.g. `-l` -> `long`) in case cli-nano
    // returned short-name properties instead of the configured long names.
    try {
      const opts = config.options || {};
      for (const [optKey, meta] of Object.entries(opts)) {
        const alias = (meta as any)?.alias;
        if (!alias) continue;
        const aliases = Array.isArray(alias) ? alias : [alias];
        for (const a of aliases) {
          // alias may be provided as a single char like 'l' or with leading '-'
          const short = String(a).replace(/^-+/, '');
          if (Object.prototype.hasOwnProperty.call(parsed, short) && parsed[short] !== undefined) {
            // copy short alias value to full-name and camel form
            const camel = optKey.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
            parsed[optKey] = parsed[short];
            parsed[camel] = parsed[short];
          }
        }
      }
    } catch (e) {
      /* ignore */
    }

    // Handle inverted alias declarations where the option key is a short
    // letter and the `alias` points to the canonical long name (e.g.
    // `{ a: { alias: 'all' } }`). In that case cli-nano may return the
    // short property (`a`) and callers expect the long form (`all`).
    try {
      const opts = config.options || {};
      for (const [optKey, meta] of Object.entries(opts)) {
        const alias = (meta as any)?.alias;
        if (!alias) continue;
        const aliasList = Array.isArray(alias) ? alias : [alias];
        for (const a of aliasList) {
          if (!a) continue;
          // If parser yielded the short-name property (optKey) and the
          // alias is the canonical long name, copy the value across.
          const long = String(a).replace(/^-+/, '');
          const camel = long.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
          // If parser yielded the short-name property (optKey), copy value
          // to the long canonical names.
          if (Object.prototype.hasOwnProperty.call(parsed, optKey) && parsed[optKey] !== undefined) {
            if (parsed[long] === undefined) parsed[long] = parsed[optKey];
            if (parsed[camel] === undefined) parsed[camel] = parsed[optKey];
          }
          // If the user supplied the long-form token (e.g. `--all`) but the
          // option was declared under the short key, ensure the canonical
          // long property is set so tests and consumers see it.
          if (Array.isArray(argvForParse) && argvForParse.indexOf(`--${long}`) !== -1) {
            if (parsed[long] === undefined) parsed[long] = true;
            if (parsed[camel] === undefined) parsed[camel] = true;
          }
        }
      }
    } catch (e) {
      /* ignore */
    }

    // Remove boolean options that were not explicitly provided and have no default.
    // cli-nano sets booleans to false by default; preserve yargs semantics by
    // leaving them undefined unless the user passed them or a default exists.
    try {
      const optsMeta = config.options || {};
      for (const [optKey, meta] of Object.entries(optsMeta)) {
        if ((meta as any)?.type === 'boolean' && (meta as any).default === undefined) {
          const providedLong = `--${optKey}`;
          const providedNoLong = `--no-${optKey}`;
          // also consider short-letter aliases (e.g. -a for --all)
          const aliases = (meta as any)?.alias;
          const shortAliases: string[] = [];
          if (aliases) {
            if (Array.isArray(aliases)) shortAliases.push(...aliases.map((s) => `-${s}`));
            else shortAliases.push(`-${aliases}`);
          }

          const provided =
            Array.isArray(argvForParse) &&
            (argvForParse.indexOf(providedLong) !== -1 ||
              argvForParse.indexOf(providedNoLong) !== -1 ||
              shortAliases.some((s) => argvForParse.indexOf(s) !== -1));

          if (!provided) {
            const camel = optKey.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
            const noCamel = `no${camel[0] ? camel[0].toUpperCase() + camel.slice(1) : ''}`;
            delete parsed[optKey];
            delete parsed[camel];
            delete parsed[noCamel];
            delete parsed[`no-${optKey}`];
          }
        }
      }
    } catch (e) {
      /* ignore */
    }

    // NOTE: Do not enforce a missing command here. Command modules (e.g.
    // `exec`) may require an explicit command and should validate and
    // throw their own `ENOCOMMAND` error. Keeping this helper agnostic
    // prevents false-positives for commands that don't accept a subcommand
    // token (like `init`).

    return parsed;
  } finally {
    process.argv = originalArgv;
  }
}
