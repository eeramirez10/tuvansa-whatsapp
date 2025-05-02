import { compareSync, hashSync } from "bcryptjs";

export class BcryptAdapter {

  static hash(password: string): string {
    return hashSync(password)
  }

  static compare(pasword: string, hashed: string): boolean {
    return compareSync(pasword, hashed)
  }
}