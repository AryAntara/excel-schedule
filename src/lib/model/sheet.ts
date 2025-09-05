
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
    range = encodeURI(range);
    let res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/1KIDKlItOpjQIOBV2KlKQwz5M-Sb74GT1fG9_zLZlE14/values/${range}?key=AIzaSyAkf88_H0D-KOUqpbGDX9pMOdoBbGrk5VQ`);
    let content = await res.json();
    return (content.values ?? []).slice(5)
}

export async function getBatchValues(ranges: string[]) {
    const params = ranges.map(d => `ranges=${encodeURIComponent(d)}`).join('&');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/1KIDKlItOpjQIOBV2KlKQwz5M-Sb74GT1fG9_zLZlE14/values:batchGet?key=AIzaSyAkf88_H0D-KOUqpbGDX9pMOdoBbGrk5VQ&${params}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.valueRanges ?? [];
}

export async function isLatest(): Promise<boolean> {
    let url = 'https://www.googleapis.com/drive/v3/files/1KIDKlItOpjQIOBV2KlKQwz5M-Sb74GT1fG9_zLZlE14?key=AIzaSyAkf88_H0D-KOUqpbGDX9pMOdoBbGrk5VQ&fields=modifiedTime'
    let res = await fetch(url)
    let modifiedTime = (await res.json()).modifiedTime as string;
    let localModifiedTime = localStorage.getItem('last_modified_time') ?? '';
    let isDifferent = modifiedTime != localModifiedTime
    if (isDifferent)
        localStorage.setItem('last_modified_time', modifiedTime);

    return !isDifferent
}
