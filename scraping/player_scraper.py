def scrape_player(row_soup, year):
    jersey_number = row_soup.select('th[data-stat="uniform_number"]')[0].text
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
        "lastName": last_name,
        "firstName": first_name,
        "jerseyNumber": jersey_number,
        "position": convert_pfr_position(position),
        "height": height,
        "weight": weight,
        "college": last_college,
        "birthDate": birth_date,
        "experience": convert_pfr_experience(experience),
        "avRating": av_rating
    }

def convert_pfr_position(pfr_pos):
    p = pfr_pos.strip()

    if p == "QB":
        return "QB"
    elif p == "RB":
        return "RB"
    elif p == "FB":
        return "FB"
    elif p == "WR" or p == "WR/RB" or p == "WR/CB":
        return "WR"
    elif p == "TE" or p == "QB/TE":
        return "TE"
    elif p == "T" or p == "OT" or p == "LT":
        return "T"
    elif p == "G" or p == "OG" or p == "LG" or p == "OL":
        return "G"
    elif p == "C":
        return "C"
    elif p == "DL" or p == "DT" or p == "NT":
        return "DL"
    elif p == "EDGE" or p == "DE" or p == "LOLB":
        return "EDGE"
    elif p == "LB" or p == "ILB" or p == "MLB" or p == "LILB" or p == "RILB" or p == "OLB":
        return "LB"
    elif p == "CB":
        return "CB"
    elif p == "S" or p == "FS" or p == "SS" or p == "DB":
        return "S"
    elif p == "K":
        return "K"
    elif p == "P":
        return "P"
    elif p == "LS" or p == "LS,TE":
        return "LS"
    elif p == "":
        return "NONE"
    else:
        raise ValueError(f"Unrecognized position found: {pfr_pos}")

def convert_pfr_experience(pfr_exp):
    if "Rook" in pfr_exp:
        return 1
    else:
        return pfr_exp