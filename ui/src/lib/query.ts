import { api } from "./api";
import {
  useQuery,
  UseQueryOptions,
  useMutation,
  useQueryClient,
  QueryFunction,
  QueryKey,
  InvalidateQueryFilters,
  QueryFilters,
  UseMutationResult,
} from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";

const requestActions = ["post", "patch", "delete"] as const;
type RequestActionsT = (typeof requestActions)[number];
type QueryKeyT = [string, object | undefined];

export const fetcher = async <T>({
  queryKey,
}: {
  queryKey: QueryKey;
}): Promise<T> => {
  const [url, params] = queryKey as QueryKeyT;
  const res = await api.get<T>(url, { params: params });
  return res.data;
};

export const useFetch = <T>(
  url: string | null,
  params?: object,
  config?: UseQueryOptions<T, AxiosError>
) => {
  if (!url) throw new Error("useFetch error: url must be provided");

  const context = useQuery<T, AxiosError>({
    queryKey: [url, params],
    queryFn: fetcher as QueryFunction<T, QueryKey>,
    ...config,
  });

  return context;
};

const useGenericMutation = <T, S>(
  func: (data: T | S) => Promise<S>,
  url: string,
  params?: object,
  updater?: ((oldData: T, newData: S) => T) | undefined
): UseMutationResult<S, AxiosError, T | S> => {
  const queryClient = useQueryClient();

  return useMutation<S, AxiosError, T | S>({
    mutationFn: func,
    onMutate: async (data: T | S) => {
      if (!url) throw new Error("useMutation error: url must be provided");

      // ! cancel any ongoing queries for the same key: [url, params]
      await queryClient.cancelQueries([url, params] as QueryFilters);

      // ! get the previous stored data
      const previousData = queryClient.getQueryData([url!, params]);

      // Updates the query data in the cache using queryClient.setQueryData,
      // either by using the updater function or by replacing the data with the new data.
      queryClient.setQueryData<T>([url!, params], (oldData) => {
        return updater ? updater(oldData!, data as S) : (data as T);
      });

      return previousData;
    },
    onError: (_: AxiosError, __: any, context: any) => {
      queryClient.setQueryData([url!, params], context);
    },
    onSettled: () => {
      queryClient.invalidateQueries([url!, params] as InvalidateQueryFilters);
    },
  });
};

export const useApiRequest = <T, S>(
  requestAction: RequestActionsT,
  url: string,
  params?: object,
  updater?: (oldData: T, newData: S) => T
): UseMutationResult<S, AxiosError, T | S> => {
  if (!requestActions.includes(requestAction)) {
    throw new Error(
      `error on useApiRequest. invalid requestAction: ${requestAction}`
    );
  }

  return useGenericMutation<T, S>(
    async (data) => {
      const response: AxiosResponse<S> = await api[requestAction]<S>(url, data);
      return response?.data;
    },
    url,
    params,
    updater
  );
};
