import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { BadgeBoard } from '../build/BadgeBoard/tact_BadgeBoard';

/**
 * Студент: ввести hashCode и получить badge (если код задан преподавателем).
 *
 * npx blueprint run claimByCode --testnet --tonconnect
 */
export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const rawAddr = (await ui.input('Адрес контракта BadgeBoard:')).trim();
    const contractAddr = Address.parse(rawAddr);

    const hashCode = BigInt((await ui.input('hashCode (int):')).trim());

    const c = provider.open(BadgeBoard.fromAddress(contractAddr));
    await c.send(provider.sender(), { value: toNano('0.04') }, { $$type: 'ClaimByCode', hashCode });
    await provider.waitForLastTransaction();
    ui.write('ClaimByCode отправлен.');
}
