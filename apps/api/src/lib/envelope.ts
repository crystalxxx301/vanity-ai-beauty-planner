export function success<T>(data: T) {
  return { data, requestId: crypto.randomUUID() };
}

export function failure(code: string, message: string) {
  return { error: { code, message }, requestId: crypto.randomUUID() };
}
