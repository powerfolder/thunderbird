Cu.importGlobalProperties(["btoa"]);

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { ExtensionUtils } = ChromeUtils.import("resource://gre/modules/ExtensionUtils.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { LoginManagerPrompter } = ChromeUtils.import("resource://gre/modules/LoginManagerPrompter.jsm");

var bundle = Services.strings.createBundle("chrome://global/locale/commonDialogs.properties");
var brandBundle = Services.strings.createBundle("chrome://branding/locale/brand.properties");

var authRequest = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      authRequest: {
        async getAuthHeader(url, authenticateHeader, requestMethod) {

          function createHeader() {
            var id = requestMethod.split(":")[0]
            var pass = requestMethod.split(":")[1]
              return "Basic " + btoa(id + ":" + pass);
          }

          let { displayHostPort, prePath, filePath } = Services.io.newURI(url);
          let logins = Services.logins.findLogins(prePath, null, prePath);
          for (let login of logins) {
            return createHeader();
          }


          return createHeader();
        },
      },
    };
  }
};