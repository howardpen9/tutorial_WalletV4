// import { toNano, WalletContractV4 } from '@ton/core';
import { fromNano, internal, TonClient, Address, WalletContractV4, TonClient4, toNano } from '@ton/ton';
import { TestWallet } from '../wrappers/TestWallet';
import { compile, NetworkProvider } from '@ton/blueprint';
import { KeyPair, mnemonicToPrivateKey } from 'ton-crypto';
// ------
import * as dotenv from 'dotenv';
dotenv.config();

export async function run(provider: NetworkProvider) {
    let mnemonics = (process.env.mnemonics || '').toString(); // 🔴 Change to your own, by creating .env file!
    let keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));
    let workchain = 0;
    let publicKey = keyPair.publicKey;

    let codeData = TestWallet.createFromConfig({ workchain, publicKey: publicKey }, await compile('TestWallet'));
    const wallet = provider.open(codeData);
    console.log('Wallet-x addr: ' + wallet.address.toString());
    await wallet.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(wallet.address);
    console.log('Seqno: ', await wallet.getSeqno());
    console.log('SubWallet: ', await wallet.getSubWalletId());
    console.log('PublicKey: ', await wallet.getPublicKey());
    console.log(codeData.init?.code.toBoc().toString('hex'));

    console.log('\n');
}
