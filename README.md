# http-content-type-header-parse

Parse a `Content-Type` header value into its media type and parameters, with convenience accessors for `charset` and `boundary`.

```js
import { parseContentType } from 'http-content-type-header-parse';

const ct = parseContentType('multipart/form-data; boundary=----WebKitFormBoundary; charset=utf-8');

ct.mediaType;   // 'multipart/form-data'
ct.type;        // 'multipart'
ct.subtype;     // 'form-data'
ct.charset;     // 'utf-8'
ct.boundary;    // '----WebKitFormBoundary'
ct.parameters;  // { boundary: '----WebKitFormBoundary', charset: 'utf-8' }
```

## Why this exists

`Content-Type` values are deceptively simple. A naive `split(';')` breaks on quoted values that contain semicolons, and treating every parameter as mandatory makes the parser brittle against real headers. This library makes one deliberate trade-off: **malformed parameters are skipped, not fatal**. If a parameter has no `=`, or a quoted string is unterminated, the parser keeps going and returns what it could understand. The media type is always returned as a lowercased string; parameter names are lowercased; parameter values are preserved exactly as written (after unescaping quoted pairs).

The awkward edge you will hit is an empty parameter value such as `charset=`. The parser records it as the empty string rather than dropping it, because an empty charset is different from no charset at all. If you need to distinguish the two, check `parameters.charset !== undefined`.

## API

### `parseContentType(value: string): ParsedContentType`

Returns an object with:

- `mediaType` — the full lowercased media type, e.g. `'text/html'`.
- `type` — the part before the slash.
- `subtype` — the part after the slash.
- `parameters` — a plain object mapping lowercased parameter names to their values.
- `charset` — shorthand for `parameters.charset`, or `undefined`.
- `boundary` — shorthand for `parameters.boundary`, or `undefined`.

Throws `TypeError` if `value` is not a string.

## Design notes

The window stores values eagerly rather than keeping running aggregates. Running
sums drift with floating point over long streams, and recomputing from a small
buffer is cheap enough that the drift is not worth the speed.

