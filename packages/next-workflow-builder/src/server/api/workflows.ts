export interface WorkflowApiOptions {
  /** Custom authentication handler */
  authenticate?: (req: Request) => Promise<boolean>;
}

export function createWorkflowApiHandler(options: WorkflowApiOptions = {}) {
  return async function handler(req: Request) {
    if (options.authenticate) {
      const isAuthed = await options.authenticate(req);
      if (!isAuthed) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const url = new URL(req.url);
    const slugs = url.pathname.split('/').filter(Boolean);

    // TODO: Implement CRUD route matching
    return new Response(JSON.stringify({ status: 'ok', path: slugs }), {
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
