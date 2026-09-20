import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { Role, UserStatus } from "../../../generated/prisma/enums";

type PageQuery = { page?: number; limit?: number };

const getPagination = (query: PageQuery) => {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  return { limit, page, skip: (page - 1) * limit };
};

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  middleName: true,
  lastName: true,
  phone: true,
  role: true,
  status: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

const listUsers = async (
  query: PageQuery & { searchTerm?: string; role?: string; status?: string },
) => {
  const { page, limit, skip } = getPagination(query);
  const where = {
    isDeleted: false,
    ...(query.role && { role: query.role as Role }),
    ...(query.status && { status: query.status as UserStatus }),
    ...(query.searchTerm && {
      OR: [
        {
          email: {
            contains: query.searchTerm.trim(),
            mode: "insensitive" as const,
          },
        },
        {
          firstName: {
            contains: query.searchTerm.trim(),
            mode: "insensitive" as const,
          },
        },
        {
          lastName: {
            contains: query.searchTerm.trim(),
            mode: "insensitive" as const,
          },
        },
      ],
    }),
  };
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: userSelect,
    }),
    prisma.user.count({ where }),
  ]);
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const updateUserRole = async (
  targetId: string,
  nextRole: Role,
  actorId: string,
  auditContext: { ipAddress?: string; userAgent?: string },
) => {
  if (targetId === actorId)
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot change your own role.",
    );
  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({
      where: { id: targetId },
      select: { ...userSelect, isDeleted: true },
    });
    if (!current || current.isDeleted)
      throw new AppError(httpStatus.NOT_FOUND, "User not found.");
    if (current.role === nextRole) return current;
    if (current.role === Role.SUPER_ADMIN) {
      const superAdminCount = await tx.user.count({
        where: {
          role: Role.SUPER_ADMIN,
          isDeleted: false,
          status: UserStatus.ACTIVE,
        },
      });
      if (superAdminCount <= 1)
        throw new AppError(
          httpStatus.CONFLICT,
          "The last active super admin cannot be demoted.",
        );
    }
    const updated = await tx.user.update({
      where: { id: targetId },
      data: { role: nextRole },
      select: userSelect,
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "USER_ROLE_UPDATED",
        entity: "User",
        entityId: targetId,
        before: { role: current.role },
        after: { role: nextRole },
        ...auditContext,
      },
    });
    return updated;
  });
};

const getDashboardStats = async () => {
  const [
    usersByRole,
    usersByStatus,
    invoiceSummary,
    paymentSummary,
    recentUsers,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      where: { isDeleted: false },
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["status"],
      where: { isDeleted: false },
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      _count: { _all: true },
      _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
    }),
    prisma.payment.aggregate({
      where: { isVerified: true },
      _count: { _all: true },
      _sum: { amountPaid: true },
    }),
    prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: userSelect,
    }),
  ]);
  return {
    users: {
      total: usersByRole.reduce((sum, item) => sum + item._count._all, 0),
      byRole: usersByRole,
      byStatus: usersByStatus,
    },
    invoices: invoiceSummary,
    verifiedPayments: paymentSummary,
    recentUsers,
  };
};

const getAuditLogs = async (
  query: PageQuery & { action?: string; entity?: string; entityId?: string },
) => {
  const { page, limit, skip } = getPagination(query);
  const where = {
    ...(query.action && { action: query.action as never }),
    ...(query.entity && { entity: query.entity }),
    ...(query.entityId && { entityId: query.entityId }),
  };
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const AdminService = {
  listUsers,
  updateUserRole,
  getDashboardStats,
  getAuditLogs,
};
