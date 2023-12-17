import { fromNano, internal, TonClient, Address, WalletContractV4, TonClient4, toNano } from 'ton';
import { KeyPair, mnemonicToPrivateKey } from 'ton-crypto';
import { getHttpEndpoint, getHttpV4Endpoint } from '@orbs-network/ton-access';
// ------
import * as dotenv from 'dotenv';
dotenv.config();

(async () => {
    const endpoint = await getHttpV4Endpoint({ network: 'testnet' });
    const client = new TonClient4({ endpoint });

    let mnemonics = (process.env.mnemonics || '').toString(); // 🔴 Change to your own, by creating .env file!
    let keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));
    let workchain = 0;

    let wallet_create = WalletContractV4.create({
        workchain,
        publicKey: keyPair.publicKey,
    });
    let wallet = client.open(wallet_create);

    console.log('Wallet address: ', wallet.address);
    let target_wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
        walletId: 3,
    });

    let seqno: number = await wallet.getSeqno();
    let balance: bigint = await wallet.getBalance();

    await wallet.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [
            internal({
                to: target_wallet.address,
                value: toNano('0.01'),
                bounce: true,
                init: target_wallet.init,
            }),
        ],
    });
    console.log('Current deployment wallet balance: ', fromNano(balance).toString(), '💎TON');
    console.log('=====================================');
    console.log('Deploying contract: ' + target_wallet.address.toString());
    console.log('=====================================');
    console.log(wallet.init.code.toBoc().toString('hex'));
})();
