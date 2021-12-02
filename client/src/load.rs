use std::{rc::Rc, sync::{Arc, Mutex}};

use anchor_client::{Cluster, Program, solana_sdk::{commitment_config::{CommitmentConfig, CommitmentLevel}, signer::Signer}};

use clap2::ArgMatches;
use lazy_static::lazy_static;
use solana_clap_utils::keypair::DefaultSigner;
use solana_remote_wallet::remote_wallet::{RemoteWalletManager, RemoteWalletError};


pub fn program<'a>(
    payer: Rc<dyn Signer>,
    commitment: CommitmentLevel
) -> Program {
    let cluster = Cluster::Localnet;
    let connection = anchor_client::Client::new_with_options(
        cluster.clone(),
        payer.into(),
        CommitmentConfig {
            commitment,
        }
    );
    connection.program(jet_governance::id())
}


pub fn wallet(path: &str) -> Rc<dyn Signer> {
    let path = &*shellexpand::tilde(path);
    let mut wallet_manager = maybe_wallet_manager2().unwrap();
    let default_signer = DefaultSigner::new("keypair".to_string(), path);
    let arg_matches = ArgMatches::default();
    default_signer
        .signer_from_path(&arg_matches, &mut wallet_manager)
        .unwrap()
        .into()
}

lazy_static! {
    static ref HID_API: Arc<parking_lot::Mutex<hidapi::HidApi>> = 
        Arc::new(parking_lot::Mutex::new(hidapi::HidApi::new().unwrap()));
}

/// overrides logic in solana library to allow multiple threads to use HidApi
pub fn initialize_wallet_manager() -> Result<Arc<RemoteWalletManager>, RemoteWalletError> {
    Ok(RemoteWalletManager::new(HID_API.clone()))
}

pub fn maybe_wallet_manager2() -> Result<Option<Arc<RemoteWalletManager>>, RemoteWalletError> {
    let wallet_manager = initialize_wallet_manager()?;
    let device_count = wallet_manager.update_devices()?;
    if device_count > 0 {
        Ok(Some(wallet_manager))
    } else {
        drop(wallet_manager);
        Ok(None)
    }
}