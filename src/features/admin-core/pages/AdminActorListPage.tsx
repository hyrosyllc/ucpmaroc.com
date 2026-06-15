// In src/pages/AdminActorListPage.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Edit,
  XIcon,
  Check,
  Briefcase,
} from "lucide-react";

interface ActorProfile {
  id: string;
  ActorName: string;
  ActorEmail?: string;
  IsActive?: boolean;
  role?: string;
  created_at: string;
  direct_payment_enabled?: boolean;
  direct_payment_requested?: boolean;
  country?: string; // 🚀 ADDED
  marketplace_status?: string; // 🚀 ADDED
  is_p2p_enabled?: boolean;
}

const AdminActorListPage: React.FC = () => {
  const [actors, setActors] = useState<ActorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const fetchActors = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/actor-login");
      return;
    }

    const { data: profile } = await supabase
      .from("actors")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (profile?.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    // 🚀 UPDATED QUERY to fetch country and marketplace_status
    const { data, error: fetchError } = await supabase
      .from("actors")
      .select(
        'id, ActorName, ActorEmail, "IsActive", role, created_at, direct_payment_enabled, direct_payment_requested, country, marketplace_status, is_p2p_enabled'
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(`Error fetching actors: ${fetchError.message}`);
    } else {
      setActors(data as ActorProfile[]);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchActors();
  }, [fetchActors]);

  // --- The Nuclear Button (Unchanged) ---
  const handleToggleActiveStatus = async (
    actorId: string,
    currentStatus: boolean | undefined
  ) => {
    setMessage("");
    setError("");
    const newStatus = !currentStatus;
    const originalActors = [...actors];

    setActors((prevActors) =>
      prevActors.map((actor) =>
        actor.id === actorId ? { ...actor, IsActive: newStatus } : actor
      )
    );

    try {
      const { data: responseData, error: functionError } =
        await supabase.functions.invoke("toggle-actor-status", {
          body: { actorId, newStatus },
        });

      if (functionError) throw functionError;
      if (responseData && responseData.error)
        throw new Error(responseData.error);
      if (!responseData || !responseData.success)
        throw new Error("Function did not report success.");

      setMessage(
        `Actor ${
          responseData.isActive ? "activated" : "deactivated"
        } successfully.`
      );
    } catch (error) {
      const err = error as Error;
      setError(`Failed to update status: ${err.message}`);
      setActors(originalActors);
    }
  };

  // --- 🚀 NEW: Marketplace Approval Handlers ---
  const handleApproveMarketplace = async (actorId: string) => {
    setMessage("");
    setError("");
    const originalActors = [...actors];

    // Optimistic UI update
    setActors((prev) =>
      prev.map((a) =>
        a.id === actorId
          ? { ...a, marketplace_status: "approved", is_p2p_enabled: true }
          : a
      )
    );

    try {
      // Update BOTH the new status and the legacy p2p flag for safety
      const { error } = await supabase
        .from("actors")
        .update({ marketplace_status: "approved", is_p2p_enabled: true })
        .eq("id", actorId);

      if (error) throw error;
      setMessage(`Marketplace application approved.`);
    } catch (error) {
      const err = error as Error;
      setError(`Failed to approve marketplace: ${err.message}`);
      setActors(originalActors);
    }
  };

  const handleRejectMarketplace = async (actorId: string) => {
    setMessage("");
    setError("");
    const originalActors = [...actors];

    setActors((prev) =>
      prev.map((a) =>
        a.id === actorId ? { ...a, marketplace_status: "rejected" } : a
      )
    );

    try {
      const { error } = await supabase
        .from("actors")
        .update({ marketplace_status: "rejected" })
        .eq("id", actorId);

      if (error) throw error;
      setMessage(`Marketplace application rejected.`);
    } catch (error) {
      const err = error as Error;
      setError(`Failed to reject marketplace: ${err.message}`);
      setActors(originalActors);
    }
  };

  // --- Direct Payment Handlers (Unchanged) ---
  const handleApproveRequest = async (actorId: string) => {
    setMessage("");
    setError("");
    const originalActors = [...actors];
    setActors((prev) =>
      prev.map((a) =>
        a.id === actorId
          ? {
              ...a,
              direct_payment_enabled: true,
              direct_payment_requested: false,
            }
          : a
      )
    );
    try {
      const { error } = await supabase
        .from("actors")
        .update({
          direct_payment_enabled: true,
          direct_payment_requested: false,
        })
        .eq("id", actorId);
      if (error) throw error;
      setMessage(`Direct payment approved for actor.`);
    } catch (error) {
      const err = error as Error;
      setError(`Failed to approve request: ${err.message}`);
      setActors(originalActors);
    }
  };

  const handleRejectRequest = async (actorId: string) => {
    setMessage("");
    setError("");
    const originalActors = [...actors];
    setActors((prev) =>
      prev.map((a) =>
        a.id === actorId ? { ...a, direct_payment_requested: false } : a
      )
    );
    try {
      const { error } = await supabase
        .from("actors")
        .update({ direct_payment_requested: false })
        .eq("id", actorId);
      if (error) throw error;
      setMessage(`Direct payment request rejected.`);
    } catch (error) {
      const err = error as Error;
      setError(`Failed to reject request: ${err.message}`);
      setActors(originalActors);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        Loading Actors...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
      <div className="max-w-screen-2xl mx-auto">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Admin Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Users /> Manage Actors
        </h1>

        {error && (
          <p className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-sm text-red-300">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-md text-sm text-green-300">
            {message}
          </p>
        )}

        <div className="bg-card rounded-lg border overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-700 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4">Name / Country</th>
                <th className="p-4">Role</th>
                <th className="p-4">Agency Application</th>
                <th className="p-4">Direct Pay</th>
                <th className="p-4">Public Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {actors.map((actor) => (
                <tr
                  key={actor.id}
                  className="border-b hover:bg-accent/50 text-sm"
                >
                  <td className="p-4">
                    <div className="font-semibold">{actor.ActorName}</div>
                    <div className="text-xs text-muted-foreground">
                      {actor.country || "Unknown"} • {actor.ActorEmail}
                    </div>
                  </td>

                  <td className="p-4 capitalize">
                    {actor.role === "admin" ? (
                      <span className="flex items-center gap-1.5 text-yellow-400">
                        <ShieldCheck size={14} /> Admin
                      </span>
                    ) : (
                      "Actor"
                    )}
                  </td>

                  {/* 🚀 NEW Marketplace Cell */}
                  <td className="p-4 text-xs font-semibold">
                    {actor.marketplace_status === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-1 rounded">
                        <Briefcase size={12} /> Approved
                      </span>
                    ) : actor.marketplace_status === "pending" ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                        <Briefcase size={12} /> Pending
                      </span>
                    ) : actor.marketplace_status === "rejected" ? (
                      <span className="text-red-400">Rejected</span>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>

                  <td className="p-4 text-xs font-semibold">
                    {actor.direct_payment_enabled ? (
                      <span className="text-green-400">Enabled</span>
                    ) : actor.direct_payment_requested ? (
                      <span className="text-yellow-400">Pending Req.</span>
                    ) : (
                      <span className="text-slate-500">Disabled</span>
                    )}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        actor.IsActive
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {actor.IsActive ? "Active" : "Shadowbanned"}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap space-x-2">
                    {/* Marketplace Approval Actions */}
                    {actor.marketplace_status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApproveMarketplace(actor.id)}
                          className="text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                        >
                          <Check size={12} /> Approve Agency
                        </button>
                        <button
                          onClick={() => handleRejectMarketplace(actor.id)}
                          className="text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 border border-slate-500/30"
                        >
                          <XIcon size={12} /> Reject
                        </button>
                      </>
                    )}

                    {/* Direct Payment Approval Actions */}
                    {actor.direct_payment_requested &&
                      actor.marketplace_status === "approved" && (
                        <>
                          <button
                            onClick={() => handleApproveRequest(actor.id)}
                            className="text-xs font-semibold px-2 py-1 rounded inline-flex items-center gap-1 bg-green-600/50 text-green-300 hover:bg-green-600/70"
                          >
                            <Check size={12} /> Approve Pay
                          </button>
                          <button
                            onClick={() => handleRejectRequest(actor.id)}
                            className="text-xs font-semibold px-2 py-1 rounded inline-flex items-center gap-1 bg-red-600/50 text-red-300 hover:bg-red-600/70"
                          >
                            <XIcon size={12} /> Reject Pay
                          </button>
                        </>
                      )}

                    {/* Activate/Deactivate Button */}
                    {!actor.direct_payment_requested &&
                      actor.marketplace_status !== "pending" && (
                        <>
                          <button
                            className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed mr-3"
                            title="Edit Actor (Not Implemented)"
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button
                            onClick={() =>
                              handleToggleActiveStatus(actor.id, actor.IsActive)
                            }
                            className={`text-xs font-semibold px-2 py-1 rounded inline-flex items-center gap-1 transition-colors ${
                              actor.IsActive
                                ? "bg-yellow-600/50 text-yellow-300 hover:bg-yellow-600/70"
                                : "bg-green-600/50 text-green-300 hover:bg-green-600/70"
                            }`}
                          >
                            {actor.IsActive ? (
                              <ToggleLeft size={12} />
                            ) : (
                              <ToggleRight size={12} />
                            )}
                            {actor.IsActive ? "Deactivate" : "Activate"}
                          </button>
                        </>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {actors.length === 0 && !loading && (
            <p className="text-center text-slate-500 p-8">No actors found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActorListPage;
