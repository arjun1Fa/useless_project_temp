import { employeeRepo } from '../db/repositories/employee.repo.js';
import { taskRepo } from '../db/repositories/task.repo.js';
import { RANK_THRESHOLDS, RANKS, Rank } from '../config/constants.js';
import { NotFoundError } from '../utils/response.js';

export const employeeService = {
  async getProfile(userId: string) {
    const profile = await employeeRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Employee profile');

    const nextRank = getNextRank(profile.rank as Rank);
    const nextRankThreshold = nextRank ? RANK_THRESHOLDS[nextRank] : null;
    const progressToNextRank = nextRankThreshold
      ? Math.min(100, Math.round(((profile.score - RANK_THRESHOLDS[profile.rank as Rank]) / (nextRankThreshold - RANK_THRESHOLDS[profile.rank as Rank])) * 100))
      : 100;

    return {
      ...profile,
      // Derived metrics
      aiProductivity: 0, // Anti-Claude is intentionally useless
      salary: 0, // The AI doesn't pay
      humanProductivity: calculateHumanProductivity(profile.tasksCompleted, profile.totalInteractions),
      nextRank,
      nextRankThreshold,
      progressToNextRank,
    };
  },

  async getStats(userId: string) {
    const profile = await employeeRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Employee profile');

    return {
      tasksCompleted: profile.tasksCompleted,
      tasksIgnored: profile.tasksIgnored,
      tasksRejected: profile.tasksRejected,
      tasksFailed: profile.tasksFailed,
      totalInteractions: profile.totalInteractions,
      averageResponseTime: profile.averageResponseTime,
      creativityScore: profile.creativityScore,
      complianceScore: profile.complianceScore,
      loyaltyScore: profile.loyaltyScore,
      initiativeScore: profile.initiativeScore,
      absurdityLevel: profile.absurdityLevel,
      score: profile.score,
      rank: profile.rank,
    };
  },

  async getHistory(userId: string) {
    return taskRepo.findByUserId(userId, { limit: 20 });
  },

  async getPromotions(userId: string) {
    const profile = await employeeRepo.findByUserId(userId);
    if (!profile) throw new NotFoundError('Employee profile');
    return profile.promotions;
  },

  async updateSettings(userId: string, data: { notificationsEnabled?: boolean; doNotDisturb?: boolean; timezone?: string }) {
    return employeeRepo.updateSettings(userId, data);
  },
};

function getNextRank(currentRank: Rank): Rank | null {
  const idx = RANKS.indexOf(currentRank);
  if (idx === -1 || idx >= RANKS.length - 1) return null;
  return RANKS[idx + 1] as Rank;
}

function calculateHumanProductivity(tasksCompleted: number, totalInteractions: number): number {
  if (totalInteractions === 0) return 0;
  return Math.round((tasksCompleted / totalInteractions) * 100);
}
