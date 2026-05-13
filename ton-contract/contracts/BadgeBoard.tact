import "@stdlib/deploy";

message SetCodeBadge {
    hashCode: Int as int257;
    badge: Int as int257;
}

message ClaimByCode {
    hashCode: Int as int257;
}

struct StudentBadgeSet {
    m: map<Int as int257, Bool>;
}

/// Минимальная доска бейджей:
/// — преподаватель (owner при деплое) выставляет пару (hashCode -> badge);
/// — студент шлёт ClaimByCode с hashCode; если код известен, у студента фиксируется badge;
/// — геттеры читают состояние (оффчейн через run_get_method).
contract BadgeBoard with Deployable {
    owner: Address;
    /// Код, который показывает преподаватель -> идентификатор бейджа
    codeToBadge: map<Int as int257, Int as int257>;
    /// Адрес студента -> какие badge у него есть
    owned: map<Address, StudentBadgeSet>;
    /// Быстрый индекс: студент когда-либо получил хотя бы один badge
    studentsWithBadge: map<Address, Bool>;

    init(owner: Address) {
        self.owner = owner;
    }

    receive(msg: SetCodeBadge) {
        require(sender() == self.owner, "NOT_OWNER");
        self.codeToBadge.set(msg.hashCode, msg.badge);
    }

    receive(msg: ClaimByCode) {
        let badgeOpt: Int? = self.codeToBadge.get(msg.hashCode);
        require(badgeOpt != null, "UNKNOWN_CODE");
        let badge: Int = badgeOpt!!;
        let who: Address = sender();

        let innerOpt = self.owned.get(who);
        let m: map<Int as int257, Bool> = innerOpt != null ? innerOpt!!.m : emptyMap();
        m.set(badge, true);
        self.owned.set(who, StudentBadgeSet { m: m });
        self.studentsWithBadge.set(who, true);
    }

    get fun badges(student: Address): map<Int as int257, Bool> {
        let innerOpt = self.owned.get(student);
        if (innerOpt == null) {
            return emptyMap();
        }
        return innerOpt!!.m;
    }

    /// Адреса студентов, у которых есть хотя бы один badge (флаги true)
    get fun students(): map<Address, Bool> {
        return self.studentsWithBadge;
    }
}
