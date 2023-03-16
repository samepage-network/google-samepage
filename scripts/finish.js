const execSync = require("child_process").execSync;

module.exports = () => {
  execSync(
    "gcloud workspace-add-ons deployments replace quickstart --deployment-file=deployment.json"
  );
};
