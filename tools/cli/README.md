<div align="center">
  <img height="170" src="https://github.com/jet-lab/jet-v1/raw/master/app/public/img/jet/jet_logomark_gradient.png" />

  <h1>Jet Protocol</h1>

    <h2>Jet Rewards CLI</h2>

</div>

## Build rewards-cli

```
cargo install —-path .
```

## Localnet testing - startup a local validator and test rewards-cli tool

```
solana-test-validator --bpf-program JET777rQuPU8BatFbhp6irc1NAbozxTheBqNo25eLQP ./target/deploy/jet_rewards.so --bpf-program JPLockxtkngHkaQT5AuRYow3HyUv5qWzmhwsCPd653n ./target/deploy/jet_staking.so --bpf-program JPALXR88jy2fG3miuu4n3o8Jef4K2Cgc3Uypr3Y8RNX ./target/deploy/jet_auth.so
```

Run `ctrl-c.` to kill the solana-test-validator process to stop the localnet

## Files format required for rewards-cli

```json format from <param-file-path>
{
    "authority": <PubKey address>,
    "token_mint": <PubKey address>,
    "stake_pool": <PubKey address>,
    "short_desc": String,
    "long_desc": String
}
```

```json format from <recipients-file-path>
{
    "info": {
        "recipients": u64,
        "amount": u64,
        "units": String,
        "decimals": u8},
    "rewards": [
        {"wallet": <wallet address>, "amount": u64},
        {"wallet": <wallet address>, "amount": u64}, ...
    ]
}
```

## Airdrop rewards-cli commands

### Create airdrop

    `rewards-cli create-airdrop <param-file-path> <recipients-file-path>`

### Finalize airdrop

    `rewards-cli finalize-airdrop <authority address> —-airdrop <airdrop address>`

### Close airdrop

    `rewards-cli close-airdrop <authority address> <token-receiver address> --airdrop <airdrop address>`

#### Read airdrop

    `rewards-cli read-airdrop --airdrop <airdrop address>`

### Print file

    `rewards-cli print-file`
