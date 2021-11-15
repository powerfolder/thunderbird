var uploads = new Map();
var now = new Date();
date = now.toLocaleString().replaceAll("/","-").replaceAll(":","-").replaceAll(",","")

async function getURLs(accountId) {
  let accountInfo = await browser.storage.local.get([accountId]);
  if (!accountInfo[accountId] || !("private_url" in accountInfo[accountId])) {
    throw new Error("No URLs found.");
  }
  return accountInfo[accountId];
}

browser.cloudFile.onFileUpload.addListener(async (account, { id, name, data }) => {
  let urls = await getURLs(account.id);
  var filename;
  try{
    filename = encodeURIComponent(name).split(".")
    filename = filename[0] + " " + date
  } catch (err){
    filename = encodeURIComponent(name)
  }

  var private_url = urls.private_url + `webdav/$mail_attachments/${filename}/`;
  let url = private_url + encodeURIComponent(name);

  let uploadInfo = {
    id,
    name,
    url,
    abortController: new AbortController(),
  };
  uploads.set(id, uploadInfo);

  let headers = {
    "Content-Type": "application/octet-stream",
  };
  var id_pass = urls.id + ":" + urls.pass
  headers.Authorization = "Basic " + window.btoa(id_pass);

  let fetchInfo = {
    method: "PUT",
    headers,
    body: data,
    signal: uploadInfo.abortController.signal,
  };
  let createFolder = {
    method: "GET",
    headers,
  };

  var getDynamicLink;
  var downloadLink;
  
  let response;
  var folderID;

  getDynamicLink = await fetch(urls.private_url + "api/folders?action=getAll",createFolder)
  getDynamicLink = await getDynamicLink.json()
  getDynamicLink = getDynamicLink["ResultSet"]["Result"]
  getDynamicLink.forEach((folder)=> {
    if (folder.internalName=="$mail_attachments"){
      folderID = folder.resourceURL
      folderID = folderID.split("files/")[1]
    }
  });

  if (!folderID) {
    await fetch(urls.private_url + `api/folders?action=create&name=$mail_attachments`, createFolder);
    getDynamicLink = await fetch(urls.private_url + "api/folders?action=getAll",createFolder)
    getDynamicLink = await getDynamicLink.json()
    getDynamicLink = getDynamicLink["ResultSet"]["Result"]
    getDynamicLink.forEach((folder)=> {
      if (folder.internalName=="$mail_attachments"){
        folderID = folder.resourceURL
        folderID = folderID.split("files/")[1]
      }
    });
  }
    
  createSubDir = await fetch(urls.private_url + `api/folders/${folderID}?action=createSubdir&dirName=${filename}`,createFolder);
  response = await fetch(url, fetchInfo);
  downloadLink = await fetch(urls.private_url + `api/filelink/${folderID}/${filename}/${encodeURIComponent(name)}?action=createLink`,createFolder);
  downloadLink = await downloadLink.json();
  downloadLink = downloadLink["ResultSet"]["Result"][0].downloadUrl;

  delete uploadInfo.abortController;
  if (response.status > 299) {
    throw new Error("response was not ok");
  }

  if (urls.public_url) {
    return { url: downloadLink };
  }
  return { url: downloadLink };
});

browser.cloudFile.onFileUploadAbort.addListener((account, id) => {
  let uploadInfo = uploads.get(id);
  if (uploadInfo && uploadInfo.abortController) {
    uploadInfo.abortController.abort();
  }
});

browser.cloudFile.onFileDeleted.addListener(async (account, id) => {
  let uploadInfo = uploads.get(id);
  if (!uploadInfo) {
    return;
  }
  let urls = await getURLs(account.id);
  let url = uploadInfo.url;
  let headers = {};
  var id_pass = urls.id + ":" + urls.pass;
  headers.Authorization = "Basic " + window.btoa(id_pass);
  let fetchInfo = {
    headers,
    method: "DELETE",
  };
  let response = await fetch(url, fetchInfo);

  uploads.delete(id);
  if (response.status > 299) {
    throw new Error("response was not ok");
  }
});

browser.cloudFile.getAllAccounts().then(async (accounts) => {
  let allAccountsInfo = await browser.storage.local.get();
  for (let account of accounts) {
    await browser.cloudFile.updateAccount(account.id, {
      configured: account.id in allAccountsInfo,
    });
  }
});

browser.cloudFile.onAccountDeleted.addListener((accountId) => {
  browser.storage.local.remove(accountId);
});
