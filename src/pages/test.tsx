import { api } from "~/utils/api";

export default function TestPage() {
  const testQuery = api.handle.test.useQuery(undefined, {
    retry: false,
    onError: (error) => {
      console.error('Test query error:', error);
    }
  });
  
  const handleCountQuery = api.handle.getHandleCount.useQuery(undefined, {
    retry: false,
    onError: (error) => {
      console.error('Handle count query error:', error);
    }
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Base URL</h2>
        <pre className="bg-gray-100 p-2 rounded mt-2">
          {typeof window !== 'undefined' ? window.location.origin : 'Server-side rendering'}
        </pre>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Test Endpoint</h2>
        <div className="bg-gray-100 p-2 rounded mt-2">
          <h3>Status: {testQuery.status}</h3>
          {testQuery.isError && (
            <div className="text-red-500">
              <p>Error: {testQuery.error?.message}</p>
              <p>Error type: {testQuery.error?.name}</p>
              <pre>{JSON.stringify(testQuery.error, null, 2)}</pre>
            </div>
          )}
          {testQuery.data && (
            <pre>{JSON.stringify(testQuery.data, null, 2)}</pre>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Handle Count</h2>
        <div className="bg-gray-100 p-2 rounded mt-2">
          <h3>Status: {handleCountQuery.status}</h3>
          {handleCountQuery.isError && (
            <div className="text-red-500">
              <p>Error: {handleCountQuery.error?.message}</p>
              <p>Error type: {handleCountQuery.error?.name}</p>
              <pre>{JSON.stringify(handleCountQuery.error, null, 2)}</pre>
            </div>
          )}
          {handleCountQuery.data && (
            <pre>{JSON.stringify(handleCountQuery.data, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
} 