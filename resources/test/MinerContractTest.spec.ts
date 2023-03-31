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
		address1,address2,address3,address4,address5,address6, 
		address111,address444,address555,address666, 
		address11,address22,address33,address44,address55,address66, 
		storeUsdtAccount,profitProductAccount]: Wallet[], provider: MockProvider) {
		const ReaToken = await ethers.getContractFactory("ReaToken");
		const reaToken = await ReaToken.deploy();
		await reaToken.initialize("REA token", "REA");

		console.log("init read token!");

		const SmartERC20 = await ethers.getContractFactory("SmartERC20");
		const usdtToken = await SmartERC20.deploy();
		await usdtToken.initialize("usdt token", "USDT");

		// const reaToken = await SmartERC20.deploy();
		// await reaToken.initialize("REA token","REA");

		const fil = await SmartERC20.deploy();
		await fil.initialize("fil token", "fil");

		// deploy V2
		const v2factory = await ethers.getContractFactory("SunswapV2Factory");
		const factoryV2 = await v2factory.deploy(wallet.address);

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
		
		await tickerContract.initialize(reaToken.address,address111.address,
			[address111.address,address444.address,address555.address,address666.address],
			[5000,2500,1500,1000]);

		const MinerContract = await ethers.getContractFactory("MinerContract");
		const minerContract = await MinerContract.deploy();



		// address _reaToken,address _usdtToken,address[] memory claimFeeAddresses,uint256[] memory calimFeePercent,
        // address[] memory depositFeeAddresses,uint256[] memory depositFeePercent,address _tickerContractAddress,
        // address _storeUsdtAddress,address _profitProductAccount,bool _isSendProfit
		await minerContract.initialize(reaToken.address, usdtToken.address, 
			[address2.address,address3.address,address4.address,address5.address,address6.address],
			[3000,6000,500,300,200], 
			[address44.address,address55.address,address66.address],
			[5000,3000,2000],
			tickerContract.address,
			storeUsdtAccount.address,profitProductAccount.address,true);

		return {
			factoryV2,
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
		const drawFeeOfUsdt = expandTo18Decimals(3)
		const base = 10000;
		// const swapAmount = expandTo18Decimals(1);
		// const expectedOutputAmount = BigNumber.from("1662497915624478906");


		it("pledge miner", async () => {
			const { factoryV2,
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
			let pledgeMinerReaAmount = BigNumber.from(10000);
			let minerReaAmount = minerReaUsdtAmount;
			// let payAmount = await oracle.consult(usdt.address,tickerPayAmount);
			console.log("payAmount is:{}", minerReaAmount);
			let profitToken = fil.address;
			await expect(tickerContract.connect(user).buyTicker(user.address,tickerIndex, 1, pledgeMinerReaAmount, 3, profitToken, { from: user.address })).to.be.revertedWith("Not manager");
			await reaToken.mint(user.address, pledgeMinerReaAmount);
			let balanceOfUser = await reaToken.balanceOf(user.address);
			console.log("balanceOfUser is:", balanceOfUser);
			await reaToken.connect(user).approve(tickerContract.address, pledgeMinerReaAmount, { from: user.address });
			await tickerContract.setManager(user.address, true);
			let minerLevel = 1;
			let multiple = 3;
			console.log("buyTickerReaAmount is:",pledgeMinerReaAmount);
			let tx = await tickerContract.connect(user).buyTicker(user.address,tickerIndex, minerLevel, pledgeMinerReaAmount, multiple, profitToken, { from: user.address });
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
			expect(tickerBuyEvent?.args?.payAmount).to.be.equal(pledgeMinerReaAmount);
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
			await usdtToken.mint(user.address,minerUsdtAmount);
			await usdtToken.connect(user).approve(minerContract.address,minerUsdtAmount,{from:user.address});




			let pledgeTx = await minerContract.connect(user)
				.pledgeMiner(user.address, tickerIndex, pledgeMinerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user.address });

			// 3000,6000,1000,600,400
			let address2Amount = await reaToken.balanceOf(address2.address);
			console.log("address2Amount,buyTickerReaAmount is:",address2Amount,pledgeMinerReaAmount);
			expect(address2Amount).to.be.equal(pledgeMinerReaAmount.mul(3000).div(base));
			let address3Amount = await reaToken.balanceOf(address3.address);
			expect(address3Amount).to.be.equal(pledgeMinerReaAmount.mul(6000).div(base));
			let address4Amount = await reaToken.balanceOf(address4.address);
			expect(address4Amount).to.be.equal(pledgeMinerReaAmount.mul(500).div(base));
			let address5Amount = await reaToken.balanceOf(address5.address);
			expect(address5Amount).to.be.equal(pledgeMinerReaAmount.mul(300).div(base));
			let address6Amount = await reaToken.balanceOf(address6.address);
			expect(address6Amount).to.be.equal(pledgeMinerReaAmount.mul(200).div(base));

			let pledgeReceipt = await pledgeTx.wait();
			await expect(minerContract.connect(user)
				.pledgeMiner(address1.address, tickerIndex, minerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user.address })).to.be.revertedWith("the user is not the buyer");
			await expect(minerContract.connect(user)
				.pledgeMiner(user.address, tickerIndex, minerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user.address })).to.be.revertedWith("ticker is used");
			let ticker = await tickerContract.getUserTick(user.address,tickerIndex);
			expect(ticker.isUsed).to.be.true;

			


			
			let storeUsdtAddress = await minerContract.storeUsdtAddress();
			let balanceOfUsdtClaim = await usdtToken.balanceOf(storeUsdtAddress);
			expect(balanceOfUsdtClaim).to.be.equal(minerUsdtAmount);

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
			expect(miner.payAmount).to.be.equal(pledgeMinerReaAmount);
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
			expect(pledgeMinerEvent?.args?.payAmount).to.be.equal(pledgeMinerReaAmount);
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
			
			
			await fil.mint(profitProductAccount.address,claimAmount);
			await fil.connect(profitProductAccount).approve(minerContract.address,claimAmount,{from:profitProductAccount.address});
			let claimTx = await minerContract.connect(user).claimProfit(user.address,tickerIndex,claimAmount,drawFeeOfUsdt,{from: user.address});
			

			miner = await minerContract.userMinerMap(user.address, expectMinerIndex);
			// console.log("miner is:",miner);
			expect(miner.claimRewardAmount).to.be.equal(claimAmount);

			// expect(await reaToken.balanceOf(user.address)).to.be.equal(0);
			// expect(await reaToken.balanceOf(claimAccountAddress)).to.be.equal(balanceOfClaimAccountAddress.add(drawFeeOfUsdt));


			let address44Amount = await reaToken.balanceOf(address44.address);
			expect(address44Amount).to.be.equal(drawFeeOfUsdt.mul(5000).div(base));
			let address55Amount = await reaToken.balanceOf(address55.address);
			expect(address55Amount).to.be.equal(drawFeeOfUsdt.mul(3000).div(base));
			let address66Amount = await reaToken.balanceOf(address66.address);
			expect(address66Amount).to.be.equal(drawFeeOfUsdt.mul(2000).div(base));

			


			expect(miner.isExit).to.be.false;
			expect(await fil.balanceOf(user.address)).to.be.equal(claimAmount);
			expect(await fil.balanceOf(profitProductAccount.address)).to.be.equal(0);

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
