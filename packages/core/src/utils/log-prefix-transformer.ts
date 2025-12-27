import { Transform } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';

export function addPrefixTransformer(options: any = {}) {
  const { tag = '', mergeMultiline = false, timeStamp = false, format = 'text' } = options;

  const decoder = new StringDecoder('utf8');
  let last = '';
  let previousLine: any = null; // To store the previous line for merging

  return new Transform({
    transform(chunk, _enc, callback) {
      last += decoder.write(chunk);
      const lines = last.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/g);
      last = lines.pop() || ''; // Keep the last incomplete line

      for (const line of lines) {
        if (line) {
          if (mergeMultiline && /^\s+/.test(line)) {
            // If merging is enabled and the line starts with whitespace
            if (previousLine) {
              previousLine.msg += '\n' + line; // Merge with the previous line
            } else {
              previousLine = {
                msg: line,
                time: Date.now(),
                tag,
              };
            }
          } else {
            // If not merging, push the previous line if it exists
            if (previousLine) {
              this.push(formatLogEvent(previousLine, { timeStamp, format }));
              previousLine = null; // Reset previous line
            }
            // Create a new log event for the current line
            const logEvent = {
              msg: line,
              time: Date.now(),
              tag,
            };
            this.push(formatLogEvent(logEvent, { timeStamp, format }));
          }
        }
      }
      callback();
    },
    flush(callback) {
      last += decoder.end();
      if (last) {
        const logEvent = {
          msg: last,
          time: Date.now(),
          tag,
        };
        this.push(formatLogEvent(logEvent, { timeStamp, format }));
      }
      // Push the previous line if it exists
      if (previousLine) {
        this.push(formatLogEvent(previousLine, { timeStamp, format }));
      }
      callback();
    },
  });
}

function formatLogEvent(logEvent, options) {
  const tagString = formatTag(logEvent.tag);
  let line;

  if (options.format === 'json') {
    // Format as JSON
    line = JSON.stringify({
      msg: logEvent.msg,
      time: options.timeStamp ? new Date(logEvent.time).toISOString() : undefined,
      tag: tagString,
    });
  } else {
    // Default text format
    line = logEvent.msg;
    if (tagString) {
      line = `${tagString} ${line}`;
    }
    if (options.timeStamp) {
      line = `${new Date(logEvent.time).toISOString()} ${line}`;
    }
  }

  return line.replace(/\n/g, '\\n') + '\n'; // Replace newlines with escaped newlines
}

function formatTag(tag: string | Record<string, string>): string {
  if (typeof tag === 'object') {
    return Object.entries(tag)
      .map(([key, value]) => `${key}:${value}`) // No space after the colon
      .join(' '); // Join with a space
  }
  return tag; // If it's a string, return it directly
}