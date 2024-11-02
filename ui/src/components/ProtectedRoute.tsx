import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { api } from "../lib/api";
import {
  REFRESH_TOKEN_IDENTIFIER_KEY,
  ACCESS_TOKEN_IDENTIFIER_KEY,
} from "../siteConfig";

export const ProtectedRoute = ({ children }: { children: any }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean|null>(null);

  useEffect(() => {
    authenticate().catch(() => setIsAuthorized(false));
  }, []);

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_IDENTIFIER_KEY);
    try {
      const res: any = await api.get("/api/user/refresh", {
        headers: {
          Authorization: refreshToken
        }
      });

      if (res.status === 200) {
        localStorage.setItem(ACCESS_TOKEN_IDENTIFIER_KEY, res.data?.accessToken);
        setIsAuthorized(true);
      } else setIsAuthorized(false);
    } catch (err) {
      setIsAuthorized(false);
      console.log("file: ProtectedRoute.tsx:18 ⌿ refreshToken ⌿ err* ", err);
    }
  };

  const authenticate = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_IDENTIFIER_KEY);
    if (!token) {
      setIsAuthorized(false);
      return;
    }

    const decoded = jwtDecode(token);
    const tokenExp = decoded.exp!;
    const now = Date.now() / 1000;

    if (tokenExp < now) await refreshToken();
    else setIsAuthorized(true);
  };

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/signin" />;
};
