# Messaging Feature

## Responsibility

Messaging is a collection of communication surfaces for talent orders, direct actor/client conversations, storefront visitors, and the admin AI copilot. These are separate data models and lifecycles; do not assume they share a message table or a common conversation service.

## Surfaces and Models

| Surface | Entry point | Data model | Behavior |
| --- | --- | --- | --- |
| Direct profile conversations | `/messages`, `/messages/:conversationId` via `MessagesPage` | `conversations`, `messages` | Lists actor/client conversations; `ConversationChatBox` loads and subscribes to messages |
| Talent order chat | `ChatBox`, embedded in order details and `FloatingCommunicationDock` | `orders`, `order_messages`, `voice-notes` Storage bucket | Order-scoped chat, voice-note uploads, unread flags and deferred notifications |
| Storefront visitor inbox | `/dashboard/store-inbox` via `StoreInboxPage`; visitor UI in ecommerce `StorefrontChatWidget` | `store_conversations`, `store_messages` | Visitor-session chat, Realtime inbox and owner takeover from AI |
| Admin AI copilot | Global `AdminChatSheet` mounted in `src/App.tsx` | `admin_ai_sessions`, `admin_ai_messages`; `admin-chat` Edge Function | Admin-only assistant sessions, code copy and optional browser speech APIs |

## Direct Conversations

`MessagesPage` derives the role from the nearest actor/client outlet context (defaults to client outside that layout), redirects unauthenticated users to the corresponding login, reads conversations where the user is either `client_user_id` or `actor_user_id`, then joins actor/client profiles client-side for display. Selecting a conversation changes the route parameter. `ConversationChatBox` reads `messages` ordered by `created_at`, subscribes to INSERT events filtered by `conversation_id`, and inserts outgoing text directly.

Actor users can send structured `[PENDING_OFFER]:...` messages. Accepting an offer calls the `accept_chat_offer_and_create_order` RPC and navigates the client to `/order/:orderId`; that moves the workflow into the talent order/payment feature rather than keeping it inside chat.

## Order Communication

`ChatBox` loads `order_messages` for an `order_id`, subscribes to inserts, and can upload voice files to the `voice-notes` bucket. When the sender role changes, it updates the parent `orders` row with unread flags and `notification_due_at`; a database/notification job handles the later notification. `FloatingCommunicationDock` gathers profile conversations, talent orders/deliveries, and store orders for actor quick access; store visitor conversations are routed to the dedicated Store Inbox.

## Storefront Visitor Chat

The visitor-facing `StorefrontChatWidget` is owned by ecommerce but uses messaging infrastructure. It sends visitor/session messages with `createVisitorSupabase` so the `x-visitor-session-id` header is attached. AI/realtime voice actions call `store-ai-bot`, `store-realtime-session`, `store-voice-transcribe`, `store-voice-note`, and `store-voice-agent-transfer` as applicable. `StoreInboxPage` scopes conversations by the actor's portfolios, subscribes to `store_messages`, and changes a replied-to conversation to `agent_requested` so the human takes over.

## Admin AI Copilot

`AdminChatSheet` gates visibility to the support account, persists session/message records, and POSTs to the `admin-chat` function with the current session bearer token and page path. It also uses clipboard and Web Speech APIs; speech synthesis is capability-checked for browsers without a complete implementation.

## Maintenance Notes

- Keep authorization/RLS policies separate for each message table; a conversation participant, order participant, store owner, visitor session, and admin are different principals.
- Keep subscriptions scoped to the relevant conversation/order and remove channels on unmount.
- Do not merge the tables as a cosmetic refactor without migrating unread state, message ownership, storage URLs, bot state, and existing RPCs.
- The communication dock is a router/aggregator, not the source of truth for its child message flows.

## Complete Module File Map

- `src/features/messaging/index.ts`
- `src/features/messaging/components/AdminChatSheet.tsx`
- `src/features/messaging/components/ChatBox.tsx`
- `src/features/messaging/components/ConversationChatBox.tsx`
- `src/features/messaging/components/FloatingCommunicationDock.tsx`
- `src/features/messaging/pages/MessagesPage.tsx`