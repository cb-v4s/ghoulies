import { api } from "./api";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";

type QueryKeyT = [string, object | undefined];

export const fetcher = async <T>({
  queryKey,
  pageParam,
}: {
  queryKey: QueryKeyT;
  pageParam?: number;
}): Promise<T> => {
  const [url, params] = queryKey;
  const res = await api.get<T>(url, { params: { ...params, pageParam } });
  return res.data;
};

export const useFetch = <T>(
  url: string | null,
  params?: object,
  config?: UseQueryOptions<T, Error, T, QueryKeyT>
) => {
  const context = useQuery<T, Error, T, QueryKeyT>(
    [url!, params],
    ({ queryKey }) => fetcher({ queryKey }),
    { ...config }
  );

  return context;
};

const useGenericMutation = <T, S>(
  func: (data: T | S) => Promise<AxiosResponse<S>>,
  url: string,
  params?: object,
  updater?: ((oldData: T, newData: S) => T) | undefined
) => {
  const queryClient = useQueryClient();

  return useMutation<AxiosResponse, AxiosError, T | S>(func, {
    // Called before the mutation is executed.
    onMutate: async (data: any) => {
      // Cancels any ongoing queries for the same url and params
      await queryClient.cancelQueries([url!, params]);

      // Get the previous stored data
      const previousData = queryClient.getQueryData([url!, params]);

      // Updates the query data in the cache using queryClient.setQueryData,
      // either by using the updater function or by replacing the data with the new data.
      queryClient.setQueryData<T>([url!, params], (oldData) => {
        return updater ? updater(oldData!, data as S) : (data as T);
      });

      return previousData;
    },
    // Called if the mutation fails.
    // It restores the previous data from the context passed from the onMutate callback.
    onError: (err, _, context) => {
      queryClient.setQueryData([url!, params], context);
    },
    // Called when the mutation is either successful or failed.
    // It invalidates the queries for the same url and params, forcing a refetch of the data.
    onSettled: () => {
      queryClient.invalidateQueries([url!, params]);
    },
  });
};

export const useDelete = <T>(
  url: string,
  params?: object,
  updater?: (oldData: T, id: string | number) => T
) => {
  return useGenericMutation<T, string | number>(
    (id) => api.delete(`${url}/${id}`),
    url,
    params,
    updater
  );
};

export const usePost = <T, S>(
  url: string,
  params?: object,
  updater?: (oldData: T, newData: S) => T
) => {
  return useGenericMutation<T, S>(
    (data) => api.post<S>(url, data),
    url,
    params,
    updater
  );
};

export const useUpdate = <T, S>(
  url: string,
  params?: object,
  updater?: (oldData: T, newData: S) => T
) => {
  return useGenericMutation<T, S>(
    (data) => api.patch<S>(url, data),
    url,
    params,
    updater
  );
};
