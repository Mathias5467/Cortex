import { Activity, Globe, Network, Plug } from "lucide-react";
import type { Command } from "@/core/types";
import { PortsView } from "./PortsView";

export const networkCommands: Command[] = [
  {
    id: "localhost-ports",
    name: "Localhost Ports",
    description: "See what is listening, open it or kill the process",
    icon: Plug,
    category: "network",
    run: (launcher) => launcher.open(<PortsView />),
  },
  {
    id: "my-ip",
    name: "My IP Address",
    description: "Public and local IP addresses (myip)",
    icon: Network,
    category: "network",
    run: (launcher) => launcher.search("myip"),
  },
  {
    id: "dns-lookup",
    name: "DNS Lookup",
    description: "A, AAAA, CNAME, MX, NS and TXT records (dns <host>)",
    icon: Globe,
    category: "network",
    run: (launcher) => launcher.search("dns "),
  },
  {
    id: "ping-host",
    name: "Ping",
    description: "Check latency to a host (ping <host>)",
    icon: Activity,
    category: "network",
    run: (launcher) => launcher.search("ping "),
  },
];
