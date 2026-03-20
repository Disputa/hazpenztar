function previewImportFile(file) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const text = e.target.result;
    console.log("IMPORT PREVIEW:");
    console.log(text.substring(0, 2000));
    alert("import_test.js betöltve");
  };

  reader.readAsText(file);
}

window.previewImportFile = previewImportFile;
alert("import_test.js betöltve");