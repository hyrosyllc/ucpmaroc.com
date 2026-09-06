import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QuoteRequirements } from './quoteTypes';

interface ServiceRequirementsFormProps {
  serviceId: string;
  requirements: QuoteRequirements;
  onChange: (patch: Partial<QuoteRequirements>) => void;
}

const ServiceRequirementsForm: React.FC<ServiceRequirementsFormProps> = ({ serviceId, requirements, onChange }) => {
  const isScriptwriting = serviceId === 'scriptwriting';
  const isVideoEditing = serviceId === 'video_editing';
  const isLocationService = ['delivery', 'transportation', 'home_services', 'repair', 'events'].includes(serviceId);

  return <div className='space-y-6'>
    <div className='space-y-2'>
      <Label htmlFor='projectDescription'>{isLocationService ? 'Describe the request and location *' : 'Project description *'}</Label>
      <Textarea id='projectDescription' rows={5} value={requirements.projectDescription} onChange={(event) => onChange({ projectDescription: event.target.value })} placeholder={isLocationService ? 'Tell us what is needed, where, and any important constraints...' : 'Describe the goals, scope, deliverables, and references...'} />
    </div>

    {isScriptwriting && <div className='grid gap-4 sm:grid-cols-2'>
      <div className='space-y-2'><Label htmlFor='scriptFormat'>Script format *</Label><Select value={requirements.scriptFormat} onValueChange={(value) => onChange({ scriptFormat: value })}><SelectTrigger id='scriptFormat'><SelectValue placeholder='Choose a format' /></SelectTrigger><SelectContent><SelectItem value='commercial'>Commercial</SelectItem><SelectItem value='explainer'>Explainer</SelectItem><SelectItem value='social'>Social content</SelectItem><SelectItem value='podcast'>Podcast</SelectItem><SelectItem value='other'>Other</SelectItem></SelectContent></Select></div>
      <div className='space-y-2'><Label htmlFor='targetAudience'>Target audience *</Label><Input id='targetAudience' value={requirements.targetAudience} onChange={(event) => onChange({ targetAudience: event.target.value })} placeholder='Who is this for?' /></div>
    </div>}

    {isVideoEditing && <div className='grid gap-4 sm:grid-cols-2'>
      <div className='space-y-2'><Label htmlFor='videoType'>Video type *</Label><Select value={requirements.videoType} onValueChange={(value) => onChange({ videoType: value })}><SelectTrigger id='videoType'><SelectValue placeholder='Choose a format' /></SelectTrigger><SelectContent><SelectItem value='creative'>Creative edit</SelectItem><SelectItem value='social'>Social short-form</SelectItem><SelectItem value='commercial'>Commercial</SelectItem><SelectItem value='course'>Course or presentation</SelectItem></SelectContent></Select></div>
      <div className='space-y-2'><Label htmlFor='footageChoice'>Footage *</Label><Select value={requirements.footageChoice} onValueChange={(value) => onChange({ footageChoice: value })}><SelectTrigger id='footageChoice'><SelectValue placeholder='Choose footage status' /></SelectTrigger><SelectContent><SelectItem value='has_footage'>I have the footage</SelectItem><SelectItem value='needs_stock'>I need stock footage</SelectItem><SelectItem value='needs_shoot'>I need a shoot</SelectItem></SelectContent></Select></div>
    </div>}

    <div className='grid gap-4 sm:grid-cols-2'>
      <div className='space-y-2'><Label htmlFor='estimatedDuration'>{isLocationService ? 'Preferred timing *' : 'Estimated timeline'}</Label><Input id='estimatedDuration' value={requirements.estimatedDuration} onChange={(event) => onChange({ estimatedDuration: event.target.value })} placeholder={isLocationService ? 'e.g. Tomorrow morning' : 'e.g. 3 days or 1 week'} /></div>
      {(isScriptwriting || serviceId === 'marketing') && <div className='space-y-2'><Label htmlFor='estimatedWordCount'>Estimated volume</Label><Input id='estimatedWordCount' type='number' min='0' value={requirements.estimatedWordCount || ''} onChange={(event) => onChange({ estimatedWordCount: Number(event.target.value) || 0 })} placeholder='Optional' /></div>}
      {!isScriptwriting && !isVideoEditing && !isLocationService && serviceId !== 'marketing' && <div className='space-y-2'><Label htmlFor='targetAudience'>Audience or preferences</Label><Input id='targetAudience' value={requirements.targetAudience} onChange={(event) => onChange({ targetAudience: event.target.value })} placeholder='Who is this for?' /></div>}
    </div>
  </div>;
};

export default ServiceRequirementsForm;
