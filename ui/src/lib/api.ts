import axios from "axios";
import { coreApiUrl as baseURL } from "@/siteConfig";

const cfg = { baseURL, withCredentials: true };
const ctx = axios.create(cfg);

export const api = {
  get: <T>(uri: string, params?: object) =>
    ctx.get<T>(uri, {
      headers: {},
      ...params,
    }),
  post: <T>(uri: string, data: any, params?: object) =>
    ctx.post<T>(uri, data, {
      headers: {},
      ...params,
    }),
  patch: <T>(uri: string, data: any) =>
    ctx.patch<T>(uri, data, {
      headers: {},
    }),
  delete: <T>(uri: string) =>
    ctx.delete<T>(uri, {
      headers: {},
    }),
};
