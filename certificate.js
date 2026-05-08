function createCertificate(){

  const name =
    document.getElementById("name").value;

  const purpose =
    document.getElementById("purpose").value;

  document.getElementById("previewName").innerText
    = name;

  document.getElementById("previewPurpose").innerText
    = purpose;

  window.print();
}