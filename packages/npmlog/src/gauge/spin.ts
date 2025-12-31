/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */
export default function spin(spinstr: string, spun: number) {
  return spinstr[spun % spinstr.length];
}
