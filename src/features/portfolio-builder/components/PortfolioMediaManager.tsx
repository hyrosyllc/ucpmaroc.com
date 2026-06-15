import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Image as ImageIcon, Music, Video, Link as LinkIcon, 
  Plus, Loader2, Trash2, FilePlus, Play, HardDrive, UploadCloud, X 
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSubscription } from '../../../context/SubscriptionContext';

export interface UnifiedMediaItem {
  id: string;
  type: 'image' | 'audio' | 'video' | 'link';
  url: string;
  title: string;
  source: 'upload' | 'demo';
  size?: number;
}

interface PortfolioMediaManagerProps {
  actorId: string;
  onSelect: (item: UnifiedMediaItem) => void;
}

const PortfolioMediaManager: React.FC<PortfolioMediaManagerProps> = ({ actorId, onSelect }) => {
  const { limits } = useSubscription();
  
  const [uploads, setUploads] = useState<UnifiedMediaItem[]>([]);
  const [demos, setDemos] = useState<UnifiedMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [usedBytes, setUsedBytes] = useState(0);
  
  // Upload State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  
  // File State (Changed to Array)
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  
  // Link State
  const [uploadUrl, setUploadUrl] = useState('');
  
  // Common State
  const [uploadTitle, setUploadTitle] = useState('');

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnail = (item: UnifiedMediaItem) => {
     if (item.type === 'image') return item.url;
     if (item.type === 'video') {
         const ytId = getYoutubeId(item.url);
         if (ytId) return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
     }
     return null; 
  };

  const formatSize = (bytes: number) => {
      const mb = bytes / (1024 * 1024);
      return mb.toFixed(1) + ' MB';
  };

  const fetchData = async () => {
    setLoading(true);
    
    // A. Uploads
    const { data: portfolioData } = await supabase
      .from('portfolio_media_items')
      .select('*')
      .eq('actor_id', actorId)
      .order('created_at', { ascending: false });
      
    if (portfolioData) {
      setUploads(portfolioData.map((item: any) => ({
        id: item.id,
        type: item.type,
        url: item.url,
        title: item.title || 'Untitled',
        source: 'upload',
        size: item.size_bytes || 0
      })));
      const total = portfolioData.reduce((acc: number, item: any) => acc + (item.size_bytes || 0), 0);
      setUsedBytes(total);
    }

    // B. Demos
    const { data: audioDemos } = await supabase.from('demos').select('*').eq('actor_id', actorId);
    const { data: videoDemos } = await supabase.from('video_demos').select('*').eq('actor_id', actorId);

    const unifiedDemos: UnifiedMediaItem[] = [];
    if (audioDemos) audioDemos.forEach((d: any) => unifiedDemos.push({ id: d.demo_id || d.id, type: 'audio', url: d.demo_url, title: d.demo_title || d.title, source: 'demo' }));
    if (videoDemos) videoDemos.forEach((d: any) => unifiedDemos.push({ id: d.id, type: 'video', url: d.video_url, title: d.title, source: 'demo' }));
    
    setDemos(unifiedDemos);
    setLoading(false);
  };

  useEffect(() => {
    if (actorId) fetchData();
  }, [actorId]);

  // --- UPDATED: HANDLE MULTIPLE FILES ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const files = Array.from(e.target.files);
          setUploadFiles(files);
          
          // Only auto-fill title if ONE file is selected
          if (files.length === 1) {
              setUploadTitle(files[0].name.split('.')[0].replace(/-/g, ' '));
          } else {
              setUploadTitle(''); // Clear title for bulk (will use filenames)
          }
      }
  };

  const clearFiles = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setUploadFiles([]);
      setUploadTitle('');
  };

  const handleUpload = async () => {
    if (!actorId) return;
    
    // Check Limits
    const limitBytes = limits.storageLimitMB * 1024 * 1024;
    
    // A. LINK UPLOAD
    if (activeTab === 'link') {
        if (!uploadUrl || !uploadTitle) {
            alert("Please enter a URL and Title.");
            return;
        }
        
        setIsUploading(true);
        let type = 'link';
        if (getYoutubeId(uploadUrl)) type = 'video';

        const { data, error } = await supabase.from('portfolio_media_items').insert({
            actor_id: actorId, type, url: uploadUrl, title: uploadTitle, size_bytes: 0
        }).select().single();

        setIsUploading(false);
        if(!error) {
            onSelect({ id: data.id, type: data.type, url: data.url, title: data.title, source: 'upload' });
            handleCloseModal();
        }
        return;
    }

    // B. FILE UPLOAD (BULK)
    if (activeTab === 'file') {
        if (uploadFiles.length === 0) {
            alert("Please select at least one file.");
            return;
        }

        const totalUploadSize = uploadFiles.reduce((acc, f) => acc + f.size, 0);
        
        if ((usedBytes + totalUploadSize) > limitBytes) {
            alert(`Storage Limit Reached!\n\nThis batch (${formatSize(totalUploadSize)}) exceeds your remaining space.`);
            return;
        }

        setIsUploading(true);

        try {
            // Process all files in parallel
            await Promise.all(uploadFiles.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const filePath = `${actorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                
                // 1. Upload
                const { error: uploadError } = await supabase.storage
                    .from('portfolio-assets')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('portfolio-assets')
                    .getPublicUrl(filePath);
                
                // 2. Detect Type
                let type = 'image'; // default
                if (file.type.startsWith('audio/')) type = 'audio';
                else if (file.type.startsWith('video/')) type = 'video';

                // 3. Determine Title (Custom if 1 file, else Filename)
                const title = (uploadFiles.length === 1 && uploadTitle) 
                    ? uploadTitle 
                    : file.name.split('.')[0].replace(/-/g, ' ');

                // 4. Save DB
                const { data } = await supabase.from('portfolio_media_items').insert({
                    actor_id: actorId,
                    type,
                    url: urlData.publicUrl,
                    title: title,
                    size_bytes: file.size
                }).select().single();

                // Select the FIRST one automatically (optional UX choice)
                if (uploadFiles.length === 1 && data) {
                    onSelect({ id: data.id, type: data.type, url: data.url, title: data.title, source: 'upload' });
                }
            }));

            handleCloseModal();

        } catch (error: any) {
            console.error("Batch upload failed:", error);
            alert("One or more files failed to upload.");
        } finally {
            setIsUploading(false);
        }
    }
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setUploadTitle('');
      setUploadFiles([]);
      setUploadUrl('');
      fetchData();
  };

  const handleDelete = async (e: React.MouseEvent, id: string, url: string) => {
    e.stopPropagation();
    if (!confirm("Delete this item from your library?")) return;
    
    if (url.includes('portfolio-assets')) {
        try {
            const path = url.split('/portfolio-assets/')[1];
            if (path) await supabase.storage.from('portfolio-assets').remove([path]);
        } catch (err) { console.warn("Cleanup error", err); }
    }

    const { error } = await supabase.from('portfolio_media_items').delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleImport = async (demo: UnifiedMediaItem) => {
    setIsImporting(demo.id);
    try {
      const { data, error } = await supabase
        .from('portfolio_media_items')
        .insert({
          actor_id: actorId,
          type: demo.type,
          url: demo.url,
          title: demo.title,
          original_demo_id: demo.id,
          size_bytes: 0
        })
        .select()
        .single();

      if (error) throw error;
      onSelect({ id: data.id, type: data.type, url: data.url, title: data.title, source: 'upload' });
      fetchData();
    } catch (err) { console.error("Import failed", err); } 
    finally { setIsImporting(null); }
  };

  // --- UI RENDERERS ---
  const limitBytes = limits.storageLimitMB * 1024 * 1024;
  const usagePercent = Math.min(100, (usedBytes / limitBytes) * 100);
  const isFull = usedBytes >= limitBytes;

  const MediaCard = ({ item, isDemo = false }: { item: UnifiedMediaItem, isDemo?: boolean }) => {
    const Icon = item.type === 'image' ? ImageIcon : item.type === 'audio' ? Music : item.type === 'video' ? Video : LinkIcon;
    const thumbnail = getThumbnail(item);
    
    return (
      <div 
        className={cn(
          "group relative aspect-square rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:ring-2 hover:ring-primary cursor-pointer overflow-hidden",
          isImporting === item.id ? "opacity-50 pointer-events-none" : ""
        )}
        onClick={() => isDemo ? handleImport(item) : onSelect(item)}
      >
        {thumbnail ? (
          <>
            <img src={thumbnail} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            {item.type === 'video' && <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40"><Play className="w-8 h-8 text-white fill-white opacity-80" /></div>}
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-muted/30 p-4 text-muted-foreground">
            <Icon className="h-10 w-10 mb-2 opacity-50" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
          <div className="flex items-center justify-between">
             <span className="truncate text-xs font-medium text-white w-full">{item.title}</span>
             {isDemo && isImporting === item.id && <Loader2 className="h-3 w-3 text-white animate-spin flex-shrink-0" />}
          </div>
        </div>
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] opacity-90"><Icon className="mr-1 h-3 w-3" /> {item.type}</Badge>
        </div>
        {!isDemo && (
           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full" onClick={(e) => handleDelete(e, item.id, item.url)}><Trash2 className="h-3 w-3" /></Button>
           </div>
        )}
        {isDemo && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity"><Badge className="bg-white text-black"><FilePlus className="mr-1 h-3 w-3" /> Select</Badge></div>}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* HEADER & STORAGE */}
      <div className="flex flex-col gap-3 px-1">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold tracking-tight">Media Library</h3>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2" disabled={isFull}>
                    <Plus className="h-4 w-4" /> Upload New
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Media</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="file"><UploadCloud className="h-4 w-4 mr-2"/> File Upload</TabsTrigger>
                            <TabsTrigger value="link"><LinkIcon className="h-4 w-4 mr-2"/> External Link</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    {activeTab === 'file' && (
                        <div className="space-y-3">
                            {uploadFiles.length === 1 && (
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="File Title" />
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label>Choose Files</Label>
                                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                                    <Input 
                                        type="file" 
                                        multiple // <--- ENABLE BULK
                                        accept="image/*,audio/*,video/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                    />
                                    {uploadFiles.length > 0 ? (
                                        <div className="space-y-2 relative z-10">
                                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                                {uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} selected
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">
                                                {uploadFiles.length === 1 ? uploadFiles[0].name : 'Ready to upload'}
                                            </p>
                                            <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive" onClick={clearFiles}>
                                                Clear Selection
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                                            <p className="text-sm font-medium">Click to select files</p>
                                            <p className="text-xs text-muted-foreground mt-1">Up to {limits.storageLimitMB}MB total.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'link' && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Link Title" />
                            </div>
                            <div className="space-y-2">
                                <Label>Link URL</Label>
                                <Input value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} placeholder="https://youtube.com/..." />
                            </div>
                        </div>
                    )}

                    <Button onClick={handleUpload} disabled={isUploading || (activeTab === 'file' && uploadFiles.length === 0) || (activeTab === 'link' && !uploadUrl)} className="w-full h-11">
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUploading ? "Uploading..." : `Save ${uploadFiles.length > 1 ? 'All' : ''}`}
                    </Button>
                </div>
            </DialogContent>
            </Dialog>
        </div>

        <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1"><HardDrive size={10}/> Storage Used</span>
                <span>{formatSize(usedBytes)} / {limits.storageLimitMB} MB</span>
            </div>
            <Progress value={usagePercent} className={cn("h-2", isFull ? "bg-red-100" : "")} indicatorClassName={cn(isFull ? "bg-red-500" : (usagePercent > 80 ? "bg-amber-500" : "bg-primary"))} />
            {isFull && <p className="text-[10px] text-red-500 font-bold">Storage Full! Please delete items or upgrade your plan.</p>}
        </div>
      </div>

      <Tabs defaultValue="uploads" className="flex-grow flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-2 mb-2">
          <TabsTrigger value="uploads">My Assets</TabsTrigger>
          <TabsTrigger value="demos">Casting Demos</TabsTrigger>
        </TabsList>

        <TabsContent value="uploads" className="flex-grow overflow-hidden mt-0 relative">
           <ScrollArea className="h-full w-full rounded-md border bg-muted/10 p-4">
             {loading ? <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="animate-spin mr-2"/> Loading...</div> : (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                 {uploads.map(item => <MediaCard key={item.id} item={item} />)}
                 {uploads.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No assets yet.</p>
                        <Button variant="link" onClick={() => setIsModalOpen(true)}>Upload your first item</Button>
                    </div>
                 )}
               </div>
             )}
           </ScrollArea>
        </TabsContent>

        <TabsContent value="demos" className="flex-grow overflow-hidden mt-0 relative">
           <ScrollArea className="h-full w-full rounded-md border bg-muted/10 p-4">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
               {demos.map(item => <MediaCard key={item.id} item={item} isDemo={true} />)}
               {demos.length === 0 && <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground"><p>No casting demos found.</p></div>}
             </div>
           </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioMediaManager;