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

	async function v2Fixture([wallet, user,address1,address4,address5,address6]: Wallet[], provider: MockProvider) {
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

		

		
		// initialize V2
		const token0Amount = expandTo18Decimals(5);

		const TickContract = await ethers.getContractFactory("TickerContract");
		const tickerContract = await TickContract.deploy();
		await tickerContract.initialize(reaToken.address,address1.address,[address1.address,address4.address,address5.address,address6.address],[5000,2500,1500,1000]);

		
		return {
			factoryV2,
			wallet,
			user,
			address1,
			address4,
			address5,
			address6,
			usdt,
			fil,
			reaToken,
			tickerContract
		};
	}

	describe("buy tick test", () => {
		const token0Amount = expandTo18Decimals(5);
		const token1Amount = expandTo18Decimals(10);
		const tickerPayAmount = expandTo18Decimals(2);
		const base = 10000;
		// const swapAmount = expandTo18Decimals(1);
		// const expectedOutputAmount = BigNumber.from("1662497915624478906");
		

		it("buy ticker by REA", async () => {
			const { factoryV2,
				wallet,
				user,
				address1,
				address4,
				address5,
				address6,
				usdt,
				fil,
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
			let payAmount = tickerPayAmount;
			// let payAmount = await oracle.consult(usdt.address,tickerPayAmount);
			console.log("payAmount is:{}", payAmount);
			

			// address buyer,uint tickerIndex,uint256 minerLevel,uint256 tickerPayAmount,uint256 multiple,address profitToken
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
			// let claimAccountAddress = await tickerContract.claimAccountAddress();
			let address1Amount = await reaToken.balanceOf(address1.address);
			expect(address1Amount).to.be.equal(payAmount.mul(5000).div(base));
			let address4Amount = await reaToken.balanceOf(address4.address);
			expect(address4Amount).to.be.equal(payAmount.mul(2500).div(base));
			let address5Amount = await reaToken.balanceOf(address5.address);
			expect(address5Amount).to.be.equal(payAmount.mul(1500).div(base));
			let address6Amount = await reaToken.balanceOf(address6.address);
			expect(address6Amount).to.be.equal(payAmount.mul(1000).div(base));
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
				address1,
				address4,
				usdt,
				fil,
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
			let payAmount = tickerPayAmount;
			
			await expect(tickerContract.connect(user).rewardTicker(user.address,payAmount,{from:user.address})).to.be.revertedWith("Not manager");
			await reaToken.mint(user.address,token0Amount);
			let balanceOfUser = await reaToken.balanceOf(user.address);
			console.log("balanceOfUser is:",balanceOfUser);
			await reaToken.connect(user).approve(tickerContract.address,token0Amount,{from:user.address});
			await tickerContract.setManager(user.address,true);
			await expect(tickerContract.connect(user).rewardTicker(user.address,payAmount,{from:user.address})).to.be.revertedWith("not enough reward");
			await reaToken.mint(address1.address,token0Amount.mul(3));
			console.log("token0Amount is:",token0Amount);
			reaToken.connect(address1).approve(tickerContract.address,token0Amount.mul(3),{from:address1.address});
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
