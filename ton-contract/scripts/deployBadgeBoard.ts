import { toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { BadgeBoard } from '../build/BadgeBoard/tact_BadgeBoard';

/**
 * Деплой BadgeBoard в testnet.
 * Owner = адрес кошелька отправителя (преподаватель).
 *
 * npx blueprint run deployBadgeBoard --testnet --tonconnect
 */
export async function run(provider: NetworkProvider) {
    const sender = provider.sender();
    const owner = sender.address;
    if (!owner) {
        throw new Error('Подключите кошелёк (TON Connect / mnemonics)');
    }

    const board = await BadgeBoard.fromInit(owner);
    const opened = provider.open(board);

    if (await provider.isContractDeployed(opened.address)) {
        console.log('Контракт уже задеплоен:', opened.address.toString());
        return;
    }

    await opened.send(sender, { value: toNano('0.08'), bounce: false }, { $$type: 'Deploy', queryId: 0n });
    await provider.waitForDeploy(opened.address);

    const testOnly = provider.network() === 'testnet';
    console.log('BadgeBoard deployed at:', opened.address.toString({ bounceable: true, testOnly }));
}
