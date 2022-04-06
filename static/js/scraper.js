async function initScraper() {
    await resetPlayersTable();

    document.getElementById("scraper-buttons").style.display = "block";

    $("button#scrape-button").on("click", async function (e) {
        document.getElementById("loading-indicator").style.display = "table";
        $.get("/scraper/data", async function(data, status) {
            await writeAllToTable(TABLE_NAMES.team, data.teams);
            await writeAllToTable(TABLE_NAMES.player, data.players);
            await resetPlayersTable();
            document.getElementById("loading-indicator").style.display = "none";
        })
    });

    $("button#reset-db-button").on("click", async function (e) {
        console.log("clicked reset button");
        document.getElementById("loading-indicator").style.display = "table";
        await resetDb();
        location.reload();
    });
}

async function resetPlayersTable() {
    $("#roster-table-data").empty();

    let allPlayers = await getAllFromTable(TABLE_NAMES.player);
    for(let i = 0; i < allPlayers.length; ++i) {
        let player = allPlayers[i];
        let playerRow = document.createElement("tr");
        
        let teamVal = genTableData(player.teamCode);
        let posVal = genTableData(player.position);
        let numVal = genTableData(player.jerseyNumber);
        let lNameVal = genTableData(player.lastName);
        let fNameVal = genTableData(player.firstName);
        let heightVal = genTableData(player.height);
        let weightVal = genTableData(player.weight);
        let collegeVal = genTableData(player.college);
        let expVal = genTableData(player.experience);
        let dobVal = genTableData(player.birthDate);

        playerRow.appendChild(teamVal);
        playerRow.appendChild(posVal);
        playerRow.appendChild(numVal);
        playerRow.appendChild(lNameVal);
        playerRow.appendChild(fNameVal);
        playerRow.appendChild(heightVal);
        playerRow.appendChild(weightVal);
        playerRow.appendChild(collegeVal);
        playerRow.appendChild(expVal);
        playerRow.appendChild(dobVal);

        document.getElementById("roster-table-data").appendChild(playerRow);
    }
}

function genTableData(cellVal) {
    let cell = document.createElement("td");
    cell.innerText = cellVal;
    return cell;
}