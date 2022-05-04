def generate_position(posCode, posName, unit, valid=True):
    return {
        "positionCode": posCode,
        "fullName": posName,
        "unit": unit,
        "valid": valid
    }

POSITIONS = [
    generate_position("QB", "Quarterback", "O"),
    generate_position("RB", "Running back", "O"),
    generate_position("FB", "Fullback", "O"),
    generate_position("WR", "Wide receiver", "O"),
    generate_position("TE", "Tight end", "O"),
    generate_position("T", "Tackle", "O"),
    generate_position("G", "Guard", "O"),
    generate_position("C", "Center", "O"),
    generate_position("DL", "Defensive line", "D"),
    generate_position("EDGE", "Edge defender", "D"),
    generate_position("LB", "Linebacker", "D"),
    generate_position("CB", "Cornerback", "D"),
    generate_position("S", "Safety", "D"),
    generate_position("K", "Kicker", "ST"),
    generate_position("P", "Punter", "ST"),
    generate_position("LS", "Long snapper", "ST"),
    generate_position("NONE", "No position", "NONE", False)
]