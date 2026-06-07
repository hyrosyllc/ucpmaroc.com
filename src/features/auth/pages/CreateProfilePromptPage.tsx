// In src/pages/CreateProfilePromptPage.tsx

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from "@/supabaseClient";
import { User, Briefcase, AlertTriangle } from 'lucide-react';

const CreateProfilePromptPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get the role we need to create ('client' or 'actor') from the navigation state
    const { roleToCreate } = location.state as { roleToCreate: 'client' | 'actor' };

    if (!roleToCreate) {
        // If someone lands here by mistake
        navigate('/');
        return null;
    }

    const isClient = roleToCreate === 'client';
    const title = isClient ? 'Create Client Profile' : 'Create Actor Profile';
    const description = isClient 
        ? "You don't have a client profile yet. Create one to hire talent and manage your orders."
        : "You don't have an actor profile yet. Create one to showcase your voice and get hired.";
    const icon = isClient ? <User size={40} /> : <Briefcase size={40} />;

    const handleCreateProfile = async () => {
        setLoading(true);
        setError('');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('You are not logged in. Redirecting to login...');
            setTimeout(() => navigate('/client-auth'), 2000);
            return;
        }

        let insertError: any = null;

        if (isClient) {
            // Insert into 'clients' table
            const { error } = await supabase.from('clients').insert({
                user_id: user.id,
                full_name: user.user_metadata?.full_name || user.email // Use name from auth, or email
            });
            insertError = error;
        } else {
            // Insert into 'actors' table
            const { error } = await supabase.from('actors').insert({
                user_id: user.id,
                ActorName: user.user_metadata?.full_name || 'New Actor', // Use name or placeholder
                ActorEmail: user.email,
                // Add default values for any NOT NULL columns in 'actors'
                Language: 'English (US)', 
                Gender: 'Male',
                Tags: 'Conversational',
                BaseRate_per_Word: 1,
                revisions_allowed: 2,
                WebMultiplier: 1.5,
                BroadcastMultiplier: 3
            });
            insertError = error;
        }

        if (insertError) {
            console.error("Error creating profile:", insertError);
            setError(`Failed to create profile: ${insertError.message}`);
            setLoading(false);
        } else {
            // Success! Redirect to the dashboard they were trying to access.
            navigate(isClient ? '/client-dashboard' : '/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
            <div className="w-full max-w-md bg-card p-10 rounded-lg border border text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-full mb-6 border border-purple-500/50 text-purple-400">
                    {icon}
                </div>
                
                <h1 className="text-3xl font-bold text-foreground mb-4">{title}</h1>
                <p className="text-muted-foreground mb-8">{description}</p>

                {error && (
                    <div className="p-3 bg-red-900/50 border border-red-700 rounded-md text-sm text-red-300 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    onClick={handleCreateProfile}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 rounded-md font-semibold text-lg transition-opacity disabled:opacity-50"
                >
                    {loading ? 'Creating Profile...' : `Create ${roleToCreate} Profile`}
                </button>

                <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-muted-foreground mt-6">
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default CreateProfilePromptPage;