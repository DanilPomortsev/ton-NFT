import { Address } from '@ton/core';
import { AttendanceBadge } from '../build/Attendance/Attendance_AttendanceBadge';
import { NetworkProvider } from '@ton/blueprint';
import { sha256 } from '@ton/crypto';

export async function run(provider: NetworkProvider) {
    const contractAddressRaw = await provider.ui().input('Enter deployed contract address:');
    const contractAddress = Address.parse(contractAddressRaw.trim());
    const contract = provider.open(AttendanceBadge.fromAddress(contractAddress));

    const secretCode = await provider.ui().input('Enter secret code to list claims for:');
    const codeHash = BigInt('0x' + (await sha256(Buffer.from(secretCode))).toString('hex'));

    const result = await contract.getGetAttendeesByCode({
        $$type: 'GetByCode',
        codeHash,
    });

    console.log('\n📊 Claims by code');
    console.log(`Code hash: ${codeHash}`);
    console.log(`Found records: ${result.size}`);
}