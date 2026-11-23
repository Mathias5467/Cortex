import { useMemo } from "react";
import { Fingerprint } from "lucide-react";
import { useLauncher } from "@/core/launcher";
import { useAsync } from "@/core/useAsync";
import { ListView } from "@/components/launcher/ListView";
import { hashApi } from "./api";
import { createDigestItems } from "./items";

interface ChecksumViewProps {
  path: string;
  name: string;
}

export function ChecksumView({ path, name }: ChecksumViewProps) {
  const launcher = useLauncher();
  const digests = useAsync(path, () => hashApi.file(path));
  const items = useMemo(
    () => (digests.data ? createDigestItems(launcher, digests.data, name) : []),
    [digests.data, name, launcher],
  );

  return <ListView icon={Fingerprint} placeholder="Paste a checksum to verify..." items={items} status={digests} />;
}
