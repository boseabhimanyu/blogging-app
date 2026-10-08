import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const STORAGE_BASE = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:5000";

// --- Types ---

export type UserRole = "admin" | "publisher" | "visitor";
export type PostStatus = "draft" | "published";

export const getAccessToken = (): string | null => null;
export const setTokens = (_accessToken?: string, _refreshToken?: string) => {};
export const clearTokens = () => {};

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  altEmail?: string;
  phone?: string;
  role: "admin" | "publisher" | "visitor";
  profilePic?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  altEmail?: string;
  phone?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface Post {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage?: string;
  authorUsername?: string;
  categorySlugs: string[];
  tagSlugs: string[];
  status: PostStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  name: string;
  slug: string;
  description?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  altEmail?: string;
  phone: string;
  password: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResponse {
  users: User[];
  pagination: Pagination;
}

// --- Storage URL Formatter ---

export const getAssetUrl = (path?: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${STORAGE_BASE}/${cleanPath}`;
};

// --- Axios Instance Setup ---

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response Interceptor: Handle Automatic Token Refresh via HttpOnly Cookies
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    // If 401 on an authenticated endpoint, attempt cookie-based refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute && typeof window !== "undefined") {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return apiClient(originalRequest);
      } catch (refreshErr) {
        const isDashboardRoute = window.location.pathname.startsWith("/dashboard");

        if (isDashboardRoute && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }

    const message =
      (error.response?.data as { error?: string; message?: string })?.error ||
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      "An unexpected error occurred";

    return Promise.reject(new Error(message));
  }
);

// --- API Service Methods ---

export const api = {
  auth: {
    register: async (payload: RegisterPayload) => {
      const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
      return data;
    },

    login: async (payload: LoginPayload) => {
      const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
      return data;
    },

    logout: async () => {
      const { data } = await apiClient.post<{ message: string }>("/auth/logout");
      return data;
    },

    me: async (): Promise<User> => {
      const res = await apiClient.get<{ user: User }>("/auth/me");
      return res.data.user;
    },

    updateProfile: async (payload: UpdateProfilePayload): Promise<User> => {
      const res = await apiClient.patch<{ message: string; user: User }>("/auth/me", payload);
      return res.data.user;
    },

    updateProfilePic: async (formData: FormData): Promise<{ message: string }> => {
      const res = await apiClient.patch<{ message: string }>("/auth/me/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },

    changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
      const res = await apiClient.patch<{ message: string }>("/auth/password", payload);
      return res.data;
    },
  },

  posts: {
    list: async (params?: {
      page?: number;
      limit?: number;
      category?: string;
      tag?: string;
      status?: string;
      search?: string;
    }): Promise<{
      posts: Post[];
      total?: number;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }> => {
      const { data } = await apiClient.get<{ posts: Post[]; total: number }>("/posts", {
        params,
      });
      return data;
    },

    getBySlug: async (slug: string) => {
      const { data } = await apiClient.get<Post>(`/posts/${encodeURIComponent(slug)}`);
      return data;
    },

    create: async (payload: any) => {
      const { data } = await apiClient.post<Post>("/posts", payload);
      return data;
    },

    update: async (slug: string, payload: any) => {
      const { data } = await apiClient.patch<Post>(`/posts/${encodeURIComponent(slug)}`, payload);
      return data;
    },

    delete: async (slug: string) => {
      const { data } = await apiClient.delete<{ message: string }>(
        `/posts/${encodeURIComponent(slug)}`
      );
      return data;
    },
  },

  categories: {
    list: async () => {
      const { data } = await apiClient.get<Category[]>("/categories");
      return data;
    },
  },

  admin: {
    listUsers: async (params?: {
      role?: UserRole;
      status?: boolean | string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<UserListResponse> => {
      const { data } = await apiClient.get<UserListResponse>("/users", { params });
      return data;
    },

    updateUserRole: async (username: string, role: UserRole) => {
      const { data } = await apiClient.patch<{ message: string; user: User }>(
        `/users/${encodeURIComponent(username)}/role`,
        { role }
      );
      return data;
    },
  },
};