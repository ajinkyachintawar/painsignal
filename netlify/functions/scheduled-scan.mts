import type { Config } from "@netlify/functions";
import { runScan } from "../../lib/scan";

export default async () => {
  const result = await runScan();
  console.log(`[scheduled-scan] added ${result.added} new signals, ${result.total} total`);
};

export const config: Config = {
  schedule: "@hourly",
};
