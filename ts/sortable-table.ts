// taken from https://codepen.io/dcode-software/pen/zYGOrzK
// modified to handle multiple data types

/**
 * Sorts a HTML table.
 * 
 * @param {HTMLTableElement} table The table to sort
 * @param {number} column The index of the column to sort
 * @param {string} colType String representing data type of column
 * @param {boolean} asc Determines if the sorting will be in ascending
 */
 function sortTableByColumn(table : HTMLTableElement, column : number, 
    colType : string = "str", asc : boolean = true) {

    const dirModifier : number = asc ? 1 : -1;
    const tBody : HTMLTableSectionElement = table.tBodies[0];
    const rows : HTMLTableRowElement[] = Array.from(tBody.querySelectorAll("tr"));

    // Sort each row
    const sortedRows : HTMLTableRowElement[] = rows.sort((a : HTMLTableRowElement, b : HTMLTableRowElement) => {
        const aColText : string = a.querySelector(`td:nth-child(${ column + 1 })`).textContent.trim();
        const bColText : string = b.querySelector(`td:nth-child(${ column + 1 })`).textContent.trim();

        let comparison : boolean;
        switch(colType) {
            case "str":
                comparison = aColText > bColText
                break;
            case "int":
                const aInt : number = parseInt(aColText);
                const bInt : number = parseInt(bColText);
                if(isNaN(aInt) && !isNaN(bInt)) {
                    comparison = false;
                } else if(!isNaN(aInt) && isNaN(bInt)) {
                    comparison = true;
                } else if(isNaN(aInt) && isNaN(bInt)) {
                    comparison = false;
                } else if(!isNaN(aInt) && !isNaN(bInt)) {
                    comparison = aInt > bInt;
                }
                break;
            case "date":
                const isValidDate = function(d : any) : boolean {
                    const isDate : boolean = d instanceof Date;
                    return isDate && !isNaN(d);
                };
                const aDate = new Date(aColText);
                const bDate = new Date(bColText);
                if(!isValidDate(aDate) && isValidDate(bDate)) {
                    comparison = true;
                } else if(isValidDate(aDate) && !isValidDate(bDate)) {
                    comparison = false;
                } else if(!isValidDate(aDate) && !isValidDate(bDate)) {
                    comparison = false;
                } else if(isValidDate(aDate) && isValidDate(bDate)) {
                    comparison = aDate > bDate;
                }
                break;
            case "height":
                const isValidHeight = function(h : string[], feet : number, inches : number) : boolean {
                    if(h.length == 2) {
                        return !isNaN(feet) && !isNaN(inches);
                    }
                    return false;
                }
                
                const aSplit : string[] = aColText.split("-");
                const aFeet : number = parseInt(aSplit[0]);
                const aInches : number = parseInt(aSplit[1]);
                const bSplit : string[] = bColText.split("-");
                const bFeet : number = parseInt(bSplit[0]);
                const bInches : number = parseInt(bSplit[1]);
                if(!isValidHeight(aSplit, aFeet, aInches) && isValidHeight(bSplit, bFeet, bInches)) {
                    comparison = false;
                } else if(isValidHeight(aSplit, aFeet, aInches) && !isValidHeight(bSplit, bFeet, bInches)) {
                    comparison = true;
                } else if(!isValidHeight(aSplit, aFeet, aInches) && !isValidHeight(bSplit, bFeet, bInches)) {
                    comparison = false;
                } else if(isValidHeight(aSplit, aFeet, aInches) && isValidHeight(bSplit, bFeet, bInches)) {
                    if(aFeet > bFeet) {
                        comparison = true;
                    } else if(aFeet < bFeet) {
                        comparison = false;
                    } else if(aFeet == bFeet) {
                        comparison = aInches > bInches;
                    }
                }
                break;
        }

        return comparison ? (1 * dirModifier) : (-1 * dirModifier);
    });

    // Remove all existing TRs from the table
    while (tBody.firstChild) {
        tBody.removeChild(tBody.firstChild);
    }

    // Re-add the newly sorted rows
    tBody.append(...sortedRows);

    // Remember how the column is currently sorted
    table.querySelectorAll("th").forEach(th => th.classList.remove("th-sort-asc", "th-sort-desc"));
    table.querySelector(`th:nth-child(${ column + 1})`).classList.toggle("th-sort-asc", asc);
    table.querySelector(`th:nth-child(${ column + 1})`).classList.toggle("th-sort-desc", !asc);
}

document.querySelectorAll(".table-sortable th").forEach((headerCell : HTMLElement) => {
    headerCell.addEventListener("click", () => {
        const tableElement = <HTMLTableElement>(headerCell.parentElement.parentElement.parentElement);
        const headerIndex : number = Array.prototype.indexOf.call(headerCell.parentElement.children, headerCell);
        const colType : string = headerCell.dataset.colType;
        const currentIsAscending : boolean = headerCell.classList.contains("th-sort-asc");

        sortTableByColumn(tableElement, headerIndex, colType, !currentIsAscending);
    });
});
