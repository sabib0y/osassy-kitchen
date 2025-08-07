import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import stripe from '../../lib/stripe';

const prisma = new PrismaClient();

interface SubscribeRequestBody {
  priceId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  successUrl?: string;
  cancelUrl?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user from the JWT token
    const token = await getToken({ req });
    
    if (!token || !token.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { priceId, items, successUrl, cancelUrl }: SubscribeRequestBody = req.body;

    if (!priceId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({ 
      where: { email: token.email } 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      // No customer ID stored, create new customer
      const customer = await stripe.customers.create({ 
        email: user.email || undefined,
        name: user.name || undefined,
      });
      
      stripeCustomerId = customer.id;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    } else {
      // Verify the customer exists in Stripe (handle account switches)
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          // Customer doesn't exist, create new one and update database
          console.log(`Customer ${stripeCustomerId} not found, creating new customer`);
          
          const customer = await stripe.customers.create({ 
            email: user.email || undefined,
            name: user.name || undefined,
          });
          
          stripeCustomerId = customer.id;
          
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId },
          });
        } else {
          throw error; // Re-throw other Stripe errors
        }
      }
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ 
        price: priceId, 
        quantity: 1 
      }],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/cancel`,
      // Store user choices in metadata for the webhook
      metadata: {
        userId: user.id,
        items: JSON.stringify(items), // [{ menuItemId, quantity }]
        priceId: priceId,
        billingInterval: priceId.includes('GeiN3oy0') ? 'WEEKLY' : 'MONTHLY'
      },
      // Add subscription data to prefill customer email
      customer_email: !stripeCustomerId ? user.email || undefined : undefined,
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address
      billing_address_collection: 'required',
      // Configure subscription
      subscription_data: {
        metadata: {
          userId: user.id,
          items: JSON.stringify(items)
        }
      }
    });

    res.status(200).json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Subscribe API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    res.status(500).json({ 
      message: 'Failed to create checkout session', 
      error: errorMessage 
    });
  }
}
