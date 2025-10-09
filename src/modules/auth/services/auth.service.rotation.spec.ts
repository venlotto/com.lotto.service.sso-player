import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

import { AuthService } from './auth.service';
import { RefreshTokenRepository } from '../repository/refresh-token.repository';

describe('AuthService - Token Rotation', () => {
  let service: AuthService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUserRepository = {
    findByUsername: jest.fn(),
    findById: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findByToken: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    markRotated: jest.fn(),
    deleteByUserId: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        SESSION_COOKIE_NAME: 'plus_session',
        COOKIE_DOMAIN: '.plus.bingo',
        COOKIE_SECURE: 'true',
        COOKIE_SAMESITE: 'lax',
        COOKIE_PATH: '/',
        REFRESH_TOKEN_ROTATION_ENABLED: 'true',
        REDIRECT_WHITELIST: 'https://plus.bingo',
        REFRESH_TOKEN_EXPIRES: '2592000',
        JWT_EXPIRATION: '5m',
      };
      return config[key];
    }),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: RefreshTokenRepository,
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with family ID', async (): Promise<void> => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        roles: ['user'],
        permissions: [],
      };

      const familyId = 'family-123';

      const result = await service.generateRefreshToken(payload, { familyId });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('tokenId');
      expect(result).toHaveProperty('familyId', familyId);
      expect(result).toHaveProperty('expiresAt');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should generate a new family ID when not provided', async (): Promise<void> => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        roles: ['user'],
        permissions: [],
      };

      const result = await service.generateRefreshToken(payload);

      expect(result).toHaveProperty('familyId');
      expect(result.familyId).toBeTruthy();
      expect(typeof result.familyId).toBe('string');
    });

    it('should include session context when provided', async (): Promise<void> => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        roles: ['user'],
        permissions: [],
      };

      const context = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = await service.generateRefreshToken(payload, { context });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('tokenId');
    });

    it('should set expiration date based on config', async (): Promise<void> => {
      const payload = {
        sub: 'user-123',
        username: 'testuser',
        roles: ['user'],
        permissions: [],
      };

      const result = await service.generateRefreshToken(payload);

      const now = new Date();
      const expectedExpiration = new Date(
        now.getTime() + 2592000 * 1000, // 30 days in seconds
      );

      expect(result.expiresAt.getTime()).toBeGreaterThan(now.getTime());
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(
        expectedExpiration.getTime() + 1000,
      );
    });
  });

  describe('extractRefreshToken', () => {
    it('should extract token from cookie when present', (): void => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockRequest = {
        cookies: { plus_session: 'cookie-token-123' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = service.extractRefreshToken(mockRequest);

      expect(result).toBe('cookie-token-123');
    });

    it('should extract token from signedCookies when present', (): void => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockRequest = {
        cookies: {},
        signedCookies: { plus_session: 'signed-token-456' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = service.extractRefreshToken(mockRequest);

      expect(result).toBe('signed-token-456');
    });

    it('should prefer regular cookies over signedCookies', (): void => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockRequest = {
        cookies: { plus_session: 'cookie-token-123' },
        signedCookies: { plus_session: 'signed-token-456' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = service.extractRefreshToken(mockRequest);

      expect(result).toBe('cookie-token-123');
    });

    it('should return fallback when provided', (): void => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockRequest = {
        cookies: { plus_session: 'cookie-token-123' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = service.extractRefreshToken(
        mockRequest,
        'fallback-token',
      );

      expect(result).toBe('fallback-token');
    });

    it('should return null when no token is present', (): void => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockRequest = {
        cookies: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = service.extractRefreshToken(mockRequest);

      expect(result).toBeNull();
    });
  });
});
