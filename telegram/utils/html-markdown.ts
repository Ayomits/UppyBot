export function cursive<S extends string>(c: S): `<em>${S}</em>` {
  return `<em>${c}</em>`;
}

export function inlineCode<S extends string>(c: S): `<code>${S}</code>` {
  return `<code>${c}</code>`;
}

export function bold<S extends string>(c: S): `<strong>${S}</strong>` {
  return `<strong>${c}</strong>`;
}
