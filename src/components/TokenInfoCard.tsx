import { FiRefreshCw } from 'react-icons/fi';
import { TokenInfo } from '@/lib/types';

interface TokenInfoCardProps {
  tokenInfo: TokenInfo | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function TokenInfoCard({ tokenInfo, isLoading, onRefresh }: TokenInfoCardProps) {
  if (isLoading) {
    return <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">Loading...</div>;
  }

  if (!tokenInfo) {
    return <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">Failed to load token info</div>;
  }

  return (
    <div className="p-6 rounded-lg bg-white/10 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Token Information</h2>
        <button onClick={onRefresh} className="p-2 hover:bg-white/10 rounded-full">
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>
      {/* Add your token info display here */}
    </div>
  );
} 