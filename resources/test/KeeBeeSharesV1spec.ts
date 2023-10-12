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

	describe("share test", () => {
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

			//normal friend sell share once
			await expect(keeBeeSharesV1Contract.connect(friend).sellShares(friend.address,1,{from:friend.address})).to.be.revertedWith("Cannot sell the last share");
			await expect(keeBeeSharesV1Contract.connect(buyer).sellShares(friend.address,1,{from:buyer.address})).to.be.revertedWith("Cannot sell the last share");

		});


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
			supply = await keeBeeSharesV1Contract.sharesSupply(friend.address);
			console.log("hardhat supply -----------------------1 is:",supply.toString());
			expect(supply).to.be.equal(1);
			
			let protocolFee = price.mul(protocolFeePercent).div(ether1);
			expect(protocolFee).to.be.equal(0);
			let subjectFee = price.mul(subjectFeePercent).div(ether1);
			expect(subjectFee).to.be.equal(0);
			await expect(buyShareTx1).to.emit(keeBeeSharesV1Contract,"Trade").withArgs(friend.address,friend.address,true,1,price,protocolFee,subjectFee,supply);
			buySharePrice = await keeBeeSharesV1Contract.getBuyPrice(friend.address,1);
			console.log("hardhat buySharePrice is:",buySharePrice.toString());
			let friendBalance = await provider.getBalance(friend.address);
			console.log("hardhat friendBalance is:",friendBalance.toString());
			let getBuyPriceAfterFee = keeBeeSharesV1Contract.getBuyPriceAfterFee(friend.address,1);
			await expect(keeBeeSharesV1Contract.connect(friend).buyShares(friend.address,2,{from:friend.address,value:getBuyPriceAfterFee})).to.be.revertedWith("amount too high");

			let balanceOfFriendContract = await provider.getBalance(keeBeeSharesV1Contract.address);
			expect(balanceOfFriendContract).to.be.equal(0);

			//normal user buy share once
			supply = await keeBeeSharesV1Contract.sharesSupply(friend.address);
			price = await keeBeeSharesV1Contract.getPrice(supply,1);
			protocolFee = price.mul(protocolFeePercent).div(ether1);
			subjectFee = price.mul(subjectFeePercent).div(ether1);
			let initPlatForm = await provider.getBalance(platFormAddress.address);
			let buyShareTx2 = await keeBeeSharesV1Contract.connect(buyer).buyShares(friend.address,1,{from:buyer.address,value:getBuyPriceAfterFee});

			supply = await keeBeeSharesV1Contract.sharesSupply(friend.address);
			console.log("hardhat supply -----------------------2 is:",supply.toString());
			expect(supply).to.be.equal(2);

			await expect(buyShareTx2).to.emit(keeBeeSharesV1Contract,"Trade").withArgs(buyer.address,friend.address,true,1,price,protocolFee,subjectFee,supply);
			let balancePlatForm = await provider.getBalance(platFormAddress.address);
			expect(protocolFee).to.be.equal(balancePlatForm.sub(initPlatForm));

			//sell the share 
			await expect(keeBeeSharesV1Contract.connect(wallet).sellShares(friend.address,1,{from:wallet.address})).to.be.revertedWith("Insufficient shares");

			let sellTx = await keeBeeSharesV1Contract.connect(buyer).sellShares(friend.address,1,{from:buyer.address});

			// TODO check the sell result and events
			supply = await keeBeeSharesV1Contract.sharesSupply(friend.address);
			expect(supply).to.be.equal(1);
			console.log("hardhat supply is:",supply.toString());
			price = await keeBeeSharesV1Contract.getPrice(supply,1);
			console.log("hardhat price is:",price.toString());
			protocolFee = price.mul(protocolFeePercent).div(ether1);
			subjectFee = price.mul(subjectFeePercent).div(ether1);
			await expect(sellTx).to.emit(keeBeeSharesV1Contract,"Trade").withArgs(buyer.address,friend.address,false,1,price,protocolFee,subjectFee,supply);
			balancePlatForm = await provider.getBalance(platFormAddress.address);
			expect(balancePlatForm).to.be.equal(initPlatForm.add(protocolFee).add(protocolFee));

			balanceOfFriendContract = await provider.getBalance(keeBeeSharesV1Contract.address);
			expect(balanceOfFriendContract).to.be.equal(0);
			
		});
	});
});
