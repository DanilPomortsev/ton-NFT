import { beginCell } from '@ton/core';

/** Должен совпадать с `BadgeBoard_opcodes.ClaimByCode` из `ton-contract/build/.../tact_BadgeBoard.ts`. */
export const CLAIM_BY_CODE_OPCODE = 122640361;

export function buildClaimByCodePayload(hashCode: bigint) {
    return beginCell().storeUint(CLAIM_BY_CODE_OPCODE, 32).storeInt(hashCode, 257).endCell();
}
