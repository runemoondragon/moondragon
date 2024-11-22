"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLaserEyes } from "@omnisat/lasereyes";
import { AccessToken } from "@/lib/const";
import { TokenAssociation } from "@/lib/types";
import { NavBar } from "@/components/NavBar";
import { FiEdit2, FiSave, FiX, FiTrash2 } from 'react-icons/fi';

interface TokenDisplayProps {
  token: TokenAssociation;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (newBalance: number) => Promise<void>;
  onDelete: () => Promise<void>;
}

const TokenDisplay = ({ token, isEditing, onEdit, onCancel, onSave, onDelete }: TokenDisplayProps) => {
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
    if (!window.confirm('Are you sure you want to remove this token? This action cannot be undone.')) {
      return;
    }
    
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
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-700 rounded-full transition-colors"
                title="Remove Token"
                disabled={isDeleting}
              >
                <FiTrash2 size={16} className={isDeleting ? 'opacity-50' : ''} />
              </button>
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
        <p className="text-sm text-gray-400">
          Associated URL: <a href={token.associatedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">{token.associatedUrl}</a>
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};

// Add Token Form Component
const AddTokenForm = ({ onSubmit }: { onSubmit: (data: any) => Promise<void> }) => {
  const [formData, setFormData] = useState({
    name: '',
    requiredBalance: 0,
    associatedUrl: ''
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
        requiredBalance: 0,
        associatedUrl: ''
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

      <div>
        <label className="block text-sm font-medium mb-1">Associated URL</label>
        <input
          type="url"
          value={formData.associatedUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, associatedUrl: e.target.value }))}
          className="w-full p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-gray-700"
          placeholder="https://example.com"
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [userToken, setUserToken] = useState<TokenAssociation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
    if (address) {
      checkAdminRights();
      fetchUserToken();
    }
  }, [address, checkAdminRights, fetchUserToken]);

  useEffect(() => {
    if (isMounted && !address) {
      router.push("/");
    }
  }, [address, router, isMounted]);

  const fetchUserToken = async () => {
    if (!address) return;
    try {
      const response = await fetch(`/api/user-token?address=${address}`);
      const data = await response.json();
      if (response.ok && data.token) {
        setUserToken(data.token);
      }
    } catch (error) {
      console.error('Failed to fetch user token:', error);
    }
  };

  const checkAdminRights = async () => {
    if (!address) return;
    try {
      const response = await fetch('/api/check-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Failed to check admin rights:', error);
      setIsAdmin(false);
    }
  };

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
      setStatusMessage('Token removed successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      throw error;
    }
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
            
            {/* Add Your Token Section */}
            {!userToken && isAdmin && (
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
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 