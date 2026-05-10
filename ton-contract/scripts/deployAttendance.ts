import { Address, toNano } from '@ton/core';
import { AttendanceBadge } from '../build/Attendance/Attendance_AttendanceBadge';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const ownerFromSender = provider.sender().address;
    if (!ownerFromSender) {
        throw new Error('Wallet address is not available from provider.sender()');
    }
    const raw = (ownerFromSender as any).toRawString?.();
    const owner: Address = raw ? Address.parseRaw(raw) : Address.parse(ownerFromSender.toString());

    console.log('🏢 Deploying AttendanceBadge contract...');
    console.log(`👤 Owner: ${owner}`);

    // fromInit uses generated code+data from tact build
    const contract = provider.open(await AttendanceBadge.fromInit(owner));
    await contract.send(
        provider.sender(),
        { value: toNano('0.1') },
        { $$type: 'SetCodeBadge', codeHash: 0n, badge: 0n }
    );
    await provider.waitForDeploy(contract.address);

    console.log('\n✅ Contract deployed successfully!');
    console.log(`📄 Contract address: ${contract.address.toString()}`);
    console.log('\n🎯 Next steps:');
    console.log(`Run: npx blueprint run setEventCode --testnet --tonconnect`);
    console.log(`Run: npx blueprint run claimBadge --testnet --tonconnect`);
}