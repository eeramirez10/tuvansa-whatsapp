import { $Enums } from "@prisma/client";
import { Validators } from "../../../config/validators";

interface Options {
  userId: string;
  name: string;
  lastname: string;
  username: string;
  email: string;
  phone?: string | null;
  role: $Enums.UserRole;
  branchId?: string;
  branchIds: string[];
  isActive: boolean;
  allowWhatsappAssistant: boolean;
  password?: string;
}

export class UpdateUserDto {
  public readonly userId: string;
  public readonly name: string;
  public readonly lastname: string;
  public readonly username: string;
  public readonly email: string;
  public readonly phone: string | null;
  public readonly role: $Enums.UserRole;
  public readonly branchId?: string;
  public readonly branchIds: string[];
  public readonly isActive: boolean;
  public readonly allowWhatsappAssistant: boolean;
  public readonly password?: string;

  constructor(options: Options) {
    this.userId = options.userId;
    this.name = options.name;
    this.lastname = options.lastname;
    this.username = options.username;
    this.email = options.email;
    this.phone = options.phone ?? null;
    this.role = options.role;
    this.branchIds = options.branchIds;
    this.branchId = options.branchIds[0];
    this.isActive = options.isActive;
    this.allowWhatsappAssistant = options.allowWhatsappAssistant;
    this.password = options.password;
  }

  static execute(options: Record<string, unknown>): [string?, UpdateUserDto?] {
    const userId = `${options.userId ?? ""}`.trim();
    const name = `${options.name ?? ""}`.trim();
    const lastname = `${options.lastname ?? ""}`.trim();
    const username = `${options.username ?? ""}`.trim();
    const email = `${options.email ?? ""}`.trim();
    const phoneRaw = options.phone;
    const phone = `${phoneRaw ?? ""}`.trim();
    const role = `${options.role ?? "USER"}` as $Enums.UserRole;
    const branchId = `${options.branchId ?? ""}`.trim();
    const branchIdsRaw = Array.isArray(options.branchIds) ? options.branchIds : [];
    const branchIds = [...new Set(branchIdsRaw.map((value) => `${value ?? ""}`.trim()).filter(Boolean))];
    if (branchId && !branchIds.includes(branchId)) {
      branchIds.unshift(branchId);
    }
    const isActive = normalizeBoolean(options.isActive, true);
    const allowWhatsappAssistant = normalizeBoolean(options.allowWhatsappAssistant, false);
    const password = `${options.password ?? ""}`.trim();

    if (!userId) return ["Missing userId"];
    if (!name) return ["Missing name"];
    if (!lastname) return ["Missing lastname"];
    if (!username) return ["Missing username"];
    if (!email) return ["Missing email"];
    if (branchIds.length === 0) return ["Missing branchIds"];
    if (role !== "BRANCH_MANAGER" && branchIds.length > 1) {
      return ["Solo BRANCH_MANAGER puede tener múltiples sucursales"];
    }
    if (!Validators.email.test(email)) return ["Email is not valid"];
    if (password && password.length < 6) return ["Password too short"];

    return [
      undefined,
      new UpdateUserDto({
        userId,
        name,
        lastname,
        username,
        email,
        phone: phone || null,
        role,
        branchId: branchIds[0],
        branchIds,
        isActive,
        allowWhatsappAssistant,
        password: password || undefined
      })
    ];
  }
}

const normalizeBoolean = (value: unknown, defaultValue: boolean): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "si"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  if (typeof value === "number") return value === 1;
  return defaultValue;
};
