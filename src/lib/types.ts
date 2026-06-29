export type Role = "user" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  role: Role;
  ai_message_count: number;
  ai_message_limit: number;
  banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: number;
  ai_system_prompt: string;
  ai_temperature: number;
  ai_enabled: boolean;
  default_ai_limit: number;
  store_announcement: string;
  maintenance: boolean;
}

export interface AiConfig {
  id: string;
  provider: "gemini" | "openai" | "grok" | "claude" | "custom";
  label: string;
  api_key: string;
  base_url: string;
  model: string;
  is_active: boolean;
  created_at: string;
}

export interface AiSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  base_price: number;
  delivery_days: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type ServiceStatus =
  | "pending"
  | "reviewing"
  | "approved"
  | "invoiced"
  | "sample_sent"
  | "completed"
  | "rejected"
  | "cancelled";

export interface ServiceOrder {
  id: string;
  order_code: string;
  user_id: string;
  service_id: string | null;
  title: string;
  brief: string;
  details: Record<string, any>;
  budget: number;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_id: string | null;
  sender_role: "user" | "admin" | "system";
  kind: "text" | "image" | "file" | "invoice" | "sample" | "final";
  content: string;
  file_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export type ProductType =
  | "digital"
  | "physical"
  | "subscription"
  | "license"
  | "template"
  | "other";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_price: number | null;
  category: string;
  type: ProductType;
  image_url: string | null;
  file_url: string | null;
  stock: number | null;
  is_active: boolean;
  data: Record<string, any>;
  created_at: string;
}

export type ProductStatus =
  | "pending"
  | "paid"
  | "approved"
  | "delivered"
  | "rejected"
  | "cancelled";

export interface ProductOrder {
  id: string;
  order_code: string;
  user_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  amount: number;
  status: ProductStatus;
  file_url: string | null;
  note: string;
  created_at: string;
  updated_at: string;
}

export type PaymentType =
  | "mobile_money"
  | "orange_money"
  | "wave"
  | "moov"
  | "bank"
  | "paypal"
  | "card"
  | "crypto"
  | "other";

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentType;
  holder: string;
  number: string;
  extra: Record<string, any>;
  instructions: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface PaymentProof {
  id: string;
  order_code: string;
  order_type: "service" | "product";
  user_id: string | null;
  amount: number | null;
  file_url: string;
  note: string;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  created_at: string;
}
