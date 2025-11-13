# Sample Templates

This file contains sample templates you can create in the system.

## Welcome Email Template

```json
{
  "code": "welcome_email",
  "name": "Welcome Email",
  "type": "email",
  "subject": "Welcome to {{name}}!",
  "content": "<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;padding:20px;}.header{background:#4CAF50;color:white;padding:20px;text-align:center;}.content{padding:20px;}.button{background:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin:20px 0;}</style></head><body><div class='container'><div class='header'><h1>Welcome!</h1></div><div class='content'><p>Hi {{name}},</p><p>Thank you for joining our platform. We're excited to have you on board!</p><a href='{{link}}' class='button'>Get Started</a><p>If you have any questions, feel free to reach out to our support team.</p><p>Best regards,<br>The Team</p></div></div></body></html>",
  "language": "en"
}
```

## Password Reset Email Template

```json
{
  "code": "password_reset",
  "name": "Password Reset",
  "type": "email",
  "subject": "Reset Your Password",
  "content": "<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;padding:20px;}.header{background:#FF5722;color:white;padding:20px;text-align:center;}.content{padding:20px;}.button{background:#FF5722;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin:20px 0;}.warning{background:#fff3cd;padding:10px;border-left:4px solid #ffc107;margin:20px 0;}</style></head><body><div class='container'><div class='header'><h1>Password Reset Request</h1></div><div class='content'><p>Hi {{name}},</p><p>We received a request to reset your password. Click the button below to create a new password:</p><a href='{{link}}' class='button'>Reset Password</a><div class='warning'><strong>Note:</strong> This link will expire in 1 hour.</div><p>If you didn't request this, please ignore this email.</p><p>Best regards,<br>The Security Team</p></div></div></body></html>",
  "language": "en"
}
```

## Order Confirmation Email Template

```json
{
  "code": "order_confirmation",
  "name": "Order Confirmation",
  "type": "email",
  "subject": "Order Confirmation #{{order_id}}",
  "content": "<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;padding:20px;}.header{background:#2196F3;color:white;padding:20px;text-align:center;}.content{padding:20px;}.order-details{background:#f5f5f5;padding:15px;margin:20px 0;border-radius:5px;}.button{background:#2196F3;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin:20px 0;}</style></head><body><div class='container'><div class='header'><h1>Order Confirmed!</h1></div><div class='content'><p>Hi {{name}},</p><p>Thank you for your order. Your order has been confirmed and will be processed shortly.</p><div class='order-details'><strong>Order ID:</strong> {{order_id}}<br><strong>Total:</strong> {{total}}</div><a href='{{link}}' class='button'>View Order Details</a><p>You will receive a shipping confirmation once your order has been shipped.</p><p>Best regards,<br>The Sales Team</p></div></div></body></html>",
  "language": "en"
}
```

## Push Notification Templates

```json
{
  "code": "new_message_push",
  "name": "New Message Push",
  "type": "push",
  "subject": "New message from {{sender}}",
  "content": "{{message}}",
  "language": "en"
}
```

```json
{
  "code": "reminder_push",
  "name": "Reminder Push",
  "type": "push",
  "subject": "Reminder: {{title}}",
  "content": "{{description}}",
  "language": "en"
}
```

## How to Create Templates

### Using cURL

```bash
# Get JWT token first by logging in
TOKEN="your-jwt-token"

# Create welcome email template
curl -X POST http://localhost:3002/api/v1/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "welcome_email",
    "name": "Welcome Email",
    "type": "email",
    "subject": "Welcome {{name}}!",
    "content": "<h1>Welcome {{name}}!</h1><p>Thank you for joining us.</p><a href=\"{{link}}\">Get Started</a>",
    "language": "en"
  }'
```

### Using the Template Service API

1. First, register a user and login to get a JWT token
2. Use the token to create templates via the Template Service API
3. Templates will be cached in Redis for fast access

## Template Variables

Common variables used across templates:

- `{{name}}` - User's name
- `{{email}}` - User's email
- `{{link}}` - Action link/URL
- `{{order_id}}` - Order ID
- `{{total}}` - Order total
- `{{sender}}` - Message sender
- `{{message}}` - Message content
- `{{title}}` - Notification title
- `{{description}}` - Description text

## Multi-language Support

To create templates in different languages, use the `language` parameter:

```json
{
  "code": "welcome_email",
  "name": "Welcome Email (Spanish)",
  "type": "email",
  "subject": "¡Bienvenido {{name}}!",
  "content": "<h1>¡Bienvenido {{name}}!</h1><p>Gracias por unirte.</p>",
  "language": "es"
}
```
