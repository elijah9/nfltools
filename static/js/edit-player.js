async function initEditPlayer() {
    const form = document.getElementById("form-rows");
    const playerId = document.getElementById("player-id").value;
    const player = await getSingleFromTable(TABLE_NAMES.player, { playerId: parseInt(playerId) });
    const currentPlayerTeam = await getSingleFromTable(TABLE_NAMES.playerTeams, { playerId: parseInt(playerId) });

    const teamOptions = await getDropdownOptions(TABLE_NAMES.team, "teamCode", "fullName");
    const positionOptions = await getDropdownOptions(TABLE_NAMES.position, "positionCode", "fullName");
    const collegeOptions = await getDropdownOptions(TABLE_NAMES.college, "collegeName", "collegeName");
    const numberOptions = await getAvailableJerseyNumbers(currentPlayerTeam, player);
    const heightOptions = getHeightOptions();
    const draftClassOptions = getDraftClassOptions(2022);

    // TODO: too many parameters in here, clean up somehow
    appendInputRow(form, "firstName", player.firstName, "text", "first name");
    appendInputRow(form, "lastName", player.lastName, "text", "last name");
    appendDropdownRow(form, "teamCode", currentPlayerTeam.teamCode, teamOptions, "team");
    appendDropdownRow(form, "position", player.position, positionOptions, "position");
    appendDropdownRow(form, "jerseyNumber", player.jerseyNumber, numberOptions, "jersey number");
    appendDropdownRow(form, "height", player.height, heightOptions, "height");
    appendInputRow(form, "weight", player.weight, "number", "weight");
    appendInputRow(form, "birthDate", player.birthDate, "date", "birth date");
    appendDropdownRow(form, "firstYear", player.firstYear, draftClassOptions, "draft class");
    appendDropdownRow(form, "college", player.college, collegeOptions, "college");

    document.getElementById("reset").addEventListener("click", async function () {
        await resetEditPlayerForm();
    });

    document.getElementById("edit-player-form").style.display = "table";
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
    const teamPlayers = await getAllFromTable(TABLE_NAMES.playerTeams, { teamCode: team.teamCode });
    const retiredNumbers = await getAllFromTable(TABLE_NAMES.retiredNumbers, { teamCode: team.teamCode });
    const takenNumbers = [];
    for(let i = 0; i < teamPlayers.length; ++i) {
        const player = await getSingleFromTable(TABLE_NAMES.player, { playerId: teamPlayers[i].playerId });
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

async function getDropdownOptions(tableName, keyId, valId) {
    const allRows = await getAllFromTable(tableName);
    const options = Object.assign({}, ...allRows.map(t => ({ [t[keyId]]: t[valId] })));
    return options;
}

function appendDropdownRow(form, id, val, options, labelVal) {
    const row = document.createElement("div");
    row.className = "row g-3 align-items-center";

    const labelDiv = document.createElement("div");
    labelDiv.className = "col-sm-5";

    const label = document.createElement("label");
    label.htmlFor = id;
    label.className = "col-form-label";
    label.innerText = labelVal;
    labelDiv.appendChild(label);
    row.appendChild(labelDiv);

    const inputDiv = document.createElement("div");
    inputDiv.className = "col-sm-7";

    const select = document.createElement("select");
    select.id = id;
    select.dataset.originalVal = val;
    select.classList = "form-select";

    for(let [optionValue, optionText] of Object.entries(options)) {
        const option = document.createElement("option");
        option.value = optionValue;
        option.innerText = optionText;
        if(optionValue == val) {
            option.selected = true;
        }
        select.appendChild(option);
    }

    inputDiv.appendChild(select);
    row.appendChild(inputDiv);
    row.classList += " row-narrow";
    form.appendChild(row);
}

function appendInputRow(form, id, val, type, labelVal="") {
    const input = document.createElement("input");
    input.type = type;
    input.id = id;
    input.dataset.originalVal = val;

    let row;
    if(type === "hidden") {
        input.value = val;
        row = input;
    } else {
        row = document.createElement("div");
        row.className = "row g-3 align-items-center";

        const labelDiv = document.createElement("div");
        labelDiv.className = "col-sm-5";

        const label = document.createElement("label");
        label.htmlFor = id;
        label.className = "col-form-label";
        label.innerText = labelVal;
        labelDiv.appendChild(label);
        row.appendChild(labelDiv);

        const inputDiv = document.createElement("div");
        inputDiv.className = "col-sm-7";
        input.classList = "form-control";
        if(type === "date") {
            input.type = "text";
            input.dataset.provide = "datepicker";
        }
        input.value = val;
        inputDiv.appendChild(input);
        
        row.appendChild(inputDiv);
    }
    
    row.classList += " row-narrow";
    form.appendChild(row);
}