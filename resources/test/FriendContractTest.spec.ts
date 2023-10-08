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

describe("Ticker contract init and test", () => {
	const loadFixture = waffle.createFixtureLoader(
		waffle.provider.getWallets(),
		waffle.provider
	);

	async function v2Fixture([wallet,buyer, friend,platFormAddress,address4,address5,address6]: Wallet[], provider: MockProvider) {
		const myFriendContract = await ethers.getContractFactory("FriendContract");
		const friendContract = await myFriendContract.deploy();
		// await reaToken.initialize("REA token","REA");
		
		console.log("init friendContract!");
		await friendContract.initialize(platFormAddress);
		return {
			wallet,
			buyer,
			friend,
			platFormAddress,
			friendContract,
		};
	}

	describe("buy share test", () => {
		const token0Amount = expandTo18Decimals(5);
		const token1Amount = expandTo18Decimals(10);
		const tickerPayAmount = expandTo18Decimals(2);
		const base = 10000;
		

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
			
			
			//check the friendContract eth is zero
			let blanceOfFriendContract = await ethers.balanceOf(friendContract.address);
			expect(blanceOfFriendContract).to.be.equal(0);
			
			await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:1000})).to.be.revertedWith("not enough token");
			await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:friendSharePrice})).to.emit(blanceOfFriendContract,"BuyShareEvent");
			blanceOfFriendContract = await ethers.balanceOf(friendContract.address);
			expect(blanceOfFriendContract).to.be.equal(friendSharePrice*(base-user_percent - platform_percent));
			let balanceFriend = await ethers.balanceOf(friend.address);
			expect(balanceFriend).to.be.equal(friendSharePrice*user_percent/base);
			let balancePlatform = await ethers.balanceOf(platFormAddress.address);
			expect(balancePlatform).to.be.equal(friendSharePrice*platform_percent/base);
			//sell share
		});
	});

});
