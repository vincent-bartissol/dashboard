"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FavoriteDto } from "@/lib/favorites";

export const favoritesQueryKey = ["favorites"] as const;

async function fetchFavorites(signal?: AbortSignal): Promise<FavoriteDto[]> {
  const res = await fetch("/api/favorites", { signal });
  const data = (await res.json()) as { ok: boolean; favorites?: FavoriteDto[] };
  if (!res.ok || !data.ok || !Array.isArray(data.favorites)) {
    throw new Error("favorites");
  }
  return data.favorites;
}

export function useFavoritesQuery(initial?: FavoriteDto[]) {
  return useQuery({
    queryKey: favoritesQueryKey,
    queryFn: ({ signal }) => fetchFavorites(signal),
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
    }) => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        favorites?: FavoriteDto[];
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error === "favoriteLimit" ? "favoriteLimit" : "favorite");
      }
      return data.favorites ?? [];
    },
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
      if (context?.previous) {
        queryClient.setQueryData(favoritesQueryKey, context.previous);
      }
    },
    onSuccess: (favorites) => {
      queryClient.setQueryData(favoritesQueryKey, favorites);
    },
  });
}
