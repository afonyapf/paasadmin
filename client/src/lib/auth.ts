import type { Admin } from "@shared/schema";

export function getStoredAdmin(): Admin | null {
  try {
    const stored = localStorage.getItem("admin");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setStoredAdmin(admin: Admin | null) {
  if (admin) {
    localStorage.setItem("admin", JSON.stringify(admin));
  } else {
    localStorage.removeItem("admin");
  }
}
