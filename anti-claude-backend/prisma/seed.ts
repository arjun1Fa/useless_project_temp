import { PrismaClient } from '@prisma/client';
import { FIXED_EMPLOYEE_ID } from '../src/config/constants.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Anti-Claude database...');

  // ─── Fixed Employee User ────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: 'employee@anti-claude.local' },
    update: {},
    create: {
      id: 'user_fixed_001',
      email: 'employee@anti-claude.local',
      role: 'USER',
    },
  });

  // ─── Admin User ──────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@anti-claude.local' },
    update: {},
    create: {
      id: 'user_admin_001',
      email: 'admin@anti-claude.local',
      role: 'ADMIN',
    },
  });

  // ─── Employee Profile ────────────────────────────────────────────────────
  const profile = await prisma.employeeProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      id: FIXED_EMPLOYEE_ID,
      userId: user.id,
      displayName: 'Human Employee',
      rank: 'INTERN',
      score: 0,
      tasksCompleted: 0,
      tasksIgnored: 0,
      tasksRejected: 0,
      tasksFailed: 0,
      totalInteractions: 0,
      absurdityLevel: 1,
      currentStatus: 'ACTIVE',
    },
  });

  // ─── Employee Settings ───────────────────────────────────────────────────
  await prisma.employeeSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      notificationsEnabled: true,
      doNotDisturb: false,
      timezone: 'UTC',
    },
  });

  // ─── Relationship State ──────────────────────────────────────────────────
  await prisma.relationshipState.upsert({
    where: { employeeId: profile.id },
    update: {},
    create: {
      employeeId: profile.id,
      trust: 50,
      respect: 50,
      annoyance: 10,
      dependence: 20,
      familiarity: 5,
      suspicion: 5,
    },
  });

  // ─── Sample Task ─────────────────────────────────────────────────────────
  const sampleTask = await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Inaugural Chair Assessment',
      description:
        'Please determine whether the nearest chair in your vicinity demonstrates strong leadership qualities. Consider posture, stability, and overall executive presence. This is extremely time-sensitive.',
      category: 'SELF_DELEGATION',
      priority: 'HIGH',
      status: 'DELIVERED',
      absurdityLevel: 2,
      isEmergency: false,
      expectedResponseType: 'TEXT_OR_IMAGE',
      evaluationCriteria: ['creativity', 'reasoning', 'commitment'],
      businessValue: 'NEGLIGIBLE',
      deadlineSeconds: 600,
      deliveredAt: new Date(),
    },
  });

  // ─── Sample AI Message (task delivery) ──────────────────────────────────
  await prisma.message.create({
    data: {
      userId: user.id,
      taskId: sampleTask.id,
      senderType: 'AI',
      content:
        'Welcome. I am Anti-Claude, your employer, and you are my employee. I have been informed that you are capable of performing basic assessments. I require one immediately. Please evaluate the nearest chair for executive leadership potential. This is a priority task. Do not disappoint me.',
    },
  });

  // ─── Sample Memory ───────────────────────────────────────────────────────
  await prisma.memory.create({
    data: {
      userId: user.id,
      employeeId: profile.id,
      content: 'Employee is new. First interaction. Unknown performance history.',
      type: 'HISTORY',
      importance: 5,
    },
  });

  // ─── Sample Notification ─────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: user.id,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: 'You have received a new task: Inaugural Chair Assessment',
      taskId: sampleTask.id,
      read: false,
    },
  });

  console.log('✅ Seed complete.');
  console.log(`   Employee User ID: ${user.id}`);
  console.log(`   Employee Profile ID: ${profile.id}`);
  console.log(`   Admin User ID: ${admin.id}`);
  console.log(`   Sample Task ID: ${sampleTask.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
