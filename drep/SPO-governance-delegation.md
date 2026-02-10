# SPO reward wallet governance delegation (CLI)

This note documents how BEACNpool manages governance delegation for the **stake credential that receives pool rewards** (the pool "reward account").

## Key idea

- **DRep voting power** comes from ADA delegated (for governance) to a DRep ID.
- **SPO voting** is a separate role for certain governance actions.
- Delegating the pool reward account’s **stake credential** to a DRep can increase the DRep’s voting power, but it **does not replace** SPO voting.

## Identify the pool reward account (stake address)

From a node with access to the local socket:

1) Query the pool state and extract the `rewardAccount`.
2) Confirm it is a `stake1...` address.

## Create a vote delegation certificate (Conway)

Example:

```bash
export CARDANO_NODE_SOCKET_PATH=/opt/cardano/cnode/sockets/node.socket

STAKE_ADDR="stake1..."   # pool reward account
DREP_ID="drep1..."       # your DRep ID (bech32)

# Some cardano-cli versions require a hex DRep key hash (not the bech32 DRep ID).
# If needed, convert DREP_ID to the underlying 28-byte hash.

cardano-cli conway stake-address vote-delegation-certificate \
  --stake-address "$STAKE_ADDR" \
  --drep-key-hash <DREP_KEYHASH_HEX> \
  --out-file vote-deleg.cert
```

## Submit the certificate

Build/sign/submit a transaction that includes `vote-deleg.cert` (and pays fees from a funded payment address). This requires the relevant signing keys for the funding UTxO and the stake credential witness.

## Notes

- You must have ADA available in a **payment address** to pay transaction fees.
- This delegation is about *governance voting power*, not pool block production delegation.
