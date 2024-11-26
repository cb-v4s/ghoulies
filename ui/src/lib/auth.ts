import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN_IDENTIFIER_KEY } from "@/siteConfig";

type JwtPayload = {
  exp: number;
  sub: number;
  username: string;
};

export const getAccessTokenPayload = (): JwtPayload | null => {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_IDENTIFIER_KEY);
    if (!token) return null;
    const data = jwtDecode(token) as JwtPayload;
    return data;
  } catch (err) {
    console.error("getAccessTokenData failed to decode jwt", err);
    return null;
  }
};
