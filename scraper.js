const puppeteer = require("puppeteer");

const url =
  "https://www.asias.faa.gov/apex/f?p=100:17:::NO::AP_BRIEF_RPT_VAR:CEN20LA412";

class Crawler {
  constructor() {
    this.url = url;
  }

  crawl() {
    (async () => {
      console.log(await this.execute());
    })();
  }

  async execute() {
    console.log("running");
    const browser = await puppeteer.launch({ dumpio: true });
    const page = await browser.newPage();
    await page.goto(this.url);
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
    await browser.close();
    return t;
  }
}
console.log("started");

new Crawler(url).crawl();
