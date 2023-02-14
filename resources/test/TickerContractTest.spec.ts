import { expect, use } from "chai";
import { MockProvider } from "ethereum-waffle";
import { BigNumber, BigNumberish, Contract, Wallet } from "ethers";
import { ethers, upgrades, waffle } from "hardhat";
// import { ITokenAFeeHandler, IBananaSwapPair, TokenManager } from "../types";
import { AddressZero, MaxUint256, Zero } from '@ethersproject/constants';
import bn from 'bignumber.js';
const blackHoleAddress = "000000000000000000000000000000000000dEaD";
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
const baseRatio = 10000;

describe("Ticker contract init and test", () => {
	const loadFixture = waffle.createFixtureLoader(
		waffle.provider.getWallets(),
		waffle.provider
	);

	async function v2Fixture([wallet, user,tickerRewardAccount,claimAccount]: Wallet[], provider: MockProvider) {
		const ReaToken = await ethers.getContractFactory("ReaToken");
		const reaToken = await ReaToken.deploy();
		await reaToken.initialize("REA token","REA");
		
		console.log("init read token!");

		const SmartERC20 = await ethers.getContractFactory("SmartERC20");
		const usdt = await SmartERC20.deploy();
		await usdt.initialize("usdt token", "USDT");

		// const reaToken = await SmartERC20.deploy();
		// await reaToken.initialize("REA token","REA");

		const fil = await SmartERC20.deploy();
		await fil.initialize("fil token", "fil");

		// deploy V2
		const v2factory = await ethers.getContractFactory("SunswapV2Factory");
		const factoryV2 = await v2factory.deploy(wallet.address);

		const SunswapV2Router02 = await ethers.getContractFactory("SunswapV2Router02");
		const sunswapV2Router02 = await SunswapV2Router02.deploy(factoryV2.address,reaToken.address);
		

		
		const oracleFactory = await ethers.getContractFactory("ExampleOracleSimple");
		const oracle = await oracleFactory.deploy();
		// initialize V2
		await factoryV2.createPair(reaToken.address, usdt.address);
		const reaUsdtPairAddress = await factoryV2.getPair(reaToken.address, usdt.address);
		const token0Amount = expandTo18Decimals(5);
		await oracle.initialize(factoryV2.address,reaToken.address,usdt.address,reaUsdtPairAddress,token0Amount);
		const codeHashOfPair = await factoryV2.PAIR_HASH();
    	console.log("codeHashOfPair is:", codeHashOfPair);

		const TickContract = await ethers.getContractFactory("TickerContract");
		const tickerContract = await TickContract.deploy();
		await tickerContract.initialize(reaToken.address,tickerRewardAccount.address,claimAccount.address);

		
		return {
			factoryV2,
			wallet,
			user,
			tickerRewardAccount,
			claimAccount,
			usdt,
			fil,
			oracle,
			sunswapV2Router02,
			reaToken,
			tickerContract
		};
	}

	describe("buy tick test", () => {
		const token0Amount = expandTo18Decimals(5);
		const token1Amount = expandTo18Decimals(10);
		const tickerPayAmount = expandTo18Decimals(2);
		// const swapAmount = expandTo18Decimals(1);
		// const expectedOutputAmount = BigNumber.from("1662497915624478906");
		

		it("buy ticker by REA", async () => {
			const { factoryV2,
				wallet,
				user,
				tickerRewardAccount,
				claimAccount,
				usdt,
				fil,
				oracle,
				sunswapV2Router02,
				reaToken,
				tickerContract
			
			} = await loadFixture(
				v2Fixture
			);
			let tickerIndex = 1;
			await reaToken.mint(wallet.address,token0Amount);
			let reaTokenDecimal = await reaToken.decimals();
			console.log("reaTokenDecimal",reaTokenDecimal);
			await usdt.mint(wallet.address,token1Amount);
			let usdtDecimal = await usdt.decimals();
			console.log("usdtDecimal",usdtDecimal);
			await reaToken.approve(sunswapV2Router02.address,token0Amount);
			await usdt.approve(sunswapV2Router02.address,token1Amount);
			await sunswapV2Router02.addLiquidity(reaToken.address,usdt.address,token0Amount,token1Amount,0,0,wallet.address,9673481508);
			let tokenPrice = await oracle.getTokenPrice();
			let humanTokenPrice = tokenPrice.div(BigNumber.from(2).pow(112));
			console.log("humanTokenPrice is:{}",humanTokenPrice);
			await oracle.update();
			let payAmount = tickerPayAmount.mul(humanTokenPrice);
			// let payAmount = await oracle.consult(usdt.address,tickerPayAmount);
			console.log("payAmount is:{}", payAmount);
			
			await expect(tickerContract.connect(user).buyTicker(user.address,tickerIndex,1,payAmount,3,fil.address,{from:user.address})).to.be.revertedWith("Not manager");
			await reaToken.mint(user.address,token0Amount);
			let balanceOfUser = await reaToken.balanceOf(user.address);
			console.log("balanceOfUser is:",balanceOfUser);
			await reaToken.connect(user).approve(tickerContract.address,token0Amount.mul(10),{from:user.address});
			await tickerContract.setManager(user.address,true);
			let minerLevel = 1;
			let multiple = 3;
			let tx = await tickerContract.connect(user).buyTicker(user.address,tickerIndex,minerLevel,payAmount,multiple,fil.address,{from:user.address});
			let receipt = await tx.wait();
			console.log("token0Amount is:",token0Amount);
			console.log("payAmount is:",payAmount);
			expect(await reaToken.balanceOf(user.address)).to.be.equal(token0Amount.sub(payAmount));
			let userTicker = await tickerContract.getUserTick(user.address,1);
			// console.log("userTicker is:",userTicker);
			expect(userTicker.buyer).to.be.equal(user.address);
			expect(userTicker.minerLevel).to.be.equal(minerLevel);
			let claimAccountAddress = await tickerContract.claimAccountAddress();
			let balanceOfClaimAccountAddress = await reaToken.balanceOf(claimAccountAddress);
			console.log("balanceOfClaimAccountAddress is:",balanceOfClaimAccountAddress);
			expect(balanceOfClaimAccountAddress).to.be.equal(payAmount);
			expect(userTicker.isUsed).to.be.equal(false);
			expect(userTicker.multiple).to.be.equal(multiple);
			expect(userTicker.profitToken).to.be.equal(fil.address);
			// let tickerIndex = await tickerContract.tickerIndex();
			// expect(tickerIndex).to.be.equal(1);

			// check the event
			let tickerBuy = receipt.events?.at(receipt.events?.length-1);
			// console.log("event is:",tickerBuy);
			expect(tickerBuy?.event).to.be.equal("TickerBuy");
			expect(tickerBuy?.args?.buyer).to.be.equal(user.address);
			expect(tickerBuy?.args?.minerLevel).to.be.equal(minerLevel);
			expect(tickerBuy?.args?.payAmount).to.be.equal(payAmount);
			expect(tickerBuy?.args?.multiple).to.be.equal(multiple);
			expect(tickerBuy?.args?.index).to.be.equal(tickerIndex);
			expect(tickerBuy?.args?.profitToken).to.be.equal(fil.address);
			await reaToken.mint(user.address,token0Amount);
			await expect(tickerContract.connect(user).buyTicker(user.address,tickerIndex,minerLevel,payAmount,multiple,fil.address,{from:user.address})).to.be.revertedWith("ticker exists");
		});

		it("buy ticker reward three reward", async () => {
			const { factoryV2,
				wallet,
				user,
				tickerRewardAccount,
				claimAccount,
				usdt,
				fil,
				oracle,
				sunswapV2Router02,
				reaToken,
				tickerContract
			
			} = await loadFixture(
				v2Fixture
			);

			await reaToken.mint(wallet.address,token0Amount);
			let reaTokenDecimal = await reaToken.decimals();
			console.log("reaTokenDecimal",reaTokenDecimal);
			await usdt.mint(wallet.address,token1Amount);
			let usdtDecimal = await usdt.decimals();
			console.log("usdtDecimal",usdtDecimal);
			await reaToken.approve(sunswapV2Router02.address,token0Amount);
			await usdt.approve(sunswapV2Router02.address,token1Amount);
			await sunswapV2Router02.addLiquidity(reaToken.address,usdt.address,token0Amount,token1Amount,0,0,wallet.address,9673481508);
			let tokenPrice = await oracle.getTokenPrice();
			let humanTokenPrice = tokenPrice.div(BigNumber.from(2).pow(112));
			console.log("humanTokenPrice is:{}",humanTokenPrice);
			await oracle.update();
			let payAmount = tickerPayAmount.mul(humanTokenPrice);
			// let payAmount = await oracle.consult(usdt.address,tickerPayAmount);
			console.log("payAmount is:{}", payAmount);
			
			await expect(tickerContract.connect(user).rewardTicker(user.address,payAmount,{from:user.address})).to.be.revertedWith("Not manager");
			await reaToken.mint(user.address,token0Amount);
			let balanceOfUser = await reaToken.balanceOf(user.address);
			console.log("balanceOfUser is:",balanceOfUser);
			await reaToken.connect(user).approve(tickerContract.address,token0Amount,{from:user.address});
			await tickerContract.setManager(user.address,true);
			await expect(tickerContract.connect(user).rewardTicker(user.address,payAmount,{from:user.address})).to.be.revertedWith("not enough reward");
			await reaToken.mint(tickerRewardAccount.address,token0Amount.mul(3));
			console.log("token0Amount is:",token0Amount);
			reaToken.connect(tickerRewardAccount).approve(tickerContract.address,token0Amount.mul(3),{from:tickerRewardAccount.address});
			let tx = await tickerContract.connect(user).rewardTicker(user.address,payAmount,{from:user.address});
			let receipt = await tx.wait();
			let rewardMul = await tickerContract.rewardMul();

			console.log("payAmount is:",payAmount);
			expect(await reaToken.balanceOf(user.address)).to.be.equal(token0Amount.add(payAmount.mul(rewardMul)));
			let tickerRewardAccountAddress = await tickerContract.tickerRewardAccount();
			let balanceOfTickerRewardAccount = await reaToken.balanceOf(tickerRewardAccountAddress);
			console.log("balanceOfTickerRewardAccount is:",balanceOfTickerRewardAccount);
			expect(balanceOfTickerRewardAccount).to.be.equal(token0Amount.mul(3).sub(payAmount.mul(rewardMul)));

			// check the event
			let rewardTicker = receipt.events?.at(receipt.events?.length-1);
			// console.log("event is:",rewardTicker);
			expect(rewardTicker?.event).to.be.equal("RewardTicker");
			expect(rewardTicker?.args?.buyer).to.be.equal(user.address);
			expect(rewardTicker?.args?.payAmount).to.be.equal(payAmount);
			expect(rewardTicker?.args?.rewardAmount).to.be.equal(payAmount.mul(rewardMul));
		});

	});

});
