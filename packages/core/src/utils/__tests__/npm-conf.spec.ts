const npmConfModule = require("../npm-conf");
import { npmConf, toNerfDart, Conf } from '../npm-conf';

describe("@lerna/npm-conf", () => {
  it("exports default factory", () => {
    expect(npmConfModule).toBeDefined();
    expect(Conf).toBeDefined();
    expect(typeof npmConfModule.npmConf).toBe("function");
  });

  it("exports named defaults", () => {
    const { defaults } = npmConfModule;
    expect(defaults).toBeDefined();
    expect(typeof defaults).toBe("object");
  });

  it("exports named Conf", () => {
    const { Conf } = npmConfModule;
    expect(Conf).toBeDefined();
    expect(typeof Conf).toBe("function");
  });

  it("exports named toNerfDart", () => {
    const { toNerfDart: toNerfDartMod } = npmConfModule;
    expect(toNerfDart).toBeDefined();
    expect(toNerfDartMod).toBeDefined();
    expect(typeof toNerfDart).toBe("function");
    expect(toNerfDart("https://npm.example.com")).toBe("//npm.example.com/");
    expect(toNerfDart("https://npm.example.com/some-api/npm-virtual/")).toBe(
      "//npm.example.com/some-api/npm-virtual/"
    );
  });

  it("defaults cli parameter to empty object", () => {
    const conf = npmConfModule.npmConf();

    expect(conf.sources.cli.data).toEqual({});
  });

  it("overwrites default with cli key", () => {
    const conf = npmConf({ registry: "https://npm.example.com" });

    expect(conf.get("registry")).toBe("https://npm.example.com");
  });

  it("does not overwrite default with undefined cli key", () => {
    const conf = npmConf({ registry: undefined });

    expect(conf.get("registry")).toBe("https://registry.npmjs.org/");
  });
});
