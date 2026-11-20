/**
 * Draft 2020-12 subset used by monster.schema.json.
 * Local $ref only. Unknown keywords fail at load time so a schema edit cannot
 * silently skip a rule.
 */

import { readFileSync } from 'node:fs';

const KNOWN = new Set([
  '$schema',
  '$id',
  '$ref',
  '$defs',
  '$comment',
  'title',
  'description',
  'type',
  'enum',
  'const',
  'properties',
  'required',
  'additionalProperties',
  'pattern',
  'minLength',
  'maxLength',
  'items',
  'minItems',
  'maxItems',
  'uniqueItems',
  'format',
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'if',
  'then',
  'else',
]);

const FORMAT = new Set(['date', 'uri']);

/**
 * @param {string} file
 */
export function loadSchema(file) {
  const schema = JSON.parse(readFileSync(file, 'utf8'));
  assertSupported(schema, '#');
  assertRefs(schema, schema, '#');
  return schema;
}

/**
 * @param {unknown} schema
 * @param {string} pointer
 */
function assertSupported(schema, pointer) {
  if (schema === true || schema === false || schema == null) return;
  if (Array.isArray(schema) || typeof schema !== 'object') return;
  for (const [key, value] of Object.entries(schema)) {
    if (!KNOWN.has(key)) throw new Error(`Unsupported schema keyword "${key}" at ${pointer}`);
    if (key === 'format' && !FORMAT.has(value)) throw new Error(`Unsupported format "${value}" at ${pointer}`);
    if (key === 'properties' || key === '$defs') {
      for (const [name, child] of Object.entries(value)) assertSupported(child, `${pointer}/${key}/${name}`);
    } else if (key === 'items' || key === 'additionalProperties' || key === 'not' || key === 'if' || key === 'then' || key === 'else') {
      if (value && typeof value === 'object') assertSupported(value, `${pointer}/${key}`);
    } else if (key === 'allOf' || key === 'anyOf' || key === 'oneOf') {
      value.forEach((child, index) => assertSupported(child, `${pointer}/${key}/${index}`));
    }
  }
}

/**
 * @param {unknown} schema
 * @param {object} root
 * @param {string} pointer
 */
function assertRefs(schema, root, pointer) {
  if (!schema || typeof schema !== 'object') return;
  if (Array.isArray(schema)) {
    schema.forEach((child, index) => assertRefs(child, root, `${pointer}/${index}`));
    return;
  }
  if (typeof schema.$ref === 'string') resolveRef(root, schema.$ref);
  for (const [key, value] of Object.entries(schema)) {
    if (key === '$ref') continue;
    if (value && typeof value === 'object') assertRefs(value, root, `${pointer}/${key}`);
  }
}

/**
 * @param {object} root
 * @param {string} ref
 */
export function resolveRef(root, ref) {
  if (ref === '#') return root;
  if (!ref.startsWith('#/')) throw new Error(`Only local $ref is supported (${ref})`);
  let node = root;
  for (const part of ref.slice(2).split('/')) {
    const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
    if (node == null || typeof node !== 'object' || !Object.hasOwn(node, key)) {
      throw new Error(`Unresolvable $ref ${ref}`);
    }
    node = node[key];
  }
  return node;
}

/**
 * @param {object} schema
 * @param {unknown} data
 * @param {object} [root]
 * @returns {{ path: string, keyword: string, message: string, key?: string }[]}
 */
export function validateInstance(schema, data, root = schema) {
  /** @type {{ path: string, keyword: string, message: string, key?: string }[]} */
  const errors = [];
  check(schema, data, '', root, errors, 0);
  return errors;
}

/** @param {object} schema @param {unknown} data */
export function validateMonster(schema, data) {
  return validateInstance(schema.$defs.monster, data, schema);
}

/** @param {object} schema @param {unknown} data */
export function validateDatabase(schema, data) {
  return validateInstance(schema, data, schema);
}

/** @param {object} schema @param {unknown} data */
export function validateImportFile(schema, data) {
  return validateInstance(schema.$defs.importFile, data, schema);
}

/**
 * @param {object | boolean | null | undefined} schema
 * @param {unknown} data
 * @param {string} path
 * @param {object} root
 * @param {{ path: string, keyword: string, message: string, key?: string }[]} errors
 * @param {number} depth
 */
function check(schema, data, path, root, errors, depth) {
  if (depth > 48) {
    errors.push(issue(path, 'depth', 'schema depth exceeded'));
    return;
  }
  if (schema === true || schema == null) return;
  if (schema === false) {
    errors.push(issue(path, 'not', `${show(path)} is rejected by the schema`));
    return;
  }
  if (typeof schema.$ref === 'string') {
    check(resolveRef(root, schema.$ref), data, path, root, errors, depth + 1);
  }
  if (schema.type !== undefined) checkType(schema.type, data, path, errors);
  if (Object.hasOwn(schema, 'const') && !same(data, schema.const)) {
    errors.push(issue(path, 'const', `${show(path)} must be ${JSON.stringify(schema.const)}`));
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => same(item, data))) {
    errors.push(issue(path, 'enum', `${show(path)} must be one of ${schema.enum.map((item) => JSON.stringify(item)).join(', ')} (got ${JSON.stringify(data)})`));
  }
  if (typeof schema.format === 'string' && typeof data === 'string' && !formatOk(schema.format, data)) {
    errors.push(issue(path, 'format', `${show(path)} must be a valid ${schema.format}`));
  }
  if (typeof schema.pattern === 'string' && typeof data === 'string' && !patternOk(schema.pattern, data)) {
    errors.push(issue(path, 'pattern', `${show(path)} must match ${schema.pattern}`));
  }
  if (typeof schema.minLength === 'number' && typeof data === 'string' && [...data].length < schema.minLength) {
    errors.push(issue(path, 'minLength', `${show(path)} must be at least ${schema.minLength} characters`));
  }
  if (typeof schema.maxLength === 'number' && typeof data === 'string' && [...data].length > schema.maxLength) {
    errors.push(issue(path, 'maxLength', `${show(path)} must be at most ${schema.maxLength} characters`));
  }
  if (schema.properties || schema.required || schema.additionalProperties !== undefined) {
    checkObject(schema, data, path, root, errors, depth);
  }
  if (schema.items || schema.minItems !== undefined || schema.maxItems !== undefined || schema.uniqueItems) {
    checkArray(schema, data, path, root, errors, depth);
  }
  if (Array.isArray(schema.allOf)) {
    for (const child of schema.allOf) check(child, data, path, root, errors, depth + 1);
  }
  if (Array.isArray(schema.anyOf)) checkCompound(schema.anyOf, data, path, root, errors, depth, 'anyOf');
  if (Array.isArray(schema.oneOf)) checkCompound(schema.oneOf, data, path, root, errors, depth, 'oneOf');
  if (schema.not !== undefined) {
    const probe = [];
    check(schema.not, data, path, root, probe, depth + 1);
    if (probe.length === 0) errors.push(issue(path, 'not', `${show(path)} must not match the forbidden schema`));
  }
  if (schema.if !== undefined) {
    const probe = [];
    check(schema.if, data, path, root, probe, depth + 1);
    if (probe.length === 0) {
      if (schema.then) check(schema.then, data, path, root, errors, depth + 1);
    } else if (schema.else) {
      check(schema.else, data, path, root, errors, depth + 1);
    }
  }
}

/**
 * JSON Schema treats integer as a subset of number. This schema does not
 * declare either type; the rule is here so a future numeric keyword fails closed.
 * @param {string | string[]} type
 * @param {unknown} data
 * @param {string} path
 * @param {{ path: string, keyword: string, message: string }[]} errors
 */
function checkType(type, data, path, errors) {
  const allowed = Array.isArray(type) ? type : [type];
  const actual = jsonType(data);
  const ok = allowed.some((item) => item === actual || (item === 'number' && actual === 'integer'));
  if (!ok) errors.push(issue(path, 'type', `${show(path)} must be ${allowed.join(' or ')} (got ${actual})`));
}

/**
 * @param {object} schema
 * @param {unknown} data
 * @param {string} path
 * @param {object} root
 * @param {{ path: string, keyword: string, message: string, key?: string }[]} errors
 * @param {number} depth
 */
function checkObject(schema, data, path, root, errors, depth) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return;
  const properties = schema.properties ?? {};
  if (Array.isArray(schema.required)) {
    for (const key of schema.required) {
      if (!Object.hasOwn(data, key)) errors.push(issue(`${path}/${key}`, 'required', `${show(path)} is missing ${key}`));
    }
  }
  for (const [key, value] of Object.entries(data)) {
    const childPath = `${path}/${escapeToken(key)}`;
    if (Object.hasOwn(properties, key)) {
      check(properties[key], value, childPath, root, errors, depth + 1);
    } else if (schema.additionalProperties === false) {
      errors.push({
        ...issue(childPath, 'additionalProperties', `${show(path)} has unknown field ${key}`),
        key,
      });
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      check(schema.additionalProperties, value, childPath, root, errors, depth + 1);
    }
  }
}

/**
 * @param {object} schema
 * @param {unknown} data
 * @param {string} path
 * @param {object} root
 * @param {{ path: string, keyword: string, message: string }[]} errors
 * @param {number} depth
 */
function checkArray(schema, data, path, root, errors, depth) {
  if (!Array.isArray(data)) return;
  if (typeof schema.minItems === 'number' && data.length < schema.minItems) {
    errors.push(issue(path, 'minItems', `${show(path)} must have at least ${schema.minItems} item(s)`));
  }
  if (typeof schema.maxItems === 'number' && data.length > schema.maxItems) {
    errors.push(issue(path, 'maxItems', `${show(path)} must have at most ${schema.maxItems} item(s)`));
  }
  if (schema.uniqueItems === true) {
    const seen = new Set();
    for (const item of data) {
      const key = JSON.stringify(item);
      if (seen.has(key)) {
        errors.push(issue(path, 'uniqueItems', `${show(path)} has a duplicate item`));
        break;
      }
      seen.add(key);
    }
  }
  if (schema.items && typeof schema.items === 'object') {
    data.forEach((item, index) => check(schema.items, item, `${path}/${index}`, root, errors, depth + 1));
  }
}

function checkCompound(branches, data, path, root, errors, depth, keyword) {
  let passed = 0;
  for (const branch of branches) {
    const probe = [];
    check(branch, data, path, root, probe, depth + 1);
    if (probe.length === 0) passed += 1;
  }
  if (keyword === 'anyOf' && passed === 0) {
    errors.push(issue(path, 'anyOf', `${show(path)} must match at least one allowed shape`));
  }
  if (keyword === 'oneOf' && passed !== 1) {
    errors.push(issue(path, 'oneOf', `${show(path)} must match exactly one allowed shape`));
  }
}

/** @param {unknown} value */
function jsonType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

/** @param {string} pattern @param {string} data */
function patternOk(pattern, data) {
  return new RegExp(pattern, 'u').test(data);
}

/** @param {string} format @param {string} data */
function formatOk(format, data) {
  if (format === 'date') return validDate(data);
  if (format === 'uri') return validUri(data);
  return false;
}

/** @param {string} text */
export function validDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** @param {string} text */
function validUri(text) {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** @param {unknown} left @param {unknown} right */
function same(left, right) {
  if (left === right) return true;
  if (typeof left !== typeof right || left === null || right === null) return false;
  if (typeof left !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => same(item, right[index]));
  }
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => Object.hasOwn(right, key) && same(left[key], right[key]));
}

function escapeToken(token) {
  return String(token).replaceAll('~', '~0').replaceAll('/', '~1');
}

function show(path) {
  return path === '' ? '/' : path;
}

function issue(path, keyword, message) {
  return { path: path === '' ? '/' : path, keyword, message };
}
