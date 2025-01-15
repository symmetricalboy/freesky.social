import Head from "next/head";
import HandleForm from "./components/HandleForm";
import { useState, Fragment } from "react";
import { Analytics } from "@vercel/analytics/react";
import { api } from "~/utils/api";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function Home() {
  const [formVisible, setFormVisible] = useState(false);
  const faqs = [
    {
      q: "What is FreeSky?",
      a: "FreeSky is a service that lets you claim a handle on a community domain, for free.",
    },
    {
      q: "How does it work?",
      a: "Simply choose a domain and enter your desired handle. If it's available, it's yours!",
    },
    {
      q: "Do I need a Bluesky account?",
      a: "Yes, you need a Bluesky account to claim a handle.",
    },
    {
      q: "What happens to my bsky.social username?",
      a: "Your bsky.social username will still be reserved for you.",
    },
    {
      q: "Can I claim multiple handles?",
      a: "Yes, you can claim handles on multiple domains.",
    },
    {
      q: "Is this service free?",
      a: "Yes, FreeSky is completely free to use.",
    },
    {
      q: "Who is behind FreeSky?",
      a: "FreeSky is a community-driven project.",
    },
  ];

  const { data: handleCount } = api.handle.getHandleCount.useQuery();

  return (
    <Fragment>
      <div>
        <Head>
          <title>freesky.social</title>
          <meta name="description" content="Find your tribe." />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#092350] text-white">
          <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 text-center ">
            <div className="flex items-center gap-4">
              <Image
                src="/freesky-1024px.png"
                alt="Freesky Logo"
                width={64}
                height={64}
                className="h-16 w-16"
              />
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-[2.5rem]">
                Freesky
              </h1>
            </div>
            <p className="text-lg">
              Everyone deserves a meaningful identity on Bluesky.
              <br />
              Claim a handle on a community domain, for free.
            </p>
            <p className="text-sm text-gray-500">
              <i>(Your bsky.social username will still be reserved for you.)</i>
            </p>
            <p className="text-lg font-extrabold">
              People have claimed{" "}
              <span className="text-[#0560ff]">{handleCount}</span> usernames on
              FreeSky!
            </p>

            {/* Full-Width Section */}
            <div className="w-full py-20 px-4 sm:px-8 bg-black/25 rounded-lg border-2 border-white">
              {!formVisible && (
                <button
                  type="button"
                  className="bg-blue px-8 py-4 text-2xl font-medium text-white shadow-sm hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 rounded-lg"
                  onClick={() => setFormVisible(true)}
                >
                  Claim a handle
                </button>
              )}

              {formVisible && <HandleForm />}
            </div>
          </div>
          <div className="w-full px-4 pt-16">
            <div className="w-full max-w-3xl mx-auto">
              <h2 className="text-3xl font-extrabold text-gray-900">
                <span className="text-white">Frequently Asked Questions</span>
              </h2>
              <div className="mt-4 space-y-4">
                {faqs.map((faq, i) => (
                  <Disclosure as="div" key={i} className="mt-2">
                    {({ open }) => (
                      <Fragment>
                        <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-800 px-4 py-2 text-left text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                          <span>{faq.q}</span>
                          <ChevronDownIcon
                            className={`${
                              open ? "rotate-180 transform" : ""
                            } h-5 w-5 text-blue-500`}
                          />
                        </Disclosure.Button>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-300">
                            {faq.a}
                          </Disclosure.Panel>
                        </Transition>
                      </Fragment>
                    )}
                  </Disclosure>
                ))}
              </div>
            </div>
          </div>
          <div className="container mt-16">
            <div className="flex items-center justify-center gap-8 px-4 py-3">
              <a
                href="https://bsky.app/profile/freesky.social"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-80"
              >
                <Image
                  src="/bluesky.svg"
                  alt="Bluesky Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 text-blue"
                />
              </a>
              <a
                href="https://github.com/symmetricalboy/freesky.social"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-80"
              >
                <Image
                  src="/github.svg"
                  alt="GitHub Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 text-white"
                />
              </a>
            </div>
            <div className="text-center text-sm text-gray-400 mt-4">
              copyright © 2025 Dylan Gregori Singer (symmetricalboy)
            </div>
          </div>
          <Analytics />
        </main>
      </div>
    </Fragment>
  );
}