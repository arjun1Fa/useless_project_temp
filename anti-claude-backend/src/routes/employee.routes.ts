import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { employeeService } from '../services/employee.service.js';
import { sendSuccess } from '../utils/response.js';
import { FIXED_EMPLOYEE_ID } from '../config/constants.js';
import { prisma } from '../db/client.js';

// The fixed user ID for the single-employee hackathon mode
const FIXED_USER_ID = 'user_fixed_001';

const updateSettingsSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  doNotDisturb: z.boolean().optional(),
  timezone: z.string().optional(),
});

export async function employeeRoutes(app: FastifyInstance) {
  // GET /api/v1/employee
  app.get('/employee', {
    schema: {
      tags: ['employee'],
      summary: 'Get the employee profile with all metrics',
    },
  }, async (_req, reply) => {
    const profile = await employeeService.getProfile(FIXED_USER_ID);
    return sendSuccess(reply, profile);
  });

  // GET /api/v1/employee/stats
  app.get('/employee/stats', {
    schema: { tags: ['employee'], summary: 'Get employee performance statistics' },
  }, async (_req, reply) => {
    const stats = await employeeService.getStats(FIXED_USER_ID);
    return sendSuccess(reply, stats);
  });

  // GET /api/v1/employee/history
  app.get('/employee/history', {
    schema: { tags: ['employee'], summary: 'Get recent task history' },
  }, async (_req, reply) => {
    const history = await employeeService.getHistory(FIXED_USER_ID);
    return sendSuccess(reply, history);
  });

  // GET /api/v1/employee/promotions
  app.get('/employee/promotions', {
    schema: { tags: ['employee'], summary: 'Get promotion history' },
  }, async (_req, reply) => {
    const promotions = await employeeService.getPromotions(FIXED_USER_ID);
    return sendSuccess(reply, promotions);
  });

  // PATCH /api/v1/employee/settings
  app.patch('/employee/settings', {
    schema: { tags: ['employee'], summary: 'Update employee settings (DND, notifications, timezone)' },
  }, async (req, reply) => {
    const body = updateSettingsSchema.parse(req.body);
    const settings = await employeeService.updateSettings(FIXED_USER_ID, body);
    return sendSuccess(reply, settings);
  });
}
