import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Dictionary } from '@ton/core';

export type AttendanceBadgeConfig = {
    owner: Address;
};

export function attendanceBadgeConfigToCell(config: AttendanceBadgeConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeUint(0, 256)
        .storeDict(Dictionary.empty())
        .endCell();
}

export class AttendanceBadge implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new AttendanceBadge(address);
    }

    static createFromConfig(config: AttendanceBadgeConfig, code: Cell, workchain = 0) {
        const data = attendanceBadgeConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);
        return new AttendanceBadge(address, init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendClaimBadge(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        codeHash: bigint
    ) {
        const body = beginCell()
            .storeUint(0x87654321, 32)
            .storeUint(0, 64)
            .storeUint(codeHash, 256)
            .endCell();

        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: body,
        });
    }
}