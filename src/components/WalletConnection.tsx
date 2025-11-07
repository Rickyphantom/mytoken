interface WalletConnectionProps {
  isConnected: boolean
  isConnecting: boolean
  account: string | null
  loading: boolean
  onConnect: () => void
  onRefresh: () => void
}

export default function WalletConnection({
  isConnected,
  isConnecting,
  account,
  loading,
  onConnect,
  onRefresh,
}: WalletConnectionProps) {
  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? '연결 중...' : 'MetaMask 연결'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
        <span className="font-semibold">연결됨:</span>{' '}
        {account?.slice(0, 6)}...{account?.slice(-4)}
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
      >
        🔄 새로고침
      </button>
    </div>
  )
}

