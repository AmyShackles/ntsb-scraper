const puppeteer = require("puppeteer");
const { urls } = require("./airplaneNTSBnumbers");
const fs = require("fs");

const commandLineArguments = process.argv.slice(2);
const fileName = commandLineArguments[0];
const reportNumberIndexStart = commandLineArguments[1];
const reportNumberIndexEnd = commandLineArguments[2];
const reportNumbers = urls.slice(reportNumberIndexStart, reportNumberIndexEnd);

class Crawler {
  constructor() {}

  crawl() {
    (async () => {
      console.log("running");
      const browser = await puppeteer.launch({ timeout: 0 });
      const page = await browser.newPage();
      for (const reportNumber of reportNumbers) {
        const url = `https://www.asias.faa.gov/apex/f?p=100:18:::NO::AP_BRIEF_RPT_VAR:${reportNumber}`;
        console.log(url);
        try {
          await page.goto(url);
          fs.writeFileSync(fileName, JSON.stringify(await this.execute(page)), {
            flag: "a",
          });
        } catch (err) {
          await browser.close();
          console.error(error);
        }
      }
      await browser.close();
    })();
  }

  async execute(page) {
    const t = await page.evaluate((sel) => {
      const tables = document.querySelectorAll("table");
      let parsedJSON = {};
      tables.forEach((table) => {
        const labels = Array.from(
          table.querySelectorAll("#td_shade")
        ).map((e) =>
          e.textContent.trim().replace("\n", "").replace(/\s/g, "_")
        );
        const values = Array.from(
          table.querySelectorAll("#td_noshade")
        ).map((e) => e.textContent.replace("\n", ""));

        if (table.previousElementSibling.textContent.startsWith("Aircraft")) {
          const value = labels
            .map((v, i) => [v, i])
            .reduce((acc, [v, i]) => {
              acc[v] = values[i];
              return acc;
            }, {});
          parsedJSON[
            table.previousElementSibling.textContent.trim().replace(/\s/g, "_")
          ] = value;
        } else {
          labels
            .map((v, i) => [v, i])
            .forEach(([v, i]) => {
              parsedJSON[v] = values[i];
            });
        }
      });
      const remarks = document.querySelectorAll("#narr_text");
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
    });
    return t;
  }
}
console.log("started");

new Crawler().crawl();
