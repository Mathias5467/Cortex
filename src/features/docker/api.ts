import { invoke } from "@tauri-apps/api/core";

export interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: string;
  host_ports: number[];
}

export type ContainerAction = "start" | "stop" | "restart" | "pause" | "unpause" | "remove";

export const dockerApi = {
  list: () => invoke<Container[]>("list_containers"),
  control: (id: string, action: ContainerAction) => invoke<void>("control_container", { id, action }),
  logs: (id: string) => invoke<string>("container_logs", { id }),
};
