import { useMemo, useState } from "react";
import { Activity, Globe, Network, Plug, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { createCopyItem } from "@/core/copyItem";
import { matchKeyword } from "@/core/keyword";
import { useLauncher } from "@/core/launcher";
import type { AsyncState } from "@/core/useAsync";
import { useAsync } from "@/core/useAsync";
import type { Launcher, LauncherItem, ResultProvider } from "@/core/types";
import { networkApi } from "./api";
import { createPortItem } from "./ports";

const KEYWORDS = ["myip", "ip", "dns", "ping", "port"] as const;
const HOST_PATTERN = /^[\p{L}\p{N}._:-]+$/u;
const LOOKUP_DELAY = 500;

function toHost(args: string): string | null {
  const host = args.replace(/^https?:\/\//i, "").split("/")[0];
  return HOST_PATTERN.test(host) ? host : null;
}

function createStatusItem(
  launcher: Launcher,
  id: string,
  section: string,
  icon: LucideIcon,
  state: AsyncState<unknown>,
  subject: string,
): LauncherItem {
  return {
    ...createCopyItem(launcher, {
      id,
      section,
      category: "network",
      icon,
      value: state.error ?? subject,
      title: state.error ?? "Loading...",
      subtitle: subject,
    }),
    titleStyle: "default",
  };
}

export const networkProvider: ResultProvider = {
  id: "network",
  hidesFallback: true,
  useItems: (query) => {
    const launcher = useLauncher();
    const [version, setVersion] = useState(0);
    const match = matchKeyword(query, KEYWORDS);
    const keyword = match?.keyword;
    const args = match?.args ?? "";

    const isIp = (keyword === "myip" || keyword === "ip") && args === "";
    const host = keyword === "dns" || keyword === "ping" ? toHost(args) : null;
    const port = keyword === "port" && /^\d{1,5}$/.test(args) ? Number(args) : null;

    const publicIp = useAsync(isIp ? "public-ip" : null, networkApi.publicIp, 200);
    const localIps = useAsync(isIp ? "local-ip" : null, networkApi.localAddresses);
    const dns = useAsync(keyword === "dns" ? host : null, () => networkApi.dns(host ?? ""), LOOKUP_DELAY);
    const ping = useAsync(keyword === "ping" ? host : null, () => networkApi.ping(host ?? ""), LOOKUP_DELAY);
    const ports = useAsync(port !== null ? `${port}:${version}` : null, networkApi.ports, 200);

    return useMemo<LauncherItem[]>(() => {
      if (isIp) {
        const section = "IP Addresses";
        const locals = (localIps.data ?? []).map((address) =>
          createCopyItem(launcher, {
            id: `ip:${address}`,
            section,
            category: "network",
            icon: Network,
            value: address,
            subtitle: address.includes(":") ? "Local IPv6" : "Local IPv4",
          }),
        );
        const external = publicIp.data
          ? createCopyItem(launcher, {
              id: "ip:public",
              section,
              category: "network",
              icon: Globe,
              value: publicIp.data,
              subtitle: "Public IP",
            })
          : createStatusItem(launcher, "ip:public", section, Globe, publicIp, "Public IP");
        return [external, ...locals];
      }

      if (keyword === "dns" && host) {
        const section = `DNS: ${host}`;
        if (!dns.data) return [createStatusItem(launcher, "dns:status", section, Globe, dns, host)];
        return dns.data.map((record, index) =>
          createCopyItem(launcher, {
            id: `dns:${index}`,
            section,
            category: "network",
            icon: Globe,
            value: record.value,
            subtitle: record.ttl ? `${record.kind} • TTL ${record.ttl}s` : record.kind,
          }),
        );
      }

      if (keyword === "ping" && host) {
        const section = `Ping: ${host}`;
        if (!ping.data) return [createStatusItem(launcher, "ping:status", section, Activity, ping, host)];
        const { sent, received, average_ms, address } = ping.data;
        const title = received > 0 ? `${average_ms} ms` : "Host unreachable";
        const subtitle = `${received}/${sent} replies${address ? ` • ${address}` : ""}`;
        return [
          createCopyItem(launcher, {
            id: "ping:result",
            section,
            category: "network",
            icon: Activity,
            value: `${host}: ${title}, ${subtitle}`,
            title,
            subtitle,
          }),
        ];
      }

      if (port !== null) {
        if (!ports.data) {
          return [createStatusItem(launcher, "port:status", "Listening Ports", Plug, ports, `Port ${port}`)];
        }
        const owners = ports.data.filter((entry) => entry.port === port);
        if (owners.length > 0) {
          return owners.map((entry) => createPortItem(entry, launcher, () => setVersion((value) => value + 1)));
        }
        return [
          {
            ...createCopyItem(launcher, {
              id: "port:free",
              section: "Listening Ports",
              category: "network",
              icon: Plug,
              value: port.toString(),
              title: `Port ${port} is free`,
              subtitle: "Nothing is listening on this port",
            }),
            titleStyle: "default",
            icon: { kind: "tile", icon: Plug, color: CATEGORIES.security.color },
          },
        ];
      }

      return [];
    }, [isIp, keyword, host, port, publicIp, localIps, dns, ping, ports, launcher]);
  },
};
