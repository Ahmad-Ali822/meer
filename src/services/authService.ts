import { invoke } from "@tauri-apps/api/core";

export async function verifyLogin(
  username: string,
  password: string,
): Promise<boolean> {
  return invoke<boolean>("verify_login", { username, password });
}
