// This component will redirect any unauthenticated user to the login page on first visit
"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthRedirector({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const publicPaths = ["/login", "/register"];

  useEffect(() => {
    if (!loading) {
      // Allow unauthenticated access to public pages.
      if (!user && !publicPaths.includes(pathname)) {
        router.replace("/login");
      }
    }
  }, [user, loading, pathname, router]);

  return children;
}
