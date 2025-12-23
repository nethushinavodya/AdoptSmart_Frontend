import api from "./api";

export interface AIChatRequest {
  text: string;
}

export interface AIChatResponse {
  data: string;
}

export const generateAIContent = async (text: string): Promise<string> => {
  const response = await api.post<AIChatResponse>(`/ai/generate`, { text });
  return response.data.data;
};
