import { SessionProvider } from "next-auth/react";
import ContextProvider from "@/context/ContextProvider";
import "@/vendors/animate.css";
import "@/vendors/font-awesome.min.css";
import "@/vendors/lums-icon/style.css";
import "@/fonts/spartan-mb/stylesheet.css";
import "bootstrap/dist/css/bootstrap.min.css";
// import "react-circular-progressbar/dist/styles.css";
// import "react-modal-video/css/modal-video.min.css";
// import "tiny-slider/dist/tiny-slider.css";

// extra css
import "@/styles/style.scss";
import "@/styles/responsive.scss";

const MyApp = ({ Component, pageProps: { session, ...pageProps } }) => {
  return (
    <SessionProvider session={session}>
      <ContextProvider>
        <Component {...pageProps} />
      </ContextProvider>
    </SessionProvider>
  );
};

export default MyApp;
