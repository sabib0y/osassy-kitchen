import React from "react";
import Link from "next/link";

const FinalCta = () => {
  return (
    <section className="final-cta">
      <div className="final-cta__container">
        <h2 className="final-cta__title">Ready to Eat Better This Week?</h2>
        <p className="final-cta__text">
          Start your Osassy&apos;s Kitchen subscription and enjoy authentic Nigerian meals every week.
        </p>

        <div className="final-cta__buttons">
          <Link href="/meal-plans" className="final-cta__btn final-cta__btn--primary">
            Start My Meal Plan
          </Link>
          <Link href="/menu" className="final-cta__btn final-cta__btn--secondary">
            Browse Menu
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FinalCta;
