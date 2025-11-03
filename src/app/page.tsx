'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import {
  getContract,
  getSignedContract,
  getCurrentAccount,
  getProvider,
} from '@/lib/contract'
import { SEPOLIA_CHAIN_ID, contractAddress } from '@/lib/constants'

interface TokenInfo {
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  balance: string
}

export default function TokenApp() {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Owner 주소 로드 (지갑 연결 없이도 가능)
  useEffect(() => {
    const loadOwner = async () => {
      try {
        const contract = getContract()
        const owner = await contract.owner()
        setOwnerAddress(owner)
      } catch (err) {
        console.error('Failed to load owner:', err)
      }
    }
    loadOwner()
  }, [])

  // 지갑 연결 상태 확인
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window === 'undefined' || !window.ethereum) {
        setError('MetaMask가 설치되어 있지 않습니다.')
        setLoading(false)
        return
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()

        if (accounts.length > 0) {
          const currentAccount = accounts[0].address
          setAccount(currentAccount)
          setIsConnected(true)
          await loadTokenInfo(currentAccount)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Connection check failed:', err)
        setLoading(false)
      }
    }

    checkConnection()

    // 계정 변경 감지
    if (window.ethereum) {
      window.ethereum.on?.('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
          loadTokenInfo(accounts[0])
        } else {
          setAccount(null)
          setIsConnected(false)
        }
      })

      window.ethereum.on?.('chainChanged', () => {
        window.location.reload()
      })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener?.('accountsChanged', () => {})
        window.ethereum.removeListener?.('chainChanged', () => {})
      }
    }
  }, [])

  // 지갑 연결
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask가 설치되어 있지 않습니다.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Sepolia 네트워크로 전환 확인
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
          })
        } catch (switchError: any) {
          // 네트워크가 없으면 추가 시도
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                  chainName: 'Sepolia Test Network',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc.sepolia.org'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                },
              ],
            })
          } else {
            throw switchError
          }
        }
      }

      // 계정 연결 요청
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      const currentAccount = await getCurrentAccount()

      if (currentAccount) {
        setAccount(currentAccount)
        setIsConnected(true)
        await loadTokenInfo(currentAccount)
      }
    } catch (err: any) {
      console.error('Wallet connection failed:', err)
      setError(err.message || '지갑 연결에 실패했습니다.')
    } finally {
      setIsConnecting(false)
    }
  }

  // 토큰 정보 로드
  const loadTokenInfo = async (address: string) => {
    setLoading(true)
    setError(null)

    try {
      const contract = getContract()
      const [name, symbol, decimals, totalSupply, balance] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.balanceOf(address),
      ])

      const decimalsNum = Number(decimals)
      const formattedTotalSupply = ethers.formatUnits(totalSupply, decimalsNum)
      const formattedBalance = ethers.formatUnits(balance, decimalsNum)

      setTokenInfo({
        name,
        symbol,
        decimals: decimalsNum,
        totalSupply: formattedTotalSupply,
        balance: formattedBalance,
      })
    } catch (err: any) {
      console.error('Failed to load token info:', err)
      setError('토큰 정보를 불러오는데 실패했습니다: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // 잔액 새로고침
  const refreshBalance = async () => {
    if (!account) return
    await loadTokenInfo(account)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            ERC-20 토큰 테스트 앱
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
                    onClick={() =>
                      navigator.clipboard.writeText(contractAddress)
                    }
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
                      onClick={() =>
                        navigator.clipboard.writeText(ownerAddress)
                      }
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

          {!isConnected ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? '연결 중...' : 'MetaMask 연결'}
            </button>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                <span className="font-semibold">연결됨:</span>{' '}
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </div>
              <button
                onClick={refreshBalance}
                disabled={loading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                🔄 새로고침
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-600">로딩 중...</p>
          </div>
        )}

        {tokenInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* 토큰 정보 카드 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                토큰 정보
              </h2>
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
                  <span className="ml-2 font-semibold">
                    {tokenInfo.decimals}
                  </span>
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

            {/* 잔액 카드 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                내 잔액
              </h2>
              <div className="text-3xl font-bold text-indigo-600">
                {parseFloat(tokenInfo.balance).toLocaleString()}{' '}
                {tokenInfo.symbol}
              </div>
            </div>
          </div>
        )}

        {isConnected && tokenInfo && (
          <TokenOperations
            account={account!}
            tokenInfo={tokenInfo}
            onRefresh={refreshBalance}
          />
        )}
      </div>
    </div>
  )
}

// 토큰 작업 컴포넌트
function TokenOperations({
  account,
  tokenInfo,
  onRefresh,
}: {
  account: string
  tokenInfo: TokenInfo
  onRefresh: () => void
}) {
  const [activeTab, setActiveTab] = useState<
    'transfer' | 'approve' | 'transferFrom' | 'burn'
  >('transfer')
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const handleSuccess = (message: string) => {
    setStatus({ type: 'success', message })
    onRefresh()
    setTimeout(() => setStatus({ type: null, message: '' }), 5000)
  }

  const handleError = (message: string) => {
    setStatus({ type: 'error', message })
    setTimeout(() => setStatus({ type: null, message: '' }), 5000)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">토큰 작업</h2>

      {/* 탭 메뉴 */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'transfer'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          전송 (Transfer)
        </button>
        <button
          onClick={() => setActiveTab('approve')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'approve'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          허용 (Approve)
        </button>
        <button
          onClick={() => setActiveTab('transferFrom')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'transferFrom'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          대리 전송 (TransferFrom)
        </button>
        <button
          onClick={() => setActiveTab('burn')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'burn'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          소각 (Burn)
        </button>
      </div>

      {status.type && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg ${
            status.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {status.message}
        </div>
      )}

      {activeTab === 'transfer' && (
        <TransferComponent
          account={account}
          tokenInfo={tokenInfo}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
      {activeTab === 'approve' && (
        <ApproveComponent
          account={account}
          tokenInfo={tokenInfo}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
      {activeTab === 'transferFrom' && (
        <TransferFromComponent
          account={account}
          tokenInfo={tokenInfo}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
      {activeTab === 'burn' && (
        <BurnComponent
          account={account}
          tokenInfo={tokenInfo}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
    </div>
  )
}

// Transfer 컴포넌트
function TransferComponent({
  account,
  tokenInfo,
  onSuccess,
  onError,
}: {
  account: string
  tokenInfo: TokenInfo
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTransfer = async () => {
    if (!toAddress || !amount) {
      onError('모든 필드를 입력해주세요.')
      return
    }

    if (!ethers.isAddress(toAddress)) {
      onError('유효한 주소를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const contract = await getSignedContract()
      if (!contract) {
        onError('지갑이 연결되어 있지 않습니다.')
        return
      }

      const amountWei = ethers.parseUnits(amount, tokenInfo.decimals)
      const tx = await contract.transfer(toAddress, amountWei)

      onSuccess(`트랜잭션 전송됨: ${tx.hash}. 확인 중...`)

      await tx.wait()
      onSuccess(`전송 완료! 트랜잭션: ${tx.hash}`)
      setToAddress('')
      setAmount('')
    } catch (err: any) {
      onError(err.message || '전송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          받을 주소
        </label>
        <input
          type="text"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          전송할 금액 ({tokenInfo.symbol})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.000000000000000001"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          사용 가능: {parseFloat(tokenInfo.balance).toLocaleString()}{' '}
          {tokenInfo.symbol}
        </p>
      </div>
      <button
        onClick={handleTransfer}
        disabled={loading || !toAddress || !amount}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '처리 중...' : '전송'}
      </button>
    </div>
  )
}

// Approve 컴포넌트
function ApproveComponent({
  account,
  tokenInfo,
  onSuccess,
  onError,
}: {
  account: string
  tokenInfo: TokenInfo
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [spenderAddress, setSpenderAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAllowance, setCheckingAllowance] = useState(false)
  const [currentAllowance, setCurrentAllowance] = useState<string | null>(null)

  const checkAllowance = async () => {
    if (!spenderAddress || !ethers.isAddress(spenderAddress)) {
      onError('유효한 주소를 입력해주세요.')
      return
    }

    setCheckingAllowance(true)
    try {
      const contract = getContract()
      const allowance = await contract.allowance(account, spenderAddress)
      const formatted = ethers.formatUnits(allowance, tokenInfo.decimals)
      setCurrentAllowance(formatted)
    } catch (err: any) {
      onError('허용량 조회 실패: ' + err.message)
    } finally {
      setCheckingAllowance(false)
    }
  }

  const handleApprove = async () => {
    if (!spenderAddress || !amount) {
      onError('모든 필드를 입력해주세요.')
      return
    }

    if (!ethers.isAddress(spenderAddress)) {
      onError('유효한 주소를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const contract = await getSignedContract()
      if (!contract) {
        onError('지갑이 연결되어 있지 않습니다.')
        return
      }

      const amountWei = ethers.parseUnits(amount, tokenInfo.decimals)
      const tx = await contract.approve(spenderAddress, amountWei)

      onSuccess(`트랜잭션 전송됨: ${tx.hash}. 확인 중...`)

      await tx.wait()
      onSuccess(`허용 완료! 트랜잭션: ${tx.hash}`)
      setAmount('')
      if (spenderAddress) {
        await checkAllowance()
      }
    } catch (err: any) {
      onError(err.message || '허용 설정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          허용할 주소 (Spender)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={spenderAddress}
            onChange={(e) => setSpenderAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={checkAllowance}
            disabled={checkingAllowance || !spenderAddress}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {checkingAllowance ? '조회 중...' : '허용량 조회'}
          </button>
        </div>
        {currentAllowance !== null && (
          <p className="text-sm text-gray-600 mt-2">
            현재 허용량: {parseFloat(currentAllowance).toLocaleString()}{' '}
            {tokenInfo.symbol}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          허용할 금액 ({tokenInfo.symbol})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.000000000000000001"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={handleApprove}
        disabled={loading || !spenderAddress || !amount}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '처리 중...' : '허용 설정'}
      </button>
    </div>
  )
}

// TransferFrom 컴포넌트
function TransferFromComponent({
  account,
  tokenInfo,
  onSuccess,
  onError,
}: {
  account: string
  tokenInfo: TokenInfo
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [fromAddress, setFromAddress] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTransferFrom = async () => {
    if (!fromAddress || !toAddress || !amount) {
      onError('모든 필드를 입력해주세요.')
      return
    }

    if (!ethers.isAddress(fromAddress) || !ethers.isAddress(toAddress)) {
      onError('유효한 주소를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const contract = await getSignedContract()
      if (!contract) {
        onError('지갑가 연결되어 있지 않습니다.')
        return
      }

      const amountWei = ethers.parseUnits(amount, tokenInfo.decimals)
      const tx = await contract.transferFrom(fromAddress, toAddress, amountWei)

      onSuccess(`트랜잭션 전송됨: ${tx.hash}. 확인 중...`)

      await tx.wait()
      onSuccess(`대리 전송 완료! 트랜잭션: ${tx.hash}`)
      setFromAddress('')
      setToAddress('')
      setAmount('')
    } catch (err: any) {
      onError(err.message || '대리 전송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          보낼 주소 (From)
        </label>
        <input
          type="text"
          value={fromAddress}
          onChange={(e) => setFromAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          이 주소가 approve한 토큰을 전송할 수 있습니다.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          받을 주소 (To)
        </label>
        <input
          type="text"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          전송할 금액 ({tokenInfo.symbol})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.000000000000000001"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={handleTransferFrom}
        disabled={loading || !fromAddress || !toAddress || !amount}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '처리 중...' : '대리 전송'}
      </button>
    </div>
  )
}

// Burn 컴포넌트
function BurnComponent({
  account,
  tokenInfo,
  onSuccess,
  onError,
}: {
  account: string
  tokenInfo: TokenInfo
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBurn = async () => {
    if (!amount) {
      onError('소각할 금액을 입력해주세요.')
      return
    }

    const amountNum = parseFloat(amount)
    if (amountNum <= 0) {
      onError('0보다 큰 값을 입력해주세요.')
      return
    }

    if (amountNum > parseFloat(tokenInfo.balance)) {
      onError('보유량보다 많은 양을 소각할 수 없습니다.')
      return
    }

    setLoading(true)
    try {
      const contract = await getSignedContract()
      if (!contract) {
        onError('지갑이 연결되어 있지 않습니다.')
        return
      }

      const amountWei = ethers.parseUnits(amount, tokenInfo.decimals)
      const tx = await contract.burn(amountWei)

      onSuccess(`트랜잭션 전송됨: ${tx.hash}. 확인 중...`)

      await tx.wait()
      onSuccess(`소각 완료! 트랜잭션: ${tx.hash}`)
      setAmount('')
    } catch (err: any) {
      onError(err.message || '소각에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>주의:</strong> 소각된 토큰은 영구적으로 소멸되며 복구할 수
          없습니다.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          소각할 금액 ({tokenInfo.symbol})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.000000000000000001"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          사용 가능: {parseFloat(tokenInfo.balance).toLocaleString()}{' '}
          {tokenInfo.symbol}
        </p>
      </div>
      <button
        onClick={handleBurn}
        disabled={loading || !amount}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '처리 중...' : '소각'}
      </button>
    </div>
  )
}
