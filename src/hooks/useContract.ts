
import { useMemo } from 'react';
import {Abi,Address} from 'viem';
import { useChainId, useWalletClient } from 'wagmi';
import { getContract } from '../utils/contractHelper';
import { StakeContractAddress } from '../utils/env';
import { stakeAbi } from '../assets/abis/stake';


type UseContractOptions = {
  chainId?:number;
}

export function useContract<TAbi extends Abi>(
  addressOrAddressMap: Address | { [chainId: number]: Address  },
  abi: TAbi,
  options?: UseContractOptions
) {
  const currentChainId =useChainId(); // Default to mainnet if no chainId is provided
  const chainId = options?.chainId ?? currentChainId;
  const {data: walletClient } = useWalletClient()

  return useMemo(()=>{
    if(!addressOrAddressMap || !abi || !chainId ) return null;
    let address: Address | undefined;
    if(typeof addressOrAddressMap === 'string') {
      address = addressOrAddressMap;
    }else{
      address = addressOrAddressMap[chainId];
    }
    if(!address) return null;
    try {
      return getContract({
        abi,
        address,
        chainId,
        signer: walletClient ?? undefined,
      })
    } catch (error) {
      console.error('Error creating contract:', error);
      return null;  
      
    }
    
  },[addressOrAddressMap, abi, chainId, walletClient]);
}

export  const useStakeContract = (options?: UseContractOptions)=>{
  return useContract(
    StakeContractAddress,
    stakeAbi as Abi,
    options
  )
}