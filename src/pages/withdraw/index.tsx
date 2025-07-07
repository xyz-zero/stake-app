'use client'

import { useAccount, useWalletClient } from "wagmi";
import { useStakeContract } from "../../hooks/useContract";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pid } from "../../utils";
import { formatUnits, parseUnits } from "viem";
import { waitForTransactionReceipt } from "viem/actions";

import { toast } from "react-toastify";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { FiArrowUp, FiClock, FiInfo } from "react-icons/fi";
import { cn } from "../../utils/cn";


export type UserStakeData = {
  staked: string;
  withdrawPending:string;
  withdrawable: string;
}

const InitData: UserStakeData = {
  staked: '0',
  withdrawable: '0',
  withdrawPending: '0'
};

const Withdraw = () => {
  const stakeContract  = useStakeContract();//获取合约实例
  const {address, isConnected} = useAccount();//获取当前用户地址，判断是否连接钱包
  const [amount, setAmount] = useState('');//存储用户输入的提取金额
  const [unstakeLoading, setUnstakeLoading] = useState(false);//存储取消质押的加载状态  
  const [withdrawLoading, setWithdrawLoading] = useState(false);//存储提取操作的加载状态
  const {data} = useWalletClient();//获取钱包用户数据
  const [userData, setUserData] = useState<UserStakeData>(InitData);//存储用户质押数据
  const isWithdrawable = useMemo(()=> Number(userData.withdrawable) > 0 && isConnected, [userData.withdrawable, isConnected]);//判断用户是否有可提取的金额

  const getUserData = useCallback(async()=>{
    if(!stakeContract || !address) return; //如果没有合约实例或地址，直接返回
    const staked  = await stakeContract.read.stakingBalance([Pid, address]) as bigint;//获取用户质押的金额
    const withdrawData = await stakeContract.read.withdrawAmount([Pid,address]);//获取用户提取请求的金额和待处理的提取金额
    const [requestAmount, pendingWithdrawAmount] = withdrawData as [bigint, bigint];
    const ava = Number(formatUnits(pendingWithdrawAmount, 18));//获取用户可提取的金额
    const total = Number(formatUnits(requestAmount, 18));//计算用户总的可提取金额
    setUserData({
      staked: formatUnits(staked , 18), //格式化用户质押金额
      withdrawable: ava.toFixed(4), //格式化可提取金额
      withdrawPending: total.toFixed(4) //格式化待处理的提取金额
    })
  }, [stakeContract, address])

  useEffect(() => {
    if(stakeContract && address) {
      getUserData(); //如果连接了钱包，获取用户数据
    }
  }, [address, stakeContract, getUserData]);

  const handleUnStake = useCallback(async () => {
    if(!stakeContract || !data) return;   //如果没有合约实例或数据，直接返回
    if(!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount'); //如果输入的金额无效，提示错误
      return;
    }
    if(parseFloat(amount) > parseFloat(userData.staked)) {
      toast.error('Amount cannot be greater than staked amount'); //如果输入的金额大于质押金额，提示错误
      return;
    }
    try{
      setUnstakeLoading(true); //设置取消质押的加载状态为true
      const tx = await stakeContract.write.unstake([Pid, parseUnits(amount, 18)]); //调用合约的取消质押方法
      const receipt = await waitForTransactionReceipt(data, { hash: tx }); //等待交易完成
      if(receipt.status === 'success') {
        toast.success('Unstake successful!'); //如果取消质押成功，提示成功
        setAmount(''); //清空输入框
        getUserData(); //重新获取用户数据
      } else {
        toast.error('Unstake failed!'); //如果取消质押失败，提示失败
      }
    }catch (error) {
      console.error(error, 'unstake-error'); //如果取消质押失败，打印错误
      toast.error('Unstake failed. Please try again.'); //提示取消质押失败
    } finally {
      setUnstakeLoading(false); //设置取消质押的加载状态为false
    }
     
    
  }, [stakeContract, amount, userData.staked, data, getUserData]);

  const handleWithdraw = useCallback(async () => {
    if (!stakeContract || !data) return;
    try {
      setWithdrawLoading(true);
      const tx = await stakeContract.write.withdraw([Pid]);
      await waitForTransactionReceipt(data, { hash: tx });
      toast.success('Withdraw successful!');
      getUserData();
    } catch (error) {
      toast.error('Transaction failed. Please try again.');
      console.log(error, 'stake-error');
    } finally {
      setWithdrawLoading(false);
    }
  }, [stakeContract, data, getUserData]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*(\.\d*)?$/.test(val)) {
      setAmount(val);
    }
  };
 return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent mb-4">
          Withdraw
        </h1>
        <p className="text-gray-600 text-lg">
          Unstake and withdraw your ETH
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="card"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Staked Amount" value={`${parseFloat(userData.staked).toFixed(4)} ETH`} />
          <StatCard label="Available to Withdraw" value={`${parseFloat(userData.withdrawable).toFixed(4)} ETH`} />
          <StatCard label="Pending Withdraw" value={`${parseFloat(userData.withdrawPending).toFixed(4)} ETH`} />
        </div>

        {/* Unstake Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Unstake</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Amount to Unstake
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.0"
                className={cn(
                  "input-field pr-12",
                  "focus:ring-primary-500 focus:border-primary-500"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                ETH
              </span>
            </div>
          </div>

          <div className="pt-4">
            {!isConnected ? (
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUnStake}
                disabled={unstakeLoading || !amount}
                className={cn(
                  "btn-primary w-full flex items-center justify-center space-x-2",
                  unstakeLoading && "opacity-70 cursor-not-allowed"
                )}
              >
                {unstakeLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <FiArrowUp className="w-5 h-5" />
                    <span>Unstake ETH</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="mt-12 space-y-6">
          <h2 className="text-xl font-semibold">Withdraw</h2>

          <div className="bg-primary-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Ready to Withdraw</div>
                <div className="text-2xl font-semibold text-primary-600">
                  {parseFloat(userData.withdrawable).toFixed(4)} ETH
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FiClock className="mr-1" />
                <span>20 min cooldown</span>
              </div>
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-500">
            <FiInfo className="mr-1" />
            <span>After unstaking, you need to wait 20 minutes to withdraw.</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleWithdraw}
            disabled={!isWithdrawable || withdrawLoading}
            className={cn(
              "btn-primary w-full flex items-center justify-center space-x-2",
              (!isWithdrawable || withdrawLoading) && "opacity-70 cursor-not-allowed"
            )}
          >
            {withdrawLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FiArrowUp className="w-5 h-5" />
                <span>Withdraw ETH</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-semibold text-primary-600">{value}</div>
    </div>
  );
}

export default Withdraw;