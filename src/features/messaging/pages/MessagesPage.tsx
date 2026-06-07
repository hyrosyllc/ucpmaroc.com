import React, { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import {
  useParams,
  useNavigate,
  Link,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ConversationChatBox from "../components/ConversationChatBox";
import { User } from "@supabase/supabase-js";

interface Conversation {
  id: string;
  created_at: string;
  other_user_name: string;
  other_user_avatar: string;
  other_user_id: string;
  other_user_profile_type: "actor" | "client" | "unknown"; // Added unknown
  last_message_content: string | null;
  last_message_timestamp: string | null;
}

interface OutletContextType {
  role: "actor" | "client" | null;
}

const MessagesPage = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // <-- Get the location
  const outletContext = useOutletContext<OutletContextType | null>();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserProfileType, setCurrentUserProfileType] = useState<
    "client" | "actor" | null
  >(null);
  const [selectedConversation, setSelectedConversation] = useState<
    Conversation | undefined
  >(undefined);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);

      const contextRole = outletContext?.role || "client";
      setCurrentUserProfileType(contextRole);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Navigate to the correct login page based on context
        navigate(contextRole === "actor" ? "/actor-login" : "/client-auth");
        return;
      }
      setCurrentUser(user);

      // 1. Get all conversations (simple query)
      const { data: convos, error } = await supabase
        .from("conversations")
        .select(
          `
                    id,
                    created_at,
                    client_user_id,
                    actor_user_id,
                    last_message_content,
                    last_message_timestamp
                `
        )
        .or(`client_user_id.eq.${user.id},actor_user_id.eq.${user.id}`);

      if (error) {
        console.error("Error fetching conversations:", error);
        setLoading(false);
        return;
      }

      if (!convos || convos.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // 2. Get all the *other* user IDs
      const otherUserIds = convos.map((c) =>
        c.client_user_id === user.id ? c.actor_user_id : c.client_user_id
      );

      // 3. Fetch all actor and client profiles for those IDs
      const { data: actors, error: actorsError } = await supabase
        .from("actors")
        .select("user_id, ActorName, HeadshotURL") //
        .in("user_id", otherUserIds);

      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("user_id, full_name") //
        .in("user_id", otherUserIds);

      if (actorsError || clientsError) {
        console.error("Error fetching profiles:", actorsError, clientsError);
        setLoading(false);
        return;
      }

      // 4. Stitch the data together in a "map"
      const profileMap = new Map();
      if (actors) {
        actors.forEach((p) =>
          profileMap.set(p.user_id, {
            name: p.ActorName,
            avatar: p.HeadshotURL,
            type: "actor",
          })
        );
      }
      if (clients) {
        clients.forEach((p) =>
          profileMap.set(p.user_id, {
            name: p.full_name,
            avatar: null,
            type: "client",
          })
        );
      }

      // 5. Format the final list
      const formattedConvos = convos
        .map((convo: any) => {
          const isClient = convo.client_user_id === user.id;
          const otherUserId = isClient
            ? convo.actor_user_id
            : convo.client_user_id;

          // Handle new clients who might not have a profile row yet
          const otherProfile = profileMap.get(otherUserId);

          if (!otherProfile) {
            // This is the new client bug you found!
            // We'll give them a default name
            console.warn("Could not find profile for user:", otherUserId);
            return {
              id: convo.id,
              created_at: convo.created_at,
              other_user_name: "New Client", // Fallback name
              other_user_avatar: null,
              other_user_id: otherUserId,
              other_user_profile_type: "client", // Assume client
              last_message_content: convo.last_message_content,
              last_message_timestamp: convo.last_message_timestamp,
            };
          }

          return {
            id: convo.id,
            created_at: convo.created_at,
            other_user_name: otherProfile.name,
            other_user_avatar: otherProfile.avatar,
            other_user_id: otherUserId,
            other_user_profile_type: otherProfile.type,
            last_message_content: convo.last_message_content,
            last_message_timestamp: convo.last_message_timestamp,
          };
        })
        .filter((c): c is Conversation => c !== null); // Type guard for filtering

      // 6. Sort by last message (handle nulls safely)
      formattedConvos.sort((a, b) => {
        if (!a || !a.last_message_timestamp) return 1;
        if (!b || !b.last_message_timestamp) return -1;
        return (
          new Date(b.last_message_timestamp).getTime() -
          new Date(a.last_message_timestamp).getTime()
        );
      });

      setConversations(formattedConvos as Conversation[]);
      setLoading(false);
    };
    fetchConversations();
  }, [navigate, outletContext?.role]); // Dependency is correct

  // This useEffect is correct
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const foundConvo = conversations.find((c) => c.id === conversationId);
      setSelectedConversation(foundConvo);
    } else {
      setSelectedConversation(undefined);
    }
  }, [conversationId, conversations]);

  return (
    <div
      className={`
      flex w-full bg-background text-foreground 
      ${
        outletContext?.role === "actor"
          ? "h-full" // Actor: Fit parent (which is handled by ActorDashboardLayout)
          : "h-[calc(100vh-4rem)]" // Client: Full screen MINUS Navbar (assuming h-16/4rem)
      }
      `}
    >
      {/* --- Sidebar (Conversation List) --- */}
      <nav
        className={`
                ${conversationId ? "hidden" : "flex"} 
                w-full md:flex md:w-1/4 md:min-w-[300px] border-r flex-col 
                overflow-y-auto
            `}
      >
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold">Inbox</h2>
        </div>
        <ScrollArea className="h-full">
          {loading ? (
            <p className="p-4 text-muted-foreground">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-muted-foreground">No conversations yet.</p>
          ) : (
            <ul>
              {conversations.map((convo) => {
                // --- THIS IS THE FIX ---
                const basePath =
                  outletContext?.role === "actor"
                    ? "/dashboard/messages"
                    : "/messages";
                // --- END FIX ---

                return (
                  <li key={convo.id}>
                    <Link
                      // --- USE THE 'basePath' VARIABLE ---
                      to={`${basePath}/${convo.id}`}
                      className={`flex items-center gap-4 p-4 hover:bg-muted ${
                        convo.id === conversationId ? "bg-muted" : ""
                      }`}
                    >
                      <Avatar>
                        <AvatarImage
                          src={convo.other_user_avatar}
                          alt={convo.other_user_name}
                        />
                        <AvatarFallback>
                          {convo.other_user_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-grow overflow-hidden">
                        <p className="font-semibold truncate">
                          {convo.other_user_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {convo.last_message_content
                            ? convo.last_message_content
                            : "No messages yet"}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </nav>

      {/* --- Main Chat Area --- */}
      <main
        className={`
                ${conversationId ? "flex" : "hidden"} 
                md:flex flex-grow flex-col
            `}
      >
        {conversationId &&
        currentUser &&
        selectedConversation &&
        currentUserProfileType ? (
          <ConversationChatBox
            conversationId={conversationId}
            currentUserId={currentUser.id}
            otherUserName={selectedConversation.other_user_name}
            otherUserAvatar={selectedConversation.other_user_avatar}
            otherUser_AuthId={selectedConversation.other_user_id}
            currentUserProfileType={currentUserProfileType}
          />
        ) : (
          <div className="hidden md:flex flex-grow justify-center items-center">
            <p className="text-lg text-muted-foreground">
              Select a conversation to start chatting.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MessagesPage;
