import api from "./api";

export type AgeUnit = "Months" | "Years";

export type PetInput = {
  name: string;
  species: string;
  breed: string;
  age: {
    value: number;
    unit: AgeUnit;
  };
  gender: string;
  description: string;
  adoptionType: "Free" | "Paid";
  price?: number;
  contactInfo?: string;
  location: string;
  status?: "Available" | "Adopted" | "Pending";
  ageDisplay?: string;
};

const buildFormData = (data: Partial<PetInput>, image?: File) => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "age" && typeof value === "object") {
      const v = (value as any).value;
      const u = (value as any).unit;
      if (typeof v === "number" && (u === "Months" || u === "Years")) {
        form.append("age", `${v} ${u}`);
      }
    } else {
      form.append(key, String(value));
    }
  });
  if (image) {
    form.append("image", image);
  }
  return form;
};

export const createPetPost = async (data: PetInput, image?: File) => {
  try {
    const form = buildFormData(data, image);
    const response = await api.post("/post/save", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating pet post:", error);
    throw error;
  }
};

export const getPetPosts = async (page = 1, limit = 10) => {
  try {
    const response = await api.get("/post/getAll", {
      params: { page, limit },
    });
    return response;
  } catch (error) {
    console.error("Error fetching pet posts:", error);
    throw error;
  }
};

export const getMyPetPosts = async (page = 1, limit = 10) => {
  try {
    const response = await api.get("/post/me", {
      params: { page, limit },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching my pet posts:", error);
    throw error;
  }
};

export const updatePetPost = async (id: string, data: Partial<PetInput>, image?: File) => {
  try {
    const form = buildFormData(data, image);
    const response = await api.put(`/post/update/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating pet post:", error);
    throw error;
  }
};

export const deletePetPost = async (id: string) => {
  try {
    const response = await api.delete(`/post/delete/${id}`, {
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting pet post:", error);
    throw error;
  }
};

export const getPetPostById = async (postId: string) => {
  try {
    const resp = await api.get("/post/getAll", { params: { page: 1, limit: 1000 } });
    const rawPets = resp.data?.data || resp.data?.petPosts || resp.data || [];

    const pet = rawPets.find((p: any) => p._id === postId);
    return pet || null;
  } catch (error) {
    console.error("Error fetching pet post by ID:", error);
    throw error;
  }
};

export const contactPostOwner = async (postId: string, message: string) => {
  try {
    const response = await api.post(`/post/contact-owner/${postId}`, { message });
    return response.data as { message: string };
  } catch (error) {
    console.error("Error contacting post owner:", error);
    throw error;
  }
};

export const getApprovedPetPosts = async (page = 1, limit = 10) => {
  try {
    const response = await api.get("/post/approved", {
      params: { page, limit },
    });
    return response;
  } catch (error) {
    console.error("Error fetching approved pet posts:", error);
    throw error;
  }
};

export const getPendingPetPosts = async (page = 1, limit = 10) => {
  try {
    const response = await api.get("/post/pending", {
      params: { page, limit },
    });
    return response;
  } catch (error) {
    console.error("Error fetching pending pet posts:", error);
    throw error;
  }
};

export default {
  createPetPost,
  getPetPosts,
  getMyPetPosts,
  updatePetPost,
  deletePetPost,
  getPetPostById,
  contactPostOwner,
  getApprovedPetPosts,
  getPendingPetPosts,
};
