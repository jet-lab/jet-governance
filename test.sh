solana-test-validator &
validator_pid=$!
anchor build
anchor deploy
cargo test -p jet-governance-client
kill $validator_pid
