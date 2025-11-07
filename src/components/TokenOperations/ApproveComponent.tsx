'use client'

import { useState } from 'react'
import { ethers } from 'ethers'
import { getContract, getSignedContract } from '@/lib/contract'
import { TokenInfo } from '@/types/token'

interface ApproveComponentProps {
  account: string
  tokenInfo: TokenInfo
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}

export default function ApproveComponent({
  account,
  tokenInfo,
  onSuccess,
  onError,
}: ApproveComponentProps) {
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

