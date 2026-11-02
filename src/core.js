/**
 * Parse a Content-Type header value into its media type and parameters.
 *
 * The parser follows RFC 7231 section 3.1.1.1 and RFC 2045 for parameter syntax.
 * It is deliberately permissive: malformed parameters are skipped rather than
 * causing the whole parse to fail, because real-world headers are often sloppy
 * and callers usually only need the media type and a couple of well-known
 * parameters (charset, boundary).
 *
 * @param {string} value - The raw Content-Type header value.
 * @returns {{ type: string, subtype: string, mediaType: string, parameters: Record<string, string>, charset: string | undefined, boundary: string | undefined }}
 */
export function parseContentType(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Content-Type value must be a string');
  }

  const parameters = {};
  let mediaType = '';
  let charset;
  let boundary;

  let i = 0;
  const len = value.length;

  // Skip leading whitespace.
  while (i < len && isWhitespace(value.charCodeAt(i))) i++;

  // Read the media type up to ';' or end.
  const typeStart = i;
  while (i < len && value.charCodeAt(i) !== 59 /* ; */) i++;
  const rawType = value.slice(typeStart, i).trim();

  if (rawType.length > 0) {
    mediaType = rawType.toLowerCase();
    const slash = mediaType.indexOf('/');
    if (slash !== -1) {
      // Keep only the first slash as separator; a subtype cannot contain a slash.
      const type = mediaType.slice(0, slash);
      const subtype = mediaType.slice(slash + 1);
      if (type.length > 0 && subtype.length > 0) {
        mediaType = type + '/' + subtype;
      }
    }
  }

  // Parse parameters.
  while (i < len) {
    // value[i] is ';'
    i++;

    // Skip whitespace after ';'.
    while (i < len && isWhitespace(value.charCodeAt(i))) i++;

    // Empty parameter (trailing semicolon) — stop.
    if (i >= len) break;

    // Read the parameter name.
    const nameStart = i;
    while (i < len && value.charCodeAt(i) !== 59 /* ; */ && value.charCodeAt(i) !== 61 /* = */) i++;
    const name = value.slice(nameStart, i).trim().toLowerCase();

    // Skip whitespace before '='.
    while (i < len && isWhitespace(value.charCodeAt(i))) i++;

    if (i >= len || value.charCodeAt(i) !== 61 /* = */) {
      // Parameter without a value; skip it.
      continue;
    }
    i++; // consume '='

    // Skip whitespace after '='.
    while (i < len && isWhitespace(value.charCodeAt(i))) i++;

    let paramValue;
    if (i < len && value.charCodeAt(i) === 34 /* " */) {
      // Quoted string.
      i++; // consume opening quote
      let result = '';
      while (i < len) {
        const ch = value.charCodeAt(i);
        if (ch === 92 /* \\ */) {
          i++;
          if (i < len) {
            result += value[i];
            i++;
          }
          continue;
        }
        if (ch === 34 /* " */) {
          i++; // consume closing quote
          break;
        }
        result += value[i];
        i++;
      }
      paramValue = result;
    } else {
      // Token value: read until ';' or whitespace.
      const valStart = i;
      while (i < len && value.charCodeAt(i) !== 59 /* ; */ && !isWhitespace(value.charCodeAt(i))) i++;
      paramValue = value.slice(valStart, i);
    }

    if (name.length > 0) {
      parameters[name] = paramValue;
    }
  }

  if (parameters.charset !== undefined) {
    charset = parameters.charset;
  }
  if (parameters.boundary !== undefined) {
    boundary = parameters.boundary;
  }

  return {
    type: mediaType.split('/')[0] || '',
    subtype: mediaType.split('/')[1] || '',
    mediaType,
    parameters,
    charset,
    boundary,
  };
}

function isWhitespace(code) {
  // Space and horizontal tab are the only whitespace allowed in header values.
  return code === 32 || code === 9;
}
