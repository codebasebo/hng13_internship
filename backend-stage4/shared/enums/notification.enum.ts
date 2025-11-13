export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push'
}

export enum NotificationStatus {
  DELIVERED = 'delivered',
  PENDING = 'pending',
  FAILED = 'failed'
}

export enum NotificationPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4
}
