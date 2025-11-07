'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { getSignedContract } from '@/lib/contract'
import { TokenInfo } from '@/types/token'

interface BurnComponentProps {
  account: string
  tokenInfo: TokenInfo
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}

export default function BurnComponent({
  account,
  tokenInfo,
  onSuccess,
  onError,
}: BurnComponentProps) {
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

