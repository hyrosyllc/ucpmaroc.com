    import React, { useState } from 'react';
    import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

    interface CheckoutProps {
        onSuccessfulPayment: (paymentIntentId: string) => void;
    }

    const StripeCheckoutForm: React.FC<CheckoutProps> = ({ onSuccessfulPayment }) => {
        const stripe = useStripe();
        const elements = useElements();
        const [isProcessing, setIsProcessing] = useState(false);
        const [errorMessage, setErrorMessage] = useState('');

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!stripe || !elements) return;
            setIsProcessing(true);

            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required', // Handle the result here instead of redirecting
            });

            if (error) {
                setErrorMessage(error.message || 'An unexpected error occurred.');
                setIsProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                onSuccessfulPayment(paymentIntent.id); // Call the success function
            } else {
                setErrorMessage('Payment not successful.');
                setIsProcessing(false);
            }
        };

        return (
            <form onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold text-center mb-4 text-foreground">Pay with Card</h2>
                <PaymentElement />
                <button disabled={isProcessing || !stripe || !elements} className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-md text-foreground font-semibold">
                    {isProcessing ? "Processing..." : "Pay Now"}
                </button>
                {errorMessage && <div className="text-red-400 text-sm text-center mt-2">{errorMessage}</div>}
            </form>
        );
    };

    export default StripeCheckoutForm;
    
