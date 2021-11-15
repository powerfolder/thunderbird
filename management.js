let info = document.querySelector("form");
let private_url = info.querySelector(`input[name="private_url"]`);
let public_url = info.querySelector(`input[name="public_url"]`);
let id = info.querySelector(`input[name="id"]`);
let pass = info.querySelector(`input[name="pass"]`);
let button = info.querySelector("button");
let accountId = new URL(location.href).searchParams.get("accountId");
let confirmText = info.querySelector(`p[name="confirm"]`);
let wrongPass = info.querySelector(`p[name="wrong"]`);

(() => {
  for (let element of document.querySelectorAll("[data-message]")) {
    element.textContent = browser.i18n.getMessage(element.dataset.message);
  }
})();

browser.storage.local.get([accountId]).then(accountInfo => {
  if (accountId in accountInfo) {
    if ("private_url" in accountInfo[accountId]) {
      private_url.value = accountInfo[accountId].private_url;
    }
    if ("public_url" in accountInfo[accountId]) {
      public_url.value = accountInfo[accountId].public_url;
    }
    if ("id" in accountInfo[accountId]) {
      id.value = accountInfo[accountId].id;
    }
    if ("pass" in accountInfo[accountId]) {
      pass.value = accountInfo[accountId].pass;
    }
  }
});

button.onclick = async () => {
  if(id.value==""){
    id.style.border = "1px solid #ff0000";
    return;
  }
  else{
    id.style.border = "1px solid gray";
  };
  if (pass.value==""){
    pass.style.border = "1px solid #ff0000";
    return;
  }
  else{
    pass.style.border = "1px solid gray";
  };

  if (!info.checkValidity()) {
    return;
  };
  
  private_url.disabled = public_url.disabled = button.disabled = id.disabled = pass.disabled = true;
  let private_url_value = private_url.value;
  
  if (!private_url_value.endsWith("/")) {
    private_url_value += "/";
    private_url.value = private_url_value;
  };

  let headers = {
    "Content-Type": "application/octet-stream",
  };
  headers.Authorization = "Basic " + window.btoa(id.value + ":" + pass.value);
  let test_credentials = {
    method: "GET",
    headers,
  };
  validation_url = private_url_value + "api/folders?action=getAll";
  response = await fetch(validation_url, test_credentials);
  if (response.status >= 400){
    pass.style.border = "2px solid #ff0000";
    pass.value = ""
    window.setTimeout(()=>pass.style.border = "2px solid gray", 2000);
	wrongPass.style.display = "block";
	confirmText.style.display = "none";
  } else {
	pass.style.border = "2px solid #90ee90";
	window.setTimeout(()=>pass.style.border = "2px solid gray", 2000);
	confirmText.style.display = "block";
	wrongPass.style.display = "none";
}

  

  let public_url_value = public_url.value || private_url_value;
  public_url.value = public_url_value;

  let start = Date.now();

  

  await browser.storage.local.set({
    [accountId]: {
      private_url: private_url_value,
      public_url: public_url_value,
      id: id.value,
      pass: pass.value
  
    },
  });
  await browser.cloudFile.updateAccount(accountId, { configured: true });
  setTimeout(() => {
    private_url.disabled = public_url.disabled = button.disabled = id.disabled = pass.disabled = false;
  }, Math.max(0, start + 500 - Date.now()));
};
