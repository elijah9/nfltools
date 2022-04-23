async function initEditPlayer() {
    const rows = document.getElementById("form-rows");
    const playerId = parseInt(document.getElementById("playerId").value);
    const player = await getSingleFromTable(TABLE_NAMES.player, { playerId: playerId });
    const currentPlayerTeam = await getSingleFromTable(TABLE_NAMES.playerTeams, { playerId: playerId });

    const teamOptions = await getDropdownOptions(TABLE_NAMES.team, "teamCode", "fullName");
    const positionOptions = await getDropdownOptions(TABLE_NAMES.position, "positionCode", "fullName");
    const collegeOptions = await getDropdownOptions(TABLE_NAMES.college, "collegeName", "collegeName");
    const numberOptions = await getAvailableJerseyNumbers(currentPlayerTeam, player);
    const heightOptions = getHeightOptions();
    const draftClassOptions = getDraftClassOptions(2022);

    // TODO: too many parameters in here, clean up somehow
    appendTextRow(rows, player, "firstName", "first name");
    appendTextRow(rows, player, "lastName", "last name");
    appendDropdownRow(rows, currentPlayerTeam, "teamCode", teamOptions, "team");
    appendDropdownRow(rows, player, "position", positionOptions, "position");
    appendDropdownRow(rows, player, "jerseyNumber", numberOptions, "jersey number");
    appendDropdownRow(rows, player, "height", heightOptions, "height");
    appendNumberRow(rows, player, "weight", "weight");
    appendDateRow(rows, player, "birthDate", "birth date");
    appendDropdownRow(rows, player, "firstYear", draftClassOptions, "draft class");
    appendDropdownRow(rows, player, "college", collegeOptions, "college");

    document.getElementById("teamCode").addEventListener("change", async function () {
        const teamSelect = document.getElementById("teamCode");
        const newTeam = {
            "teamCode": teamSelect.value,
            "fullName": teamSelect.textContent
        }
        const newAvailableNumbers = await getAvailableJerseyNumbers(newTeam, player);

        const numberSelect = document.getElementById("jerseyNumber");
        replaceDropdownOptions(numberSelect, newAvailableNumbers, numberSelect.value);
    });

    document.getElementById("reset").addEventListener("click", async function () {
        await resetEditPlayerForm();
    });

    const form = document.getElementById("edit-player-form");
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        if(!form.checkValidity()) {
            e.stopPropagation();
        } else {
            await showLoadingIndicator(async function () {
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

                // update playerTeam if applicable
                const originalTeam = document.getElementById("teamCode").dataset.originalVal;
                if(updatedPlayer.teamCode !== originalTeam) {
                    const updatedTeam = { 
                        playerId: updatedPlayer.playerId,
                        teamCode: updatedPlayer.teamCode
                    };
                    await updateRow(TABLE_NAMES.playerTeams, { playerId: parseInt(updatedPlayer.playerId) }, updatedTeam);
                }
                
                // submit to db
                delete updatedPlayer.teamCode;
                await updateRow(TABLE_NAMES.player, { playerId: parseInt(updatedPlayer.playerId) }, updatedPlayer);
                
                location.reload();
            });
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

async function getAvailableJerseyNumbers(team, currentPlayer) {
    const allPlayers = await getAllFromTable(TABLE_NAMES.player);
    const teamPlayers = await getAllFromTable(TABLE_NAMES.playerTeams, { teamCode: team.teamCode });
    const retiredNumbers = await getAllFromTable(TABLE_NAMES.retiredNumbers, { teamCode: team.teamCode });
    const takenNumbers = [];
    for(let i = 0; i < teamPlayers.length; ++i) {
        const player = allPlayers.filter(function (p) {
            return p.playerId === teamPlayers[i].playerId;
        })[0];
        if(player.jerseyNumber === currentPlayer.jerseyNumber || player.jerseyNumber === "") {
            continue;
        }
        takenNumbers.push(parseInt(player.jerseyNumber));
    }
    for(let i = 0; i < retiredNumbers.length; ++i) {
        takenNumbers.push(parseInt(retiredNumbers[i].jerseyNumber));
    }

    const availableNumbers = {};
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