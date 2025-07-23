# Lums Kitchen Next.js Project Structure

```
lums-nextjs-main/
├── 📁 .eslintrc.json
├── 📁 .gitignore
├── 📁 .yarnrc.yml
├── 📁 jsconfig.json
├── 📁 next.config.js
├── 📁 package-lock.json
├── 📁 package.json
├── 📁 README.md
├── 📁 yarn.lock
├── 📁 public/
│   ├── 📁 favicon.ico
│   ├── 📁 manifest.json
│   ├── 📁 ms-icon-70x70.png
│   ├── 📁 ms-icon-144x144.png
│   ├── 📁 ms-icon-150x150.png
│   ├── 📁 ms-icon-310x310.png
│   └── 📁 icons/
│       ├── 📁 catering.svg
│       ├── 📁 order.svg
│       └── 📁 rentals.svg
├── 📁 src/
│   ├── 📁 assets/
│   │   ├── 📁 fonts/
│   │   │   ├── 📁 fontawesome-webfont.eot
│   │   │   ├── 📁 fontawesome-webfont.svg
│   │   │   ├── 📁 fontawesome-webfont.ttf
│   │   │   ├── 📁 fontawesome-webfont.woff
│   │   │   ├── 📁 fontawesome-webfont.woff2
│   │   │   ├── 📁 FontAwesome.otf
│   │   │   └── 📁 spartan-mb/
│   │   │       ├── 📁 generator_config.txt
│   │   │       ├── 📁 spartanmb-bold-webfont.woff
│   │   │       ├── 📁 spartanmb-bold-webfont.woff2
│   │   │       ├── 📁 spartanmb-extra-bold-webfont.woff
│   │   │       ├── 📁 spartanmb-extra-bold-webfont.woff2
│   │   │       ├── 📁 spartanmb-semibold-webfont.woff
│   │   │       ├── 📁 spartanmb-semibold-webfont.woff2
│   │   │       ├── 📁 stylesheet.css
│   │   │       └── 📁 specimen_files/
│   │   │           ├── 📁 grid_12-825-55-15.css
│   │   │           └── 📁 specimen_stylesheet.css
│   │   ├── 📁 images/
│   │   │   ├── 📁 author-1-1.jpg
│   │   │   ├── 📁 banner-1-1-moc.png
│   │   │   ├── 📁 banner-1-1.png
│   │   │   ├── 📁 blog-1-1.jpg
│   │   │   ├── 📁 blog-1-2.jpg
│   │   │   ├── 📁 blog-1-3.jpg
│   │   │   ├── 📁 blog-1-4.jpg
│   │   │   ├── 📁 blog-1-5.jpg
│   │   │   ├── 📁 blog-1-6.jpg
│   │   │   ├── 📁 blog-d-1-1.jpg
│   │   │   ├── 📁 brand-1-1.png
│   │   │   ├── 📁 comment-1-1.jpg
│   │   │   ├── 📁 comment-1-2.jpg
│   │   │   ├── 📁 cta-1-1.jpg
│   │   │   ├── 📁 cta-bg-1-1.jpg
│   │   │   ├── 📁 cta-moc-1-1.png
│   │   │   ├── 📁 cta-shape-1-1-.png
│   │   │   ├── 📁 cta-shape-1-1.png
│   │   │   ├── 📁 dodo.jpg
│   │   │   ├── 📁 egusi.jpg
│   │   │   ├── 📁 globe-1-1.png
│   │   │   ├── 📁 icon-catering.png
│   │   │   ├── 📁 icon-order.png
│   │   │   ├── 📁 icon-rentals.png
│   │   │   ├── 📁 img.jpg
│   │   │   ├── 📁 inner-banner-bg-1-1.jpg
│   │   │   ├── 📁 logo-dark.png
│   │   │   ├── 📁 logo-light.png
│   │   │   ├── 📁 lp-1-1.jpg
│   │   │   ├── 📁 lp-1-2.jpg
│   │   │   ├── 📁 lp-1-3.jpg
│   │   │   ├── 📁 main-food.png
│   │   │   ├── 📁 nkwobi.jpg
│   │   │   ├── 📁 nkwobi.png
│   │   │   ├── 📁 preloader.png
│   │   │   ├── 📁 rocket-1-1.png
│   │   │   ├── 📁 testi-1-1.jpg
│   │   │   ├── 📁 testi-1-2.jpg
│   │   │   ├── 📁 testi-1-3.jpg
│   │   │   ├── 📁 testi-bg-1-1.png
│   │   │   ├── 📁 testi-qoute-1-1.png
│   │   │   └── 📁 texture-1-1.png
│   │   └── 📁 vendors/
│   │       ├── 📁 animate.css
│   │       ├── 📁 font-awesome.min.css
│   │       └── 📁 lums-icon/
│   │           ├── 📁 Read Me.txt
│   │           ├── 📁 selection.json
│   │           ├── 📁 style.css
│   │           ├── 📁 demo-files/
│   │           │   ├── 📁 demo.css
│   │           │   └── 📁 demo.js
│   │           └── 📁 fonts/
│   │               ├── 📁 lums-icon.eot
│   │               ├── 📁 lums-icon.svg
│   │               ├── 📁 lums-icon.ttf
│   │               └── 📁 lums-icon.woff
│   ├── 📁 components/
│   │   ├── 📁 BannerOne/
│   │   │   └── 📁 BannerOne.js
│   │   ├── 📁 BlogDetails/
│   │   │   ├── 📁 BlogDetailsAuthor.js
│   │   │   ├── 📁 BlogDetailsContent.js
│   │   │   ├── 📁 BlogDetailsPage.js
│   │   │   ├── 📁 BlogDetailsSidebar.js
│   │   │   ├── 📁 CommentForm.js
│   │   │   ├── 📁 CommentOne.js
│   │   │   ├── 📁 ShareBlock.js
│   │   │   └── 📁 SidebarPosts.js
│   │   ├── 📁 BlogOne/
│   │   │   ├── 📁 BlogOne.js
│   │   │   ├── 📁 BlogPostPagination.js
│   │   │   └── 📁 SingleBlog.js
│   │   ├── 📁 BrandOne/
│   │   │   └── 📁 BrandOne.js
│   │   ├── 📁 CtaOne/
│   │   │   └── 📁 CtaOne.js
│   │   ├── 📁 CtaThree/
│   │   │   └── 📁 CtaThree.js
│   │   ├── 📁 CtaTwo/
│   │   │   └── 📁 CtaTwo.js
│   │   ├── 📁 FunFactOne/
│   │   │   └── 📁 FunFactOne.js
│   │   ├── 📁 Header/
│   │   │   ├── 📁 Header.js
│   │   │   └── 📁 NavItem.js
│   │   ├── 📁 InnerBanner/
│   │   │   └── 📁 InnerBanner.js
│   │   ├── 📁 Layout/
│   │   │   └── 📁 Layout.js
│   │   ├── 📁 Preloader/
│   │   │   └── 📁 Preloader.js
│   │   ├── 📁 PricingOne/
│   │   │   ├── 📁 PricingOne.js
│   │   │   └── 📁 SinglePricingOne.js
│   │   ├── 📁 Reuseable/
│   │   │   ├── 📁 TextSplit.js
│   │   │   └── 📁 VisibilityCountUp.js
│   │   ├── 📁 ServiceOne/
│   │   │   ├── 📁 ServiceOne.js
│   │   │   └── 📁 ServiceOneSingle.js
│   │   ├── 📁 SiteFooter/
│   │   │   └── 📁 SiteFooter.js
│   │   └── 📁 TestimonialsOne/
│   │       └── 📁 TestimonialsOne.js
│   ├── 📁 context/
│   │   ├── 📁 context.js
│   │   └── 📁 ContextProvider.js
│   ├── 📁 data/
│   │   ├── 📁 bannerOne.js
│   │   ├── 📁 blogDetailsPage.js
│   │   ├── 📁 blogOne.js
│   │   ├── 📁 brandOne.js
│   │   ├── 📁 ctaOne.js
│   │   ├── 📁 ctaThree.js
│   │   ├── 📁 ctaTwo.js
│   │   ├── 📁 funFactOne.js
│   │   ├── 📁 headerData.js
│   │   ├── 📁 pricingOne.js
│   │   ├── 📁 serviceOne.js
│   │   ├── 📁 siteFooter.js
│   │   └── 📁 testimonialsOne.js
│   ├── 📁 hooks/
│   │   ├── 📁 useActive.js
│   │   └── 📁 useScroll.js
│   ├── 📁 pages/
│   │   ├── 📁 _app.js
│   │   ├── 📁 _document.js
│   │   ├── 📁 blog-details.js
│   │   ├── 📁 blog.js
│   │   └── 📁 index.js
│   └── 📁 styles/
│       ├── 📁 responsive.scss
│       └── 📁 style.scss
└── 📁 PROJECT_STRUCTURE.md (this file)

## Project Overview

**Type**: Next.js 14 React Application  
**Purpose**: Restaurant/Kitchen Website  
**Styling**: SCSS + Bootstrap 5  
**Features**: 
- Responsive design
- Blog system
- Testimonials
- Service showcase
- Contact forms
- Image optimization

## Key Directories Explained

- **/src/components/**: Modular React components organized by feature
- **/src/pages/**: Next.js file-based routing
- **/src/data/**: Static data and configuration
- **/src/assets/**: Static assets (fonts, images, styles)
- **/src/context/**: React Context for state management
- **/src/hooks/**: Custom React hooks
- **/public/**: Static files served directly

## Component Architecture

```
Layout (Root)
├── Header
│   └── NavItem (Navigation items)
├── Page Content
│   ├── BannerOne (Hero section)
│   ├── ServiceOne (Services showcase)
│   ├── BlogOne (Blog posts)
│   ├── TestimonialsOne (Customer reviews)
│   ├── PricingOne (Pricing plans)
│   ├── BrandOne (Partner logos)
│   └── CTAs (Call-to-action sections)
└── SiteFooter
