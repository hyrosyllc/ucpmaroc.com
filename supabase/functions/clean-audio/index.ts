// In supabase/functions/clean-audio/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders as sharedCors } from '../_shared/cors.ts'
const corsHeaders = (_origin: string | null) => sharedCors

serve(async (req) => {
  const requestOrigin = req.headers.get('Origin')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(requestOrigin) })
  }

  let recordingId: string | null = null

  try {
    // 1. Get Secrets
    const AI_API_KEY = Deno.env.get('AUDO_API_KEY')
    if (!AI_API_KEY) throw new Error('Missing AUDO_API_KEY secret')
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Missing Supabase secrets')

    // We no longer need the WEBHOOK_URL variable for this function
    // const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/audo-webhook`

    const body = await req.json()
    recordingId = body.recordingId
    if (!recordingId) throw new Error('Missing recordingId')

    // 2. Create Supabase Admin Client
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY)

    // 3. Verify User & Get Recording
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error(`Authentication error: ${userError?.message || 'User not found'}`)

    const { data: actor } = await supabaseAdmin.from('actors').select('id').eq('user_id', user.id).single()
    if (!actor) throw new Error('Actor profile not found')

    const { data: recording, error: recError } = await supabaseAdmin
      .from('actor_recordings')
      .select('id, raw_audio_url, status')
      .eq('id', recordingId)
      .eq('actor_id', actor.id)
      .single()

    if (recError || !recording) throw new Error('Recording not found or permission denied')
    if (recording.status === 'cleaning') throw new Error('Audio is already being cleaned')

    // --- 4. Audo.ai ASYNC API Call ---
    console.log(`Starting Audo.ai job for ${recording.raw_audio_url}...`)

    const jobResponse = await fetch('https://api.audo.ai/v1/remove-noise', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_API_KEY
      },
      body: JSON.stringify({
        input: recording.raw_audio_url, // <-- Send ONLY the input key
        outputExtension: 'mp3' // <--- ADD THIS
        // webhookUrl: WEBHOOK_URL // We are not using webhooks for now
      })
    
    })

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text()
      throw new Error(`Audo.ai job creation failed: ${jobResponse.status} ${errorText}`)
    }

    const job = await jobResponse.json()
    const jobId = job.jobId
    if (!jobId) throw new Error("Audo.ai did not return a jobId");

    console.log("Audo.ai job created:", jobId)

    // 5. Set Status to 'cleaning' and save the Job ID
    const { error: updateError } = await supabaseAdmin
      .from('actor_recordings')
      .update({ 
        status: 'cleaning',
        audo_job_id: jobId
      })
      .eq('id', recordingId)

    if (updateError) throw updateError;
    
    // 6. Return success (202 Accepted)
    // *** MODIFICATION: Return the jobId to the client ***
    return new Response(JSON.stringify({ message: "Cleaning job started", jobId: jobId }), {
      headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: 202,
    })

  } catch (error) {
    // 7. Handle errors
    if (recordingId) {
      try {
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
        await supabaseAdmin.from('actor_recordings').update({ status: 'error' }).eq('id', recordingId);
      } catch (e) { /* ignore cleanup error */ }
    }

    console.error("Error in clean-audio function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders(requestOrigin), 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})