import api from "./api";

type RegisterDataType = {
    username: string;
    email: string;
    password: string;
    contactNumber: string;
    location: string;
};

export const registerUser = async (data: RegisterDataType) => {
    try {
        const response = await api.post("/auth/register", data);
        return response.data;
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
};

export const login = async (email: string, password: string) => {
    try {
        console
            .log("Attempting to log in with email:", email);
        const data = { email, password };
        const response = await api.post("/auth/login", data);
        return response.data;
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

export const registerAdmin = async (data: RegisterDataType) => {
    try {
        const response = await api.post("/auth/admin/register", data);
        return response.data;
    } catch (error) {
        console.error("Error registering admin:", error);
        throw error;
    }
};
export const refreshTokens = async (refreshToken: string) => {
    try {
        const response = await api.post("/auth/refresh-token", { refreshToken });
        return response.data;
    } catch (error) {
        console.error("Error refreshing tokens:", error);
        throw error;
    }
};

export const getMyDetails = async () => {
    try {
        const response = await api.get("/auth/me");
        return response.data;
    } catch (error) {
        console.error("Error fetching user details:", error);
        throw error;
    }
};
