async function initEditPlayer() {
    const form = document.getElementById("form-rows");
    const playerId = document.getElementById("player-id").value;
    const player = await getSingleFromTable(TABLE_NAMES.player, { playerId: parseInt(playerId) });
    const currentPlayerTeam = await getSingleFromTable(TABLE_NAMES.playerTeams, { playerId: parseInt(playerId) });
    const allTeams = await getAllFromTable(TABLE_NAMES.team);
    const allTeamCodes = Object.assign({}, ...allTeams.map(t => ({[t.teamCode]: t.fullName})));
    const currentTeamCode = currentPlayerTeam.teamCode;

    appendInputRow(form, "firstName", player.firstName, "text", "first name");
    appendInputRow(form, "lastName", player.lastName, "text", "last name");
    appendInputRow(form, "teamCode", currentTeamCode, "dropdown", "team", allTeamCodes);
    appendInputRow(form, "jerseyNumber", player.jerseyNumber, "number", "jersey number");
    appendInputRow(form, "birthDate", player.birthDate, "date", "birth date");

    console.log(player);

    document.getElementById("reset").addEventListener("click", async function () {
        await resetEditPlayerForm();
    });
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

function appendInputRow(form, id, val, type, labelVal="", options=null) {
    let input;
    if(type !== "dropdown") {
        input = document.createElement("input");
        input.type = type;
        input.id = id;
        input.dataset.originalVal = val;
    }

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
        if(type === "dropdown") {
            const select = document.createElement("select");
            select.id = id;
            select.dataset.originalVal = val;
            select.classList = "form-select";

            for(let [optionValue, optionText] of Object.entries(options)) {
                const option = document.createElement("option");
                option.value = optionValue;
                option.innerText = optionText;
                if(optionValue === val) {
                    option.selected = true;
                }
                select.appendChild(option);
            }

            inputDiv.appendChild(select);
        } else {
            input.classList = "form-control";
            if(type === "date") {
                input.type = "text";
                input.dataset.provide = "datepicker";
            }
            input.value = val;
            inputDiv.appendChild(input);
        }
        
        row.appendChild(inputDiv);
    }
    
    row.classList += " row-narrow";
    form.appendChild(row);
}