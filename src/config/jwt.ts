import * as jwt from 'jsonwebtoken';
import { envs } from './envs';


const SEED = envs.JWT_SEED

export class JwtAdapter {

  static async generateToken(payload: object, duration: string = '2h'): Promise<string | null> {

    return new Promise((resolve) => {

      jwt.sign(payload, SEED!, { expiresIn: duration as unknown as number }, (err, token) => {
        console.log(err)

        if (err) return resolve(null)
        resolve(token!)
      })
    })

  }

  static async validateToken<T>(token: string): Promise<T | null> {
    return new Promise((resolve) => {
      jwt.verify(token, SEED!, (err, decoded) => {
        if (err) return resolve(null);
        resolve(decoded as T);
      });
    })
  }
}