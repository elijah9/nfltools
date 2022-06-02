def scrape_player(row_soup, year):
    jersey_number = row_soup.select('th[data-stat="uniform_number"]')[0].text
    player_id = row_soup.select('td[data-stat="player"]')[0]["data-append-csv"]
    full_name = row_soup.select('td[data-stat="player"]')[0]["csk"]
    last_name, first_name = full_name.split(",")
    position = row_soup.select('td[data-stat="pos"]')[0].text
    weight = row_soup.select('td[data-stat="weight"]')[0].text
    height = row_soup.select('td[data-stat="height"]')[0].text
    college_id = row_soup.select('td[data-stat="college_id"]')[0].text
    birth_date = row_soup.select('td[data-stat="birth_date_mod"]')[0].text
    experience = row_soup.select('td[data-stat="experience"]')[0].text
    av_rating = row_soup.select('td[data-stat="av"]')[0].text
    # print(f"{position} #{jersey_number} - {first_name} {last_name} - {height} {weight} - {college} - {birth_date} ({experience}) - {year} AV: {av_rating}")

    # only use last college
    colleges = college_id.split(",")
    last_college = colleges[len(colleges) - 1]
    if (not last_college) or (last_college.strip().lower() == "no college"):
        last_college = "None"

    return {
        "playerId": player_id,
        "lastName": last_name,
        "firstName": first_name,
        "jerseyNumber": jersey_number,
        "position": convert_pfr_position(position),
        "height": height,
        "weight": weight,
        "college": last_college,
        "birthDate": birth_date,
        "firstYear": convert_pfr_experience(year, experience),
        "avRating": av_rating
    }

def convert_pfr_position(pfr_pos):
    p = pfr_pos.strip()

    if p == "QB":
        return "QB"
    elif p in ["RB", "HB"]:
        return "RB"
    elif p == "FB":
        return "FB"
    elif p in ["WR", "WR/RB", "WR/CB"]:
        return "WR"
    elif p in ["TE", "QB/TE"]:
        return "TE"
    elif p in ["T", "OT", "LT"]:
        return "T"
    elif p in ["G", "OG", "LG", "OL"]:
        return "G"
    elif p == "C":
        return "C"
    elif p in ["DL", "DT", "NT"]:
        return "DL"
    elif p in ["EDGE", "DE", "LOLB"]:
        return "EDGE"
    elif p in ["LB", "ILB", "MLB", "LILB", "RILB", "OLB"]:
        return "LB"
    elif p == "CB":
        return "CB"
    elif p in ["S", "SAF", "FS", "SS", "DB"]:
        return "S"
    elif p == "K":
        return "K"
    elif p == "P":
        return "P"
    elif p in ["LS", "LS,TE"]:
        return "LS"
    elif p == "":
        return "NONE"
    else:
        raise ValueError(f"Unrecognized position found: {pfr_pos}")

def convert_pfr_experience(year, pfr_exp):
    if "Rook" in pfr_exp:
        experience = 0
    else:
        experience = int(pfr_exp)
    
    return year - experience