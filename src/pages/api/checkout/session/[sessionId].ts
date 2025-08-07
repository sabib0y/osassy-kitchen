import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import stripe from '@/lib/stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user from the JWT token
    const token = await getToken({ req });
    
    if (!token || !token.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'subscription', 'payment_intent']
    });

    // Verify the session belongs to the authenticated user
    const user = await prisma.user.findUnique({
      where: { email: token.email }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the session's customer matches the user's Stripe customer ID
    if (session.customer !== user.stripeCustomerId) {
      // For security, we don't reveal that the session exists but belongs to another user
      return res.status(404).json({ message: 'Session not found' });
    }

    // Parse items from metadata if available
    let items = [];
    if (session.metadata?.items) {
      try {
        const parsedItems = JSON.parse(session.metadata.items);
        
        // Fetch menu item details for each item
        const menuItemIds = parsedItems.map((item: any) => item.menuItemId);
        const menuItems = await prisma.menuItem.findMany({
          where: {
            id: { in: menuItemIds }
          }
        });

        // Map parsed items with menu item details
        items = parsedItems.map((item: any) => {
          const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
          return {
            id: item.menuItemId,
            menuItemId: item.menuItemId,
            name: menuItem?.name || 'Unknown Item',
            quantity: item.quantity,
            price: menuItem?.price || 0,
            imageUrl: menuItem?.imageUrl || null
          };
        });
      } catch (e) {
        console.error('Failed to parse items from metadata:', e);
      }
    }

    // Get subscription details if available
    let subscriptionDetails = null;
    if (session.subscription && typeof session.subscription === 'object') {
      subscriptionDetails = {
        id: session.subscription.id,
        status: session.subscription.status,
        current_period_start: (session.subscription as any).current_period_start,
        current_period_end: (session.subscription as any).current_period_end
      };
    } else if (session.subscription && typeof session.subscription === 'string') {
      // If subscription is just an ID, retrieve full details
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        subscriptionDetails = {
          id: subscription.id,
          status: subscription.status,
          current_period_start: (subscription as any).current_period_start,
          current_period_end: (subscription as any).current_period_end
        };
      } catch (e) {
        console.error('Failed to retrieve subscription details:', e);
      }
    }

    // Format the response
    const response = {
      id: session.id,
      customer_email: session.customer_email || user.email,
      customer_details: session.customer_details || {
        name: user.name,
        email: user.email
      },
      metadata: {
        userId: session.metadata?.userId || user.id,
        items: items, // Return parsed items array instead of JSON string
        billingInterval: session.metadata?.billingInterval || 'WEEKLY',
        priceId: session.metadata?.priceId
      },
      payment_method_types: session.payment_method_types,
      payment_status: session.payment_status,
      amount_subtotal: session.amount_subtotal,
      amount_total: session.amount_total,
      currency: session.currency,
      subscription: subscriptionDetails,
      billing_address: session.customer_details?.address,
      payment_intent: session.payment_intent,
      status: session.status,
      created: session.created,
      expires_at: session.expires_at
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    
    // Check if it's a Stripe error for session not found
    if (error instanceof Error && error.message.includes('No such checkout.session')) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve session';
    res.status(500).json({ 
      message: 'Failed to retrieve checkout session', 
      error: errorMessage 
    });
  }
}