use std::time;
use web3::{
    contract::{Contract, Options},
    transports::Http, Web3, types::{Address, H160}, ethabi::Uint,
};

pub async fn deploy_rea_token(web3:&Web3<Http>,byte_code:&str,token_abi:&[u8],token_name:&str,token_symbol:&str) -> web3::contract::Result<Address> {
    let accounts = web3.eth().accounts().await?;
    //deploy erc20
    let token_contract = Contract::deploy(web3.eth(), token_abi)?
        .confirmations(1)
        .poll_interval(time::Duration::from_secs(10))
        .options(Options::with(|opt| opt.gas = Some(3_000_000.into())))
        .execute(byte_code, (), accounts[0])
        .await?;

    println!("Deployed at: {:?}", token_contract.address());
    // std::thread::sleep(std::time::Duration::from_secs(20));

    let rea_init_result = token_contract
        .call(
            "initialize",
            (token_name.to_owned(), token_symbol.to_owned()),
            accounts[0],
            Options::with(|opt| {
                // opt.value = Some(5.into());
                opt.gas_price = Some(8.into());
                opt.gas = Some(3_000_000.into());
            }),
        )
        .await;
    let tx = match rea_init_result {
        Ok(h) => h,
        Err(err) => {
            panic!("call error:{:?}", err);
        }
    };
    println!("TxHash: {}", tx);
    std::thread::sleep(std::time::Duration::from_secs(3));
    let result = token_contract.query("name", (), None, Options::default(), None);
    let name: String = result.await?;
    println!("Get name is: {:?}", name);
    Ok(token_contract.address())
}


pub async fn deploy_ticker_contract(web3:&Web3<Http>,byte_code:&str,contract_abi:&[u8],pay_token_address:H160,ticker_reward_account:H160,claim_account_address:H160) -> web3::contract::Result<Address> {
    let accounts = web3.eth().accounts().await?;
    //deploy erc20
    let contract = Contract::deploy(web3.eth(), contract_abi)?
        .confirmations(1)
        .poll_interval(time::Duration::from_secs(10))
        .options(Options::with(|opt| opt.gas = Some(3_000_000.into())))
        .execute(byte_code, (), accounts[0])
        .await?;

    println!("Deployed at: {:?}", contract.address());
    // std::thread::sleep(std::time::Duration::from_secs(20));
    
    let rea_init_result = contract
        .call(
            "initialize",
            (pay_token_address,ticker_reward_account,claim_account_address,),
            accounts[0],
            Options::with(|opt| {
                // opt.value = Some(5.into());
                opt.gas_price = Some(8.into());
                opt.gas = Some(3_000_000.into());
            }),
        )
        .await;
    let tx = match rea_init_result {
        Ok(h) => h,
        Err(err) => {
            panic!("call error:{:?}", err);
        }
    };
    println!("TxHash: {}", tx);
    std::thread::sleep(std::time::Duration::from_secs(3));
    let result = contract.query("rewardMul", (), None, Options::default(), None);
    let reward_mul: Uint = result.await?;
    println!("Get rewardMul is: {:?}", reward_mul);
    Ok(contract.address())
}