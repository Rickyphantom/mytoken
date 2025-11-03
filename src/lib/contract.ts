import { ethers } from 'ethers'
import { contractAddress, SEPOLIA_RPC_URL } from './constants'
import abi from './abi.json'

/**
 * Sepolia 테스트넷 Provider 생성
 */
export function getProvider(): ethers.JsonRpcProvider | ethers.BrowserProvider {
  // MetaMask나 다른 지갑이 있으면 window.ethereum 사용
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  // 기본 Sepolia RPC 사용 (공개 RPC는 제한이 있을 수 있음)
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL)
}

/**
 * 컨트랙트 인스턴스 생성 (읽기 전용)
 */
export function getContract(): ethers.Contract {
  const provider = getProvider()
  return new ethers.Contract(contractAddress, abi, provider)
}

/**
 * 서명된 컨트랙트 인스턴스 생성 (쓰기 작업용)
 */
export async function getSignedContract(): Promise<ethers.Contract | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  return new ethers.Contract(contractAddress, abi, signer)
}

/**
 * 현재 연결된 계정 주소 가져오기
 */
export async function getCurrentAccount(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const accounts = await provider.listAccounts()
    return accounts.length > 0 ? accounts[0].address : null
  } catch (error) {
    console.error('Failed to get account:', error)
    return null
  }
}

// Window 타입 확장
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
      on?: (event: string, callback: (...args: any[]) => void) => void
      removeListener?: (
        event: string,
        callback: (...args: any[]) => void
      ) => void
    }
  }
}
