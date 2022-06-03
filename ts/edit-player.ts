import { appendDateRow, appendDropdownRow, appendNumberRow, appendTextRow, getDropdownOptions, replaceDropdownOptions } from './form-controls';
import { TABLE_NAMES, getAllFromTable, deleteRows, getSingleFromTable, updateRow, writeToTable } from "./idb-utils";
import { isEmptyOrSpaces, showLoadingIndicator } from './common';
import { AssignablePlayer, Player, PlayerTeam, Position, RetiredNumber } from './data-models';

export default async function initEditPlayer() {
    await showLoadingIndicator(initEditPlayerWork);
}

async function initEditPlayerWork() {
    const rows : HTMLElement = document.getElementById("form-rows");
    
    const teamOptions : { [val : string] : string } = await getDropdownOptions(TABLE_NAMES.team, "teamCode", "fullName");
    const positionOptions : { [val : string] : string } = await getDropdownOptions(TABLE_NAMES.position, "positionCode", "fullName");
    const collegeOptions : { [val : string] : string } = await getDropdownOptions(TABLE_NAMES.college, "collegeName", "collegeName");
    const heightOptions  : { [val : string] : string } = getHeightOptions();
    const draftClassOptions : { [val : string] : string } = getDraftClassOptions(2022);

    let player : AssignablePlayer;
    const playerId : string = (<HTMLInputElement>document.getElementById("playerId")).value;
    if(isEmptyOrSpaces(playerId)) {
        // creating new player
        player = {
            firstName: "",
            lastName: "",
            teamCode: Object.keys(teamOptions)[0],
            position: Object.keys(positionOptions)[0],
            height: Object.keys(heightOptions)[0],
            weight: 0,
            firstYear: parseInt(Object.keys(draftClassOptions)[0]),
            college: Object.keys(collegeOptions)[0],

            // these should be uninitialized
            playerId: null,
            jerseyNumber: null,
            birthDate: null,
            avRating: null
        };
    } else {
        // editing existing player
        player = await getSingleFromTable<Player>(TABLE_NAMES.player.name, { playerId: playerId }) as AssignablePlayer;
        const currentPlayerTeam : PlayerTeam = await getSingleFromTable(TABLE_NAMES.playerTeams.name, { playerId: playerId });
        player.teamCode = currentPlayerTeam.teamCode;

        // show delete button
        document.getElementById("delete-button").style.display = "inline-block";
    }

    // TODO: too many parameters in here, clean up somehow
    appendTextRow(rows, player, "firstName", "first name");
    appendTextRow(rows, player, "lastName", "last name");
    appendDropdownRow(rows, player, "teamCode", teamOptions, "team");
    appendDropdownRow(rows, player, "position", positionOptions, "position");
    const numberOptions : { [n : string] : string } = await getAvailableJerseyNumbers(player);
    appendDropdownRow(rows, player, "jerseyNumber", numberOptions, "jersey number");
    appendDropdownRow(rows, player, "height", heightOptions, "height");
    appendNumberRow(rows, player, "weight", "weight");
    appendDateRow(rows, player, "birthDate", "birth date");
    appendDropdownRow(rows, player, "firstYear", draftClassOptions, "draft class");
    appendDropdownRow(rows, player, "college", collegeOptions, "college");

    document.getElementById("teamCode").addEventListener("change", async function () {
        player.teamCode = (document.getElementById("teamCode") as HTMLInputElement).value;
        await refreshAvailableJerseyNumbers(player);
    });

    document.getElementById("position").addEventListener("change", async function () {
        player.position = (document.getElementById("position") as HTMLInputElement).value;
        await refreshAvailableJerseyNumbers(player);
    });

    document.getElementById("reset-button").addEventListener("click", resetEditPlayerForm);
    document.getElementById("delete-button").addEventListener("click", promptDeletePlayer);
    document.getElementById("confirm-delete-button").addEventListener("click", deletePlayer);
    document.getElementById("cancel-delete-button").addEventListener("click", cancelDeletePlayer);

    const form = document.getElementById("edit-player-form") as HTMLFormElement;
    form.addEventListener("submit", async function (e : SubmitEvent) {
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

async function refreshAvailableJerseyNumbers(player : AssignablePlayer) {
    const newAvailableNumbers : { [n : string] : string } = await getAvailableJerseyNumbers(player);
    const numberSelect = document.getElementById("jerseyNumber") as HTMLSelectElement;
    replaceDropdownOptions(numberSelect, newAvailableNumbers, numberSelect.value);
}

async function resetEditPlayerForm() {
    const allInputs : NodeListOf<HTMLInputElement> = document.querySelectorAll("#form-rows input");
    for(let i = 0; i < allInputs.length; ++i) {
        const input : HTMLInputElement = allInputs[i];
        input.value = input.dataset.originalVal;
    }

    const allSelects : NodeListOf<HTMLSelectElement> = document.querySelectorAll("#form-rows select");
    for(let i = 0; i < allSelects.length; ++i) {
        const select : HTMLSelectElement = allSelects[i];
        select.value = select.dataset.originalVal;
    }
}

async function submitEditPlayerForm() {
    const updatedPlayer : AssignablePlayer = getPlayerFromForm();

    if(isEmptyOrSpaces(updatedPlayer.playerId)) {
        // creating new player

        // calculate new playerId
        // TODO: would be ideal if highest suffix for prefix could be found
        //       because lots of players with 00/01 prefixes are retired
        //       and would clash if we decided to bring in historical data
        let newPlayerIdSuffix = 0;
        let newPlayerId : string;
        while(!newPlayerId) {
            const possibleId = updatedPlayer.lastName.slice(0, 4) + updatedPlayer.firstName.slice(0, 2) 
                + String(newPlayerIdSuffix).padStart(2, '0');

            const idConflict : Player = await getSingleFromTable(TABLE_NAMES.player.name, { playerId: possibleId });
            if(idConflict) {
                ++newPlayerIdSuffix;
            } else {
                newPlayerId = possibleId;
            }
        }
        updatedPlayer.playerId = newPlayerId;

        // create playerTeam
        const updatedTeam : PlayerTeam = { 
            playerId: updatedPlayer.playerId,
            teamCode: updatedPlayer.teamCode
        };
        await writeToTable(TABLE_NAMES.playerTeams.name, updatedTeam);

        // create player
        delete updatedPlayer.teamCode;
        await writeToTable(TABLE_NAMES.player.name, updatedPlayer);
    } else {
        // updating existing player

        // update playerTeam if applicable
        const originalTeam : string = document.getElementById("teamCode").dataset.originalVal;
        if(updatedPlayer.teamCode !== originalTeam) {
            const updatedTeam : PlayerTeam = { 
                playerId: updatedPlayer.playerId,
                teamCode: updatedPlayer.teamCode
            };
            await updateRow(TABLE_NAMES.playerTeams.name, { playerId: updatedPlayer.playerId }, updatedTeam);
        }
        
        // submit to db
        delete updatedPlayer.teamCode;
        await updateRow(TABLE_NAMES.player.name, { playerId: updatedPlayer.playerId }, updatedPlayer);
    }

    redirectToRoster(updatedPlayer);
}

function getPlayerFromForm() : AssignablePlayer {
    // create updated player
    const updatedPlayer = new AssignablePlayer();
    const allInputs : NodeListOf<HTMLInputElement | HTMLSelectElement> = document.querySelectorAll("input, select");
    for(let i = 0; i < allInputs.length; ++i) {
        const input : HTMLInputElement | HTMLSelectElement = allInputs[i];
        let inputVal : any = input.value;
        if(input.dataset.inputType === "number") {
            inputVal = parseInt(inputVal);
        }
        updatedPlayer[input.id] = inputVal;
    }
    return updatedPlayer;
}

async function getAvailableJerseyNumbers(currentPlayer : AssignablePlayer) 
    : Promise<{ [id : string] : string }> {

    const currentPosCode : string = (document.getElementById("position") as HTMLSelectElement).value;
    const allPositions : Position[] = await getAllFromTable(TABLE_NAMES.position.name);
    const currentPos : Position = allPositions.filter(function (p : Position) { return p.positionCode === currentPosCode; })[0];
    const currentUnit : string = currentPos.unit;
    const allPlayers : Player[] = await getAllFromTable(TABLE_NAMES.player.name);
    const teamPlayers : PlayerTeam[] = await getAllFromTable(TABLE_NAMES.playerTeams.name, { teamCode: currentPlayer.teamCode });
    const retiredNumbers : RetiredNumber[] = await getAllFromTable(TABLE_NAMES.retiredNumbers.name, { teamCode: currentPlayer.teamCode });
    const takenNumbers : string[] = [];
    for(let i = 0; i < teamPlayers.length; ++i) {
        const player : Player = allPlayers.filter(function (p : Player) {
            return p.playerId === teamPlayers[i].playerId;
        })[0];
        const unit : string = allPositions.filter(function(p : Position) {
            return p.positionCode === player.position;
        })[0].unit;

        // check if player's jersey number is blank
        if(isEmptyOrSpaces(player.jerseyNumber.toString())
            // otherwise, allow if the edited player already has this number
            || player.jerseyNumber === currentPlayer.jerseyNumber 
            // also allow if player is on a different unit
            || unit !== currentUnit) {
            continue;
        }
        takenNumbers.push(player.jerseyNumber);
    }

    for(let i = 0; i < retiredNumbers.length; ++i) {
        takenNumbers.push(retiredNumbers[i].jerseyNumber);
    }

    const availableNumbers : { [id : string] : string } = {};
    for(let i = 1; i < 100; ++i) {
        if(!takenNumbers.includes(i.toString())) {
            availableNumbers[i.toString()] = i.toString();
        }
    }

    return availableNumbers;
}

function getHeightOptions() : { [id : string] : string } {
    const options : { [ id : string ] : string } = {};
    // allow 5-7 feet
    for(let i = 5; i < 8; ++i) {
        // allow 0-11 inches
        for(let j = 0; j < 12; ++j) {
            const height = `${i}-${j}`;
            options[height] = height;
        }
    }
    return options;
}

function getDraftClassOptions(maxYear : number) : { [ id : string ] : string } {
    const options : { [ id : string ] : string } = {};
    for(let i = 1920; i <= maxYear; ++i) {
        options[i.toString()] = i.toString();
    }
    return options;
}

function promptDeletePlayer() {
    document.getElementById("delete-prompt").style.display = "block";
    document.getElementById("form-buttons").style.display = "none";
}

async function deletePlayer() {
    document.getElementById("delete-prompt").style.display = "none";

    const player : Player = getPlayerFromForm();
    await deleteRows(TABLE_NAMES.player.name, { playerId: player.playerId });
    await deleteRows(TABLE_NAMES.playerTeams.name, { playerId: player.playerId });

    redirectToRoster(player);
}

async function cancelDeletePlayer() {
    document.getElementById("delete-prompt").style.display = "none";
    document.getElementById("form-buttons").style.display = "block";
}

function redirectToRoster(player : Player) {
    const hrefTemplate : string = (document.getElementById("playersHref") as HTMLAnchorElement).href;
    const teamCode : string = (document.getElementById("teamCode") as HTMLSelectElement).value;
    const a : HTMLAnchorElement = document.createElement("a");
    a.href = hrefTemplate.replace("$team", teamCode).replace("$pos", player.position);
    a.click();
}