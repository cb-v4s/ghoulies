import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { api } from "@lib/api";
import {
  REFRESH_TOKEN_IDENTIFIER_KEY,
  ACCESS_TOKEN_IDENTIFIER_KEY,
  apiRoutes,
} from "@/siteConfig";
import { getCookie } from "@/lib/misc";

export const useIsAuthenticated = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuth = async () => {
    const token = getCookie(ACCESS_TOKEN_IDENTIFIER_KEY);
    const refreshToken = getCookie(REFRESH_TOKEN_IDENTIFIER_KEY);
    if (!token?.length || !refreshToken?.length) {
      setIsAuthenticated(false);
      return;
    }

    const decoded = jwtDecode(token);
    const tokenExp = decoded.exp!;
    const now = Date.now() / 1000;

    if (tokenExp < now) {
      try {
        // * cookies are sent automagically
        const res: any = await api.get(apiRoutes.refresh);

        if (res.status === 200) {
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
