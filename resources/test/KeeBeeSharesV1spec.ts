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
		const keeBeeSharesV1 = await KeeBeeSharesV1Contract.deploy();
		await keeBeeSharesV1.deployed();
		console.log("init KeeBeeSharesV1!");
		
		return {
			wallet,
			buyer,
			friend,
			platFormAddress,
			keeBeeSharesV1,
		};
	}

	describe("buy share test", () => {
		const base:BigNumber = BigNumber.from("10000");
		it("buy/sell share one time", async () => {
			const {wallet, 
				buyer,
				friend,
				platFormAddress,
				keeBeeSharesV1:keeBeeSharesV1Contract,
			} = await loadFixture(
				v2Fixture
			);
			const ether1 = ethers.utils.parseEther("1");

			await keeBeeSharesV1Contract.initialize(platFormAddress.address);
			let protocolFeePercent = await keeBeeSharesV1Contract.protocolFeePercent();
			expect(protocolFeePercent).to.be.equal(BigNumber.from("50000000000000000"));
			let subjectFeePercent = await keeBeeSharesV1Contract.subjectFeePercent();
			expect(subjectFeePercent).to.be.equal(BigNumber.from("50000000000000000"));
			

			const provider = waffle.provider;

			let buyerBalance = await provider.getBalance(buyer.address);
			console.log("hardhat buyerBalance 1 is:",buyerBalance);
			let buySharePrice = await keeBeeSharesV1Contract.getBuyPrice(friend.address,1);
			expect(buySharePrice).to.be.equal(BigNumber.from("0"));
			console.log("hardhat friendSharePrice is:",buySharePrice.toString());
			//只能是share的所有者先购买自己的share,且只能购买一次.
			await expect(keeBeeSharesV1Contract.connect(buyer).buyShares(friend.address,1,{from:buyer.address,value:buySharePrice})).to.be.revertedWith("'Only the shares' subject can buy the first share");
			await expect(keeBeeSharesV1Contract.connect(friend).buyShares(friend.address,2,{from:friend.address,value:buySharePrice})).to.be.revertedWith("amount too high");
			
			//friend buy friend share
			let supply = await keeBeeSharesV1Contract.sharesSupply(friend.address);
			let price = await keeBeeSharesV1Contract.getPrice(supply,1);
			console.log("hardhat price is:",price.toString());

			let buyShareTx1 = await keeBeeSharesV1Contract.connect(friend).buyShares(friend.address,1,{from:friend.address,value:buySharePrice});
			let protocolFee = price.mul(protocolFeePercent).div(ether1);
			expect(protocolFee).to.be.equal(0);
			let subjectFee = price.mul(subjectFeePercent).div(ether1);
			expect(subjectFee).to.be.equal(0);
			await expect(buyShareTx1).to.emit(keeBeeSharesV1Contract,"Trade").withArgs(friend.address,friend.address,true,1,price,protocolFee,subjectFee,supply.add(1));
			buySharePrice = await keeBeeSharesV1Contract.getBuyPrice(friend.address,1);
			console.log("hardhat buySharePrice is:",buySharePrice.toString());
			let friendBalance = await provider.getBalance(friend.address);
			console.log("hardhat friendBalance is:",friendBalance.toString());
			let getBuyPriceAfterFee = keeBeeSharesV1Contract.getBuyPriceAfterFee(friend.address,1);
			await expect(keeBeeSharesV1Contract.connect(friend).buyShares(friend.address,2,{from:friend.address,value:getBuyPriceAfterFee})).to.be.revertedWith("amount too high");

			let balanceOfFriendContract = await provider.getBalance(keeBeeSharesV1Contract.address);
			expect(balanceOfFriendContract).to.be.equal(0);

			//normal user buy share once
			let buyShareTx3 = await keeBeeSharesV1Contract.connect(buyer).buyShares(friend.address,1,{from:buyer.address,value:getBuyPriceAfterFee});
			await expect(buyShareTx3).to.emit(keeBeeSharesV1Contract,"Trade").withArgs(friend.address,friend.address,true,1,price,protocolFee,subjectFee,supply.add(1));

			// let beforeBalanceFriend = await provider.getBalance(friend.address);
			// let beforeBalancePlatform = await provider.getBalance(platFormAddress.address);
			// console.log("hardhat beforeBalanceFriend is:",beforeBalanceFriend.toString());
			// await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:1000})).to.be.revertedWith("not enough token");

			// const buyTx = await friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:friendSharePrice});
			// await expect(buyTx)
			// 	.to.emit(friendContract, "BuyShareEvent")
			// 	.withArgs(buyer.address,friend.address,friendSharePrice);


			// balanceOfFriendContract = await provider.getBalance(friendContract.address);
			// console.log("hardhat balanceOfFriendContract is:",balanceOfFriendContract.toString());
			// expect(balanceOfFriendContract).to.be.equal(friendSharePrice.mul(base.sub(user_buy_fee_ratio).sub(platform_buy_fee_ratio)).div(base));
			// let balanceFriend = await provider.getBalance(friend.address);
			// expect(balanceFriend).to.be.equal(friendSharePrice.mul(user_buy_fee_ratio).div(base).add(beforeBalanceFriend));
			// let balancePlatform = await provider.getBalance(platFormAddress.address);
			// expect(balancePlatform).to.be.equal(friendSharePrice.mul(platform_buy_fee_ratio).div(base).add(beforeBalancePlatform));
			// await expect(friendContract.connect(buyer).buyShare(friend.address,{from:buyer.address,value:1000})).to.be.revertedWith("not enough token");

			// //sell share
			// console.log("start sell share------------------------");
			// await expect(friendContract.connect(wallet).sellShare(friend.address,{from:wallet.address})).to.be.revertedWith("no shares");
			// const sellTx = await friendContract.connect(buyer).sellShare(friend.address,{from:buyer.address});
			// let sellToken = friendSharePrice.mul(base.sub(user_buy_fee_ratio).sub(platform_buy_fee_ratio).sub(user_sell_fee_ratio).sub(platform_sell_fee_ratio)).div(base);
			// await expect(sellTx)
			// 	.to.emit(friendContract, "SellShareEvent")
			// 	.withArgs(buyer.address,friend.address,sellToken);
			// //check the contract after user sell share
			// balanceOfFriendContract = await provider.getBalance(friendContract.address);
			// console.log("hardhat balanceOfFriendContract is:",balanceOfFriendContract.toString());
			// expect(balanceOfFriendContract).to.be.equal(0);

			// //check user balance after sell the share.
			// balanceFriend = await provider.getBalance(friend.address);
			// expect(balanceFriend).to.be.equal(friendSharePrice.mul(user_buy_fee_ratio.add(user_sell_fee_ratio)).div(base).add(beforeBalanceFriend));
			// balancePlatform = await provider.getBalance(platFormAddress.address);
			// expect(balancePlatform).to.be.equal(friendSharePrice.mul(platform_buy_fee_ratio.add(platform_sell_fee_ratio)).div(base).add(beforeBalancePlatform));
		});

	});
});
