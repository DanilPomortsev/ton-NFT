import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Attendance } from '../build/Attendance/Attendance_Attendance';
import '@ton/test-utils';

describe('Attendance', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let attendance: SandboxContract<Attendance>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        attendance = blockchain.openContract(await Attendance.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await attendance.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            null,
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: attendance.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and attendance are ready to use
    });
});
