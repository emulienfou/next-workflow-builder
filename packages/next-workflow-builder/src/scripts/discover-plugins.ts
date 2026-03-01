#!/usr/bin/env tsx

import { discoverPlugins } from "../plugins/discover";

discoverPlugins().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
