// In src/pages/AdminClientListPage.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import {
  ArrowLeft,
  Users,
  ArrowRight,
  UserRound,
  Building,
} from "lucide-react"; // Added new icons

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// ---

// Interface (Unchanged)
interface ClientProfile {
  id: string;
  full_name: string;
  company_name?: string | null;
  user_id: string;
  email: string;
}

const AdminClientListPage: React.FC = () => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // --- (All your data fetching logic is correct) ---
  // The Edge Function call and error handling (lines 42-65) look solid.
  // There are no obvious errors in your 'invoke' call.
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(""); // --- Check Admin Role (This part is correct) ---

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
    } // --- End Admin Role Check --- // --- THIS IS THE NEW, SIMPLER QUERY --- // No more Edge Function!
    const { data, error: fetchError } = await supabase
      .from("clients")
      .select("id, full_name, company_name, user_id, email") // We can just select email now!
      .order("full_name", { ascending: true });

    if (fetchError) {
      setError(`Error fetching clients: ${fetchError.message}`);
      console.error(fetchError);
      setClients([]);
    } else {
      setClients(data as ClientProfile[]);
    }
    setLoading(false);
  }, [navigate]); // --- END REPLACEMENT ---
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        Loading Clients...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 text-foreground">
                 {" "}
      <div className="max-w-7xl mx-auto">
                       
        {error && (
          <p className="mb-4 p-3 bg-destructive/10 border border-destructive/50 rounded-md text-sm text-destructive">
            {error}
          </p>
        )}
                        {/* --- 2. RESTYLED CARD & TABLE --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users /> Manage Clients
            </CardTitle>
            <CardDescription>
              A list of all client accounts on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
                           {" "}
            <div className="overflow-x-auto">
                                 {" "}
              <Table className="min-w-[700px]">
                                       {" "}
                <TableHeader>
                                             {" "}
                  <TableRow>
                                                    <TableHead>Name</TableHead> 
                                                  <TableHead>Company</TableHead>
                                                    <TableHead>Email</TableHead>
                                                   {" "}
                    <TableHead className="text-right">Actions</TableHead>       
                                       {" "}
                  </TableRow>
                                         {" "}
                </TableHeader>
                                       {" "}
                <TableBody>
                                             {" "}
                  {clients.map((client) => (
                    <TableRow key={client.id} className="text-sm">
                                                         {" "}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {client.full_name?.charAt(0).toUpperCase() || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {client.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground sm:hidden">
                              {client.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                                                         {" "}
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {client.company_name ? (
                            <>
                              <Building className="h-4 w-4" />
                              {client.company_name}
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </TableCell>
                                                         {" "}
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        {client.email}
                      </TableCell>
                                                         {" "}
                      <TableCell className="text-right">
                        {/* Example action button */}
                        {/* <Button asChild variant="outline" size="sm">
                                          <Link to={`/admin/client/${client.id}/orders`}>
                                              <span className="hidden sm:inline">View Orders</span>
                                              <ArrowRight className="h-4 w-4 sm:hidden" />
                                          </Link>
                                        </Button> */}
                                                           {" "}
                      </TableCell>
                                                     {" "}
                    </TableRow>
                  ))}
                                         {" "}
                </TableBody>
                                   {" "}
              </Table>
                                 {" "}
              {clients.length === 0 && !loading && (
                <p className="text-center text-muted-foreground p-8">
                  No clients found.
                </p>
              )}
                             {" "}
            </div>
          </CardContent>
                         {" "}
        </Card>
                   {" "}
      </div>
             {" "}
    </div>
  );
};

export default AdminClientListPage;
