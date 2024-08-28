import { group, check } from 'k6';

export function startFrame(text) {
  text = "|--- " + text + " ---|";
  let separator = "|";
  for (let i = 0; i < text.length - 2; i++) {
    separator += "-";
  }
  separator += "|";
  console.log(separator);
  console.log(text);
  console.log(separator);
}

export function endLine(text) {
  console.log("|----- " + text + " -----|");
}

export function describe(description, callback) {
  group(description, () => {
    try {
      callback();
    } catch (err) {
      console.error(`Exception raised in test '${description}'. Failing the test and continuing.`);
      console.error(`Error name: ${err.name}`);
      console.error(`Error message: ${err.message}`);
      check(null, {
        [`Exception raised '${err}'`]: false,
      });
    }
  });
}
