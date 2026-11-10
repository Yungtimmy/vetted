const ALIAS = "@/";

function withTs(specifier) {
  if (/\.[cm]?[jt]s$/.test(specifier)) return specifier;
  return `${specifier}.ts`;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(ALIAS)) {
    const file = new URL(`../${specifier.slice(ALIAS.length)}`, import.meta.url);
    return nextResolve(withTs(file.href), context);
  }
  if (specifier.startsWith(".")) {
    return nextResolve(withTs(specifier), context);
  }
  return nextResolve(specifier, context);
}
