import { NextPage } from "next";
import BannerOne from "@/components/BannerOne/BannerOne";
import HowItWorks from "@/components/HowItWorks/HowItWorks";
import FeaturedDishes from "@/components/FeaturedDishes/FeaturedDishes";
import WhySubscribe from "@/components/WhySubscribe/WhySubscribe";
import ServiceOne from "@/components/ServiceOne/ServiceOne";
import SocialProof from "@/components/SocialProof/SocialProof";
import DeliveryArea from "@/components/DeliveryArea/DeliveryArea";
import FinalCta from "@/components/FinalCta/FinalCta";
import Layout from "@/components/Layout/Layout";
import React from "react";

const Home: NextPage = () => {
  return (
    <Layout pageTitle="Osassy's Kitchen">
      {/* 1. Hero - Value Proposition */}
      <BannerOne />

      {/* 2. How It Works - Reduces friction */}
      <HowItWorks />

      {/* 3. Featured Dishes - Appetite section */}
      <FeaturedDishes />

      {/* 4. Why Subscribe - Builds trust */}
      <WhySubscribe />

      {/* 5. Services - Subscription, One-off, Catering */}
      <ServiceOne />

      {/* 6. Social Proof - Testimonials */}
      <SocialProof />

      {/* 7. Delivery Info */}
      <DeliveryArea />

      {/* 8. Final CTA */}
      <FinalCta />
    </Layout>
  );
};

export default Home;
