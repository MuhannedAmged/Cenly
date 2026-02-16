export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  image?: string; // Base64 Data URI or URL
  isStreaming?: boolean;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  generated_code?: Record<string, string>;
  created_at: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  is_pro: boolean;
  daily_image_count?: number;
  last_image_reset?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  hasStarted: boolean;
}

export enum ModelType {
  GEMINI_FLASH = "gemini-2.0-flash-exp", // Updated to a more standard model name if needed, or kept as is
}
