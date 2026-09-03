// src/components/ProtectedRoute.tsx
import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import PlatformLoader from "@/components/PlatformLoader";

interface ProtectedRouteProps {
  allowedRoles: ("actor" | "admin" | "client")[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthorized(false);
        return;
      }

      // Check Actors Table for Actor/Admin roles
      const { data: actorProfile } = await supabase
        .from("actors")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (actorProfile) {
        // Assume default role is 'actor' if column is null, otherwise use the column value
        const userRole = actorProfile.role || "actor";
        setIsAuthorized(allowedRoles.includes(userRole));
        return;
      }

      // Check Clients Table
      const { data: clientProfile } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (clientProfile && allowedRoles.includes("client")) {
        setIsAuthorized(true);
        return;
      }

      setIsAuthorized(false);
    };

    verifyAccess();
  }, [allowedRoles]);

  if (isAuthorized === null) {
    return <PlatformLoader />;
  }

  // If authorized, render the child routes. Otherwise, kick them to home/login.
  return isAuthorized ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
