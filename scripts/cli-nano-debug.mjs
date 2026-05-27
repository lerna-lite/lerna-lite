import * as cliNano from 'cli-nano';

const config = {
  command: {
    name: 'exec',
    positionals: [
      { name: 'cmd', type: 'string' },
      { name: 'args', variadic: true, type: 'string' },
    ],
  },
  options: { stream: { type: 'boolean' }, parallel: { type: 'boolean' } },
};

function run(args) {
  const original = process.argv.slice();
  try {
    process.argv = [process.argv[0], process.argv[1], ...args];
    console.log('process.argv:', process.argv);
    const parsed = cliNano.parseArgs(config);
    console.log('parsed:', parsed);
  } catch (err) {
    console.error('parse error:', err && err.message, err);
  } finally {
    process.argv = original;
  }
}

run(['--parallel', 'ls']);
run(['ls']);
run(['exec', '--parallel', 'ls']);
