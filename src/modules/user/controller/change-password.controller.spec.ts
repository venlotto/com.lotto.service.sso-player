import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  type Logger,
} from "@nestjs/common";
import { type Request as ExpressRequest } from "express";
import { type ChangePasswordDto } from "../dto/change-password.dto";
import { type UserService } from "../services/user.service";
import { ChangePasswordController } from "./change-password.controller";

const CURRENT_PIN = "CurrentPass123!";
const UPDATED_PIN = "NewPass123!";
const CHANGE_OTHER_PERM =
  "com.lotto.service.sso-internal:user:change-other-users-password";

type AuthenticatedRequest = ExpressRequest & {
  user: { permissions?: string[]; sub: string };
};

const mockUserService = {
  changePassword: jest.fn(),
};

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
};

const controller = (): ChangePasswordController =>
  new ChangePasswordController(
    mockUserService as unknown as UserService,
    mockLogger as unknown as Logger,
  );

const buildReq = (
  sub: string,
  permissions: string[] = [],
): AuthenticatedRequest =>
  ({ user: { permissions, sub } }) as unknown as AuthenticatedRequest;

describe("ChangePasswordController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("changePassword", () => {
    describe("admin flow", () => {
      const adminReq = (): AuthenticatedRequest =>
        buildReq("admin-1", [CHANGE_OTHER_PERM]);
      const adminDto = {
        user_id: "target-user-1",
        new_password: UPDATED_PIN,
      } as ChangePasswordDto;

      it("changes another user's password and returns 200", async (): Promise<void> => {
        mockUserService.changePassword.mockResolvedValue(undefined);

        const result = await controller().changePassword(adminReq(), adminDto, "corr-1");

        expect(mockUserService.changePassword).toHaveBeenCalledWith(
          "target-user-1",
          null,
          UPDATED_PIN,
          "corr-1",
        );
        expect(result).toMatchObject({ status_code: 200 });
      });

      it("maps a service failure to InternalServerErrorException", async (): Promise<void> => {
        mockUserService.changePassword.mockRejectedValue(new Error("store down"));

        await expect(
          controller().changePassword(adminReq(), adminDto, "corr-2"),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });

    describe("own password flow", () => {
      it("throws BadRequestException when current_password is missing", async (): Promise<void> => {
        const dto = { new_password: UPDATED_PIN } as ChangePasswordDto;

        await expect(
          controller().changePassword(buildReq("user-1"), dto, "corr-3"),
        ).rejects.toThrow(BadRequestException);
        expect(mockUserService.changePassword).not.toHaveBeenCalled();
      });

      it("changes the password and returns 200 when current_password matches", async (): Promise<void> => {
        mockUserService.changePassword.mockResolvedValue(undefined);
        const dto = {
          current_password: CURRENT_PIN,
          new_password: UPDATED_PIN,
        } as ChangePasswordDto;

        const result = await controller().changePassword(
          buildReq("user-1"),
          dto,
          "corr-4",
        );

        expect(mockUserService.changePassword).toHaveBeenCalledWith(
          "user-1",
          CURRENT_PIN,
          UPDATED_PIN,
          "corr-4",
        );
        expect(result).toMatchObject({ status_code: 200 });
      });

      it("maps an incorrect current password to UnauthorizedException", async (): Promise<void> => {
        mockUserService.changePassword.mockRejectedValue(
          new UnauthorizedException("Current password is incorrect"),
        );
        const dto = {
          current_password: CURRENT_PIN,
          new_password: UPDATED_PIN,
        } as ChangePasswordDto;

        await expect(
          controller().changePassword(buildReq("user-1"), dto, "corr-5"),
        ).rejects.toThrow(UnauthorizedException);
      });
    });
  });
});
