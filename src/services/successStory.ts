import api from "./api"

export interface StoryOwner {
    _id: string
    username: string
    email?: string
    profilePicture?: string | null
}

export interface ISuccessStory {
    _id: string
    userId: StoryOwner | string
    title: string
    description: string
    images: string[]
    createdAt?: string
    updatedAt?: string
}

export interface PaginatedStoriesResponse {
    message: string
    data: ISuccessStory[]
    totalPages: number
    totalCount: number
    page: number
}

const buildStoryFormData = (title: string, description: string, images: File[]) => {
    const form = new FormData()
    form.append("title", title)
    form.append("description", description)
    images.forEach((file) => {
        form.append("images", file)
    })
    return form
}

export interface CreateSuccessStoryPayload {
    title: string
    description: string
    images: File[]
}

export const createSuccessStory = async (
    payload: CreateSuccessStoryPayload
): Promise<ISuccessStory> => {
    try {
        const form = buildStoryFormData(payload.title, payload.description, payload.images)
        const response = await api.post("/successStory/save", form, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        return response.data as ISuccessStory
    } catch (error) {
        console.error("Error creating success story:", error)
        throw error
    }
}


export const getAllSuccessStories = async (page = 1, limit = 10) => {
    try {
        const response = await api.get("successStory/getAll", {
            params: { page, limit },
        });
        return response;
    } catch (error) {
        console.error("Error fetching pet posts:", error);
        throw error;
    }
};

export const getMySuccessStories = async (
    page = 1,
    limit = 10
): Promise<PaginatedStoriesResponse> => {
    try {
        const response = await api.get("/successStory/myStories", {
            params: { page, limit },
            withCredentials: true,
        })
        return response.data as PaginatedStoriesResponse
    } catch (error) {
        console.error("Error fetching my success stories:", error)
        throw error
    }
}

export const deleteSuccessStory = async (id: string): Promise<{ message: string }> => {
    try {
        const response = await api.delete(`/successStory/delete/${id}`, {
        })
        return response.data as { message: string }
    } catch (error) {
        console.error("Error deleting success story:", error)
        throw error
    }
}

export default {
    createSuccessStory,
    getAllSuccessStories,
    getMySuccessStories,
    deleteSuccessStory,
}
