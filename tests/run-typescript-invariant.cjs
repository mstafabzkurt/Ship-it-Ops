// Minimal local runner for TypeScript invariant files; keeps the project dependency-free.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const target = process.argv[2];
if (!target) throw new Error('Usage: node tests/run-typescript-invariant.cjs <test-file>');
require(path.resolve(target));
