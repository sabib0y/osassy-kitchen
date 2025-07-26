import { SessionProvider } from "next-auth/react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { AppProps } from 'next/app';
import type { Session } from 'next-auth';
import ContextProvider from "../context/ContextProvider";
import "../assets/vendors/animate.css";
import "../assets/vendors/font-awesome.min.css";
import "../assets/vendors/lums-icon/style.css";
import "../assets/fonts/spartan-mb/stylesheet.css";
import "bootstrap/dist/css/bootstrap.min.css";
// import "react-circular-progressbar/dist/styles.css";
// import "react-modal-video/css/modal-video.min.css";
// import "tiny-slider/dist/tiny-slider.css";

// extra css
import "@/styles/style.scss";
import "@/styles/responsive.scss";

// Initialize Stripe
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const MyApp = ({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) => {
  return (
    <SessionProvider session={session}>
      <Elements stripe={stripePromise}>
        <ContextProvider>
          <Component {...pageProps} />
        </ContextProvider>
      </Elements>
    </SessionProvider>
  );
};

export default MyApp;
