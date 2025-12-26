import api from "./api";

export type UpdateUserInput = {
  contactNumber?: string;
  location?: string;
  email?: string;
  image?: File | null;
};

export type UpdateUserResponse<T = any> = {
  message: string;
  data: T;
};

export const updateUser = async (id: string, input: UpdateUserInput) => {
  try {
    const formData = new FormData();

    if (input.contactNumber !== undefined) formData.append("contactNumber", input.contactNumber);
    if (input.location !== undefined) formData.append("location", input.location);
    if (input.email !== undefined) formData.append("email", input.email);
    if (input.image) formData.append("image", input.image);

    const res = await api.put<UpdateUserResponse>(`/user/update/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteAccount = async (id: string) => {
  try {
    const res = await api.delete<{ message: string }>(`/user/delete/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting account:", error);
    throw error;
  }
};
