use std::time;
use rea_lottery_web3::deploy_token;
use web3::{
    contract::{Contract, Options},
    types::U256,
};

// #[tokio::main]
// async fn main() -> web3::Result<()> {
//     let transport = web3::transports::Http::new("http://localhost:8545")?;
//     let web3 = web3::Web3::new(transport);

//     println!("Calling accounts.");
//     let mut accounts = web3.eth().accounts().await?;
//     println!("Accounts: {:?}", accounts);
//     accounts.push("00a329c0648769a73afac7f9381e08fb43dbea72".parse().unwrap());

//     println!("Calling balance.");
//     for account in accounts {
//         let balance = web3.eth().balance(account, None).await?;
//         println!("Balance of {:?}: {}", account, balance);
//     }
//     Ok(())
// }

#[tokio::main]
async fn main() -> web3::contract::Result<()> {
    let _ = env_logger::try_init();
    let transport = web3::transports::Http::new("http://localhost:8545")?;
    let web3 = web3::Web3::new(transport);
    let accounts = web3.eth().accounts().await?;

    // Get current balance
    let balance = web3.eth().balance(accounts[0], None).await?;

    println!("Balance: {}", balance);

    //deploy REA token
    let rea_bytecode = include_str!("../res/sunswap/ReaToken.bin");
    let rea_contract_abi:&[u8] = include_bytes!("../res/sunswap/ReaToken.abi");
    let rea_token_address = crate::deploy_token::deploy_rea_token(&web3,rea_bytecode,rea_contract_abi,"REA token","REA").await?;

    //deploy usdt & fil token
    let usdt_bytecode = include_str!("../res/test/SmartERC20.bin");
    let usdt_contract_abi:&[u8] = include_bytes!("../res/test/SmartERC20.abi");
    let _ = crate::deploy_token::deploy_rea_token(&web3,usdt_bytecode,usdt_contract_abi,"usdt token", "USDT").await?;

    let fil_bytecode = include_str!("../res/test/SmartERC20.bin");
    let fil_contract_abi:&[u8] = include_bytes!("../res/test/SmartERC20.abi");
    let _ = crate::deploy_token::deploy_rea_token(&web3,fil_bytecode,fil_contract_abi,"fil token", "fil").await?;

    let ticker_reward_account = accounts[1];
    let claim_account = accounts[2];

    let ticker_bytecode = include_str!("../res/TickerContract.bin");
    let ticker_contract_abi:&[u8] = include_bytes!("../res/TickerContract.abi");
    let _ = crate::deploy_token::deploy_ticker_contract(&web3,ticker_bytecode,ticker_contract_abi,rea_token_address,ticker_reward_account,claim_account).await?;
    

    // // Get the contract bytecode for instance from Solidity compiler
    // let bytecode = include_str!("../res/TickerContract.bin");
    // // Deploying a contract
    // let contract = Contract::deploy(web3.eth(), include_bytes!("../res/TickerContract.abi"))?
    //     .confirmations(1)
    //     .poll_interval(time::Duration::from_secs(10))
    //     .options(Options::with(|opt| opt.gas = Some(3_000_000.into())))
    //     .execute(bytecode, (), accounts[0])
    //     .await?;

    // println!("Deployed at: {}", contract.address());

    // // interact with the contract
    // let result = contract.query("get", (), None, Options::default(), None);
    // let storage: U256 = result.await?;
    // println!("Get Storage: {}", storage);

    // // Change state of the contract
    // let tx = contract.call("set", (42_u32,), accounts[0], Options::default()).await?;
    // println!("TxHash: {}", tx);

    // // consider using `async_std::task::sleep` instead.
    // std::thread::sleep(std::time::Duration::from_secs(5));

    // // View changes made
    // let result = contract.query("get", (), None, Options::default(), None);
    // let storage: U256 = result.await?;
    // println!("Get again: {}", storage);

    Ok(())
}
