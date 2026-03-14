# V3 EMURGO Bridge Receipt (2026-03-14)

## Scope
This document records newly verified v3 findings for the EMURGO tracing lane using db-sync receipts.

## Evidence grading
- **FACT**: on-chain/db-sync verifiable transaction/delegation/pool metadata receipts.
- **STRONG INFERENCE**: attribution interpretation beyond direct custody/delegation receipts.

## FACT: Full genesis-to-Shelley bridge confirmation

### Chain of custody (key checkpoints)
- Genesis redemption (epoch 0): `242608fc18552a4ac83adabcef7155f3b909e83d469ce89735db8f11d3637e38`
- Funnel-identification split (epoch 4): `7eb47f8f9ffaaf98f30d8028c7e1d13a8efeebffb65d1f2d4be37ee523ceb9bf`
- Treasury consolidation path (epoch 4): `743fd0510c4527b4031504b9f3c1703606bfd5e63bed4d1bf857ceeefc4bac1b`
- Dual-input consolidation incl. 781M branch (epoch 4): `c8596b9cd81f734f8129604ff86f23bd4a910465acb84ad9e9d1ac223ccb4a76`
- Full funnel spend (epoch 7): `71a35dc3c7083eb57bde93efd2abc98fb592175935c0c5e0069e496d349fcf78`
- **Shelley bridge (epoch 210):** `425104ce88b5b4653a1f49e93a696056ee6e60531fbf95f4f81c9ca46ac048a9`

### Epoch-210 bridge outputs (FACT)
- `486,873,323.034918 ADA` → `addr1qyn958fk606mp0cfk87yvst57rzlme63jj48fhmzsflt8n6xj0nyg6y2uqv770c00c2ec8hgt6hx9q5ct998mtldzd6qkkzduf` (stake `stake1u9rf8ejydz9wqx008u8hu9vurm59atnzs2v9jjna4lk3xaqyd8rsa`)
- `150,000,000.000000 ADA` → `addr1q8hajep3962enr8k48dkqma23yjx7f6jrzyfnqz3952g3wzptff5umc9e2t3558e95whkc8e0jhvwrs78c6mjrym4wwqtm0d7j` (stake `stake1u9q4556wduzu49c62ruj68tmvruhetk8pc0ruddepjd6h8qyuf8sp`)

### EMUR2 delegation confirmation (FACT)
- Stake `stake1u9q4556wduzu49c62ruj68tmvruhetk8pc0ruddepjd6h8qyuf8sp` delegation tx `6ba9b243c7d3a0f32b4e97af266825d19fcb0968c529c190185674901793f128` submitted at epoch 210; delegation active at epoch 212
- Pool ID: `pool1qs6h0y7czzt605kptmrv6cr85kxd6tajr2hs0etvxphv7tr7nqu`
- Pool metadata URL: `https://pools.emurgo.io/EMUR2.json`
- Relay DNS: `relays.pools.emurgo.io`
- Pool owner/reward stake: `stake1uym7pcjwzldgwjxek8a88vm9jdvc70yayc6jm7nkan9t2wgayexh2`
- Pool retired epoch: `513`
- Blocks produced: `15081`

## FACT: Second genesis key receipt
- Address: `DdzFFzCqrhspiThx6UaeJASmHTbwbXp2FtdCkF9AU9QXPF9D8sUC7Fqrv9bmYkxradBbqMrSxukTTsqCPNPwRh5PHazdiwWTuJYVMMaf`
- Amount: `781,381,495 ADA`
- Genesis-era source tx (epoch 0): `5ec95a53fa3bb7dc56864bb6e75f369f00aa20e8d8cdc3b66b2fb88ec1b225ef`
- Merge tx into EMURGO consolidation (epoch 4): `c8596b9cd81f734f8129604ff86f23bd4a910465acb84ad9e9d1ac223ccb4a76`

## STRONG INFERENCE boundary statement
- The second genesis key AVVM identity remains unattributed; what is FACT is that this 781M branch merged into the same EMURGO-controlled consolidation funnel used by the traced EMURGO lane.

## Cardanoscan links (key)
- https://cardanoscan.io/transaction/425104ce88b5b4653a1f49e93a696056ee6e60531fbf95f4f81c9ca46ac048a9
- https://cardanoscan.io/transaction/71a35dc3c7083eb57bde93efd2abc98fb592175935c0c5e0069e496d349fcf78
- https://cardanoscan.io/transaction/c8596b9cd81f734f8129604ff86f23bd4a910465acb84ad9e9d1ac223ccb4a76
- https://cardanoscan.io/transaction/5ec95a53fa3bb7dc56864bb6e75f369f00aa20e8d8cdc3b66b2fb88ec1b225ef
