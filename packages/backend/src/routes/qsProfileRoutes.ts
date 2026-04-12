/**
 * QS user profile (contact fields + login email change)
 */

import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import createError from 'http-errors';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { requireQS } from '../middleware/permissionsMiddleware';
import { prisma } from '../utils/prisma';
import { comparePassword } from '../utils/password';

const router = Router();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

router.get(
  '/qs/profile',
  requireAuth,
  requireQS,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          phone: true,
          whatsapp: true,
        },
      });
      if (!user) {
        return next(createError(404, 'User not found'));
      }
      res.json({
        profile: {
          email: user.email,
          name: user.name,
          phone: user.phone,
          whatsapp: user.whatsapp,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/qs/profile',
  requireAuth,
  requireQS,
  [
    body('name')
      .optional({ nullable: true })
      .custom((v) => v === null || (typeof v === 'string' && v.length <= 255)),
    body('phone')
      .optional({ nullable: true })
      .custom((v) => v === null || (typeof v === 'string' && v.length <= 50)),
    body('whatsapp')
      .optional({ nullable: true })
      .custom((v) => v === null || (typeof v === 'string' && v.length <= 50)),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('currentPassword')
      .optional()
      .isString()
      .isLength({ min: 1 })
      .withMessage('Current password is required when changing email'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId!;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true },
      });
      if (!user || !user.organization) {
        return next(createError(404, 'User not found'));
      }

      const body = req.body as {
        name?: string | null;
        phone?: string | null;
        whatsapp?: string | null;
        email?: string;
        currentPassword?: string;
      };

      const updateData: {
        name?: string | null;
        phone?: string | null;
        whatsapp?: string | null;
        email?: string;
      } = {};

      if (body.name !== undefined) {
        updateData.name = body.name === '' ? null : body.name;
      }
      if (body.phone !== undefined) {
        updateData.phone = body.phone === '' ? null : body.phone;
      }
      if (body.whatsapp !== undefined) {
        updateData.whatsapp = body.whatsapp === '' ? null : body.whatsapp;
      }

      let newEmail: string | undefined;
      if (body.email !== undefined) {
        newEmail = normalizeEmail(body.email);
        const currentNorm = normalizeEmail(user.email);
        if (newEmail !== currentNorm) {
          if (!body.currentPassword) {
            return res.status(400).json({
              error: 'Current password is required to change email',
            });
          }
          const ok = await comparePassword(body.currentPassword, user.passwordHash);
          if (!ok) {
            return res.status(401).json({ error: 'Current password is incorrect' });
          }

          const takenByUser = await prisma.user.findUnique({
            where: { email: newEmail },
            select: { id: true },
          });
          if (takenByUser && takenByUser.id !== user.id) {
            return res.status(409).json({ error: 'Email is already registered to another account' });
          }

          const orgWithEmail = await prisma.organization.findUnique({
            where: { email: newEmail },
            select: { id: true },
          });
          if (orgWithEmail && orgWithEmail.id !== user.organizationId) {
            return res.status(409).json({
              error: 'This email is already used by another organization',
            });
          }

          updateData.email = newEmail;
        }
      }

      if (
        updateData.name === undefined &&
        updateData.phone === undefined &&
        updateData.whatsapp === undefined &&
        updateData.email === undefined
      ) {
        return res.status(400).json({ error: 'No profile fields to update' });
      }

      await prisma.$transaction(async (tx) => {
        if (updateData.email !== undefined) {
          const oldEmail = user.email;
          const syncOrg =
            user.organization!.email.toLowerCase() === oldEmail.toLowerCase();

          await tx.user.update({
            where: { id: userId },
            data: {
              ...(updateData.name !== undefined ? { name: updateData.name } : {}),
              ...(updateData.phone !== undefined ? { phone: updateData.phone } : {}),
              ...(updateData.whatsapp !== undefined ? { whatsapp: updateData.whatsapp } : {}),
              email: updateData.email,
            },
          });

          if (syncOrg) {
            await tx.organization.update({
              where: { id: user.organizationId },
              data: { email: updateData.email },
            });
          }
        } else {
          await tx.user.update({
            where: { id: userId },
            data: {
              ...(updateData.name !== undefined ? { name: updateData.name } : {}),
              ...(updateData.phone !== undefined ? { phone: updateData.phone } : {}),
              ...(updateData.whatsapp !== undefined ? { whatsapp: updateData.whatsapp } : {}),
            },
          });
        }
      });

      const fresh = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          phone: true,
          whatsapp: true,
        },
      });

      res.json({
        message: 'Profile updated successfully',
        profile: fresh,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
