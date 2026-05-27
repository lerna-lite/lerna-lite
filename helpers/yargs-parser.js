// Minimal yargs-parser implementation placed under helpers for test utilities.
function toCamel(s) {
  return s.replace(/-([a-z])/g, (_m, ch) => ch.toUpperCase());
}

/**
 * Minimal yargs-parser replacement used by tests.
 * @param {string|string[]} input
 * @param {{array?:Array<string|{key:string}>}} [opts]
 * @returns {any}
 */
function parse(input, opts) {
  const argv = /** @type {any} */ ({ _: [] });
  const arrayKeys = [];
  if (opts && Array.isArray(opts.array)) {
    for (const a of opts.array) {
      if (typeof a === 'string') {
        if (a.startsWith('-')) {
          const key = a.replace(/^-+/, '').split('=')[0];
          if (key) arrayKeys.push(key);
        }
      } else if (a && typeof a.key === 'string') {
        arrayKeys.push(a.key);
      }
    }
  }
  let tokens = [];
  if (typeof input === 'string') {
    tokens = input.trim().length ? input.split(/\s+/) : [];
  } else if (Array.isArray(input)) {
    tokens = input.slice();
  } else {
    return argv;
  }

  while (tokens.length) {
    const token = tokens.shift();
    if (token === '--') {
      argv._ = argv._.concat(tokens);
      break;
    }
    if (token.startsWith('--')) {
      if (token.startsWith('--no-')) {
        const key = token.slice(5);
        const k = toCamel(key);
        argv[k] = false;
        argv[key] = false;
      } else if (token.includes('=')) {
        const [key, ...rest] = token.slice(2).split('=');
        const val = rest.join('=');
        const k = toCamel(key);
        argv[k] = val;
        argv[key] = val;
      } else {
        const key = token.slice(2);
        const k = toCamel(key);
        if (tokens.length && !tokens[0].startsWith('-')) {
          if (arrayKeys.includes(key) || arrayKeys.includes(k)) {
            const vals = [];
            while (tokens.length && !tokens[0].startsWith('-')) {
              vals.push(tokens.shift());
            }
            if (argv[k] !== undefined) {
              argv[k] = Array.isArray(argv[k]) ? argv[k].concat(vals) : [argv[k]].concat(vals);
            } else {
              argv[k] = vals;
            }
            argv[key] = argv[k];
          } else {
            const val = tokens.shift();
            if (argv[k] !== undefined) {
              argv[k] = Array.isArray(argv[k]) ? argv[k].concat([val]) : [argv[k], val];
            } else {
              argv[k] = val;
            }
            argv[key] = argv[k];
          }
        } else {
          // flags without explicit values
          if (arrayKeys.includes(key) || arrayKeys.includes(k)) {
            argv[k] = argv[k] !== undefined ? (Array.isArray(argv[k]) ? argv[k] : [argv[k]]) : [];
            argv[key] = argv[k];
          } else {
            argv[k] = true;
            argv[key] = true;
          }
        }
      }
      continue;
    }

    if (token.startsWith('-') && token.length > 1) {
      const shorts = token.slice(1).split('');
      for (let i = 0; i < shorts.length; i++) {
        const s = shorts[i];
        const key = s;
        if (i === shorts.length - 1 && tokens.length && !tokens[0].startsWith('-')) {
          const val = tokens.shift();
          argv[key] = val;
        } else {
          argv[key] = true;
        }
      }
      continue;
    }

    argv._.push(token);
  }

  return argv;
}

export default parse;
