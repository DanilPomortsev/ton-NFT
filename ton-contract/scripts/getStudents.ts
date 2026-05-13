import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { BadgeBoard } from '../build/BadgeBoard/tact_BadgeBoard';

/**
 * Список студентов, у которых есть хотя бы один badge.
 *
 * npx blueprint run getStudents --testnet --tonconnect
 */
export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const rawAddr = (await ui.input('Адрес контракта BadgeBoard:')).trim();
    const contractAddr = Address.parse(rawAddr);

    const c = provider.open(BadgeBoard.fromAddress(contractAddr));
    const map = await c.getStudents();
    ui.write(`students(): ${map}`);
}
