def generate_position(posCode, posName, valid=True):
    return {
        "positionCode": posCode,
        "fullName": posName,
        "valid": valid
    }

POSITIONS = [
    generate_position("QB", "Quarterback"),
    generate_position("RB", "Running back"),
    generate_position("FB", "Fullback"),
    generate_position("WR", "Wide receiver"),
    generate_position("TE", "Tight end"),
    generate_position("T", "Tackle"),
    generate_position("G", "Guard"),
    generate_position("C", "Center"),
    generate_position("DL", "Defensive line"),
    generate_position("EDGE", "Edge defender"),
    generate_position("LB", "Linebacker"),
    generate_position("CB", "Cornerback"),
    generate_position("S", "Safety"),
    generate_position("K", "Kicker"),
    generate_position("P", "Punter"),
    generate_position("LS", "Long snapper"),
    generate_position("NONE", "No position", False)
]