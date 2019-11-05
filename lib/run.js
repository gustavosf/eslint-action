const { GITHUB_SHA, GITHUB_EVENT_PATH, GITHUB_TOKEN, PWD } = process.env;
const { number, repository } = require(GITHUB_EVENT_PATH);
const {
  owner: { login: owner },
  name: repo
} = repository;

console.log("Environment Variables:", process.env);
console.log(`Executing on pull request #${number} from repo ${owner}/${repo}`);

const checkName = "ESLint check";
const Github = new require("./github");
const github = new Github({ token: GITHUB_TOKEN, owner, repo });

function eslint(files) {
  const eslint = require("eslint");

  const cli = new eslint.CLIEngine({});
  const report = cli.executeOnFiles(["."]);
  // fixableErrorCount, fixableWarningCount are available too
  const { results, errorCount, warningCount } = report;

  const levels = ["", "warning", "failure"];

  const annotations = [];
  console.log("results");
  for (const result of results) {
    const { filePath, messages } = result;
    const path = filePath.substring(PWD.length + 1);

    // Ignore if file is not in the pull request
    if (files.indexOf(path) < 0) continue;

    for (const msg of messages) {
      const { line, severity, ruleId, message } = msg;
      const annotationLevel = levels[severity];
      annotations.push({
        path,
        start_line: line,
        end_line: line,
        annotation_level: annotationLevel,
        message: `[${ruleId}] ${message}`
      });
    }
  }

  return {
    conclusion: errorCount > 0 ? "failure" : "success",
    output: {
      title: checkName,
      summary: `${errorCount} error(s), ${warningCount} warning(s) found`,
      annotations
    }
  };
}

function* matchAll(str, regexp) {
  const flags = regexp.global ? regexp.flags : regexp.flags + "g";
  const re = new RegExp(regexp, flags);
  let match;
  while ((match = re.exec(str))) {
    yield match;
  }
}

function getDiffFiles(diff) {
  const files = [];
  for (let i of matchAll(diff, /^diff.*? b\/storefront\/(.*)$/gm))
    files.push(i[1]);
  return files;
}

function exitWithError(err) {
  console.error("Error", err.stack);
  if (err.data) console.error(err.data);
  process.exit(1);
}

async function run() {
  const checkData = { name: checkName, head_sha: GITHUB_SHA };
  const checkId = await github.createCheck(checkData);
  const diff = await github.getDiff(number);
  const files = getDiffFiles(diff);
  try {
    const { conclusion, output } = eslint(files);
    console.log("Updating check", checkData, checkId, conclusion, output);
    await github.updateCheck(checkData, checkId, conclusion, output);
    if (conclusion === "failure") process.exit(78);
  } catch (err) {
    exitWithError(err);
  }
}

run().catch(exitWithError);
