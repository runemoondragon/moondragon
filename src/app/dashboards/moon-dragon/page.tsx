"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLaserEyes } from "@omnisat/lasereyes";
import { AccessToken } from "@/lib/const";
import { TokenAssociation } from "@/lib/types";
import { NavBar } from "@/components/NavBar";
import { FiEdit2, FiSave, FiX, FiTrash2 } from 'react-icons/fi';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as AlertDialog from '@radix-ui/react-alert-dialog';

interface TokenDisplayProps {
  token: TokenAssociation;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (newBalance: number) => Promise<void>;
  onDelete: () => Promise<void>;
  onButton1Click: () => void;
  onButton2Click: () => void;
  onButton3Click: () => void;
}

const TokenDisplay = ({ token, isEditing, onEdit, onCancel, onSave, onDelete, onButton1Click, onButton2Click, onButton3Click }: TokenDisplayProps) => {
  const [newBalance, setNewBalance] = useState(token.requiredBalance);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    try {
      await onSave(newBalance);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update balance');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete token');
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-white/5 backdrop-blur-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-lg">{token.tokenName}</h3>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                title="Edit Required Balance"
              >
                <FiEdit2 size={16} />
              </button>
              
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <AlertDialog.Root>
                      <AlertDialog.Trigger asChild>
                        <button
                          className="p-2 hover:bg-red-700 rounded-full transition-colors"
                          disabled={isDeleting}
                        >
                          <FiTrash2 size={16} className={isDeleting ? 'opacity-50' : ''} />
                        </button>
                      </AlertDialog.Trigger>
                      
                      <AlertDialog.Portal>
                        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md p-6 rounded-lg bg-gray-900 border border-gray-800 shadow-xl">
                          <AlertDialog.Title className="text-xl font-semibold mb-4">
                            Are you sure you want to remove this token?
                          </AlertDialog.Title>
                          
                          <AlertDialog.Description className="text-gray-400 mb-6">
                            Removing this token will delete all associated data, including its dashboard, voting sessions, and settings. This action is irreversible. Please confirm if you want to proceed.
                          </AlertDialog.Description>
                          
                          <div className="flex justify-end gap-3">
                            <AlertDialog.Cancel asChild>
                              <button className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                                Cancel
                              </button>
                            </AlertDialog.Cancel>
                            
                            <AlertDialog.Action asChild>
                              <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDeleting ? 'Removing...' : 'Remove Token'}
                              </button>
                            </AlertDialog.Action>
                          </div>
                        </AlertDialog.Content>
                      </AlertDialog.Portal>
                    </AlertDialog.Root>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="max-w-xs px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg"
                      sideOffset={5}
                    >
                      Remove this token and all its associated data. This action is permanent.
                      <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="p-2 hover:bg-green-700 rounded-full transition-colors"
                title="Save Changes"
              >
                <FiSave size={16} />
              </button>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-red-700 rounded-full transition-colors"
                title="Cancel"
              >
                <FiX size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {isEditing ? (
          <div>
            <label className="block text-sm font-medium mb-1">Required Balance</label>
            <input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(parseInt(e.target.value))}
              className="w-full p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-700"
              min="0"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Required Balance: {token.requiredBalance.toLocaleString()}
          </p>
        )}
        {token.associatedUrl && (
          <p className="text-sm text-gray-400">
            Dashboard: <a href={token.associatedUrl} className="text-blue-400 hover:text-blue-300">View Dashboard</a>
          </p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        
        <div className="flex gap-3 mt-4">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={onButton1Click}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Start New Question
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="max-w-xs px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg"
                  sideOffset={5}
                >
                  Create a new voting session for governance decisions. Propose questions and gather input from {token.tokenName} token holders.
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={onButton2Click}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors opacity-70 cursor-not-allowed"
                  disabled
                >
                  Distribute Dividends
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="max-w-xs px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg"
                  sideOffset={5}
                >
                  Allocate and distribute profits or rewards to token holders based on their share of the asset. Coming Soon.
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={onButton3Click}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors opacity-70 cursor-not-allowed"
                  disabled
                >
                  Board Actions
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="max-w-xs px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg"
                  sideOffset={5}
                >
                  Empower board members to execute company-level actions, such as strategic proposals or decision approvals. Coming Soon.
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
      </div>
    </div>
  );
};

// Add Token Form Component
const AddTokenForm = ({ onSubmit }: { onSubmit: (data: any) => Promise<void> }) => {
  const [formData, setFormData] = useState({
    name: '',
    requiredBalance: 0
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        name: '',
        requiredBalance: 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add token');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Token Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-700"
          placeholder="e.g., NEW•TOKEN•NAME"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Required Balance</label>
        <input
          type="number"
          value={formData.requiredBalance}
          onChange={(e) => setFormData(prev => ({ ...prev, requiredBalance: parseInt(e.target.value) }))}
          className="w-full p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-700"
          min="0"
          required
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
      >
        {isSubmitting ? 'Adding Token...' : 'Add Token'}
      </button>
    </form>
  );
};

export default function MoonDragonDashboard() {
  const { address } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [userToken, setUserToken] = useState<TokenAssociation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    const fetchUserToken = async () => {
      if (!address) return;
      try {
        console.log('Fetching token for address:', address);
        const response = await fetch(`/api/user-token?address=${address}`);
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          console.log('Response not OK, setting token to null');
          setUserToken(null);
          return;
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (data.token && Object.keys(data.token).length > 0) {
          console.log('Setting valid token:', data.token);
          setUserToken(data.token);
        } else {
          console.log('No valid token found, setting to null');
          setUserToken(null);
        }
      } catch (error) {
        console.error('Failed to fetch user token:', error);
        setUserToken(null);
      }
    };

    setIsMounted(true);
    if (address) {
      fetchUserToken().catch(console.error);
    }
  }, [address]);

  useEffect(() => {
    if (isMounted && !address) {
      router.push("/");
    }
  }, [address, router, isMounted]);

  const handleUpdateBalance = async (newBalance: number) => {
    if (!address || !userToken) return;

    try {
      const response = await fetch('/api/update-token-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          tokenName: userToken.tokenName,
          newBalance
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update balance');
      }

      setUserToken({ ...userToken, requiredBalance: newBalance });
      setIsEditing(false);
      setStatusMessage('Required Balance updated successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      throw error;
    }
  };

  const handleAddToken = async (tokenData: any) => {
    if (!address) return;

    try {
      // Add the token
      const response = await fetch('/api/add-user-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tokenData,
          walletAddress: address
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add token');
      }

      // Create the dashboard
      const createDashboardResponse = await fetch('/api/create-token-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenName: tokenData.name
        })
      });

      if (!createDashboardResponse.ok) {
        console.error('Failed to create dashboard');
      }

      setUserToken(data.token);
      setStatusMessage('Token added successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteToken = async () => {
    if (!address || !userToken) return;

    try {
      const response = await fetch('/api/delete-user-token', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          tokenName: userToken.tokenName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete token');
      }

      setUserToken(null);
      setIsEditing(false);
      setStatusMessage('Token removed successfully');

      window.location.href = window.location.href;
    } catch (error) {
      throw error;
    }
  };

  const handleButton1Click = () => {
    console.log("Button 1 clicked");
    // Add functionality later
  };

  const handleButton2Click = () => {
    console.log("Button 2 clicked");
    // Add functionality later
  };

  const handleButton3Click = () => {
    console.log("Button 3 clicked");
    // Add functionality later
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-black text-black dark:text-white">
      <NavBar address={address} />
      
      <main className="flex flex-col items-start p-8 mt-20 max-w-7xl mx-auto w-full">
        <div className="w-full">
          <h1 className="text-4xl font-bold mb-8">Moon Dragon Dashboard</h1>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Token Stats */}
            <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">Token Stats</h2>
              <div className="space-y-2">
                <p>Your Token: {userToken ? userToken.tokenName : 'None'}</p>
                {userToken && (
                  <p>Required Balance: {userToken.requiredBalance.toLocaleString()}</p>
                )}
              </div>
            </div>
            
            {/* Add Your Token Section - Show when no token exists */}
            {!userToken && (
              <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm col-span-2">
                <h2 className="text-xl font-semibold mb-4">Add Your Token</h2>
                <p className="text-sm text-gray-400 mb-4">
                  As a RUNE•MOON•DRAGON holder, you can add one token to the system.
                </p>
                <AddTokenForm onSubmit={handleAddToken} />
              </div>
            )}
            
            {/* Managed Token */}
            {userToken && (
              <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm col-span-2">
                <h2 className="text-xl font-semibold mb-4">Your Managed Token</h2>
                {statusMessage && (
                  <p className="text-green-500 mb-4">{statusMessage}</p>
                )}
                <TokenDisplay
                  token={userToken}
                  isEditing={isEditing}
                  onEdit={() => setIsEditing(true)}
                  onCancel={() => setIsEditing(false)}
                  onSave={handleUpdateBalance}
                  onDelete={handleDeleteToken}
                  onButton1Click={handleButton1Click}
                  onButton2Click={handleButton2Click}
                  onButton3Click={handleButton3Click}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 