import { Address } from '@ton/core';
import { AttendanceBadge } from '../build/Attendance/Attendance_AttendanceBadge';
import { NetworkProvider } from '@ton/blueprint';
import { sha256 } from '@ton/crypto';
import { toNano } from '@ton/core';

export async function run(provider: NetworkProvider) {
    const contractAddressRaw = await provider.ui().input('Enter deployed contract address:');
    const contractAddress = Address.parse(contractAddressRaw.trim());
    const contract = provider.open(AttendanceBadge.fromAddress(contractAddress));

    const secretCode = await provider.ui().input('Enter secret code from teacher:');
    const codeHash = BigInt('0x' + (await sha256(Buffer.from(secretCode))).toString('hex'));

    await contract.send(
        provider.sender(),
        { value: toNano('0.05') },
        { $$type: 'ClaimBadge', codeHash }
    );

    console.log('\n✅ Claim transaction sent');
    console.log(`Code hash used: ${codeHash}`);
}