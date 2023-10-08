import { expect, use } from "chai";
import { MockProvider } from "ethereum-waffle";
import { BigNumber, BigNumberish, Contract, Wallet } from "ethers";
import { ethers, upgrades, waffle } from "hardhat";
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

describe.only("Ticker contract init and test", () => {
	const loadFixture = waffle.createFixtureLoader(
		waffle.provider.getWallets(),
		waffle.provider
	);

	async function v2Fixture([wallet,buyer, friend,platFormAddress,address4,address5,address6]: Wallet[], provider: MockProvider) {
		const myFriendContract = await ethers.getContractFactory("FriendContract");
		const friendContract = await myFriendContract.deploy();
		// await reaToken.initialize("REA token","REA");
		
		console.log("init friendContract!");
		await friendContract.initialize(platFormAddress.address);
		return {
			wallet,
			buyer,
			friend,
			platFormAddress,
			friendContract,
		};
	}

	describe("buy share test", () => {
		const base:BigNumber = BigNumber.from("10000");
		

		it("buy/sell share one time", async () => {
			const {wallet, 
				buyer,
				friend,
				platFormAddress,
				friendContract,
			} = await loadFixture(
				v2Fixture
			);
			let user_percent = await friendContract.user_percent();
			expect(user_percent).to.be.equal(500);
			let platform_percent = await friendContract.platform_percent();
			expect(platform_percent).to.be.equal(500);


			let friendSharePrice = await friendContract.sharePrice(friend.address);
			console.log("hardhat friendSharePrice is:",friendSharePrice.toNumber());
			
			//check the friendContract eth is zero
			const provider = waffle.provider;
			let balanceOfFriendContract = await provider.getBalance(friendContract.address);
			expect(balanceOfFriendContract).to.be.equal(0);
			let beforeBalanceFriend = await provider.getBalance(friend.address);
			let beforeBalancePlatform = await provider.getBalance(platFormAddress.address);
			console.log("hardhat beforeBalanceFriend is:",beforeBalanceFriend.toString());
			await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:1000})).to.be.revertedWith("not enough token");
			expect(await friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:friendSharePrice})).to.emit(balanceOfFriendContract,"BuyShareEvent");
			balanceOfFriendContract = await provider.getBalance(friendContract.address);
			console.log("hardhat balanceOfFriendContract is:",balanceOfFriendContract.toString());
			expect(balanceOfFriendContract).to.be.equal(friendSharePrice.mul(base.sub(user_percent).sub(platform_percent)).div(base));
			let balanceFriend = await provider.getBalance(friend.address);
			expect(balanceFriend).to.be.equal(friendSharePrice.mul(user_percent).div(base).add(beforeBalanceFriend));
			let balancePlatform = await provider.getBalance(platFormAddress.address);
			expect(balancePlatform).to.be.equal(friendSharePrice.mul(platform_percent).div(base).add(beforeBalancePlatform));
			//sell share
		});
	});

});
