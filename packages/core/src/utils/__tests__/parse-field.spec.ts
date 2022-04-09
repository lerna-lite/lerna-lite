import { parseField } from '../parse-field';

describe("parseField()", () => {
  it("should throw when failing to parse property from the JSON input", () => {
    const input = { name: 'test', version: "^1.0.0" };
    const inputJson = JSON.stringify(input);

    expect(() => parseField(`'${inputJson}'`, 'version')).toThrow(`Failed parsing JSON config key version: '${inputJson}'`);
  });

  it("should return True when input field is 'true'", () => {
    const input = true;
    const output = parseField(`${input}`, 'version');

    expect(output).toBeTrue();
  });

  it("should return False when input field is 'false'", () => {
    const input = false;
    const output = parseField(`${input}`, 'version');

    expect(output).toBeFalse();
  });

  it("should return Null when input field is 'null'", () => {
    const input = null;
    const output = parseField(`${input}`, 'version');

    expect(output).toBeNull();
  });

  it("should return Undefined when input field is 'undefined'", () => {
    const input = undefined;
    const output = parseField(`${input}`, 'version');

    expect(output).toBeUndefined();
  });

  it("should return number when key is found to be a Number in types.ts filed", () => {
    const input = 123;
    const output = parseField(`${input}`, 'searchlimit');

    expect(output).toBe(123);
  });
});
