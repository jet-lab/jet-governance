use anchor_client::{Cluster, Program, solana_sdk::signer::Signer};

use clap2::ArgMatches;
use solana_clap_utils::keypair::DefaultSigner;
use solana_remote_wallet::remote_wallet::maybe_wallet_manager;


pub fn program<'a>(payer: &'a dyn Signer) -> Program<'a> {
    let cluster = Cluster::Localnet;
    let connection = anchor_client::Client::new(cluster.clone(), &*payer);
    connection.program(jet_governance::id())
}


pub fn wallet(path: &str) -> Box<dyn Signer> {
    let path = &*shellexpand::tilde(path);
    let mut wallet_manager = maybe_wallet_manager().unwrap();
    let default_signer = DefaultSigner::new("keypair".to_string(), path);
    let arg_matches = ArgMatches::default();
    default_signer
        .signer_from_path(&arg_matches, &mut wallet_manager)
        .unwrap()
}
