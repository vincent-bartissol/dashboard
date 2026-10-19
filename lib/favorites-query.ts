"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FavoriteDto } from "@/lib/favorites";
import { listDemoFavorites, toggleDemoFavorite } from "@/lib/demo/store";

export const favoritesQueryKey = ["favorites"] as const;

function toDto(rows: ReturnType<typeof listDemoFavorites>): FavoriteDto[] {
  return rows.map((row) => ({
    id: row.id,
    datasetId: row.datasetId,
    recordId: row.recordId,
    label: row.label,
    geo: row.geo,
  }));
}

export function useFavoritesQuery(initial?: FavoriteDto[]) {
  return useQuery({
    queryKey: favoritesQueryKey,
    queryFn: async () => toDto(listDemoFavorites()),
    initialData: initial,
    staleTime: 30_000,
  });
}

export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      datasetId: string;
      recordId: string;
      label: string;
      geo?: string | null;
    }) => toDto(toggleDemoFavorite(input)),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: favoritesQueryKey });
      const previous = queryClient.getQueryData<FavoriteDto[]>(favoritesQueryKey) ?? [];
      const exists = previous.some(
        (row) => row.datasetId === input.datasetId && row.recordId === input.recordId,
      );
      const next = exists
        ? previous.filter(
            (row) => !(row.datasetId === input.datasetId && row.recordId === input.recordId),
          )
        : [
            ...previous,
            {
              id: `optimistic-${input.recordId}`,
              datasetId: input.datasetId,
              recordId: input.recordId,
              label: input.label,
              geo: input.geo ?? null,
            },
          ];
      queryClient.setQueryData(favoritesQueryKey, next);
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(favoritesQueryKey, context.previous);
    },
    onSuccess: (favorites) => {
      queryClient.setQueryData(favoritesQueryKey, favorites);
    },
  });
}
