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
import { assert } from "console";
const baseRatio = 100;

describe("Miner contract init and test", () => {
	const loadFixture = waffle.createFixtureLoader(
		waffle.provider.getWallets(),
		waffle.provider
	);

	async function v2Fixture([wallet, user, tickerRewardAccount, claimAccount, ecologyAccount, teamRewardAccount,storeUsdtAccount]: Wallet[], provider: MockProvider) {
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

		const SunswapV2Router02 = await ethers.getContractFactory("SunswapV2Router02");
		const sunswapV2Router02 = await SunswapV2Router02.deploy(factoryV2.address, reaToken.address);



		const oracleFactory = await ethers.getContractFactory("ExampleOracleSimple");
		const oracle = await oracleFactory.deploy();
		// initialize V2
		await factoryV2.createPair(reaToken.address, usdtToken.address);
		const reaUsdtPairAddress = await factoryV2.getPair(reaToken.address, usdtToken.address);
		const token0Amount = expandTo18Decimals(5);
		await oracle.initialize(factoryV2.address, reaToken.address, usdtToken.address, reaUsdtPairAddress, token0Amount);
		const codeHashOfPair = await factoryV2.PAIR_HASH();
		console.log("codeHashOfPair is:", codeHashOfPair);

		const TickContract = await ethers.getContractFactory("TickerContract");
		const tickerContract = await TickContract.deploy();
		await tickerContract.initialize(reaToken.address, tickerRewardAccount.address, claimAccount.address);

		const MinerContract = await ethers.getContractFactory("MinerContract");
		const minerContract = await MinerContract.deploy();


		await minerContract.initialize(reaToken.address, usdtToken.address, blackHoleAddress, 10, ecologyAccount.address, 30, teamRewardAccount.address, 60, claimAccount.address,tickerContract.address,storeUsdtAccount.address);

		return {
			factoryV2,
			wallet,
			user,
			claimAccount,
			ecologyAccount,
			teamRewardAccount,
			usdtToken,
			fil,
			oracle,
			sunswapV2Router02,
			reaToken,
			tickerContract,
			minerContract
		};
	}

	describe.only("miner test", () => {
		const token0Amount = expandTo18Decimals(5);
		const token1Amount = expandTo18Decimals(10);
		const minerProfitAmount = expandTo18Decimals(10);
		const buyTickerUsdtAmount = expandTo18Decimals(10);
		const minerReaUsdtAmount = expandTo18Decimals(80);
		const minerUsdtAmount = expandTo18Decimals(120);
		// const swapAmount = expandTo18Decimals(1);
		// const expectedOutputAmount = BigNumber.from("1662497915624478906");


		it("pledge miner", async () => {
			const { factoryV2,
				wallet,
				user,
				claimAccount,
				ecologyAccount,
				teamRewardAccount,
				usdtToken,
				fil,
				oracle,
				sunswapV2Router02,
				reaToken,
				tickerContract,
				minerContract

			} = await loadFixture(
				v2Fixture
			);

			await reaToken.mint(wallet.address, token0Amount);
			let reaTokenDecimal = await reaToken.decimals();
			console.log("reaTokenDecimal", reaTokenDecimal);
			await usdtToken.mint(wallet.address, token1Amount);
			let usdtDecimal = await usdtToken.decimals();
			console.log("usdtDecimal", usdtDecimal);
			await reaToken.approve(sunswapV2Router02.address, token0Amount);
			await usdtToken.approve(sunswapV2Router02.address, token1Amount);
			await sunswapV2Router02.addLiquidity(reaToken.address, usdtToken.address, token0Amount, token1Amount, 0, 0, wallet.address, 9673481508);
			let tokenPrice = await oracle.getTokenPrice();
			let humanTokenPrice = tokenPrice.div(BigNumber.from(2).pow(112));
			console.log("humanTokenPrice is:{}", humanTokenPrice);
			await oracle.update();
			let buyTickerReaAmount = buyTickerUsdtAmount.div(humanTokenPrice);
			let minerReaAmount = minerReaUsdtAmount.div(humanTokenPrice);
			// let payAmount = await oracle.consult(usdt.address,tickerPayAmount);
			console.log("payAmount is:{}", minerReaAmount);
			let profitToken = fil.address;
			await expect(tickerContract.connect(user).buyTicker(user.address, 1, buyTickerReaAmount, 3, profitToken, { from: user.address })).to.be.revertedWith("Not manager");
			await reaToken.mint(user.address, buyTickerReaAmount);
			let balanceOfUser = await reaToken.balanceOf(user.address);
			console.log("balanceOfUser is:", balanceOfUser);
			await reaToken.connect(user).approve(tickerContract.address, buyTickerReaAmount, { from: user.address });
			await tickerContract.setManager(user.address, true);
			let minerLevel = 1;
			let multiple = 3;
			let tx = await tickerContract.connect(user).buyTicker(user.address, minerLevel, buyTickerReaAmount, multiple, profitToken, { from: user.address });
			let receipt = await tx.wait();
			console.log("token0Amount is:", token0Amount);
			console.log("buyTickerReaAmount is:", buyTickerReaAmount);
			expect(await reaToken.balanceOf(user.address)).to.be.equal(token0Amount.sub(buyTickerReaAmount));
			let userTicker = await tickerContract.getUserTick(user.address, 1);
			// console.log("userTicker is:",userTicker);
			expect(userTicker.buyer).to.be.equal(user.address);
			expect(userTicker.minerLevel).to.be.equal(minerLevel);
			let claimAccountAddress = await tickerContract.claimAccountAddress();
			let balanceOfClaimAccountAddress = await reaToken.balanceOf(claimAccountAddress);
			console.log("balanceOfClaimAccountAddress is:", balanceOfClaimAccountAddress);
			expect(balanceOfClaimAccountAddress).to.be.equal(buyTickerReaAmount);
			expect(userTicker.isUsed).to.be.equal(false);
			expect(userTicker.multiple).to.be.equal(multiple);
			expect(userTicker.profitToken).to.be.equal(profitToken);
			let tickerIndex = await tickerContract.tickerIndex();
			expect(tickerIndex).to.be.equal(1);

			// check the event
			let tickerBuyEvent = receipt.events?.at(receipt.events?.length - 1);
			// console.log("event is:",tickerBuy);
			expect(tickerBuyEvent?.event).to.be.equal("TickerBuy");
			expect(tickerBuyEvent?.args?.buyer).to.be.equal(user.address);
			expect(tickerBuyEvent?.args?.minerLevel).to.be.equal(minerLevel);
			expect(tickerBuyEvent?.args?.payAmount).to.be.equal(buyTickerReaAmount);
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
				.pledgeMiner(user.address, tickerIndex, minerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user.address });
			let pledgeReceipt = await pledgeTx.wait();
			await expect(minerContract.connect(user)
				.pledgeMiner(claimAccount.address, tickerIndex, minerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user.address })).to.be.revertedWith("the user is not the buyer");
			await expect(minerContract.connect(user)
				.pledgeMiner(user.address, tickerIndex, minerReaAmount, minerUsdtAmount, minerProfitAmount, { from: user.address })).to.be.revertedWith("ticker is used");
			let ticker = await tickerContract.getUserTick(user.address,tickerIndex);
			expect(ticker.isUsed).to.be.true;
			let blackHoleAddress = await minerContract.blackholeAddress();
			let blackHolePercent = await minerContract.blackHolePercent();
			console.log("blackHoleAddress, blackHolePercent",blackHoleAddress, blackHolePercent);
			let balanceOfBlackHole = await reaToken.balanceOf(blackHoleAddress);
			expect(balanceOfBlackHole).to.be.equal(minerReaAmount.mul(blackHolePercent).div(baseRatio));
			
			let ecologyAddress = await minerContract.ecologyAddress();
			let ecologyPercent = await minerContract.ecologyPercent();
			console.log("ecologyAddress, ecologyPercent",ecologyAddress, ecologyPercent);
			let balanceOfEcologyAddress = await reaToken.balanceOf(ecologyAddress);
			expect(balanceOfEcologyAddress).to.be.equal(minerReaAmount.mul(ecologyPercent).div(baseRatio));

			let teamRewardAddress = await minerContract.teamRewardAddress();
			let teamRewardPercent = await minerContract.teamRewardPercent();
			console.log("teamRewardAddress, teamRewardPercent",teamRewardAddress, teamRewardPercent);
			let balanceOfTeamRewardAddress = await reaToken.balanceOf(teamRewardAddress);
			expect(balanceOfTeamRewardAddress).to.be.equal(minerReaAmount.mul(teamRewardPercent).div(baseRatio));
			
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
			expect(miner.payAmount).to.be.equal(minerReaAmount);
			expect(miner.usdtAmount).to.be.equal(minerUsdtAmount);
			expect(miner.profitToken).to.be.equal(profitToken);
			expect(miner.claimRewardAmount).to.be.equal(0);
			expect(miner.isExit).to.be.equal(false);


			let pledgeMinerEvent = pledgeReceipt.events?.at(pledgeReceipt.events?.length - 1);
			console.log("pledgeMinerEvent is:",pledgeMinerEvent);
			expect(pledgeMinerEvent?.event).to.be.equal("PledgeMiner");


			expect(pledgeMinerEvent?.args?.user).to.be.equal(user.address);
			expect(pledgeMinerEvent?.args?.tickerIndex).to.be.equal(expectMinerIndex);
			expect(pledgeMinerEvent?.args?.level).to.be.equal(minerLevel);
			expect(pledgeMinerEvent?.args?.multiple).to.be.equal(multiple);
			expect(pledgeMinerEvent?.args?.profitAmount).to.be.equal(minerProfitAmount);
			expect(pledgeMinerEvent?.args?.payAmount).to.be.equal(minerReaAmount);
			expect(pledgeMinerEvent?.args?.usdtAmount).to.be.equal(minerUsdtAmount);
			expect(pledgeMinerEvent?.args?.profitToken).to.be.equal(profitToken);
		});


	});

});
