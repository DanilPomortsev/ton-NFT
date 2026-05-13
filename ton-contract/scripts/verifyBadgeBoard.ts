import { Address, Dictionary, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { BadgeBoard } from '../build/BadgeBoard/tact_BadgeBoard';

/** Убирает пробелы/переносы и «невидимые» символы из копипаста из мессенджеров. */
function normalizeAddressInput(src: string): string {
    return src
        .trim()
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, '');
}

/**
 * Friendly-адрес в TON всегда ровно 48 символов (EQ…/UQ…/kQ…).
 * Дополнительно поддерживаем raw `workchain:hex` (например `0:…`).
 */
function parseUserAddress(label: string, raw: string): Address {
    const s = normalizeAddressInput(raw);
    if (!s) {
        throw new Error(`Пустой адрес (${label})`);
    }
    if (Address.isRaw(s)) {
        return Address.parseRaw(s);
    }
    if (Address.isFriendly(s)) {
        return Address.parseFriendly(s).address;
    }
    throw new Error(
        [
            `Не удалось разобрать ${label}: "${s}" (${s.length} символов).`,
            `Нужен user-friendly адрес ровно из 48 символов (например kQ… / EQ… на testnet),`,
            `или raw-формат workchain:hex (0: + 64 hex-символа).`,
            `Если длина не 48 — чаще всего в копипаст попали лишние 1–2 символа или разрыв строки.`,
        ].join(' '),
    );
}

function printStudentDict(ui: { write: (s: string) => void }, d: Dictionary<Address, boolean>, testOnly: boolean) {
    const keys = [...d.keys()];
    if (keys.length === 0) {
        ui.write('  (пусто — пока никто не заклеймил)');
        return;
    }
    for (const k of keys) {
        ui.write(`  ${k.toString({ bounceable: true, testOnly })} => ${d.get(k)}`);
    }
}

function printBadgeDict(ui: { write: (s: string) => void }, d: Dictionary<bigint, boolean>) {
    const keys = [...d.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    if (keys.length === 0) {
        ui.write('  (нет бейджей)');
        return;
    }
    for (const b of keys) {
        ui.write(`  badgeId ${b} => ${d.get(b)}`);
    }
}

async function dumpReadOnly(
    ui: ReturnType<NetworkProvider['ui']>,
    provider: NetworkProvider,
    contractAddr: Address,
    studentAddr: Address | null,
) {
    const testOnly = provider.network() === 'testnet';
    const addrStr = contractAddr.toString({ bounceable: true, testOnly });

    const deployed = await provider.isContractDeployed(contractAddr);
    ui.write(`Адрес: ${addrStr}`);
    ui.write(`Сеть: ${provider.network()}`);
    ui.write(`Аккаунт активен (deployed): ${deployed}`);
    if (!deployed) {
        ui.write('Контракт не в active — getters могут не отвечать.');
        return;
    }

    const c = provider.open(BadgeBoard.fromAddress(contractAddr));
    const students = await c.getStudents();
    ui.write(`\nget students() — словарь адрес -> true:`);
    printStudentDict(ui, students, testOnly);

    if (studentAddr) {
        const badges = await c.getBadges(studentAddr);
        ui.write(
            `\nget badges(${studentAddr.toString({ bounceable: true, testOnly })}) — badgeId -> true:`,
        );
        printBadgeDict(ui, badges);
    } else {
        ui.write('\n(Для badges передай адрес студента вторым аргументом в режиме чтения.)');
    }

    ui.write(`\nTonviewer (testnet): https://testnet.tonviewer.com/${addrStr}`);
}

/**
 * Чтение + опционально запись (демо).
 *
 * Только чтение:
 *   npx blueprint run verifyBadgeBoard --testnet --tonconnect <contract>
 *   npx blueprint run verifyBadgeBoard --testnet --tonconnect <contract> <student>
 *
 * Преподаватель (owner): выставить hashCode -> badge
 *   npx blueprint run verifyBadgeBoard --testnet --tonconnect <contract> setup <hashCode> <badge>
 *
 * Студент: заклеймить по hashCode
 *   npx blueprint run verifyBadgeBoard --testnet --tonconnect <contract> claim <hashCode>
 *
 * Один кошелёк (owner = студент): setup + claim подряд
 *   npx blueprint run verifyBadgeBoard --testnet --tonconnect <contract> demo <hashCode> <badge>
 */
export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();
    const raw = (args[0] ?? process.env.BADGE_BOARD_ADDRESS ?? '').trim();
    if (!raw) {
        throw new Error('Укажи адрес контракта: первый аргумент после флагов или BADGE_BOARD_ADDRESS');
    }
    const contractAddr = parseUserAddress('адрес контракта', raw);
    const mode = (args[1] ?? '').trim().toLowerCase();
    const sender = provider.sender();

    if (mode === 'setup') {
        const hc = (args[2] ?? '').trim();
        const bd = (args[3] ?? '').trim();
        if (!hc || !bd) {
            throw new Error('После setup нужны hashCode и badge: … setup <hashCode> <badge>');
        }
        const hashCode = BigInt(hc);
        const badge = BigInt(bd);

        if (!sender.address) {
            throw new Error('Нет адреса отправителя — подключи кошелёк преподавателя (owner).');
        }

        const c = provider.open(BadgeBoard.fromAddress(contractAddr));
        ui.write(`SetCodeBadge: hashCode=${hashCode}, badge=${badge} (отправитель: ${sender.address})`);
        await c.send(sender, { value: toNano('0.05') }, { $$type: 'SetCodeBadge', hashCode, badge });
        await provider.waitForLastTransaction();
        ui.write('SetCodeBadge применён.');
        ui.write('Дальше студент: … claim <hashCode> с кошельком студента, либо demo на одном кошельке.');
        await dumpReadOnly(ui, provider, contractAddr, null);
        return;
    }

    if (mode === 'claim') {
        const hc = (args[2] ?? '').trim();
        if (!hc) {
            throw new Error('После claim нужен hashCode: … claim <hashCode>');
        }
        const hashCode = BigInt(hc);

        if (!sender.address) {
            throw new Error('Нет адреса отправителя — подключи кошелёк студента.');
        }

        const c = provider.open(BadgeBoard.fromAddress(contractAddr));
        ui.write(`ClaimByCode: hashCode=${hashCode} (отправитель-студент: ${sender.address})`);
        await c.send(sender, { value: toNano('0.06') }, { $$type: 'ClaimByCode', hashCode });
        await provider.waitForLastTransaction();
        ui.write('ClaimByCode применён.');
        await dumpReadOnly(ui, provider, contractAddr, sender.address);
        return;
    }

    if (mode === 'demo') {
        const hc = (args[2] ?? '').trim();
        const bd = (args[3] ?? '').trim();
        if (!hc || !bd) {
            throw new Error('После demo нужны hashCode и badge: … demo <hashCode> <badge>');
        }
        const hashCode = BigInt(hc);
        const badge = BigInt(bd);

        if (!sender.address) {
            throw new Error('Нет адреса отправителя — подключи кошелёк (owner и студент в demo — один и тот же).');
        }

        const c = provider.open(BadgeBoard.fromAddress(contractAddr));
        ui.write(`[demo] SetCodeBadge hashCode=${hashCode} badge=${badge}`);
        await c.send(sender, { value: toNano('0.05') }, { $$type: 'SetCodeBadge', hashCode, badge });
        await provider.waitForLastTransaction();
        ui.write('[demo] ClaimByCode');
        await c.send(sender, { value: toNano('0.06') }, { $$type: 'ClaimByCode', hashCode });
        await provider.waitForLastTransaction();
        ui.write('[demo] готово — смотри словари ниже.');
        await dumpReadOnly(ui, provider, contractAddr, sender.address);
        return;
    }

    const studentRaw = (args[1] ?? '').trim();
    if (studentRaw) {
        const st = parseUserAddress('адрес студента', studentRaw);
        await dumpReadOnly(ui, provider, contractAddr, st);
    } else {
        await dumpReadOnly(ui, provider, contractAddr, null);
    }
}
