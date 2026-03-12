import { NextFunction, Request, Response } from 'express';
import { JwtAdapter } from '../../config/jwt';
import { PrismaClient } from '@prisma/client';


const prismaClient = new PrismaClient()

export class AuthMiddleware {



  static validateJWT = async (req: Request, res: Response, next: NextFunction) => {

    const authorization = req.header('Authorization');
    if (!authorization) {
      res.status(401).json({ error: 'No token provided' });
      return
    }
  
    if (!authorization.startsWith('Bearer ')) {

      res.status(401).json({ error: 'Invalid Bearer token' });
      return
    }

    const token = authorization.split(' ').at(1) || '';

    if (!token) {
      res.status(401).json({ error: 'No token provided' });

      return
    }

    try {

      // todo:
      const payload = await JwtAdapter.validateToken<{ id: string }>(token);

      if (!payload) {
        res.status(401).json({ error: 'Invalid token' });
        return
      }

      const user = await prismaClient.user.findFirst({
        where: {
          id: payload.id
        },
        include: {
          branch: true,
          branchAssignments: {
            include: {
              branch: true
            }
          }
        }
      })


      if (!user) {
        res.status(401).json({ error: 'Invalid token - user not found' })
        return
      }


      const allBranchIds = [
        `${user.branchId ?? ''}`.trim(),
        ...user.branchAssignments.map((item) => `${item.branchId ?? ''}`.trim())
      ].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index)
      const branchIds = user.role === 'BRANCH_MANAGER'
        ? allBranchIds
        : allBranchIds.length > 0 ? [allBranchIds[0]] : []

      req.body.user = {
        ...user,
        branchIds
      };


      next();
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
    }




  }


}
