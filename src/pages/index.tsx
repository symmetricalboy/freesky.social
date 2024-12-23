import Head from "next/head";
import HandleForm from "./components/HandleForm";
import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { api } from "~/utils/api";

export default function Home() {
  const [helpVisible, setHelpVisible] = useState(false);
  const { data: handleCount } = api.handle.getHandleCount.useQuery();

  return (
    <>
      <Head>
        <title>freesky.social</title>
        <meta name="description" content="Find your tribe." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-gradient-to-w flex min-h-screen flex-col from-[#fff] to-[#f3f9ff]">
        <div className="bg-[#f3f9ff]">
          <div className="align-center  w-full gap-12 px-4 py-16 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray sm:text-[2rem]">
              Find your <span className="text-[#0560ff]">Tribe</span>.
            </h1>
            <br/><br/>
            <p>
            FreeSky allows everyone to claim a more meaningful identity on BlueSky. <br/>
            Get a BlueSky username on a shared community domain, for free. <br/>
            </p>
            <p className="text-xs text-slate-500">
            <i>(Your bsky.social username will still be reserved for you.)</i>
            </p><br/><br/>
            <p className="text-lg font-extrabold text-gray">People have claimed <span className="text-[#0560ff]">{handleCount}</span> usernames on FreeSky!</p>
          </div>
        </div>
        <div className="triangles"></div>
        <div className="flex">
          <button
            type="button"
            className={`ml-auto mr-auto mt-3
               inline-flex w-full place-self-center rounded-md bg-blue  px-3 py-2 text-sm text-white shadow-sm sm:w-auto`}
            onClick={() => setHelpVisible(true)}
          >
            What do I need to do?
          </button>
        </div>
        <br/><br/>
        <div>
          <div className={`${!helpVisible ? "hidden" : ""} container p-3`}>
            <div>
              1. Go to your settings on bluesky at{" "}
              <a
                href="https://bsky.app/settings"
                target="_blank"
                className=" text-blue hover:text-blueLight"
              >
                https://bsky.app/settings
              </a>
            </div>
            <div>
              {`2. Click "Change handle" and "I have my own domain" in the popup`}
            </div>
            <div>3. Click &quot;No DNS Panel&quot;</div>
            <div>
              4. Fill the desired handle with one of the available endings and
              copy the domain value to a field below
            </div>
            <div>
              5. If everything is ok click &quot;Verify Text File&quot; on
              bsky.app!
            </div>
          </div>
        </div>
        <div className="container">
          <div className=" flex flex-col items-center gap-12 px-4 py-3">
            <HandleForm />
          </div>
        </div>
        <div className="container">
            <div className="mt-5 flex flex-col items-center gap-2 px-4 py-3 text-center text-sm text-slate-500">
              <div>
                freesky is free and open source
              </div>
              <div>
                <a className="text-blue hover:text-blueLight" href="https://bsky.app/profile/freesky.social" target="_blank">
                  freesky on bluesky
                </a>{" "}
                |{" "}
                <a className="text-blue hover:text-blueLight" href="https://github.com/symmetricalboy/freesky.social" target="_blank">
                  source on github
                </a>{" "}
                |{" "}
                <a className="text-blue hover:text-blueLight" href="https://www.paypal.com/paypalme/symmboy" target="_blank">
                  donate on open collective
                </a>
              </div>
              <div><br/>
                freesky is a fork of open handles by domi.zip:
              </div>
              <div>
                <a className="text-blue hover:text-blueLight" href="https://bsky.app/profile/domi.zip" target="_blank">
                  domi.zip on bluesky
                </a>{" "}
                |{" "}
                <a className="text-blue hover:text-blueLight" href="https://github.com/SlickDomique/open-handles" target="_blank">
                  open handles on github
                </a>{" "}
                |{" "}
                <a className="inline-flex items-center gap-x-2 text-center text-blue hover:text-blueLight" href="https://ko-fi.com/domi_zip" target="_blank">
                  donate to domi.zip
                </a>
              </div><br/>
              <div>
                <p className="text-xs text-black"><i>copyright (c) 2024 Dylan Gregori Singer (symmetricalboy)</i></p>
              </div>
            </div>
          </div>
        <Analytics />
      </main>
    </>
  );
}
