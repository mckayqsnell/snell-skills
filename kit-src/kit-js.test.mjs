// Tests for kit.js, the page script. Guards against two functions with the same
// name in one scope: the later one silently replaces the earlier one (1.1.0 had
// two place() functions, so Play on every scene threw).   node --test kit-src/kit-js.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KIT_JS = fileURLToPath(new URL('./kit.js', import.meta.url));

// Lists every `function name` declared twice in the same { } block. kit.js is
// strict mode, so a function declared in a block belongs to that block. Strings,
// comments and regex literals are skipped; named function expressions
// (`x = function name () {}`) don't count, since they bind no name outside.
export function duplicateFunctions(src) {
  const scopes = [new Map()];
  const dups = [];
  let line = 1, prev = '', prevWord = '';
  const regexCanStart = () => prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || prevWord === 'return';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '\n') { line++; continue; }
    if (/\s/.test(c)) continue;
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; i--; continue; }
    if (c === '/' && src[i + 1] === '*') { const end = src.indexOf('*/', i + 2); line += (src.slice(i, end).match(/\n/g) || []).length; i = end + 1; continue; }
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) { if (src[i] === '\\') i++; else if (src[i] === '\n') line++; }
      prev = c; prevWord = ''; continue;
    }
    if (c === '/' && regexCanStart()) {
      let inClass = false;
      for (i++; i < src.length; i++) {
        if (src[i] === '\\') { i++; continue; }
        if (src[i] === '[') inClass = true; else if (src[i] === ']') inClass = false;
        else if (src[i] === '/' && !inClass) break;
      }
      while (/[a-z]/i.test(src[i + 1] || '')) i++;
      prev = '/'; prevWord = ''; continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (/[\w$]/.test(src[j] || '')) j++;
      const word = src.slice(i, j);
      if (word === 'function' && !'=(,:?!&|'.includes(prev) && prevWord !== 'return') {
        const m = /^\s*([A-Za-z_$][\w$]*)/.exec(src.slice(j));
        if (m) {
          const scope = scopes[scopes.length - 1];
          if (scope.has(m[1])) dups.push({ name: m[1], first: scope.get(m[1]), again: line });
          else scope.set(m[1], line);
        }
      }
      prev = 'a'; prevWord = word; i = j - 1; continue;
    }
    if (c === '{') scopes.push(new Map());
    else if (c === '}' && scopes.length > 1) scopes.pop();
    prev = c; prevWord = '';
  }
  return dups;
}

test('kit.js declares no function name twice in one scope', () => {
  const dups = duplicateFunctions(readFileSync(KIT_JS, 'utf8'));
  assert.deepEqual(dups, [], dups.map((d) => `function ${d.name} on line ${d.first} is replaced by another on line ${d.again}`).join('\n'));
});

test('the check finds a repeat in the same scope, as 1.1.0 had', () => {
  const src = "(function () { 'use strict';\n  function place(path, t, g) {}\n  var s = '{'; var r = /}/g;\n  function place(t) {}\n})();";
  assert.deepEqual(duplicateFunctions(src), [{ name: 'place', first: 2, again: 4 }]);
});

test('the same name in different scopes, or as a function expression, is fine', () => {
  const src = '(function () {\n  function f() { function g() {} }\n  function h() { function g() {} }\n  var a = function f() {}; go(function f() {});\n})();';
  assert.deepEqual(duplicateFunctions(src), []);
});
