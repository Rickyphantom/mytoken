# ERC-20 토큰 테스트 앱

Next.js를 사용한 ERC-20 토큰 테스트 애플리케이션입니다.

## 시작하기

먼저 개발 서버를 실행하세요:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
my-token-app/
├── contract/              # 솔리디티 컨트랙트 파일
│   └── MyToken.sol
├── src/
│   ├── app/              # Next.js 앱 라우터
│   ├── components/       # React 컴포넌트
│   ├── lib/              # 유틸리티 및 컨트랙트 인터페이스
│   └── types/            # TypeScript 타입 정의
```

## 컨트랙트 관리

이 프로젝트는 `contract/` 폴더에 솔리디티 파일을 보관합니다.

- 컨트랙트는 REMIX IDE나 다른 도구를 통해 배포할 수 있습니다
- 배포 후 `src/lib/abi.json`과 `src/lib/constants.ts`를 수동으로 업데이트해야 합니다

## 주요 기능

- ✅ 지갑 연결 (MetaMask)
- ✅ 토큰 정보 조회
- ✅ 잔액 확인
- ✅ 토큰 전송 (Transfer)
- ✅ 토큰 허용 (Approve)
- ✅ 대리 전송 (TransferFrom)
- ✅ 토큰 소각 (Burn)

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Blockchain**: Ethers.js v6
- **Smart Contract**: Solidity 0.8.20, OpenZeppelin

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
"# mytoken" 
