import { NotificationType, NotificationPriority } from '../enums/notification.enum';

export interface UserData {
  name: string;
  link: string;
  meta?: Record<string, any>;
}

export interface NotificationRequest {
  notification_type: NotificationType;
  user_id: string;
  template_code: string;
  variables: UserData;
  request_id: string;
  priority: NotificationPriority;
  metadata?: Record<string, any>;
}

export interface UserPreference {
  email: boolean;
  push: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  push_token?: string;
  preferences: UserPreference;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  push_token?: string;
  preferences?: UserPreference;
}

export interface NotificationStatusUpdate {
  notification_id: string;
  status: string;
  timestamp?: Date;
  error?: string;
}

export interface TemplateVariables {
  [key: string]: any;
}

export interface Template {
  id: string;
  code: string;
  name: string;
  type: NotificationType;
  subject?: string;
  content: string;
  language: string;
  version: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
