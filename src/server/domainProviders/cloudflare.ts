import { env } from "process";

interface CloudflareResponse {
  success: boolean;
  result: Array<{
    id: string;
    // Add other fields if needed
  }>;
}

const cloudflareProvider = {
  createSubdomain: async (
    domainName: string,
    domainValue: string,
    zoneName: string,
    type: string
  ) => {
    const zones = env.DOMAINS_CLOUDFLARE?.split(",") ?? [];
    const zoneId = zones.find((el) => el.startsWith(zoneName))?.split(":")[1] ?? '';

    const recordName = type === 'TXT' && domainName !== zoneName 
      ? `_atproto.${domainName}` 
      : domainName;
      
    const recordContent = type === 'TXT' && domainName !== zoneName
      ? `did=${domainValue}` 
      : domainValue;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        body: JSON.stringify({
          name: recordName,
          type,
          content: recordContent,
          ttl: 60,
          proxied: false
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.CLOUDFLARE_SECRET ?? ""}`,
        },
        method: "POST",
      }
    );

    type CloudflareResponse = {
      success?: boolean;
    };
    const { success } = (await response.json()) as CloudflareResponse;
    return response.status === 200 && success;
  },

  deleteSubdomain: async (
    domainName: string,
    zoneName: string,
    type: string
  ) => {
    const zones = env.DOMAINS_CLOUDFLARE?.split(",") ?? [];
    const zoneId = zones.find((el) => el.startsWith(zoneName))?.split(":")[1] ?? '';
    
    const recordName = type === 'TXT' ? `_atproto.${domainName}` : domainName;
    const listResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${recordName}`,
      {
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_SECRET ?? ''}`,
        },
      }
    );
    
    type CloudflareResponse = {
      success: boolean;
      result: Array<{ id: string }>;
    };

    const records = (await listResponse.json()) as CloudflareResponse;
    if (records.success && records.result?.[0]?.id) {
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${records.result[0].id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${env.CLOUDFLARE_SECRET ?? ''}`,
          },
        }
      );
    }
  },
};

export default cloudflareProvider;
