import type { Dispatch, SetStateAction } from "react";
import { domains } from "~/utils/domains";

interface IProps {
  value: string;
  onChange: Dispatch<SetStateAction<string>>;
}

export default function Select({ value, onChange }: IProps) {
  const options = Object.keys(domains).filter(
    (domain) => domain.trim() !== ""
  );

  return (
    <div className="mt-2">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {options.map((domain) => (
          <button
            key={domain}
            type="button"
            className={`px-10 py-5 rounded-lg text-medium focus:outline-none ring-2 ring-inset ring-gray-300
              ${
                value === domain
                  ? "bg-blue text-white ring-white font-bold"
                  : "bg-[#092350] text-white hover:bg-gray-300"
              }`}
            onClick={() => onChange(domain)}
          >
            {domain}
          </button>
        ))}
      </div>
    </div>
  );
}