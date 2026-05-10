struct AttendanceRecord {
    badge: Int as uint256;
    student: Address;
    timestamp: Int as uint32;
}

struct BadgeValue {
    badge: Int as uint256;
}

message SetCodeBadge {
    codeHash: Int as uint256;
    badge: Int as uint256;
}

message ClaimBadge {
    codeHash: Int as uint256;
}

message GetByCode {
    codeHash: Int as uint256;
}

message GetByStudent {
    student: Address;
}

contract AttendanceBadge {
    owner: Address;
    codeToBadge: map<Int as uint256, BadgeValue>;
    records: map<Int as uint256, AttendanceRecord>;
    nextId: Int as uint256 = 0;

    init(owner: Address) {
        self.owner = owner;
    }

    receive(msg: SetCodeBadge) {
        require(sender() == self.owner, "only owner");
        self.codeToBadge.set(msg.codeHash, BadgeValue { badge: msg.badge });
    }

    receive(msg: ClaimBadge) {
        let badgeValue = self.codeToBadge.get(msg.codeHash);
        require(badgeValue != null, "unknown code");

        self.records.set(self.nextId, AttendanceRecord {
            codeHash: msg.codeHash,
            badge: badgeValue!!.badge,
            student: sender(),
            timestamp: now()
        });
        self.nextId = self.nextId + 1;
    }

    get fun getAttendeesByCode(msg: GetByCode): map<Int as uint256, Address> {
        let result: map<Int as uint256, Address> = emptyMap();
        let i: Int = 0;
        let resultIndex: Int = 0;

        while (i < self.nextId) {
            let record = self.records.get(i);
            if (record != null && record!!.codeHash == msg.codeHash) {
                result.set(resultIndex, record!!.student);
                resultIndex = resultIndex + 1;
            }
            i = i + 1;
        }

        return result
    }

    get fun getAttendeesByStudent(msg: GetByStudent): map<Int as uint256, Int as uint256> {
        let result: map<Int as uint256, Int as uint256> = emptyMap();
        let i: Int = 0;
        let resultIndex: Int = 0;

        while (i < self.nextId) {
            let record = self.records.get(i);
            if (record != null && record!!.student == msg.student) {
                result.set(resultIndex, record!!.badge);
                resultIndex = resultIndex + 1;
            }
            i = i + 1;
        }

        return result
    }
}