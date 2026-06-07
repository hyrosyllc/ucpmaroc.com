// In src/components/RecordingModal.tsx
import React, { useState, useRef } from 'react';
import { Mic, StopCircle, Play, Save, X } from 'lucide-react'; // Ensure Play is imported if needed elsewhere, not used here directly
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
interface RecordingModalProps {
  onClose: () => void;
  onSave: (audioFile: File, recordingName: string) => void;
  isSaving: boolean;
}

// --- Re-use the same Helper ---
const getSupportedMimeType = (): { mimeType: string; extension: string } => {
  const typesToCheck = [
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/aac', extension: 'aac' },
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/webm', extension: 'webm' },
  ];
  for (const typeInfo of typesToCheck) {
    if (MediaRecorder.isTypeSupported(typeInfo.mimeType)) {
      console.log(`Using supported MIME type: ${typeInfo.mimeType}`);
      return typeInfo;
    }
  }
  console.warn("No preferred MIME type supported, using browser default.");
  return { mimeType: typesToCheck[typesToCheck.length - 1].mimeType, extension: typesToCheck[typesToCheck.length - 1].extension };
};
// --- End Helper ---

const RecordingModal: React.FC<RecordingModalProps> = ({ onClose, onSave, isSaving }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordingName, setRecordingName] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // Store the chosen format details
  const recordingFormatRef = useRef<{ mimeType: string; extension: string } | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // --- Determine supported MIME type ---
      const format = getSupportedMimeType();
      recordingFormatRef.current = format; // Store it
      // --- End Determine ---

      // --- Pass options to MediaRecorder ---
      const options = { mimeType: format.mimeType };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      // --- End Pass options ---

      audioChunksRef.current = [];
      setAudioFile(null); // Clear previous file/URL
      setAudioURL(null);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        if (!recordingFormatRef.current) return;

        // --- Use stored format info ---
        const audioBlob = new Blob(audioChunksRef.current, { type: recordingFormatRef.current.mimeType });
        const file = new File(
          [audioBlob],
          `recording-${Date.now()}.${recordingFormatRef.current.extension}`, // Use correct extension
          { type: recordingFormatRef.current.mimeType }
        );
        // --- End Use stored format ---
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioFile(file);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
       // --- Improved Error Alert ---
       if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          alert("Microphone access denied. Please allow microphone permissions in your browser settings for this site.");
       } else if (err instanceof Error && err.name === 'NotFoundError') {
          alert("No microphone found. Please ensure a microphone is connected and enabled.");
       } else {
          alert(`Could not start recording. Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
       }
      // --- End Improved Alert ---
    }
  };

  // ... (stopRecording and handleSaveClick remain the same) ...
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSaveClick = () => {
    if (audioFile && recordingName.trim()) {
      // Create a new File object with the user-provided name but correct extension and type
      const finalFile = new File(
          [audioFile], // Use the blob data from the existing file
          `${recordingName.trim()}.${recordingFormatRef.current?.extension || 'bin'}`, // New name + correct extension
          { type: recordingFormatRef.current?.mimeType || audioFile.type } // Correct MIME type
      );
      onSave(finalFile, recordingName.trim()); // Send the renamed file
    } else if (!recordingName.trim()) {
      alert("Please provide a name for your recording.");
    }
  };


  // --- JSX remains the same ---
   return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      {/* --- THIS IS THE FIX ---
        This div is now full-screen on mobile and a modal on 'sm' screens.
      */}
      <div className="bg-card w-full h-full flex flex-col justify-center
                      sm:rounded-2xl sm:border sm:w-full sm:max-w-lg sm:h-auto">
        
        <div className="p-6 sm:p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Record New Audio</h2>
          
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className={`w-20 h-20 rounded-full ${isRecording ? 'animate-pulse' : ''}`}
            >
              {isRecording ? <StopCircle size={32} /> : <Mic size={32} />}
            </Button>
            
            <p className="text-muted-foreground text-sm h-5">
              {isRecording ? 'Recording...' : (audioURL ? 'Preview recording' : 'Click to start recording')}
            </p>
            
            {audioURL && (
              <audio src={audioURL} controls className="w-full h-10 my-2" />
            )}

            <div className="w-full space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="recordingName">Recording Name</Label>
                <Input
                  id="recordingName"
                  type="text"
                  value={recordingName}
                  onChange={(e) => setRecordingName(e.target.value)}
                  placeholder="e.g., 'Audition Take 1'"
                  disabled={!audioFile}
                />
              </div>
              <Button
                onClick={handleSaveClick}
                disabled={!audioFile || !recordingName.trim() || isSaving}
                className="w-full"
                size="lg"
              >
                <Save size={18} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save to Library'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingModal;