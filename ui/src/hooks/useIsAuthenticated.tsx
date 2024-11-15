import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { api } from "../lib/api";
import {
  REFRESH_TOKEN_IDENTIFIER_KEY,
  ACCESS_TOKEN_IDENTIFIER_KEY,
} from "../siteConfig";

export const useIsAuthenticated = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_IDENTIFIER_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_IDENTIFIER_KEY);
    if (!token?.length || !refreshToken?.length) {
      setIsAuthenticated(false);
      return;
    }

    const decoded = jwtDecode(token);
    const tokenExp = decoded.exp!;
    const now = Date.now() / 1000;

    if (tokenExp < now) {
      try {
        const res: any = await api.get("/user/refresh", {
          headers: {
            Authorization: localStorage.getItem(REFRESH_TOKEN_IDENTIFIER_KEY),
          },
        });

        if (res.status === 200) {
          localStorage.setItem(
            ACCESS_TOKEN_IDENTIFIER_KEY,
            res.data?.accessToken
          );
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        setIsAuthenticated(false);
        console.error("Error refreshing token:", err);
      }
    } else {
      setIsAuthenticated(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return isAuthenticated;
};
