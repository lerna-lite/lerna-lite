// JSON and move utilities
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, type WriteFileOptions, writeFileSync } from 'node:fs';
import { access, cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Recursively copies a file or directory (async). */
export async function copy(src: string, dest: string) {
  await cp(src, dest, { recursive: true });
}

/** Recursively copies a file or directory (sync). */
export function copySync(src: string, dest: string) {
  cpSync(src, dest, { recursive: true });
}

/** Ensures that a directory exists (async). */
export async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

/** Ensures that a directory exists (sync). */
export function ensureDirSync(dir: string) {
  mkdirSync(dir, { recursive: true });
}

/** Moves a file or directory, falling back to copy+remove on cross-device (async). */
export async function move(src: string, dest: string) {
  try {
    await rename(src, dest);
  } catch (err: any) {
    /* v8 ignore if */
    if (err.code === 'EXDEV') {
      await cp(src, dest, { recursive: true });
      await rm(src, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}

/** Moves a file or directory, falling back to copy+remove on cross-device (sync). */
export function moveSync(src: string, dest: string) {
  try {
    renameSync(src, dest);
  } catch (err: any) {
    /* v8 ignore if */
    if (err.code === 'EXDEV') {
      cpSync(src, dest, { recursive: true });
      rmSync(src, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
}

/** Writes data to a file, creating parent directories if needed (async). */
export async function outputFile(file: string, data: string | Buffer, options?: BufferEncoding) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, data, options);
}

/** Writes data to a file, creating parent directories if needed (sync). */
export function outputFileSync(file: string, data: string | Buffer, options?: WriteFileOptions) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data, options);
}

/** Writes a JSON object to a file, creating parent directories if needed (async). */
export async function outputJson(file: string, obj: any) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(obj, null, 2));
}

/** Writes a JSON object to a file, creating parent directories if needed (sync). */
export function outputJsonSync(file: string, obj: any) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(obj, null, 2));
}

/** Checks if a path exists (async). */
export async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Checks if a path exists (sync). */
export function pathExistsSync(path: string) {
  return existsSync(path);
}

/** Reads and parses a JSON file (async). */
export async function readJson(file: string) {
  const data = await readFile(file, 'utf8');
  return JSON.parse(data);
}

/** Reads and parses a JSON file (sync). Returns undefined if not found and options.throws is false. */
export function readJsonSync(file: string, options?: { throws?: boolean }) {
  try {
    const data = readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (options?.throws === false) {
      return undefined;
    }
    throw err;
  }
}

/** Recursively removes a file or directory (sync). */
export function removeSync(path: string) {
  rmSync(path, { recursive: true, force: true });
}

/** Recursively removes a file or directory (async). */
export async function remove(path: string) {
  await rm(path, { recursive: true, force: true });
}

/**
 * Executes a boolean predicate callback and returns its result.
 * Returns `false` if the callback throws any error, allowing safe use
 * in filter predicates where file-system operations may fail (e.g. on
 * missing or inaccessible paths).
 *
 * @param predicate - A callback that returns a boolean value.
 * @returns The boolean result of the callback, or `false` if it throws.
 */
export function tryOrFalse(predicate: () => boolean): boolean {
  try {
    return predicate();
  } catch {
    return false;
  }
}

/**
 * Writes a JSON object to a file (async). 
 * @param file The path to the file to write.
 * @param obj The JSON object to write.
 * @param options Options for writing the JSON file. Can include:
  - `spaces` `<Number> | <String>` Number of spaces to indent; or a string to use for indentation (i.e. pass `'\t'` for tab indentation). See [the docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_space_argument) for more info.
  - `EOL` `<String>` Set EOL character. Default is `\n`.
  - `replacer` [JSON replacer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter)
  - Also accepts [`fs.writeFileSync()` options](https://nodejs.org/api/fs.html#fs_fs_writefilesync_file_data_options)
 */
export async function writeJson(
  file: string,
  obj: any,
  options?: {
    spaces?: number | string;
    EOL?: string;
    replacer?: (this: any, key: string, value: any) => any;
  } & WriteFileOptions
) {
  const jsonString = JSON.stringify(obj, options?.replacer, options?.spaces ?? 2);
  await writeFile(file, jsonString.replace(/\n/g, options?.EOL ?? '\n'), options);
}

/**
 * Writes a JSON object to a file (sync).
 * @param file The path to the file to write.
 * @param obj The JSON object to write.
 * @param options Options for writing the JSON file. Can include:
  - `spaces` `<Number> | <String>` Number of spaces to indent; or a string to use for indentation (i.e. pass `'\t'` for tab indentation). See [the docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_space_argument) for more info.
  - `EOL` `<String>` Set EOL character. Default is `\n`.
  - `replacer` [JSON replacer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter)
  - Also accepts [`fs.writeFileSync()` options](https://nodejs.org/api/fs.html#fs_fs_writefilesync_file_data_options)
 */
export function writeJsonSync(
  file: string,
  obj: any,
  options?: {
    spaces?: number | string;
    EOL?: string;
    replacer?: (this: any, key: string, value: any) => any;
  } & WriteFileOptions
) {
  const jsonString = JSON.stringify(obj, options?.replacer, options?.spaces ?? 2);
  writeFileSync(file, jsonString.replace(/\n/g, options?.EOL ?? '\n'), options);
}
