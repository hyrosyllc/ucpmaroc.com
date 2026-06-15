// In src/components/ServiceDeliveryUploader.tsx

import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, Link as LinkIcon, RefreshCw, Send, Archive } from 'lucide-react';
import emailjs from '@emailjs/browser'; // <-- 1. ADD THIS IMPORT

interface ServiceDeliveryUploaderProps {
  order: {
    from_chat_offer: any;
    id: string;
    actor_id: string;
    service_type: 'voice_over' | 'scriptwriting' | 'video_editing';
    order_id_string: string;
    client_name: string;
    client_email: string;
    actors: {
      ActorName: string;
    };
  };
  onDeliverySuccess: () => void; // Function to call on success
  
}

// Define allowed file types for each service
const fileAcceptTypes = {
  voice_over: 'audio/*',
  scriptwriting: '.pdf,.txt,.doc,.docx',
  video_editing: 'video/mp4,video/quicktime,.zip,.rar',
};

const ServiceDeliveryUploader: React.FC<ServiceDeliveryUploaderProps> = ({ order, onDeliverySuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const getUploadLabel = () => {
    switch (order.service_type) {
      case 'voice_over': return 'Upload Audio File (MP3, WAV)';
      case 'scriptwriting': return 'Upload Script File (PDF, TXT, DOCX)';
      case 'video_editing': return 'Upload Video/ZIP File (MP4, MOV, ZIP)';
      default: return 'Upload File';
    }
  };

  // Generic handler to insert a delivery record
  const createDeliveryRecord = async (fileUrl: string) => {
    // Count existing deliveries
    const { count, error: countError } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', order.id);
    if (countError) throw countError;
    const newVersion = (count || 0) + 1;

    // Insert new delivery
    const { error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        order_id: order.id,
        actor_id: order.actor_id,
        file_url: fileUrl, // This can be a file URL or a GDrive/Dropbox link
        version_number: newVersion
      });
    if (deliveryError) throw deliveryError;

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'Pending Approval' })
      .eq('id', order.id);
    if (updateError) throw updateError;
    try {
      const emailParams = {
        orderId: order.order_id_string,
        order_uuid: order.id,
        clientName: order.client_name,
        clientEmail: order.client_email,
        actorName: order.actors.ActorName,
      };
      
      await emailjs.send(
        'service_r3pvt1s',
        'template_b9896qj', // "New Delivery (To Client)"
        emailParams,
        'I51tDIHsXYKncMQpO'
      );
    } catch (emailError) {
      console.error("Failed to send new delivery email:", emailError);
      // Do not block the function from succeeding, just log the error
    }
  };

  // Handler for FILE upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload.');
      return;
    }
    setIsLoading(true);
    setMessage('Uploading file...');
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${order.actor_id}/${order.id}/delivery_${Date.now()}.${fileExt}`;
      
      let bucket = 'final-audio'; // Default
      if (order.service_type === 'scriptwriting') bucket = 'scripts'; // Requires 'scripts' bucket
      if (order.service_type === 'video_editing') bucket = 'videos'; // Requires 'videos' bucket

      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      await createDeliveryRecord(urlData.publicUrl);
      
      setMessage('Delivery successful!');
      onDeliverySuccess(); // Call parent success function

    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for LINK submit (for video)
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link || !link.startsWith('http')) {
      setMessage('Please enter a valid URL (e.g., https://...)');
      return;
    }
    setIsLoading(true);
    setMessage('Submitting link...');
    try {
      await createDeliveryRecord(link);
      setMessage('Delivery link submitted!');
      onDeliverySuccess();
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for TEXT submit (for script)
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptText.trim()) {
      setMessage('Please paste your script into the text box.');
      return;
    }
    setIsLoading(true);
    setMessage('Saving script...');
    
    try {
      // 1. Create a text file from the script content
      const scriptBlob = new Blob([scriptText], { type: 'text/plain' });
      const scriptFile = new File([scriptBlob], `script_${Date.now()}.txt`);
      const filePath = `${order.actor_id}/${order.id}/script_${Date.now()}.txt`;

      // 2. Upload the text file to a 'scripts' bucket
      // *** You must create a 'scripts' bucket in Supabase Storage ***
      const { error: uploadError } = await supabase.storage.from('scripts').upload(filePath, scriptFile);
      if (uploadError) throw uploadError;

      // 3. Get the URL and create the delivery record
      const { data: urlData } = supabase.storage.from('scripts').getPublicUrl(filePath);
      await createDeliveryRecord(urlData.publicUrl);

      setMessage('Script delivered successfully!');
      onDeliverySuccess();
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // If it's a flexible chat offer, show a generic uploader.
    if (order.from_chat_offer) {
        return (
            <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                    Upload Your Delivery
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                    Upload any files for your "video photo" service.
                </p>
                {/* Simple generic file uploader that reuses handleFileUpload */}
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <Label htmlFor="generic-file">Select File</Label>
                  <Input
                    id="generic-file"
                    type="file"
                    accept="*/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <Button type="submit" disabled={isLoading || !file} className="w-full">
                    {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Deliver File
                  </Button>
                </form>
            </div>
        );
    }

  // --- Render Script Writing Delivery ---
  if (order.service_type === 'scriptwriting') {
    return (
      <div className="space-y-4">
        {/* Option 1: Paste Text */}
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <Label htmlFor="scriptText">Paste Script Here</Label>
          <Textarea
            id="scriptText"
            rows={8}
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="Paste your completed script..."
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Deliver Script as Text
          </Button>
        </form>
        
        <div className="flex items-center gap-2"><div className="flex-grow border-t"></div><span className="text-xs text-muted-foreground">OR</span><div className="flex-grow border-t"></div></div>

        {/* Option 2: Upload File */}
        <form onSubmit={handleFileUpload} className="space-y-4">
          <Label htmlFor="script-file">Upload Script File</Label>
          <Input id="script-file" type="file" accept={fileAcceptTypes.scriptwriting} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button type="submit" variant="outline" disabled={isLoading || !file} className="w-full">
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Deliver as File
          </Button>
        </form>
        {message && <p className="text-center text-sm text-yellow-400">{message}</p>}
      </div>
    );
  }

  // --- Render Video Editing Delivery ---
  if (order.service_type === 'video_editing') {
    return (
      <div className="space-y-4">
        {/* Option 1: Paste Link */}
        <form onSubmit={handleLinkSubmit} className="space-y-4">
          <Label htmlFor="video-link">Paste Download Link (Google Drive, Dropbox, etc.)</Label>
          <Input id="video-link" type="text" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
            Deliver via Link
          </Button>
        </form>
        
        <div className="flex items-center gap-2"><div className="flex-grow border-t"></div><span className="text-xs text-muted-foreground">OR</span><div className="flex-grow border-t"></div></div>

        {/* Option 2: Upload File */}
        <form onSubmit={handleFileUpload} className="space-y-4">
          <Label htmlFor="video-file">Upload Video File (MP4, MOV, ZIP)</Label>
          <Input id="video-file" type="file" accept={fileAcceptTypes.video_editing} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button type="submit" variant="outline" disabled={isLoading || !file} className="w-full">
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            Deliver as File Upload
          </Button>
        </form>
        {message && <p className="text-center text-sm text-yellow-400">{message}</p>}
      </div>
    );
  }
  
  // --- Render Voice Over Delivery (Default) ---
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="upload-modal" className="block text-sm font-medium mb-2">Option 1: Upload a new file</Label>
        <Input id="upload-modal" type="file" accept={fileAcceptTypes.voice_over} onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button onClick={handleFileUpload} disabled={isLoading || !file} className="w-full mt-3">
          {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
          Upload File
        </Button>
      </div>
      
      <div className="flex items-center gap-2"><div className="flex-grow border-t"></div><span className="text-xs text-muted-foreground">OR</span><div className="flex-grow border-t"></div></div>

      <div>
        <Label className="block text-sm font-medium mb-2">Option 2: Use your library</Label>
        <Button
            type="button"
            onClick={onDeliverySuccess} // Re-purposing this to mean "open library"
            variant="outline"
            className="w-full"
        >
            <Archive size={18} className="mr-2" /> Deliver from Library
        </Button>
      </div>
      {message && <p className="text-center text-sm text-yellow-400">{message}</p>}
    </div>
  );
};

export default ServiceDeliveryUploader;