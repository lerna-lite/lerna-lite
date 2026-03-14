import { afterEach, vi } from 'vitest';

const { Package} = await vi.importActual<any>('../package');

export const registry = new Map();
const origSerialize = Package.prototype.serialize;

Package.prototype.serialize = function () {
  const json = this.toJSON();
  registry.set(json.name, json);
  return origSerialize.call(this);
};

export const writePackage: any = vi.fn();
writePackage.registry = registry;
writePackage.updatedManifest = (name: string) => registry.get(name);
writePackage.updatedVersions = () => {
  const result: Record<string, string> = {};
  registry.forEach((pkg: any, name: string) => {
    result[name] = pkg.version;
  });
  return result;
};

// keep test data isolated
afterEach(() => {
  registry.clear();
});

