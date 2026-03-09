import { GET as _GET, POST as _POST, PUT as _PUT, PATCH as _PATCH, DELETE as _DELETE, OPTIONS } from "next-workflow-builder/api";
import { writeFileSync } from "node:fs";

function wrap(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      const res = await handler(req);
      if (res.status >= 500) {
        const body = await res.clone().text();
        writeFileSync("/tmp/nwb-debug.log", `${new Date().toISOString()} ${req.method} ${req.url} => ${res.status} body=${body}\n`, { flag: "a" });
      }
      return res;
    } catch (e: any) {
      writeFileSync("/tmp/nwb-debug.log", `${new Date().toISOString()} ${req.method} ${req.url} THREW: ${e?.stack || e}\n`, { flag: "a" });
      throw e;
    }
  };
}

export const GET = wrap(_GET);
export const POST = wrap(_POST);
export const PUT = wrap(_PUT);
export const PATCH = wrap(_PATCH);
export const DELETE = wrap(_DELETE);
export { OPTIONS };
