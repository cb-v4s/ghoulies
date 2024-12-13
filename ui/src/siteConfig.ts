export const githubName = "czdor";
export const appName = "ghoulies";
export const coreApiUrl = "http://localhost/api/v1";
export const googleStunServer = "stun:stun.l.google.com:19302";
export const wsApiUrl = "http://localhost/ws";
export const SecurityHeaders = {
  CSRF: "X-Csrf-Token",
};
export const apiRoutes = {
  login: "/user/login",
  signup: "/user/signup",
  refresh: "/user/refresh",
  profile: "/user/profile",
  updateUser: "/user/update",
};

export const CSRF_IDENTIFIER_KEY = "_csrf";
export const ACCESS_TOKEN_IDENTIFIER_KEY = "accessToken";
export const REFRESH_TOKEN_IDENTIFIER_KEY = "refreshToken";
export const CONSOLE_STATE_IDENTIFIER_KEY = "_cons_state";

export const links = {
  githubProfile: "//github.com/czdor",
  sourceCode: "//github.com/czdor/ghoulies", // TODO: update
};
