
type SheetProperty = {
    sheetId: number,
    title: string,
    index: number,
    sheetType: "GRID",
    gridProperties: gridProperty
};

type gridProperty = {
    rowCount: number,
    columnCount: number
}

export async function getValues(range: string) {
    let key = process.env.SPREEDSHEET_KEY
    range = encodeURI(range);
    let res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/1KIDKlItOpjQIOBV2KlKQwz5M-Sb74GT1fG9_zLZlE14/values/${range}?key=${key}`);
    let content = await res.json();
    return (content.values as [])?.slice(5)
}
