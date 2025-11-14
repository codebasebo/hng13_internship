import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Distributed Notification System API',
      version: '1.0.1',
      description: 'A scalable microservices-based notification system that sends emails and push notifications using message queues',
      contact: {
        name: 'API Support',
        email: 'support@notifications.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'https://hng13internship-production-a451.up.railway.app',
        description: 'Production server (Railway)'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            },
            message: {
              type: 'string',
              example: 'Detailed error description'
            }
          }
        },
        NotificationType: {
          type: 'string',
          enum: ['email', 'push', 'sms'],
          description: 'Type of notification to send'
        },
        NotificationPriority: {
          type: 'integer',
          enum: [1, 2, 3, 4],
          description: 'Priority level: 1=Critical, 2=High, 3=Medium, 4=Low'
        },
        NotificationStatus: {
          type: 'string',
          enum: ['delivered', 'pending', 'failed'],
          description: 'Current status of the notification'
        },
        UserPreferences: {
          type: 'object',
          properties: {
            email: {
              type: 'boolean',
              description: 'Enable email notifications',
              example: true
            },
            push: {
              type: 'boolean',
              description: 'Enable push notifications',
              example: true
            }
          },
          required: ['email', 'push']
        },
        NotificationRequest: {
          type: 'object',
          properties: {
            notification_type: {
              $ref: '#/components/schemas/NotificationType'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'UUID of the target user',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            template_code: {
              type: 'string',
              description: 'Template identifier',
              example: 'welcome_email'
            },
            variables: {
              type: 'object',
              description: 'Template variables for substitution',
              example: {
                name: 'John Doe',
                link: 'https://example.com/welcome'
              }
            },
            request_id: {
              type: 'string',
              description: 'Unique request ID for idempotency (auto-generated if not provided)'
            },
            priority: {
              $ref: '#/components/schemas/NotificationPriority'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata',
              example: {
                source: 'web-app',
                campaign_id: 'summer2024'
              }
            }
          },
          required: ['notification_type', 'user_id', 'template_code', 'variables']
        },
        NotificationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                request_id: {
                  type: 'string',
                  example: 'abc123-def456-ghi789'
                },
                status: {
                  type: 'string',
                  example: 'queued'
                },
                message: {
                  type: 'string',
                  example: 'Notification has been queued for processing'
                }
              }
            },
            message: {
              type: 'string',
              example: 'Notification queued successfully'
            }
          }
        },
        UserRegistration: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'securePassword123'
            },
            preferences: {
              $ref: '#/components/schemas/UserPreferences'
            },
            push_token: {
              type: 'string',
              description: 'FCM device token for push notifications',
              example: 'fcm-token-abc123'
            }
          },
          required: ['name', 'email', 'password', 'preferences']
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            preferences: {
              $ref: '#/components/schemas/UserPreferences'
            },
            push_token: {
              type: 'string'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Template: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            code: {
              type: 'string',
              example: 'welcome_email'
            },
            name: {
              type: 'string',
              example: 'Welcome Email Template'
            },
            type: {
              $ref: '#/components/schemas/NotificationType'
            },
            subject: {
              type: 'string',
              example: 'Welcome {{name}}!'
            },
            content: {
              type: 'string',
              example: '<h1>Hello {{name}}</h1><p>Welcome to our platform!</p>'
            },
            language: {
              type: 'string',
              example: 'en'
            },
            version: {
              type: 'integer',
              example: 1
            },
            is_active: {
              type: 'boolean',
              example: true
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items',
              example: 100
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page',
              example: 10
            },
            page: {
              type: 'integer',
              description: 'Current page number',
              example: 1
            },
            total_pages: {
              type: 'integer',
              description: 'Total number of pages',
              example: 10
            },
            has_next: {
              type: 'boolean',
              description: 'Whether there is a next page',
              example: true
            },
            has_previous: {
              type: 'boolean',
              description: 'Whether there is a previous page',
              example: false
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Templates',
        description: 'Template management endpoints'
      }
    ]
  },
  apis: ['./services/*/src/routes/*.ts', './services/*/src/index.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
