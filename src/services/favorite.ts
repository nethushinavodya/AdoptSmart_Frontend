import api from "./api";

export type FavoritesListResponse<T = any> = {
  page: number;
  limit: number;
  total: number;
  data: T[];
};

export const getMyFavorites = async (page = 1, limit = 50) => {
  const res = await api.get<FavoritesListResponse>(`/favorites/me`, {
    params: { page, limit },
  });
  return res.data;
};

export const isFavorite = async (petId: string) => {
  const res = await api.get<{ favorited: boolean }>(`/favorites/isFavorite/${petId}`);
  return res.data;
};

export const addFavorite = async (petId: string) => {
  const res = await api.post<{ message: string }>(`/favorites/add/${petId}`);
  return res.data;
};

export const removeFavorite = async (petId: string) => {
  const res = await api.delete<{ message: string }>(`/favorites/remove/${petId}`);
  return res.data;
};

export const toggleFavorite = async (petId: string, nextFavorited: boolean) => {
  return nextFavorited ? addFavorite(petId) : removeFavorite(petId);
};
