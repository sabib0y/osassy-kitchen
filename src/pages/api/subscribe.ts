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

    const { priceId, items }: SubscribeRequestBody = req.body;

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
      const customer = await stripe.customers.create({ 
        email: user.email || undefined,
        name: user.name || undefined,
      });
      
      stripeCustomerId = customer.id;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
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
      success_url: `${process.env.NEXTAUTH_URL}/profile?status=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscribe?status=cancelled`,
      // Store user choices in metadata for the webhook
      metadata: {
        userId: user.id,
        items: JSON.stringify(items), // [{ menuItemId, quantity }]
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