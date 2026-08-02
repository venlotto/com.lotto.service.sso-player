import { Test, type TestingModule } from "@nestjs/testing";
import { AuthModule } from "../auth/auth.module";
import { BootstrapService } from "../auth/services/bootstrap.service";
import { RoleService } from "../auth/services/role.service";
import { UserService } from "./services/user.service";
import { UserModule } from "./user.module";

// Guards the auth/user module-cycle break: AuthModule.forRoot() is global, so
// UserModule resolves RoleService (and the auth guards) without importing
// AuthModule, while AuthModule still resolves UserService via UserModule.
describe("AuthModule/UserModule DI graph", () => {
  let moduleRef: TestingModule;

  beforeAll(async (): Promise<void> => {
    process.env["JWT_SECRET"] = process.env["JWT_SECRET"] ?? "di-graph-test-secret";
    process.env["DATABASE_URL"] =
      process.env["DATABASE_URL"] ??
      "postgresql://postgres:postgres@localhost:5432/app";

    moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ isTestEnvironment: true }), UserModule],
    }).compile();
  });

  afterAll(async (): Promise<void> => {
    await moduleRef.close();
  });

  it("resolves UserService with its RoleService dependency", (): void => {
    const userService = moduleRef.get<UserService>(UserService);
    expect(userService).toBeInstanceOf(UserService);
  });

  it("resolves RoleService globally without UserModule importing AuthModule", (): void => {
    const roleService = moduleRef.get<RoleService>(RoleService);
    expect(roleService).toBeInstanceOf(RoleService);
  });

  it("resolves BootstrapService whose factory injects UserService", (): void => {
    const bootstrapService = moduleRef.get<BootstrapService>(BootstrapService);
    expect(bootstrapService).toBeInstanceOf(BootstrapService);
  });
});
