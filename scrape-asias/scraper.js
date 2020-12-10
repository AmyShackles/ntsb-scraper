const fs = require("fs");
const { JSDOM } = require("jsdom");

async function convertToJSON(directoryPath, jsonFileName) {
  const dir = await fs.promises.opendir(directoryPath);
  for await (const file of dir) {
    const fileName = file.name;
    const page = fs.readFileSync(`${directoryPath}/${fileName}`).toString();
    fs.writeFileSync(jsonFileName, JSON.stringify(await scrape(page)), {
      flag: "a",
    });
  }
}

async function scrape(page) {
  const dom = (new JSDOM(page)).window.document;
  const tables = dom.querySelectorAll("table");
  let parsedJSON = {};
  tables.forEach((table) => {
    const labels = Array.from(table.querySelectorAll("#td_shade")).map((e) =>
      e.textContent.trim().replace("\n", "").replace(/\s/g, "_")
    );
    const values = Array.from(table.querySelectorAll("#td_noshade")).map((e) =>
      e.textContent.trim().replace("\n", "")
    );

    if (table.previousElementSibling.textContent.startsWith("Aircraft")) {
      const value = labels
        .map((v, i) => [v, i])
        .reduce((acc, [v, i]) => {
          let current = values[i];
          if (!isNaN(current) && !isNaN(parseFloat(current))) {
            current = +current;
          }
          acc[v] = current;
          return acc;
        }, {});
      parsedJSON[
        table.previousElementSibling.textContent.trim().replace(/\s/g, "_")
      ] = value;
    } else {
      labels
        .map((v, i) => [v, i])
        .forEach(([v, i]) => {
          let current = values[i];
          if (!isNaN(current) && !isNaN(parseFloat(current))) {
            current = +current;
          }
          parsedJSON[v] = current;
        });
    }
  });
  const remarks = dom.querySelectorAll("#narr_text");
  remarks.forEach((remark) => {
    let title;
    if (remark.previousElementSibling.textContent) {
      title = remark.previousElementSibling.textContent
        .trim()
        .replace(/\s/g, "_");
    } else if (
      remark.previousElementSibling.previousElementSibling.textContent
    ) {
      title = remark.previousElementSibling.previousElementSibling.textContent
        .trim()
        .replace(/\s/g, "_");
    } else if (
      remark.previousElementSibling.previousElementSibling
        .previousElementSibling.textContent
    ) {
      title = remark.previousElementSibling.previousElementSibling.previousElementSibling.textContent
        .trim()
        .replace(/\s/g, "_");
    }
    parsedJSON[title] = remark.textContent.replace(/\n/g, "");
  });
  return parsedJSON;
}

const commandLineArguments = process.argv.slice(2);
const directory = commandLineArguments[0];
const jsonFileName = commandLineArguments[1];

convertToJSON(directory, jsonFileName);
