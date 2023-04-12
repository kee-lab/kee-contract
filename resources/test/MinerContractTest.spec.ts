import { expect, use } from "chai";
import { MockProvider } from "ethereum-waffle";
import { BigNumber, BigNumberish, Contract, Wallet } from "ethers";
import { ethers, upgrades, waffle } from "hardhat";
// import { ITokenAFeeHandler, IBananaSwapPair, TokenManager } from "../types";
import { AddressZero, MaxUint256, Zero } from '@ethersproject/constants';
import bn from 'bignumber.js';
// const blackHoleAddress = "000000000000000000000000000000000000dEaD";
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

describe("Miner contract init and test", () => {
	const loadFixture = waffle.createFixtureLoader(
		waffle.provider.getWallets(),
		waffle.provider
	);

	async function v2Fixture([wallet, user,  
		address1,address2,address3,address5,address6, 
		address111,address555,address666, 
		address11,address22,address33,address55,address66, 
		storeUsdtAccount,profitProductAccount]: Wallet[], provider: MockProvider) {
		const ReaToken = await ethers.getContractFactory("ReaToken");
		const reaToken = await ReaToken.deploy();
		// await reaToken.initialize("REA token", "REA");

		console.log("init read token!");

		const SmartERC20 = await ethers.getContractFactory("SmartERC20");
		const usdtToken = await SmartERC20.deploy();
		await usdtToken.initialize("usdt token", "USDT");

		// const reaToken = await SmartERC20.deploy();
		// await reaToken.initialize("REA token","REA");

		const fil = await SmartERC20.deploy();
		await fil.initialize("fil token", "fil");

		// deploy V2
		// const v2factory = await ethers.getContractFactory("SunswapV2Factory");
		// const factoryV2 = await v2factory.deploy(wallet.address);

		// const SunswapV2Router02 = await ethers.getContractFactory("SunswapV2Router02");
		// const sunswapV2Router02 = await SunswapV2Router02.deploy(factoryV2.address, reaToken.address);



		// const oracleFactory = await ethers.getContractFactory("ExampleOracleSimple");
		// const oracle = await oracleFactory.deploy();
		// initialize V2
		// await factoryV2.createPair(reaToken.address, usdtToken.address);
		// const reaUsdtPairAddress = await factoryV2.getPair(reaToken.address, usdtToken.address);
		const token0Amount = expandTo18Decimals(5);
		// await oracle.initialize(factoryV2.address, reaToken.address, usdtToken.address, reaUsdtPairAddress, token0Amount);
		// const codeHashOfPair = await factoryV2.PAIR_HASH();
		// console.log("codeHashOfPair is:", codeHashOfPair);

		const TickContract = await ethers.getContractFactory("TickerContract");
		const tickerContract = await TickContract.deploy();
		const address444 = "0x4100000000000000000000000000000000000001";
		const address4 = "0x4100000000000000000000000000000000000001";
		const address44 = "0x4100000000000000000000000000000000000001";
		
		await tickerContract.initialize(reaToken.address,address111.address,
			[address111.address,address444,address555.address,address666.address],
			[5000,2500,1500,1000]);

		const MinerContract = await ethers.getContractFactory("MinerContract");
		const minerContract = await MinerContract.deploy();



		// address _reaToken,address _usdtToken,address[] memory claimFeeAddresses,uint256[] memory calimFeePercent,
        // address[] memory depositFeeAddresses,uint256[] memory depositFeePercent,address _tickerContractAddress,
        // address _storeUsdtAddress,address _profitProductAccount,bool _isSendProfit
		await minerContract.initialize(reaToken.address, usdtToken.address, 
			[address2.address,address3.address,address4,address5.address,address6.address],
			[3000,6000,500,300,200], 
			[address44,address55.address,address66.address],
			[5000,3000,2000],
			tickerContract.address,
			storeUsdtAccount.address,profitProductAccount.address,true);

		return {
			wallet,
			user,
			profitProductAccount,
			usdtToken,
			fil,
			reaToken,
			tickerContract,
			minerContract,
			address1,
			address2,
			address3,
			address4,
			address5,
			address6,
			address111,
			address444,
			address555,
			address666,
			address11,
			address22,
			address33,
			address44,
			address55,
			address66,
		};
	}

	describe("miner test", () => {
		const token0Amount = expandTo18Decimals(5);
		const token1Amount = expandTo18Decimals(10);
		const minerProfitAmount = expandTo18Decimals(20);
		const buyTickerUsdtAmount = expandTo18Decimals(10);
		const minerReaUsdtAmount = expandTo18Decimals(80);
		const minerUsdtAmount = expandTo18Decimals(120);
		const claimAmount = expandTo18Decimals(10);
		const drawFeeOfUsdt = BigNumber.from(300);
		const base = 10000;
		// const swapAmount = expandTo18Decimals(1);
		// const expectedOutputAmount = BigNumber.from("1662497915624478906");




		it("test modify ticker map", async () => {
			const { 
				wallet,
				user,
				profitProductAccount,
				usdtToken,
				fil,
				reaToken,
				tickerContract,
				address111,
				address444,
				address555,
				address666,
			} = await loadFixture(
				v2Fixture
			);
			// [address111.address,address444.address,address555.address,address666.address],
			// [5000,2500,1500,1000]);
			var [addresses,percents] = await tickerContract.getDisributeAddresses();
			console.log("addresses is:",addresses);
			expect(addresses[0]).to.be.equal(address111.address);
			expect(addresses[1]).to.be.equal(address444);
			expect(addresses[2]).to.be.equal(address555.address);
			expect(addresses[3]).to.be.equal(address666.address);
			console.log("percents is:",percents);
			expect(percents[0]).to.be.equal(5000);
			expect(percents[1]).to.be.equal(2500);
			expect(percents[2]).to.be.equal(1500);
			expect(percents[3]).to.be.equal(1000);
			console.log("percents is:",percents);
			console.log("---------------------");
			await tickerContract.setDistributionMap([address555.address,address444],[1500,2500]);
			var [addresses,percents] = await tickerContract.getDisributeAddresses();
			console.log("addresses is:",addresses);
			expect(addresses[0]).to.be.equal(address555.address);
			expect(addresses[1]).to.be.equal(address444);
			console.log("percents is:",percents);
			expect(percents[0]).to.be.equal(1500);
			expect(percents[1]).to.be.equal(2500);
			console.log("---------------------");

		});


		it("test modify miner map", async () => {
			const { 
				wallet,
				user,
				profitProductAccount,
				usdtToken,
				fil,
				reaToken,
				tickerContract,
				minerContract,
				address1,
				address2,
				address3,
				address4,
				address5,
				address6,
				address11,
				address22,
				address33,
				address44,
				address55,
				address66,
				address444,
				address555,
				address666,
			} = await loadFixture(
				v2Fixture
			);
			// [address2.address,address3.address,address4.address,address5.address,address6.address],
			// [3000,6000,500,300,200],
			var [addresses,percents] = await minerContract.getDepositFeeMap();
			console.log("addresses is:",addresses);
			console.log("percents is:",percents);
			console.log("---------------------");

			expect(addresses[0]).to.be.equal(address2.address);
			expect(addresses[1]).to.be.equal(address3.address);
			expect(addresses[2]).to.be.equal(address4);
			expect(addresses[3]).to.be.equal(address5.address);
			expect(addresses[4]).to.be.equal(address6.address);
			expect(percents[0]).to.be.equal(3000);
			expect(percents[1]).to.be.equal(6000);
			expect(percents[2]).to.be.equal(500);
			expect(percents[3]).to.be.equal(300);
			expect(percents[4]).to.be.equal(200);

			await minerContract.setDepositFeeMap([address555.address,address444],[1500,2500]);
			var [addresses,percents] = await minerContract.getDepositFeeMap();
			expect(addresses[0]).to.be.equal(address555.address);
			expect(addresses[1]).to.be.equal(address444);
			console.log("percents is:",percents);
			expect(percents[0]).to.be.equal(1500);
			expect(percents[1]).to.be.equal(2500);
			console.log("---------------------");


			// [address44.address,address55.address,address66.address],
			// [5000,3000,2000],
			var [addresses,percents] = await minerContract.getClaimFeeMap();
			console.log("addresses is:",addresses);
			expect(addresses[0]).to.be.equal(address44);
			expect(addresses[1]).to.be.equal(address55.address);
			expect(addresses[2]).to.be.equal(address66.address);
			console.log("percents is:",percents);
			expect(percents[0]).to.be.equal(5000);
			expect(percents[1]).to.be.equal(3000);
			expect(percents[2]).to.be.equal(2000);
			console.log("---------------------");
			await minerContract.setClaimFeeMap([address555.address,address444],[1500,2500]);
			var [addresses,percents] = await minerContract.getClaimFeeMap();
			console.log("addresses is:",addresses);
			console.log("percents is:",percents);
			console.log("---------------------");
			expect(addresses[0]).to.be.equal(address555.address);
			expect(addresses[1]).to.be.equal(address444);
			console.log("percents is:",percents);
			expect(percents[0]).to.be.equal(1500);
			expect(percents[1]).to.be.equal(2500);

		});



		it("buy miner delivery threshold", async () => {
			const { 
				wallet,
				user,
				profitProductAccount,
				usdtToken,
				fil,
				reaToken,
				tickerContract,
				minerContract,
				address1,
				address2,
				address3,
				address4,
				address5,
				address6,
				address11,
				address22,
				address33,
				address44,
				address55,
				address66,
			} = await loadFixture(
				v2Fixture
			);
			let tickerIndex = 1;
			await reaToken.mint(wallet.address, token0Amount);
			let reaTokenDecimal = await reaToken.decimals();
			console.log("reaTokenDecimal", reaTokenDecimal);
			await usdtToken.mint(wallet.address, token1Amount);
			let usdtDecimal = await usdtToken.decimals();
			console.log("usdtDecimal", usdtDecimal);
			let tickerPayAmount = BigNumber.from(10000);
			let minerReaAmount = minerReaUsdtAmount;
			// let payAmount = await oracle.consult(usdt.address,tickerPayAmount);
			console.log("payAmount is:{}", minerReaAmount);
			let profitToken = fil.address;
			await expect(tickerContract.connect(user).buyTicker(user.address,tickerIndex, 1, tickerPayAmount, 3, profitToken, { from: user.address })).to.be.revertedWith("Not manager");
			await reaToken.mint(user.address, tickerPayAmount);
			let balanceOfUser = await reaToken.balanceOf(user.address);
			console.log("balanceOfUser is:", balanceOfUser);
			await reaToken.connect(user).approve(tickerContract.address, tickerPayAmount, { from: user.address });
			await tickerContract.setManager(user.address, true);
			let minerLevel = 1;
			let multiple = 3;
			console.log("buyTickerReaAmount is:",tickerPayAmount);
			var [addresses,percents] = await tickerContract.getDisributeAddresses();
			console.log("reaToken.balanceOf(addresses[1]:",await reaToken.balanceOf(addresses[1]));

			let tx = await tickerContract.connect(user).buyTicker(user.address,tickerIndex, minerLevel, tickerPayAmount, multiple, profitToken, { from: user.address });
			console.log("reaToken.balanceOf(addresses[1]:",await reaToken.balanceOf(addresses[1]));
			let transThreshold = await tickerContract.transThreshold();
			let thresholdAmount = transThreshold.mul(BigNumber.from(10).pow(await reaToken.decimals()));
			let totalSupply1 = await reaToken.totalSupply();
			await tickerContract.emergencyDistribute();
			console.log("reaToken.balanceOf(addresses[1]:",await reaToken.balanceOf(addresses[1]));
			expect(tickerPayAmount).to.be.below(thresholdAmount);
			let totalSupply2 = await reaToken.totalSupply();
			let totalSupplySub = totalSupply1.sub(totalSupply2);
			console.log("addresses is:",addresses);
			expect(totalSupplySub).to.be.equal(tickerPayAmount.mul(percents[1]).div(10000));
			expect(await reaToken.balanceOf(addresses[0])).to.be.equal(tickerPayAmount.mul(percents[0]).div(10000));
			expect(await reaToken.balanceOf(addresses[1])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[2])).to.be.equal(tickerPayAmount.mul(percents[2]).div(10000));
			expect(await reaToken.balanceOf(addresses[3])).to.be.equal(tickerPayAmount.mul(percents[3]).div(10000));




			let tickerPayAmount2 = thresholdAmount;

			await reaToken.mint(user.address, tickerPayAmount2.mul(5000));
			await reaToken.connect(user).approve(tickerContract.address, tickerPayAmount2.mul(5000), { from: user.address });
			await tickerContract.connect(user).buyTicker(user.address,tickerIndex+1, minerLevel, tickerPayAmount2, multiple, profitToken, { from: user.address });
			expect(await reaToken.balanceOf(addresses[0])).to.be.equal(tickerPayAmount.mul(percents[0]).div(10000));
			expect(await reaToken.balanceOf(addresses[1])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[2])).to.be.equal(tickerPayAmount.mul(percents[2]).div(10000));
			expect(await reaToken.balanceOf(addresses[3])).to.be.equal(tickerPayAmount.mul(percents[3]).div(10000));
			let tickerPayAmount3 = BigNumber.from(500);

			let minerTotalSupply1 = await reaToken.totalSupply();
			await tickerContract.connect(user).buyTicker(user.address,tickerIndex+2, minerLevel, tickerPayAmount3, multiple, profitToken, { from: user.address });
			let minerTotalSupply2 = minerTotalSupply1.sub(await reaToken.totalSupply());
			expect(minerTotalSupply2).to.be.equal(tickerPayAmount2.add(tickerPayAmount3).mul(percents[1]).div(10000));

			console.log("reaToken.balanceOf(addresses[0]) is",await reaToken.balanceOf(addresses[0]));
			expect((await reaToken.balanceOf(addresses[0]))).to.be.equal(tickerPayAmount2.add(tickerPayAmount).add(tickerPayAmount3).mul(percents[0]).div(10000));
			expect((await reaToken.balanceOf(addresses[1]))).to.be.equal(0);
			expect((await reaToken.balanceOf(addresses[2]))).to.be.equal(tickerPayAmount2.add(tickerPayAmount).add(tickerPayAmount3).mul(percents[2]).div(10000));
			expect((await reaToken.balanceOf(addresses[3]))).to.be.equal(tickerPayAmount2.add(tickerPayAmount).add(tickerPayAmount3).mul(percents[3]).div(10000));
		});


		it("pledge miner", async () => {
			const { 
				wallet,
				user,
				profitProductAccount,
				usdtToken,
				fil,
				reaToken,
				tickerContract,
				minerContract,
				address1,
				address2,
				address3,
				address4,
				address5,
				address6,
				address11,
				address22,
				address33,
				address44,
				address55,
				address66,
			} = await loadFixture(
				v2Fixture
			);
			let tickerIndex = 1;
			await reaToken.mint(wallet.address, token0Amount);
			let reaTokenDecimal = await reaToken.decimals();
			console.log("reaTokenDecimal", reaTokenDecimal);
			await usdtToken.mint(wallet.address, token1Amount);
			let usdtDecimal = await usdtToken.decimals();
			console.log("usdtDecimal", usdtDecimal);
			let tickerPayAmount = BigNumber.from(10000);
			let minerReaAmount = minerReaUsdtAmount;
			// let payAmount = await oracle.consult(usdt.address,tickerPayAmount);
			console.log("payAmount is:{}", minerReaAmount);
			let profitToken = fil.address;
			await expect(tickerContract.connect(user).buyTicker(user.address,tickerIndex, 1, tickerPayAmount, 3, profitToken, { from: user.address })).to.be.revertedWith("Not manager");
			await reaToken.mint(user.address, tickerPayAmount);
			let balanceOfUser = await reaToken.balanceOf(user.address);
			console.log("balanceOfUser is:", balanceOfUser);
			await reaToken.connect(user).approve(tickerContract.address, tickerPayAmount, { from: user.address });
			await tickerContract.setManager(user.address, true);
			let minerLevel = 1;
			let multiple = 3;
			console.log("buyTickerReaAmount is:",tickerPayAmount);
			let tx = await tickerContract.connect(user).buyTicker(user.address,tickerIndex, minerLevel, tickerPayAmount, multiple, profitToken, { from: user.address });
			let transThreshold = await tickerContract.transThreshold();


			var [addresses,percents] = await tickerContract.getDisributeAddresses();
			
			expect(tickerPayAmount).to.be.below(transThreshold.mul(BigNumber.from(10).pow(await reaToken.decimals())));
			console.log("addresses is:",addresses);
			expect(await reaToken.balanceOf(addresses[0])).to.be.equal(BigNumber.from(0));
			expect(await reaToken.balanceOf(addresses[1])).to.be.equal(BigNumber.from(0));
			expect(await reaToken.balanceOf(addresses[2])).to.be.equal(BigNumber.from(0));
			expect(await reaToken.balanceOf(addresses[3])).to.be.equal(BigNumber.from(0));


			let receipt = await tx.wait();
			console.log("token0Amount is:", token0Amount);
			expect(await reaToken.balanceOf(user.address)).to.be.equal(0);
			let userTicker = await tickerContract.getUserTick(user.address, 1);
			// console.log("userTicker is:",userTicker);
			expect(userTicker.buyer).to.be.equal(user.address);
			expect(userTicker.minerLevel).to.be.equal(minerLevel);

			expect(userTicker.isUsed).to.be.equal(false);
			expect(userTicker.multiple).to.be.equal(multiple);
			expect(userTicker.profitToken).to.be.equal(profitToken);
			// let tickerIndex = await tickerContract.tickerIndex();
			// expect(tickerIndex).to.be.equal(1);

			// check the event
			let tickerBuyEvent = receipt.events?.at(receipt.events?.length - 1);
			// console.log("event is:",tickerBuy);
			expect(tickerBuyEvent?.event).to.be.equal("TickerBuy");
			expect(tickerBuyEvent?.args?.buyer).to.be.equal(user.address);
			expect(tickerBuyEvent?.args?.minerLevel).to.be.equal(minerLevel);
			expect(tickerBuyEvent?.args?.payAmount).to.be.equal(tickerPayAmount);
			expect(tickerBuyEvent?.args?.multiple).to.be.equal(multiple);
			expect(tickerBuyEvent?.args?.index).to.be.equal(tickerIndex);
			expect(tickerBuyEvent?.args?.profitToken).to.be.equal(profitToken);

			// 	address buyer,
			// uint256 tickerIndex,
			// uint256 payAmount,
			// uint256 usdtAmount,
			// uint256 profitAmount
			await expect(minerContract.connect(user)
				.pledgeMiner(user.address, tickerIndex, minerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user.address }))
				.to.be.revertedWith("Not manager");
			
			await minerContract.setManager(user.address, true);
			expect(await minerContract.isManager(user.address)).to.be.equal(true);
			let reaTokenBalanceOfUser = await reaToken.balanceOf(user.address);
			console.log("reaTokenBalanceOfUser is:",reaTokenBalanceOfUser);
			let usdtTokenBalanceOfUser = await usdtToken.balanceOf(user.address);
			console.log("usdtTokenBalanceOfUser is:",usdtTokenBalanceOfUser);

			// minerContract 需要调用tickerContract的的更新票据已经使用的功能，
			// 这个功能是只有管理员才能调用的。所以需要设置tickerContract的管理员为minerContract
			await tickerContract.setManager(minerContract.address,true);
			await expect(minerContract.connect(user)
				.pledgeMiner(user.address, tickerIndex, minerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user.address }))
				.to.be.revertedWith("ERC20: insufficient allowance");
			
			await reaToken.mint(user.address,minerReaAmount);
			await reaToken.connect(user).approve(minerContract.address,minerReaAmount,{from:user.address});
			await usdtToken.mint(user.address,minerUsdtAmount.mul(500));
			await usdtToken.connect(user).approve(minerContract.address,minerUsdtAmount.mul(500),{from:user.address});


			await reaToken.connect(user).approve(tickerContract.address, tickerPayAmount.mul(500), { from: user.address });
			await tickerContract.connect(user).buyTicker(user.address,tickerIndex+1, minerLevel, tickerPayAmount, multiple, profitToken, { from: user.address });
			await tickerContract.connect(user).buyTicker(user.address,tickerIndex+2, minerLevel, tickerPayAmount, multiple, profitToken, { from: user.address });
			await tickerContract.connect(user).buyTicker(user.address,tickerIndex+3, minerLevel, tickerPayAmount, multiple, profitToken, { from: user.address });
			let pledgeTx = await minerContract.connect(user)
				.pledgeMiner(user.address, tickerIndex, tickerPayAmount, minerUsdtAmount, minerProfitAmount, { from: user.address });

			


			var [addresses,percents] = await minerContract.getDepositFeeMap();

			// start cal the pledge fee
			expect(await reaToken.balanceOf(addresses[0])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[1])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[2])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[3])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[4])).to.be.equal(0);

			let minerTransThreshold = await minerContract.transThreshold();
			let minerThresholdAmount = minerTransThreshold.mul(BigNumber.from(10).pow(await reaToken.decimals()));
			let totalSupply3 = await reaToken.totalSupply();
			await minerContract.emergencyPledgeDistribute();
			let totalSupply4 = await reaToken.totalSupply();
			let totalSupplySubMiner = totalSupply3.sub(totalSupply4);
			expect(totalSupplySubMiner).to.be.equal(tickerPayAmount.mul(percents[2]).div(10000));
			expect(tickerPayAmount).to.be.below(minerThresholdAmount);
			expect(await reaToken.balanceOf(addresses[0])).to.be.equal(tickerPayAmount.mul(percents[0]).div(10000));
			expect(await reaToken.balanceOf(addresses[1])).to.be.equal(tickerPayAmount.mul(percents[1]).div(10000));
			expect(await reaToken.balanceOf(addresses[2])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[3])).to.be.equal(tickerPayAmount.mul(percents[3]).div(10000));
			expect(await reaToken.balanceOf(addresses[4])).to.be.equal(tickerPayAmount.mul(percents[4]).div(10000));


			let tickerPayAmount2 = minerThresholdAmount;
			console.log("tickerPayAmount2 is",tickerPayAmount2);
			await reaToken.mint(user.address, tickerPayAmount2.mul(500000));
			await reaToken.connect(user).approve(minerContract.address, tickerPayAmount2.mul(500000), { from: user.address });
			console.log("----------------------------11111");
			await minerContract.connect(user)
				.pledgeMiner(user.address, tickerIndex+1, tickerPayAmount2, minerUsdtAmount, minerProfitAmount, { from: user.address });
				console.log("----------------------------2222");
			expect(await reaToken.balanceOf(addresses[0])).to.be.equal(tickerPayAmount.mul(percents[0]).div(10000));
			expect(await reaToken.balanceOf(addresses[1])).to.be.equal(tickerPayAmount.mul(percents[1]).div(10000));
			expect(await reaToken.balanceOf(addresses[2])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[3])).to.be.equal(tickerPayAmount.mul(percents[3]).div(10000));
			expect(await reaToken.balanceOf(addresses[4])).to.be.equal(tickerPayAmount.mul(percents[4]).div(10000));
			let tickerPayAmount3 = BigNumber.from(1);
			var pledgeTotalSupply4 = await reaToken.totalSupply();
			await minerContract.connect(user)
				.pledgeMiner(user.address, tickerIndex+2, tickerPayAmount3, minerUsdtAmount, minerProfitAmount, { from: user.address });
			pledgeTotalSupply4 = pledgeTotalSupply4.sub(await reaToken.totalSupply());
			expect(pledgeTotalSupply4).to.be.equal(tickerPayAmount2.add(tickerPayAmount3).mul(percents[2]).div(10000));
			console.log("reaToken.balanceOf(addresses[0]) is",await reaToken.balanceOf(addresses[0]));
			expect((await reaToken.balanceOf(addresses[0]))).to.be.equal(tickerPayAmount2.add(tickerPayAmount).add(tickerPayAmount3).mul(percents[0]).div(10000));
			expect((await reaToken.balanceOf(addresses[1]))).to.be.equal(tickerPayAmount2.add(tickerPayAmount).add(tickerPayAmount3).mul(percents[1]).div(10000));
			expect((await reaToken.balanceOf(addresses[2]))).to.be.equal(0);
			expect((await reaToken.balanceOf(addresses[3]))).to.be.equal(tickerPayAmount2.add(tickerPayAmount).add(tickerPayAmount3).mul(percents[3]).div(10000));
			expect((await reaToken.balanceOf(addresses[4]))).to.be.equal(tickerPayAmount2.add(tickerPayAmount).add(tickerPayAmount3).mul(percents[4]).div(10000));









			let pledgeReceipt = await pledgeTx.wait();
			await expect(minerContract.connect(user)
				.pledgeMiner(address1.address, tickerIndex, minerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user.address })).to.be.revertedWith("the user is not the buyer");
			await expect(minerContract.connect(user)
				.pledgeMiner(user.address, tickerIndex, minerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user.address })).to.be.revertedWith("ticker is used");
			let ticker = await tickerContract.getUserTick(user.address,tickerIndex);
			expect(ticker.isUsed).to.be.true;

			


			
			let storeUsdtAddress = await minerContract.storeUsdtAddress();
			let balanceOfUsdtClaim = await usdtToken.balanceOf(storeUsdtAddress);
			expect(balanceOfUsdtClaim).to.be.equal(minerUsdtAmount.mul(3));

			// let minerIndex = await minerContract.minerIndex();
			let expectMinerIndex = 1;
			// expect(minerIndex).to.be.equal(expectMinerIndex);
			let miner = await minerContract.userMinerMap(user.address, expectMinerIndex);
			// console.log("miner is:",miner);
			expect(miner.user).to.be.equal(user.address);
			expect(miner.tickerIndex).to.be.equal(expectMinerIndex);
			expect(miner.level).to.be.equal(minerLevel);
			expect(miner.multiple).to.be.equal(multiple);
			//calculate the profit
			expect(miner.profitAmount).to.be.equal(minerProfitAmount);
			expect(miner.payAmount).to.be.equal(tickerPayAmount);
			expect(miner.usdtAmount).to.be.equal(minerUsdtAmount);
			expect(miner.profitToken).to.be.equal(profitToken);
			expect(miner.claimRewardAmount).to.be.equal(0);
			expect(miner.isExit).to.be.equal(false);


			let pledgeMinerEvent = pledgeReceipt.events?.at(pledgeReceipt.events?.length - 1);
			// console.log("pledgeMinerEvent is:",pledgeMinerEvent);
			expect(pledgeMinerEvent?.event).to.be.equal("PledgeMiner");


			expect(pledgeMinerEvent?.args?.user).to.be.equal(user.address);
			expect(pledgeMinerEvent?.args?.tickerIndex).to.be.equal(expectMinerIndex);
			expect(pledgeMinerEvent?.args?.level).to.be.equal(minerLevel);
			expect(pledgeMinerEvent?.args?.multiple).to.be.equal(multiple);
			expect(pledgeMinerEvent?.args?.profitAmount).to.be.equal(minerProfitAmount);
			expect(pledgeMinerEvent?.args?.payAmount).to.be.equal(tickerPayAmount);
			expect(pledgeMinerEvent?.args?.usdtAmount).to.be.equal(minerUsdtAmount);
			expect(pledgeMinerEvent?.args?.profitToken).to.be.equal(profitToken);
			// start claimProfit
			await expect(minerContract.connect(user)
				.claimProfit(address1.address,tickerIndex,claimAmount,drawFeeOfUsdt, { from: user.address }))
				.to.be.revertedWith("the user is not the buyer");

			// await expect(minerContract.connect(user)
			// 	.claimProfit(user.address,tickerIndex,expandTo18Decimals(11),drawFeeOfUsdt, { from: user.address }))
			// 	.to.be.revertedWith("claim amount too high");

			await expect(minerContract.connect(address1)
				.claimProfit(address1.address,tickerIndex,claimAmount,drawFeeOfUsdt, { from: address1.address }))
				.to.be.revertedWith("Not manager");
			console.log("claimAmount is:",claimAmount);

			// await expect(minerContract.connect(user)
			// 	.claimProfit(user.address,tickerIndex,claimAmount,drawFeeOfUsdt, { from: user.address }))
			// 	.to.be.revertedWith("ERC20: insufficient allowance");
			// let reaBalanceOfUser = await reaToken.balanceOf(user.address);
			// console.log("reaBalanceOfUser is:",reaBalanceOfUser);



			// console.log("drawFeeOfUsdt is:",drawFeeOfUsdt);
			// await reaToken.mint(user.address,drawFeeOfUsdt);
			// await expect(minerContract.connect(user)
			// 	.claimProfit(user.address,tickerIndex,claimAmount,drawFeeOfUsdt, { from: user.address }))
			// 	.to.be.revertedWith("ERC20: insufficient allowance");

			// console.log("drawFee is:",drawFeeOfUsdt);
			// await reaToken.connect(user).approve(minerContract.address,drawFeeOfUsdt,{from: user.address});
			// await expect(minerContract.connect(user)
			// 	.claimProfit(user.address,tickerIndex,claimAmount,drawFeeOfUsdt, { from: user.address }))
			// 	.to.be.revertedWith("ERC20: insufficient allowance");
			
			
			await fil.mint(profitProductAccount.address,claimAmount.mul(1000));
			await fil.connect(profitProductAccount).approve(minerContract.address,claimAmount.mul(1000),{from:profitProductAccount.address});
			let claimTx = await minerContract.connect(user).claimProfit(user.address,tickerIndex,claimAmount,drawFeeOfUsdt,{from: user.address});
			

			miner = await minerContract.userMinerMap(user.address, expectMinerIndex);
			// console.log("miner is:",miner);
			expect(miner.claimRewardAmount).to.be.equal(claimAmount);

			// expect(await reaToken.balanceOf(user.address)).to.be.equal(0);
			// expect(await reaToken.balanceOf(claimAccountAddress)).to.be.equal(balanceOfClaimAccountAddress.add(drawFeeOfUsdt));






			// [address44.address,address55.address,address66.address],
			// [5000,3000,2000],
			var [addresses,percents] = await minerContract.getClaimFeeMap();

			

			// start cal the pledge fee
			expect(await reaToken.balanceOf(addresses[0])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[1])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[2])).to.be.equal(0);

			// let minerTransThreshold = await minerContract.transThreshold();
			// let minerThresholdAmount = minerTransThreshold.mul(BigNumber.from(10).pow(await reaToken.decimals()));
			var totalSupply = await reaToken.totalSupply();
			await minerContract.emergencyClaimFeeDistribute();
			totalSupply = totalSupply.sub(await reaToken.totalSupply());
			expect(totalSupply).to.be.equal(drawFeeOfUsdt.mul(percents[0]).div(10000));
			expect(drawFeeOfUsdt).to.be.below(minerThresholdAmount);
			expect(await reaToken.balanceOf(addresses[0])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[1])).to.be.equal(drawFeeOfUsdt.mul(percents[1]).div(10000));
			expect(await reaToken.balanceOf(addresses[2])).to.be.equal(drawFeeOfUsdt.mul(percents[2]).div(10000));


			tickerPayAmount2 = minerThresholdAmount;
			await minerContract.connect(user).claimProfit(user.address,tickerIndex,claimAmount,tickerPayAmount2,{from: user.address});


			expect(await reaToken.balanceOf(addresses[0])).to.be.equal(0);
			expect(await reaToken.balanceOf(addresses[1])).to.be.equal(drawFeeOfUsdt.mul(percents[1]).div(10000));
			expect(await reaToken.balanceOf(addresses[2])).to.be.equal(drawFeeOfUsdt.mul(percents[2]).div(10000));
			tickerPayAmount3 = BigNumber.from(1);
			var totalSupply = await reaToken.totalSupply();
			await minerContract.connect(user).claimProfit(user.address,tickerIndex,claimAmount,tickerPayAmount3,{from: user.address});
			totalSupply = totalSupply.sub(await reaToken.totalSupply());
			expect(totalSupply).to.be.equal(tickerPayAmount2.add(tickerPayAmount3).mul(percents[0]).div(10000));
			console.log("reaToken.balanceOf(addresses[0]) is",await reaToken.balanceOf(addresses[0]));
			expect((await reaToken.balanceOf(addresses[0]))).to.be.equal(0);
			expect((await reaToken.balanceOf(addresses[1]))).to.be.equal(tickerPayAmount2.add(drawFeeOfUsdt).add(tickerPayAmount3).mul(percents[1]).div(10000));
			expect((await reaToken.balanceOf(addresses[2]))).to.be.equal(tickerPayAmount2.add(drawFeeOfUsdt).add(tickerPayAmount3).mul(percents[2]).div(10000));








			


			expect(miner.isExit).to.be.false;
			expect(await fil.balanceOf(user.address)).to.be.equal(claimAmount.mul(3));
			// expect(await fil.balanceOf(profitProductAccount.address)).to.be.equal(0);

			let claimReceipt = await claimTx.wait();

			let claimEvent = claimReceipt.events?.at(claimReceipt.events?.length - 1);
			// console.log("claimEvent is:",claimEvent);
			expect(claimEvent?.event).to.be.equal("ClaimProfit");


			expect(claimEvent?.args?.user).to.be.equal(user.address);
			expect(claimEvent?.args?.minerIndex).to.be.equal(expectMinerIndex);
			expect(claimEvent?.args?.level).to.be.equal(minerLevel);
			expect(claimEvent?.args?.multiple).to.be.equal(multiple);
			expect(claimEvent?.args?.claimAmount).to.be.equal(claimAmount);
			expect(claimEvent?.args?.feeAmount).to.be.equal(drawFeeOfUsdt);
			expect(claimEvent?.args?.profitToken).to.be.equal(profitToken);

			// TODO test  miner.isExit = true;
			let leftMinerProfitAmount = minerProfitAmount.sub(claimAmount);
			console.log("minerProfitAmount.sub(claimAmount) is:",minerProfitAmount.sub(claimAmount));
			await fil.mint(profitProductAccount.address,leftMinerProfitAmount);
			await fil.connect(profitProductAccount).approve(minerContract.address,leftMinerProfitAmount,{from:profitProductAccount.address});
			await reaToken.mint(user.address,drawFeeOfUsdt);
			await reaToken.connect(user).approve(minerContract.address,drawFeeOfUsdt,{from: user.address});

			claimTx = await minerContract.connect(user).claimProfit(user.address,tickerIndex,leftMinerProfitAmount,drawFeeOfUsdt,{from: user.address});

			miner = await minerContract.userMinerMap(user.address, expectMinerIndex);
			console.log("miner is:",miner);
			expect(miner.isExit).to.be.true;
		});
	});

});
