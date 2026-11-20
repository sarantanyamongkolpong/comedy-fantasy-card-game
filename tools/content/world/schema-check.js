/**
 * Subset of JSON Schema 2020-12 used by the world-content pack.
 * Annotation keywords are ignored. Unknown assertion keywords are rejected
 * so a schema edit cannot silently stop checking.
 */

const ANNOTATIONS = new Set([
  '$schema',
  '$id',
  '$comment',
  'title',
  'description',
  'examples',
  'default',
  '$defs',
]);

const SUPPORTED = new Set([
  ...ANNOTATIONS,
  '$ref',
  'allOf',
  'type',
  'const',
  'enum',
  'required',
  'properties',
  'additionalProperties',
  'items',
  'minItems',
  'maxItems',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'pattern',
]);

export function checkAgainstSchema(schema, value, path = '$', startDef = null) {
  const errors = [];
  const node = startDef ? schema.$defs?.[startDef] : schema;
  if (!node) {
    errors.push(`${path}: missing $defs/${startDef}`);
    return errors;
  }
  validateNode(schema, node, value, path, errors);
  return errors;
}

function validateNode(root, schema, value, path, errors) {
  if (!schema || typeof schema !== 'object') {
    errors.push(`${path}: schema node is not an object`);
    return;
  }
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED.has(key)) errors.push(`${path}: unsupported schema keyword ${key}`);
  }
  if (schema.$ref) {
    const ref = schema.$ref;
    if (!ref.startsWith('#/$defs/')) {
      errors.push(`${path}: unsupported $ref ${ref}`);
      return;
    }
    const target = root.$defs?.[ref.slice('#/$defs/'.length)];
    if (!target) {
      errors.push(`${path}: missing $ref ${ref}`);
      return;
    }
    validateNode(root, target, value, path, errors);
    return;
  }
  if (Array.isArray(schema.allOf)) {
    for (const part of schema.allOf) validateNode(root, part, value, path, errors);
  }
  if (Object.prototype.hasOwnProperty.call(schema, 'const') && !same(value, schema.const)) {
    errors.push(`${path}: expected ${JSON.stringify(schema.const)}`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => same(item, value))) {
    errors.push(`${path}: value ${JSON.stringify(value)} is outside the enum`);
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeMatches(value, type))) {
      errors.push(`${path}: expected ${types.join('|')}`);
      return;
    }
  }
  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(`${path}: shorter than ${schema.minLength}`);
    }
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
      errors.push(`${path}: longer than ${schema.maxLength}`);
    }
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path}: does not match ${schema.pattern}`);
    }
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(`${path}: below minimum ${schema.minimum}`);
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(`${path}: above maximum ${schema.maximum}`);
    }
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errors.push(`${path}: fewer than ${schema.minItems} items`);
    }
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
      errors.push(`${path}: more than ${schema.maxItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => validateNode(root, schema.items, item, `${path}[${index}]`, errors));
    }
  }
  if (isObject(value) && (schema.properties || schema.required || schema.additionalProperties != null)) {
    const props = schema.properties ?? {};
    for (const key of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push(`${path}.${key}: required`);
    }
    for (const key of Object.keys(value)) {
      if (props[key]) validateNode(root, props[key], value[key], `${path}.${key}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${path}.${key}: additional property`);
      else if (isObject(schema.additionalProperties)) {
        validateNode(root, schema.additionalProperties, value[key], `${path}.${key}`, errors);
      }
    }
  }
}

function typeMatches(value, type) {
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return isObject(value);
  return typeof value === type;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
