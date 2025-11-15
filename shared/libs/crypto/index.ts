import CryptoJS from "crypto-js";
import { injectable } from "tsyringe";

import { Env } from "../config/index.js";

@injectable()
export class CryptographyService {
  static create() {
    return new CryptographyService();
  }

  encrypt(plainText: string) {
    const key = CryptoJS.enc.Utf8.parse(Env.EncryptionKey);
    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    return encrypted.toString();
  }

  decrypt(encryptedText: string) {
    const key = CryptoJS.enc.Utf8.parse(Env.EncryptionKey);

    const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decryptedBytes.toString(CryptoJS.enc.Utf8);
  }

  encodeBase64<T>(payload: T): string {
    const jsonString = JSON.stringify(payload);
    return Buffer.from(jsonString, "utf8").toString("base64");
  }

  decodeBase64<T>(state: string): T {
    const jsonString = Buffer.from(state, "base64").toString("utf8");
    return JSON.parse(jsonString) as T;
  }
}
