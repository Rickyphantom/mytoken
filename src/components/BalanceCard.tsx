import { TokenInfo } from '@/types/token'

interface BalanceCardProps {
  tokenInfo: TokenInfo
}

export default function BalanceCard({ tokenInfo }: BalanceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">내 잔액</h2>
      <div className="text-3xl font-bold text-indigo-600">
        {parseFloat(tokenInfo.balance).toLocaleString()} {tokenInfo.symbol}
      </div>
    </div>
  )
}

