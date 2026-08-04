import Constants from "expo-constants";
import { Platform } from "react-native";
import type { ApiEnvelope } from "./types";

type AuthBridge = {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  onSessionExpired: () => void;
};

type ApiRequestOptions = {
  authenticated?: boolean;
  retry?: boolean;
  handleUnauthorized?: boolean;
};

let authBridge: AuthBridge | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function configureApiAuth(bridge: AuthBridge) {
  authBridge = bridge;
  return () => {
    if (authBridge === bridge) authBridge = null;
  };
}

function inferApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const appConfigured = Constants.expoConfig?.extra?.apiUrl;
  if (typeof appConfigured === "string" && appConfigured.trim()) {
    return appConfigured.trim().replace(/\/$/, "");
  }

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(":")[0];
  if (host) return `http://${host}:8080`;
  return Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
}

export const API_BASE_URL = inferApiBaseUrl();

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  let body: Partial<ApiEnvelope<T>> | null = null;
  if (text) {
    try {
      body = JSON.parse(text) as Partial<ApiEnvelope<T>>;
    } catch {
      body = null;
    }
  }
  if (!response.ok) {
    throw new ApiError(body?.message || "서버 요청을 처리하지 못했어요.", response.status);
  }
  return body as ApiEnvelope<T>;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<T> {
  const authenticated = options.authenticated !== false;
  const headers = new Headers(init.headers);
  // multipart(FormData)일 때는 boundary가 들어간 Content-Type을 fetch가 직접 만들어야 하므로
  // 여기서 손대지 않는다. 임의로 application/json을 붙이면 서버가 본문을 파싱하지 못한다.
  const isMultipart = init.body instanceof FormData;
  if (!headers.has("Content-Type") && init.body && !isMultipart) {
    headers.set("Content-Type", "application/json");
  }
  if (authenticated) {
    const token = authBridge?.getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.status === 401 && authenticated && options.handleUnauthorized !== false && options.retry !== false && authBridge) {
    refreshInFlight ??= authBridge.refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
    const newToken = await refreshInFlight;
    if (newToken) {
      return apiRequest<T>(path, init, { ...options, retry: false });
    }
    authBridge.onSessionExpired();
  }

  return (await parseResponse<T>(response)).data;
}

export function publicApiRequest<T>(path: string, init: RequestInit = {}) {
  return apiRequest<T>(path, init, { authenticated: false, retry: false });
}
