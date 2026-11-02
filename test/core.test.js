import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseContentType } from '../src/index.js';

test('parses a simple media type', () => {
  const result = parseContentType('text/html');
  assert.equal(result.mediaType, 'text/html');
  assert.equal(result.type, 'text');
  assert.equal(result.subtype, 'html');
  assert.deepEqual(result.parameters, {});
  assert.equal(result.charset, undefined);
  assert.equal(result.boundary, undefined);
});

test('lowercases the media type', () => {
  const result = parseContentType('TEXT/HTML');
  assert.equal(result.mediaType, 'text/html');
});

test('parses charset parameter', () => {
  const result = parseContentType('text/html; charset=utf-8');
  assert.equal(result.mediaType, 'text/html');
  assert.equal(result.charset, 'utf-8');
  assert.deepEqual(result.parameters, { charset: 'utf-8' });
});

test('parses quoted parameter values', () => {
  const result = parseContentType('text/plain; charset="utf-8"');
  assert.equal(result.charset, 'utf-8');
});

test('parses boundary parameter', () => {
  const result = parseContentType('multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW');
  assert.equal(result.boundary, '----WebKitFormBoundary7MA4YWxkTrZu0gW');
});

test('parses quoted boundary', () => {
  const result = parseContentType('multipart/form-data; boundary="----WebKitFormBoundary"');
  assert.equal(result.boundary, '----WebKitFormBoundary');
});

test('handles multiple parameters', () => {
  const result = parseContentType('multipart/form-data; boundary=abc; charset=utf-8');
  assert.equal(result.mediaType, 'multipart/form-data');
  assert.equal(result.boundary, 'abc');
  assert.equal(result.charset, 'utf-8');
  assert.deepEqual(result.parameters, { boundary: 'abc', charset: 'utf-8' });
});

test('handles whitespace around separators', () => {
  const result = parseContentType('  text/html ;  charset = utf-8  ');
  assert.equal(result.mediaType, 'text/html');
  assert.equal(result.charset, 'utf-8');
});

test('handles escaped quotes in quoted values', () => {
  const result = parseContentType('text/plain; title="say \\"hello\\""');
  assert.equal(result.parameters.title, 'say "hello"');
});

test('skips malformed parameters without a value', () => {
  const result = parseContentType('text/html; charset; boundary=abc');
  assert.equal(result.mediaType, 'text/html');
  assert.equal(result.charset, undefined);
  assert.equal(result.boundary, 'abc');
});

test('ignores empty parameter values', () => {
  const result = parseContentType('text/html; charset=');
  assert.equal(result.charset, '');
});

test('handles empty string', () => {
  const result = parseContentType('');
  assert.equal(result.mediaType, '');
  assert.equal(result.type, '');
  assert.equal(result.subtype, '');
  assert.deepEqual(result.parameters, {});
});

test('handles media type with no parameters', () => {
  const result = parseContentType('application/json');
  assert.equal(result.mediaType, 'application/json');
  assert.equal(result.type, 'application');
  assert.equal(result.subtype, 'json');
});

test('handles parameter names case-insensitively', () => {
  const result = parseContentType('text/html; Charset=utf-8');
  assert.equal(result.charset, 'utf-8');
  assert.deepEqual(result.parameters, { charset: 'utf-8' });
});

test('throws on non-string input', () => {
  assert.throws(() => parseContentType(42), TypeError);
  assert.throws(() => parseContentType(null), TypeError);
});

test('handles trailing semicolon', () => {
  const result = parseContentType('text/html;');
  assert.equal(result.mediaType, 'text/html');
  assert.deepEqual(result.parameters, {});
});
