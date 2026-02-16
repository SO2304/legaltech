import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-04-10' as any,
});

export async function createDossierCheckoutSession(dossierId: string, amount: number, currency: string, customerEmail: string) {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                        name: `Analyse Dossier Divorce - Réf: ${dossierId}`,
                        description: 'Accompagnement juridique automatisé et centralisation documentaire.',
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/payment?dossierId=${dossierId}`,
        customer_email: customerEmail,
        metadata: {
            dossierId,
        },
    });

    return session;
}
