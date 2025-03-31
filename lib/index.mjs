import requireIndex from 'requireindex';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const rules = requireIndex(join(__dirname, "/rules"));

export default {
  rules,
  configs: {
    recommended: {
      plugins: ["auto-optional-chaining"],
      rules: {
        "auto-optional-chaining/auto-optional-chaining": "warn"
      }
    }
  }
};
