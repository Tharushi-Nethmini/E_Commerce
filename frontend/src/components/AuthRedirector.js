// This component will redirect any unauthenticated user to the login page on first visit
"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthRedirector({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // If not logged in and not already on /login, redirect
      if (!user && pathname !== "/login") {
        if (typeof window !== "undefined") {
          window.location.href = "http://localhost:3000/login";
        }
      }
    }
  }, [user, loading, pathname]);

  return children;
}
