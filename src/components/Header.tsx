import { contractAddress } from '@/lib/constants';

interface HeaderProps {
  ownerAddress: string | null;
}

export default function Header({ ownerAddress }: HeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        ERC-20 토큰 테스트 앱 92113724 유선빈
      </h1>
      <p className="text-gray-600 mb-4">
        Sepolia 테스트넷에 배포된 ERC-20 토큰과 상호작용합니다
      </p>

      {/* 컨트랙트 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">컨트랙트 정보</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-gray-600 font-medium min-w-[100px]">
              컨트랙트 주소:
            </span>
            <div className="flex items-center gap-2 flex-1">
              <code className="bg-white px-2 py-1 rounded font-mono text-gray-800">
                {contractAddress}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(contractAddress)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                title="주소 복사"
              >
                📋 복사
              </button>
            </div>
          </div>
          {ownerAddress && (
            <div className="flex items-start gap-2">
              <span className="text-gray-600 font-medium min-w-[100px]">
                Owner 주소:
              </span>
              <div className="flex items-center gap-2 flex-1">
                <code className="bg-white px-2 py-1 rounded font-mono text-gray-800">
                  {ownerAddress}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(ownerAddress)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  title="주소 복사"
                >
                  📋 복사
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
