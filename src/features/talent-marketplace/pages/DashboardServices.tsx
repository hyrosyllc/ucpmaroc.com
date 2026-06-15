// In src/pages/dashboard/DashboardServices.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout";

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
// ---

import { Mic, PencilLine, Video, Save } from 'lucide-react';

// --- Interface (Specific to this page) ---
// This interface now includes ALL service-related fields
interface ActorServiceData {
  id: string;
  // Voice Over
  service_voiceover: boolean; // <-- 1. NEW FIELD
  BaseRate_per_Word: number;
  revisions_allowed: number;
  WebMultiplier: number;
  BroadcastMultiplier: number;
  // Script Writing
  service_scriptwriting: boolean;
  service_script_description: string | null;
  service_script_rate: number;
  // Video Editing
  service_videoediting: boolean;
  service_video_description: string | null;
  service_video_rate: number;
}

const DashboardServices: React.FC = () => {
  const { actorData: layoutActorData } = useOutletContext<ActorDashboardContextType>();
  
  const [servicesData, setServicesData] = useState<Partial<ActorServiceData>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch all service-related data
  const fetchServiceData = useCallback(async () => {
    if (!layoutActorData.id) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('actors')
      .select('id, service_voiceover, BaseRate_per_Word, revisions_allowed, WebMultiplier, BroadcastMultiplier, service_scriptwriting, service_script_description, service_script_rate, service_videoediting, service_video_description, service_video_rate')
      .eq('id', layoutActorData.id)
      .single();

    if (error) {
      console.error("Error fetching service data:", error);
      setMessage(`Error: ${error.message}`);
    } else if (data) {
      setServicesData(data);
    }
    setLoading(false);
  }, [layoutActorData.id]);

  useEffect(() => {
    fetchServiceData();
  }, [fetchServiceData]);

  // --- Handlers ---
const handleServiceToggle = async (serviceName: 'service_scriptwriting' | 'service_videoediting' | 'service_voiceover', isEnabled: boolean) => {    if (!servicesData.id) return;
    setServicesData(prev => ({ ...prev, [serviceName]: isEnabled }));
    
    // Also save this change immediately
    const { error } = await supabase
      .from('actors')
      .update({ [serviceName]: isEnabled })
      .eq('id', servicesData.id);
      
    if (error) {
      setServicesData(prev => ({ ...prev, [serviceName]: !isEnabled })); // Revert on error
      setMessage(`Error updating toggle: ${error.message}`);
    } else {
      setMessage(`${serviceName.replace('service_', '')} ${isEnabled ? 'enabled' : 'disabled'}.`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setServicesData({ ...servicesData, [name]: value });
  };
  
  // This one function saves ALL service info
  const handleSaveServices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicesData.id) return;

    setIsSaving(true);
    setMessage('Saving services info...');
    
    // Payload includes all fields from this page
    const updatePayload = {
      service_voiceover: servicesData.service_voiceover, // <-- Save new field
      BaseRate_per_Word: servicesData.BaseRate_per_Word,
      revisions_allowed: servicesData.revisions_allowed,
      WebMultiplier: servicesData.WebMultiplier,
      BroadcastMultiplier: servicesData.BroadcastMultiplier,
      service_script_description: servicesData.service_script_description,
      service_script_rate: servicesData.service_script_rate,
      service_video_description: servicesData.service_video_description,
      service_video_rate: servicesData.service_video_rate,
    };

    const { error } = await supabase
      .from('actors')
      .update(updatePayload)
      .eq('id', servicesData.id);

    if (error) {
      setMessage(`Error saving services: ${error.message}`);
    } else {
      setMessage('Services and rates updated successfully!');
    }
    setIsSaving(false);
  };
  
  if (loading) {
     return <div className="text-center p-8 text-muted-foreground">Loading services...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto w-full pt-20">
      <h1 className="text-3xl font-bold mb-6">My Services</h1>
      {message && <div className="mb-4 p-3 bg-card border rounded-lg text-center text-sm">{message}</div>}

      <form onSubmit={handleSaveServices} className="space-y-6">
        
        {/* --- 1. Voice Over Card --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Voice Over</CardTitle>
                <Mic className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center space-x-2">
                <Label htmlFor="service_voiceover" className="text-sm text-muted-foreground">Enable</Label>
                <Switch 
                  id="service_voiceover"
                  checked={servicesData.service_voiceover ?? true} // Default to true
                  onCheckedChange={(isChecked) => handleServiceToggle('service_voiceover', isChecked)}
                />
            </div>
          </CardHeader>
          <CardContent className={servicesData.service_voiceover === false ? "opacity-50 pointer-events-none" : ""}>
            <CardDescription className="mb-4">This is your core service. Set your base rates here.</CardDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="BaseRate_per_Word">Base Rate per Word (MAD)</Label>
                <Input type="number" step="0.01" id="BaseRate_per_Word" name="BaseRate_per_Word" value={servicesData.BaseRate_per_Word || 0} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revisions_allowed">Revisions Offered</Label>
                <Input type="number" id="revisions_allowed" name="revisions_allowed" value={servicesData.revisions_allowed || 2} onChange={handleInputChange}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="WebMultiplier">Web Usage Multiplier (e.g., 1.5)</Label>
                <Input type="number" step="0.1" id="WebMultiplier" name="WebMultiplier" value={servicesData.WebMultiplier || 1} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="BroadcastMultiplier">Broadcast Multiplier (e.g., 3)</Label>
                <Input type="number" step="0.1" id="BroadcastMultiplier" name="BroadcastMultiplier" value={servicesData.BroadcastMultiplier || 1} onChange={handleInputChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- 2. Script Writing Card --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Script Writing</CardTitle>
            <div className="flex items-center space-x-2">
              <Label htmlFor="service_scriptwriting" className="text-sm text-muted-foreground">Enable</Label>
              <Switch
                id="service_scriptwriting"
                checked={servicesData.service_scriptwriting || false}
                onCheckedChange={(isChecked) => handleServiceToggle('service_scriptwriting', isChecked)}
              />
            </div>
          </CardHeader>
          <CardContent className={servicesData.service_scriptwriting ? "" : "opacity-50 pointer-events-none"}>
            <CardDescription className="mb-4">Offer script writing as a quote-based service. Set an optional starting rate to show clients.</CardDescription>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="service_script_description">Service Description</Label>
                <Textarea id="service_script_description" name="service_script_description" rows={3} value={servicesData.service_script_description || ''} onChange={handleInputChange} placeholder="e.g., 'Professional scripts for commercials and explainers.'"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_script_rate">Est. Rate (MAD / word)</Label>
                <Input type="number" step="0.1" id="service_script_rate" name="service_script_rate" value={servicesData.service_script_rate || 0} onChange={handleInputChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- 3. Video Editing Card --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Video Editing</CardTitle>
            <div className="flex items-center space-x-2">
              <Label htmlFor="service_videoediting" className="text-sm text-muted-foreground">Enable</Label>
              <Switch
                id="service_videoediting"
                checked={servicesData.service_videoediting || false}
                onCheckedChange={(isChecked) => handleServiceToggle('service_videoediting', isChecked)}
              />
            </div>
          </CardHeader>
          <CardContent className={servicesData.service_videoediting ? "" : "opacity-50 pointer-events-none"}>
            <CardDescription className="mb-4">Offer video editing as a quote-based service. Set an optional starting rate.</CardDescription>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="service_video_description">Service Description</Label>
                <Textarea id="service_video_description" name="service_video_description" rows={3} value={servicesData.service_video_description || ''} onChange={handleInputChange} placeholder="e.g., 'Full video editing with color grading and effects.'"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_video_rate">Est. Rate (MAD / minute)</Label>
                <Input type="number" step="1" id="service_video_rate" name="service_video_rate" value={servicesData.service_video_rate || 0} onChange={handleInputChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Save Button --- */}
        <div className="text-right">
          <Button type="submit" size="lg" disabled={isSaving}>
            <Save size={16} className="mr-2"/> {isSaving ? 'Saving...' : 'Save All Services Info'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DashboardServices;