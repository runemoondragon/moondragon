"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLaserEyes } from "@omnisat/lasereyes";
import { AccessToken } from "@/lib/const";
import { TokenAssociation } from "@/lib/types";
import { NavBar } from "@/components/NavBar";
import { FiEdit2, FiSave, FiX, FiTrash2, FiChevronDown } from 'react-icons/fi';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { CreateVotingForm, VotingFormData } from "@/components/CreateVotingForm";
import { Menu } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogTitle, DialogPanel } from '@headlessui/react';
import { RuneBalance, fetchOrdAddress } from "@/lib/runebalance";
import { PollForm, PollFormData } from '@/components/PollForm';

interface Poll {
  id: string;
  pollQuestion: string;
  options: string[];
  tokenName: string;
  createdAt: string;
  endTime: string;
  status: 'active' | 'completed' | 'archived';
  results: {
    [key: string]: string | number | undefined;
    totalVoters: number;
    totalVotingPower: number;
    winner?: string;
    winningPercentage?: number;
  };
}

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
  setShowPollForm: (show: boolean) => void;
  setShowPollAddressDetails: (show: boolean) => void;
  setShowPollArchiveModal: (show: boolean) => void;
}

const TokenDisplay = ({ token, isEditing, onEdit, onCancel, onSave, onDelete, onButton1Click, onButton2Click, onButton3Click, setShowVotingForm, setShowArchiveModal, setShowAddressDetails, setShowPollForm, setShowPollAddressDetails, setShowPollArchiveModal }: TokenDisplayProps) => {
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
              
              <AlertDialog.Root>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <AlertDialog.Trigger asChild>
                        <div 
                          className="p-2 hover:bg-red-700 rounded-full transition-colors cursor-pointer"
                          role="button"
                          aria-label="Delete token"
                          aria-describedby="delete-token-description"
                        >
                          <FiTrash2 size={16} className={isDeleting ? 'opacity-50' : ''} />
                        </div>
                      </AlertDialog.Trigger>
                    </Tooltip.Trigger>
                    
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="max-w-xs px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg"
                        sideOffset={5}
                        id="delete-token-description"
                      >
                        Remove this token and all its associated data. This action is permanent.
                        <Tooltip.Arrow className="fill-gray-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>

                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                  <AlertDialog.Content 
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md p-6 rounded-lg bg-gray-900 border border-gray-800 shadow-xl"
                    aria-describedby="alert-dialog-description"
                  >
                    <AlertDialog.Title className="text-xl font-semibold mb-4">
                      Are you sure you want to remove this token?
                    </AlertDialog.Title>
                    
                    <AlertDialog.Description 
                      className="text-gray-400 mb-6"
                      id="alert-dialog-description"
                    >
                      Removing this token will delete all associated data, including its dashboard, voting sessions, and settings. This action is irreversible.
                    </AlertDialog.Description>
                    
                    <div className="flex justify-end gap-3">
                      <AlertDialog.Cancel className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                        Cancel
                      </AlertDialog.Cancel>
                      
                      <AlertDialog.Action
                        onClick={handleDelete}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Removing...' : 'Remove Token'}
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>
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
          <>
            <p className="text-sm text-gray-400">
              Required Balance: {token.requiredBalance.toLocaleString()}
            </p>
            <Menu as="div" className="relative mt-2">
              <Menu.Button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white">
                Activity
              </Menu.Button>
              
              <Menu.Items className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setShowAddressDetails(true)}
                      className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} w-full text-left px-4 py-2 text-gray-900 dark:text-white`}
                    >
                      List Voter
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setShowPollAddressDetails(true)}
                      className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} w-full text-left px-4 py-2 text-gray-900 dark:text-white`}
                    >
                      List Poller
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setShowArchiveModal(true)}
                      className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} w-full text-left px-4 py-2 text-gray-900 dark:text-white`}
                    >
                      Archived vote
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setShowPollArchiveModal(true)}
                      className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''} w-full text-left px-4 py-2 text-gray-900 dark:text-white`}
                    >
                      Archived poll
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </>
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
                <Tooltip.Content className="max-w-xs px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg" sideOffset={5}>
                  Create a new voting session. Propose questions and gather input from {token.tokenName} token holders.
                  <Tooltip.Arrow className="fill-gray-900" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={() => setShowPollForm(true)}
                  className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  Start a Poll
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="max-w-xs px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg" sideOffset={5}>
                  Create a new poll to gather community feedback.
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
                  Distribute
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="max-w-xs px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg" sideOffset={5}>
                  Allocate and distribute rewards to participants based on their share of the asset.
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

// Add these interfaces before the MoonDragonDashboard component
interface VoteDetail {
  walletAddress: string;
  choice: string;
  tokenBalance: number;
  timestamp: string;
}

interface GroupedVotes {
  [pollId: string]: {
    votes: VoteDetail[];
    pollQuestion: string;
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
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Modal Panel */}
        <Dialog.Panel className="w-full max-w-4xl rounded-lg bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
          {/* Modal Header */}
          <Dialog.Title className="text-xl font-semibold mb-4">
            Voting Address Details
          </Dialog.Title>
  
          {/* Scrollable Container */}
          <div className="max-h-[60vh] overflow-y-auto space-y-6">
            {Object.entries(votingDetails).map(([questionId, questionData]) => (
              <div
                key={questionId}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4"
              >
                <h3 className="font-medium mb-3">
                  (ID: {questionId})
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
                        <tr
                          key={index}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          <td className="py-2 text-sm">{vote.walletAddress}</td>
                          <td className="py-2 text-sm">{vote.choice}</td>
                          <td className="py-2 text-sm">
                            {vote.tokenBalance.toLocaleString()}
                          </td>
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
              <p className="text-center text-gray-500 dark:text-gray-400">
                No voting data available
              </p>
            )}
          </div>
  
          {/* Modal Footer */}
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

// Update the UTXO interface to include divisibility
interface UTXO {
  txid: string;
  vout: number;
  value: number;
  rune: {
    name: string;
    id: string;
    amount: string;
    status: string;
    timestamp: number;
    divisibility?: number;
  }
}

// Update this interface for token selection
interface TokenBalance {
  name: string;
  id: string;
  balance: string;
  symbol: string;
  divisibility: number;
}

// Add utility function for conversion
const satToBtc = (sats: number) => (sats / 100000000).toFixed(8);

const DistributeRewardsForm = ({ isOpen, onClose, onSubmit, tokenName, btcPrice }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DistributionFormData) => Promise<void>;
  tokenName?: string;
  btcPrice: number;
}) => {
  const { 
    address, 
    signPsbt, 
    getBalance, 
    paymentAddress,
    publicKey,
    paymentPublicKey,
    balance 
  } = useLaserEyes();
  const [runeBalances, setRuneBalances] = useState<RuneBalance[]>([]);
  const [amount, setAmount] = useState<number>(1);
  const [addresses, setAddresses] = useState<string>('');
  const [feeRate, setFeeRate] = useState<number>(2);
  const [error, setError] = useState('');
  const [showVoterModal, setShowVoterModal] = useState(false);
  const [questions, setQuestions] = useState<VoterData[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [selectedUTXOs, setSelectedUTXOs] = useState<UTXO[]>([]);
  const [availableUTXOs, setAvailableUTXOs] = useState<UTXO[]>([]);
  const [showTxDetails, setShowTxDetails] = useState(false);
  const [txDetails, setTxDetails] = useState<any>(null);
  const [psbt, setPsbt] = useState<string>('');
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [pointsThreshold, setPointsThreshold] = useState(0);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [btcUtxos, setBtcUtxos] = useState<any[]>([]);
  const [btcUtxo, setBtcUtxo] = useState<UTXO | null>(null);

  const fetchBtcUtxos = async () => {
    try {
      const response = await fetch(`/api/get-btc-utxos?address=${paymentAddress}`);
      if (!response.ok) {
        throw new Error("Failed to fetch BTC UTXOs");
      }
      const utxos = await response.json();
      setBtcUtxos(utxos);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to fetch BTC UTXOs');
    }
  };

  useEffect(() => {
    if (isOpen && paymentAddress) {
      fetchBtcUtxos();
    }
  }, [isOpen, paymentAddress]);

  // Modify the fetchQuestions function to use the same data as List All Addresses
  const fetchQuestions = async () => {
    if (!tokenName) return;
    
    try {
      const response = await fetch(`/api/voting/address-details/${tokenName}`);
      if (!response.ok) throw new Error('Failed to fetch voting details');
      
      const data = await response.json();

      // Transform the voting details into questions format
      const allQuestions = Object.entries(data.votes).map(([questionId, questionData]: [string, any]) => ({
        questionId,
        questionText: questionData.questionText || `Question (ID: ${questionId})`,
        status: 'completed'
      }));

      setQuestions(allQuestions);
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

  // Add new function to fetch UTXOs when token is selected
  const fetchUTXOs = async (tokenName: string) => {
    try {
      const response = await fetch(`/api/rune-utxos?token=${encodeURIComponent(tokenName)}`);
      if (!response.ok) throw new Error('Failed to fetch UTXOs');
      
      const data = await response.json();
      setAvailableUTXOs(data.utxos);
    } catch (error) {
      console.error('Error fetching UTXOs:', error);
      toast.error('Failed to fetch UTXOs');
    }
  };

  // Modify the token selection handler
  const handleTokenSelect = async (rune: RuneBalance) => {
    // If clicking the same token, toggle the selection
    if (selectedToken?.name === rune.name) {
      setSelectedToken(null);
      setSelectedUTXOs([]); // Clear selected UTXOs when deselecting token
      return;
    }
    
    // Clear previously selected UTXOs when selecting a new token
    setSelectedUTXOs([]);
    
    // Add divisibility when setting the token
    setSelectedToken({
      name: rune.name,
      id: rune.id,
      balance: rune.balance,
      symbol: rune.symbol,
      divisibility: 0  // Set default or get from API response if available
    });

    try {
      const response = await fetch(`/api/rune-utxos?token=${encodeURIComponent(rune.name)}&address=${address}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAvailableUTXOs(data.utxos);
      
      if (data.utxos.length === 0) {
        toast('No UTXOs found for this token');
      }
    } catch (error) {
      console.error('Error fetching UTXOs:', error);
      toast.error('Failed to fetch UTXOs');
    }
  };

  // Update the UTXO selection handler
  const handleUTXOSelect = (utxo: UTXO) => {
    setSelectedUTXOs(prev => {
      // Check if trying to select a different rune
      if (prev.length > 0 && prev[0].rune.name !== utxo.rune.name) {
        toast.error("Can't process multiple runes at the same time. Select only UTXOs from a single rune.");
        return prev;
      }

      const isSelected = prev.some(selected => selected.txid === utxo.txid);
      if (isSelected) {
        return prev.filter(selected => selected.txid !== utxo.txid);
      } else {
        return [...prev, utxo];
      }
    });
  };

  // Calculate combined total amount
  const totalAmount = selectedUTXOs.reduce((sum, utxo) => sum + Number(utxo.rune.amount), 0);

  // Function to handle BTC UTXO selection
  const handleSelectBtcUtxo = (selectedUtxo: UTXO) => {
    setBtcUtxo(selectedUtxo);
  };

  // In your handleSubmit function, validate btcUtxo before using it
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowTxDetails(false);
    
    try {
      if (!selectedUTXOs?.length) {
        throw new Error('Please select at least one UTXO');
      }

      const recipientList = addresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr);

      if (!recipientList.length) {
        throw new Error('No valid recipient addresses found');
      }

      // Calculate total from all selected UTXOs
      const totalAvailable = selectedUTXOs.reduce(
        (sum, utxo) => sum + Number(utxo.rune.amount), 
        0
      );
      const totalNeeded = amount * recipientList.length;

      if (totalNeeded > totalAvailable) {
        throw new Error(`Insufficient Rune balance. Need ${totalNeeded}, have ${totalAvailable}`);
      }

      const requestData = {
        amount: amount.toString(),
        addressList: recipientList,
        feerate: feeRate.toString(),
        inputs: selectedUTXOs.map(utxo => ({  // Map ALL selected UTXOs
          location: `${utxo.txid}:${utxo.vout}`,
          active: true,
          id: utxo.rune.id
        })),
        ordinalAddress: address,
        ordinalPubkey: publicKey,
        paymentAddress,
        paymentPubkey: paymentPublicKey
      };

      console.log("Request data:", requestData); // Debug log

      const response = await fetch("/api/distribute-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to create transaction");
      }

      const data = await response.json();
      console.log("Transaction created:", data);
      setTxDetails(data);
      setShowTxDetails(true);
      setPsbt(data.psbtBase64);
    } catch (error) {
      console.error("Transaction creation error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      toast.error(error instanceof Error ? error.message : "Failed to create transaction");
    }
  };

  const handleSignTransaction = async () => {
    try {
      if (!psbt) {
        throw new Error('No PSBT available to sign');
      }
      
      const signedPsbt = await signPsbt(psbt);
      if (signedPsbt) {
        toast.success('Transaction signed successfully!');
        // You can add broadcast logic here if needed
      }
    } catch (err) {
      console.error('Signing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign transaction');
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

  const importParticipants = async (threshold: number) => {
    if (!tokenName) return;
    
    try {
      const response = await fetch(`/api/points?token=${encodeURIComponent(tokenName)}`);
      if (!response.ok) throw new Error('Failed to fetch participant details');
      
      const data = await response.json();
      
      // Filter participants based on threshold and token
      const qualifiedParticipants = data
        .filter((participant: any) => 
          participant.token === tokenName && 
          participant.totalPoints >= threshold &&
          participant.walletAddress
        )
        .map((participant: any) => participant.walletAddress)
        .join('\n');
      
      if (qualifiedParticipants) {
        setAddresses(qualifiedParticipants);
        setShowParticipantModal(false);
        toast.success('Participant addresses imported successfully');
      } else {
        toast.error('No participants found meeting the points threshold');
      }
    } catch (error) {
      console.error('Error importing participants:', error);
      toast.error('Failed to import participants');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Distribute Rewards
          </Dialog.Title>

          <div className="max-h-[80vh] overflow-y-auto pr-2">
            {/* Token Selection Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                SELECT RUNE
              </label>
              <div className="space-y-2">
                {runeBalances.map((rune) => (
                  <div key={rune.name}>
                    <div
                      onClick={() => handleTokenSelect(rune)}
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
                    
                    {/* Show UTXOs directly under each token when selected */}
                    {selectedToken?.name === rune.name && availableUTXOs.map((utxo) => (
                      <div
                        key={`${utxo.txid}-${utxo.vout}`}
                        onClick={() => {
                          const isSelected = selectedUTXOs.some(
                            u => u.txid === utxo.txid && u.vout === utxo.vout
                          );
                          if (isSelected) {
                            setSelectedUTXOs(selectedUTXOs.filter(
                              u => u.txid !== utxo.txid || u.vout !== utxo.vout
                            ));
                          } else {
                            setSelectedUTXOs([...selectedUTXOs, utxo]);
                          }
                        }}
                        className={`ml-8 p-3 mb-2 bg-black/30 rounded-lg border cursor-pointer transition-colors ${
                          selectedUTXOs.some(u => u.txid === utxo.txid && u.vout === utxo.vout)
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-gray-800 hover:border-orange-500/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <div className="font-medium truncate w-48">
                              {utxo.txid.substring(0, 8)}...
                            </div>
                            <div className="text-gray-400">
                              Output: {utxo.vout}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {parseInt(utxo.rune.amount).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-400">Amount</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount per address input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  AMOUNT PER ADDRESS
                </label><input
  type="number"
  value={amount === 0 ? '' : amount} // Allows empty state when value is 0
  onChange={(e) => {
    const value = e.target.value;
    setAmount(value === '' ? 0 : Number(value)); // Allow clearing the field or setting a numeric value
  }}
  className="w-full p-3 bg-black border border-gray-700 rounded-lg"
  min="1"
  step="1"
  required
/>
              </div>

              {/* Addresses textarea */}
              <div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowImportDropdown(!showImportDropdown)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"
                      >
                        Import <FiChevronDown />
                      </button>
                      
                      {showImportDropdown && (
                        <div className="absolute left-0 mt-1 w-48 rounded-lg bg-gray-900 shadow-lg z-50">
                          <div className="py-1">
                            
                            <button
                              type="button"
                              onClick={() => {
                                setShowImportDropdown(false);
                                setShowParticipantModal(true);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-sm"
                            >
                              Filter By Participation Point
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowImportDropdown(false);
                                fetchQuestions();
                                setShowVoterModal(true);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors text-sm"
                            >
                              Filter By Question
                            </button>
                            <label className="w-full px-4 py-2 hover:bg-gray-700 transition-colors cursor-pointer text-sm">
                              Choose CSV File
                              <input
                                type="file"
                                accept=".csv"
                                className="hidden"
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
                                  setShowImportDropdown(false);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-400 text-right flex-1">
                      PASTE ADDRESSES OR UPLOAD CSV FILE (MAX. 1000)
                    </span>
                  </div>
                  <textarea
                    value={addresses}
                    onChange={(e) => setAddresses(e.target.value)}
                    className="w-full h-[15vh] p-3 bg-black border border-gray-700 rounded-lg"
                    placeholder="Paste addresses here"
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
  value={feeRate === 0 ? '' : feeRate} // Allows the field to show as empty when feeRate is 0
  onChange={(e) => {
    const value = e.target.value;
    setFeeRate(value === '' ? 0 : Number(value)); // Set feeRate to 0 if cleared, otherwise parse as a number
  }}
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

              <div>
                <h4>Total Selected Amount: {totalAmount.toLocaleString()} Runes</h4>
              </div>

              {showTxDetails && txDetails && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold">Transaction Details</h3>
                  <div className="space-y-2 text-sm">
                    {/* Input Amount */}
                    <div className="flex justify-between">
                      <span>Input Amount:</span>
                      <span>{txDetails.btcDetails.inputAmount} sats</span>
                    </div>

                    {/* Transaction Fee */}
                    <div className="flex justify-between">
                      <span>TX fee:</span>
                      <span>{txDetails.btcDetails.fee} sats</span>
                    </div>

                    {/* Dust Total */}
                    <div className="flex justify-between">
                      <span>Dust Total:</span>
                      <span>{txDetails.btcDetails.dustTotal} sats</span>
                    </div>

                    {/* Change */}
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span>
                        {(txDetails.btcDetails.inputAmount -
                          (txDetails.btcDetails.dustTotal + txDetails.btcDetails.fee)) || 0}{' '}
                        sats
                      </span>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <div className="text-right">
                        <div>
                          {(
                            (txDetails.btcDetails.dustTotal + txDetails.btcDetails.fee) /
                            100000000
                          ).toFixed(8)}{' '}
                          BTC
                        </div>
                        <div className="text-sm text-gray-400">
                          $
                          {(
                            ((txDetails.btcDetails.dustTotal + txDetails.btcDetails.fee) /
                              100000000) *
                            btcPrice
                          ).toFixed(2)}{' '}
                          USD
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleSignTransaction}
                      className="flex-1 p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                    >
                      Sign Transaction
                    </button>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="w-full p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                CREATE TRANSACTION
              </button>
            </form>
          </div>
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

      {/* Add Participant Import Modal */}
      <Dialog open={showParticipantModal} onClose={() => setShowParticipantModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-gray-900 p-6 text-white">
            <Dialog.Title className="text-xl font-semibold mb-6">
              Import Participants by Points
            </Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Points Required
                </label>
                <input
  type="number"
  value={pointsThreshold === 0 ? '' : pointsThreshold} // Show as empty when pointsThreshold is 0
  onChange={(e) => {
    const value = e.target.value;
    setPointsThreshold(value === '' ? 0 : Number(value)); // Set pointsThreshold to 0 if cleared, otherwise parse as number
  }}
  min="0"
  className="w-full p-3 bg-black border border-gray-700 rounded-lg text-white"
/>

              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowParticipantModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => importParticipants(pointsThreshold)}
                  disabled={pointsThreshold < 0}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

const PollAddressDetails = ({ 
  isOpen, 
  onClose, 
  pollDetails 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  pollDetails: any;
}) => {
  // Remove the reduce since data is already grouped
  const groupedVotes = pollDetails || {};

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl rounded-lg bg-white dark:bg-gray-900 p-6">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Poll Participation Details
          </Dialog.Title>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {Object.entries(groupedVotes).map(([pollId, data]: [string, any]) => (
              <div key={pollId} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium mb-2">
                  {data.pollQuestion}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Poll ID: {pollId}
                </p>
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
                      {data.votes.map((vote: any, index: number) => (
                        <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="py-2 text-sm font-mono">{vote.walletAddress}</td>
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
            {pollDetails.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">
                No poll participation data available
              </p>
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
  const [btcPrice, setBtcPrice] = useState(0);
  const [showPollForm, setShowPollForm] = useState(false);
  const [showPollAddressDetails, setShowPollAddressDetails] = useState(false);
  const [pollAddressDetails, setPollAddressDetails] = useState<any[]>([]);
  const [showPollArchiveModal, setShowPollArchiveModal] = useState(false);
  const [archivedPolls, setArchivedPolls] = useState<Poll[]>([]);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [btcUtxo, setBtcUtxo] = useState<UTXO | null>(null);

  useEffect(() => {
    const fetchUserToken = async () => {
      if (!address) return;
      try {
        const response = await fetch(`/api/user-token?address=${address}`);
        
        if (!response.ok) {
          setUserToken(null);
          return;
        }
        
        const data = await response.json();
        
        if (data.token && Object.keys(data.token).length > 0) {
          setUserToken(data.token);
        } else {
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

  const handleCreatePoll = async (data: PollFormData) => {
    try {
      const response = await fetch('/api/polls/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tokenName: userToken?.tokenName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      toast.success('Poll created successfully');
      setShowPollForm(false);
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    }
  };

  const fetchPollDetails = async () => {
    if (!userToken) return;
    
    try {
      const response = await fetch(`/api/polls/address-details/${userToken.tokenName}`);
      if (!response.ok) throw new Error('Failed to fetch poll details');
      
      const data = await response.json();
      setPollAddressDetails(data.votes);
    } catch (error) {
      console.error('Error fetching poll details:', error);
      toast.error('Failed to fetch poll details');
    }
  };

  const handleArchivePoll = async (pollId: string) => {
    if (!isAdmin || !userToken) {
      toast.error('Only token admin can archive polls');
      return;
    }

    try {
      const response = await fetch('/api/polls/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          token: userToken.tokenName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to archive poll');
      }

      toast.success('Poll archived successfully');
      fetchArchivedPolls(); // We'll need to implement this
    } catch (error) {
      console.error('Error archiving poll:', error);
      toast.error('Failed to archive poll');
    }
  };

  const fetchArchivedPolls = async () => {
    if (!userToken) return;
    try {
      const response = await fetch(`/api/polls/${userToken.tokenName}?archived=true`);
      if (response.ok) {
        const data = await response.json();
        setArchivedPolls(data.polls);
      }
    } catch (error) {
      console.error('Error fetching archived polls:', error);
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

  useEffect(() => {
    if (showPollAddressDetails) {
      fetchPollDetails();
    }
  }, [showPollAddressDetails]);

  useEffect(() => {
    if (showPollArchiveModal) {
      fetchArchivedPolls();
    }
  }, [showPollArchiveModal]);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
      .then(res => res.json())
      .then(data => setBtcPrice(data.bitcoin.usd))
      .catch(console.error);
  }, []);

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
                  setShowPollForm={setShowPollForm}
                  setShowPollAddressDetails={setShowPollAddressDetails}
                  setShowPollArchiveModal={setShowPollArchiveModal}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <div>
        {/* Voting Form Modal */}
        <CreateVotingForm
          isOpen={showVotingForm}
          onClose={() => setShowVotingForm(false)}
          onSubmit={handleCreateVoting}
        />
      </div>
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
        btcPrice={btcPrice}
      />
      <PollForm
        isOpen={showPollForm}
        onClose={() => setShowPollForm(false)}
        onSubmit={handleCreatePoll}
        tokenName={userToken?.tokenName || ''}
      />
      <PollAddressDetails
        isOpen={showPollAddressDetails}
        onClose={() => setShowPollAddressDetails(false)}
        pollDetails={pollAddressDetails}
      />
      {showPollArchiveModal && (
        <Dialog open={showPollArchiveModal} onClose={() => setShowPollArchiveModal(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
              <DialogTitle className="text-xl font-semibold mb-4">
                Archived Polls
              </DialogTitle>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {archivedPolls.map(poll => (
                  <div key={poll.id} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-2">{poll.pollQuestion}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>Ended: {new Date(poll.endTime).toLocaleDateString()}</p>
                      <div className="mt-2">
                        <p className="font-medium mb-1">Results:</p>
                        {poll.options.map((option, index) => {
                          const pollKey = `poll${index + 1}`;
                          const votes = Number(poll.results[pollKey]) || 0;
                          const totalVotes = Number(poll.results.totalVotingPower) || 0;
                          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                          
                          return (
                            <div key={index} className="flex justify-between">
                              <span>{option}</span>
                              <span>
                                {percentage.toFixed(1)}%
                                ({votes.toLocaleString()} {userToken?.tokenName})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4">
                        <p>Total Voters: {poll.results.totalVoters}</p>
                        <p>Total Voting Power: {poll.results.totalVotingPower?.toLocaleString()} {userToken?.tokenName}</p>
                        {poll.results.winner && (
                          <p className="text-green-500 dark:text-green-400">
                            Winner: {poll.results.winner} ({poll.results.winningPercentage?.toFixed(1)}%)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {archivedPolls.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">No archived polls found</p>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPollArchiveModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </div>
  );
} 
