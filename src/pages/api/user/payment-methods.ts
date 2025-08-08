import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import stripe from '../../../lib/stripe';
import prisma from '../../../lib/prisma';
import { PaymentMethod, PaymentMethodsResponse } from '../../../types/user';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Save Stripe customer ID to database
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    switch (req.method) {
      case 'GET':
        return handleGetPaymentMethods(stripeCustomerId, res);
      
      case 'POST':
        return handleCreateSetupIntent(stripeCustomerId, res);
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payment methods API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
}

async function handleGetPaymentMethods(
  stripeCustomerId: string,
  res: NextApiResponse
) {
  try {
    // Fetch payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    // Get customer to check default payment method
    const customer = await stripe.customers.retrieve(stripeCustomerId) as any;
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method || null;

    // Transform Stripe payment methods to our format
    const transformedMethods: PaymentMethod[] = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: 'card' as const,
      card: {
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '****',
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0,
        funding: pm.card?.funding || undefined,
      },
      billingDetails: {
        name: pm.billing_details?.name,
        email: pm.billing_details?.email,
        phone: pm.billing_details?.phone,
        address: pm.billing_details?.address ? {
          city: pm.billing_details.address.city,
          country: pm.billing_details.address.country,
          line1: pm.billing_details.address.line1,
          line2: pm.billing_details.address.line2,
          postalCode: pm.billing_details.address.postal_code,
          state: pm.billing_details.address.state,
        } : null,
      },
      isDefault: pm.id === defaultPaymentMethodId,
      createdAt: pm.created,
    }));

    const response: PaymentMethodsResponse = {
      paymentMethods: transformedMethods,
      defaultPaymentMethodId,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
}

async function handleCreateSetupIntent(
  stripeCustomerId: string,
  res: NextApiResponse
) {
  try {
    // Create a SetupIntent for adding a new payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session', // For future payments
      metadata: {
        action: 'add_payment_method',
      },
    });

    return res.status(200).json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
}