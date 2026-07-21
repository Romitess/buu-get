module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 400],
    "body-max-line-length": [2, "always", 300],
  },
};
