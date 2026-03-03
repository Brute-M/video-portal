/**
 * One-time seed: copy current GTM + Clarity snippets into Site Settings (CMS)
 * so they are managed via Admin → Site Settings instead of index.html.
 * Run from backend: node scripts/seed-gtm-to-site-settings.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const dbURI = process.env.MONGO_URL || "mongodb+srv://brpl-dev-write:YnJwbC1kZXYtd3JpdGU@brpl-dev.nj1umik.mongodb.net/brpl";

const customHeadScripts = `<!-- GTM and Clarity (deferred to after load) - managed via CMS -->
<script>
  window.addEventListener('load', function () {
    var w = window, d = document, s = 'script', l = 'dataLayer', i = 'GTM-MCPX98JT';
    w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0], j = d.createElement(s);
    j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + '&l=' + l;
    f.parentNode.insertBefore(j, f);
  });
</script>
<script>
  window.addEventListener('load', function () {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", "uy6mwk4tcp");
  });
</script>`;

const customBodyScripts = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MCPX98JT" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;

async function run() {
  await mongoose.connect(dbURI);
  const SiteSettings = require('../model/siteSettings.model');
  let settings = await SiteSettings.findOne({ key: 'main' });
  if (!settings) {
    settings = await SiteSettings.create({ key: 'main' });
  }
  settings.customHeadScripts = customHeadScripts;
  settings.customBodyScripts = customBodyScripts;
  await settings.save();
  console.log('Site Settings updated: GTM + Clarity snippets are now in CMS (customHeadScripts / customBodyScripts).');
  console.log('You can edit them in Admin → Site Settings.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
