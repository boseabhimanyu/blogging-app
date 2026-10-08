import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const STORAGE_BASE = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:5000";

// --- Types ---

export type UserRole = "admin" | "publisher" | "visitor";
export type PostStatus = "draft" | "published";
// Add near the top or export section in lib/api.ts:
export const getAccessToken = (): string | null => null;
export const setTokens = (_accessToken?: string, _refreshToken?: string) => {};
export const clearTokens = () => {};

export interface User {
  id?: string;
  username: string;
  email: string;
  altEmail?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  role: UserRole;
  profilePic?: string;
  phone?: string;
  createdAt: string;
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
  withCredentials: true, // Crucial: enables sending and receiving HttpOnly cookies across origins
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

    const isSessionCheck = originalRequest?.url?.includes("/auth/me");

    // If 401 on an authenticated endpoint, attempt cookie-based refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute && typeof window !== "undefined") {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // Retry original request with newly rotated cookie
        return apiClient(originalRequest);
      } catch (refreshErr) {
        // Only kick to /login if:
        // 1. The user is currently inside /dashboard, OR
        // 2. It was a protected action, NOT a silent background /auth/me check
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
  const { data } = await apiClient.get<{ user?: User } | User>("/auth/me");
  // If backend returns { user: { ... } }, return data.user, else return data directly
  if ("user" in data && data.user) {
    return data.user;
  }
  return data as User;
},

    updateProfile: async (payload: Partial<User>) => {
      const { data } = await apiClient.patch<User>("/auth/me", payload);
      return data;
    },

    updateProfilePic: async (file: File) => {
      const formData = new FormData();
      formData.append("profile_pic", file);
      const { data } = await apiClient.patch<{ message: string; profilePic: string }>(
        "/auth/me/image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data;
    },

    changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
      const { data } = await apiClient.patch<{ message: string }>("/auth/password", payload);
      return data;
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