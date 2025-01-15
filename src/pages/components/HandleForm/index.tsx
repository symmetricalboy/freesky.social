import { useState, type Dispatch, type SetStateAction, type ChangeEvent } from 'react'
import { api } from "~/utils/api";
import Select from "../Select";
import regex from "~/utils/regex";

type Timer = ReturnType<typeof setTimeout>;

// Add a new type for handle availability response
type HandleAvailabilityResponse = {
  available: boolean;
  error?: string;
};

export default function HandleForm() {
  // --- State Variables ---
  const [currentStep, setCurrentStep] = useState(1);
  const [domainName, setDomainName] = useState("bsky.social");
  const [handleValue, sethandleValue] = useState("");
  const [domainValue, setDomainValue] = useState("");

  // --- Form Validation ---
  const [handleValueValidator, sethandleValueValidator] =
    useState<boolean>(false);
  const [domainValueValidator, setDomainValueValidator] =
    useState<boolean>(false);

  // --- tRPC Hooks ---
  const utils = api.useContext();
  const recordMutation = api.handle.createNew.useMutation({
    onMutate: async () => {
      await utils.handle.invalidate();
    },
  });

  // --- Navigation Logic ---
  const handleNext = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

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

  // --- Add new tRPC query ---
  const [isHandleAvailable, setIsHandleAvailable] = useState<boolean | null>(null);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);

  // Update the state to include error message
  const [handleAvailabilityStatus, setHandleAvailabilityStatus] = useState<{
    isAvailable: boolean | null;
    error?: string;
  } | null>(null);

  // Update the tRPC query
  const _handleAvailabilityQuery = api.handle.checkAvailability.useQuery(
    { handleValue, domainName },
    {
      enabled: !!handleValue && !handleValueValidator,
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

  // Add new state for existing handle warning
  const [existingHandle, setExistingHandle] = useState<{
    handle: string;
    domain: string;
  } | null>(null);

  // Add the query
  const _existingHandleQuery = api.handle.checkExistingHandle.useQuery(
    { domainValue },
    {
      enabled: !!domainValue && !domainValueValidator,
      onSuccess: (data) => {
        if (data.exists) {
          setExistingHandle({
            handle: data.handle,
            domain: data.domain,
          });
        } else {
          setExistingHandle(null);
        }
      },
    }
  );

  // Move delayedInput inside the component
  const delayedInput = (
    onChange: Dispatch<SetStateAction<string>>,
    action: Dispatch<SetStateAction<boolean>>,
    regex: RegExp
  ) => {
    let timer: Timer | undefined;
    return (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onChange(value);
      setIsHandleAvailable(null);
      setIsCheckingHandle(true);

      clearTimeout(timer);

      const newTimer = setTimeout(() => {
        if (value.length > 0 && !value.match(regex)) {
          action(true);
          setIsCheckingHandle(false);
        } else {
          action(false);
        }
      }, 2000);

      timer = newTimer;
    };
  };

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
                  onChange={delayedInput(
                    sethandleValue,
                    sethandleValueValidator,
                    regex.handleValueRegex
                  )}
                  value={handleValue}
                  className="inline-block rounded-md border border-slate-300 bg-[#4a6187] py-2 pl-3 pr-3 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                  placeholder="your-handle"
                  type="text"
                />
                .{domainName}
              </div>
              {handleValueValidator && (
                <div className="mt-2 text-red-500">
                  Invalid handle format.
                </div>
              )}
              {!handleValueValidator && handleValue && (
                <div className="mt-2">
                  {isCheckingHandle ? (
                    <span className="text-gray-500">Checking availability...</span>
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
                  handleValueValidator || 
                  !handleAvailabilityStatus?.isAvailable
                }
                className={`px-4 py-2 rounded-md ${
                  !handleValue || 
                  handleValueValidator || 
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

        {/* --- Step 4: Submit DID --- */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-3xl font-bold mb-4">Submit Your DID</h2>
            <div className="font-light">
              <div className="font-mono">
                <input
                  onChange={delayedInput(
                    setDomainValue,
                    setDomainValueValidator,
                    regex.fileDidValue
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
              {existingHandle && (
                <div className="mt-4 p-4 bg-yellow-100/10 border border-yellow-400 rounded-md text-yellow-300">
                  <p className="font-medium">Warning: You already have a handle</p>
                  <p className="mt-2">
                    You currently have the handle <span className="font-mono">@{existingHandle.handle}.{existingHandle.domain}</span>
                  </p>
                  <p className="mt-2">
                    If you continue, you will lose this handle and it will be replaced with{' '}
                    <span className="font-mono">@{handleValue}.{domainName}</span>
                  </p>
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
                onClick={addRecord}
                disabled={domainValueValidator || !domainValue}
                className={`px-4 py-2 rounded-md ${
                  domainValueValidator || !domainValue
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue text-white"
                }`}
              >
                {existingHandle ? 'Replace Existing Handle' : 'Submit'}
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
            <p className="mb-4">
              Copy the following handle and paste it into the &quot;Change Handle&quot; section on your Bluesky profile settings page:
            </p>
            <div className="bg-grayLight p-3 rounded-md flex items-center">
              <code className="font-mono text-[#092350] select-all">
                @{handleValue}.{domainName}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(`@${handleValue}.${domainName}`);
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