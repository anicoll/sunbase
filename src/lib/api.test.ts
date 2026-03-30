import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApiClient } from "./api";

// Mock @/lib/auth so we can control refresh() behaviour
vi.mock("@/lib/auth", () => ({
  refresh: vi.fn(),
}));
import { refresh } from "@/lib/auth";
const mockRefresh = vi.mocked(refresh);

function makeFetchResponse(
  status: number,
  body: unknown = {},
  statusText = ""
): Response {
  return {
    status,
    statusText,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function makeClient() {
  const getToken = vi.fn(() => "tok");
  const onTokenRefreshed = vi.fn();
  const onUnauthorized = vi.fn();
  const client = createApiClient(getToken, onTokenRefreshed, onUnauthorized);
  return { client, getToken, onTokenRefreshed, onUnauthorized };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  mockRefresh.mockReset();
});

describe("allowFeedIn", () => {
  it("POSTs to /inverter/feedin with disable:false", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(200, {}));

    const { client } = makeClient();
    await client.allowFeedIn();

    expect(fetch).toHaveBeenCalledOnce();
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).body).toBe(JSON.stringify({ disable: false }));
  });

  it("resolves to undefined without parsing the response body", async () => {
    // The server returns Go's struct{} — if res.json() were called on raw text
    // it would throw. We verify it is never called.
    const jsonSpy = vi.fn(() => Promise.reject(new Error("json() called unexpectedly")));
    vi.mocked(fetch).mockResolvedValue({
      status: 200,
      ok: true,
      json: jsonSpy,
    } as unknown as Response);

    const { client } = makeClient();
    await expect(client.allowFeedIn()).resolves.toBeUndefined();
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it("resolves when the server returns 204 No Content", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(204));

    const { client } = makeClient();
    await expect(client.allowFeedIn()).resolves.toBeUndefined();
  });

  it("throws on a non-2xx response", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(500, {}, "Internal Server Error"));

    const { client } = makeClient();
    await expect(client.allowFeedIn()).rejects.toThrow("API error 500");
  });
});

describe("401 refresh-and-retry", () => {
  it("retries the request after a successful token refresh", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(makeFetchResponse(401))
      .mockResolvedValueOnce(makeFetchResponse(200, {}));

    mockRefresh.mockResolvedValue({ access_token: "new-tok" });

    const { client, onTokenRefreshed } = makeClient();
    await client.allowFeedIn();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onTokenRefreshed).toHaveBeenCalledWith("new-tok");
  });

  it("calls onUnauthorized and throws if refresh fails", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(401));
    mockRefresh.mockRejectedValue(new Error("no session"));

    const { client, onUnauthorized } = makeClient();
    await expect(client.allowFeedIn()).rejects.toThrow("Session expired");
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("does not retry a second 401 (avoids infinite loop)", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(401));
    mockRefresh.mockResolvedValue({ access_token: "new-tok" });

    const { client } = makeClient();
    // Second fetch also returns 401 → should throw, not loop
    await expect(client.allowFeedIn()).rejects.toThrow("API error 401");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe("Authorization header", () => {
  it("attaches the Bearer token from getToken()", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(200, []));

    const { client } = makeClient();
    await client.fetchProperties();

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer tok",
    });
  });

  it("omits Authorization when getToken returns null", async () => {
    vi.mocked(fetch).mockResolvedValue(makeFetchResponse(200, []));

    const getToken = vi.fn(() => null);
    const client = createApiClient(getToken, vi.fn(), vi.fn());
    await client.fetchProperties();

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect((init as RequestInit & { headers: Record<string, string> }).headers).not.toHaveProperty("Authorization");
  });
});
