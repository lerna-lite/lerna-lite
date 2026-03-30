// Returns true if the current terminal supports color output, based on TTY and env vars.
export function isColorSupported(): boolean {
  return process.stdout.isTTY !== false && process.env.NO_COLOR !== '1' && process.env.FORCE_COLOR !== '0';
}
