import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Wallet, CreditCard, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { supabase } from '@/supabaseClient';
import { StripeCheckoutForm } from '@/features/ecommerce';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Appearance } from '@stripe/stripe-js';
import { getMarketplaceServiceDefinitions, getServiceIcon, getServiceLabel, loadMarketplaceAllowedServiceIds } from '@/features/talent-marketplace/serviceCatalog';

// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
import { Alert, AlertDescription } from "@/components/ui/alert";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface Actor {
  id: string;
  ActorEmail: string;
  ActorName: string;
  BaseRate_per_Word: string;
  WebMultiplier: string;
  BroadcastMultiplier: string;
  // Service flags
  service_voiceover?: boolean;
  service_scriptwriting?: boolean;
  service_videoediting?: boolean;
  // Service details
  service_script_rate?: number;
  service_video_rate?: number;
  service_script_description?: string | null;
  service_video_description?: string | null;
}

interface ModalProps {
  actor: Actor;
  onClose: () => void;
    initialService?: string | null;

}

type ServiceType = string;

const QuoteCalculatorModal: React.FC<ModalProps> = ({ actor, onClose, initialService }) => {
  const { theme } = useTheme();
  
  const [step, setStep] = useState(0); 
  const [serviceType, setServiceType] = useState<ServiceType | null>(null); 
  const [status, setStatus] = useState('');
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [scriptText, setScriptText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [usage, setUsage] = useState('web');
  // Removed videoSync state
  const [totalPrice, setTotalPrice] = useState(0);
  const [minimumFeeMessage, setMinimumFeeMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank' | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSettingUpStripe, setIsSettingUpStripe] = useState(false);
  const [projectDescription, setProjectDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [estimatedWordCount, setEstimatedWordCount] = useState(0);
  const [videoType, setVideoType] = useState('creative');
  const [footageChoice, setFootageChoice] = useState('has_footage');
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '', company: '' });
  const [availableServices, setAvailableServices] = useState<{ id: ServiceType; name: string; icon: React.ElementType; description?: string }[]>([]);
  const orderId = `VO-${Date.now()}`;

  useEffect(() => {
    let mounted = true;
    loadMarketplaceAllowedServiceIds().then(() => {
      if (!mounted) return;

      const services = getMarketplaceServiceDefinitions(actor)
        .filter((service) => service.enabled)
        .map((service) => ({
          id: service.id as ServiceType,
          name: service.label,
          icon: getServiceIcon(service.id),
          description: service.description,
        }));

      setAvailableServices(services);

      if (initialService) {
        setServiceType(initialService);
        setStep(1);
      } else if (services.length === 1) {
        setServiceType(services[0].id);
        setStep(1);
      } else {
        setStep(0);
      }
    });

    return () => {
      mounted = false;
    };
  }, [actor, initialService]);

  useEffect(() => {
    const words = scriptText.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [scriptText]);

  useEffect(() => {
    const baseRate = parseFloat(actor.BaseRate_per_Word) || 0;
    const webMultiplier = parseFloat(actor.WebMultiplier) || 1;
    const broadcastMultiplier = parseFloat(actor.BroadcastMultiplier) || 1;
    
    const basePrice = wordCount * baseRate;
    const usagePrice = basePrice * (usage === 'web' ? webMultiplier : broadcastMultiplier);
    const finalPrice = usagePrice; // Removed videoSyncFee

    const minimumFee = 10.00;
    if (finalPrice > 0 && finalPrice < minimumFee) {
        setTotalPrice(minimumFee);
        setMinimumFeeMessage(`(Minimum order fee of ${minimumFee.toFixed(2)} MAD applied)`);
    } else {
        setTotalPrice(finalPrice);
        setMinimumFeeMessage('');
    }
  }, [wordCount, usage, actor]); // Removed videoSync dependency

  const handleClientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientInfo({ ...clientInfo, [e.target.name]: e.target.value });
  };

  const createOrderInSupabase = async (
    currentServiceType: ServiceType,
    orderStatus: string,
    finalPrice: number | null,
    method: 'stripe' | 'bank' | null,
    paymentIntentId: string | null = null
  ) => {
    const orderDataToInsert: any = {
      order_id_string: orderId,
      actor_id: actor?.id,
      client_name: clientInfo.name,
      client_email: clientInfo.email.toLowerCase(),
      script: projectDescription || scriptText,
      status: orderStatus,
      service_type: currentServiceType,
      payment_method: method,
      stripe_payment_intent_id: paymentIntentId,
      total_price: finalPrice,
    };

    if (currentServiceType === 'voice_over') {
      orderDataToInsert.word_count = wordCount;
      orderDataToInsert.usage = usage;
    } else if (currentServiceType === 'scriptwriting') {
      orderDataToInsert.word_count = estimatedWordCount;
      orderDataToInsert.quote_est_duration = estimatedDuration;
    } else if (currentServiceType === 'video_editing') {
      orderDataToInsert.quote_video_type = videoType;
      orderDataToInsert.quote_footage_choice = footageChoice;
    }
    
    const { data: newOrder, error: invokeError } = await supabase.functions.invoke(
        'create-order',
        { body: orderDataToInsert }
    );

    if (invokeError) throw invokeError;
    if (newOrder && newOrder.error) throw new Error(newOrder.error);
    if (!newOrder || !newOrder.id) throw new Error("Failed to create order.");

    setNewOrderId(newOrder.id);
    return newOrder;
  };

  const sendEmails = async (newOrder: any, isQuote: boolean) => {
    try {
      const adminParams = {
          orderId: newOrder.order_id_string,
          actorName: actor.ActorName,
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          totalPrice: isQuote ? "N/A (Quote Request)" : totalPrice.toFixed(2),
          serviceType: newOrder.service_type,
          script: newOrder.script,
      };

      const clientParams = {
          orderId: newOrder.order_id_string,
          order_uuid: newOrder.id,
          actorName: actor.ActorName,
          totalPrice: isQuote ? "N/A (Quote Request)" : totalPrice.toFixed(2),
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          isQuote: isQuote,
      };

      await emailjs.send('service_r3pvt1s', 'template_o4hehdi', adminParams, 'I51tDIHsXYKncMQpO');
      await emailjs.send('service_r3pvt1s', 'template_shq9k38', clientParams, 'I51tDIHsXYKncMQpO');

    } catch (error) {
      console.error("Email sending failed:", error);
    }
  };

  const handleConfirmation = async () => {
    if (!serviceType) return;

    if (paymentMethod !== 'bank') return;
    if (!clientInfo.name || !clientInfo.email || !clientInfo.phone) {
        setStatus("Please fill in all required (*) details."); return;
    }
    setStatus('Processing Bank Transfer Order...');
    try {
        const newOrder = await createOrderInSupabase(serviceType, 'Awaiting Payment', totalPrice, 'bank');
        await sendEmails(newOrder, false);
        setStatus('Order Confirmed!'); setStep(3); // Jump to final step (now 3)
    } catch (err) {
        const error = err as Error;
        setStatus(`An error occurred: ${error.message}`); setStep(3);
    }
  };

  const onSuccessfulStripePayment = async (intentId: string) => {
    setStatus('Processing Payment...');
    try {
        const newOrder = await createOrderInSupabase(serviceType, 'In Progress', totalPrice, 'stripe', intentId);
        await sendEmails(newOrder, false);
        setStatus('Payment Successful! Your order is now In Progress.');
    } catch (err) {
        setStatus(`Payment confirmed, but order update failed: ${(err as Error).message}.`);
    }
    setStep(3);
  };

  const handlePaymentMethodChange = async (method: 'stripe' | 'bank') => {
    if (method === paymentMethod) return;
    setPaymentMethod(method); setStatus('');
    if (method === 'stripe') {
        setIsSettingUpStripe(true);
        setStatus('Initializing secure payment...');
        try {
            const { data, error: invokeError } = await supabase.functions.invoke('create-payment-intent', {
                body: { amount: totalPrice },
            });
            if (invokeError) throw invokeError;
            if (data.error) throw new Error(data.error);
            if (!data.client_secret) throw new Error("Payment client secret is missing.");
            setClientSecret(data.client_secret);
            setStatus('');
        } catch (error) {
            setStatus(`Error initializing payment: ${(error as Error).message}.`);
            setClientSecret(null); setPaymentMethod(null);
        } finally {
            setIsSettingUpStripe(false);
        }
    }
  };
  
  const handleQuoteSubmit = async () => {
    if (!serviceType) return;

    if (!clientInfo.name || !clientInfo.email || !clientInfo.phone) {
        setStatus("Please fill in all required (*) details."); return;
    }
    if (!projectDescription) {
        setStatus("Please provide a project description."); return;
    }
    setStatus('Submitting Quote Request...');
    setIsSettingUpStripe(true);
    try {
        const newOrder = await createOrderInSupabase(serviceType, 'awaiting_offer', null, null);
        await sendEmails(newOrder, true);
        setStatus('Quote Request Submitted!'); setStep(3);
    } catch (err) {
        setStatus(`An error occurred: ${(err as Error).message}`); setStep(3);
    } finally {
        setIsSettingUpStripe(false);
    }
  };

  const stripeAppearance: Appearance = {
    theme: theme === 'dark' ? 'night' : 'stripe',
    labels: 'floating'
  };

  const ProgressBar = ({ currentStep }: { currentStep: number }) => {
    // Simplified steps for all services
    const steps = serviceType === 'voice_over'
      ? ["Scope", "Details & Payment", "Confirm"]
      : ["Service", "Details", "Submit"];
    
    // Map current step to progress
    // Voice Over: 0 (Select) -> 1 (Scope) -> 2 (Payment) -> 3 (Confirm)
    // Other: 0 (Select) -> 1 (Details) -> 2 (Confirm/Submit)
    
    return (
        <div className="flex items-center justify-between mb-8">
            {steps.map((name, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                            currentStep > index + 1 ? 'bg-green-500' :
                            currentStep === index + 1 ? 'bg-primary' : 'bg-muted'
                        }`}>
                            {currentStep > index + 1 ? <CheckCircle size={18} className="text-primary-foreground" /> : <span className={`font-bold ${currentStep === index + 1 ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{index + 1}</span>}
                        </div>
                        <p className={`text-xs mt-2 transition-colors ${currentStep >= index + 1 ? 'text-foreground' : 'text-muted-foreground'}`}>{name}</p>
                    </div>
                    {index < steps.length - 1 && <div className={`flex-grow h-0.5 mx-2 ${currentStep > index + 1 ? 'bg-primary' : 'bg-muted'}`}></div>}
                </React.Fragment>
            ))}
        </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Service Selection
        if (availableServices.length === 0) {
          return (
            <div className="text-center py-12">
              <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Actor Unavailable</h2>
              <p className="text-muted-foreground">
                This actor is currently not accepting new orders or requests for any services. 
                Please check back later or browse other talent.
              </p>
              <Button onClick={onClose} className="mt-6">Close</Button>
            </div>
          );
        }

        return (
          <div>
            <ProgressBar currentStep={1} />
            <h2 className="text-3xl font-bold text-center mb-6 text-foreground">Select a Service</h2>
            <div className="space-y-4">
              {availableServices.map(service => (
                <Card 
                  key={service.id}
                  onClick={() => { setServiceType(service.id); setStep(1); }}
                  className="p-4 transition flex items-center gap-4 hover:border-primary hover:bg-accent cursor-pointer"
                >
                  <service.icon className="w-6 h-6 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-foreground">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">Get a {service.id === 'voice_over' ? 'price' : 'quote'} for {service.name.toLowerCase()}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      
      case 1: // Dynamic Scope/Details
        if (serviceType === 'voice_over') {
          return (
            <div>
              <ProgressBar currentStep={1} />
              <h2 className="text-3xl font-bold text-center mb-6 text-foreground">Project Scope</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="scriptText">Paste Your Script Here</Label>
                  <Textarea id="scriptText" rows={5} value={scriptText} onChange={e => setScriptText(e.target.value)} placeholder="Your script..." />
                  <p className="text-right text-muted-foreground text-sm mt-1">Word Count: {wordCount}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usage">Usage Rights</Label>
                  <Select value={usage} onValueChange={(value) => setUsage(value)}>
                    <SelectTrigger id="usage"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web & Social Media (1 Year)</SelectItem>
                      <SelectItem value="broadcast">TV, Radio & Cinema (1 Year)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                {availableServices.length > 1 && <Button onClick={() => setStep(0)} variant="outline" className="w-full">Back</Button>}
                <Button onClick={() => setStep(2)} className="w-full">Next</Button>
              </div>
            </div>
          );
        }

        const selectedService = availableServices.find((item) => item.id === serviceType);
        const serviceLabel = getServiceLabel(serviceType || 'service');

        return (
          <div>
            <ProgressBar currentStep={2} />
            <h2 className="text-3xl font-bold text-center mb-6 text-foreground">{selectedService?.name || serviceLabel} Details</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Project Description *</Label>
                <Textarea id="projectDescription" rows={5} value={projectDescription} onChange={e => setProjectDescription(e.target.value)} placeholder={`Tell us about the ${serviceLabel.toLowerCase()} request, timeline, scope, and goals...`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">Estimated Timeline</Label>
                  <Input id="estimatedDuration" type="text" value={estimatedDuration} onChange={e => setEstimatedDuration(e.target.value)} placeholder="e.g., 3 days or 1 week" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedWordCount">Estimated Volume</Label>
                  <Input id="estimatedWordCount" type="number" value={estimatedWordCount} onChange={e => setEstimatedWordCount(Number(e.target.value))} placeholder="Optional" />
                </div>
              </div>

              {selectedService?.description && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="flex gap-4 mt-8">
              <Button onClick={() => setStep(0)} variant="outline" className="w-full">Back</Button>
              <Button onClick={() => setStep(2)} className="w-full">Next</Button>
            </div>
          </div>
        );

      case 2: // Details & Payment (Dynamic)
        const canConfirmBank = paymentMethod === 'bank' && clientInfo.name && clientInfo.email && clientInfo.phone;
        const isQuoteFlow = serviceType !== 'voice_over';
        const selectedServiceLabel = getServiceLabel(serviceType || 'service');
        return (
          <div>
            <ProgressBar currentStep={isQuoteFlow ? 3 : 2} />
            <h2 className="text-3xl font-bold text-center mb-6 text-foreground">
              {isQuoteFlow ? `${selectedServiceLabel} Details` : "Your Details & Payment"}
            </h2>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input type="text" id="name" name="name" placeholder="Your Full Name" required value={clientInfo.name} onChange={handleClientInfoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input type="email" id="email" name="email" placeholder="your@email.com" required value={clientInfo.email} onChange={handleClientInfoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input type="tel" id="phone" name="phone" placeholder="+123456789" required value={clientInfo.phone} onChange={handleClientInfoChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name (Optional)</Label>
                  <Input type="text" id="company" name="company" placeholder="Your Company" value={clientInfo.company} onChange={handleClientInfoChange} />
                </div>
              </CardContent>
            </Card>

            {isQuoteFlow ? (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground text-center mb-4">You will receive an offer from the actor after submitting your request.</p>
                <Button
                  type="button" onClick={handleQuoteSubmit}
                  disabled={!clientInfo.name || !clientInfo.email || !clientInfo.phone || isSettingUpStripe}
                  className="w-full" size="lg"
                >
                  {isSettingUpStripe ? 'Submitting...' : 'Submit Quote Request'}
                </Button>
              </div>
            ) : (
              <div className="pt-6 mt-6 border-t space-y-4">
                <Label>Choose Payment Method *</Label>
                <RadioGroup value={paymentMethod || ""} onValueChange={(value) => handlePaymentMethodChange(value as 'stripe' | 'bank')}>
                  <Card className={`transition hover:border-primary cursor-pointer ${paymentMethod === 'stripe' ? 'border-primary bg-accent' : ''}`}>
                    <Label htmlFor="stripe" className="flex items-center gap-4 p-4 cursor-pointer">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <CreditCard className="w-6 h-6 text-primary flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-foreground">Pay by Card (Stripe)</h3>
                        <p className="text-sm text-muted-foreground">Securely pay with your credit/debit card.</p>
                      </div>
                    </Label>
                  </Card>
                  <Card className={`transition hover:border-primary cursor-pointer ${paymentMethod === 'bank' ? 'border-primary bg-accent' : ''}`}>
                    <Label htmlFor="bank" className="flex items-center gap-4 p-4 cursor-pointer">
                      <RadioGroupItem value="bank" id="bank" />
                      <Wallet className="w-6 h-6 text-primary flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-foreground">Bank Transfer</h3>
                        <p className="text-sm text-muted-foreground">Receive payment details and pay manually.</p>
                      </div>
                    </Label>
                  </Card>
                </RadioGroup>
                
                {isSettingUpStripe && <p className="text-center text-sm text-muted-foreground mt-4">{status || 'Initializing...'}</p>}
                {!isSettingUpStripe && status && !clientSecret && paymentMethod === 'stripe' && <p className="text-center text-sm text-destructive mt-4">{status}</p>}

                {paymentMethod === 'stripe' && clientSecret && !isSettingUpStripe && (
                  <div className="mt-4 pt-4 border-t">
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
                      <StripeCheckoutForm onSuccessfulPayment={onSuccessfulStripePayment} />
                    </Elements>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-6 mt-6 border-t">
              <Button type="button" onClick={() => setStep(1)} variant="outline" className="w-full">Back</Button>
              {serviceType === 'voice_over' && paymentMethod === 'bank' && (
                 <Button
                   type="button" onClick={handleConfirmation}
                   disabled={!canConfirmBank || isSettingUpStripe}
                   className="w-full"
                 >
                   Confirm Bank Transfer
                </Button>
              )}
            </div>
          </div>
        );

      case 3: // Final Confirmation
        const isQuote = status.includes('Quote Request Submitted');
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <ProgressBar currentStep={isQuote ? 3 : 3} />
            <div className="text-center">
              <h2 className={`text-3xl font-bold mb-4 ${status.includes('Error') ? 'text-destructive' : 'text-green-400'}`}>{status || 'Processing...'}</h2>
              {status.includes('Successful') || status.includes('Confirmed') || status.includes('Submitted') ? (
                <div>
                  <p className="text-muted-foreground mb-6">
                    {isQuote
                      ? "Thank you! The actor has been notified and will send you an offer shortly."
                      : "Thank you! A confirmation email with the next steps is on its way."
                    }
                  </p>
                  {newOrderId && (
                    <Button asChild size="lg" className="w-full text-lg h-12">
                      <Link to={`/order/${newOrderId}`}>
                        {isQuote ? "View Your Quote Request" : "View Your Order Details"}
                      </Link>
                    </Button>
                  )}
                </div>
              ) : status.includes('Error') ? (
                <p className="text-muted-foreground my-4">There was an issue processing your request. Please check the details and try again, or contact support.</p>
              ) : null}

              {status === 'Order Confirmed!' && paymentMethod === 'bank' && !isQuote && (
                <Card className="text-left mt-6 bg-muted/50">
                  <CardContent className="p-6">
                    <p className="mb-2"><span className="font-bold text-muted-foreground">Order ID:</span> {orderId}</p>
                    <p className="mb-4"><span className="font-bold text-muted-foreground">Amount Due:</span> {totalPrice.toFixed(2)} MAD</p>
                    <p className="font-bold text-foreground mt-4">IMPORTANT: Please use your Order ID ({orderId}) as the payment reference.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // --- NEW RENDER: Full-screen split layout ---
  return (
    <div className="fixed inset-0 z-50 grid h-[100dvh] w-full grid-cols-1 md:grid-cols-2">
      
      {/* --- Left (Visual) Pane - Desktop Only --- */}
      <div className="hidden md:flex flex-col bg-card p-8 text-card-foreground">
        <h2 className="text-2xl font-semibold">Booking for:</h2>
        <h1 className="text-5xl font-bold text-primary">{actor.ActorName}</h1>
        
        {step > 0 && serviceType === 'voice_over' && (
          <div className="mt-12">
            <p className="text-lg text-muted-foreground">Total Price</p>
            <p className="text-6xl font-bold">
              {totalPrice.toFixed(2)} <span className="text-4xl text-muted-foreground">MAD</span>
            </p>
            {minimumFeeMessage && (
              <p className="text-sm text-yellow-400">{minimumFeeMessage}</p>
            )}
          </div>
        )}
        {step > 0 && serviceType !== 'voice_over' && (
          <div className="mt-12">
            <p className="text-lg text-muted-foreground">Service</p>
            <p className="text-4xl font-bold text-primary">
              {serviceType === 'scriptwriting' ? 'Script Writing' : 'Video Editing'}
            </p>
            <p className="text-lg text-muted-foreground mt-4">
              You will receive a custom quote from {actor.ActorName} after submitting your project details.
            </p>
          </div>
        )}
        <div className="mt-auto">
          <p className="text-muted-foreground">You're in good hands.</p>
        </div>
      </div>

      {/* --- Right (Form) Pane - Scrolls --- */}
      <div className="bg-background flex flex-col h-full">
        {/* --- Mobile-Only Header --- */}
        <div className="p-4 border-b md:hidden flex-shrink-0">
          <p className="text-center text-sm text-muted-foreground">Booking for: <span className="font-bold text-primary">{actor.ActorName}</span></p>
          {serviceType === 'voice_over' && (
            <p className="text-center text-3xl font-bold text-primary mt-1">
              {totalPrice.toFixed(2)} MAD
            </p>
          )}
          {serviceType !== 'voice_over' && step > 0 && (
            <p className="text-center text-xl font-bold text-foreground mt-1">
              Quote Request
            </p>
          )}
        </div>

        {/* --- Close Button --- */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClose} 
          className="absolute top-4 right-4 z-10"
        >
          <X size={24} />
        </Button>

        {/* --- Scrollable Content Area --- */}
        <ScrollArea className="flex-grow h-0">
          <div className="p-6 sm:p-8 md:p-12 max-w-2xl mx-auto w-full">
            {renderStep()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default QuoteCalculatorModal;