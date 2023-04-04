const { writePackage: actualWritePackage } = await vi.importActual<any>('write-pkg');

const registryMap = new Map();

// by default, act like a spy that populates registry
export const writePackage = vi.fn((fp, data) => {
  registryMap.set(data.name, data);

  return actualWritePackage(fp, data);
});

const mockUpdatedManifest = (name) => registryMap.get(name);

// a convenient format for assertions
function mockUpdatedVersions() {
  const result = {};

  registryMap.forEach((pkg, name) => {
    result[name] = pkg.version;
  });

  return result;
}

// keep test data isolated
afterEach(() => {
  registryMap.clear();
});

export const registry = registryMap;
export const updatedManifest = mockUpdatedManifest;
export const updatedVersions = mockUpdatedVersions;
export default { registry, updatedManifest, updatedVersions, writePackage };
