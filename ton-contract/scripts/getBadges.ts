import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { BadgeBoard } from '../build/BadgeBoard/tact_BadgeBoard';

/**
 * Прочитать все badge студента (run_get_method).
 *
 * npx blueprint run getBadges --testnet --tonconnect
 */
export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const rawAddr = (await ui.input('Адрес контракта BadgeBoard:')).trim();
    const contractAddr = Address.parse(rawAddr);
    const rawStudent = (await ui.input('Адрес студента (wallet):')).trim();
    const student = Address.parse(rawStudent);

    const c = provider.open(BadgeBoard.fromAddress(contractAddr));
    const map = await c.getBadges(student);
    ui.write(`badges(${student}): ${map}`);
}
