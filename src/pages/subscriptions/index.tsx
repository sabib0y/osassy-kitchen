import { useEffect } from 'react';
import { useRouter } from 'next/router';

const SubscriptionsRedirect = () => {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/user/subscriptions');
  }, [router]);
  
  return null;
};

export default SubscriptionsRedirect;