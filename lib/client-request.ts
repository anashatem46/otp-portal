export async function requestJson<T = unknown>(
  url: string,
  body?: unknown,
  method = "POST"
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : "Request failed. Please try again."
    );
  }

  if (data === null) {
    throw new Error("Unexpected server response. Please try again.");
  }

  return data as T;
}
