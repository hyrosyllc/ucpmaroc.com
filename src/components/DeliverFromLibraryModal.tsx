// In src/components/DeliverFromLibraryModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { X, Send, RefreshCw, CheckCircle, Mic } from 'lucide-react'; // Added icons
import emailjs from '@emailjs/browser';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area'; // Import ScrollArea
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Import RadioGroup
import { Label } from "@/components/ui/label"; // Import Label
import { Card } from './ui/card'; // Import Card for the empty state

// Copied from ActorDashboardPage.tsx
interface ActorRecording {
  id: string;
  actor_id: string;
  name: string;
  raw_audio_url: string;
  cleaned_audio_url: string | null;
  status: 'raw' | 'cleaning' | 'cleaned' | 'error';
  created_at: string;
}

// Copied from OrderDetailsModal.tsx
interface Order {
  id: string;
  order_id_string: string;
  client_name: string;
  client_email: string;
  actor_id: string;
  actors: {
    ActorName: string;
  };
}

interface ModalProps {
  order: Order;
  onClose: () => void;
  onDeliverySuccess: () => void; // This will close both modals and refresh
}

const DeliverFromLibraryModal: React.FC<ModalProps> = ({ order, onClose, onDeliverySuccess }) => {
  const [recordings, setRecordings] = useState<ActorRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDelivering, setIsDelivering] = useState(false);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // 1. Fetch the actor's recordings (Unchanged)
  useEffect(() => {
    const fetchRecordings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('actor_recordings')
        .select('*')
        .eq('actor_id', order.actor_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching recordings:", error);
        setMessage(`Error: ${error.message}`);
      } else {
        setRecordings(data as ActorRecording[]);
      }
      setIsLoading(false);
    };
    fetchRecordings();
  }, [order.actor_id]);

  // 2. Handle the delivery logic (Unchanged)
  const handleDeliver = async () => {
    if (!selectedRecordingId) {
      setMessage('Please select a recording to deliver.');
      return;
    }

    const selectedRecording = recordings.find(r => r.id === selectedRecordingId);
    if (!selectedRecording) {
      setMessage('Error: Selected recording not found.');
      return;
    }

    const fileUrlToDeliver = selectedRecording.cleaned_audio_url || selectedRecording.raw_audio_url;
    
    setIsDelivering(true);

    try {
      // 2a. Count existing deliveries
      const { count, error: countError } = await supabase
        .from('deliveries')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', order.id);

      if (countError) throw countError;
      const newVersion = (count || 0) + 1;

      // 2b. Insert new row into 'deliveries' table
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: order.id,
          actor_id: order.actor_id,
          file_url: fileUrlToDeliver,
          version_number: newVersion
        });
      if (deliveryError) throw deliveryError;

      // 2c. Update the order status to 'Pending Approval'
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'Pending Approval' })
        .eq('id', order.id);
      if (updateError) throw updateError;

      // 2d. Send notification email to Client
      const emailParams = {
        orderId: order.order_id_string,
        order_uuid: order.id,
        clientName: order.client_name,
        clientEmail: order.client_email,
        actorName: order.actors.ActorName,
      };
        
      // Wrap email in a safe try/catch
      try {
        await emailjs.send(
          'service_r3pvt1s',
          'template_2iuj3dr',
          emailParams,
          'I51tDIHsXYKncMQpO'
        );
      } catch (emailError) {
        console.error("Failed to send delivery email, but proceeding:", emailError);
      }

      setMessage('Delivery successful! Client has been notified.');
      
      // 2e. Call the success handler
      setTimeout(onDeliverySuccess, 1500); // Give time to read message

    } catch (error) {
      const err = error as Error;
      setMessage(`Error: An error occurred: ${err.message}`);
      console.error(err);
      setIsDelivering(false);
    }
  };

  // --- Restyled Render ---
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none rounded-none border-none p-0 
                                sm:w-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:border">
        
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-2xl sm:text-3xl font-bold">Deliver from Library</DialogTitle>
          <DialogDescription>
            Select a recording from your library to deliver to {order.client_name}.
          </DialogDescription>
        </DialogHeader>

        {/* --- Restyled Scrollable list --- */}
        <ScrollArea className="max-h-[50vh]">
          <div className="p-4 sm:p-6 space-y-3">
            {isLoading && <p className="text-muted-foreground text-center py-8">Loading recordings...</p>}
            {!isLoading && recordings.length === 0 && (
              <Card className="p-8 flex flex-col items-center justify-center text-center">
                <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-semibold text-foreground">Your library is empty</p>
                <p className="text-sm text-muted-foreground">Upload recordings in your dashboard to deliver them here.</p>
              </Card>
            )}
            
            <RadioGroup 
              value={selectedRecordingId || ''} 
              onValueChange={setSelectedRecordingId} 
              className="space-y-3"
            >
              {recordings.map(rec => {
                return (
                  <Label
                    key={rec.id}
                    htmlFor={rec.id}
                    className={`
                      flex items-center gap-4 rounded-lg border p-4 transition-colors
                      cursor-pointer hover:bg-accent/50
                      ${selectedRecordingId === rec.id ? 'border-primary bg-accent ring-2 ring-primary' : ''}
                    `}
                  >
                    <RadioGroupItem value={rec.id} id={rec.id} />
                    <div>
                      <p className="font-semibold text-base text-foreground">{rec.name}</p>
                      {rec.status === 'cleaned' && rec.cleaned_audio_url ? (
                       <span className="text-xs font-medium text-green-500 flex items-center gap-1.5">
                          <CheckCircle size={12} /> AI Cleaned Audio
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-yellow-500">
                          Raw Audio Only
                        </span>
                      )}
                    </div>
                 </Label>
                );
              })}
            </RadioGroup>
         </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 sm:p-6 pt-4 border-t flex-col flex-shrink-0">
          {/* --- Restyled Message --- */}
          {message && (
            <p className={`text-center text-sm mb-2 w-full ${
              message.includes('Error') ? 'text-destructive' :
             message.includes('successful') ? 'text-green-400' :
              'text-muted-foreground'
            }`}>
              {message}
            </p>
          )}
          <Button
            onClick={handleDeliver}
            disabled={!selectedRecordingId || isDelivering || isLoading}
            className="w-full"
            size="lg"
          >
            {isDelivering ? <RefreshCw size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
            {isDelivering ? 'Delivering...' : 'Deliver Selected Audio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliverFromLibraryModal;