'use client'

import { useState } from 'react'
import { TokenInfo } from '@/types/token'
import TransferComponent from './TransferComponent'
import ApproveComponent from './ApproveComponent'
import TransferFromComponent from './TransferFromComponent'
import BurnComponent from './BurnComponent'

interface TokenOperationsProps {
  account: string
  tokenInfo: TokenInfo
  onRefresh: () => void
}

export default function TokenOperations({
  account,
  tokenInfo,
  onRefresh,
}: TokenOperationsProps) {
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

