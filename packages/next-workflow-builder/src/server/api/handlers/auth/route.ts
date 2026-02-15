import type { RouteHandler } from "../../types.js";

export const authHandler: RouteHandler = async (route, ctx) => {
  return ctx.auth.handler(route.request);
};
