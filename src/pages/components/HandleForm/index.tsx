import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useState,
  useRef,
  useEffect,
} from "react";
import { api } from "~/utils/api";
import Select from "../Select";
import regex from "~/utils/regex";
import { domains } from "~/utils/domains";

// Helper function for input debouncing (remains unchanged)
const delayedInput = (
  func: (event: ChangeEvent<HTMLInputElement>) => void
) => {
  let timer: NodeJS.Timeout | null = null;
  return (event: ChangeEvent<HTMLInputElement>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      func(event);
    }, 300);
  };
};

export default function HandleForm() {
  // --- State Variables ---
  const [currentStep, setCurrentStep] = useState(1);
  const [domainName, setDomainName] = useState(
    `${Object.keys(domains)[0] || ""}`
  );
  const [handleValue, sethandleValue] = useState("");
  const [isHandleAvailable, setIsHandleAvailable] = useState<boolean | null>(
    null
  ); // null for initial state, true/false after check
  const [domainValue, setDomainValue] = useState("");

  // --- Form Validation ---
  const [handleValueValidator, sethandleValueValidator] =
    useState<boolean>(false);
  const [domainValueValidator, setDomainValueValidator] =
    useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- tRPC Hooks ---
  const utils = api.useContext();
  const checkHandleAvailability = api.handle.checkAvailability.useMutation();
  const recordMutation = api.handle.createNew.useMutation({
    onMutate: async () => {
      await utils.handle.invalidate();
    },
  });

  // --- Effect to Check Handle Availability (Step 2) ---
  useEffect(() => {
    if (currentStep === 2 && handleValue) {
      setIsHandleAvailable(null); // Reset when handleValue changes

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        checkHandleAvailability.mutate(
          { handle: `${handleValue}.${domainName}` },
          {
            onSuccess: (data) => {
              setIsHandleAvailable(data.available);
            },
            onError: (error) => {
              console.error("Handle availability check failed:", error);
              setIsHandleAvailable(false); // Treat errors as unavailable
            },
          }
        );
      }, 500); // Debounce the check
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [handleValue, domainName, currentStep]);

  // --- Input Change Handler with Validation ---
  const handleInputChange = (
    onChange: Dispatch<SetStateAction<string>>,
    action: Dispatch<SetStateAction<boolean>>,
    validationRegex: RegExp
  ) =>
    delayedInput((event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      onChange(newValue);

      if (newValue.length > 0 && !newValue.match(validationRegex)) {
        action(true);
      } else {
        action(false);
      }
    });

  // --- Form Submission (Step 4) ---
  const addRecord = () => {
    if (recordMutation.isLoading) return;

    recordMutation.mutate(
      {
        handleValue,
        domainValue,
        domainName,
      },
      {
        onSuccess: () => {
          setCurrentStep(5); // Move to step 5 on success
        },
      }
    );
  };

  // --- Navigation Logic ---
  const handleNext = () => {
    if (currentStep === 2 && isHandleAvailable === false) {
      return; // Prevent moving forward if handle is not available
    }
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  // --- Get Domain Type ---
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const domainType = domains[domainName] || "file";

  // --- Render the Form ---
  return (
    <>
      <div className="w-full p-4 rounded-lg">
        {/* --- Progress Indicator --- */}
        <div className="flex justify-between mb-4">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div
              key={step}
              className={`h-2 w-1/6 rounded-full ${
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

        {
          /* --- Step 2: Check handle availability --- */
        }
        {
          currentStep === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Choose Your Handle</h2>
              <div className="mt-2">
                Preview: @{handleValue || "customHandle"}.{domainName}
              </div>
              <div className="mt-5 rounded-md p-3 font-light">
                <div className="pt-2">Enter your handle: </div>
                <div className="font-mono">
                  <input
                    onChange={handleInputChange(
                      sethandleValue,
                      sethandleValueValidator,
                      regex.handleValueRegex
                    )}
                    value={handleValue}
                    className="inline-block rounded-md border border-slate-300 bg-white py-2 pl-3 pr-3 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                    placeholder="customHandle"
                    type="text"
                  />
                  .{domainName}
                </div>
                {handleValueValidator && (
                  <div className="mt-2 text-red-500">Invalid handle format.</div>
                )}
                {isHandleAvailable === true && (
                  <div className="mt-2 text-green-500">Handle is available!</div>
                )}
                {isHandleAvailable === false && (
                  <div className="mt-2 text-red-500">Handle is not available.</div>
                )}
              </div>
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
                  disabled={!handleValue || handleValueValidator || !isHandleAvailable}
                  className={`px-4 py-2 rounded-md ${
                    !handleValue || handleValueValidator || !isHandleAvailable
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue text-white"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )
        }
        
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

        {/* --- Step 4: Submit DID --- */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Submit Your DID</h2>
            <div className="font-light">
              {domainType === "file" ? (
                <>
                  <div className="pt-2">
                    Upload a text file containing your DID to:
                  </div>
                  <div className="font-mono">
                    https://{handleValue || "customHandle"}.{domainName}
                    /.well-known/atproto-did
                  </div>
                </>
              ) : (
                <>
                  <div className="pt-2">
                    Create a TXT record with the following value:
                  </div>
                  <div className="font-mono">
                    _atproto.{handleValue || "customHandle"}.{domainName}
                  </div>
                </>
              )}

              <div className="pt-2">DID Value:</div>
              <div className="font-mono">
                <input
                  onChange={handleInputChange(
                    setDomainValue,
                    setDomainValueValidator,
                    domainType === "file"
                      ? regex.fileDidValue
                      : regex.dnsDidValue
                  )}
                  value={domainValue}
                  className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-3 pr-3 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                  placeholder="did:plc:...."
                  type="text"
                />
              </div>
              {domainValueValidator && (
                <div className="mt-2 text-red-500">
                  Invalid DID format.
                </div>
              )}
            </div>

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
                onClick={addRecord}
                disabled={domainValueValidator || !domainValue}
                className={`px-4 py-2 rounded-md ${
                  domainValueValidator || !domainValue
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue text-white"
                }`}
              >
                Submit
              </button>
              {recordMutation.error && (
                <div className="mt-2 text-red-500">
                  {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */}
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
            <p className="mb-4">
              Copy the following handle and paste it into the "Change Handle"
              section on your Bluesky profile settings page:
            </p>
            <div className="bg-grayLight p-3 rounded-md flex items-center">
              <code className="font-mono text-[#092350] select-all">
                @{handleValue}.{domainName}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `@${handleValue}.${domainName}`
                  );
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
            <p>
              You have successfully set up your custom handle. It may take some
              time to propagate across the Bluesky network.
            </p>
          </div>
        )}
      </div>
    </>
  );
}