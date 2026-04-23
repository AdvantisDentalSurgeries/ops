import type { OpenAPIV3 } from 'openapi-types';

const bearerAuth: OpenAPIV3.SecuritySchemeObject = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
};

export const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Dental Surgery Ops API',
    version: '1.0.0',
    description:
      'REST API for managing dental surgery operations — appointments, patients, dentists, billing, and appointment requests.',
  },
  servers: [{ url: '/api', description: 'API base path' }],
  components: {
    securitySchemes: { bearerAuth },
    schemas: {
      Role: {
        type: 'string',
        enum: ['OFFICE_MANAGER', 'DENTIST', 'PATIENT'],
      },
      AppointmentStatus: {
        type: 'string',
        enum: ['SCHEDULED', 'CANCELLED', 'COMPLETED'],
      },
      RequestType: {
        type: 'string',
        enum: ['PHONE', 'ONLINE'],
      },

      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { $ref: '#/components/schemas/Role' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      Surgery: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          address: { type: 'string' },
          phone: { type: 'string' },
        },
      },

      Dentist: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          specialization: { type: 'string' },
          surgeryId: { type: 'string' },
        },
      },

      Patient: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
        },
      },

      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          dentistId: { type: 'string' },
          patientId: { type: 'string' },
          dateTime: { type: 'string', format: 'date-time' },
          status: { $ref: '#/components/schemas/AppointmentStatus' },
          notes: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      AppointmentRequest: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          patientId: { type: 'string' },
          requestType: { $ref: '#/components/schemas/RequestType' },
          requestedDate: { type: 'string', format: 'date-time' },
          appointmentId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      Bill: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          appointmentId: { type: 'string' },
          patientId: { type: 'string' },
          amount: { type: 'number' },
          isPaid: { type: 'boolean' },
          dueDate: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid JWT',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Forbidden: {
        description: 'Authenticated but lacks the required role',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },

  paths: {
    // ── Auth ──────────────────────────────────────────────────────────────
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and receive a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'alice@example.com' },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'JWT token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user (OFFICE_MANAGER only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'role'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  role: { $ref: '#/components/schemas/Role' },
                  profile: {
                    type: 'object',
                    description: 'Required fields differ by role',
                    properties: {
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      phone: { type: 'string' },
                      specialization: { type: 'string', description: 'DENTIST only' },
                      surgeryId: { type: 'string', description: 'DENTIST only' },
                      address: { type: 'string', description: 'PATIENT only' },
                      dateOfBirth: { type: 'string', format: 'date', description: 'PATIENT only' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // ── Appointments ──────────────────────────────────────────────────────
    '/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'List appointments (filtered by role)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of appointments',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Appointment' },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Book an appointment (OFFICE_MANAGER only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dentistId', 'patientId', 'dateTime'],
                properties: {
                  dentistId: { type: 'string' },
                  patientId: { type: 'string' },
                  dateTime: { type: 'string', format: 'date-time' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Appointment created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' },
              },
            },
          },
          '400': {
            description: 'Business rule violation (e.g. dentist has 5 appointments this week, patient has unpaid bill)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/appointments/{id}/cancel': {
      put: {
        tags: ['Appointments'],
        summary: 'Cancel an appointment (DENTIST or PATIENT)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Appointment ID',
          },
        ],
        responses: {
          '200': {
            description: 'Cancelled appointment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/appointments/{id}/reschedule': {
      put: {
        tags: ['Appointments'],
        summary: 'Reschedule an appointment (DENTIST or PATIENT)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Appointment ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['dateTime'],
                properties: {
                  dateTime: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Rescheduled appointment',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Appointment' },
              },
            },
          },
          '400': {
            description: 'Business rule violation',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Dentists ──────────────────────────────────────────────────────────
    '/dentists': {
      get: {
        tags: ['Dentists'],
        summary: 'List all dentists (OFFICE_MANAGER only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of dentists',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Dentist' },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // ── Patients ──────────────────────────────────────────────────────────
    '/patients': {
      get: {
        tags: ['Patients'],
        summary: 'List all patients (OFFICE_MANAGER only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of patients',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Patient' },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // ── Appointment Requests ──────────────────────────────────────────────
    '/requests': {
      get: {
        tags: ['Appointment Requests'],
        summary: 'List all appointment requests (OFFICE_MANAGER only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of appointment requests',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AppointmentRequest' },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Appointment Requests'],
        summary: 'Submit an appointment request (PATIENT only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['requestType', 'requestedDate'],
                properties: {
                  requestType: { $ref: '#/components/schemas/RequestType' },
                  requestedDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Request created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AppointmentRequest' },
              },
            },
          },
          '400': {
            description: 'Patient has an unpaid bill',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // ── Bills ─────────────────────────────────────────────────────────────
    '/bills/{patientId}': {
      get: {
        tags: ['Bills'],
        summary: "Get a patient's bills (PATIENT or OFFICE_MANAGER)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'patientId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Patient ID',
          },
        ],
        responses: {
          '200': {
            description: 'Array of bills',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Bill' },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    '/bills/{id}/pay': {
      put: {
        tags: ['Bills'],
        summary: 'Mark a bill as paid (OFFICE_MANAGER only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Bill ID',
          },
        ],
        responses: {
          '200': {
            description: 'Updated bill',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Bill' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Surgeries ─────────────────────────────────────────────────────────
    '/surgeries': {
      get: {
        tags: ['Surgeries'],
        summary: 'List all surgeries (authenticated)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of surgeries',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Surgery' },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Surgeries'],
        summary: 'Create a surgery (OFFICE_MANAGER only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'address', 'phone'],
                properties: {
                  name: { type: 'string' },
                  address: { type: 'string' },
                  phone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Surgery created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Surgery' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
  },
};
