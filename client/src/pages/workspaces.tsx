import { useState, useEffect } from "react";

interface Workspace {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  status: string;
  templateId: number;
  settings: string;
  owner?: {
    name: string;
    email: string;
  };
  template?: {
    name: string;
  };
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspaces");
        if (!response.ok) {
          throw new Error("Failed to fetch workspaces");
        }
        const data = await response.json();
        setWorkspaces(data.workspaces || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, []);

  // Parse JSON string to object
  const parseSettings = (settingsStr: string | null) => {
    if (!settingsStr) return {};
    try {
      return JSON.parse(settingsStr);
    } catch (e) {
      return { error: "Error parsing settings" };
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Workspaces</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.length > 0 ? (
            workspaces.map((workspace) => {
              const settings = parseSettings(workspace.settings);
              return (
                <div key={workspace.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{workspace.name}</h2>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                        ${workspace.status === 'active' ? 'bg-green-100 text-green-800' : 
                          workspace.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {workspace.status}
                      </span>
                    </div>
                    
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{workspace.description}</p>
                    
                    <div className="mt-4 space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner ID:</span>
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">{workspace.ownerId}</span>
                      </div>
                      
                      {workspace.owner && (
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner:</span>
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">{workspace.owner.name}</span>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Template ID:</span>
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">{workspace.templateId}</span>
                      </div>
                      
                      {workspace.template && (
                        <div>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Template:</span>
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">{workspace.template.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Settings</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                        <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-40">
                          {JSON.stringify(settings, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 dark:text-gray-300">No workspaces found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}