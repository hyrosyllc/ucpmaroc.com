// In src/components/OrderDetailsModal.tsx

import { supabase } from '@/supabaseClient';
import { X, LinkIcon, Paperclip, CheckCircle, Archive, FileText, Package, Info, MessageSquare, Banknote, RefreshCw, Send, Download, History, Mic, PencilLine, Video } from 'lucide-react';
import { ChatBox } from '@/features/messaging';
import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import DeliverFromLibraryModal from '@/components/DeliverFromLibraryModal';
import AccordionItem from '@/components/AccordionItem';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ServiceDeliveryUploader from '@/components/ServiceDeliveryUploader';
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// --- NOTE: Removed ScrollArea, as we'll scroll the tab content directly ---

// --- Interfaces (Unchanged) ---
interface Order {
  client_email: any;
  actor_id: any;
  id: string;
  order_id_string: string;
  client_name: string;
  status: string;
  script: string;
  final_audio_url?: string;
  actors: {
    ActorName: string;
    ActorEmail?: string;
  };
  service_type: string;
  word_count?: number;
  usage?: string | null;
  quote_est_duration?: string | null;
  quote_video_type?: string | null;
  quote_footage_choice?: string | null;
  deliveries: { id: string; created_at: string; file_url: string; version_number: number }[];
  last_message_sender_role: 'client' | 'actor' | null;
  actor_has_unread_messages: boolean;
  client_has_unread_messages: boolean;
  // --- THIS IS THE FIX (Step 1) ---
  total_price: number | null; // <-- Added this field
  from_chat_offer: boolean;
  material_file_urls: string[] | null; // <-- ADD THIS
  project_notes: string | null;      // <-- ADD THIS
}
interface Offer {
  id: string;
  created_at: string;
  offer_title: string;
  offer_agreement: string | null;
  offer_price: number;
}
interface ModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: () => void;
  onActorConfirmPayment?: (orderId: string, clientEmail: string, clientName: string, orderIdString: string) => Promise<void>;
}
// --- End Interfaces ---

const serviceIcons = {
  voice_over: <Mic className="h-5 w-5" />,
  scriptwriting: <PencilLine className="h-5 w-5" />,
  video_editing: <Video className="h-5 w-5" />,
};

const statusColors = {
  Completed: 'bg-green-500/20 text-green-300',
  'Awaiting Actor Confirmation': 'bg-green-500/20 text-green-300 animate-pulse',
  awaiting_offer: 'bg-yellow-500/20 text-yellow-300',
  offer_made: 'bg-blue-500/20 text-blue-300',
  default: 'bg-yellow-500/20 text-yellow-400'
};

// --- 1. Rename this component and update its props/logic ---
const MaterialsDisplay: React.FC<{ script: string | null, fileUrls: string[] | null }> = ({ script, fileUrls }) => {
  if (!script && (!fileUrls || fileUrls.length === 0)) {
    return <p className="text-muted-foreground">The client has not uploaded any materials yet.</p>;
  }

  const scriptText = script?.trim();
  const fileLinks = fileUrls || [];

  return (
    <div className="space-y-4">
      {scriptText && (
        <div>
          <h4 className="font-semibold text-foreground mb-2">Project Details / Notes</h4>
          <p className="text-muted-foreground whitespace-pre-wrap">{scriptText}</p>
        </div>
      )}
      
      {fileLinks.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Attached Files</h4>
          <div className="space-y-2">
            {fileLinks.map((url, index) => (
              <Button
                key={index}
                asChild
                variant="outline"
                className="w-full justify-start text-left h-auto"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{url.split('/').pop()}</span>
                </a>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const OrderDetailsModal: React.FC<ModalProps> = ({ order, onClose, onUpdate, onActorConfirmPayment }) => {
    const [message, setMessage] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);
    const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
    
    // Offer State
    const [offerTitle, setOfferTitle] = useState('');
    const [offerAgreement, setOfferAgreement] = useState('');
    const [offerPrice, setOfferPrice] = useState<number | string>('');
    const [isSendingOffer, setIsSendingOffer] = useState(false);
    
    // Offer History State
    const [offerHistory, setOfferHistory] = useState<Offer[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [openSections, setOpenSections] = useState({
        offer_history: false,
        quote_details: true,
        script: false,
        delivery: !['awaiting_offer', 'offer_made'].includes(order.status),
    });

    // --- State & Logic (All Unchanged) ---
    useEffect(() => {
      // This fetch is still correct, it pre-populates the "Make an Offer" form
      if (order.status === 'awaiting_offer' || order.status === 'offer_made') {
        const fetchOfferHistory = async () => {
          setLoadingHistory(true);
          const { data, error } = await supabase
            .from('offers')
            .select('*')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error("Error fetching offer history:", error);
            setMessage(`Error: ${error.message}`);
          } else {
            setOfferHistory(data as Offer[]);
            // Pre-fill form with the latest offer OR the order's existing price
            const latestOffer = data?.[0];
            if (latestOffer) {
              setOfferTitle(latestOffer.offer_title);
              setOfferAgreement(latestOffer.offer_agreement || '');
              setOfferPrice(latestOffer.offer_price);
            } else if (order.total_price) {
            // Pre-fill with direct order price if it exists
            setOfferTitle(order.service_type === 'voice_over' ? "Voice Over" : "Service Quote");
            setOfferPrice(order.total_price);
          }
          }
          setLoadingHistory(false);
        };
        fetchOfferHistory();
      }
    }, [order.id, order.status, order.total_price, order.service_type]); // Added dependencies
    
    // --- ADD THIS NEW USE-EFFECT ---
    // This implements "Mark as Read" when the user opens the chat.
    useEffect(() => {
        const markAsRead = async () => {
            // This modal is for the 'actor', so we check and update the actor's flag
            if (order.actor_has_unread_messages) {
                const { error } = await supabase
                    .from('orders')
                    .update({ 
                    actor_has_unread_messages: false,
                    notification_due_at: null // <-- ADD THIS LINE
                })
                    .eq('id', order.id);
                
                if (error) {
                    console.error("Error marking messages as read:", error);
                } else {
                    // Successfully marked as read.
                    // If you have a notification bubble on the parent page,
                    // calling onUpdate() here would refresh it.
                    // onUpdate(); // This is optional
                }
            }
        };
        
        markAsRead();
    // We only want this to run when the modal opens or the specific flag changes
    }, [order.id, order.actor_has_unread_messages]);
    // --- END ADD ---

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };
  
    
    const handleConfirmClick = async () => {
        if (!onActorConfirmPayment) return;
        setIsConfirming(true);
        setMessage('');
        try {
          await onActorConfirmPayment(order.id, order.client_email, order.client_name, order.order_id_string);

          // --- MODIFIED SUCCESS LOGIC ---
          setMessage('Payment confirmed successfully!');
          // The modal will no longer close automatically
          // --- END OF MODIFIED LOGIC ---

        } catch (error) {
          const err = error as Error;
          console.error("Failed to confirm payment:", err);
          setMessage(`Error: ${err.message}`);
          setIsConfirming(false); // Re-enable the button on error
        }
    };    


      const handleDeliverySuccess = () => {
      if (order.service_type === 'voice_over') {
        setIsLibraryModalOpen(true);
      } else {
        onUpdate();
        onClose();
      }
    };
    
    const handleLibraryDeliverySuccess = () => {
      setIsLibraryModalOpen(false);
      onUpdate();
      onClose();
    }
    

    // handleSendOffer (This is correct as-is)
    const handleSendOffer = async () => {
      const price = parseFloat(String(offerPrice));
      if (!offerTitle.trim()) {
        setMessage("Please provide an Offer Title.");
        return;
      }
      if (isNaN(price) || price <= 0) {
        setMessage("Please enter a valid price.");
        return;
      }
      
      setIsSendingOffer(true);
      setMessage('');
      const isUpdate = order.status === 'offer_made';

      try {
        // 1. Insert into 'offers' history table
        const { error: insertError } = await supabase
          .from('offers')
          .insert({
            order_id: order.id, actor_id: order.actor_id, offer_title: offerTitle,
            offer_agreement: offerAgreement || null, offer_price: price
          })
          .select().single();
        if (insertError) throw insertError;

        // 2. Update the main 'orders' table with status AND price
        const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'offer_made' }) // Price is now only in the 'offers' table
        .eq('id', order.id);
        if (updateError) throw updateError;

        // 3. Send email
        const emailParams = {
          orderId: order.order_id_string, order_uuid: order.id, clientName: order.client_name,
          clientEmail: order.client_email, actorName: order.actors.ActorName, offerPrice: price.toFixed(2),
          offerTitle: offerTitle, offerAgreement: offerAgreement || 'No agreement details provided.',
          serviceType: order.service_type,
        };
        // TODO: Replace with your actual template IDs
        const templateId = isUpdate ? 'YOUR_OFFER_UPDATED_TEMPLATE_ID' : 'YOUR_QUOTE_OFFER_TEMPLATE_ID';
        await emailjs.send('service_r3pvt1s', templateId, emailParams, 'I51tDIHsXYKncMQpO');

        setMessage(isUpdate ? 'Offer updated!' : 'Offer sent to client!');
        onUpdate();
        setTimeout(onClose, 1500);
      } catch (error) {
        const err = error as Error;
        console.error("Error sending offer:", err);
        setMessage(`Error: ${err.message}`);
      } finally {
        setIsSendingOffer(false);
      }
    };
    // --- End State & Logic ---
    
    // --- THIS IS THE CORRECTED PRICE LOGIC ---
// --- THIS IS THE FINAL PRICE LOGIC ---
const latestOfferPrice = offerHistory.length > 0 ? offerHistory[0].offer_price : null;
const displayPrice = latestOfferPrice ?? order.total_price;
// ---    // --- END CORRECTION ---

    const currentStatus = order.status === 'awaiting_offer' ? 'Awaiting Offer' : order.status;
    const statusColorClass = statusColors[order.status as keyof typeof statusColors] || statusColors.default;

    return (
        <>
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className="
                  w-screen h-full max-w-none rounded-none border-none p-0 flex flex-col 
                  sm:w-full sm:max-w-4xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:border
                ">
                    <DialogHeader className="p-4 sm:p-6 pb-4 border-b flex-shrink-0">
                        <DialogTitle className="text-2xl sm:text-3xl font-bold">
                            {order.service_type === 'voice_over' ? `Order #${order.order_id_string}` : `Quote #${order.order_id_string}`}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Client: {order.client_name}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="details" className="flex-grow flex flex-col overflow-hidden">
                        <TabsList className="grid w-full grid-cols-2 flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
                            <TabsTrigger value="details"><Info className="mr-2 h-4 w-4"/> Order Details</TabsTrigger>
                            <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4"/> Communication</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="flex-grow overflow-y-auto custom-scrollbar">
                            <div className="p-4 sm:p-6 flex flex-col-reverse lg:grid lg:grid-cols-3 gap-6">
                                
                                {/* --- Left Column (Scrollable Content) --- */}
                                <div className="lg:col-span-2 space-y-6">
                                    
                                    {order.service_type !== 'voice_over' && (
                                        <AccordionItem title="Quote Details" icon={<Info size={18} />} isOpen={openSections.quote_details} onToggle={() => toggleSection('quote_details')}>
                                            <div className="bg-background p-4 rounded-lg space-y-2 text-sm">
                                                {order.service_type === 'scriptwriting' && (
                                                    <>
                                                        <div className="flex justify-between"><span className="text-muted-foreground">Est. Video Duration:</span><span className="font-semibold text-foreground">{order.quote_est_duration || 'N/A'} min</span></div>
                                                        <div className="flex justify-between"><span className="text-muted-foreground">Est. Word Count:</span><span className="font-semibold text-foreground">{order.word_count || 'N/A'}</span></div>
                                                    </>
                                                )}
                                                {order.service_type === 'video_editing' && (
                                                    <>
                                                        <div className="flex justify-between"><span className="text-muted-foreground">Video Type:</span><span className="font-semibold text-foreground capitalize">{order.quote_video_type || 'N/A'}</span></div>
                                                        <div className="flex justify-between"><span className="text-muted-foreground">Footage:</span><span className="font-semibold text-foreground">{order.quote_footage_choice === 'has_footage' ? 'Client has footage' : 'Needs stock footage'}</span></div>
                                                    </>
                                                )}
                                            </div>
                                        </AccordionItem>
                                    )}
                                    
                                    <AccordionItem title={order.service_type === 'voice_over' ? "Script" : "Project Description"} icon={<FileText size={18} />} isOpen={openSections.script} onToggle={() => toggleSection('script')}>
                                        <div className="bg-background p-4 rounded-lg max-h-40 overflow-y-auto custom-scrollbar">
                                            <p className="text-muted-foreground whitespace-pre-wrap">{order.script}</p>
                                        </div>
                                    </AccordionItem>

                                    {/* 2. Show Project Materials */}
                                            <AccordionItem 
                                              title="Project Materials (from Client)" 
                                              icon={<FileText size={18} />} 
                                              isOpen={true} 
                                              onToggle={() => {}}
                                            >
                                              <div className="bg-background p-4 rounded-lg max-h-60 overflow-y-auto custom-scrollbar">
                                                <MaterialsDisplay 
                                                    script={order.project_notes} 
                                                    fileUrls={order.material_file_urls} 
                                                />
                                              </div>
                                            </AccordionItem>

                                    {!['awaiting_offer', 'offer_made', 'Awaiting Payment'].includes(order.status) && (
                                        <AccordionItem title={`Deliver ${order.service_type.replace('_', ' ')}`} icon={<Package size={18} />} isOpen={openSections.delivery} onToggle={() => toggleSection('delivery')}>
                                            {order.deliveries && order.deliveries.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Delivery History</h4>
                                                    <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                                        {order.deliveries.map((delivery) => (
                                                            <div key={delivery.id} className="bg-background p-3 rounded-lg flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-semibold text-foreground">Version {delivery.version_number}</p>
                                                                    <p className="text-xs text-muted-foreground">{new Date(delivery.created_at).toLocaleString()}</p>
                                                                </div>
                                                                <Button asChild variant="ghost" size="sm">
                                                                    <a href={delivery.file_url} target="_blank" rel="noopener noreferrer"><Download size={16} className="mr-2" />Download</a>
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="bg-background p-4 rounded-lg">
                                                <h4 className="text-sm font-semibold text-foreground mb-3">{order.deliveries.length > 0 ? 'Upload a New Version' : 'Upload Your Delivery'}</h4>
                                                <ServiceDeliveryUploader order={order} onDeliverySuccess={handleDeliverySuccess} />
                                            </div>
                                        </AccordionItem>
                                    )}
                                    
                                    {(order.status === 'awaiting_offer' || order.status === 'offer_made') && (
                                        <AccordionItem title="Offer History" icon={<History size={18} />} isOpen={openSections.offer_history} onToggle={() => toggleSection('offer_history')}>
                                            <div className="bg-background p-4 rounded-lg space-y-3 max-h-40 overflow-y-auto custom-scrollbar">
                                                {loadingHistory ? (
                                                    <p className="text-sm text-muted-foreground">Loading history...</p>
                                                ) : offerHistory.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">No offers have been made yet.</p>
                                                ) : (
                                                    offerHistory.map(offer => (
                                                        <div key={offer.id} className="pb-3 border-b border last:border-b-0">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-semibold text-foreground">{offer.offer_title}</span>
                                                                <span className="font-bold text-lg text-primary">{offer.offer_price.toFixed(2)} MAD</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mb-2">{new Date(offer.created_at).toLocaleString()}</p>
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{offer.offer_agreement || "No agreement details provided."}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </AccordionItem>
                                    )}
                                </div>

                                {/* --- Right Sidebar (Sticky Actions) --- */}
                                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
                                    
                                    <Card>
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Order Status</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="flex justify-between items-center">
                                          <span className="text-muted-foreground">Status</span>
                                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColorClass}`}>
                                            {currentStatus}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-muted-foreground">Service</span>
                                          <span className="font-semibold capitalize text-foreground">{order.service_type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-muted-foreground">Price</span>
                                          <span className="font-bold text-2xl text-primary">
                                            {displayPrice ? `${displayPrice.toFixed(2)} MAD` : 'Not Quoted'}
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {order.status === 'Awaiting Actor Confirmation' && onActorConfirmPayment && (
                                        <Card className="bg-green-900/30 border-green-700">
                                          <CardHeader className="pb-4">
                                            <CardTitle className="flex items-center gap-2"><Banknote size={18} /> Action Required</CardTitle>
                                          </CardHeader>
                                          
                                          <CardContent>
                                            <p className="text-sm text-muted-foreground mb-4">Client has paid. Please check your account and confirm receipt to begin work.</p>
                                            <Button
                                                onClick={handleConfirmClick}
                                                disabled={isConfirming}
                                                className="w-full bg-green-600 hover:bg-green-700 text-foreground"
                                            >
                                                {isConfirming ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                                {isConfirming ? 'Confirming...' : 'Confirm Payment'}
                                            </Button>
                                            {message.includes('Error') && <p className="text-red-400 text-sm mt-3 text-center">{message}</p>}
                                          </CardContent>
                                        </Card>
                                    )}

                                    {/* --- THIS IS THE FIX --- */}
                                    {/* Display message outside the card, styled for success/error */}
                                    {message && (
                                       <p className={`text-sm mt-3 text-center ${
                                        message.includes('Error') ? 'text-destructive' : 'text-green-400'
                                      }`}>
                                       {message}
                                      </p>
                                    )}
                                    {/* --- END FIX --- */}

                                    {(order.status === 'awaiting_offer' || order.status === 'offer_made') && (
                                        <Card className=" border-blue-700">
                                          <CardHeader className="pb-4 text-foreground">
                                            <CardTitle className="flex items-center gap-2">
                                              <Banknote size={18} /> 
                                              {order.status === 'offer_made' ? 'Update Your Offer' : 'Make an Offer'}
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="offerTitle" className="text-muted-foreground">Offer Title *</Label>
                                                    <Input id="offerTitle" type="text" placeholder="e.g., Full Video Edit" value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} className=" border-slate-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="offerAgreement" className="text-muted-foreground">Offer Agreement (Optional)</Label>
                                                    <Textarea id="offerAgreement" rows={3} placeholder="e.g., Includes 2 revisions..." value={offerAgreement} onChange={(e) => setOfferAgreement(e.target.value)} className=" border-slate-600" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="offerPrice" className="text-muted-foreground">Your Price (MAD) *</Label>
                                                    <Input id="offerPrice" type="number" step="0.01" placeholder="e.g., 1500" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className=" border-slate-600" />
                                                </div>
                                            </div>
                                            <Button onClick={handleSendOffer} disabled={isSendingOffer} className="w-full bg-blue-600 hover:bg-blue-700 mt-4">
                                                {isSendingOffer ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                                {isSendingOffer ? 'Sending...' : (order.status === 'offer_made' ? 'Update Offer' : 'Send Offer')}
                                            </Button>
                                            {message && !message.includes('Error') && <p className="text-green-400 text-sm mt-3 text-center">{message}</p>}
                                          </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* --- Tab 2: Communication --- */}
                        <TabsContent value="chat" className="flex-grow flex flex-col p-0 overflow-hidden">
                            <ChatBox orderId={order.id}
                            userRole="actor"
                            orderData={{
                              last_message_sender_role: order.last_message_sender_role,
                              client_email: order.client_email,
                              client_name: order.client_name,
                              actor_email: order.actors.ActorEmail || '',
                              actor_name: order.actors.ActorName,
                              order_id_string: order.order_id_string
                            }} conversationId={''} currentUserId={''} otherUserName={''} />
                          </TabsContent>
                        </Tabs>
                    
                </DialogContent>
            </Dialog>

            {/* Library Modal (Unchanged) */}
            {isLibraryModalOpen && order.service_type === 'voice_over' && (
              <DeliverFromLibraryModal
                order={order}
                onClose={() => setIsLibraryModalOpen(false)}
                onDeliverySuccess={handleLibraryDeliverySuccess}
              />
            )}
        </>
    );
};
export default OrderDetailsModal;