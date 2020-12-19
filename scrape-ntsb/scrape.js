const fs = require("fs");
const { JSDOM } = require("jsdom");

async function convertToJSON(directoryPath, jsonFileName) {
  const dir = await fs.promises.opendir(directoryPath);
  let current = 1;
  for await (const file of dir) {
    const fileName = file.name;
    console.log(current++);
    const page = fs.readFileSync(`${directoryPath}/${fileName}`).toString();
    await scrape(page, jsonFileName);
  }
}

async function scrape(page, jsonFileName) {
  const dom = new JSDOM(page).window.document;
  const reports = [
    ...dom.querySelectorAll("table tr.rgRow, table tr.rgAltRow"),
  ].map((a) => [...a.children].map((b) => b.innerHTML));

  function getReports(string) {
    let regex = /(?:(?<=Final Report <a href=")(?<Final_Report_PDF>.*?)">PDF<\/a> \| <a href="(?<Final_Report_HTML>.*?) target="_blank" "="">HTML<\/a> <p><a href="(?<Data_Summary>.*?)")|<a href="(?<Foreign>.*?)" target="_blank">Foreign<\/a>|(?<=Factual Report <a href=")(?<Factual_Report_PDF>.*?)">PDF<\/a> \| <a href="(?<Factual_Report_HTML>.*?)|(?<=Preliminary Report <a href=")(?<Preliminary_Report_PDF>.*?)">PDF<\/a> \| <a href="(?<Preliminary_Report_HTML>.*?)/;
    let files = {};
    let { groups } = string.match(regex);
    const {
      Final_Report_PDF,
      Final_Report_HTML,
      Foreign,
      Factual_Report_PDF,
      Factual_Report_HTML,
      Preliminary_Report_PDF,
      Preliminary_Report_HTML,
    } = groups;
    files = {
      ...(Final_Report_PDF && {
        Final_Report_PDF: decodeURIComponent(Final_Report_PDF),
      }),
      ...(Final_Report_HTML && {
        Final_Report_HTML: decodeURIComponent(Final_Report_HTML),
      }),
      ...(Foreign && {
        Foreign:
          "https://www.ntsb.gov/_layouts/ntsb.aviation/" +
          decodeURIComponent(Foreign),
      }),
      ...(Factual_Report_PDF && {
        Factual_Report_PDF: decodeURIComponent(Factual_Report_PDF),
      }),
      ...(Factual_Report_HTML && {
        Factual_Report_HTML: decodeURIComponent(Factual_Report_HTML),
      }),
      ...(Preliminary_Report_PDF && {
        Preliminary_Report_PDF: decodeURIComponent(Preliminary_Report_PDF),
      }),
      ...(Preliminary_Report_HTML && {
        Preliminary_Report_HTML: decodeURIComponent(Preliminary_Report_HTML),
      }),
    };
    return files;
  }
  reports.forEach(
    ([
      Estimated_Report_Publish_Dates,
      Reports,
      Event_Date,
      Location,
      Make_Model,
      Registration_Number,
      NTSB_Number,
      EventSeverity,
      Type_Of_Air_Carrier_Operation_And_Carrier_Name,
    ]) => {
      console.log({ NTSB_Number });
      fs.writeFileSync(
        jsonFileName,
        JSON.stringify({
          Estimated_Report_Publish_Dates,
          ...getReports(Reports),
          Event_Date: new Date(Event_Date),
          Location,
          Make_Model,
          Registration_Number,
          NTSB_Number,
          EventSeverity,
          Type_Of_Air_Carrier_Operation_And_Carrier_Name,
        }),
        {
          flag: "a",
        }
      );
    }
  );
}

const commandLineArguments = process.argv.slice(2);
const directory = commandLineArguments[0];
const jsonFileName = commandLineArguments[1];

convertToJSON(directory, jsonFileName);
