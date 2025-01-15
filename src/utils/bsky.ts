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

    const json = await response.json();
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
    
    const json = await response.json();
    return {
      status: response.status,
      json,
    };
  } catch (error) {
    console.error('Error validating handle:', error);
    throw error;
  }
};
