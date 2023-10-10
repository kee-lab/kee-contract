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
		const KeeBeeSharesV1Contract = await ethers.getContractFactory("KeeBeeSharesV1");
		const KeeBeeSharesV1 = await KeeBeeSharesV1Contract.deploy();
		await KeeBeeSharesV1.deployed();
		
		console.log("init KeeBeeSharesV1!");
		
		return {
			wallet,
			buyer,
			friend,
			platFormAddress,
			KeeBeeSharesV1,
		};
	}

	describe("buy share test", () => {
		const base:BigNumber = BigNumber.from("10000");
		it("buy/sell share one time", async () => {
			const {wallet, 
				buyer,
				friend,
				platFormAddress,
				KeeBeeSharesV1,
			} = await loadFixture(
				v2Fixture
			);
			let protocolFeePercent = await KeeBeeSharesV1.protocolFeePercent();
			expect(protocolFeePercent).to.be.equal(500);
			let platform_buy_fee_ratio = await friendContract.platform_buy_fee_ratio();
			expect(platform_buy_fee_ratio).to.be.equal(500);

			let user_sell_fee_ratio = await friendContract.user_sell_fee_ratio();
			expect(user_sell_fee_ratio).to.be.equal(500);
			let platform_sell_fee_ratio = await friendContract.platform_sell_fee_ratio();
			expect(platform_sell_fee_ratio).to.be.equal(500);
			const provider = waffle.provider;

			let buyerBalance = await provider.getBalance(buyer.address);
			console.log("hardhat buyerBalance 1 is:",buyerBalance);
			let friendSharePrice = await friendContract.sharePrice(friend.address);
			console.log("hardhat friendSharePrice is:",friendSharePrice.toNumber());
			await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:friendSharePrice})).to.be.revertedWith("trans 0 addr");
			await friendContract.initialize(platFormAddress.address);


			buyerBalance = await provider.getBalance(buyer.address);
			console.log("hardhat buyerBalance 2 is:",buyerBalance);
			//check the friendContract eth is zero
			
			let balanceOfFriendContract = await provider.getBalance(friendContract.address);
			expect(balanceOfFriendContract).to.be.equal(0);
			let beforeBalanceFriend = await provider.getBalance(friend.address);
			let beforeBalancePlatform = await provider.getBalance(platFormAddress.address);
			console.log("hardhat beforeBalanceFriend is:",beforeBalanceFriend.toString());
			await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:1000})).to.be.revertedWith("not enough token");

			const buyTx = await friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:friendSharePrice});
			await expect(buyTx)
				.to.emit(friendContract, "BuyShareEvent")
				.withArgs(buyer.address,friend.address,friendSharePrice);


			balanceOfFriendContract = await provider.getBalance(friendContract.address);
			console.log("hardhat balanceOfFriendContract is:",balanceOfFriendContract.toString());
			expect(balanceOfFriendContract).to.be.equal(friendSharePrice.mul(base.sub(user_buy_fee_ratio).sub(platform_buy_fee_ratio)).div(base));
			let balanceFriend = await provider.getBalance(friend.address);
			expect(balanceFriend).to.be.equal(friendSharePrice.mul(user_buy_fee_ratio).div(base).add(beforeBalanceFriend));
			let balancePlatform = await provider.getBalance(platFormAddress.address);
			expect(balancePlatform).to.be.equal(friendSharePrice.mul(platform_buy_fee_ratio).div(base).add(beforeBalancePlatform));
			await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:1000})).to.be.revertedWith("not enough token");

			//sell share
			console.log("start sell share------------------------");
			await expect(friendContract.connect(wallet).sellShare(friend.address,{from:wallet.address})).to.be.revertedWith("no shares");
			const sellTx = await friendContract.connect(buyer).sellShare(friend.address,{from:buyer.address});
			let sellToken = friendSharePrice.mul(base.sub(user_buy_fee_ratio).sub(platform_buy_fee_ratio).sub(user_sell_fee_ratio).sub(platform_sell_fee_ratio)).div(base);
			await expect(sellTx)
				.to.emit(friendContract, "SellShareEvent")
				.withArgs(buyer.address,friend.address,sellToken);
			//check the contract after user sell share
			balanceOfFriendContract = await provider.getBalance(friendContract.address);
			console.log("hardhat balanceOfFriendContract is:",balanceOfFriendContract.toString());
			expect(balanceOfFriendContract).to.be.equal(0);

			//check user balance after sell the share.
			balanceFriend = await provider.getBalance(friend.address);
			expect(balanceFriend).to.be.equal(friendSharePrice.mul(user_buy_fee_ratio.add(user_sell_fee_ratio)).div(base).add(beforeBalanceFriend));
			balancePlatform = await provider.getBalance(platFormAddress.address);
			expect(balancePlatform).to.be.equal(friendSharePrice.mul(platform_buy_fee_ratio.add(platform_sell_fee_ratio)).div(base).add(beforeBalancePlatform));
		});

		it("test set ratio time", async () => {
			const {wallet, 
				buyer,
				friend,
				platFormAddress,
				friendContract,
			} = await loadFixture(
				v2Fixture
			);
			let user_buy_fee_ratio = await friendContract.user_buy_fee_ratio();
			expect(user_buy_fee_ratio).to.be.equal(500);
			let platform_buy_fee_ratio = await friendContract.platform_buy_fee_ratio();
			expect(platform_buy_fee_ratio).to.be.equal(500);

			let user_sell_fee_ratio = await friendContract.user_sell_fee_ratio();
			expect(user_sell_fee_ratio).to.be.equal(500);
			let platform_sell_fee_ratio = await friendContract.platform_sell_fee_ratio();
			expect(platform_sell_fee_ratio).to.be.equal(500);
			const provider = waffle.provider;

			let buyerBalance = await provider.getBalance(buyer.address);
			console.log("hardhat buyerBalance 1 is:",buyerBalance);
			let friendSharePrice = await friendContract.sharePrice(friend.address);
			console.log("hardhat friendSharePrice is:",friendSharePrice.toNumber());
			await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:friendSharePrice})).to.be.revertedWith("trans 0 addr");
			await friendContract.initialize(platFormAddress.address);


			buyerBalance = await provider.getBalance(buyer.address);
			console.log("hardhat buyerBalance 2 is:",buyerBalance);
			//check the friendContract eth is zero
			
			let balanceOfFriendContract = await provider.getBalance(friendContract.address);
			expect(balanceOfFriendContract).to.be.equal(0);
			let beforeBalanceFriend = await provider.getBalance(friend.address);
			let beforeBalancePlatform = await provider.getBalance(platFormAddress.address);
			console.log("hardhat beforeBalanceFriend is:",beforeBalanceFriend.toString());
			await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:1000})).to.be.revertedWith("not enough token");

			const buyTx = await friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:friendSharePrice});
			await expect(buyTx)
				.to.emit(friendContract, "BuyShareEvent")
				.withArgs(buyer.address,friend.address,friendSharePrice);


			balanceOfFriendContract = await provider.getBalance(friendContract.address);
			console.log("hardhat balanceOfFriendContract is:",balanceOfFriendContract.toString());
			expect(balanceOfFriendContract).to.be.equal(friendSharePrice.mul(base.sub(user_buy_fee_ratio).sub(platform_buy_fee_ratio)).div(base));
			let balanceFriend = await provider.getBalance(friend.address);
			expect(balanceFriend).to.be.equal(friendSharePrice.mul(user_buy_fee_ratio).div(base).add(beforeBalanceFriend));
			let balancePlatform = await provider.getBalance(platFormAddress.address);
			expect(balancePlatform).to.be.equal(friendSharePrice.mul(platform_buy_fee_ratio).div(base).add(beforeBalancePlatform));
			await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:1000})).to.be.revertedWith("not enough token");

			//sell share
			console.log("start sell share------------------------");
			await expect(friendContract.connect(wallet).sellShare(friend.address,{from:wallet.address})).to.be.revertedWith("no shares");
			const sellTx = await friendContract.connect(buyer).sellShare(friend.address,{from:buyer.address});
			let sellToken = friendSharePrice.mul(base.sub(user_buy_fee_ratio).sub(platform_buy_fee_ratio).sub(user_sell_fee_ratio).sub(platform_sell_fee_ratio)).div(base);
			await expect(sellTx)
				.to.emit(friendContract, "SellShareEvent")
				.withArgs(buyer.address,friend.address,sellToken);
			//check the contract after user sell share
			balanceOfFriendContract = await provider.getBalance(friendContract.address);
			console.log("hardhat balanceOfFriendContract is:",balanceOfFriendContract.toString());
			expect(balanceOfFriendContract).to.be.equal(0);

			//check user balance after sell the share.
			balanceFriend = await provider.getBalance(friend.address);
			expect(balanceFriend).to.be.equal(friendSharePrice.mul(user_buy_fee_ratio.add(user_sell_fee_ratio)).div(base).add(beforeBalanceFriend));
			balancePlatform = await provider.getBalance(platFormAddress.address);
			expect(balancePlatform).to.be.equal(friendSharePrice.mul(platform_buy_fee_ratio.add(platform_sell_fee_ratio)).div(base).add(beforeBalancePlatform));
		});
	});
});
