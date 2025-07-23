import { SessionProvider } from "next-auth/react";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
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
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const MyApp = ({ Component, pageProps: { session, ...pageProps } }) => {
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
