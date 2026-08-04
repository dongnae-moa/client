import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import { ApiError, apiRequest, configureApiAuth, publicApiRequest } from "../api/client";
import { setDemoRewardOwner } from "../api/demoRewards";
import type { AuthSession, CurrentUser, Neighborhood } from "../api/types";

const ONBOARDING_KEY = "dongnaemoa.onboarding.v2";
const REFRESH_TOKEN_KEY = "dongnaemoa.refresh-token.v1";
const ACCESS_TOKEN_KEY = "dongnaemoa.access-token.v1";
const USER_SNAPSHOT_KEY = "dongnaemoa.user-snapshot.v1";

export type AppPhase = "booting" | "onboarding" | "anonymous" | "needsNeighborhood" | "authenticated";

type AuthContextValue = {
  phase: AppPhase;
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, nickname: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  joinNeighborhood: (latitude: number, longitude: number) => Promise<Neighborhood>;
  refreshProfile: () => Promise<CurrentUser>;
  updateUser: (user: CurrentUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readRefreshToken() {
  if (Platform.OS === "web") return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

async function writeRefreshToken(token: string | null) {
  if (Platform.OS === "web") {
    if (token) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    else await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

async function readAccessToken() {
  if (Platform.OS === "web") return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

async function writeAccessToken(token: string | null) {
  if (Platform.OS === "web") {
    if (token) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    else await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }
  if (token) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

async function readUserSnapshot() {
  const raw = await AsyncStorage.getItem(USER_SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

async function writeUserSnapshot(user: CurrentUser | null) {
  if (user) await AsyncStorage.setItem(USER_SNAPSHOT_KEY, JSON.stringify(user));
  else await AsyncStorage.removeItem(USER_SNAPSHOT_KEY);
}

function sessionToUser(session: AuthSession, email = ""): CurrentUser {
  return {
    userId: session.userId,
    email,
    nickname: session.nickname,
    point: session.point ?? 1250,
    neighborhoodId: session.neighborhoodId ?? null,
    neighborhoodName: session.neighborhoodName ?? null,
    profileDecorationKey: session.profileDecorationKey ?? null,
  };
}

function mergeUserWithLocalSnapshot(nextUser: CurrentUser, previousUser: CurrentUser | null) {
  if (!previousUser || previousUser.userId !== nextUser.userId) return nextUser;

  return {
    ...previousUser,
    ...nextUser,
    email: nextUser.email || previousUser.email,
    nickname: nextUser.nickname || previousUser.nickname,
    neighborhoodId: nextUser.neighborhoodId ?? previousUser.neighborhoodId ?? null,
    neighborhoodName: nextUser.neighborhoodName ?? previousUser.neighborhoodName ?? null,
    profileDecorationKey: nextUser.profileDecorationKey ?? previousUser.profileDecorationKey ?? null,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [phase, setPhase] = useState<AppPhase>("booting");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const userRef = useRef<CurrentUser | null>(null);

  const storeUser = useCallback(async (nextUser: CurrentUser | null) => {
    userRef.current = nextUser;
    setUser(nextUser);
    setDemoRewardOwner(nextUser?.userId ?? null);
    await writeUserSnapshot(nextUser);
  }, []);

  const applySession = useCallback(async (session: AuthSession, knownEmail = "") => {
    accessTokenRef.current = session.accessToken;
    refreshTokenRef.current = session.refreshToken ?? null;
    await Promise.all([
      writeAccessToken(session.accessToken),
      writeRefreshToken(session.refreshToken ?? null),
    ]);
    const nextUser = sessionToUser(session, knownEmail);
    await storeUser(nextUser);
    setPhase(session.neighborhoodId ? "authenticated" : "needsNeighborhood");
    return nextUser;
  }, [storeUser]);

  const clearSession = useCallback(async () => {
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    await Promise.all([writeRefreshToken(null), writeAccessToken(null), storeUser(null)]);
    setPhase("anonymous");
  }, [storeUser]);

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = refreshTokenRef.current ?? await readRefreshToken();
    if (!refreshToken) return null;
    try {
      const session = await publicApiRequest<AuthSession>("/v1/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      accessTokenRef.current = session.accessToken;
      refreshTokenRef.current = session.refreshToken ?? null;
      await Promise.all([writeAccessToken(session.accessToken), writeRefreshToken(session.refreshToken ?? null)]);
      await storeUser(mergeUserWithLocalSnapshot(
        sessionToUser(session, userRef.current?.email ?? ""),
        userRef.current,
      ));
      return session.accessToken;
    } catch {
      await clearSession();
      return null;
    }
  }, [clearSession, storeUser]);

  useEffect(() => configureApiAuth({
    getAccessToken: () => accessTokenRef.current,
    refreshAccessToken,
    onSessionExpired: () => { void clearSession(); },
  }), [clearSession, refreshAccessToken]);

  const refreshProfile = useCallback(async () => {
    try {
      const current = await apiRequest<CurrentUser>("/v1/users/me", {}, { handleUnauthorized: false });
      const merged = mergeUserWithLocalSnapshot(current, userRef.current);
      await storeUser(merged);
      setPhase(merged.neighborhoodId ? "authenticated" : "needsNeighborhood");
      return merged;
    } catch (error) {
      if (error instanceof ApiError && [401, 403, 404, 405].includes(error.status) && userRef.current) return userRef.current;
      throw error;
    }
  }, [storeUser]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [onboardingDone, storedToken, storedAccessToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        readRefreshToken(),
        readAccessToken(),
        readUserSnapshot(),
      ]);
      if (!active) return;
      if (onboardingDone !== "done") {
        setPhase("onboarding");
        return;
      }
      if (!storedToken && (!storedAccessToken || !storedUser)) {
        setPhase("anonymous");
        return;
      }
      if (storedToken) {
        if (storedUser) await storeUser(storedUser);
        refreshTokenRef.current = storedToken;
        const accessToken = await refreshAccessToken();
        if (!active) return;
        if (accessToken) {
          try {
            await refreshProfile();
            return;
          } catch {
            await clearSession();
          }
        }
      }
      if (storedAccessToken && storedUser) {
        accessTokenRef.current = storedAccessToken;
        await storeUser(storedUser);
        setPhase(storedUser.neighborhoodId ? "authenticated" : "needsNeighborhood");
      } else {
        setPhase("anonymous");
      }
    })();
    return () => { active = false; };
  }, [clearSession, refreshAccessToken, refreshProfile, storeUser]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await publicApiRequest<AuthSession>("/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    await applySession(session, email.trim());
  }, [applySession]);

  const signUp = useCallback(async (email: string, nickname: string, password: string) => {
    await publicApiRequest("/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), nickname: nickname.trim(), password }),
    });
    await login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    const refreshToken = refreshTokenRef.current;
    if (refreshToken) {
      try {
        await publicApiRequest("/v1/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Local sign-out must still work while the server is unavailable.
      }
    }
    await clearSession();
  }, [clearSession]);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "done");
    setPhase("anonymous");
  }, []);

  const joinNeighborhood = useCallback(async (latitude: number, longitude: number) => {
    const neighborhood = await apiRequest<Neighborhood>("/v1/neighborhoods/join", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    });
    const current = userRef.current;
    if (current) {
      await storeUser({ ...current, neighborhoodId: neighborhood.id, neighborhoodName: neighborhood.name });
    }
    setPhase("authenticated");
    return neighborhood;
  }, [storeUser]);

  const updateUser = useCallback((nextUser: CurrentUser) => {
    void storeUser(nextUser);
  }, [storeUser]);

  const value = useMemo<AuthContextValue>(() => ({
    phase,
    user,
    login,
    signUp,
    logout,
    completeOnboarding,
    joinNeighborhood,
    refreshProfile,
    updateUser,
  }), [completeOnboarding, joinNeighborhood, login, logout, phase, refreshProfile, signUp, updateUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
