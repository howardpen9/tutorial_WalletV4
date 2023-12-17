import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
// import { Dictionary } from 'ton-core';

export type TestWalletConfig = {
    workchain: number;
    walletId?: number;
    publicKey: Buffer;
};

export function testWalletConfigToCell(config: TestWalletConfig): Cell {
    let walletId;

    // Resolve walletId
    if (config.walletId !== null && config.walletId !== undefined) {
        walletId = config.walletId;
    } else {
        walletId = 698983191 + config.workchain; // Assuming workchain is part of TestWalletConfig
    }

    return beginCell()
        .storeUint(0, 32) // Assuming this is a placeholder value
        .storeUint(walletId, 32)
        .storeBuffer(config.publicKey)
        .storeBit(0) // Empty plugins dict
        .endCell();
}

export const Opcodes = {
    requestFunds: 0x706c7567,
    removePlugin: 0x64737472,
};

export class TestWallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new TestWallet(address);
    }

    static createFromConfig(config: TestWalletConfig, code: Cell) {
        const data = testWalletConfigToCell(config);
        const init = { code, data };
        return new TestWallet(contractAddress(config.workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendRequestFund(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
            requestValue: number;
        },
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.requestFunds, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeCoins(opts.requestValue)
                .storeDict()
                .endCell(),
        });
    }

    // ===== Get method ===== /
    async getSeqno(provider: ContractProvider) {
        const result = await provider.get('get_seqno', []);
        return result.stack.readNumber();
    }

    async getSubWalletId(provider: ContractProvider) {
        const result = await provider.get('get_subwallet_id', []);
        return result.stack.readNumber();
    }

    async getPublicKey(provider: ContractProvider) {
        const result = await provider.get('get_public_key', []);
        return result.stack.readBigNumber();
    }
}
