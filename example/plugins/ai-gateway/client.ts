/**
 * AI Gateway - Client-only registration
 *
 * This file is imported by the generated plugins/index.ts ("use client" context).
 * It registers the managed connection provider which requires React components
 * and API client imports that can't run during discover-plugins (Node.js context).
 */
import { registerManagedConnectionProvider } from "next-workflow-builder/plugins";
import { AiGatewayConsentOverlay } from "./components/ai-gateway-consent-overlay";
import { aiGatewayApi } from "./lib/api-client";

registerManagedConnectionProvider({
  integrationType: "ai-gateway",
  ConsentOverlay: AiGatewayConsentOverlay,
  api: aiGatewayApi,
});
