import api from "./api";

export const getPendingPosts = async (page = 1, limit = 50) => {
  const response = await api.get(`/admin/posts/pending?page=${page}&limit=${limit}`);
  return response.data;
};

export const approvePetPost = async (postId: string) => {
  const response = await api.patch(`/admin/posts/${postId}/approve`);
  return response.data;
};

