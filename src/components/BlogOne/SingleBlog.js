import Link from "next/link";
import React from "react";
import { Col, Image } from "react-bootstrap";
import TextSplit from "../Reuseable/TextSplit";

const SingleBlog = ({ blog = {} }) => {
  const { title, image, admin, date, comments } = blog;

  return (
    <Col lg={6}>
      <div className="blog-one__single">
        <div className="blog-one__image-outer">
          <div className="blog-one__image">
            <Image
              src={require(`src/assets/images/${image}`).default.src}
              alt="Awesome Image"
            />
            <Link href="/blog-details" className="blog-one__link">
              Read More
            </Link>
          </div>
        </div>

        <div className="blog-one__content">
          <div className="blog-one__meta">
            <Link href="/blog-details" className="blog-one__meta-link">
              By {admin}
            </Link>
            <span className="blog-one__meta-sep">.</span>
            <Link href="/blog-details" className="blog-one__meta-link">
              {date}
            </Link>
            <span className="blog-one__meta-sep">.</span>
            <Link href="/blog-details" className="blog-one__meta-link">
              {comments} comments
            </Link>
          </div>

          <h3 className="blog-one__title">
            <Link href="/blog-details">
              <TextSplit text={title} />
            </Link>
          </h3>
        </div>
      </div>
    </Col>
  );
};

export default SingleBlog;
