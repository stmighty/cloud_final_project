import api2 from "@/lib/axios2";

export interface Frame {
  id: string;
  data: string | null;
}

export interface Animation {
  _id: string;
  userId: string;
  title: string;
  frames: Frame[];
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  likeCount: number;
}

export interface CreateAnimationRequest {
  title: string;
  frames: Frame[];
}

export interface UpdateAnimationRequest {
  title?: string;
  frames?: Frame[];
  thumbnail?: string;
}

export const animationService = {
  getAll: async () => {
    const response = await api2.get<{
      success: boolean;
      animations: Animation[];
      count: number;
    }>("/animations");
    return response.data;
  },

  create: async (data: CreateAnimationRequest) => {
    const response = await api2.post<{
      success: boolean;
      animation: Animation;
    }>("/animations", data);
    return response.data;
  },

  update: async (id: string, data: UpdateAnimationRequest) => {
    const response = await api2.put<{
      success: boolean;
      animation: Animation;
    }>(`/animations/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api2.delete<{
      success: boolean;
      message: string;
    }>(`/animations/${id}`);
    return response.data;
  },

  react: async (id: string, isLiked: boolean) => {
    const response = await api2.post<{
      success: boolean;
      message: string;
      isLiked: boolean | null;
      likeCount: number;
    }>(`/animations/${id}/react`, { isLiked });
    return response.data;
  },

  getTopLiked: async () => {
    const response = await api2.get<{
      success: boolean;
      animations: Animation[];
      count: number;
    }>("/animations/top-liked");
    return response.data;
  },
}; 