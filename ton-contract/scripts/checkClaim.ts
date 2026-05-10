import { Address } from '@ton/core';
import { AttendanceBadge } from '../build/Attendance/Attendance_AttendanceBadge';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const contractAddressRaw = await provider.ui().input('Enter deployed contract address:');
    const contractAddress = Address.parse(contractAddressRaw.trim());
    const contract = provider.open(AttendanceBadge.fromAddress(contractAddress));

    const studentRaw = await provider.ui().input('Enter student address (leave empty for yourself):');
    const studentAddress = studentRaw.trim()
        ? Address.parse(studentRaw.trim())
        : provider.sender().address!;

    const result = await contract.getGetAttendeesByStudent({
        $$type: 'GetByStudent',
        student: studentAddress,
    });

    console.log('\n📊 Student claims');
    console.log(`Student: ${studentAddress.toString()}`);
    console.log(`Found records: ${result.size}`);
}