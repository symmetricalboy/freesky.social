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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
        {options.map((domain) => (
          <button
            key={domain}
            type="button"
            className={`px-12 py-5 rounded-full text-xs hover:ring-white ring-inset
              ${
                value === domain
                  ? "bg-blue text-white ring-white ring-2 font-bold hover:bg-[#999999]"
                  : "bg-[#092350] text-white ring-[#4a6187] ring-1 hover:bg-[#4a6187] hover:font-bold"
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