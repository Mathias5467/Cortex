import { invoke } from "@tauri-apps/api/core";

export interface DnsRecord {
  kind: string;
  value: string;
  ttl: string;
}

export interface PingResult {
  sent: number;
  received: number;
  average_ms: number;
  address: string;
}

export interface ListeningPort {
  port: number;
  pid: number;
  process: string;
  addresses: string[];
}

const PUBLIC_IP_URL = "https://api.ipify.org?format=json";
const PUBLIC_IP_TIMEOUT = 5000;

async function publicIp(): Promise<string> {
  const response = await fetch(PUBLIC_IP_URL, { signal: AbortSignal.timeout(PUBLIC_IP_TIMEOUT) });
  if (!response.ok) throw new Error(`Public IP lookup failed (${response.status})`);
  const body: { ip: string } = await response.json();
  return body.ip;
}

export const networkApi = {
  publicIp,
  localAddresses: () => invoke<string[]>("local_addresses"),
  dns: (host: string) => invoke<DnsRecord[]>("dns_lookup", { host }),
  ping: (host: string) => invoke<PingResult>("ping_host", { host }),
  ports: () => invoke<ListeningPort[]>("listening_ports"),
  kill: (pid: number) => invoke<void>("kill_process", { pid }),
};
