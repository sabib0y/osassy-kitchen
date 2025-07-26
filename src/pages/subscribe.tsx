import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { GetServerSideProps } from 'next';
import { MenuItem, PrismaClient } from '@prisma/client';
import Layout from '../components/Layout/Layout';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceId: string;
  interval: string;
  features: string[];
}

// Subscription plans - these should match your Stripe price IDs
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'weekly',
    name: 'Weekly Meal Plan',
    description: '7 delicious meals delivered weekly',
    price: 49.99,
    priceId: 'price_1RnpXuQcnp5UiDwRWflK4L2N',
    interval: 'week',
    features: ['7 meals per week', 'Free delivery', 'Skip or pause anytime', 'Fresh ingredients']
  },
  {
    id: 'monthly',
    name: 'Monthly Meal Plan',
    description: '30 meals delivered monthly - Best value!',
    price: 189.99,
    priceId: 'price_1RnpZrQcnp5UiDwRxTfUX1Qs',
    interval: 'month',
    features: ['30 meals per month', 'Free delivery', 'Skip or pause anytime', 'Fresh ingredients', '10% savings']
  }
];

interface SubscribePageProps {
  menuItems: MenuItem[];
}

// Fetch menu items server-side
export const getServerSideProps: GetServerSideProps<SubscribePageProps> = async () => {
  const prisma = new PrismaClient();
  
  try {
    const menuItems = await prisma.menuItem.findMany({ 
      where: { available: true },
      orderBy: { category: 'asc' }
    });
    
    return {
      props: {
        menuItems: JSON.parse(JSON.stringify(menuItems))
      }
    };
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return {
      props: {
        menuItems: []
      }
    };
  } finally {
    await prisma.$disconnect();
  }
};

const SubscribePage: React.FC<SubscribePageProps> = ({ menuItems }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(subscriptionPlans[0].priceId);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({}); // { menuItemId: quantity }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login?callbackUrl=/subscribe');
    }
  }, [session, status, router]);

  const handleItemChange = (itemId: string, quantity: string) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: Math.max(0, parseInt(quantity) || 0) }));
  };

  const handleSubscribe = async () => {
    if (!session) {
      router.push('/login?callbackUrl=/subscribe');
      return;
    }

    // Validate selections
    const itemsToSubscribe = Object.entries(selectedItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

    if (itemsToSubscribe.length === 0) {
      setError('Please select at least one menu item');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId: selectedPlan, 
          items: itemsToSubscribe 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const groupedMenuItems = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (status === 'loading') {
    return (
      <Layout pageTitle="Loading...">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Subscribe - Osassy's Kitchen">
      <section className="pricing-one">
        <div className="container">
          <div className="section-title text-center">
            <span className="section-title__tagline">Choose Your Plan</span>
            <h2 className="section-title__title">Subscribe to Delicious Meals</h2>
            <p className="section-title__text">
              Get fresh, authentic Nigerian meals delivered to your doorstep
            </p>
          </div>

          {error && (
            <div className="alert alert-danger text-center" role="alert">
              {error}
            </div>
          )}

          {/* Plan Selection */}
          <div className="row mb-5">
            <div className="col-12">
              <h3 className="text-center mb-4">Select Your Subscription Plan</h3>
              <div className="row justify-content-center">
                {subscriptionPlans.map((plan) => (
                  <div key={plan.id} className="col-lg-5 mx-3 mb-4">
                    <div 
                      className={`pricing-one__single ${selectedPlan === plan.priceId ? 'selected' : ''}`}
                      style={{ cursor: 'pointer', border: selectedPlan === plan.priceId ? '2px solid #ff6b35' : '' }}
                      onClick={() => setSelectedPlan(plan.priceId)}
                    >
                      <div className="pricing-one__inner">
                        <div className="pricing-one__price-box">
                          <h3 className="pricing-one__price">${plan.price}</h3>
                          <p className="pricing-one__price-text">per {plan.interval}</p>
                        </div>
                        <div className="pricing-one__content">
                          <h3 className="pricing-one__title">{plan.name}</h3>
                          <p className="pricing-one__text">{plan.description}</p>
                          <ul className="pricing-one__list list-unstyled">
                            {plan.features.map((feature, index) => (
                              <li key={index}>
                                <i className="fa fa-check-circle"></i>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Menu Selection */}
          <div className="row">
            <div className="col-12">
              <h3 className="text-center mb-4">Customize Your Menu</h3>
              <p className="text-center text-muted mb-4">
                Select the meals you&apos;d like to include in your subscription
              </p>
              
              {Object.entries(groupedMenuItems).map(([category, items]) => (
                <div key={category} className="mb-5">
                  <h4 className="mb-3">{category}</h4>
                  <div className="row">
                    {items.map((item) => (
                      <div key={item.id} className="col-md-6 col-lg-4 mb-3">
                        <div className="card">
                          <div className="card-body">
                            <h5 className="card-title">{item.name}</h5>
                            <p className="card-text text-muted">{item.description}</p>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold">${item.price}</span>
                              <div className="input-group" style={{ width: '120px' }}>
                                <input
                                  type="number"
                                  className="form-control"
                                  min="0"
                                  max="10"
                                  value={selectedItems[item.id] || 0}
                                  onChange={(e) => handleItemChange(item.id, e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary and Subscribe Button */}
          <div className="row">
            <div className="col-12 text-center">
              <div className="mb-4">
                <h4>Selected Items Summary</h4>
                {Object.entries(selectedItems).filter(([, qty]) => qty > 0).length > 0 ? (
                  <ul className="list-unstyled">
                    {Object.entries(selectedItems)
                      .filter(([, qty]) => qty > 0)
                      .map(([itemId, quantity]) => {
                        const item = menuItems.find(i => i.id === itemId);
                        return (
                          <li key={itemId}>
                            {item?.name} x {quantity} = ${(Number(item?.price) * quantity).toFixed(2)}
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <p className="text-muted">No items selected yet</p>
                )}
              </div>
              
              <button
                onClick={handleSubscribe}
                disabled={loading || Object.values(selectedItems).every(qty => qty === 0)}
                className="thm-btn pricing-one__btn"
              >
                {loading ? 'Processing...' : 'Continue to Checkout'}
              </button>
            </div>
          </div>

          <div className="text-center mt-5">
            <p className="text-muted">
              <small>
                Note: You&apos;ll need to replace the placeholder price IDs with actual Stripe price IDs
                in the subscriptionPlans array above.
              </small>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SubscribePage;