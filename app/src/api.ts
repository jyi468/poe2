type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiResult<T>;
  if (!body.ok) throw new Error(body.error);
  return body.data;
}

export async function get<T>(path: string): Promise<T> {
  return unwrap<T>(await fetch(path));
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return unwrap<T>(
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }),
  );
}
