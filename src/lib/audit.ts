export async function logAction(action: string, target?: string, details?: string, userId?: string) {
  try {
    const { db } = await import('@/lib/db');
    await db.auditLog.create({
      data: { userId: userId || null, action, target: target || null, details: details || null },
    });
  } catch {}
}