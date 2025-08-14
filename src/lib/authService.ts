import { UserDB } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export type UserRole = 'vendor' | 'admin' | 'super_admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  userId: number;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(user: { id: number; email: string; role: UserRole }): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static verifyToken(token: string): AuthToken | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthToken;
    } catch (error) {
      return null;
    }
  }

  static async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = await UserDB.findByEmail(email) as User | undefined;
    
    if (!user || !user.is_active) {
      return null;
    }

    const isValidPassword = await this.verifyPassword(password, (user as any).password_hash);
    if (!isValidPassword) {
      return null;
    }

    const token = this.generateToken(user);
    
    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user as any;
    
    return {
      user: userWithoutPassword,
      token
    };
  }

  static async register(userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: UserRole;
  }): Promise<{ user: User; token: string }> {
    const existingUser = await UserDB.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.hashPassword(userData.password);
    
    const user = await UserDB.create({
      email: userData.email,
      password_hash: hashedPassword,
      full_name: userData.full_name,
      phone: userData.phone,
      role: userData.role || 'vendor'
    }) as User;
    const token = this.generateToken(user);

    return { user, token };
  }

  static getUserFromRequest(request: NextRequest): AuthToken | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    return this.verifyToken(token);
  }
}

// Permission system
export class PermissionService {
  private static roleHierarchy: Record<UserRole, number> = {
    vendor: 1,
    admin: 2,
    super_admin: 3
  };

  static hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    return this.roleHierarchy[userRole] >= this.roleHierarchy[requiredRole];
  }

  static canAccessAdminPanel(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'admin');
  }

  static canManageUsers(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'super_admin');
  }

  static canApproveApplications(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'admin');
  }

  static canViewReports(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'admin');
  }

  static canBulkActions(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'admin');
  }

  static canDeleteApplications(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'super_admin');
  }

  static canViewAuditLogs(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'admin');
  }

  static canManageSettings(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'super_admin');
  }
}

// Middleware helper for API routes
export function withAuth(handler: (request: NextRequest, user: AuthToken) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const user = AuthService.getUserFromRequest(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return handler(request, user);
  };
}

export function withRole(requiredRole: UserRole) {
  return function(handler: (request: NextRequest, user: AuthToken) => Promise<Response>) {
    return withAuth(async (request: NextRequest, user: AuthToken): Promise<Response> => {
      if (!PermissionService.hasPermission(user.role, requiredRole)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }), 
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return handler(request, user);
    });
  };
}