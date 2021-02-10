// run this in the console on page
// https://en.wikipedia.org/wiki/Spring_training

var getLocation = function (title) {
  // await fetch(url);
  var url = new URL("https://en.wikipedia.org/w/api.php");

  return new Promise(async (resolve, reject) => {
    const params = {
      action: "query",
      prop: "coordinates",
      titles: title,
      format: "json",
      origin: "*",
    };
    // https://github.com/github/fetch/issues/256#issuecomment-379196019
    Object.keys(params).forEach((key) => {
      url.searchParams.append(key, params[key]);
    });

    const results = await fetch(url);
    const jsonResults = await results.json();

    const key = Object.keys(jsonResults.query.pages)[0];
    const resObject = jsonResults.query.pages[key];
    if (resObject.hasOwnProperty("coordinates")) {
      resolve(resObject.coordinates[0]);
    } else {
      console.log("issue!", title, key);
      resolve(false);
    }
  });
};

const results = $(".wikitable")
  .eq(1) // change this for different table
  .find("tr")
  .get()
  .map(async function (tr) {
    if ($(tr).find("td").eq(0).find("a").text()) {
      console.log("a:", $(tr).find("td"));
      var stadiumLink = $(tr).find("td").eq(1).find("a").eq(0).attr("href");
      var location = await getLocation(
        decodeURIComponent(stadiumLink.replace("/wiki/", ""))
      );

      if (location) {
        return [
          $(tr).find("td").eq(1).find("a").eq(0).text().trim(), // stadium
          location.lat, // latitude
          location.lon, // longitude
          $(tr).find("td").eq(0).find("a").eq(0).text().trim(), // team name
          `https://en.wikipedia.org${$(tr)
            .find("td")
            .eq(1)
            .find("a")
            .eq(0)
            .attr("href")}`,
        ];
      } else {
        return [];
      }
    } else {
      // title or something
      return [];
    }
  });
const r = await Promise.all(results);

// reduce - if a stadium is duplicated, consolidate "teams"
const uniqueStadiums = new Set();
r.forEach((row) => {
  if (row[0]) {
    uniqueStadiums.add(row[0]);
  }
});

const filteredResults = Array.from(uniqueStadiums).map((stadiumName) => {
  const matchingRows = r.filter((row) => {
    return stadiumName === row[0];
  });
  const retRow = [...matchingRows[0]];
  if (matchingRows.length > 1) {
    for (let i = 1; i < matchingRows.length; i++) {
      retRow[3] = `${retRow[3]}, ${matchingRows[i][3]}`;
    }
  }
  retRow[3] = `"${retRow[3]}"`;
  return retRow;
});

// sort
filteredResults.sort((a, b) => {
  let fa = a[0].toLowerCase(),
    fb = b[0].toLowerCase();

  if (fa < fb) {
    return -1;
  }
  if (fa > fb) {
    return 1;
  }
  return 0;
});

// save to CSV
let retString = "Stadium Name,Lat,Lng,Teams,URL";
filteredResults.forEach((arr) => {
  if (arr.length > 0) {
    retString = `${retString}\n${arr.join(",")}`;
  }
});
console.log(retString);
