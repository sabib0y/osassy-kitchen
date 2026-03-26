import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  subDays,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns';

type ReportType = 'revenue' | 'orders' | 'subscriptions';
type ReportPeriod = 'week' | 'month' | 'year';

interface ReportData {
  summary: {
    total: number;
    average: number;
    change: number;
    changePercent: number;
  };
  trend: Array<{
    label: string;
    value: number;
    previousValue?: number;
  }>;
  breakdown: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
}

function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      newObj[key] = serializeBigInt((obj as Record<string, unknown>)[key]);
    }
    return newObj;
  }
  return obj;
}

function getDateRange(period: ReportPeriod): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
  const now = new Date();
  const end = endOfDay(now);

  switch (period) {
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end,
        previousStart: subDays(startOfWeek(now, { weekStartsOn: 1 }), 7),
        previousEnd: subDays(startOfWeek(now, { weekStartsOn: 1 }), 1),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end,
        previousStart: startOfMonth(subDays(startOfMonth(now), 1)),
        previousEnd: subDays(startOfMonth(now), 1),
      };
    case 'year':
      return {
        start: startOfYear(now),
        end,
        previousStart: startOfYear(subDays(startOfYear(now), 1)),
        previousEnd: subDays(startOfYear(now), 1),
      };
  }
}

async function getRevenueReport(start: Date, end: Date, previousStart: Date, previousEnd: Date, period: ReportPeriod): Promise<ReportData> {
  const [currentOrders, previousOrders, ordersByStatus] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: 'CANCELLED' },
      },
      select: { totalPrice: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: previousStart, lte: previousEnd },
        status: { not: 'CANCELLED' },
      },
      select: { totalPrice: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: start, lte: end },
      },
      _sum: { totalPrice: true },
      _count: { status: true },
    }),
  ]);

  const currentTotal = currentOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const previousTotal = previousOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const change = currentTotal - previousTotal;
  const changePercent = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

  // Generate trend data
  const intervals = period === 'year'
    ? eachMonthOfInterval({ start, end })
    : period === 'month'
    ? eachWeekOfInterval({ start, end })
    : eachDayOfInterval({ start, end });

  const trendMap: Record<string, number> = {};
  intervals.forEach(date => {
    const label = period === 'year'
      ? format(date, 'MMM')
      : period === 'month'
      ? format(date, 'dd MMM')
      : format(date, 'EEE');
    trendMap[label] = 0;
  });

  currentOrders.forEach(order => {
    const label = period === 'year'
      ? format(order.createdAt, 'MMM')
      : period === 'month'
      ? format(order.createdAt, 'dd MMM')
      : format(order.createdAt, 'EEE');
    if (trendMap[label] !== undefined) {
      trendMap[label] += Number(order.totalPrice);
    }
  });

  const trend = Object.entries(trendMap).map(([label, value]) => ({ label, value }));

  // Breakdown by status
  const totalRevenue = ordersByStatus.reduce((sum, s) => sum + Number(s._sum.totalPrice || 0), 0);
  const breakdown = ordersByStatus.map(s => ({
    label: s.status,
    value: Number(s._sum.totalPrice || 0),
    percentage: totalRevenue > 0 ? (Number(s._sum.totalPrice || 0) / totalRevenue) * 100 : 0,
  }));

  return {
    summary: {
      total: currentTotal,
      average: currentOrders.length > 0 ? currentTotal / currentOrders.length : 0,
      change,
      changePercent,
    },
    trend,
    breakdown,
  };
}

async function getOrdersReport(start: Date, end: Date, previousStart: Date, previousEnd: Date, period: ReportPeriod): Promise<ReportData> {
  const [currentOrders, previousOrders, ordersByStatus] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { status: true, createdAt: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { status: true },
    }),
  ]);

  const currentTotal = currentOrders.length;
  const change = currentTotal - previousOrders;
  const changePercent = previousOrders > 0 ? (change / previousOrders) * 100 : 0;

  // Generate trend data
  const intervals = period === 'year'
    ? eachMonthOfInterval({ start, end })
    : period === 'month'
    ? eachWeekOfInterval({ start, end })
    : eachDayOfInterval({ start, end });

  const trendMap: Record<string, number> = {};
  intervals.forEach(date => {
    const label = period === 'year'
      ? format(date, 'MMM')
      : period === 'month'
      ? format(date, 'dd MMM')
      : format(date, 'EEE');
    trendMap[label] = 0;
  });

  currentOrders.forEach(order => {
    const label = period === 'year'
      ? format(order.createdAt, 'MMM')
      : period === 'month'
      ? format(order.createdAt, 'dd MMM')
      : format(order.createdAt, 'EEE');
    if (trendMap[label] !== undefined) {
      trendMap[label] += 1;
    }
  });

  const trend = Object.entries(trendMap).map(([label, value]) => ({ label, value }));

  // Breakdown by status
  const breakdown = ordersByStatus.map(s => ({
    label: s.status,
    value: s._count.status,
    percentage: currentTotal > 0 ? (s._count.status / currentTotal) * 100 : 0,
  }));

  return {
    summary: {
      total: currentTotal,
      average: trend.length > 0 ? currentTotal / trend.length : 0,
      change,
      changePercent,
    },
    trend,
    breakdown,
  };
}

async function getSubscriptionsReport(start: Date, end: Date, previousStart: Date, previousEnd: Date, period: ReportPeriod): Promise<ReportData> {
  const [currentSubs, previousSubs, subsByStatus] = await Promise.all([
    prisma.subscription.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { status: true, createdAt: true },
    }),
    prisma.subscription.count({
      where: { createdAt: { gte: previousStart, lte: previousEnd } },
    }),
    prisma.subscription.groupBy({
      by: ['status'],
      where: { createdAt: { gte: start, lte: end } },
      _count: { status: true },
    }),
  ]);

  const currentTotal = currentSubs.length;
  const change = currentTotal - previousSubs;
  const changePercent = previousSubs > 0 ? (change / previousSubs) * 100 : 0;

  // Generate trend data
  const intervals = period === 'year'
    ? eachMonthOfInterval({ start, end })
    : period === 'month'
    ? eachWeekOfInterval({ start, end })
    : eachDayOfInterval({ start, end });

  const trendMap: Record<string, number> = {};
  intervals.forEach(date => {
    const label = period === 'year'
      ? format(date, 'MMM')
      : period === 'month'
      ? format(date, 'dd MMM')
      : format(date, 'EEE');
    trendMap[label] = 0;
  });

  currentSubs.forEach(sub => {
    const label = period === 'year'
      ? format(sub.createdAt, 'MMM')
      : period === 'month'
      ? format(sub.createdAt, 'dd MMM')
      : format(sub.createdAt, 'EEE');
    if (trendMap[label] !== undefined) {
      trendMap[label] += 1;
    }
  });

  const trend = Object.entries(trendMap).map(([label, value]) => ({ label, value }));

  // Breakdown by status
  const breakdown = subsByStatus.map(s => ({
    label: s.status,
    value: s._count.status,
    percentage: currentTotal > 0 ? (s._count.status / currentTotal) * 100 : 0,
  }));

  return {
    summary: {
      total: currentTotal,
      average: trend.length > 0 ? currentTotal / trend.length : 0,
      change,
      changePercent,
    },
    trend,
    breakdown,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = await getToken({ req });
    if (!token || !token.email) {
      return res.status(401).json({ message: 'Unauthorised' });
    }

    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }

    const type = (req.query.type as ReportType) || 'revenue';
    const period = (req.query.period as ReportPeriod) || 'month';

    if (!['revenue', 'orders', 'subscriptions'].includes(type)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    if (!['week', 'month', 'year'].includes(period)) {
      return res.status(400).json({ message: 'Invalid period' });
    }

    const { start, end, previousStart, previousEnd } = getDateRange(period);

    let reportData: ReportData;

    switch (type) {
      case 'revenue':
        reportData = await getRevenueReport(start, end, previousStart, previousEnd, period);
        break;
      case 'orders':
        reportData = await getOrdersReport(start, end, previousStart, previousEnd, period);
        break;
      case 'subscriptions':
        reportData = await getSubscriptionsReport(start, end, previousStart, previousEnd, period);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.status(200).json(serializeBigInt({
      type,
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      ...reportData,
    }));
  } catch (error) {
    console.error('Reports API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
