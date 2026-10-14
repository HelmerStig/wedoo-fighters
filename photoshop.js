function main() {
    if (app.documents.length === 0) {
        alert("Nessun documento aperto.");
        return;
    }

    var doc = app.activeDocument;
    
    // Chiede dove salvare i file
    var outputFolder = Folder.selectDialog("Seleziona la cartella dove salvare i PNG");
    if (outputFolder === null) return; // Annullato dall'utente

    // Salva lo stato di visibilità iniziale di tutte le cartelle
    var initialVisibility = [];
    for (var i = 0; i < doc.layerSets.length; i++) {
        initialVisibility.push(doc.layerSets[i].visible);
        doc.layerSets[i].visible = false; // Nasconde tutto
    }

    // Configura le opzioni di salvataggio in PNG
    var pngOptions = new ExportOptionsSaveForWeb();
    pngOptions.format = SaveDocumentType.PNG;
    pngOptions.PNG8 = false; // Forza PNG-24 per la massima qualità
    pngOptions.transparency = true;

    // Ciclo di esportazione per ogni cartella principale
    for (var j = 0; j < doc.layerSets.length; j++) {
        var currentSet = doc.layerSets[j];
        
        // Rende visibile SOLO la cartella corrente
        currentSet.visible = true;

        // Pulisce il nome per evitare caratteri vietati nei file
        var safeName = currentSet.name.replace(/[:\/\\*\?\"<>\|]/g, "_");
        var saveFile = new File(outputFolder + "/" + safeName + ".png");

        // Esporta mantenendo l'intera area di lavoro
        doc.exportDocument(saveFile, ExportType.SAVEFORWEB, pngOptions);

        // Nasconde nuovamente la cartella prima di passare alla successiva
        currentSet.visible = false;
    }

    // Ripristina la visibilità iniziale nel file Photoshop
    for (var k = 0; k < doc.layerSets.length; k++) {
        doc.layerSets[k].visible = initialVisibility[k];
    }

    alert("Fatto! 50 cartelle esportate correttamente a dimensione quadro intero.");
}

main();