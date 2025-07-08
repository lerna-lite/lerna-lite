import { Transform } from 'stream';

/**
 * Creates a Transform stream that adds a specified prefix to each line of input data.
 * This function is designed to replace the `strong-log-transformer` and provides a way to
 * format output by prepending a prefix to each line of text. It is particularly useful for
 * enhancing log messages or command output by clearly identifying the source or context of
 * the messages.
 *
 * @param {string} [prefix] - The prefix to be added to the beginning of each line. If no
 * prefix is provided, the output will remain unchanged.
 */
export function addPrefixTransformer(prefix?: string) {
  const newLineSeparator = process.platform.startsWith('win') ? '\r\n' : '\n';
  return new Transform({
    transform(chunk: Buffer | string, _encoding: BufferEncoding, callback: Function) {
      const list = chunk.toString().split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/g);
      list.filter(Boolean).forEach((m) => this.push(prefix ? prefix + ' ' + m + newLineSeparator : m + newLineSeparator));
      callback();
    },
  });
}
