/* v8 ignore file */
import { readFileSync } from 'node:fs';

/**
 * Simple INI parser - handles basic key=value pairs
 */
function parseIni(content: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#') || line.trim().startsWith(';')) {
      continue;
    }

    // Match key=value pairs
    const match = line.match(/^\s*([^=]+?)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value: any = match[2].trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Try to parse as JSON types
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value === 'null') value = null;
      else if (value === 'undefined') value = undefined;
      else if (/^\d+$/.test(value)) value = parseInt(value, 10);
      else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);

      result[key] = value;
    }
  }

  return result;
}

/**
 * A simplified TypeScript reimplementation of config-chain's core functionality
 * Manages a chain of configuration objects with priority (first wins)
 */
export class ConfigChain {
  list: Array<Record<string, any>> = [];
  sources: Record<string, { path?: string; type?: string; data?: Record<string, any> }> = {};

  constructor(base?: Record<string, any>) {
    if (base) {
      this.list.push(base);
    }
  }

  /**
   * Get a configuration value from the chain
   * Searches from the beginning (highest priority) to end (lowest priority)
   */
  get(key: string, where?: string): any {
    if (where) {
      const source = this.sources[where];
      if (source?.data && Object.hasOwnProperty.call(source.data, key)) {
        return source.data[key];
      }
      return undefined;
    }

    // Search through the chain from highest to lowest priority
    for (const config of this.list) {
      if (config && Object.hasOwnProperty.call(config, key)) {
        return config[key];
      }
    }
    return undefined;
  }

  /**
   * Set a configuration value
   */
  set(key: string, value: any, where?: string): this {
    let target: Record<string, any>;

    if (where) {
      const source = this.sources[where];
      if (!source?.data) {
        throw new Error(`not found ${where}`);
      }
      target = source.data;
    } else {
      target = this.list[0];
      if (!target) {
        throw new Error('cannot set, no confs!');
      }
    }

    target[key] = value;
    return this;
  }

  /**
   * Delete a configuration value
   */
  del(key: string, where?: string): this {
    if (where) {
      const source = this.sources[where];
      if (!source?.data) {
        throw new Error(`not found ${where}`);
      }
      delete source.data[key];
    } else {
      // Delete from all layers
      for (const config of this.list) {
        if (config) {
          delete config[key];
        }
      }
    }
    return this;
  }

  /**
   * Add a configuration object to the chain
   */
  add(data: Record<string, any>, marker?: string | { __source__: string }): this {
    const sourceName = typeof marker === 'string' ? marker : marker?.__source__;

    if (marker && typeof marker === 'object' && '__source__' in marker) {
      // Replace placeholder marker with actual data
      const i = this.list.indexOf(marker as any);
      if (i !== -1) {
        this.list[i] = data;
        if (sourceName) {
          this.sources[sourceName] = this.sources[sourceName] || {};
          this.sources[sourceName].data = data;
        }
      }
    } else {
      // Add new configuration layer
      this.list.unshift(data); // Add to beginning (highest priority)
      if (sourceName) {
        this.sources[sourceName] = this.sources[sourceName] || {};
        this.sources[sourceName].data = data;
      }
    }

    return this;
  }

  /**
   * Add a configuration file to the chain
   */
  addFile(file: string, type?: string, name?: string): this {
    name = name || file;
    const marker = { __source__: name };

    this.sources[name] = { path: file, type: type };
    this.list.push(marker as any);

    try {
      const contents = readFileSync(file, 'utf8');
      const data = this.parse(contents, file, type);
      this.add(data, marker);
    } catch (err) {
      // File doesn't exist or can't be read, add empty config
      this.add({}, marker);
    }

    return this;
  }

  /**
   * Add environment variables with a prefix to the chain
   */
  addEnv(prefix: string, env: Record<string, string | undefined> = process.env, name = 'env'): this {
    const data: Record<string, string> = {};
    const prefixLength = prefix.length;

    for (const key in env) {
      if (key.indexOf(prefix) === 0 && env[key]) {
        data[key.substring(prefixLength)] = env[key]!;
      }
    }

    this.sources[name] = { data };
    return this.add(data, name);
  }

  /**
   * Parse configuration content (JSON or INI)
   */
  parse(content: string, file?: string, type?: string): Record<string, any> {
    content = String(content);

    if (!type) {
      // Auto-detect: try JSON first, fall back to INI
      try {
        return JSON.parse(content);
      } catch {
        return parseIni(content);
      }
    } else if (type === 'json') {
      return JSON.parse(content);
    } else {
      return parseIni(content);
    }
  }

  /**
   * Push a configuration object onto the end of the chain (lowest priority)
   */
  push(config: Record<string, any>): void {
    this.list.push(config);
  }

  /**
   * Get a snapshot of all merged configuration
   */
  get snapshot(): Record<string, any> {
    const result: Record<string, any> = {};

    // Merge from lowest to highest priority (reverse order)
    for (let i = this.list.length - 1; i >= 0; i--) {
      const config = this.list[i];
      if (config && typeof config === 'object' && !('__source__' in config)) {
        Object.assign(result, config);
      }
    }

    return result;
  }
}
