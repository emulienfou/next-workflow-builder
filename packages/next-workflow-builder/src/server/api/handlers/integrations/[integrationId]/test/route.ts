import { and, eq } from "drizzle-orm";
import postgres from "postgres";
import { decrypt } from "../../../../../../lib/db/integrations.js";
import type { IntegrationConfig } from "../../../../../../lib/types/integration.js";
import { getCredentialMapping, getIntegration as getPluginFromRegistry } from "../../../../../../plugins/index.js";
import { integrations } from "../../../../../db/schema.js";
import { errorResponse, jsonResponse, requireSession } from "../../../../handler-utils.js";
import type { RouteHandler } from "../../../../types.js";

export type TestConnectionResult = {
  status: "success" | "error";
  message: string;
};

function decryptConfig(encryptedConfig: string): IntegrationConfig {
  try {
    const decrypted = decrypt(encryptedConfig);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Failed to decrypt integration config:", error);
    return {};
  }
}

export const integrationTestHandler: RouteHandler = async (route, ctx) => {
  try {
    const integrationId = route.segments[1];

    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    if (!integrationId) {
      return errorResponse("integrationId is required", 400);
    }

    const results = await ctx.db
      .select()
      .from(integrations)
      .where(
        and(eq(integrations.id, integrationId), eq(integrations.userId, session.user.id)),
      )
      .limit(1);

    if (results.length === 0) {
      return errorResponse("Integration not found", 404);
    }

    const integration = results[0];
    const config = decryptConfig(integration.config as string);

    if (integration.type === "database") {
      const result = await testDatabaseConnection(config.url);
      return jsonResponse(result);
    }

    const plugin = getPluginFromRegistry(integration.type);

    if (!plugin) {
      return errorResponse("Invalid integration type", 400);
    }

    if (!plugin.testConfig) {
      return errorResponse("Integration does not support testing", 400);
    }

    const credentials = getCredentialMapping(plugin, config);

    const testFn = await plugin.testConfig.getTestFunction();
    const testResult = await testFn(credentials);

    const result: TestConnectionResult = {
      status: testResult.success ? "success" : "error",
      message: testResult.success
        ? "Connection successful"
        : testResult.error || "Connection failed",
    };

    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to test connection:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to test connection",
      500,
    );
  }
};

async function testDatabaseConnection(
  databaseUrl?: string,
): Promise<TestConnectionResult> {
  let connection: postgres.Sql | null = null;

  try {
    if (!databaseUrl) {
      return {
        status: "error",
        message: "Connection failed",
      };
    }

    connection = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 5,
    });

    await connection`SELECT 1`;

    return {
      status: "success",
      message: "Connection successful",
    };
  } catch {
    return {
      status: "error",
      message: "Connection failed",
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
