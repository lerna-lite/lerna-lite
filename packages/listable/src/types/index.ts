/** Because yargs.InferredOptionsTypes is next to useless here */
export interface ListableOptions {
  _: string;

  /** Show information as a JSON array */
  json: boolean;

  /** Show information as newline-delimited JSON */
  ndjson: boolean;

  /** Show private packages that are normally hidden */
  all: boolean;

  /** alias to all */
  a: boolean;

  /** Show extended information */
  long: boolean;

  /** alias to long */
  l: boolean;

  /** alias to parseable */
  p: boolean;

  /** Show parseable output instead of columnified view */
  parseable: boolean;

  /** Sort packages in topological order instead of lexical by directory */
  toposort: boolean;

  /** Show dependency graph as a JSON-formatted adjacency list */
  graph: boolean;
}

export type YargListableOption = {
  [option in keyof ListableOptions]: {
    group: string;
    describe: string;
    type: string;
    alias?: string;
  };
};
