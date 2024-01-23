import BlogOne from "@/components/BlogOne/BlogOne";
import BlogPostPagination from "@/components/BlogOne/BlogPostPagination";
import CtaOne from "@/components/CtaOne/CtaOne";
import InnerBanner from "@/components/InnerBanner/InnerBanner";
import Layout from "@/components/Layout/Layout";
import React from "react";

const Blog = () => {
  return (
    <Layout pageTitle="Blog Page">
      <InnerBanner title="Blog Posts" page="Blog Page" />
      <BlogOne noTitle className="blog-one__blog-page">
        <BlogPostPagination />
      </BlogOne>
      <CtaOne />
    </Layout>
  );
};

export default Blog;
