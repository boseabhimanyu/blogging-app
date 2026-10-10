import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const STORAGE_BASE = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:5000";

// --- Types ---

export type UserRole = "admin" | "publisher" | "visitor";
export type PostStatus = "draft" | "published";

export const getAccessToken = (): string | null => null;
export const setTokens = (_accessToken?: string, _refreshToken?: string) => {};
export const clearTokens = () => {};

export interface CreatePostPayload {
  title: string;
  slug?: string;
  summary?: string;
  content: string;
  coverImage?: string;
  categoryIds?: string[];
  tagIds?: string[];
  status: "draft" | "published";
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  altEmail?: string;
  phone?: string;
  role: UserRole;
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
  id: string;
  slug: string;
  title: string;
  summary?: string;
  content: string;
  coverImage?: string;
  status: "draft" | "published";
  authorId?: string;
  authorUsername?: string;       // <-- Added
  categoryIds?: string[];
  categorySlugs?: string[];     // <-- Added
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface PostListResponse {
  data: Post[];
  total: number;
  page: number;
  limit: number;
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

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  altEmail?: string;
  phone: string;
  password?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  altEmail?: string;
  phone?: string;
  role?: UserRole;
  status?: boolean;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pinCode?: string;
}

export interface AppSettings {
  id: string;
  allowRegistration: boolean;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
}

export interface PublicAuthor {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePic?: string;
  role: string;
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
    // 1. Public listing
    list: async (params?: {
      page?: number;
      limit?: number;
      category?: string;
      tag?: string;
      status?: string;
      search?: string;
      [key: string]: any;
    }): Promise<PostListResponse> => {
      const { data } = await apiClient.get<PostListResponse>("/posts", { params });
      return data;
    },

    // 2. Author's personal posts (GET /api/v1/posts/me)
    myPosts: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      [key: string]: any;
    }): Promise<PostListResponse> => {
      const { data } = await apiClient.get<PostListResponse>("/posts/me", { params });
      return data;
    },

    // 3. Admin platform-wide oversight (GET /api/v1/admin/posts)
    adminList: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      authorId?: string;
      categoryId?: string;
      [key: string]: any;
    }): Promise<PostListResponse> => {
      const { data } = await apiClient.get<PostListResponse>("/admin/posts", { params });
      return data;
    },

    getBySlug: async (slug: string): Promise<Post> => {
      const { data } = await apiClient.get<{ data: Post }>(
        `/posts/${encodeURIComponent(slug)}`
      );
      return data.data;
    },

    create: async (payload: CreatePostPayload | Partial<Post>): Promise<Post> => {
      const { data } = await apiClient.post<{ data: Post }>("/posts", payload);
      return data.data;
    },

    update: async (slug: string, payload: Partial<Post>): Promise<Post> => {
      const { data } = await apiClient.patch<{ data: Post }>(
        `/posts/${encodeURIComponent(slug)}`,
        payload
      );
      return data.data;
    },

    delete: async (slug: string): Promise<{ message: string }> => {
      const { data } = await apiClient.delete<{ message: string }>(
        `/posts/${encodeURIComponent(slug)}`
      );
      return data;
    },
  },

  categories: {
    list: async (): Promise<Category[]> => {
      const { data } = await apiClient.get<{ data: Category[] }>("/categories");
      return data.data;
    },

    getBySlug: async (slug: string): Promise<Category> => {
      const { data } = await apiClient.get<{ data: Category }>(
        `/categories/${encodeURIComponent(slug)}`
      );
      return data.data;
    },
  },

  admin: {
    listUsers: async (params?: {
      role?: UserRole | "";
      status?: "true" | "false" | "";
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<UserListResponse> => {
      const cleanParams: Record<string, any> = {};
      if (params) {
        if (params.role) cleanParams.role = params.role;
        if (params.status) cleanParams.status = params.status;
        if (params.search) cleanParams.search = params.search;
        if (params.page) cleanParams.page = params.page;
        if (params.limit) cleanParams.limit = params.limit;
      }
      const { data } = await apiClient.get<UserListResponse>("/users", { params: cleanParams });
      return data;
    },

    getUser: async (id: string): Promise<User> => {
      const { data } = await apiClient.get<{ customer: User }>(`/users/${id}`);
      return data.customer;
    },

    createUser: async (payload: CreateUserPayload): Promise<User> => {
      const { data } = await apiClient.post<{ message: string; user: User }>("/users", payload);
      return data.user;
    },

    updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
      const { data } = await apiClient.patch<{ message: string; user: User }>(`/users/${id}`, payload);
      return data.user;
    },

    updateUserStatus: async (id: string, status: boolean): Promise<{ message: string; status: boolean }> => {
      const { data } = await apiClient.patch<{ message: string; status: boolean }>(
        `/users/${id}/status`,
        { status }
      );
      return data;
    },

    updateUserRole: async (id: string, role: UserRole): Promise<{ message: string; role: UserRole }> => {
      const { data } = await apiClient.patch<{ message: string; role: UserRole }>(
        `/users/${id}/role`,
        { role }
      );
      return data;
    },

    resetUserPassword: async (id: string, newPassword: string): Promise<{ message: string }> => {
      const { data } = await apiClient.patch<{ message: string }>(
        `/users/${id}/password`,
        { newPassword }
      );
      return data;
    },

    getSettings: async (): Promise<AppSettings> => {
      const { data } = await apiClient.get<{ data: AppSettings }>("/settings");
      return data.data;
    },

    updateSettings: async (allowRegistration: boolean): Promise<AppSettings> => {
      const { data } = await apiClient.patch<{ data: AppSettings }>(
        "/admin/settings",
        { allowRegistration }
      );
      return data.data;
    },

    // Category Management
    getCategories: async (): Promise<Category[]> => {
      const { data } = await apiClient.get<{ data: Category[] }>("/categories");
      return data.data;
    },

    getCategoryById: async (id: string): Promise<Category> => {
      const { data } = await apiClient.get<{ data: Category }>(
        `/admin/categories/${id}`
      );
      return data.data;
    },

    createCategory: async (payload: CreateCategoryPayload): Promise<Category> => {
      const { data } = await apiClient.post<{ data: Category }>(
        "/admin/categories",
        payload
      );
      return data.data;
    },

    updateCategory: async (
      id: string,
      payload: UpdateCategoryPayload
    ): Promise<Category> => {
      const { data } = await apiClient.patch<{ data: Category }>(
        `/admin/categories/${id}`,
        payload
      );
      return data.data;
    },

    deleteCategory: async (id: string): Promise<{ message: string }> => {
      const { data } = await apiClient.delete<{ message: string }>(
        `/admin/categories/${id}`
      );
      return data;
    },
  },
  authors: {
    getById: async (id: string): Promise<PublicAuthor> => {
      const { data } = await apiClient.get<{ data: PublicAuthor }>(
        `/authors/${encodeURIComponent(id)}`
      );
      return data.data;
    },
  },
};