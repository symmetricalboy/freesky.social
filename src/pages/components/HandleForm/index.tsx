import { useState } from 'react'
import { api } from "~/utils/api";
import Select from "../Select";
import regex from "~/utils/regex";
import { BskyAgent } from '@atproto/api';
import AnimatedEllipsis from "../AnimatedEllipsis";
import { type HandleAvailabilityResponse } from '~/types/handle';
import { createDelayedValidator } from '~/utils/form';

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
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  // --- Form Submission (Step 4) ---
  const addRecord = async () => {
    if (recordMutation.isLoading) return;

    try {
      // First authenticate with Bluesky
      const agent = new BskyAgent({
        service: 'https://bsky.social'
      });

      await agent.login({
        identifier: blueskyIdentifier,
        password: blueskyPassword
      });

      const did = agent.session?.did;
      if (!did) throw new Error("Could not get DID from session");

      // Submit the handle registration
      await recordMutation.mutateAsync({
        handleValue,
        domainValue: did,
        domainName,
        identifier: blueskyIdentifier,
        password: blueskyPassword,
      });

      // Move to step 5 first to show manual instructions
      setCurrentStep(5);

      // Try automatic update after a longer delay to allow for DNS propagation
      void setTimeout(async () => {
        try {
          // Try to verify the handle first
          const verifyAttempts = 3;
          for(let i = 0; i < verifyAttempts; i++) {
            try {
              // Check if our handle verification is working
              const response = await fetch(`/.well-known/atproto-did/${handleValue}@${domainName}`);
              if (response.ok) {
                // If verification is working, try to update the handle
                await agent.updateHandle({
                  handle: `${handleValue}.${domainName}`
                });
                
                setHandleAutoUpdated(true);
                setCurrentStep(6);
                setBlueskyPassword("");
                setBlueskyIdentifier("");
                return;
              }
            } catch (e) {
              console.log(`Verification attempt ${i + 1} failed, retrying...`);
            }
            // Wait 5 seconds between attempts
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          // If we get here, we couldn't verify after all attempts
          console.log("Could not verify handle after multiple attempts");
        } catch (handleError) {
          console.error("Failed to update handle:", handleError);
          // Already on step 5, showing manual instructions
        }
      }, 1000); // Start checking after 1 second

    } catch (error) {
      console.error("Authentication error:", error);
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
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div
              key={step}
              className={`h-3 w-1/6 rounded-full ${
                step <= currentStep ? "bg-blue" : "bg-[#646464]"
              }`}
            ></div>
          ))}
        </div>

        {/* --- Step 1: Choose a domain --- */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-3xl font-bold mb-4">Choose a domain</h2>
            <Select value={domainName} onChange={setDomainName} />
            <button
              type="button"
              onClick={handleNext}
              className="mt-4 bg-blue text-white px-4 py-2 rounded-md"
            >
              Next
            </button>
          </div>
        )}

        {/* --- Step 2: Choose Your Handle --- */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-3xl font-bold mb-4">Choose Your Handle</h2>
            <div className="mt-5 rounded-md p-3 font-light">
              <div className="font-mono">
                <input
                  onChange={handleValidator}
                  value={handleValue}
                  className="inline-block rounded-md border border-slate-300 bg-[#4a6187] py-2 pl-3 pr-3 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                  placeholder="your-handle"
                  type="text"
                />
                .{domainName}
              </div>
              {isHandleInvalid && (
                <div className="mt-2 text-red-500">
                  Invalid handle format.
                </div>
              )}
              {!isHandleInvalid && handleValue && (
                <div className="mt-2">
                  {isCheckingHandle ? (
                    <span className="text-gray-500">
                      Checking availability<AnimatedEllipsis />
                    </span>
                  ) : handleAvailabilityStatus ? (
                    handleAvailabilityStatus.isAvailable ? (
                      <span className="text-green-600">✓ Handle is available!</span>
                    ) : (
                      <span className="text-red-600">
                        ✗ {handleAvailabilityStatus.error || "Handle is not available"}
                      </span>
                    )
                  ) : null}
                </div>
              )}
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleBack}
                className="bg-[#646464] text-white px-4 py-2 rounded-md mr-2"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  !handleValue || 
                  isHandleInvalid || 
                  !handleAvailabilityStatus?.isAvailable
                }
                className={`px-4 py-2 rounded-md ${
                  !handleValue || 
                  isHandleInvalid || 
                  !handleAvailabilityStatus?.isAvailable
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue text-white"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* --- Step 3: Navigation Instructions --- */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              Visit Your Bluesky Profile
            </h2>
            <p className="mb-4">
              Open a new tab and go to your Bluesky profile settings to update
              your handle.
            </p>
            <a
              href="https://bsky.app/settings/handle"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue text-white px-4 py-2 rounded-md"
            >
              Go to Bluesky Settings
            </a>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleBack}
                className="bg-gray-300 text-white px-4 py-2 rounded-md mr-2"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="bg-blue text-white px-4 py-2 rounded-md"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* --- Step 4: Verify Ownership --- */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-3xl font-bold mb-4">Verify Ownership</h2>
            <div className="font-light space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Bluesky Account
                </label>
                <input
                  value={blueskyIdentifier}
                  onChange={(e) => setBlueskyIdentifier(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 bg-[#4a6187] py-2 pl-3 pr-3 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                  placeholder="handle.bsky.social or email"
                  type="text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  App Password
                </label>
                <input
                  value={blueskyPassword}
                  onChange={(e) => setBlueskyPassword(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 bg-[#4a6187] py-2 pl-3 pr-3 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                  placeholder="Your Bluesky app password"
                  type="password"
                />
                <p className="mt-1 text-sm text-gray-400">
                  We&apos;ll use these credentials to verify your identity and update your handle.
                </p>
              </div>

              <div className="mt-4 p-4 bg-blue-100/10 border border-blue-400 rounded-md text-blue-300">
                <p className="font-medium">What will happen:</p>
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>We'll verify your Bluesky account</li>
                  <li>Register {handleValue}.{domainName} for your DID</li>
                  <li>Update your handle automatically</li>
                </ol>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleBack}
                className="bg-[#646464] text-white px-4 py-2 rounded-md mr-2"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void addRecord()}
                disabled={!blueskyIdentifier || !blueskyPassword}
                className={`px-4 py-2 rounded-md ${
                  !blueskyIdentifier || !blueskyPassword
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue text-white"
                }`}
              >
                Submit
              </button>
              {recordMutation.error && (
                <div className="mt-2 text-red-500">
                  Error: {recordMutation.error.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Step 5: Instructions for Bluesky --- */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              Update Your Handle on Bluesky
            </h2>
            <p className="mb-4 text-yellow-300">
              We couldn&apos;t update your handle automatically. Please update it manually:
            </p>
            <p className="mb-4">
              Copy the following handle and paste it into the &quot;Change Handle&quot; section on your Bluesky profile settings page:
            </p>
            <div className="bg-grayLight p-3 rounded-md flex items-center">
              <code className="font-mono text-[#092350] select-all">
                {handleValue}.{domainName}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(`${handleValue}.${domainName}`);
                }}
                className="ml-4 bg-blue text-white px-3 py-1 rounded-md text-sm"
              >
                Copy
              </button>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleNext}
                className="bg-blue text-white px-4 py-2 rounded-md"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* --- Step 6: Congrats! --- */}
        {currentStep === 6 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Congratulations!</h2>
            {handleAutoUpdated ? (
              <div>
                <p className="mb-4">
                  Your handle has been successfully updated to <span className="font-mono">@{handleValue}.{domainName}</span>!
                </p>
                <p>
                  The change should be visible on your profile immediately.
                </p>
              </div>
            ) : (
              <p>
                Your handle has been registered. Please make sure you&apos;ve updated it in your Bluesky settings.
                It may take some time to propagate across the Bluesky network.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}