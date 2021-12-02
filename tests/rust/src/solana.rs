use std::rc::Rc;

use anyhow::Result;
use solana_client::{rpc_client::RpcClient, rpc_config::RpcSendTransactionConfig};
use solana_sdk::{commitment_config::{CommitmentConfig, CommitmentLevel}, instruction::Instruction, signer::Signer, transaction::Transaction};


pub struct PayingClient {
    pub rpc_client: Rc<RpcClient>,
    pub payer: Rc<dyn Signer>, // todo use multisig Signer code
}

pub fn send_transaction(
    paying_client: &PayingClient,
    instructions: &[Instruction],
    signers: &[&dyn Signer],
) -> Result<()> {
    send_transaction_with_commitment(
        paying_client,
        instructions,
        signers,
        CommitmentLevel::Confirmed
    )
}

pub fn send_transaction_with_commitment(
    paying_client: &PayingClient,
    instructions: &[Instruction],
    signers: &[&dyn Signer],
    commitment: CommitmentLevel
) -> Result<()> {
    let mut config = RpcSendTransactionConfig::default();
    config.skip_preflight = true;

    // let instructions = [get_instruction()];
    let mut all_signers: Vec<&dyn Signer> = Vec::new();
    all_signers.push(&*paying_client.payer);
    for signer in signers {
        all_signers.push(*signer);
    }

    let tx = {
        let (recent_hash, _fee_calc) = paying_client.rpc_client.get_recent_blockhash()?;
        Transaction::new_signed_with_payer(
            &instructions,
            Some(&paying_client.payer.pubkey()),
            &all_signers,
            recent_hash,
        )
    };

    paying_client.rpc_client.send_and_confirm_transaction_with_spinner_and_config(
        &tx,
        CommitmentConfig { commitment },
        config,
    )?;

    Ok(())
}

/// wait the amount of time it would take a transaction to finalize
pub fn _finalize(
    paying_client: &PayingClient,
) -> Result<()> {
    send_transaction_with_commitment(
        paying_client,
        &[],
        &[],
        CommitmentLevel::Finalized
    )
}
