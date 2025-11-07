'use client'

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { getContract, getCurrentAccount } from '@/lib/contract'
import { SEPOLIA_CHAIN_ID } from '@/lib/constants'
import { TokenInfo } from '@/types/token'
import Header from '@/components/Header'
import WalletConnection from '@/components/WalletConnection'
import ErrorMessage from '@/components/ErrorMessage'
import Loading from '@/components/Loading'
import TokenInfoCard from '@/components/TokenInfoCard'
import BalanceCard from '@/components/BalanceCard'
import TokenOperations from '@/components/TokenOperations'

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
        <Header ownerAddress={ownerAddress} />

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <WalletConnection
            isConnected={isConnected}
            isConnecting={isConnecting}
            account={account}
            loading={loading}
            onConnect={connectWallet}
            onRefresh={refreshBalance}
          />
        </div>

        {error && <ErrorMessage message={error} />}

        {loading && <Loading />}

        {tokenInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <TokenInfoCard tokenInfo={tokenInfo} />
            <BalanceCard tokenInfo={tokenInfo} />
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
