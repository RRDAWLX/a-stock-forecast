declare module "jsonc" {
  function parse(text: string): unknown;
  function readSync(filePath: string): unknown;
  function stripComments(text: string): string;
  function stringify(value: unknown, replacer?: unknown, space?: string | number): string;
}