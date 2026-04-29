import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getAuth } from 'firebase-admin/auth';

// ─── Interfaces exportées ─────────────────────────────────────────────────────

export interface UserWhereInput {
  currentPlan?: string;
}

export interface PaymentWhereInput {
  status?: string;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  minutesUsed: number;
  minutesTotal: number;
  lastActive: Date;
}

export interface PaymentRow {
  id: string;
  name: string;
  email: string;
  amount: number;
  status: string;
  date: Date;
  plan: string;
}

export interface TopUserRow {
  name: string;
  plan: string;
  minutesUsed: number;
  initial: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private async getFirebaseUserRegistrationStats(
    startOfMonth?: Date,
    startOfLastMonth?: Date,
  ): Promise<{
    totalUsers: number;
    usersThisMonth: number;
    usersLastMonth: number;
  }> {
    const auth = getAuth();
    let pageToken: string | undefined;
    let totalUsers = 0;
    let usersThisMonth = 0;
    let usersLastMonth = 0;

    do {
      const result = await auth.listUsers(1000, pageToken);
      totalUsers += result.users.length;

      if (startOfMonth && startOfLastMonth) {
        for (const user of result.users) {
          const createdAt = new Date(user.metadata.creationTime);
          if (createdAt >= startOfMonth) {
            usersThisMonth += 1;
          } else if (
            createdAt >= startOfLastMonth &&
            createdAt < startOfMonth
          ) {
            usersLastMonth += 1;
          }
        }
      }

      pageToken = result.pageToken;
    } while (pageToken);

    return { totalUsers, usersThisMonth, usersLastMonth };
  }

  // ─── Calcul croissance ────────────────────────────────────────────────────
  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  // ─── Dashboard stats ──────────────────────────────────────────────────────
  async getDashboardStats(): Promise<Record<string, number>> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      firebaseUserStats,
      totalVideos,
      revenueResult,
      pendingResult,
      videosThisMonth,
      videosLastMonth,
      revenueThisMonth,
      revenueLastMonth,
    ] = await Promise.all([
      this.getFirebaseUserRegistrationStats(startOfMonth, startOfLastMonth),
      this.prisma.video.count(),
      this.prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
      }),
      this.prisma.video.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.video.count({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'completed', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'completed',
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = (revenueResult._sum.amount ?? 0) / 100;
    const pendingRevenue = (pendingResult._sum.amount ?? 0) / 100;
    const estimatedProfit = totalRevenue * 0.56;

    return {
      totalUsers: firebaseUserStats.totalUsers,
      totalVideos,
      totalRevenue,
      estimatedProfit: Math.round(estimatedProfit * 100) / 100,
      pendingRevenue,
      subsThisMonth: firebaseUserStats.usersThisMonth,
      avgVideosPerDay: Math.round(videosThisMonth / Math.max(now.getDate(), 1)),
      userGrowthPercent: this.calculateGrowth(
        firebaseUserStats.usersThisMonth,
        firebaseUserStats.usersLastMonth,
      ),
      videoGrowthPercent: this.calculateGrowth(
        videosThisMonth,
        videosLastMonth,
      ),
      revenueGrowthPercent: this.calculateGrowth(
        revenueThisMonth._sum.amount ?? 0,
        revenueLastMonth._sum.amount ?? 0,
      ),
    };
  }

  // ─── Users stats ──────────────────────────────────────────────────────────
  async getUsersStats(): Promise<Record<string, number>> {
    const [firebaseUserStats, proUsers, starterUsers, activeNow, usageResult] =
      await Promise.all([
        this.getFirebaseUserRegistrationStats(),
        this.prisma.userSubscription.count({ where: { currentPlan: 'pro' } }),
        this.prisma.userSubscription.count({
          where: { currentPlan: 'starter' },
        }),
        this.prisma.userSubscription.count({
          where: {
            updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.userSubscription.aggregate({
          _avg: { monthlyMinutesUsed: true },
        }),
      ]);
    const totalUsers = firebaseUserStats.totalUsers;

    const proConversionRate =
      totalUsers > 0
        ? Math.round(((proUsers + starterUsers) / totalUsers) * 1000) / 10
        : 0;

    const avgUsagePerMonth = Math.round(
      usageResult._avg.monthlyMinutesUsed ?? 0,
    );

    return {
      totalUsers,
      proUsers: proUsers + starterUsers,
      proConversionRate,
      activeNow,
      avgUsagePerMonth,
    };
  }

  // ─── Liste des users ──────────────────────────────────────────────────────
  async getUsers(
    page: number,
    limit: number,
    search?: string,
    plan?: string,
  ): Promise<{ users: UserRow[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const where: UserWhereInput = {};
    if (plan && plan !== 'all') where.currentPlan = plan;

    const [subscriptions, total] = await Promise.all([
      this.prisma.userSubscription.findMany({
        skip,
        take: limit,
        where,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.userSubscription.count({ where }),
    ]);

    const auth = getAuth();
    const users: UserRow[] = await Promise.all(
      subscriptions.map(async (sub): Promise<UserRow> => {
        const minutesTotal = sub.currentPlan === 'pro' ? 200 : 60;
        try {
          const fbUser = await auth.getUser(sub.userId);
          return {
            id: sub.userId,
            name:
              fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Unknown',
            email: fbUser.email ?? '',
            plan: sub.currentPlan,
            status:
              sub.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ? 'Active'
                : 'Inactive',
            minutesUsed: sub.monthlyMinutesUsed,
            minutesTotal,
            lastActive: sub.updatedAt,
          };
        } catch {
          return {
            id: sub.userId,
            name: 'Unknown User',
            email: '',
            plan: sub.currentPlan,
            status: 'Inactive',
            minutesUsed: sub.monthlyMinutesUsed,
            minutesTotal,
            lastActive: sub.updatedAt,
          };
        }
      }),
    );

    let filtered: UserRow[] = users;
    if (search) {
      const s = search.toLowerCase();
      filtered = users.filter(
        (u) =>
          u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s),
      );
    }

    return { users: filtered, total, page, limit };
  }

  // ─── Top users ────────────────────────────────────────────────────────────
  async getTopUsers(): Promise<{ users: TopUserRow[] }> {
    const topSubs = await this.prisma.userSubscription.findMany({
      orderBy: { monthlyMinutesUsed: 'desc' },
      take: 4,
    });

    const auth = getAuth();
    const users: TopUserRow[] = await Promise.all(
      topSubs.map(async (sub): Promise<TopUserRow> => {
        try {
          const fbUser = await auth.getUser(sub.userId);
          const displayName = fbUser.displayName ?? fbUser.email ?? 'U';
          return {
            name:
              fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Unknown',
            plan: sub.currentPlan,
            minutesUsed: sub.monthlyMinutesUsed,
            initial: displayName[0].toUpperCase(),
          };
        } catch {
          return {
            name: 'Unknown',
            plan: sub.currentPlan,
            minutesUsed: sub.monthlyMinutesUsed,
            initial: 'U',
          };
        }
      }),
    );

    return { users };
  }

  // ─── Paiements paginés ────────────────────────────────────────────────────
  async getPayments(
    page: number,
    limit: number,
    status?: string,
  ): Promise<{
    payments: PaymentRow[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: PaymentWhereInput = {};
    if (status && status !== 'all') where.status = status;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const auth = getAuth();
    const enriched: PaymentRow[] = await Promise.all(
      payments.map(async (p): Promise<PaymentRow> => {
        try {
          const fbUser = await auth.getUser(p.userId);
          return {
            id: p.paymentId ?? String(p.id),
            name:
              fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Unknown',
            email: p.customerEmail ?? fbUser.email ?? '',
            amount: p.amount / 100,
            status: p.status,
            date: p.createdAt,
            plan: p.plan,
          };
        } catch {
          return {
            id: p.paymentId ?? String(p.id),
            name: 'Unknown',
            email: p.customerEmail ?? '',
            amount: p.amount / 100,
            status: p.status,
            date: p.createdAt,
            plan: p.plan,
          };
        }
      }),
    );

    return { payments: enriched, total, page, limit };
  }

  // ─── Stats paiements ──────────────────────────────────────────────────────
  async getPaymentsStats(): Promise<Record<string, number>> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      monthlyRevenue,
      previousMonthRevenue,
      pendingPayouts,
      totalPayments,
      refundedPayments,
      totalPaymentsLastMonth,
      refundedLastMonth,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'completed', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'completed',
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.payment.count({
        where: { status: 'cancelled', createdAt: { gte: startOfMonth } },
      }),
      this.prisma.payment.count({
        where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
      }),
      this.prisma.payment.count({
        where: {
          status: 'cancelled',
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
    ]);

    const refundRate =
      totalPayments > 0
        ? Math.round((refundedPayments / totalPayments) * 10000) / 100
        : 0;

    const refundRateLastMonth =
      totalPaymentsLastMonth > 0
        ? Math.round((refundedLastMonth / totalPaymentsLastMonth) * 10000) / 100
        : 0;

    return {
      monthlyRevenue: (monthlyRevenue._sum.amount ?? 0) / 100,
      previousMonthRevenue: (previousMonthRevenue._sum.amount ?? 0) / 100,
      revenueGrowthPercent: this.calculateGrowth(
        monthlyRevenue._sum.amount ?? 0,
        previousMonthRevenue._sum.amount ?? 0,
      ),
      pendingPayouts: (pendingPayouts._sum.amount ?? 0) / 100,
      pendingCount: pendingPayouts._count._all ?? 0,
      refundRate,
      refundRateChange:
        Math.round((refundRate - refundRateLastMonth) * 100) / 100,
    };
  }

  // ─── Paiements récents ────────────────────────────────────────────────────
  async getRecentPayments(): Promise<{ payments: PaymentRow[] }> {
    const payments = await this.prisma.payment.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    const auth = getAuth();
    const enriched: PaymentRow[] = await Promise.all(
      payments.map(async (p): Promise<PaymentRow> => {
        try {
          const fbUser = await auth.getUser(p.userId);
          return {
            id: p.paymentId ?? String(p.id),
            name:
              fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'Unknown',
            email: p.customerEmail ?? fbUser.email ?? '',
            amount: p.amount / 100,
            status: p.status,
            date: p.createdAt,
            plan: p.plan,
          };
        } catch {
          return {
            id: p.paymentId ?? String(p.id),
            name: 'Unknown',
            email: p.customerEmail ?? '',
            amount: p.amount / 100,
            status: p.status,
            date: p.createdAt,
            plan: p.plan,
          };
        }
      }),
    );

    return { payments: enriched };
  }

  // ─── Vérification mot de passe admin ──────────────────────────────────────
  verifyAdminPassword(password: string): { valid: boolean } {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD not configured');
    }
    return { valid: password === adminPassword };
  }
}
