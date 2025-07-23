import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function useAuth() {
  const [, navigate] = useLocation();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Функция для выхода из системы
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Обновляем состояние авторизации
      await refetch();
      // Перенаправляем на страницу входа
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Функция для входа в систему
  const login = async (username, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      // Обновляем состояние авторизации
      await refetch();
      // Перенаправляем на главную страницу
      navigate("/");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  return {
    admin: data?.admin,
    isLoading,
    error,
    login,
    logout,
    refetch,
  };
}