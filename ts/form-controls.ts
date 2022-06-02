import { TableName, getAllFromTable } from "./idb-utils"

export async function getDropdownOptions(tableName : TableName, keyId : string, valId : string)
    : Promise<{ [val : string] : string }> {

    const allRows : any[] = await getAllFromTable(tableName.name);
    const options : { [val : string] : string } 
        = Object.assign({}, ...allRows.map(t => ({ [t[keyId]]: t[valId] })));
    return options;
}

function appendLabel(id : string, labelVal : any, row : HTMLElement) {
    const labelDiv : HTMLElement = document.createElement("div");
    labelDiv.className = "col-sm-5";
    
    const label : HTMLLabelElement = document.createElement("label");
    label.htmlFor = id;
    label.className = "col-form-label";
    label.innerText = labelVal;
    
    labelDiv.appendChild(label);
    row.appendChild(labelDiv);
}

export function appendDropdownRow(form : HTMLElement, obj : object, id : string, 
    options : { [val : string] : string }, labelVal : any) {

    const row : HTMLElement = document.createElement("div");
    row.className = "row g-3 align-items-center";

    appendLabel(id, labelVal, row);

    const inputDiv : HTMLElement = document.createElement("div");
    inputDiv.className = "col-sm-7";

    const select : HTMLSelectElement = document.createElement("select");
    select.id = id;
    select.dataset.originalVal = obj[id];
    select.dataset.inputType = "dropdown";
    select.setAttribute("class", "form-select");
    select.required = true;
  
    replaceDropdownOptions(select, options, obj[id]);

    select.addEventListener("change", function() {
        document.getElementById("edit-player-form").classList.add("was-validated");
    });

    inputDiv.appendChild(select);
    row.appendChild(inputDiv);
    row.classList.add("row-narrow");
    form.appendChild(row);
}

export function replaceDropdownOptions(select : HTMLSelectElement, 
    options : { [val : string] : string }, currentVal : any) {

    select.innerHTML = "";
    for(let [optionValue, optionText] of Object.entries(options)) {
        const option : HTMLOptionElement = document.createElement("option");
        option.value = optionValue;
        option.innerText = optionText;
        if(optionValue == currentVal) {
            option.selected = true;
        }
        select.appendChild(option);
    }
}

function appendInputRow(form : HTMLElement, obj : object, id : string, type : string, labelVal : string = "") {
    const input : HTMLInputElement = document.createElement("input");
    input.type = type;
    input.id = id;
    input.dataset.originalVal = obj[id];
    input.dataset.inputType = type;
    input.required = true;

    let row : HTMLElement;
    if(type === "hidden") {
        input.value = obj[id];
        row = input;
    } else {
        row = document.createElement("div");
        row.className = "row g-3 align-items-center";

        appendLabel(id, labelVal, row);

        const inputDiv : HTMLElement = document.createElement("div");
        inputDiv.className = "col-sm-7";
        input.setAttribute("class", "form-control");
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
    
    row.classList.add("row-narrow");
    form.appendChild(row);
}

export function appendTextRow(form : HTMLElement, obj : object, id : string, labelVal : string) {
    appendInputRow(form, obj, id, "text", labelVal);
}

export function appendHiddenRow(form : HTMLElement, obj : object, id : string) {
    appendInputRow(form, obj, id, "hidden");
}

export function appendNumberRow(form : HTMLElement, obj : object, id : string, labelVal : string) {
    appendInputRow(form, obj, id, "number", labelVal);
}

export function appendDateRow(form : HTMLElement, obj : object, id : string, labelVal : string) {
    appendInputRow(form, obj, id, "date", labelVal);
}