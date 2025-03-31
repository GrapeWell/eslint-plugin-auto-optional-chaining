/**
 * @fileoverview Fix most possible code errors through optional chaining
 * @author sickhack
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const requireIndex = require("requireindex");

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

// import all rules in lib/rules
module.exports.rules = requireIndex(__dirname + "/rules");

module.exports.configs = {
  recommended: {
    plugins: ["auto-optional-chaining"],
    rules: {
      "auto-optional-chaining/auto-optional-chaining": "warn",
    },
  },
};
