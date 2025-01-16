import { useState, Fragment } from 'react'
import { api } from "~/utils/api";
import Select from "../Select";
import regex from "~/utils/regex";
import { BskyAgent } from '@atproto/api';
import AnimatedEllipsis from "../AnimatedEllipsis";
import { type HandleAvailabilityResponse } from '~/types/handle';
import { createDelayedValidator } from '~/utils/form';
import { env } from "~/env.mjs";
import { ArrowTopRightOnSquareIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Disclosure, Transition } from "@headlessui/react";

export default function HandleForm() {
  // --- State Variables ---
  const [currentStep, setCurrentStep] = useState(1);
  const [domainName, setDomainName] = useState("bsky.social");
  const [handleValue, sethandleValue] = useState("");
  const [blueskyIdentifier, setBlueskyIdentifier] = useState("");
  const [blueskyPassword, setBlueskyPassword] = useState("");
  const [isHandleInvalid, setIsHandleInvalid] = useState(false);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [handleAvailabilityStatus, setHandleAvailabilityStatus] = useState<{
    isAvailable: boolean | null;
    error?: string;
  } | null>(null);
  const [handleAutoUpdated, setHandleAutoUpdated] = useState(false);

  // --- tRPC Hooks ---
  const utils = api.useContext();
  const recordMutation = api.handle.createNew.useMutation({
    onMutate: () => {
      void utils.handle.invalidate();
    },
  });

  // Keep queries but rename them since they're used for their effects
  api.handle.checkAvailability.useQuery(
    { handleValue, domainName },
    {
      enabled: !!handleValue && !isHandleInvalid,
      onSuccess: (data: HandleAvailabilityResponse) => {
        setHandleAvailabilityStatus({
          isAvailable: data.available,
          error: data.error
        });
        setIsCheckingHandle(false);
      },
      onError: () => {
        setHandleAvailabilityStatus(null);
        setIsCheckingHandle(false);
      }
    }
  );

  // --- Navigation Logic ---
  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prevStep) => prevStep - 1);
  };

  // --- Form Submission (Step 4) ---
  const addRecord = async () => {
    if (recordMutation.isLoading) return;

    try {
      console.log("Test mode:", env.NEXT_PUBLIC_TEST_MODE);
      
      if (env.NEXT_PUBLIC_TEST_MODE === "true") {
        console.log("Entering test mode path");
        // Test mode - skip all auth
        await recordMutation.mutateAsync({
          handleValue,
          domainValue: "did:test:123",
          domainName,
          identifier: "test",
          password: "test",
        });
        console.log("Test mode mutation complete");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        handleNext();
        return;
      }

      console.log("Entering regular auth path");
      // Regular flow with Bluesky auth
      const agent = new BskyAgent({
        service: 'https://bsky.social'
      });

      await agent.login({
        identifier: blueskyIdentifier,
        password: blueskyPassword
      });

      const did = agent.session?.did;
      if (!did) throw new Error("Could not get DID from session");

      await recordMutation.mutateAsync({
        handleValue,
        domainValue: did,
        domainName,
        identifier: blueskyIdentifier,
        password: blueskyPassword,
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(4);
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  const handleValidator = createDelayedValidator(
    sethandleValue,
    setIsHandleInvalid,
    setIsCheckingHandle,
    regex.handleValueRegex
  );

  // --- Render the Form ---
  return (
    <>
      <div className="w-full p-4 rounded-lg">
        {/* --- Progress Indicator --- */}
        <div className="mb-8">
          {/* Step Titles */}
          <div className="grid grid-cols-4 mb-2">
            {[
              { num: 1, title: "Domain" },
              { num: 2, title: "Handle" },
              { num: 3, title: "Verify" },
              { num: 4, title: "Update" }
            ].map((step) => (
              <div key={step.num} className={`text-sm text-center ${
                step.num <= currentStep ? "text-white" : "text-[#646464]"
              }`}>
                {step.num}. {step.title}
              </div>
            ))}
          </div>
          {/* Progress Bar */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1 w-full ${
                  step <= currentStep ? "bg-blue" : "bg-[#323232]"
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* --- Step 1: Choose a domain --- */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-3xl font-bold mb-12 mt-12">Choose a domain</h2>
            <Select value={domainName} onChange={setDomainName} />
            <button
              type="button"
              onClick={handleNext}
              className="mt-24 bg-blue px-20 py-5 text-white hover:bg-[#4a6187] hover:ring-1 hover:font-bold hover:ring-white hover:ring-offset-10 text-sm"
            >
              Next
            </button>
          </div>
        )}

        {/* --- Step 2: Choose Your Handle --- */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-3xl font-bold mb-12 mt-12">Choose your handle</h2>
            <div className="mt-5 rounded-md p-3 text-white">
              <div className="text-white">
                <span className="px-2">@</span>
                <input
                  onChange={handleValidator}
                  value={handleValue}
                  className="text-white inline-block rounded-md border border-slate bg-[#4a6187] py-1 pl-3 pr-3 shadow-sm placeholder:italic placeholder:text-slate focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                  placeholder="your-handle"
                  type="text"
                />
                <span className="px-2">.{domainName}</span>
              </div>
              <div className="h-[220px] mt-8">
                {isHandleInvalid && (
                  <div>
                    <span className="text-red flex flex-col items-center">
                      <p className="text-5xl mb-4">✗</p>
                      Invalid handle format.
                    </span>
                    <div className="mt-4 text-[#999999] text-sm text-left">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Handles can contain Letters ( a-z ), numbers ( 0-9 ), and hypens ( - ).</li>
                        <li>Handles cannot start or end with a hyphen ( - ).</li>
                        <li>Handles are not case-sensitive, and are always shown in lowercase.</li>
                        <li>Handles can be between 1 and 63 characters in length.</li>
                      </ul>
                    </div>
                  </div>
                )}
                {!isHandleInvalid && handleValue && (
                  <div className="h-full flex items-center justify-center">
                    {isCheckingHandle ? (
                      <span className="text-white text-xl">
                        Checking availability...
                      </span>
                    ) : handleAvailabilityStatus ? (
                      handleAvailabilityStatus.isAvailable ? (
                        <span className="text-green">
                          <p className="text-5xl mb-8">✓</p>
                          Handle is available!
                        </span>
                      ) : (
                        <span className="text-red">
                          <p className="text-5xl mt-4 mb-4">✗</p>
                          {handleAvailabilityStatus.error || "Handle is not available"}
                        </span>
                      )
                    ) : null}
                  </div>
                )}
                {!handleValue && !isHandleInvalid && (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-[#64646464] text-[10rem] font-bold">@</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-12 gap-12 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="bg-[#323232] px-20 py-5 text-[#999999] hover:bg-[#4a6187] hover:ring-1 hover:font-bold hover:ring-white hover:ring-offset-10 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void addRecord()}
                disabled={!env.NEXT_PUBLIC_TEST_MODE && (!blueskyIdentifier || !blueskyPassword)}
                className={`px-20 py-5 text-sm ${
                  !env.NEXT_PUBLIC_TEST_MODE && (!blueskyIdentifier || !blueskyPassword)
                    ? "bg-[#161616] text-[#646464] cursor-not-allowed opacity-50"
                    : "bg-blue text-white hover:bg-[#4a6187] hover:ring-1 hover:font-bold hover:ring-white hover:ring-offset-10"
                }`}
              >
                Submit
              </button>
            </div>
            {recordMutation.error && (
              <div className="mt-4 text-red-500">
                Error: {recordMutation.error.message}
              </div>
            )}
          </div>
        )}

        {/* --- Step 3: Verify Ownership --- */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-3xl font-bold mb-16 mt-12">Verify account ownership</h2>
            <div className="font-light space-y-12 mb-16">
              <div className="mb-12">
                <Disclosure>
                  {({ open }) => (
                    <Fragment>
                      <Disclosure.Button className="flex w-full justify-between rounded-lg bg-[#323232] px-4 py-2 text-left text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                        <span>What is an App Password and why do I need it?</span>
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
                          <p>An App Password is a special password for third-party apps to access your Bluesky account safely.
                          
                          We need it to verify your ownership of the account and register the handle.</p>
                          <p className="mt-6">You can create one at{" "}
                            <a 
                              href="https://bsky.app/settings/app-passwords" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue inline-flex items-center"
                            >
                              Bluesky App Passwords
                              <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                            </a>
                          </p>
                          <p className="mt-6">For security, you can (and should) delete the app password immediately after completing this process.</p>
                        </Disclosure.Panel>
                      </Transition>
                    </Fragment>
                  )}
                </Disclosure>
              </div>

              <div className="mt-12">
                <label className="block text-sm font-medium mb-6">
                  Bluesky Account
                </label>
                <input
                  value={blueskyIdentifier}
                  onChange={(e) => setBlueskyIdentifier(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 bg-[#4a6187] py-4 pl-3 pr-3 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                  placeholder="handle.bsky.social or email"
                  type="text"
                />
              </div>

              <div className="mt-12">
                <label className="block text-sm font-medium mb-6">
                  App Password
                </label>
                <input
                  value={blueskyPassword}
                  onChange={(e) => setBlueskyPassword(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 bg-[#4a6187] py-4 pl-3 pr-3 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                  placeholder="Your Bluesky app password"
                  type="password"
                />
              </div>
            </div>

            <div className="mt-16 gap-12 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="bg-[#323232] px-20 py-5 text-[#999999] hover:bg-[#4a6187] hover:ring-1 hover:font-bold hover:ring-white hover:ring-offset-10 text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void addRecord()}
                disabled={!env.NEXT_PUBLIC_TEST_MODE && (!blueskyIdentifier || !blueskyPassword)}
                className={`px-20 py-5 text-sm ${
                  !env.NEXT_PUBLIC_TEST_MODE && (!blueskyIdentifier || !blueskyPassword)
                    ? "bg-[#161616] text-[#646464] cursor-not-allowed opacity-50"
                    : "bg-blue text-white hover:bg-[#4a6187] hover:ring-1 hover:font-bold hover:ring-white hover:ring-offset-10"
                }`}
              >
                Submit
              </button>
            </div>
            {recordMutation.error && (
              <div className="mt-4 text-red-500">
                Error: {recordMutation.error.message}
              </div>
            )}
          </div>
        )}

        {/* --- Step 4: Update Handle Instructions --- */}
        {currentStep === 4 && (
          <div className="max-w-[680px] mx-auto">
            <h2 className="text-3xl font-bold mb-12 mt-12">
              Update your handle on Bluesky
            </h2>
            <p className="mb-12 mt-12 text-sm text-[#999999]">
              Your handle is now registered with Freesky!
              <br/><br/>
              Follow these steps to update your handle on Bluesky:
            </p>
            <div className="space-y-16 mb-8">
              <div className="mb-12 flex flex-col gap-2">
                <p>1. Go to{" "}
                  <a
                    href="https://bsky.app/settings/account"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue inline-flex items-center"
                  >
                    Bluesky account settings
                    <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                  </a>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <p>2. Click &quot;Handle&quot; :</p>
                <div className="flex justify-center">
                  <img src="/handle.png" alt="Click Handle" className="h-auto w-48 mt-4 border-4 border-[#aac7ec] p-10 bg-[#32323232] rounded-3xl shadow-2xl" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p>3. Click &quot;I have my own domain&quot; :</p>
                <div className="flex justify-center">
                  <img src="/domain.png" alt="Click I have my own domain" className="h-auto w-full mt-4 border-4 border-[#aac7ec] p-12 bg-[#32323232] rounded-3xl shadow-2xl" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p>4. Click &quot;No DNS Panel&quot; :</p>
                <div className="flex justify-center">
                  <img src="/no-panel.png" alt="Click No DNS Panel" className="h-auto w-96 mt-4 border-4 border-[#aac7ec] p-12 bg-[#32323232] rounded-3xl shadow-2xl" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="mt-4">5. Copy your new handle from right here :</p>
              </div>
            </div>
            
            <div className="flex justify-center mb-20">
              <div className="bg-[#4a6187] p-3 rounded-full flex items-center w-full">
                <span className="text-white px-2 font-bold text-xl">@</span>
                <code className="font-bold text-white text-lg select-all">
                  {handleValue}.{domainName}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(`${handleValue}.${domainName}`);
                  }}
                  className="ml-auto bg-blue text-white px-5 py-2 rounded-full text-medium hover:bg-[#4a6187] hover:ring-1 hover:font-bold hover:ring-white hover:ring-offset-2"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="space-y-16 mb-8">
              <div className="flex flex-col gap-2">
                <p>6. Paste your handle into the field at the top :</p>
                <div className="flex justify-center">
                  <img src="/enter.png" alt="Enter your new handle" className="h-auto w-96 mt-4 border-4 border-[#aac7ec] p-12 bg-[#32323232] rounded-3xl shadow-2xl" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p>7. Click &quot;Verify Text File&quot; :</p>
                <div className="flex justify-center">
                  <img src="/verify.png" alt="Click Verify Text File" className="h-auto w-full mt-4 border-4 border-[#aac7ec] p-12 bg-[#32323232] rounded-3xl shadow-2xl" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p>8. Click &quot;Update Handle&quot; :</p>
                <div className="flex justify-center">
                  <img src="/update.png" alt="Click Update Handle" className="h-auto w-full mt-4 border-4 border-[#aac7ec] p-12 bg-[#32323232] rounded-3xl shadow-2xl" />
                </div>
              </div>
            </div>

            <div className="mt-32">
              <p className="text-9xl font-bold">🎉</p>
              <p className="mt-16 text-3xl text-[#aac7ec]">
                Thanks for using Freesky!
              </p>
              <a
                href={`https://bsky.app/intent/compose?text=${encodeURIComponent(`I just claimed my new Bluesky handle with freesky.social! 🎉`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-32 ml-auto text-2xl hover:font-bold bg-blue w-auto h-24 flex items-center justify-center text-white hover:bg-[#4a6187] hover:ring-1 hover:tracking-wider hover:ring-white rounded-full"
              >
                Share this on Bluesky!
              </a>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setCurrentStep(1);
                  sethandleValue("");
                  setBlueskyIdentifier("");
                  setBlueskyPassword("");
                  setHandleAvailabilityStatus(null);
                  setIsHandleInvalid(false);
                  setIsCheckingHandle(false);
                }}
                className="mt-24 bg-[#323232] px-20 py-5 text-[#999999] hover:bg-[#4a6187] hover:ring-1 hover:font-bold hover:ring-white hover:ring-offset-10 text-sm"
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}