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
import { CreateVotingForm, VotingFormData } from "@/components/CreateVotingForm";
import { Menu } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogTitle, DialogPanel } from '@headlessui/react';
import { RuneBalance, fetchOrdAddress } from "@/lib/runebalance";

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
  setShowVotingForm: (show: boolean) => void;
  setShowArchiveModal: (show: boolean) => void;
  setShowAddressDetails: (show: boolean) => void;
}

const TokenDisplay = ({ token, isEditing, onEdit, onCancel, onSave, onDelete, onButton1Click, onButton2Click, onButton3Click, setShowVotingForm, setShowArchiveModal, setShowAddressDetails }: TokenDisplayProps) => {
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
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  Distribute Rewards
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

            <Menu as="div" className="relative">
              <Menu.Button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white">
                Board Actions
              </Menu.Button>
              
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setShowAddressDetails(true)}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      } w-full text-left px-4 py-2 text-gray-900 dark:text-white`}
                    >
                      List All Addresses
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setShowArchiveModal(true)}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      } w-full text-left px-4 py-2 text-gray-900 dark:text-white`}
                    >
                      Manage Archives
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
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

// Add these interfaces before the MoonDragonDashboard component
interface VoteDetail {
  walletAddress: string;
  choice: string;
  tokenBalance: number;
  timestamp: string;
}

interface GroupedVotes {
  [questionId: string]: {
    questionText: string;
    votes: VoteDetail[];
  };
}

// Add the AddressDetails component
const AddressDetails = ({ 
  isOpen, 
  onClose, 
  votingDetails 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  votingDetails: GroupedVotes;
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl rounded-lg bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Voting Address Details
          </Dialog.Title>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {Object.entries(votingDetails).map(([questionId, questionData]) => (
              <div key={questionId} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium mb-3">
                  {questionData.questionText}
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    (ID: {questionId})
                  </span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                        <th className="pb-2">Wallet Address</th>
                        <th className="pb-2">Choice</th>
                        <th className="pb-2">Token Balance</th>
                        <th className="pb-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questionData.votes.map((vote, index) => (
                        <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="py-2 text-sm">{vote.walletAddress}</td>
                          <td className="py-2 text-sm">{vote.choice}</td>
                          <td className="py-2 text-sm">{vote.tokenBalance.toLocaleString()}</td>
                          <td className="py-2 text-sm">
                            {new Date(vote.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {Object.keys(votingDetails).length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">No voting data available</p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

// Add this interface for the distribution form
interface DistributionFormData {
  recipients: {
    address: string;
    amount: number;
  }[];
}

// Add this interface for voter data
interface VoterData {
  questionId: string;
  questionText: string;
  status: string;
}

// Add this interface for token selection
interface TokenBalance {
  name: string;
  balance: string;
  symbol: string;
}

// Update the DistributeRewardsForm component
const DistributeRewardsForm = ({ isOpen, onClose, onSubmit, tokenName }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DistributionFormData) => Promise<void>;
  tokenName?: string;
}) => {
  const { address } = useLaserEyes();
  const [runeBalances, setRuneBalances] = useState<RuneBalance[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [addresses, setAddresses] = useState<string>('');
  const [feeRate, setFeeRate] = useState<number>(7);
  const [error, setError] = useState('');
  const [showVoterModal, setShowVoterModal] = useState(false);
  const [questions, setQuestions] = useState<VoterData[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);

  // Modify the fetchQuestions function to use the same data as List All Addresses
  const fetchQuestions = async () => {
    if (!tokenName) return;
    
    try {
      const response = await fetch(`/api/voting/address-details/${tokenName}`);
      if (!response.ok) throw new Error('Failed to fetch voting details');
      
      const data = await response.json();
      console.log('Fetched voting details:', data);

      // Transform the voting details into questions format
      const allQuestions = Object.entries(data.votes).map(([questionId, questionData]: [string, any]) => ({
        questionId,
        questionText: questionData.questionText || `Question (ID: ${questionId})`,
        status: 'completed'
      }));

      setQuestions(allQuestions);
      console.log('Transformed questions:', allQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
    }
  };

  // Modify the importVoters function
  const importVoters = async (questionId: string) => {
    if (!tokenName) return;
    
    try {
      const response = await fetch(`/api/voting/address-details/${tokenName}`);
      if (!response.ok) throw new Error('Failed to fetch voting details');
      
      const data = await response.json();
      console.log('Fetched voting details:', data); // Debug log
      
      if (data.votes && data.votes[questionId]) {
        const voterAddresses = data.votes[questionId].votes
          .filter((vote: any) => vote.walletAddress) // Ensure address exists
          .map((vote: any) => vote.walletAddress)
          .join('\n');
        
        if (voterAddresses) {
          setAddresses(voterAddresses);
          setShowVoterModal(false);
          toast.success('Voter addresses imported successfully');
        } else {
          toast.error('No valid voter addresses found for this question');
        }
      } else {
        toast.error('No voting data found for this question');
      }
    } catch (error) {
      console.error('Error importing voters:', error);
      toast.error('Failed to import voters');
    }
  };

  // Add this back to the DistributeRewardsForm component, right after the importVoters function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Parse addresses from textarea
      const addressList = addresses
        .split('\n')
        .filter(addr => addr.trim())
        .map(addr => addr.trim());

      if (!addressList.length) {
        throw new Error('Please enter at least one address');
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Create recipients array with same amount for each address
      const recipients = addressList.map(address => ({
        address,
        amount
      }));
      
      await onSubmit({ recipients });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to distribute rewards');
    }
  };

  useEffect(() => {
    const loadRuneBalances = async () => {
      if (!address) return;
      try {
        const balances = await fetchOrdAddress(address);
        setRuneBalances(balances);
      } catch (error) {
        console.error('Error loading rune balances:', error);
        toast.error('Failed to load rune balances');
      }
    };

    if (isOpen) {
      loadRuneBalances();
    }
  }, [address, isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-[#0B1018] p-6 text-white">
          <Dialog.Title className="text-xl font-semibold mb-6">
            Distribute Rewards
          </Dialog.Title>

          {/* Token Selection Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              SELECT RUNE
            </label>
            <div className="max-h-[25vh] overflow-y-auto">
              {runeBalances.map((rune) => (
                <div
                  key={rune.name}
                  onClick={() => setSelectedToken(rune)}
                  className={`p-4 bg-black/50 rounded-lg border border-gray-700 mb-2 cursor-pointer ${
                    selectedToken?.name === rune.name ? 'border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">{rune.symbol}</span>
                      </div>
                      <div>
                        <div className="font-medium">{rune.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{parseInt(rune.balance).toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Balance</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Selecting 1 bundle (UTXO) is more economical than multiple bundles.
            </div>
          </div>

          {/* Existing form content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount per address input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                AMOUNT PER ADDRESS
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                min="0"
                required
              />
            </div>

            {/* Addresses textarea */}
            <div>
              <label className="block text-sm font-medium mb-2">
                PASTE ADDRESSES OR UPLOAD CSV FILE (MAX. 1000)
              </label>
              <div className="relative">
                <div className="flex gap-2 mb-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const text = e.target?.result as string;
                          setAddresses(text);
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      fetchQuestions();
                      setShowVoterModal(true);
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                  >
                    Import Voters
                  </button>
                </div>
                <textarea
                  value={addresses}
                  onChange={(e) => setAddresses(e.target.value)}
                  className="w-full h-[15vh] p-3 bg-black border border-gray-700 rounded-lg"
                  placeholder="Paste or drop CSV file"
                  required
                />
              </div>
            </div>

            {/* Fee rate input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                FEE RATE (SAT/VB)
              </label>
              <input
                type="number"
                value={feeRate}
                onChange={(e) => setFeeRate(Number(e.target.value))}
                className="w-full p-3 bg-black border border-gray-700 rounded-lg"
                min="1"
                required
              />
            </div>

            {/* Warning message */}
            <div className="text-yellow-500 text-sm">
              ⚠️ Check the transaction (PSBT) before signing. We are not responsible for any errors or lost funds.
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              CREATE TRANSACTION
            </button>
          </form>
        </Dialog.Panel>
      </div>

      {/* Add Voter Import Modal */}
      <Dialog open={showVoterModal} onClose={() => setShowVoterModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-gray-900 p-6 text-white">
            <Dialog.Title className="text-xl font-semibold mb-6">
              Import Voters from Question
            </Dialog.Title>
            
            <div className="space-y-4">
              <select
                value={selectedQuestionId}
                onChange={(e) => setSelectedQuestionId(e.target.value)}
                className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="">Select a question</option>
                {questions.map((q) => (
                  <option key={q.questionId} value={q.questionId}>
                    {q.questionText} (ID: {q.questionId})
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowVoterModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => importVoters(selectedQuestionId)}
                  disabled={!selectedQuestionId}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Import
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Dialog>
  );
};

export default function MoonDragonDashboard() {
  const { address } = useLaserEyes();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [userToken, setUserToken] = useState<TokenAssociation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showVotingForm, setShowVotingForm] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [votingSessions, setVotingSessions] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [archivedSessions, setArchivedSessions] = useState<any[]>([]);
  const [showAddressDetails, setShowAddressDetails] = useState(false);
  const [votingDetails, setVotingDetails] = useState<GroupedVotes>({});
  const [showDistributionForm, setShowDistributionForm] = useState(false);

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
    setShowVotingForm(true);
  };

  const handleButton2Click = () => {
    setShowDistributionForm(true);
  };

  const handleButton3Click = () => {
    console.log("Button 3 clicked");
    // Add functionality later
  };

  const handleCreateVoting = async (data: VotingFormData) => {
    try {
      const response = await fetch('/api/voting/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: data.question,
          startTime: data.startTime,
          endTime: data.endTime,
          token: userToken?.tokenName || '',
          createdBy: address || 'system'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create voting session');
      }

      setShowVotingForm(false);
    } catch (error) {
      console.error('Error creating voting session:', error);
      throw error;
    }
  };

  const handleArchiveSession = async (session: any) => {
    if (!isAdmin || !userToken) {
      toast.error('Only token admin can archive sessions');
      return;
    }

    try {
      const response = await fetch('/api/voting/archive-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenName: userToken.tokenName,
          questionId: session.id,
          adminAddress: address
        })
      });

      if (!response.ok) {
        throw new Error('Failed to archive session');
      }

      toast.success('Session archived successfully');
      fetchVotingSessions();
    } catch (error) {
      console.error('Error archiving session:', error);
      toast.error('Failed to archive session');
    }
  };

  const fetchVotingSessions = async () => {
    if (!userToken) return;
    try {
      const response = await fetch(`/api/voting/sessions/${userToken.tokenName}`);
      if (response.ok) {
        const data = await response.json();
        setVotingSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchArchivedSessions = async () => {
    if (!userToken) return;
    try {
      const response = await fetch(`/api/voting/archived-sessions/${userToken.tokenName}`);
      if (response.ok) {
        const data = await response.json();
        setArchivedSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching archived sessions:', error);
    }
  };

  const fetchVotingDetails = async () => {
    if (!userToken) return;
    
    try {
      const response = await fetch(`/api/voting/address-details/${userToken.tokenName}`);
      if (!response.ok) throw new Error('Failed to fetch voting details');
      
      const data = await response.json();
      setVotingDetails(data.votes);
    } catch (error) {
      console.error('Error fetching voting details:', error);
      toast.error('Failed to fetch voting details');
    }
  };

  const handleDistributeRewards = async (data: DistributionFormData) => {
    try {
      // Here you would implement the PSBT creation and broadcasting
      const response = await fetch('/api/distribute-rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenName: userToken?.tokenName,
          recipients: data.recipients,
          senderAddress: address
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to distribute rewards');
      }

      toast.success('Rewards distributed successfully');
      setShowDistributionForm(false);
    } catch (error) {
      console.error('Error distributing rewards:', error);
      toast.error('Failed to distribute rewards');
    }
  };

  useEffect(() => {
    if (showArchiveModal) {
      fetchArchivedSessions();
    }
  }, [showArchiveModal]);

  useEffect(() => {
    if (showAddressDetails) {
      fetchVotingDetails();
    }
  }, [showAddressDetails]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:to-black text-black dark:text-white">
      <NavBar address={address} />
      
      <main className="flex flex-col items-start p-8 mt-20 max-w-7xl mx-auto w-full">
        <div className="w-full">
          <h1 className="text-4xl font-bold mb-8">BITBOARD DASH</h1>
          
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
                  As a BITBOARD•DASH holder, you can add one token to the system.
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
                  setShowVotingForm={setShowVotingForm}
                  setShowArchiveModal={setShowArchiveModal}
                  setShowAddressDetails={setShowAddressDetails}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <CreateVotingForm
        isOpen={showVotingForm}
        onClose={() => setShowVotingForm(false)}
        onSubmit={handleCreateVoting}
      />
      {showArchiveModal && (
        <Dialog open={showArchiveModal} onClose={() => setShowArchiveModal(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
              <DialogTitle className="text-xl font-semibold mb-4">
                Archived Voting Sessions
              </DialogTitle>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {archivedSessions.map(session => (
                  <div key={session.id} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-2">{session.question}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>Ended: {new Date(session.endTime).toLocaleDateString()}</p>
                      <p>Yes: {((session.results.yesVotes / session.results.totalVotingPower) * 100).toFixed(1)}%</p>
                      <p>No: {((session.results.noVotes / session.results.totalVotingPower) * 100).toFixed(1)}%</p>
                      <p>Total Votes: {session.results.totalVoters}</p>
                    </div>
                    {session.status === 'completed' && isAdmin && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleArchiveSession(session)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors"
                        >
                          Archive This Session
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {archivedSessions.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">No archived sessions found</p>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
      <AddressDetails
        isOpen={showAddressDetails}
        onClose={() => setShowAddressDetails(false)}
        votingDetails={votingDetails}
      />
      <DistributeRewardsForm
        isOpen={showDistributionForm}
        onClose={() => setShowDistributionForm(false)}
        onSubmit={handleDistributeRewards}
        tokenName={userToken?.tokenName}
      />
    </div>
  );
} 