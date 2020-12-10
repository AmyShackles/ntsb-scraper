const puppeteer = require("puppeteer");
const fs = require("fs");

class Crawler {
  constructor() {}

  crawl() {
    (async () => {
      console.log("running");
      const browser = await puppeteer.launch({ timeout: 0, dumpio: true });
      const page = await browser.newPage();
      // Initial pass-through failed after saving 4048 pages
      // Subsequent run was targeting "https://www.ntsb.gov/_layouts/ntsb.aviation/Results.aspx?queryId=f740a81b-49ec-4d07-9aae-2d5ada9fd528"
      // in order to acquire accidents that occurred between the first record in the database and 12/07/1988
      console.log(
        "https://www.ntsb.gov/_layouts/ntsb.aviation/Results.aspx?queryId=b5ef3f68-8275-4b3f-9c3b-0bfdd1da64d2"
      );
      await page.goto(
        "https://www.ntsb.gov/_layouts/ntsb.aviation/Results.aspx?queryId=b5ef3f68-8275-4b3f-9c3b-0bfdd1da64d2"
      );
      let fileName = 1;
      const firstPage = await page.content();
      fs.writeFileSync(`./ntsb-data2/${fileName}.html`, firstPage);
      try {
        let next;
        while (
          (next = await page.evaluate(() => {
            const totalPages = document.querySelector(
              "div.rgInfoPart strong:nth-child(2)"
            ).textContent;
            let currentPage = document.querySelector("a.rgCurrentPage")
              .textContent;
            if (+currentPage < +totalPages) {
              return true;
            }
          }))
        ) {
          await Promise.all([
            page.waitForNavigation(), // The promise resolves after navigation has finished
            page.click("div.rgArrPart2 input.rgPageNext"), // Clicking the link will indirectly cause a navigation
          ]);
          ++fileName;
          console.log("currentPage ", fileName, " out of 2122");
          let curr = await page.content();
          fs.writeFileSync(`./ntsb-data2/${fileName}.html`, curr);
        }
      } catch (err) {
        console.log("ERROR", err);
      }
      await browser.close();
    })();
  }
}

console.log("started");

new Crawler().crawl();
