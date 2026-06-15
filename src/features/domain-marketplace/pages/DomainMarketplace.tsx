import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, CheckCircle2, Sparkles, Search, Lock } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface Domain {
  id: string;
  name: string;
  category: string;
  price_buy: number;
  price_rent_standard: number;
  price_rent_deal: number;
  status: 'available' | 'sold' | 'rented';
}

const DomainMarketplace = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    // FETCH ALL DOMAINS (Sorted by: Available first, then Rented, then Sold)
    const { data } = await supabase
      .from('store_domains')
      .select('*')
      .order('status', { ascending: true }) // 'available' comes before 'sold' alphabetically
      .order('created_at', { ascending: false });
      
    if (data) setDomains(data);
    setLoading(false);
  };

  const filteredDomains = domains.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 pb-20 px-4">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6">
            <Sparkles className="w-3 h-3" /> Premium Assets
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
           Find Your Digital Identity.
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
           Premium domains available for purchase or flexible monthly rental. 
           Start your brand today without the heavy upfront cost.
        </p>

        {/* SEARCH BAR */}
        <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input 
                className="pl-10 h-12 bg-slate-900/50 border-slate-800 focus:border-blue-500 rounded-full text-lg" 
                placeholder="Search domains (e.g. 'agency', 'tech')..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* DOMAIN GRID */}
      <div className="container mx-auto max-w-7xl">
        {loading ? (
             <div className="text-center py-20">Loading marketplace...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDomains.map((domain) => {
                    const isSold = domain.status === 'sold';
                    const isRented = domain.status === 'rented';
                    const isAvailable = domain.status === 'available';

                    return (
                        <Card 
                            key={domain.id} 
                            className={`group relative overflow-hidden border-slate-800 transition-all duration-300 
                                ${isSold ? 'bg-slate-950 opacity-60 grayscale' : 'bg-slate-900/50 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/20'}
                            `}
                        >
                            {/* Card Gradient Hover Effect (Only for Available) */}
                            {isAvailable && (
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            )}

                            <CardHeader className="pb-4 relative z-10">
                                <div className="flex justify-between items-center mb-2">
                                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px] uppercase tracking-wider">
                                        {domain.category || 'General'}
                                    </Badge>
                                    
                                    {/* STATUS BADGES */}
                                    {isAvailable && <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-none">Available</Badge>}
                                    {isSold && <Badge variant="secondary" className="bg-slate-800 text-slate-400">SOLD</Badge>}
                                    {isRented && <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">RENTED</Badge>}
                                </div>
                                
                                <CardTitle className={`text-3xl font-black text-center py-6 ${isSold ? 'text-slate-600 line-through' : 'text-white group-hover:text-blue-400'} transition-colors`}>
                                    {domain.name}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="pt-0 space-y-4 relative z-10">
                                {/* Pricing Option A */}
                                <div className={`flex justify-between items-center text-sm p-3 rounded-lg border ${isSold ? 'border-slate-900 bg-transparent' : 'bg-slate-950/50 border-slate-800'}`}>
                                    <span className="text-slate-400">Buy Now</span>
                                    <span className={`font-bold text-lg ${isSold ? 'text-slate-600' : 'text-white'}`}>{domain.price_buy} MAD</span>
                                </div>

                                {/* Pricing Option B & C Combined Visual */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className={`p-2 rounded-lg border text-center ${isSold ? 'border-slate-900 opacity-50' : 'bg-slate-950/30 border-slate-800'}`}>
                                        <div className="text-xs text-slate-500 mb-1">Standard Rent</div>
                                        <div className={`font-semibold ${isSold ? 'text-slate-600' : 'text-white'}`}>{domain.price_rent_standard} <span className="text-[10px]">MAD/mo</span></div>
                                    </div>
                                    <div className={`p-2 rounded-lg border text-center ${isSold ? 'border-slate-900 opacity-50' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                                        <div className={`text-xs mb-1 font-bold ${isSold ? 'text-slate-600' : 'text-yellow-500'}`}>Deal + Build</div>
                                        <div className={`font-bold ${isSold ? 'text-slate-600' : 'text-yellow-400'}`}>{domain.price_rent_deal} <span className="text-[10px]">MAD/mo</span></div>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="relative z-10 pt-2">
                                {isAvailable ? (
                                    <Button 
                                        className="w-full h-12 text-lg font-bold bg-white text-black hover:bg-slate-200" 
                                        onClick={() => navigate(`/marketplace/domains/${domain.id}/checkout`)}
                                    >
                                        Acquire Domain <ShoppingCart className="ml-2 w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button disabled className="w-full h-12 text-lg font-bold bg-slate-800 text-slate-500 border border-slate-700">
                                        <Lock className="ml-2 w-4 h-4 mr-2" /> {isSold ? 'No Longer Available' : 'Currently Rented'}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};

export default DomainMarketplace;
