use crate::solana::{send_transaction, PayingClient};
use anyhow::Result;
use solana_sdk::{
    program_pack::Pack, pubkey::Pubkey, signature::Keypair, signer::Signer, system_instruction,
};
use spl_token::state::{Account, Mint};

pub fn initialize_mint(paying_client: &PayingClient) -> Result<Pubkey> {
    let mint = Keypair::new();
    let create = system_instruction::create_account(
        &paying_client.payer.pubkey(),
        &mint.pubkey(),
        paying_client
            .rpc_client
            .get_minimum_balance_for_rent_exemption(Mint::LEN)?,
        Mint::LEN as u64,
        &spl_token::id(),
    );
    let init = spl_token::instruction::initialize_mint(
        &spl_token::ID,
        &mint.pubkey(),
        &paying_client.payer.pubkey(),
        Some(&paying_client.payer.pubkey()),
        0,
    )?;
    send_transaction(paying_client, &[create, init], &[&mint])?;
    Ok(mint.pubkey())
}

pub fn create_account(
    paying_client: &PayingClient,
    mint: &Pubkey,
    owner: &Pubkey,
) -> Result<Pubkey> {
    let subaccount = Keypair::new();
    let create = system_instruction::create_account(
        &paying_client.payer.pubkey(),
        &subaccount.pubkey(),
        paying_client
            .rpc_client
            .get_minimum_balance_for_rent_exemption(Account::LEN)?,
        Account::LEN as u64,
        &spl_token::id(),
    );
    let init = spl_token::instruction::initialize_account(
        &spl_token::ID,
        &subaccount.pubkey(),
        &mint,
        &owner,
    )?;
    send_transaction(paying_client, &[create, init], &[&subaccount])?;
    Ok(subaccount.pubkey())
}

pub fn mint_to(
    paying_client: &PayingClient,
    mint: Pubkey,
    recipient: Pubkey,
    amount: u64,
) -> Result<()> {
    // let assoc = get_associated_token_address(&recipient, &mint);
    let mint_to = spl_token::instruction::mint_to(
        &spl_token::ID,
        &mint,
        &recipient,
        &paying_client.payer.pubkey(),
        &[],
        amount,
    )?;
    send_transaction(paying_client, &[mint_to], &[&*paying_client.payer])
}
