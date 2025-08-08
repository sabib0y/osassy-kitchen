import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const paymentMethodId = req.query.id as string;

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    // Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        stripeCustomerId: true,
      },
    });

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'User or Stripe customer not found' });
    }

    // Verify that the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    if (paymentMethod.customer !== user.stripeCustomerId) {
      return res.status(403).json({ error: 'Payment method does not belong to this user' });
    }

    switch (req.method) {
      case 'DELETE':
        return handleDeletePaymentMethod(paymentMethodId, user.stripeCustomerId, res);
      
      case 'PUT':
        // Check if this is a request to set as default
        if (req.url?.endsWith('/default')) {
          return handleSetDefaultPaymentMethod(paymentMethodId, user.stripeCustomerId, res);
        }
        return res.status(400).json({ error: 'Invalid endpoint' });
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payment method API error:', error);
    
    // Handle Stripe-specific errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any;
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ 
          error: stripeError.message || 'Invalid request',
        });
      }
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
}

async function handleDeletePaymentMethod(
  paymentMethodId: string,
  stripeCustomerId: string,
  res: NextApiResponse
) {
  try {
    // Check if this is the default payment method
    const customer = await stripe.customers.retrieve(stripeCustomerId) as any;
    const isDefault = customer.invoice_settings?.default_payment_method === paymentMethodId;

    if (isDefault) {
      // Get all payment methods to check if there are others
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
      });

      // If this is the only payment method, allow deletion but clear default
      if (paymentMethods.data.length === 1) {
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: null as any,
          },
        });
      } else {
        // If there are other payment methods, set the first available one as default
        const otherPaymentMethod = paymentMethods.data.find(pm => pm.id !== paymentMethodId);
        if (otherPaymentMethod) {
          await stripe.customers.update(stripeCustomerId, {
            invoice_settings: {
              default_payment_method: otherPaymentMethod.id,
            },
          });
        }
      }
    }

    // Detach the payment method from the customer
    await stripe.paymentMethods.detach(paymentMethodId);

    return res.status(200).json({ 
      success: true,
      message: 'Payment method removed successfully',
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
}

async function handleSetDefaultPaymentMethod(
  paymentMethodId: string,
  stripeCustomerId: string,
  res: NextApiResponse
) {
  try {
    // Update the customer's default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Also update for subscriptions if any exist
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });

    // Update default payment method for all active subscriptions
    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.update(subscription.id, {
        default_payment_method: paymentMethodId,
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Default payment method updated successfully',
    });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    throw error;
  }
}