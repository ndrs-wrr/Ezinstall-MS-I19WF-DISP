cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "cordova-open-native-settings.Settings",
    "file": "plugins/cordova-open-native-settings/www/settings.js",
    "pluginId": "cordova-open-native-settings",
    "clobbers": [
      "cordova.plugins.settings"
    ]
  },
  {
    "id": "es6-promise-plugin.Promise",
    "file": "plugins/es6-promise-plugin/www/promise.js",
    "pluginId": "es6-promise-plugin",
    "runs": true
  },
  {
    "id": "phonegap-plugin-barcodescanner.BarcodeScanner",
    "file": "plugins/phonegap-plugin-barcodescanner/www/barcodescanner.js",
    "pluginId": "phonegap-plugin-barcodescanner",
    "clobbers": [
      "cordova.plugins.barcodeScanner"
    ]
  },
  {
    "id": "wifiwizard2.WifiWizard2",
    "file": "plugins/wifiwizard2/www/WifiWizard2.js",
    "pluginId": "wifiwizard2",
    "clobbers": [
      "window.WifiWizard2"
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-open-native-settings": "1.5.1",
  "cordova-plugin-whitelist": "1.3.3",
  "es6-promise-plugin": "4.1.0",
  "phonegap-plugin-barcodescanner": "8.0.0",
  "wifiwizard2": "2.1.1"
};
// BOTTOM OF METADATA
});