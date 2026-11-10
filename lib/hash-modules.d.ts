declare module "xxhashjs" {
  interface XXHash64 {
    toString(base?: number): string;
  }
  interface XXHashJs {
    h64(data: Uint8Array | Buffer | string, seed: number): XXHash64;
  }
  const xxhashjs: XXHashJs;
  export default xxhashjs;
}

declare module "blakejs" {
  export function blake2b(
    data: Uint8Array,
    key?: Uint8Array | null,
    outlen?: number,
  ): Uint8Array;
}
