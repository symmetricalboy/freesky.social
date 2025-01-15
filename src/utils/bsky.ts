export const getUserProfile = async (handle: string) => {
  try {
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    interface ProfileResponse {
      message?: string;
      did?: string;
    }

    const data: unknown = await response.json();
    const json = data as ProfileResponse;

    return {
      status: response.status,
      json,
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

// Add a validation function
export const validateHandle = async (handle: string) => {
  try {
    const response = await fetch(
      `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    interface ValidateResponse {
      did: string;
      handle: string;
    }

    const data: unknown = await response.json();
    const json = data as ValidateResponse;
    
    return {
      status: response.status,
      json,
    };
  } catch (error) {
    console.error('Error validating handle:', error);
    throw error;
  }
};
