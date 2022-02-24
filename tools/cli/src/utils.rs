use anchor_client::solana_sdk::signature::{Keypair, Signer};
use anchor_lang::prelude::Pubkey;
use jet_rewards::instructions::{AirdropCreateParams, AirdropRecipientParam};
use jet_rewards::state::Airdrop;
use serde::{Deserialize, Serialize};
use serde_json::Result;
use std::fs::File;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::{rc::Rc, str::FromStr};

pub fn load_default_keypair() -> anyhow::Result<Keypair> {
    let keypair_path = shellexpand::tilde("~/.config/solana/id.json");
    let keypair_data = std::fs::read_to_string(keypair_path.to_string())?;
    let keypair_bytes: Vec<u8> = serde_json::from_str(&keypair_data)?;
    let keypair = Keypair::from_bytes(&keypair_bytes)?;

    Ok(keypair)
}

pub fn load_default_client() -> anyhow::Result<anchor_client::Program> {
    let keypair = load_default_keypair()?;
    // let rpc = "https://api.mainnet-beta.solana.com".to_owned();
    let rpc = "https://api.devnet.solana.com".to_owned();
    // let rpc = "http://127.0.0.1:8899".to_owned();
    let wss = rpc.replace("https", "wss");
    let connection =
        anchor_client::Client::new(anchor_client::Cluster::Custom(rpc, wss), Rc::new(keypair));
    let client = connection.program(jet_rewards::ID);

    Ok(client)
}

pub fn generate_keypair() -> anyhow::Result<Keypair> {
    let keypair = Keypair::new();
    let keypair_bytes = keypair.to_bytes().to_vec();
    let keypair_data = serde_json::to_string(&keypair_bytes)?;
    let file_name = format!("airdrop-{}.json", &keypair.pubkey()).to_string();

    std::fs::write(file_name, keypair_data).expect("Unable to write file");

    Ok(keypair)
}

pub fn run_read_airdrop(client: &anchor_client::Program, address: Pubkey) -> anyhow::Result<()> {
    let airdrop = client.account::<Airdrop>(address)?;

    println!("read airdrop");
    println!("{:#?}", airdrop);

    Ok(())
}

pub fn get_unix_time_90_days() -> i64 {
    let unix_time_90_days = std::time::SystemTime::now()
        .duration_since(std::time::SystemTime::UNIX_EPOCH)
        .expect("Time")
        .as_secs()
        + 90 * 24 * 60 * 60;

    unix_time_90_days as i64
}

pub fn run_print_to_file() -> anyhow::Result<()> {
    let mut file = File::create("data.txt").expect("create failed");
    file.write_all("Hello World\n".as_bytes())
        .expect("write failed");
    file.write_all("print here =]\n".as_bytes())
        .expect("write failed");

    println!("print to file");
    Ok(())
}

pub fn read_file_path(file_path: PathBuf) -> anyhow::Result<String> {
    let mut file = File::open(file_path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    Ok(contents)
}

// structs for json_to_recipient_list_structured_data()
#[derive(Debug, Serialize, Deserialize)]
struct JsonData {
    info: InfoData,
    rewards: Vec<AirdropTargetData>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AirdropTargetData {
    // base58 encoded wallet address
    wallet: String,
    amount: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct InfoData {
    recipients: u64,
    amount: u64,
    units: String,
    decimals: u8,
}

// parse files for airdrop_add_recipient ix
pub fn json_to_recipient_list_structured_data(
    contents: String,
) -> Result<Vec<AirdropRecipientParam>> {
    let data = contents;
    let json_data: JsonData = serde_json::from_str(&data)?;
    let token_decimals = json_data.info.decimals;
    let mut result = Vec::<AirdropRecipientParam>::new();

    for target in json_data.rewards.iter() {
        result.push(AirdropRecipientParam {
            amount: target.amount * 10u64.pow(token_decimals as u32),
            recipient: Pubkey::from_str(target.wallet.as_str()).unwrap(),
        })
    }

    result.sort_by(|a, b| a.recipient.cmp(&b.recipient));

    Ok(result)
}

// structs for json_to_create_airdrop_param()
#[derive(Debug, Serialize, Deserialize)]
struct ParamData {
    authority: String,  //Pubkey,
    token_mint: String, //Pubkey,
    stake_pool: String, //Pubkey,
    short_desc: String,
}

#[derive(Debug)]
pub struct AirdropCreateResult {
    pub create_params: AirdropCreateParams,
    pub authority: Pubkey,
    pub payer: Pubkey,
    pub token_mint: Pubkey,
    pub vault_pubkey: Pubkey,
}

// parse files for airdrop_create ix
pub fn json_to_create_airdrop_param(
    client: &anchor_client::Program,
    airdrop: Pubkey,
    contents: String,
) -> anyhow::Result<AirdropCreateResult> {
    let data = contents;
    let json_data: ParamData = serde_json::from_str(&data)?;

    let authority = Pubkey::from_str(json_data.authority.as_str())?;
    let token_mint = Pubkey::from_str(json_data.token_mint.as_str())?;
    let stake_pool = Pubkey::from_str(json_data.stake_pool.as_str())?;
    // find rewards vault
    let (vault_pubkey, _vault_bump) =
        Pubkey::find_program_address(&[airdrop.as_ref(), b"vault"], &client.id());

    let airdrop_create_params = AirdropCreateParams {
        expire_at: get_unix_time_90_days(),
        stake_pool: stake_pool,
        short_desc: json_data.short_desc,
        flags: 0,
    };

    let default_keypair_pubkey = load_default_keypair()?.pubkey();

    let result = AirdropCreateResult {
        create_params: airdrop_create_params,
        authority,
        payer: default_keypair_pubkey,
        token_mint,
        vault_pubkey,
    };

    Ok(result)
}
