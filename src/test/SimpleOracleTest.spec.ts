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
} from "./shared/utilities";
import exp from "constants";
const baseRatio = 10000;

describe("Oracle initialize and test", () => {
	const loadFixture = waffle.createFixtureLoader(
		waffle.provider.getWallets(),
		waffle.provider
	);

	async function v2Fixture([wallet, user]: Wallet[], provider: MockProvider) {
		const ReaToken = await ethers.getContractFactory("ReaToken");
		const reaToken = await ReaToken.deploy();
		await reaToken.initialize("REA token","REA");
		
		console.log("init read token!");

		const SmartERC20 = await ethers.getContractFactory("SmartERC20");
		const usdt = await SmartERC20.deploy();
		await usdt.initialize("usdt token", "USDT");

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
		
		return {
			factoryV2,
			wallet,
			user,
			usdt,
			oracle,
			sunswapV2Router02,
			reaToken
		};
	}

	describe("Orcale test", () => {
		const token0Amount = expandTo18Decimals(5);
		const token1Amount = expandTo18Decimals(10);
		// const swapAmount = expandTo18Decimals(1);
		// const expectedOutputAmount = BigNumber.from("1662497915624478906");
		

		it("get token price", async () => {
			const { factoryV2,
				wallet,
				user,
				usdt,
				oracle,sunswapV2Router02,
				reaToken
			
			} = await loadFixture(
				v2Fixture
			);

			await reaToken.mint(wallet.address,token0Amount);
			await usdt.mint(wallet.address,token1Amount);
			await reaToken.approve(sunswapV2Router02.address,token0Amount);
			await usdt.approve(sunswapV2Router02.address,token1Amount);
			await sunswapV2Router02.addLiquidity(reaToken.address,usdt.address,token0Amount,token1Amount,0,0,wallet.address,9673481508);
			let tokenPrice = await oracle.getTokenPrice();
			console.log("tokenPrice is:{}",tokenPrice);
			
		});

	});

});
