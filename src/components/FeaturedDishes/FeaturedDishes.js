import React from "react";
import Link from "next/link";
import Image from "next/image";

const dishes = [
  {
    id: 1,
    name: "Jollof Rice + Chicken",
    image: "/images/dishes/jollof-and-chicken.png",
    description: "Our signature jollof rice cooked with rich tomato sauce, aromatic spices, and served with crispy fried chicken and sweet plantain.",
  },
  {
    id: 2,
    name: "Ayamase + Rice",
    image: "/images/dishes/ayamase.png",
    description: "A spicy green pepper stew made with assorted meats and boiled eggs, served on a bed of fluffy white rice with fried plantain.",
  },
  {
    id: 3,
    name: "Egusi + Pounded Yam",
    image: "/images/dishes/pounded-yam-and-egusi.png",
    description: "Hearty melon seed soup loaded with leafy vegetables, assorted meats and seafood, paired with smooth pounded yam.",
  },
  {
    id: 4,
    name: "Pepper Soup",
    image: "/images/dishes/peppersoup.png",
    description: "A warming, aromatic broth infused with traditional spices and tender goat meat. Perfect for any time of the day.",
  },
];

const FeaturedDishes = () => {
  return (
    <section className="featured-dishes" id="featured">
      <div className="featured-dishes__container">
        <h2 className="featured-dishes__title">Popular Dishes</h2>

        <div className="featured-dishes__grid">
          {dishes.map((dish) => (
            <div key={dish.id} className="featured-dishes__card">
              <div className="featured-dishes__card-image-wrapper">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  width={200}
                  height={200}
                  className="featured-dishes__card-image"
                />
              </div>
              <div className="featured-dishes__card-content">
                <h3 className="featured-dishes__card-name">{dish.name}</h3>
                <p className="featured-dishes__card-description">{dish.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="featured-dishes__cta-wrapper">
          <Link href="/meals" className="featured-dishes__cta">
            View All Meals
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDishes;
