import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '../../lib/prisma';
import stripe from '../../lib/stripe';

interface SubscribeRequestBody {
  priceId?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    frequency?: 'weekly' | 'biweekly' | 'monthly';
  }>;
  successUrl?: string;
  cancelUrl?: string;
  // Meal plan builder fields
  planId?: string;
  planName?: string;
  mealIds?: string[];
  deliveryDetails?: {
    address: string;
    city: string;
    postcode: string;
    phone: string;
    instructions?: string;
    preferredDay: string;
    preferredTimeSlot: string;
  };
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

    const {
      priceId,
      items,
      successUrl,
      cancelUrl,
      planId,
      planName,
      mealIds,
      deliveryDetails
    }: SubscribeRequestBody = req.body;

    // Support both legacy subscription flow and new meal plan builder
    const isMealPlanBuilder = mealIds && mealIds.length > 0;

    if (isMealPlanBuilder) {
      // Validate meal plan builder fields
      if (!planName || !mealIds || mealIds.length === 0 || !deliveryDetails) {
        return res.status(400).json({ message: 'Missing required meal plan fields' });
      }
    } else {
      // Validate legacy subscription fields
      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
    }

    // Calculate monthly total
    let monthlyTotal = 0;
    let subscriptionItems: Array<{ menuItemId: string; quantity: number; frequency?: string }> = [];

    if (isMealPlanBuilder) {
      // For meal plan builder: convert meal IDs to items
      subscriptionItems = mealIds!.map(mealId => ({
        menuItemId: mealId,
        quantity: 1,
        frequency: 'weekly'
      }));

      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: mealIds } },
      });

      monthlyTotal = menuItems.reduce((sum, item) => sum + (item.price * 4), 0);
    } else {
      // Legacy flow: use provided items
      subscriptionItems = items;

      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: {
            in: items.map((item) => item.menuItemId),
          },
        },
      });

      monthlyTotal = items.reduce((sum, item) => {
        const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
        if (!menuItem) return sum;

        const frequency = item.frequency || 'weekly';
        const multiplier = {
          weekly: 4,
          biweekly: 2,
          monthly: 1,
        }[frequency];

        return sum + menuItem.price * item.quantity * multiplier;
      }, 0);
    }

    // Determine priceId if not provided (for backwards compatibility)
    const finalPriceId = priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;

    if (!finalPriceId) {
      return res.status(500).json({ message: 'Stripe price ID not configured' });
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
        price: finalPriceId,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/cancel`,
      // Store user choices in metadata for the webhook
      metadata: {
        userId: user.id,
        items: JSON.stringify(subscriptionItems),
        priceId: finalPriceId,
        billingInterval: finalPriceId?.includes('GeiN3oy0') ? 'WEEKLY' : 'MONTHLY',
        monthlyTotal: monthlyTotal.toString(),
        planName: planName || 'Custom Subscription',
        // Delivery details as individual fields for easier webhook parsing
        deliveryAddress: deliveryDetails?.address || '',
        deliveryCity: deliveryDetails?.city || '',
        deliveryPostcode: deliveryDetails?.postcode || '',
        deliveryPhone: deliveryDetails?.phone || '',
        deliveryInstructions: deliveryDetails?.instructions || '',
        deliveryPreferredDay: deliveryDetails?.preferredDay || '',
        deliveryPreferredTimeSlot: deliveryDetails?.preferredTimeSlot || '',
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
          items: JSON.stringify(subscriptionItems),
          monthlyTotal: monthlyTotal.toString(),
          planName: planName || 'Custom Subscription',
          // Delivery details for subscription-level access
          deliveryAddress: deliveryDetails?.address || '',
          deliveryCity: deliveryDetails?.city || '',
          deliveryPostcode: deliveryDetails?.postcode || '',
          deliveryPhone: deliveryDetails?.phone || '',
          deliveryInstructions: deliveryDetails?.instructions || '',
          deliveryPreferredDay: deliveryDetails?.preferredDay || '',
          deliveryPreferredTimeSlot: deliveryDetails?.preferredTimeSlot || '',
        }
      }
    });

    res.status(200).json({
      sessionId: checkoutSession.id,
      checkoutUrl: checkoutSession.url
    });
  } catch (error) {
    console.error('Subscribe API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    res.status(500).json({ 
      message: 'Failed to create checkout session', 
      error: errorMessage 
    });
  }
}
