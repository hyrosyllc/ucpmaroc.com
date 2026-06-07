// In src/components/ProjectMaterialsUploader.tsx

import React, { useState } from 'react';
import { supabase } from '@/supabaseClient';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, UploadCloud } from 'lucide-react';

interface Order {
  id: string;
}

interface ProjectMaterialsUploaderProps {
  order: Order;
  onUploadComplete: () => void;
}

const ProjectMaterialsUploader: React.FC<ProjectMaterialsUploaderProps> = ({ order, onUploadComplete }) => {
  const [scriptText, setScriptText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptText.trim() && files.length === 0) {
      setMessage("Please add a script/note or upload at least one file.");
      return;
    }
    setIsLoading(true);
    setMessage(null);

    try {
      const uploadedFileUrls: string[] = [];

      // 1. Upload files to storage
      for (const file of files) {
        // We use the order ID as a folder to keep files organized
        const filePath = `project-materials/${order.id}/${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-materials')
          .upload(filePath, file, { upsert: true }); // upsert = true overwrites if file exists
        
        if (uploadError) throw uploadError;

        // Get the public URL for the file we just uploaded
        const { data: urlData } = supabase.storage
          .from('project-materials')
          .getPublicUrl(filePath);
        
        uploadedFileUrls.push(urlData.publicUrl);
      }

      // --- THIS IS THE NEW, CORRECT LOGIC ---
      // 2. Update the 'orders' table with our new dedicated columns
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          project_notes: scriptText.trim() || null, // Put text in 'project_notes'
          material_file_urls: uploadedFileUrls.length > 0 ? uploadedFileUrls : null, // Put links in 'material_file_urls'
          script: scriptText.trim() || null // Also update the script column
        }) 
        .eq('id', order.id);

      if (updateError) throw updateError;
      // --- END NEW LOGIC ---

      // 4. Success
      setMessage("Materials uploaded successfully!");
      setIsLoading(false);
      
      // Wait a moment, then refresh the parent page
      setTimeout(() => {
        onUploadComplete();
      }, 1500);

    } catch (error: any) {
      console.error("Error uploading materials:", error);
      setMessage(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="script-text" className="text-lg font-semibold">Project Details</Label>
        <p className="text-sm text-muted-foreground">
          Provide your script, notes, or any instructions for the actor.
        </p>
        <Textarea
          id="script-text"
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          placeholder="Type your script or project requirements here..."
          rows={10}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-upload" className="text-lg font-semibold">Upload Files</Label>
        <p className="text-sm text-muted-foreground">
          Attach any relevant files (e.g., reference audio, brand guidelines, video files).
        </p>
        <Input
          id="file-upload"
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={isLoading}
          className="file:text-primary file:font-semibold cursor-pointer"
        />
        {files.length > 0 && (
          <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
            <p className="font-semibold">Selected files:</p>
            <ul className="list-disc list-inside">
              {files.map(f => <li key={f.name} className="truncate">{f.name}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="text-right">
        {message && (
          <p className={`text-sm mb-2 ${message.startsWith('Error') ? 'text-destructive' : 'text-green-500'}`}>
            {message}
          </p>
        )}
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Uploading..." : "Submit Materials"}
        </Button>
      </div>
    </form>
  );
};

export default ProjectMaterialsUploader;