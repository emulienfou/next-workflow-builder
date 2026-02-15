import { toNextJsHandler } from "better-auth/next-js";
import { errorResponse } from "../../handler-utils.js";
import type { RouteHandler } from "../../types.js";

export const authHandler: RouteHandler = async (route, ctx) => {
  const handler = toNextJsHandler(ctx.auth);

  switch (route.method) {
    case "GET":
      return handler.GET(route.request);
    case "POST":
      return handler.POST(route.request);
    default:
      return errorResponse("Method not allowed", 405);
  }
};
