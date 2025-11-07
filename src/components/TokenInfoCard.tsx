import { TokenInfo } from '@/types/token'

interface TokenInfoCardProps {
  tokenInfo: TokenInfo
}

export default function TokenInfoCard({ tokenInfo }: TokenInfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">토큰 정보</h2>
      <div className="space-y-3">
        <div>
          <span className="text-gray-600">이름:</span>
          <span className="ml-2 font-semibold">{tokenInfo.name}</span>
        </div>
        <div>
          <span className="text-gray-600">심볼:</span>
          <span className="ml-2 font-semibold">{tokenInfo.symbol}</span>
        </div>
        <div>
          <span className="text-gray-600">소수점:</span>
          <span className="ml-2 font-semibold">{tokenInfo.decimals}</span>
        </div>
        <div>
          <span className="text-gray-600">총 발행량:</span>
          <span className="ml-2 font-semibold">
            {parseFloat(tokenInfo.totalSupply).toLocaleString()}{' '}
            {tokenInfo.symbol}
          </span>
        </div>
      </div>
    </div>
  )
}

