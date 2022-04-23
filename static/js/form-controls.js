async function getDropdownOptions(tableName, keyId, valId) {
    const allRows = await getAllFromTable(tableName);
    const options = Object.assign({}, ...allRows.map(t => ({ [t[keyId]]: t[valId] })));
    return options;
}

function appendLabel(id, labelVal, row) {
    const labelDiv = document.createElement("div");
    labelDiv.className = "col-sm-5";
    
    const label = document.createElement("label");
    label.htmlFor = id;
    label.className = "col-form-label";
    label.innerText = labelVal;
    
    labelDiv.appendChild(label);
    row.appendChild(labelDiv);
}

function appendDropdownRow(form, obj, id, options, labelVal) {
    const row = document.createElement("div");
    row.className = "row g-3 align-items-center";

    appendLabel(id, labelVal, row);

    const inputDiv = document.createElement("div");
    inputDiv.className = "col-sm-7";

    const select = document.createElement("select");
    select.id = id;
    select.dataset.originalVal = obj[id];
    select.dataset.inputType = "dropdown";
    select.classList = "form-select";
    select.required = true;
  
    replaceDropdownOptions(select, options, obj[id]);

    select.addEventListener("change", function() {
        document.getElementById("edit-player-form").classList.add("was-validated");
    });

    inputDiv.appendChild(select);
    row.appendChild(inputDiv);
    row.classList += " row-narrow";
    form.appendChild(row);
}

function replaceDropdownOptions(select, options, currentVal) {
    select.innerHTML = "";
    for(let [optionValue, optionText] of Object.entries(options)) {
        const option = document.createElement("option");
        option.value = optionValue;
        option.innerText = optionText;
        if(optionValue == currentVal) {
            option.selected = true;
        }
        select.appendChild(option);
    }
}

function appendInputRow(form, obj, id, type, labelVal="") {
    const input = document.createElement("input");
    input.type = type;
    input.id = id;
    input.dataset.originalVal = obj[id];
    input.dataset.inputType = type;
    input.required = true;

    let row;
    if(type === "hidden") {
        input.value = obj[id];
        row = input;
    } else {
        row = document.createElement("div");
        row.className = "row g-3 align-items-center";

        appendLabel(id, labelVal, row);

        const inputDiv = document.createElement("div");
        inputDiv.className = "col-sm-7";
        input.classList = "form-control";
        if(type === "date") {
            input.type = "text";
            input.dataset.provide = "datepicker";
        }
        input.value = obj[id];
        input.addEventListener("change", function() {
            document.getElementById("edit-player-form").classList.add("was-validated");
        });

        inputDiv.appendChild(input);
        
        row.appendChild(inputDiv);
    }
    
    row.classList += " row-narrow";
    form.appendChild(row);
}

function appendTextRow(form, obj, id, labelVal) {
    appendInputRow(form, obj, id, "text", labelVal);
}

function appendHiddenRow(form, obj, id) {
    appendInputRow(form, obj, id, "hidden");
}

function appendNumberRow(form, obj, id, labelVal) {
    appendInputRow(form, obj, id, "number", labelVal);
}

function appendDateRow(form, obj, id, labelVal) {
    appendInputRow(form, obj, id, "date", labelVal);
}