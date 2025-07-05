import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import {
  sepolia,
} from 'wagmi/chains';
// from https://cloud.walletconnect.com/
const ProjectId = '4b52b1726f36dac78be4fc1a532e253b'
                   

export const config = getDefaultConfig({
  appName: 'Stake Forge',
  projectId: ProjectId,
  chains: [
    sepolia
  ],
  transports: {
    [sepolia.id]: http('https://sepolia.infura.io/v3/d8ed0bd1de8242d998a1405b6932ab33')
  },
  ssr: true,
});

export const defaultChainId: number = sepolia.id