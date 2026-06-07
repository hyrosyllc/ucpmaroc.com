import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ContractDocument } from '../components/ContractPDF';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Download, Home, FileText } from 'lucide-react';

export default function DomainThankYouPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [domain, setDomain] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Get the Order
      const { data: orderData } = await supabase.from('store_orders').select('*').eq('id', id).single();
      
      if (orderData) {
        setOrder(orderData);
        // 2. Get the Domain details using the domain_id from the order
        const { data: domainData } = await supabase.from('store_domains').select('*').eq('id', orderData.domain_id).single();
        setDomain(domainData);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-20 text-center">Generating your documents...</div>;

  return (
    <div className="min-h-screen bg-background pt-20 px-4 flex flex-col items-center">
      <div className="max-w-2xl w-full text-center space-y-8">
        
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-4xl font-bold">Order Confirmed!</h1>
        <p className="text-xl text-slate-500">
            You have successfully reserved <span className="text-blue-500 font-bold">{domain?.name}</span>.
        </p>

        <Card className="bg-slate-50 border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5" /> Your Legal Contract
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">
                    We have generated a legal agreement including your digital signature. 
                    Please download it for your records.
                </p>

                {/* THE DOWNLOAD BUTTON */}
                {order && domain && (
                    <PDFDownloadLink 
                        document={<ContractDocument order={order} domain={domain} />} 
                        fileName={`Contract_${domain.name}_${order.buyer_name}.pdf`}
                        className="w-full block"
                    >
                        {({ loading }) => (
                            <Button className="w-full h-12 text-lg" disabled={loading}>
                                <Download className="mr-2 w-5 h-5" />
                                {loading ? 'Generating PDF...' : 'Download Signed Contract'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                )}
            </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
            <Button variant="outline" asChild>
                <Link to="/marketplace/domains">Back to Store</Link>
            </Button>
            <Button variant="ghost" asChild>
                <Link to="/"> <Home className="mr-2 w-4 h-4" /> Go Home</Link>
            </Button>
        </div>

      </div>
    </div>
  );
}
