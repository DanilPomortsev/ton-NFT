import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { BadgeBoard } from '../build/BadgeBoard/tact_BadgeBoard';

/**
 * Преподаватель: выставить пару hashCode -> badge.
 *
 * npx blueprint run setCodeBadge --testnet --tonconnect
 */
export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const rawAddr = (await ui.input('Адрес контракта BadgeBoard:')).trim();
    const contractAddr = Address.parse(rawAddr);

    const hashCode = BigInt((await ui.input('hashCode (int):')).trim());
    const badge = BigInt((await ui.input('badge (int):')).trim());

    const c = provider.open(BadgeBoard.fromAddress(contractAddr));
    await c.send(
        provider.sender(),
        { value: toNano('0.03') },
        { $$type: 'SetCodeBadge', hashCode, badge },
    );
    await provider.waitForLastTransaction();
    ui.write('SetCodeBadge отправлен.');
}
