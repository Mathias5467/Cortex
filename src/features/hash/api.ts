import { invoke } from "@tauri-apps/api/core";

export interface Digests {
  md5: string;
  sha1: string;
  sha256: string;
  sha512: string;
}

export const ALGORITHMS: { id: keyof Digests; label: string }[] = [
  { id: "sha256", label: "SHA-256" },
  { id: "md5", label: "MD5" },
  { id: "sha1", label: "SHA-1" },
  { id: "sha512", label: "SHA-512" },
];

export const hashApi = {
  text: (text: string) => invoke<Digests>("hash_text", { text }),
  file: (path: string) => invoke<Digests>("hash_file", { path }),
};
