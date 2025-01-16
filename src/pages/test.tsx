import { api } from "~/utils/api";

export default function TestPage() {
  const testQuery = api.handle.test.useQuery();
  const handleCountQuery = api.handle.getHandleCount.useQuery();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Test Endpoint</h2>
        <pre className="bg-gray-100 p-2 rounded mt-2">
          {JSON.stringify(testQuery.data ?? testQuery.error, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Handle Count</h2>
        <pre className="bg-gray-100 p-2 rounded mt-2">
          {JSON.stringify(handleCountQuery.data ?? handleCountQuery.error, null, 2)}
        </pre>
      </div>
    </div>
  );
} 