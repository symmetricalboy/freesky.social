import { env } from "process";

const regex = {
  getDomainNameRegex: () => {
    const domains = [
      ...(env.DOMAINS_FILE_VERIFICATION?.split(",") || []),
      ...(env.DOMAINS_CLOUDFLARE?.split(",").map((val) => val.split(":")[0]) ||
        []),
    ].join("|");

    return new RegExp(`^(${domains})$`);
  },
  domain: /^((?!-)[A-Za-z0–9-]{1, 63}(?<!-)\.)+[A-Za-z]{2, 63}$/,
  fileDidValue: /^[a-zA-Z0-9]{3}:[a-zA-Z0-9]{3}:[a-zA-Z0-9]{24}$/,
  dnsDidValue: /^[a-zA-Z0-9]{3}=[a-zA-Z0-9]{3}:[a-zA-Z0-9]{3}:[a-zA-Z0-9]{24}$/,
  handleValueRegex: /^[a-z0-9]$|^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
};

export default regex;
