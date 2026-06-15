// In src/components/ChatBox.tsx

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { Send, Mic } from 'lucide-react';
import VoiceNoteRecorder from '@/components/VoiceNoteRecorder';

// --- shadcn/ui Imports ---
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
// ---
import emailjs from '@emailjs/browser'; // --- ADD THIS IMPORT ---


interface Message {
  id: string;
  created_at: string;
  sender_role: 'client' | 'actor';
  content: string;
}

interface ChatBoxProps {
  orderId: string;
  userRole: 'client' | 'actor';
  orderData: {
    last_message_sender_role: 'client' | 'actor' | null;
    client_email: string;
    client_name: string;
    actor_email: string;
    actor_name: string;
    order_id_string: string;
  };
    conversationId: string;
    currentUserId: string;
    otherUserName: string;

}

const ChatBox: React.FC<ChatBoxProps> = ({ orderId, userRole, orderData }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // --- THIS IS THE FIX ---
    // We use a ref for an empty div at the end of the message list
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // This function scrolls the messagesEndRef into view
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    // --- END FIX ---

    // Fetch initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('order_messages')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: true });
            
            if (error) console.error("Error fetching messages:", error);
            else setMessages(data || []);
        };
        fetchMessages();
    }, [orderId]);

    // Real-time subscription
    useEffect(() => {
        const channel = supabase.channel(`order-messages-for-${orderId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${orderId}` },
                (payload) => {
                    setMessages(currentMessages => [...currentMessages, payload.new as Message]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orderId]);
    
    // Scroll to bottom when new messages arrive
    useEffect(() => {
        // Give a slight delay for the new message to render
        setTimeout(scrollToBottom, 100);
    }, [messages]);

    // --- NEW: Reusable function for notification logic ---
    const handleNewMessageVolley = async () => {
        const recipientRole = userRole === 'client' ? 'actor' : 'client';
        const recipientUnreadColumn = recipientRole === 'actor' 
            ? 'actor_has_unread_messages' 
            : 'client_has_unread_messages';

        // compute a timestamp 5 minutes from now (ISO string suitable for timestamptz)
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        // 1. Update the order table
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                last_message_sender_role: userRole,
                [recipientUnreadColumn]: true, // Set recipient's flag to true
                notification_due_at: fiveMinutesFromNow // Schedule the notification
            })
            .eq('id', orderId)
        
        if (updateError) {
            console.error("Error setting unread status and due time:", updateError);
        }
    };
    // --- END NEW FUNCTION ---

    // --- REPLACE handleSendMessage ---
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setIsLoading(true);
        const contentToSend = newMessage.trim();
        setNewMessage('');

        try {
            // 1. Check for new volley
            if (orderData.last_message_sender_role !== userRole) {
                await handleNewMessageVolley();
                // Update local prop to prevent multiple notifications
                // if user sends messages rapidly before parent can refresh
                orderData.last_message_sender_role = userRole; 
            }

            // 2. Insert the message
            const { error: msgError } = await supabase
                .from('order_messages')
                .insert({
                    order_id: orderId,
                    sender_role: userRole,
                    content: contentToSend,
                });
            
            if (msgError) throw msgError;

        } catch (error) {
            console.error("Error sending message:", error);
            // Optionally set an error message to display to the user
        } finally {
            setIsLoading(false);
        }
    };
    // --- END REPLACE ---

    // --- REPLACE handleSendVoiceNote ---
    const handleSendVoiceNote = async (audioFile: File) => {
        setIsLoading(true);
        setIsRecording(false);
        try {
            // 1. Upload file
            const fileExt = audioFile.name.split('.').pop() || 'webm';
            const filePath = `${orderId}/${userRole}-${Date.now()}.${fileExt}`;
            await supabase.storage.from('voice-notes').upload(filePath, audioFile);
            
            const { data: urlData } = supabase.storage.from('voice-notes').getPublicUrl(filePath);
            if (!urlData) throw new Error("Could not get public URL for voice note.");
            
            const contentToSend = `[VOICE_NOTE]:${urlData.publicUrl}`;

            // 2. Check for new volley
            if (orderData.last_message_sender_role !== userRole) {
                await handleNewMessageVolley();
                orderData.last_message_sender_role = userRole; // Update local copy
            }

            // 3. Insert the message
            await supabase
                .from('order_messages')
                .insert({
                    order_id: orderId,
                    sender_role: userRole,
                    content: contentToSend
                });

        } catch (error) {
            console.error("Error sending voice note:", error);
        } finally {
            setIsLoading(false);
        }
    };
    // --- END REPLACE ---

    return (
        <div className="flex flex-col h-[450px]">
            {/* ScrollArea wraps the message list */}
            <ScrollArea className="flex-grow p-4">
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_role === userRole ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-lg px-4 py-2 max-w-[80%]
                                ${msg.sender_role === userRole 
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {msg.content.startsWith('[VOICE_NOTE]:') ? (
                                <audio
                                    controls
                                    src={msg.content.replace('[VOICE_NOTE]:', '')}
                                    className="h-10 w-full min-w-[200px]" // <-- THIS IS THE FIX
                                />
                            ) : (
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                                <p className={`text-xs text-right mt-1 ${msg.sender_role === userRole ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                                  {new Date(msg.created_at).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    {/* This empty div is our scroll target */}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
            
            {/* Conditional Input Area (no changes needed) */}
            {isRecording ? (
                <VoiceNoteRecorder 
                    onSend={handleSendVoiceNote} 
                    onCancel={() => setIsRecording(false)} 
                />
            ) : (
                <div className="flex-shrink-0 p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isLoading}
                        />
                        <Button 
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsRecording(true)}
                            disabled={isLoading}
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                        <Button 
                            type="submit"
                            size="icon"
                            disabled={isLoading || !newMessage.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatBox;