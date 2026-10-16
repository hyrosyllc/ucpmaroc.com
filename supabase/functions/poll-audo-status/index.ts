// In supabase/functions/poll-audo-status/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders as sharedCors } from '../_shared/cors.ts'
const corsHeaders = (_origin: string | null) => sharedCors

serve(async (req) => {
  const requestOrigin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(requestOrigin) })
  }

  try {
    // 1. Get Secrets
    const AI_API_KEY = Deno.env.get('AUDO_API_KEY')
    if (!AI_API_KEY) throw new Error('Missing AUDO_API_KEY secret')
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Missing Supabase secrets')

    // 2. Get recordingId from request and validate user
    const { recordingId } = await req.json()
    if (!recordingId) throw new Error('Missing recordingId')

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY)
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Authentication error')

    // 3. Get the recording and its audo_job_id
    // This also serves as a security check: user can only poll their own recordings.
    const { data: recording } = await supabaseAdmin
      .from('actor_recordings')
      .select('id, audo_job_id, status, actors(user_id)')
      .eq('id', recordingId)
      .eq('actors.user_id', user.id) // Security check!
      .single()

    if (!recording) throw new Error('Recording not found or permission denied')
    if (!recording.audo_job_id) throw new Error('Recording has no audo_job_id')
    if (recording.status !== 'cleaning') return new Response(JSON.stringify({ status: recording.status }), { headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' }})

    const jobId = recording.audo_job_id;

    // 4. Poll Audo.ai for the job status
    const statusResponse = await fetch(`https://api.audo.ai/v1/remove-noise/${jobId}/status`, {
      method: 'GET',
      headers: { 'x-api-key': AI_API_KEY },
    });

    if (!statusResponse.ok) {
      throw new Error(`Audo.ai status check failed: ${statusResponse.status}`)
    }

    const result = await statusResponse.json();
    const audoStatus = result.state; // 'succeeded', 'failed', 'in_progress', 'queued'

    // 5. Update database if the job is finished
    if (audoStatus === 'succeeded') {
      // Audo returns a partial path, e.g., "dl/artifacts/clean/..."
      // The full URL is https://api.audo.ai/v1/
      const downloadUrl = `https://api.audo.ai/v1/${result.downloadPath}`
      
      await supabaseAdmin
        .from('actor_recordings')
        .update({ status: 'cleaned', cleaned_audio_url: downloadUrl })
        .eq('id', recordingId)

      console.log(`Job ${jobId} succeeded. URL: ${downloadUrl}`);

    } else if (audoStatus === 'failed') {
      await supabaseAdmin
        .from('actor_recordings')
        .update({ status: 'error' })
        .eq('id', recordingId)
        
      console.error(`Job ${jobId} failed. Reason: ${result.reason}`);
    }

    // 6. Return the current Audo status to the client
    return new Response(JSON.stringify({ status: audoStatus }), {
      headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in poll-audo-status function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})