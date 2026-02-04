"use client";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProtectedRoute(Component: React.ComponentType) {
  return function WrappedComponent(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push("/login");
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary">
          <div className="text-white text-lg animate-pulse">Carregando...</div>
        </div>
      );
    }

    if (!user) return null;

    return <Component {...props} />;
  };
}
