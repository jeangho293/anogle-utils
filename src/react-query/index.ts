import {
  QueryClient,
  useQuery as ReactUseQuery,
  useMutation as ReactUseMutation,
} from "@tanstack/react-query";

export const queryClient = new QueryClient();
export const queryKeyMap = new Map();

export const useQuery = <T extends Record<string, any>, R>(
  queryFn: (...args: T[]) => Promise<R>,
  options?: {
    variables?: T;
  }
) => {
  const { isLoading: loading, ...rest } = ReactUseQuery({
    queryKey: [...queryKeyMap.get(queryFn), options?.variables ?? {}],
    queryFn: () =>
      options?.variables ? queryFn(options.variables) : queryFn(),
  });

  return { loading, ...rest };
};

export const useMutation = <T, R>(
  mutationFn: (args: T) => Promise<R>,
  options?: {
    onSuccess?: (data: R) => void;
    onError?: (error: Error) => void;
  }
): [({ variables }: { variables: T }) => Promise<R>, { loading: boolean }] => {
  const { mutateAsync, isPending: loading } = ReactUseMutation({
    mutationKey: [...queryKeyMap.get(mutationFn)],
    mutationFn,
    onSuccess: (data) => {
      if (queryKeyMap.get(mutationFn)) {
        queryClient.refetchQueries({
          queryKey: queryKeyMap.get(mutationFn),
          exact: false,
        });
        options?.onSuccess?.(data);
      }
    },
    onError: options?.onError,
  });

  return [
    ({ variables }: { variables: T }) => {
      return mutateAsync(variables);
    },
    { loading },
  ];
};
