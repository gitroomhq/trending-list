import '@trending/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';
import {SessionProvider, useSession} from "next-auth/react";
import {ToastContainer} from "react-toastify";
import {DefaultSeo} from "next-seo";

export default function App({ Component, pageProps: { session, ...pageProps }, }: any) {
  return (
      <SessionProvider session={session}>
          <DefaultSeo
              title="Git Up!"
              description="Know when you are trending on GitHub"
              openGraph={{
                  type: 'website',
                  locale: 'en_IE',
                  url: 'https://www.url.ie/',
                  siteName: 'SiteName',
              }}
              twitter={{
                  handle: '@nevodavid',
                  site: '@nevodavid',
                  cardType: 'summary_large_image',
              }}
          />
        <Component {...pageProps} />
        <ToastContainer />
      </SessionProvider>
  )
}
