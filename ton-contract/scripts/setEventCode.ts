import { Address, toNano } from '@ton/core';
import { AttendanceBadge } from '../build/Attendance/Attendance_AttendanceBadge';
import { NetworkProvider } from '@ton/blueprint';
import { sha256 } from '@ton/crypto';

export async function run(provider: NetworkProvider) {
    const contractAddressRaw = await provider.ui().input('Enter deployed contract address:');
    const parsedAddress = Address.parse(contractAddressRaw.trim());
    const contract = provider.open(AttendanceBadge.fromAddress(parsedAddress));

    const secretCode = await provider.ui().input('Enter secret code (teacher code):');
    const badgeRaw = await provider.ui().input('Enter badge id (integer):');
    const badge = BigInt(badgeRaw.trim());
    const codeHash = BigInt('0x' + (await sha256(Buffer.from(secretCode))).toString('hex'));

    console.log('\n📊 Setting teacher pair hashCode -> badge');
    console.log(`Code Hash: ${codeHash}`);
    console.log(`Badge: ${badge}`);

    await contract.send(
        provider.sender(),
        { value: toNano('0.05') },
        { $$type: 'SetCodeBadge', codeHash, badge }
    );

    console.log('\n✅ Pair saved successfully by teacher');
    console.log(`Students can now claim with secret code: ${secretCode}`);
}