async function initEditPlayer() {
    const rows = document.getElementById("form-rows");
    
    const teamOptions = await getDropdownOptions(TABLE_NAMES.team, "teamCode", "fullName");
    const positionOptions = await getDropdownOptions(TABLE_NAMES.position, "positionCode", "fullName");
    const collegeOptions = await getDropdownOptions(TABLE_NAMES.college, "collegeName", "collegeName");
    const heightOptions = getHeightOptions();
    const draftClassOptions = getDraftClassOptions(2022);

    let player;
    const playerId = document.getElementById("playerId").value;
    if(isEmptyOrSpaces(playerId)) {
        // creating new player
        player = {
            firstName: "",
            lastName: "",
            teamCode: Object.keys(teamOptions)[0],
            position: Object.keys(positionOptions)[0],
            height: Object.keys(heightOptions)[0],
            weight: 0,
            birthDate: "",
            firstYear: Object.keys(draftClassOptions)[0],
            college: Object.keys(collegeOptions)[0]
        };
    } else {
        // editing existing player
        player = await getSingleFromTable(TABLE_NAMES.player, { playerId: playerId });
        currentPlayerTeam = await getSingleFromTable(TABLE_NAMES.playerTeams, { playerId: playerId });
        player.teamCode = currentPlayerTeam.teamCode;

        // show delete button
        document.getElementById("delete-button").style.display = "inline-block";
    }

    // TODO: too many parameters in here, clean up somehow
    appendTextRow(rows, player, "firstName", "first name");
    appendTextRow(rows, player, "lastName", "last name");
    appendDropdownRow(rows, player, "teamCode", teamOptions, "team");
    appendDropdownRow(rows, player, "position", positionOptions, "position");
    const numberOptions = await getAvailableJerseyNumbers(player);
    appendDropdownRow(rows, player, "jerseyNumber", numberOptions, "jersey number");
    appendDropdownRow(rows, player, "height", heightOptions, "height");
    appendNumberRow(rows, player, "weight", "weight");
    appendDateRow(rows, player, "birthDate", "birth date");
    appendDropdownRow(rows, player, "firstYear", draftClassOptions, "draft class");
    appendDropdownRow(rows, player, "college", collegeOptions, "college");

    document.getElementById("teamCode").addEventListener("change", async function () {
        player.teamCode = document.getElementById("teamCode").value;
        const newAvailableNumbers = await getAvailableJerseyNumbers(player);
        const numberSelect = document.getElementById("jerseyNumber");
        replaceDropdownOptions(numberSelect, newAvailableNumbers, numberSelect.value);
    });

    document.getElementById("position").addEventListener("change", async function () {
        const newAvailableNumbers = await getAvailableJerseyNumbers(player);
        const numberSelect = document.getElementById("jerseyNumber");
        replaceDropdownOptions(numberSelect, newAvailableNumbers, numberSelect.value);
    });

    document.getElementById("reset-button").addEventListener("click", resetEditPlayerForm);
    document.getElementById("delete-button").addEventListener("click", promptDeletePlayer);
    document.getElementById("confirm-delete-button").addEventListener("click", deletePlayer);
    document.getElementById("cancel-delete-button").addEventListener("click", cancelDeletePlayer);

    const form = document.getElementById("edit-player-form");
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        if(!form.checkValidity()) {
            e.stopPropagation();
        } else {
            await showLoadingIndicator(submitEditPlayerForm);
        }

        form.classList.add("was-validated");
    });

    form.style.display = "table";
}

async function resetEditPlayerForm() {
    const allInputs = document.querySelectorAll("#form-rows input");
    for(let i = 0; i < allInputs.length; ++i) {
        const input = allInputs[i];
        input.value = input.dataset.originalVal;
    }

    const allSelects = document.querySelectorAll("#form-rows select");
    for(let i = 0; i < allSelects.length; ++i) {
        const select = allSelects[i];
        select.value = select.dataset.originalVal;
    }
}

async function submitEditPlayerForm() {
    const updatedPlayer = getPlayerFromForm();

    if(isEmptyOrSpaces(updatedPlayer.playerId)) {
        // creating new player

        // calculate new playerId
        // TODO: would be ideal if highest suffix for prefix could be found
        //       because lots of players with 00/01 prefixes are retired
        //       and would clash if we decided to bring in historical data
        let newPlayerIdSuffix = 0;
        let newPlayerId;
        while(!newPlayerId) {
            const possibleId = updatedPlayer.lastName.slice(0, 4) + updatedPlayer.firstName.slice(0, 2) 
                + String(newPlayerIdSuffix).padStart(2, '0');

            const idConflict = await getSingleFromTable(TABLE_NAMES.player, { playerId: possibleId });
            if(idConflict) {
                ++newPlayerIdSuffix;
            } else {
                newPlayerId = possibleId;
            }
        }
        updatedPlayer.playerId = newPlayerId;

        // create playerTeam
        const updatedTeam = { 
            playerId: updatedPlayer.playerId,
            teamCode: updatedPlayer.teamCode
        };
        await writeToTable(TABLE_NAMES.playerTeams, updatedTeam);

        // create player
        delete updatedPlayer.teamCode;
        await writeToTable(TABLE_NAMES.player, updatedPlayer);
    } else {
        // updating existing player

        // update playerTeam if applicable
        const originalTeam = document.getElementById("teamCode").dataset.originalVal;
        if(updatedPlayer.teamCode !== originalTeam) {
            const updatedTeam = { 
                playerId: updatedPlayer.playerId,
                teamCode: updatedPlayer.teamCode
            };
            await updateRow(TABLE_NAMES.playerTeams, { playerId: updatedPlayer.playerId }, updatedTeam);
        }
        
        // submit to db
        delete updatedPlayer.teamCode;
        await updateRow(TABLE_NAMES.player, { playerId: updatedPlayer.playerId }, updatedPlayer);
    }

    redirectToRoster(updatedPlayer);
}

function getPlayerFromForm() {
    // create updated player
    const updatedPlayer = {};
    const allInputs = document.querySelectorAll("input, select");
    for(let i = 0; i < allInputs.length; ++i) {
        const input = allInputs[i];
        let inputVal = input.value;
        if(input.dataset.inputType === "number") {
            inputVal = parseInt(inputVal);
        }
        updatedPlayer[input.id] = inputVal;
    }
    return updatedPlayer;
}

// TODO: make sure this gets called when position or team change
async function getAvailableJerseyNumbers(currentPlayer) {
    const currentPosCode = document.getElementById("position").value;
    const allPositions = await getAllFromTable(TABLE_NAMES.position);
    const currentPos = allPositions.filter(function (p) { return p.positionCode === currentPosCode; })[0];
    const currentUnit = currentPos.unit;
    const allPlayers = await getAllFromTable(TABLE_NAMES.player);
    const teamPlayers = await getAllFromTable(TABLE_NAMES.playerTeams, { teamCode: currentPlayer.teamCode });
    const retiredNumbers = await getAllFromTable(TABLE_NAMES.retiredNumbers, { teamCode: currentPlayer.teamCode });
    const takenNumbers = [];
    for(let i = 0; i < teamPlayers.length; ++i) {
        const player = allPlayers.filter(function (p) {
            return p.playerId === teamPlayers[i].playerId;
        })[0];
        const unit = allPositions.filter(function(p) {
            return p.positionCode === player.position;
        })[0].unit;

        // check if player's jersey number is blank
        if(player.jerseyNumber === "" 
            // otherwise, allow if the edited player already has this number
            || player.jerseyNumber === currentPlayer.jerseyNumber 
            // also allow if player is on a different unit
            || unit !== currentUnit) {
            continue;
        }
        takenNumbers.push(parseInt(player.jerseyNumber));
    }
    for(let i = 0; i < retiredNumbers.length; ++i) {
        takenNumbers.push(parseInt(retiredNumbers[i].jerseyNumber));
    }

    const availableNumbers = { "": "" };
    for(let i = 1; i < 100; ++i) {
        if(!takenNumbers.includes(i)) {
            availableNumbers[i] = i;
        }
    }

    return availableNumbers;
}

function getHeightOptions() {
    const options = {};
    for(let i = 5; i < 8; ++i) {
        for(let j = 0; j < 12; ++j) {
            const height = `${i}-${j}`;
            options[height] = height;
        }
    }
    return options;
}

function getDraftClassOptions(maxYear) {
    const options = {};
    for(let i = 1920; i <= maxYear; ++i) {
        options[i] = i;
    }
    return options;
}

function promptDeletePlayer() {
    document.getElementById("delete-prompt").style.display = "block";
    document.getElementById("form-buttons").style.display = "none";
}

async function deletePlayer() {
    document.getElementById("delete-prompt").style.display = "none";

    const player = getPlayerFromForm();
    await deleteRows(TABLE_NAMES.player, { playerId: player.playerId });
    await deleteRows(TABLE_NAMES.playerTeams, { playerId: player.playerId });

    redirectToRoster(player);
}

async function cancelDeletePlayer() {
    document.getElementById("delete-prompt").style.display = "none";
    document.getElementById("form-buttons").style.display = "block";
}

function redirectToRoster(player) {
    const hrefTemplate = document.getElementById("playersHref").href;
    const teamCode = document.getElementById("teamCode").value;
    const a = document.createElement("a");
    a.href = hrefTemplate.replace("$team", teamCode).replace("$pos", player.position);
    a.click();
}