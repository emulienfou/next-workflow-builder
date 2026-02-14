import postgres from "postgres";
import type { IntegrationConfig, IntegrationType } from "../../../../../lib/types/integration.js";
import { getCredentialMapping, getIntegration as getPluginFromRegistry } from "../../../../../plugins/index.js";
import { errorResponse, jsonResponse, requireSession } from "../../../handler-utils.js";
import type { RouteHandler } from "../../../types.js";

export type TestConnectionRequest = {
  type: IntegrationType;
  config: IntegrationConfig;
};

export type TestConnectionResult = {
  status: "success" | "error";
  message: string;
};

export const integrationsTestHandler: RouteHandler = async (route, ctx) => {
  try {
    const session = await requireSession(ctx, route.request);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const body: TestConnectionRequest = await route.request.json();

    if (!(body.type && body.config)) {
      return errorResponse("Type and config are required", 400);
    }

    if (body.type === "database") {
      const result = await testDatabaseConnection(body.config.url);
      return jsonResponse(result);
    }

    const plugin = getPluginFromRegistry(body.type);

    if (!plugin) {
      return errorResponse("Invalid integration type", 400);
    }

    if (!plugin.testConfig) {
      return errorResponse("Integration does not support testing", 400);
    }

    const credentials = getCredentialMapping(plugin, body.config);

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
    return jsonResponse(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to test connection",
      },
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
