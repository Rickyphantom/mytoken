'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { getSignedContract } from '@/lib/contract'
import { TokenInfo } from '@/types/token'

interface TransferComponentProps {
  account: string
  tokenInfo: TokenInfo
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}

export default function TransferComponent({
  account,
  tokenInfo,
  onSuccess,
  onError,
}: TransferComponentProps) {
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

