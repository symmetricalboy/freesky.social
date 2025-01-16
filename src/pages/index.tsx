/* eslint-disable react/no-unescaped-entities */
import Head from "next/head";
import HandleForm from "./components/HandleForm";
import { useState, Fragment } from "react";
import { Analytics } from "@vercel/analytics/react";
import { api } from "~/utils/api";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import AnimatedEllipsis from "./components/AnimatedEllipsis";
import Link from "next/link";

export default function Home() {
  const [formVisible, setFormVisible] = useState(false);
  const faqs = [
    {
      q: "What is Freesky?",
      a: "Freesky is a simple to use web service that lets anyone claim a new ATProto/Bluesky handle on a more expressive domain name, completely for free.",
    },
    {
      q: "How does it work?",
      a: "Anyone can choose one of our 18+ shared community domain names, enter their desired handle, and if it's available, it's theirs, instantly, for free, forever.",
    },
    {
      q: "Do I need a Bluesky account?",
      a: <span>Yes, you will need an existing ATProto/Bluesky account to claim a handle. If you don't have one yet, you can create one for free at <a className="text-[#0560ff]" href="https://bsky.app" target="_blank" rel="noreferrer">bsky.app</a>.</span>,
    },
    {
      q: "What happens to my bsky.social username?",
      a: <span>Your existing bsky.social username will still be reserved for you, indefinitely.<br/><br/>You can always change back to your old handle if you change your mind.</span>,
    },
    {
      q: "Can I claim multiple handles?",
      a: <span>You can only claim one Freesky handle at a time per ATProto/Bluesky account. This is largely to limit potential abuse.<br/><br/>If you have multiple accounts, feel free to use Freesky with all of them!<br/><br/>If you want to claim a different handle with the same account, you are free to do so as often as you like, but your previous Freesky handle will be replaced by the new one, and your handle will be up for grabs again.</span>,
    },
    {
      q: "Is Freesky free to use?",
      a: "Freesky is completely free to use, and always will be, for all, forever.",
    },
    {
      q: "Is Freesky safe to use?",
      a: "Yup!",
    },
    {
      q: "I don't trust you. Is Freesky REALLY safe to use?",
      a: <span>Yes! We promise! And we can prove it, too! Freesky is safe to use, and your data is never shared with anyone in any manner beyond what is strictly necessary to claim a handle.<br/><br/>Your ATProto/Bluesky account is never used for anything other than to claim a handle. No significant or private userdata is ever stored on Freesky's servers.<br/><br/>We only keep a database that is a simple list of handles that have been claimed, and the associated DID (that's your fancy Web3 account identifier).<br/><br/>You can verify this yourself by looking at the source code on GitHub. You can see exactly what code is deployed to Vercel right from the repository page.</span>,
    },
    {
      q: "Who created Freesky?",
      a: <span>Freesky is a hobby project by Dylan Gregori Singer (<a className="text-[#0560ff]" href="https://bsky.app/profile/symmetricalboy.com" target="_blank" rel="noreferrer">@symmetricalboy.com</a>) and is simply a fun way to give back to the ATProto/Bluesky community.</span>,
    },
    {
      q: "How can I contribute to Freesky?",
      a: <span>You can help by spreading the word about Freesky! The more people know about it, the more people will use it, and the more people will know about it!<br/><br/>You can also help by contributing to the codebase on GitHub, or consider <a className="text-[#0560ff]" href="https://ko-fi.com/symm" target="_blank" rel="noreferrer">donating to the project on Ko-fi</a> to help keep it running smoothly.<br/><br/>Donations are only ever used to cover the cost of running the service, and are never used for anything else.</span>,
    },
    {
      q: "Where can I view the source code for Freesky?",
      a: <span>You can find the source code for Freesky on GitHub at <a className="text-[#0560ff]" href="https://github.com/symmetricalboy/freesky.social" target="_blank" rel="noreferrer">github.com/symmetricalboy/freesky.social</a>.</span>,
    },
    {
      q: "I'm having trouble claiming a handle. What should I do?",
      a: <span>If you're having trouble claiming a handle, feel free to contact Dylan Gregori Singer using <a className="text-[#0560ff]" href="https://bsky.app/profile/symmetricalboy.com" target="_blank" rel="noreferrer">@symmetricalboy.com</a> or <a className="text-[#0560ff]" href="https://bsky.app/profile/freesky.social" target="_blank" rel="noreferrer">@freesky.social</a> to request assistance!</span>,
    },
    {
      q: "I still have questions!",
      a: <span>Feel free to reach out to Dylan Gregori Singer on Bluesky at <a className="text-[#0560ff]" href="https://bsky.app/profile/symmetricalboy.com" target="_blank" rel="noreferrer">@symmetricalboy.com</a> or <a className="text-[#0560ff]" href="https://bsky.app/profile/freesky.social" target="_blank" rel="noreferrer">@freesky.social</a> for help!</span>,
    },
  ];

  const { data: handleCount } = api.handle.getHandleCount.useQuery();

  return (
    <Fragment>
      <div>
        <Head>
          <title>freesky.social</title>
          <meta name="description" content="Find your sky." />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#092350] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-20 text-center text-mono ">
            <div className="flex items-center gap-4 -ml-8">
              <Image
                src="/freesky-no_bg-1024px.png"
                alt="Freesky Logo"
                width={144}
                height={144}
                className="h-32 w-32"
              />
              <h1 className="text-5xl font-extrabold tracking-wider sm:text-[4.4rem]">
                Free<span className="text-[#0560ff]">sky</span>
              </h1>
            </div>

            <p className="text-sm italic tracking-wider text-[#999999]">
              Everyone deserves to share their own unique identity with pride.
              <br/>
              Freesky provides more options for Bluesky/ATProto handle domains.
              <br/>
              Freesky is free, open source, for all, forever.
            </p>
            <p className="text-sm italic tracking-wider text-white">
              Find your sky.
            </p>

            {/* Full-Width Section */}
            <div className="mt-8">
              {!formVisible ? (
                <button
                  type="button"
                  className="bg-blue px-12 py-3 text-white hover:text-[#aac7ec] shadow-2xl hover:bg-[#4a6187] hover:ring-4 hover:ring-[#aac7ec] hover:ring-offset-10 rounded-3xl"
                  onClick={() => setFormVisible(true)}
                >
                  Claim a new handle
                </button>
              ) : (
                <div className="py-40 sm:px-12 bg-black/50 border-2 border-[#aac7ec]">
                  <HandleForm />
                </div>
              )}
            </div>

            {/* FAQ Section */}
            <div className="w-full px-4 pt-16">
              <div className="w-full max-w-3xl mx-auto">
                <h2 className="text-3xl font-extrabold text-gray-900">
                  <span className="text-white">Frequently asked questions</span>
                </h2>
                <div className="mt-12 space-y-4">
                  {faqs.map((faq, i) => (
                    <Disclosure as="div" key={i} className="mt-2">
                      {({ open }) => (
                        <Fragment>
                          <Disclosure.Button className="flex w-full justify-between rounded-lg bg-[#323232] px-4 py-2 text-left text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                            <span>{faq.q}</span>
                            <ChevronDownIcon
                              className={`${
                                open ? "rotate-180 transform" : ""
                              } h-5 w-5 text-blue-500`}
                            />
                          </Disclosure.Button>
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="transform opacity-0 scale-50"
                            enterTo="transform opacity-100 scale-200"
                            leave="transition ease-in duration-50"
                            leaveFrom="transform opacity-100 scale-200"
                            leaveTo="transform opacity-0 scale-50"
                          >
                            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-[#999999]">
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

            {/* Added whitespace */}
            <div className="h-12"></div>

            {/* Counter moved below FAQ */}
            <div className="py-12 sm:px-8 bg-black/50 border-2 border-[#aac7ec]">
              <p className="text-lg bold">
                <span className="text-[#0560ff] text-4xl font-extrabold block mb-2">
                  {handleCount ? handleCount.count.toLocaleString() : <AnimatedEllipsis />}
                </span>{" "}
                handles have been claimed on Freesky!
              </p>
            </div>

            {/* Added whitespace */}
            <div className="h-12"></div>

            {/* Social Media Links */}
            <div className="flex gap-8 items-center justify-center">
              <Link
                href="https://bsky.app/profile/freesky.social"
                target="_blank"
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <Image src="/bluesky.svg" alt="Bluesky" width={38} height={38} />
              </Link>
              <Link
                href="https://github.com/symmetricalboy/freesky.social"
                target="_blank"
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <Image src="/github.svg" alt="GitHub" width={38} height={38} />
              </Link>
              <Link
                href="https://ko-fi.com/symm"
                target="_blank"
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <Image src="/kofi.svg" alt="Ko-fi" width={48} height={48} />
              </Link>
            </div>

            {/* Copyright line */}
            <p className="text-[#646464] italic">
              Copyright (c) 2025 Dylan Gregori Singer (symmetricalboy)
            </p>
          </div>
        </main>
      </div>
      <Analytics />
    </Fragment>
  );
}