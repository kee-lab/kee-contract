import { expect, use } from "chai";
import { MockProvider } from "ethereum-waffle";
import { BigNumber, BigNumberish, Contract, Wallet } from "ethers";
import { ethers, upgrades, waffle } from "hardhat";
// import { ITokenAFeeHandler, IBananaSwapPair, TokenManager } from "../types";
import { AddressZero, MaxUint256, Zero } from '@ethersproject/constants';
import bn from 'bignumber.js';
const overrides = {
	gasLimit: 9999999
}
import {
	expandTo18Decimals,
	MINIMUM_LIQUIDITY,
	setNextBlockTime,
	encodePrice,
} from "./shared/utilities";
import exp from "constants";
import { TickerContract } from "../types";
import { assert } from "console";
const baseRatio = 100;

	async ()=>{
		const ReaToken = await ethers.getContractFactory("ReaToken");
		const reaToken = await ReaToken.deploy();
		await reaToken.initialize("REA token", "REA");

		

		const SmartERC20 = await ethers.getContractFactory("SmartERC20");
		const usdtToken = await SmartERC20.deploy();
		await usdtToken.initialize("usdt token", "USDT");


		const fil = await SmartERC20.deploy();
		await fil.initialize("fil token", "fil");

		
		const token0Amount = expandTo18Decimals(5);
		const token1Amount = expandTo18Decimals(10);
		const minerProfitAmount = expandTo18Decimals(10);
		const buyTickerUsdtAmount = expandTo18Decimals(10);
		const minerReaUsdtAmount = expandTo18Decimals(80);
		const minerUsdtAmount = expandTo18Decimals(120);
		const claimAmount = expandTo18Decimals(5);


		const blackHole = "T9yD14Nj9j7xAB4dbGeiX9h8unkKLxmGkn";
		const wallet = "TEeeCkMA3gXekaKRPYMhhEwUkve6YBCTVy";
		const readTokenAddress="TPLU3kfVZqoGEsfBVMJmWXuP9wQBQs8XFQ";
		const usdtTokenAddress="TMEAXgQzSzJiFNYqpUSsaGGQy2v4bB5mh8"
		const filContractAddress="TFyfgLtCgaEz23Bk4MQ24axvmwk5UAcwjj"

		const tickerRewardAccount = "TF2dVw7ohgm8mcgb9kGShRfAQEJhvyMq2f"
		const claimAccount = "TYqFGVcr8He5f97UTa6EtM698FSMxPYFad"
		const ecologyAccount="TXUghVQyycqbZy7dVXKfFQTeMJhTdxXEro"
		const teamRewardAccount="TSxMEhUv2ozAeodxgoEmCKXYQj4j15q79g"
		const storeUsdtAccount="TCHv1CxxdGoARJgv2R34uoHKQDYukNEenH"
		const profitProductAccount="TRH9v7XrBfD6oJ4pcVTSHsyWJ72cVofXGS"
		const user = "TLPBQXLvZ6WwCmB1xdD5E5X2CeP2b6yR8Z";

		const TickContract = await ethers.getContractFactory("TickerContract");
		const tickerContract = await TickContract.deploy();
		await tickerContract.initialize(reaToken.address, tickerRewardAccount, claimAccount);

		const MinerContract = await ethers.getContractFactory("MinerContract");
		const minerContract = await MinerContract.deploy();
		





		await minerContract.initialize(reaToken.address, usdtToken.address, blackHole, 10, 
			ecologyAccount, 30, teamRewardAccount, 60, claimAccount,tickerContract.address,
			storeUsdtAccount,profitProductAccount);

			let tickerIndex = 1;
			await reaToken.mint(user, token0Amount);
			await usdtToken.mint(user, token1Amount);
			let profitToken = fil.address;
			let minerLevel = 1;
			let multiple = 3;
			
			let buyTickerReaAmount = 100;
			await reaToken.connect(user).approve(tickerContract.address, buyTickerReaAmount, { from: user });
			let tx = await tickerContract.connect(wallet).buyTicker(user,tickerIndex, minerLevel, buyTickerReaAmount, multiple, profitToken, { from: wallet });

			
			let minerReaAmount=100;
			await reaToken.mint(user,minerReaAmount);
			await reaToken.connect(user).approve(minerContract.address,minerReaAmount,{from:user});
			await usdtToken.mint(user,minerUsdtAmount);
			await usdtToken.connect(user).approve(minerContract.address,minerUsdtAmount,{from:user});



			await tickerContract.setManager(minerContract.address,true);
			let pledgeTx = await minerContract.connect(user)
				.pledgeMiner(user, tickerIndex, minerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user });
			
			
			

			



			// console.log("pledgeMinerEvent is:",pledgeMinerEvent);


		




			let drawFeeOfUsdt = 100;

			await reaToken.connect(user).approve(minerContract.address,drawFeeOfUsdt,{from: user});
			
			
			await fil.mint(profitProductAccount,claimAmount);
			await fil.connect(profitProductAccount).approve(minerContract.address,claimAmount,{from:profitProductAccount});
			let claimTx = await minerContract.connect(user).claimProfit(user,tickerIndex,claimAmount,drawFeeOfUsdt,{from: user});

		}