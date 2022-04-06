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
 function sortTableByColumn(table, column, colType = "str", asc = true) {
    const dirModifier = asc ? 1 : -1;
    const tBody = table.tBodies[0];
    const rows = Array.from(tBody.querySelectorAll("tr"));

    // Sort each row
    const sortedRows = rows.sort((a, b) => {
        const aColText = a.querySelector(`td:nth-child(${ column + 1 })`).textContent.trim();
        const bColText = b.querySelector(`td:nth-child(${ column + 1 })`).textContent.trim();

        let comparison;
        switch(colType) {
            case "str":
                comparison = aColText > bColText
                break;
            case "int":
                const aInt = parseInt(aColText);
                const bInt = parseInt(bColText);
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
                const isValidDate = function(d) {
                    return d instanceof Date && !isNaN(d);
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
                const isValidHeight = function(h, feet, inches) {
                    if(h.length == 2) {
                        return !isNaN(feet) && !isNaN(inches);
                    }
                    return false;
                }
                
                const aSplit = aColText.split("-");
                const aFeet = parseInt(aSplit[0]);
                const aInches = parseInt(aSplit[1]);
                const bSplit = bColText.split("-");
                const bFeet = parseInt(bSplit[0]);
                const bInches = parseInt(bSplit[1]);
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

document.querySelectorAll(".table-sortable th").forEach(headerCell => {
    headerCell.addEventListener("click", () => {
        const tableElement = headerCell.parentElement.parentElement.parentElement;
        const headerIndex = Array.prototype.indexOf.call(headerCell.parentElement.children, headerCell);
        const colType = headerCell.dataset.colType;
        const currentIsAscending = headerCell.classList.contains("th-sort-asc");

        sortTableByColumn(tableElement, headerIndex, colType, !currentIsAscending);
    });
});
