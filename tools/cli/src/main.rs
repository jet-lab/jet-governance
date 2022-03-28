use anchor_client::solana_sdk::{signature::Signer, system_instruction::create_account};
use anchor_lang::{prelude::Pubkey, solana_program};
use jet_rewards::instructions::AirdropAddRecipientsParams;
use jet_rewards::state::Airdrop;
use std::path::PathBuf;
use structopt::StructOpt;
pub mod utils;

use utils::*;

const AIRDROP_SPACE_LEN: usize = 8 + std::mem::size_of::<Airdrop>();

#[derive(StructOpt)]
enum RunCommand {
    /// Create airdrop account and add 'List of Recipient' to the airdrop account
    CreateAirdrop {
        /// The file path of the list of content to initialize airdrop account
        #[structopt(parse(from_os_str))]
        param_file_path: PathBuf,

        /// The file path of the list of content to add recipients to airdrop account
        #[structopt(parse(from_os_str))]
        recipients_file_path: PathBuf,
    },

    /// Finalize airdrop
    FinalizeAirdrop {
        /// The airdrop to finalize
        #[structopt(long, short)]
        airdrop: Pubkey,

        /// The authority to make changes to the airdrop, which must sign
        authority: Pubkey,
    },

    /// Close airdrop
    CloseAirdrop {
        /// The airdrop to claim from
        #[structopt(long, short)]
        airdrop: Pubkey,

        /// The authority to make changes to the airdrop, which must sign
        authority: Pubkey,

        /// The account to receive any remaining tokens in the vault
        token_receiver: Pubkey,
    },

    /// Read airdrop account
    ReadAirdrop {
        /// The address of the airdrop account
        #[structopt(long, short)]
        airdrop: Pubkey,
    },

    /// Utility command to print to file
    PrintFile {
        //#[structopt(short, long)]
    //print: bool,
    },
}

fn run_create_airdrop_account_and_add_recipients(
    client: &anchor_client::Program,
    param_file_path: PathBuf,
    recipients_file_path: PathBuf,
) -> anyhow::Result<()> {
    let airdrop_keypair = generate_keypair()?;
    let airdrop_address = airdrop_keypair.pubkey();
    println!("airdrop address: {}", airdrop_address);
    let param_contents = read_file_path(param_file_path)?;
    let airdrop_create_result =
        json_to_create_airdrop_param(client, airdrop_address, param_contents)?;

    let lamport = client
        .rpc()
        .get_minimum_balance_for_rent_exemption(AIRDROP_SPACE_LEN)?;

    let create_airdrop = create_account(
        &airdrop_create_result.payer,
        &airdrop_address,
        lamport,
        AIRDROP_SPACE_LEN as u64,
        &client.id(),
    );

    // create ix
    let params = jet_rewards::instructions::AirdropCreateParams {
        expire_at: airdrop_create_result.create_params.expire_at,
        stake_pool: airdrop_create_result.create_params.stake_pool,
        short_desc: airdrop_create_result.create_params.short_desc,
        long_desc: airdrop_create_result.create_params.long_desc,
        flags: airdrop_create_result.create_params.flags,
    };

    let airdrop_create_accounts = jet_rewards::accounts::AirdropCreate {
        airdrop: airdrop_address,
        authority: airdrop_create_result.authority,
        reward_vault: airdrop_create_result.vault_pubkey,
        payer: airdrop_create_result.payer,
        token_mint: airdrop_create_result.token_mint,
        token_program: anchor_spl::token::ID,
        system_program: solana_program::system_program::ID,
        rent: solana_program::sysvar::rent::ID,
    };

    println!("create airdrop");
    let sig = client
        .request()
        .instruction(create_airdrop)
        .signer(&airdrop_keypair)
        .accounts(airdrop_create_accounts)
        .args(jet_rewards::instruction::AirdropCreate { params })
        .send()?;
    println!("confirmed: {:?}", sig);

    let recipient_contents = read_file_path(recipients_file_path)?;
    let recipients = json_to_recipient_list_structured_data(recipient_contents)?;

    // add recipients ix
    let mut start_index = 0u64;
    for chunk in recipients.chunks(25) {
        let params = AirdropAddRecipientsParams {
            start_index,
            recipients: chunk.to_vec(),
        };

        let accounts = jet_rewards::accounts::AirdropAddRecipients {
            airdrop: airdrop_address,
            authority: airdrop_create_result.authority,
        };

        println!("add recipients to airdrop");
        let sig = client
            .request()
            .accounts(accounts)
            .args(jet_rewards::instruction::AirdropAddRecipients { params })
            .send()?;
        println!("confirmed: {:?}", sig);

        start_index += 25;
    }

    Ok(())
}

fn run_finalize_airdrop(
    client: &anchor_client::Program,
    airdrop: Pubkey,
    authority: Pubkey,
) -> anyhow::Result<()> {
    let (reward_vault, _bump) =
        Pubkey::find_program_address(&[airdrop.as_ref(), b"vault"], &client.id());

    let accounts = jet_rewards::accounts::AirdropFinalize {
        airdrop,
        reward_vault,
        authority,
    };

    println!("finalize airdrop");
    let sig = client
        .request()
        .accounts(accounts)
        .args(jet_rewards::instruction::AirdropFinalize {})
        .send();
    println!("confirmed: {:?}", sig);
    Ok(())
}

fn run_close_airdrop(
    client: &anchor_client::Program,
    airdrop: Pubkey,
    authority: Pubkey,
    token_receiver: Pubkey,
) -> anyhow::Result<()> {
    let (reward_vault, _bump) =
        Pubkey::find_program_address(&[airdrop.as_ref(), b"vault"], &client.id());

    let receiver = load_default_keypair()?.pubkey();
    let accounts = jet_rewards::accounts::AirdropClose {
        airdrop,
        reward_vault,
        authority,
        receiver,
        token_receiver,
        token_program: anchor_spl::token::ID,
    };

    println!("close airdrop");
    let sig = client
        .request()
        .accounts(accounts)
        .args(jet_rewards::instruction::AirdropClose {})
        .send();
    println!("confirmed: {:?}", sig);

    Ok(())
}

fn main() -> anyhow::Result<()> {
    let client = load_default_client()?;
    let command = RunCommand::from_args();

    match command {
        RunCommand::CreateAirdrop {
            param_file_path,
            recipients_file_path,
        } => run_create_airdrop_account_and_add_recipients(
            &client,
            param_file_path,
            recipients_file_path,
        )?,
        RunCommand::FinalizeAirdrop { airdrop, authority } => {
            run_finalize_airdrop(&client, airdrop, authority)?
        }
        RunCommand::CloseAirdrop {
            airdrop,
            authority,
            // receiver,
            token_receiver,
        } => run_close_airdrop(&client, airdrop, authority, token_receiver)?,
        RunCommand::ReadAirdrop { airdrop } => run_read_airdrop(&client, airdrop)?,
        RunCommand::PrintFile {} => run_print_to_file()?,
    }

    Ok(())
}
