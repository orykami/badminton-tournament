function preventZoom(e) {
    var t2 = e.timeStamp;
    var t1 = e.currentTarget.dataset.lastTouch || t2;
    var dt = t2 - t1;
    var fingers = e.touches.length;
    e.currentTarget.dataset.lastTouch = t2;

    if (!dt || dt > 500 || fingers > 1) return; // not double-tap

    e.preventDefault();
    e.target.click();
}


window.addEventListener("dblclick", function(evt){evt.preventDefault();});
//Base de données locale
class GlobalDataBase{
    constructor(dbName){
        this.dbName = dbName;
        this.load(JSON.parse(localStorage.getItem(this.dbName)));
    }
    dbName = "";
    joueurs = [];
    tournoi = new Tournoi();

    getNbJoueurSelected(){
        var compt = 0;
        for (var i = 0; i < this.joueurs.length; i++){
            if (this.joueurs[i].selected) compt++;
        }
        return compt;
    }
    getNbContrainteActif(){
        var compt = 0;
        for (var i = 0; i < this.tournoi.contraintes.length; i++){
            if (this.tournoi.contraintes[i].actif) compt++;
        }
        return compt;
    }

    getDatas(){
        return {
            "joueurs": this.getJoueurs(),
            "tournoi": this.getTournoi()
        }
    }

    getJoueurs(){
        var retour = [];
        for (var i = 0; i < this.joueurs.length; i++){
            retour.push(this.joueurs[i].toJson());
        }
        return retour;
    }
    getTournoi(){
        return this.tournoi.toJson();
    }

    export() {
        var name = "Tournoi - " + bd.tournoi.date.getDate();
        var type = "application/json";
        var anchor = document.createElement("a");
        anchor.href = window.URL.createObjectURL(new Blob([JSON.stringify(this.getDatas())], {type}));
        anchor.download = name;
        anchor.click();
    }

    import(evt) {
        var fichier = new FileReader();
        fichier.onload = function() {
            var datas = JSON.parse(fichier.result);
            bd.load(datas);
            bd.save();
            selectPage();
        }
        fichier.readAsText(evt.target.files[0]);
    }

    save(){
        localStorage.setItem(this.dbName, JSON.stringify(this.getDatas()));
    }

    load(datas){
        if (datas == null) return;
        this.joueurs = [];
        for (var i = 0; i < datas["joueurs"].length; i++){
            this.joueurs.push(new Joueur(
                datas["joueurs"][i].name,
                datas["joueurs"][i].genre,
                datas["joueurs"][i].niveau,
                datas["joueurs"][i].selected,
                datas["joueurs"][i].points
            ));
        }
        this.tournoi = new Tournoi(
            datas["tournoi"].typeTournoi,
            datas["tournoi"].modeTournoi,
            datas["tournoi"].nbTour,
            datas["tournoi"].nbTerrain,
            datas["tournoi"].departMatchNegatif,
            datas["tournoi"].niveauListe,
            datas["tournoi"].genreListe,
            datas["tournoi"].contraintes,
            datas["tournoi"].tours,
            datas["tournoi"].currentTour,
            datas["tournoi"].limitPoint,
            new Date(datas["tournoi"].date),
            datas["tournoi"].nbPoints
        );
    }

    addJoueur(joueur){
        if (this.joueurs.filter(j => j.name == joueur.name).length > 0) return false;
        this.joueurs.push(joueur);
        this.save();
        return true;
    }

    updateJoueur(index, attributes){
        if (this.joueurs[index] != undefined){
            for (var att in attributes){
                if (this.joueurs[index][att] != undefined){
                    if (att == "name"){
                        if (this.joueurs[index][att] != attributes[att] &&
                            this.joueurs.filter(j => j.name == attributes[att]).length > 0)
                            return false;
                    }
                    this.joueurs[index][att] = attributes[att];
                }
            }
        }
        this.save();
        return true;
    }

    deleteJoueur(index){
        this.joueurs.splice(index, 1);
        this.save();
    }

    updateTournoi(attributes){
        for (var att in attributes){
            if (this.tournoi[att] != undefined){
                this.tournoi[att] = attributes[att];
            }
        }
        //mise à jour des contraintes disponibles en fonction du type de tournoi
        this.tournoi.contraintes.filter(c => c.name == "COEQUIPIER")[0].disabled = this.tournoi["typeTournoi"] == typeTournoiListe.SIMPLE;
        this.save();
    }

    updateMatch(indexMatch, indexEquipe, score){
        var index = 0;
        for (var i = 0; i < this.tournoi.tours.length; i++){
            for (var j = 0; j < this.tournoi.tours[i].matchs.length; j++){
                if (indexMatch == index){
                    this.tournoi.tours[i].matchs[j][indexEquipe] = score;
                    this.save();
                    return;
                }
                index++;
            }
        }
    }

    updateContraintes(contraintes){
        if (contraintes != undefined) this.tournoi.contraintes = contraintes;
        this.save();
    }
}

//Listes
var typeTournoiListe = {
    "DOUBLE": "Double",
    "SIMPLE": "Simple",
}
var modeTournoiListe = {
    "ONESHOT": "Tous les tours <br> <span> On génére tous les tours en une fois dans le but de faire jouer tout le monde avec tout le monde quelque soit les niveaux. </span>",
    "STEPBYSTEP": "Tour par tour <br> <span> On génére le premier tour,  "
}
var contrainteListe = [
    {
        "name": "ADVERSAIRE",
        "title": "Adversaires différents",
        "desc": "Éviter de rejouer plusieurs fois contre le même adversaire.",
        "actif": true,
        "disabled": false,
    },
    {
        "name": "COEQUIPIER",
        "title": "Coéquipier différents",
        "desc": "Éviter de rejouer plusieurs fois avec le même coéquipier.",
        "actif": true,
        "disabled": false,
    },
    {
        "name": "ATTENTE",
        "title": "Attente minimum",
        "desc": "On essaye de faire joueur un maximum tout le monde.",
        "actif": true,
        "disabled": false,
    },
    {
        "name": "ISOSEXE",
        "title": "Égalité des sexes",
        "desc": "On ne permet que des matchs où il y a autant d'hommes que de femmes dans chaque équipe.",
        "actif": true,
        "disabled": false,
    },
    {
        "name": "MIXTE",
        "title": "Coéquipiers mixte",
        "desc": "On optimise les équipes pour composer des équipes de mixtes.",
        "actif": true,
        "disabled": false,
    },
    {
        "name": "LIMITPOINT",
        "title": "Écart de point limité",
        "desc": "On limite l'écart des points entre les deux équipes au début du match. Limite : ",
        "actif": true,
        "disabled": false,
    }
]
var niveauListe = {
    "P12": {
        "value": "P12",
        "handicap": 0
    },
    "P11": {
        "value": "P11",
        "handicap": -2
    },
    "P10": {
        "value": "P10",
        "handicap": -4
    },
    "D9": {
        "value": "D9",
        "handicap": -8
    },
    "D8": {
        "value": "D8",
        "handicap": -10
    },
    "D7": {
        "value": "D7",
        "handicap": -12
    },
    "R6": {
        "value": "R6",
        "handicap": -13
    },
    "R5": {
        "value": "R5",
        "handicap": -14
    },
    "R4": {
        "value": "R4",
        "handicap": -15
    },
    "N3": {
        "value": "N3",
        "handicap": -16
    },
    "N2": {
        "value": "N2",
        "handicap": -17
    },
    "N1": {
        "value": "N1",
        "handicap": -18
    }
}
var genreListe = {
    "HOMME": {
        "value": "Homme",
        "handicap": 0
    },
    "FEMME": {
        "value": "Femme",
        "handicap": 2
    }
}

//Models
class Joueur{
    constructor(pName, pGenre, pNiveau, pSelected, pPoints){
        this.name = pName == undefined ? "Nouveau joueur " + (bd.joueurs.length + 1) : pName;
        this.genre = pGenre != undefined ? pGenre : bd.tournoi.genreListe.HOMME;
        this.niveau = pNiveau != undefined ? pNiveau : bd.tournoi.niveauListe.P12;
        this.selected = pSelected != undefined ? pSelected : false;
        this.adversaires = [];
        this.coequipiers = [];
        this.points = pPoints != undefined ? pPoints : 0;
    }
    name = null;
    genre = null;
    niveau = null;
    selected = false;
    adversaires = null;
    coequipiers = null;
    points = 0;

    getPointsHandicap(){
        return this.genre.handicap + this.niveau.handicap;
    }

    toJson(){
        return {
            "name": this.name,
            "genre": this.genre,
            "niveau": this.niveau,
            "selected": this.selected,
            "points": this.points
        }
    }
}

class Tournoi{
    constructor(pTypeTournoi, pModeTournoi, pNbTour, pNbTerrain, pDepartMatchNegatif, pNiveauListe, pGenreListe, pContraintes, pTours, pCurrentTour, pLimitPoint, pDate, pNbPoint){
        this.typeTournoi = pTypeTournoi != undefined ? pTypeTournoi : typeTournoiListe.DOUBLE;
        this.modeTournoi = pModeTournoi != undefined ? pModeTournoi : modeTournoiListe.ONESHOT;
        this.nbTour = pNbTour != undefined ? pNbTour : 4;
        this.nbTerrain = pNbTerrain != undefined ? pNbTerrain : 4;
        this.departMatchNegatif = pDepartMatchNegatif != undefined ? pDepartMatchNegatif : false;
        this.niveauListe = pNiveauListe != undefined ? pNiveauListe : niveauListe;
        this.genreListe = pGenreListe != undefined ? pGenreListe : genreListe;
        this.contraintes = pContraintes != undefined ? pContraintes : contrainteListe;
        this.tours = pTours != undefined ? pTours : [];
        this.currentTour = pCurrentTour != undefined ? pCurrentTour : -1;
        this.limitPoint = pLimitPoint != undefined ? pLimitPoint : 10;
        this.date = pDate != undefined ? pDate : new Date();
        this.nbPoints = pNbPoint != undefined ? pNbPoint : 21;
    }

    typeTournoi = null;
    modeTournoi = null;
    nbTour = null;
    nbTerrain = null;
    departMatchNegatif = null;
    niveauListe = null;
    genreListe = null;
    contraintes = null;
    currentTour = null;
    limitPoint = null;
    date = null;
    nbPoints = null;

    toJson(){
        var tours = [];
        var matchs, currentMatch, equipeA, equipeB;
        for (var i = 0; i < this.tours.length; i++){
            matchs = [];
            for (var j = 0; j < this.tours[i]["matchs"].length; j++){
                currentMatch = this.tours[i]["matchs"][j];
                equipeA = [];
                var currentJoueur;
                for (var k = 0; k < currentMatch["equipeA"].length; k++){
                    currentJoueur = new Joueur(
                        currentMatch["equipeA"][k]["name"],
                        currentMatch["equipeA"][k]["genre"],
                        currentMatch["equipeA"][k]["niveau"],
                        currentMatch["equipeA"][k]["points"])
                    equipeA.push(currentJoueur);
                }
                equipeB = [];
                for (var k = 0; k < currentMatch["equipeB"].length; k++){
                    currentJoueur = new Joueur(
                        currentMatch["equipeB"][k]["name"],
                        currentMatch["equipeB"][k]["genre"],
                        currentMatch["equipeB"][k]["niveau"],
                        currentMatch["equipeB"][k]["points"])
                    equipeB.push(currentJoueur);
                }
                matchs.push({"equipeA": equipeA, "equipeB": equipeB, "ptsEquipeA": currentMatch["ptsEquipeA"], "ptsEquipeB": currentMatch["ptsEquipeB"], "ptsEquipeADepart": currentMatch["ptsEquipeADepart"], "ptsEquipeBDepart": currentMatch["ptsEquipeBDepart"]  })
            }
            var joueurAttente = [];
            for (var j = 0; j < this.tours[i]["joueurAttente"].length; j++){
                joueurAttente.push(new Joueur(
                    this.tours[i]["joueurAttente"][j]["name"],
                    this.tours[i]["joueurAttente"][j]["genre"],
                    this.tours[i]["joueurAttente"][j]["niveau"],
                    this.tours[i]["joueurAttente"][j]["points"]
                ));
            }
            tours.push({"matchs": matchs, "joueurAttente": joueurAttente})
        }
        return {
            "typeTournoi": this.typeTournoi,
            "nbTour": this.nbTour,
            "nbTerrain": this.nbTerrain,
            "departMatchNegatif": this.departMatchNegatif,
            "niveauListe": this.niveauListe,
            "genreListe": this.genreListe,
            "contraintes": this.contraintes,
            "tours": tours,
            "currentTour": this.currentTour,
            "date": this.date,
            "nbPoints": this.nbPoints
        };
    }
}

var DB_NAME = "tournoiBad";
var bd = new GlobalDataBase(DB_NAME);

var groupeJoueurs = {
    "ASBG": [
        new Joueur("Benoît JACQUOT", genreListe.HOMME, niveauListe.D9, 0),
        new Joueur("Benjamin ENSENAT", genreListe.HOMME, niveauListe.D8, 0),
        new Joueur("Élodie ENSENAT", genreListe.FEMME, niveauListe.D9, 0),
        new Joueur("Mélissa PIERRE", genreListe.FEMME, niveauListe.D8, 0),
        new Joueur("Virgile HUGUET", genreListe.HOMME, niveauListe.D8, 0),
        new Joueur("Fabrice POIGNANT", genreListe.HOMME, niveauListe.D9, 0),
        new Joueur("Patricia POIGNANT", genreListe.FEMME, niveauListe.P12, 0),
        new Joueur("Amandine FLIN", genreListe.FEMME, niveauListe.D9, 0),
        new Joueur("Yann POTIER", genreListe.HOMME, niveauListe.D9, 0),
        new Joueur("Frédéric FIRMIN", genreListe.HOMME, niveauListe.D9, 0),
        new Joueur("Marie FEVE", genreListe.FEMME, niveauListe.D9, 0),
        new Joueur("Matéo RIVET", genreListe.HOMME, niveauListe.D9, 0),
        new Joueur("Mickaël VOIRPY", genreListe.HOMME, niveauListe.D9, 0),
        new Joueur("Boris ECREMENT", genreListe.HOMME, niveauListe.P10, 0),
        new Joueur("Aurore ROBERT", genreListe.FEMME, niveauListe.P12, 0),
        new Joueur("Sarah B-I", genreListe.FEMME, niveauListe.P12, 0),
        new Joueur("Damien ALBISIER", genreListe.HOMME, niveauListe.P12, 0),
        new Joueur("Chantal LARDENOIS", genreListe.FEMME, niveauListe.P12, 0),
        new Joueur("Yassine BERBER", genreListe.HOMME, niveauListe.P10, 0),
        new Joueur("Tristan DUWEZ", genreListe.HOMME, niveauListe.P12, 0),
        new Joueur("Cédric CHEVRIER", genreListe.HOMME, niveauListe.P10, 0),
        new Joueur("Vuthy SY", genreListe.HOMME, niveauListe.P12, 0),
        new Joueur("Aline LEVAL", genreListe.FEMME, niveauListe.P10, 0),
        new Joueur("Thomas COUSIN", genreListe.HOMME, niveauListe.P10, 0),
        new Joueur("Sandra MULLER", genreListe.FEMME, niveauListe.P12, 0),
        new Joueur("Adrien L-C", genreListe.HOMME, niveauListe.P12, 0),
        new Joueur("Raoul MULTON", genreListe.HOMME, niveauListe.P12, 0),
        new Joueur("Delphine BARBE", genreListe.HOMME, niveauListe.P12, 0),
        new Joueur("Géraldine DOUCEY", genreListe.FEMME, niveauListe.P12, 0),
        new Joueur("Robert GRUPPI", genreListe.HOMME, niveauListe.P12, 0),
        new Joueur("Angélique WEISS", genreListe.FEMME, niveauListe.P12, 0),
    ],
}

//Pages
var pages = {
    "ACCUEIL": "Accueil",
    "SELECTION_JOUEUR": "Sélection des joueurs",
    "MODIFICATION_JOUEUR": "Modification d'un joueur",
    "MODIFICATION_PREPARATION": "Modification de la préparation",
    "MODIFICATION_HANDICAPS": "Handicaps",
    "MODIFICATION_CONTRAINTES": "Contraintes",
    "EXECUTION_TOURNOI": "Execution",
    "IMPORT_JOUEURS": "Importer des joueurs",
}
var currentPage = bd.tournoi.currentTour == -1 ? pages.ACCUEIL : pages.EXECUTION_TOURNOI;

function selectPage(page, force){
    if (page != undefined) currentPage = page;
    buildPage();
    MH.loadEvents();
    resize();
}

window.addEventListener("resize", resize);
function resize(){
    if (document.getElementById("global") != null)
        document.getElementById("global").style["height"] = window.innerHeight + "px";
}

//on construit tout dans le body
function buildPage(){
    var container = document.getElementById("ssBody");
    container.innerHTML = "";
    var divGlobal = MH.makeDiv("global");
    divGlobal.appendChild(buildHeader());
    divGlobal.appendChild(buildBody());
    divGlobal.appendChild(buildFooter());
    container.appendChild(divGlobal);
}

function buildHeader(){
    var header = MH.makeDiv("header", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            header.appendChild(MH.makeSpan("Générateur de tournoi interne", "headerTitle"));
            header.appendChild(buildInterfaceHeaderAccueil());
            break;
        case pages.SELECTION_JOUEUR:
            header.appendChild(MH.makeButton({
                type: "click",
                func: retourSelectionJoueur.bind(this)
            }, "retour"));

            header.appendChild(MH.makeSpan("Sélection des joueurs", "headerTitle"));
            var add = MH.makeButton({
                type: "click",
                func: addJoueur.bind(this)
            }/*, "add"*/);
            add.innerHTML = "Nouveau joueur";
            add.classList.add("btn-success");
            header.appendChild(add);
            var importJoueur = MH.makeButton({
                type: "click",
                func: importJoueurs.bind(this)
            });
            importJoueur.innerHTML = "Importer";
            importJoueur.classList.add("btn-primary");
            header.appendChild(importJoueur);
            break;
        case pages.MODIFICATION_JOUEUR:
            header.appendChild(MH.makeButton({
                type: "click",
                func: retourModificationJoueur.bind(this)
            }, "retour"));

            if (currentEditionId == -1){
                header.appendChild(MH.makeSpan("Création d'un joueur", "headerTitle"));
            }else{
                header.appendChild(MH.makeSpan("Modification d'un joueur", "headerTitle"));
                var del = MH.makeButton({
                    type: "click",
                    func: showModalDeleteJoueur.bind(this)
                }, "delete");
                del.classList.add("btn-danger");
                header.appendChild(del);
            }
            break;
        case pages.MODIFICATION_PREPARATION:
            header.appendChild(MH.makeButton({
                type: "click",
                func: retourModificationPreparation.bind(this)
            }, "retour"));
            header.appendChild(MH.makeSpan("Préparation", "headerTitle"));
            break;
        case pages.MODIFICATION_HANDICAPS:
            header.appendChild(MH.makeButton({
                type: "click",
                func: retourModificationHandicaps.bind(this)
            }, "retour"));
            header.appendChild(MH.makeSpan("Handicaps et avantages", "headerTitle"));
            break;
        case pages.MODIFICATION_CONTRAINTES:
            header.appendChild(MH.makeButton({
                type: "click",
                func: retourModificationContraintes.bind(this)
            }, "retour"));
            header.appendChild(MH.makeSpan("Choix des contraintes", "headerTitle"));
            break;
        case pages.EXECUTION_TOURNOI:
            header.appendChild(MH.makeSpan("Tournoi en cours", "headerTitle"));
            var buttonFinTournoi = MH.makeButton({
                type: "click",
                func: showModalFinTournoi.bind(this)
            });
            buttonFinTournoi.innerHTML = "Fin du tournoi";
            buttonFinTournoi.classList.add("btn-danger");
            header.appendChild(buttonFinTournoi);
            break;
        case pages.IMPORT_JOUEURS:
            header.appendChild(MH.makeButton({
                type: "click",
                func: validImportJoueurs.bind(this)
            }, "retour"));

            header.appendChild(MH.makeSpan("Importer des joueurs", "headerTitle"));
            break;
    }
    return header;
}
var currentIndexMatch;
function buildBody(){
    var body = MH.makeDiv("body", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            body.appendChild(buildListJoueur());
            body.appendChild(buildPreparation());
            if (bd.tournoi.tours.length > 0)
                body.appendChild(buildClassement());
            break;
        case pages.SELECTION_JOUEUR:
            body.appendChild(buildListJoueur());
            break;
        case pages.MODIFICATION_JOUEUR:
            body.appendChild(buildListJoueur());
            break;
        case pages.MODIFICATION_PREPARATION:
            body.appendChild(buildPreparation());
            break;
        case pages.MODIFICATION_HANDICAPS:
            body.appendChild(buildHandicaps());
            break;
        case pages.MODIFICATION_CONTRAINTES:
            body.appendChild(buildListContraintes());
            break;
        case pages.EXECUTION_TOURNOI:
            currentIndexMatch = 0;
            for (var i = 0; i < bd.tournoi.tours.length; i++){
                body.appendChild(buildHeaderTour(i));
                body.appendChild(buildTour(bd.tournoi.tours[i], i));
            }
            break;
        case pages.IMPORT_JOUEURS:
            body.appendChild(buildListImportJoueur());
            break;
    }
    body.addEventListener("keydown", onKeyDown.bind(this));
    return body;
}

function buildFooter(){
    var footer = MH.makeDiv("footer", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            var newId = MH.getNewId();
            var div = MH.makeDiv(newId, "aide");
            var imgAide = MH.makeIcon("question", true, "svg+xml");
            imgAide.setAttribute("width", 30);
            imgAide.setAttribute("height", 30);
            var aide = MH.makeSpan("À propos", "signature");
            div.appendChild(imgAide);
            div.appendChild(aide);
            MH.addNewEvent(newId, "click", afficheInfo.bind(this));
            footer.appendChild(div);
            var buttonLancerTournoi = MH.makeButton({
                type: "click",
                func: preLancerTournoi.bind(this)
            });
            var nbJoueurSelected = bd.getNbJoueurSelected();
            var typeTournoi = bd.tournoi.typeTournoi;
            if ((typeTournoi == typeTournoiListe.SIMPLE && nbJoueurSelected < 2) ||
                (typeTournoi == typeTournoiListe.DOUBLE && nbJoueurSelected < 4)){
                buttonLancerTournoi.innerHTML = "Nombre de joueurs insuffisant";
                buttonLancerTournoi.classList.add("btn-secondary");
                buttonLancerTournoi.setAttribute("disabled", true);
            }else{
                buttonLancerTournoi.innerHTML = "Lancer le tournoi";
                buttonLancerTournoi.classList.add("btn-success");
            }

            footer.appendChild(buttonLancerTournoi);
            break;
        case pages.SELECTION_JOUEUR:
            var retour = MH.makeButton({
                type: "click",
                func: retourSelectionJoueur.bind(this)
            });
            retour.innerHTML = "Retour";
            footer.appendChild(retour);
            footer.classList.add("selection");
            break;
        case pages.MODIFICATION_JOUEUR:
            footer.appendChild(MH.makeButtonCancel({
                type: "click",
                func: cancelModificationJoueur.bind(this)
            }));
            footer.appendChild(MH.makeButtonValid({
                type: "click",
                func: validModificationJoueur.bind(this)
            }));
            break;
        case pages.MODIFICATION_PREPARATION:
            footer.appendChild(MH.makeButtonCancel({
                type: "click",
                func: cancelModificationPreparation.bind(this)
            }));
            footer.appendChild(MH.makeButtonValid({
                type: "click",
                func: validModificationPreparation.bind(this)
            }));
            break;
        case pages.MODIFICATION_HANDICAPS:
            footer.appendChild(MH.makeButtonCancel({
                type: "click",
                func: cancelModificationHandicaps.bind(this)
            }));
            footer.appendChild(MH.makeButtonValid({
                type: "click",
                func: validModificationHandicaps.bind(this)
            }));
            break;
        case pages.MODIFICATION_CONTRAINTES:
            footer.appendChild(MH.makeButtonCancel({
                type: "click",
                func: cancelModificationContraintes.bind(this)
            }));
            footer.appendChild(MH.makeButtonValid({
                type: "click",
                func: validModificationContraintes.bind(this)
            }));
            break;
        case pages.EXECUTION_TOURNOI:
            var validTourDom = MH.makeButtonValid({
                type: "click",
                func: validTour.bind(this)
            });
            if (bd.tournoi.currentTour == bd.tournoi.tours.length - 1){
                validTourDom.innerHTML = "Terminer le tournoi";
            }else{
                validTourDom.innerHTML = "Terminer la ronde " + (bd.tournoi.currentTour + 1);
            }
            footer.appendChild(validTourDom);
            break;
        case pages.IMPORT_JOUEURS:
            footer.appendChild(MH.makeButtonCancel({
                type: "click",
                func: cancelImportJoueurs.bind(this)
            }));
            footer.appendChild(MH.makeButtonValid({
                type: "click",
                func: validImportJoueurs.bind(this)
            }));
            break;
    }

    return footer;
}

function buildHeaderPreparation(){
    var header = MH.makeDiv("headerPreparation", "container");
    switch (currentPage){
        case pages.ACCUEIL:
            header.appendChild(MH.makeSpan("Préparation"));
            header.appendChild(MH.makeButton({
                type: "click",
                func: editPreparation.bind(this)
            }, "edit", "Modifier"));
            break;
        case pages.SELECTION_JOUEUR:

            break;
    }
    return header;
}

function buildPreparation(){
    var listPrep = MH.makeDiv("listPreparation");
    listPrep.appendChild(buildHeaderPreparation());
    var divPrep = MH.makeDiv(null, "divPreparation");
    switch (currentPage){
        case pages.ACCUEIL:
            divPrep.appendChild(buildPropertyViewer("Type de tournoi", bd.tournoi.typeTournoi));
            divPrep.appendChild(buildPropertyViewer("Mode", bd.tournoi.modeTournoi));
            divPrep.appendChild(buildPropertyViewer("Nombre de tour", bd.tournoi.nbTour));
            divPrep.appendChild(buildPropertyViewer("Nombre de terrain", bd.tournoi.nbTerrain));
            listPrep.appendChild(divPrep);
            break;
        case pages.MODIFICATION_PREPARATION:
            var elementsTypeTournoi = [];
            for (var t in typeTournoiListe){
                elementsTypeTournoi.push({"id": t, "name": "typeTournoi", "value": typeTournoiListe[t], "checked": bd.tournoi.typeTournoi ===  typeTournoiListe[t]});
            }
            var typeTournoiRadio = buildPropertyEditor("Type de tournoi", "radio",
                {name: "typeTournoi", elements : elementsTypeTournoi});
            MH.addNewEvent("DOUBLE", "change", validModificationPreparation.bind(this, true));
            MH.addNewEvent("SIMPLE", "change", validModificationPreparation.bind(this, true));


            divPrep.appendChild(typeTournoiRadio);

            var elementsModeTournoi = [];
            for (var t in modeTournoiListe){
                if (t == "STEPBYSTEP") continue; //pas encore développé
                elementsModeTournoi.push({"id": t, "name": "modeTournoi", "value": modeTournoiListe[t], "checked": bd.tournoi.modeTournoi ===  modeTournoiListe[t]});
            }
            divPrep.appendChild(buildPropertyEditor("Mode", "radio",
                {name: "modeTournoi", elements : elementsModeTournoi}));

            divPrep.appendChild(buildPropertyEditor("Nombre de tour", "numberSpinner", {
                "min": 1,
                "max": 10,
                "value": bd.tournoi.nbTour,
                "id": "nbTour"
            }));
            divPrep.appendChild(buildPropertyEditor("Nombre de terrain", "numberSpinner", {
                "min": 1,
                "max": 20,
                "value": bd.tournoi.nbTerrain,
                "id": "nbTerrain"
            }));
            divPrep.appendChild(buildPropertyEditor("Nombre de points", "numberSpinner", {
                "min": 1,
                "max": 30,
                "value": bd.tournoi.nbPoints,
                "id": "nbPoints"
            }));
            var handicaps = MH.makeButton({
                type: "click",
                func: editHandicaps.bind(this)
            });
            handicaps.classList.add("btn-secondary");
            handicaps.innerHTML = "Handicaps et avantages";
            divPrep.appendChild(handicaps);
            listPrep.appendChild(divPrep);
            listPrep.appendChild(buildListContraintes());
            break;
    }

    return listPrep;
}

function buildClassement(){
    var listJoueursClassement = MH.makeDiv("listJoueursClassement");
    listJoueursClassement.appendChild(buildHeaderJoueurClassement());
    var divJoueursClassement = MH.makeDiv(null, "divJoueursClassement");
    var tableClassement = MH.makeElt("table", null, "tableClassement");
    var thead = MH.makeElt("thead", "theadClassement");
    thead.appendChild(MH.makeTh("Classement"));
    thead.appendChild(MH.makeTh("Joueur"));
    thead.appendChild(MH.makeTh("Score"));
    thead.appendChild(MH.makeTh("Niveau"));
    tableClassement.appendChild(thead);
    var listJoueursSelected = bd.joueurs.filter(j => j.selected);
    var listJoueurSort = listJoueursSelected.sort((a, b) => b.points - a.points);
    var trJoueur;
    for (var i = 0; i < listJoueurSort.length; i++){
        trJoueur = MH.makeElt("tr", null, "trJoueurClassement");
        trJoueur.appendChild(MH.makeTd(i + 1, "classementJoueur"));
        trJoueur.appendChild(MH.makeTd(listJoueurSort[i].name, "nomJoueur"));
        trJoueur.appendChild(MH.makeTd(listJoueurSort[i].points, "pointsJoueur"));
        trJoueur.appendChild(MH.makeTd(buildBadgeNiveau(listJoueurSort[i]).outerHTML));
        tableClassement.appendChild(trJoueur);
    }
    divJoueursClassement.appendChild(tableClassement);
    listJoueursClassement.appendChild(divJoueursClassement);
    return listJoueursClassement;
}

function buildHandicaps(){

    var all = MH.makeDiv(null, "container handicaps");

    var scoreNeg = buildPropertyEditor("Début de match avec un score négatif ?", "checkbox",
        {id: "departMatchNegatif", value : bd.tournoi.departMatchNegatif});
    scoreNeg.setAttribute("id", "divMatchNegatif");
    scoreNeg.classList.add("container");
    all.appendChild(scoreNeg);

    var divHandicap;

    for (var gen in bd.tournoi.genreListe){
        divHandicap = MH.makeDiv(null, "handicapGenre");
        divHandicap.appendChild(MH.makeSpan(bd.tournoi.genreListe[gen].value));
        divHandicap.appendChild(buildPropertyEditor(undefined, "numberSpinner", {
            "min": -20,
            "max": 20,
            "value": bd.tournoi.genreListe[gen].handicap,
            "id": gen
        }));
        all.appendChild(divHandicap);
    }

    for (var niv in bd.tournoi.niveauListe){
        divHandicap = MH.makeDiv(null, "handicapNiveau");
        divHandicap.appendChild(MH.makeSpan(bd.tournoi.niveauListe[niv].value));
        divHandicap.appendChild(buildPropertyEditor(undefined, "numberSpinner", {
            "min": -20,
            "max": 20,
            "value": bd.tournoi.niveauListe[niv].handicap,
            "id": niv
        }));
        all.appendChild(divHandicap);
    }

    return all;
}

function buildHeaderTour(i){
    var header = MH.makeDiv("headerTour" + i, "headerTour container sticky-top");
    var ssTitle = MH.makeDiv(null, "divSsTitle");
    var ss1 = MH.makeSpan("Tour " + (i + 1), "ssTitle");
    ssTitle.appendChild(ss1);
    var ss2;
    if (bd.tournoi.currentTour == i) {
        ss2 = MH.makeSpan("En cours ...");
        header.classList.add("currentTour");
    } else if (bd.tournoi.currentTour > i) {
        ss2 = MH.makeSpan("Terminé");
        header.classList.add("closedTour");
    } else if (bd.tournoi.currentTour < i) {
        ss2 = MH.makeSpan("A venir ...");
        header.classList.add("forPlayingTour");
    }
    ssTitle.appendChild(ss2);
    header.appendChild(ssTitle);
    return header;
}

function buildTour(tour, i) {
    var globalTour = MH.makeDiv(null, "tour");
    if (bd.tournoi.currentTour == i) globalTour.classList.add("currentTour");
    else if (bd.tournoi.currentTour > i) globalTour.classList.add("closedTour");
    else if (bd.tournoi.currentTour < i) globalTour.classList.add("forPlayingTour");
    var listMatchs = MH.makeDiv(null, "matchs");
    for (var j = 0; j < tour.matchs.length; j++){
        listMatchs.appendChild(buildMatch(tour.matchs[j], j));
    }
    globalTour.appendChild(listMatchs);
    if (tour.joueurAttente.length > 0){
        var listJoueurAttente = MH.makeDiv(null, "joueurAttente");
        listJoueurAttente.appendChild(MH.makeSpan("Joueurs en attente..."));
        for (var i = 0; i < tour.joueurAttente.length; i++){
            listJoueurAttente.appendChild(buildJoueur(tour.joueurAttente[i], i));
        }
        globalTour.appendChild(listJoueurAttente);
    }
    return globalTour;
}

function buildMatch(match, j) {
    var divMatch = MH.makeDiv(null, "divMatch");
    var headerMatch = MH.makeDiv(null, "headerMatch");
    var num = MH.makeSpan("Match " + (currentIndexMatch + 1));

    var matchDom = MH.makeDiv(null, "match");
    var listEquipeA = MH.makeDiv(null, "equipe");

    for (var k = 0; k < match.equipeA.length; k++){
        listEquipeA.appendChild(buildJoueur(match.equipeA[k], match.equipeA[k].index));
    }
    var ptEquipeA = buildPropertyEditor(null , "numberSpinner", {
        "min": match["ptsEquipeADepart"],
        "max": 50,
        "value": match["ptsEquipeA"],
        "id": "match" + j,
        "indexmatch": currentIndexMatch,
        "indexequipe": "ptsEquipeA",
        "vertical": true
    });
    ptEquipeA.classList.add("pointMatch");
    matchDom.appendChild(ptEquipeA);
    matchDom.appendChild(listEquipeA);

    var listEquipeB = MH.makeDiv(null, "equipe");
    for (var k = 0; k < match.equipeB.length; k++){
        listEquipeB.appendChild(buildJoueur(match.equipeB[k], match.equipeB[k].index));
    }
    var ptEquipeB = buildPropertyEditor(null, "numberSpinner", {
        "min": match["ptsEquipeBDepart"],
        "max": 50,
        "value": match["ptsEquipeB"],
        "id": "match" + j,
        "indexmatch": currentIndexMatch,
        "indexequipe": "ptsEquipeB",
        "vertical": true
    });
    ptEquipeB.classList.add("pointMatch");
    matchDom.appendChild(listEquipeB);
    matchDom.appendChild(ptEquipeB);

    var victoireEquipeA = MH.makeButton({
        type: "click",
        func: victoire.bind(this, ptEquipeA.querySelector("span"))
    }, "victoire");
    victoireEquipeA.classList.add("victoire");
    var victoireEquipeB = MH.makeButton({
        type: "click",
        func: victoire.bind(this, ptEquipeB.querySelector("span"))
    }, "victoire");
    victoireEquipeB.classList.add("victoire");
    headerMatch.appendChild(victoireEquipeA);
    headerMatch.appendChild(num);
    headerMatch.appendChild(victoireEquipeB);

    divMatch.appendChild(headerMatch);

    divMatch.appendChild(matchDom);
    currentIndexMatch++;

    refreshMatch(matchDom, match);
    return divMatch;
}

function buildHeaderJoueur(){
    var header = MH.makeDiv("headerJoueur", "container sticky-top");
    switch (currentPage){
        case pages.ACCUEIL:
            var ssTitle = MH.makeDiv(null, "divSsTitle");
            var ss1 = MH.makeSpan("Participants", "ssTitle");
            var ss2 = MH.makeSpan(bd.getNbJoueurSelected() + "/" + bd.joueurs.length, "nbSsTitle");
            ssTitle.appendChild(ss1);
            ssTitle.appendChild(ss2);
            header.appendChild(ssTitle);
            header.appendChild(MH.makeButton({
                type: "click",
                func: editSelectionJoueurs.bind(this)
            }, "edit", "Modifier"));
            break;
        case pages.SELECTION_JOUEUR:

            break;
    }
    return header;
}

function buildHeaderJoueurClassement(){
    var header = MH.makeDiv("headerJoueurClassement", "container sticky-top");
    var ssTitle = MH.makeDiv(null, "divSsTitle");
    var ss1 = MH.makeSpan("Classement", "ssTitle");
    var ss2 = MH.makeSpan("Tournoi du " + bd.tournoi.date.toLocaleDateString() + " à " + bd.tournoi.date.toLocaleTimeString(), "nbSsTitle");
    ssTitle.appendChild(ss1);
    ssTitle.appendChild(ss2);
    header.appendChild(ssTitle);
    return header;
}

function buildHeaderContrainte(){
    var header = MH.makeDiv("headerContrainte", "container sticky-top");
    switch (currentPage){
        case pages.MODIFICATION_PREPARATION:
            var ssTitle = MH.makeDiv(null, "divSsTitle");
            var ss1 = MH.makeSpan("Règles", "ssTitle");
            var ss2 = MH.makeSpan(bd.getNbContrainteActif() + "/" + bd.tournoi.contraintes.length, "nbSsTitle");
            ssTitle.appendChild(ss1);
            ssTitle.appendChild(ss2);
            header.appendChild(ssTitle);
            header.appendChild(MH.makeButton({
                type: "click",
                func: editContraintes.bind(this)
            }, "edit", "Modifier"));
            break;
    }
    return header;
}

function buildListContraintes(){
    var listContraintes = MH.makeDiv("listContraintes");
    if (currentPage == pages.MODIFICATION_PREPARATION){
        listContraintes.appendChild(buildHeaderContrainte());
    }
    var flag = false;
    var compt = 1;
    for (var i = 0; i < bd.tournoi.contraintes.length; i++){
        switch (currentPage){
            case pages.MODIFICATION_PREPARATION:
                if (bd.tournoi.contraintes[i].actif && !bd.tournoi.contraintes[i].disabled){
                    listContraintes.appendChild(buildContrainte(bd.tournoi.contraintes[i], i, compt));
                    flag = true;
                    compt++;
                }
                break;
            case pages.MODIFICATION_CONTRAINTES:
                listContraintes.appendChild(buildContrainte(bd.tournoi.contraintes[i], i, compt));
                flag = true;
                compt++;
                break;
        }
    }
    if (!flag){
        var contrainteDom = MH.makeDiv(null, "divContrainte");
        contrainteDom.appendChild(MH.makeSpan("Aucune contrainte", "noData"));
        listContraintes.appendChild(contrainteDom);
    }
    return listContraintes;
}
function buildListImportJoueur(){
    var listGroupes = MH.makeDiv("listGroupeJoueur");
    var flag = false;
    var currentGroup;
    var newId;
    for (var i in groupeJoueurs){
        newId = MH.getNewId();
        currentGroup = MH.makeDiv(newId, "groupeJoueur");
        var curCheck = MH.makeInput("checkbox", {"id" : i});
        curCheck.classList.add("checkInclude");
        currentGroup.appendChild(curCheck);
        currentGroup.appendChild(MH.makeSpan(i));
        listGroupes.appendChild(currentGroup);
        MH.addNewEvent(newId, "click", selectGroupe.bind(this, currentGroup));
        flag = true;
    }
    if (!flag){
        currentGroup = MH.makeDiv(null, "groupe");
        currentGroup.appendChild(MH.makeSpan("Aucun groupe", "noData"));
        listGroupes.appendChild(currentGroup);
    }
    return listGroupes;
}

function buildContrainte(contrainte, i, compt){
    var contrainteDom = MH.makeDiv("contrainte" + i, "divContrainte");
    switch (currentPage){
        case pages.MODIFICATION_PREPARATION:
            contrainteDom.classList.add("accueil");
            contrainteDom.appendChild(MH.makeSpan(compt, "numContrainte"));
            var div = MH.makeLabel(null, "ssContrainte");
            div.appendChild(MH.makeSpan(contrainte.title, "contrainteTitle"));
            div.appendChild(MH.makeSpan(contrainte.desc, "contrainteDesc"));
            if (contrainte.name == "LIMITPOINT") div.appendChild(MH.makeSpan(bd.tournoi.limitPoint));
            contrainteDom.appendChild(div);
            break;
        case pages.MODIFICATION_CONTRAINTES:
            var check = MH.makeInput("checkbox");
            if (contrainte.actif === true) check.setAttribute("checked", "true");
            check.setAttribute("id", "checkContrainte" + i);
            check.classList.add("checkInclude");
            contrainteDom.appendChild(check);
            contrainteDom.appendChild(MH.makeSpan(compt, "numContrainte"));
            var div = MH.makeLabel(null, "ssContrainte");
            div.setAttribute("for", "checkContrainte" + i);
            div.setAttribute("data-name", contrainte.name);
            div.setAttribute("data-title", contrainte.title);
            div.setAttribute("data-desc", contrainte.desc);
            div.appendChild(MH.makeSpan(contrainte.title, "contrainteTitle"));
            div.appendChild(MH.makeSpan(contrainte.desc, "contrainteDesc"));
            contrainteDom.appendChild(div);
            if (contrainte.name == "LIMITPOINT"){
                contrainteDom.appendChild(MH.makeInput("number", {"id": "limitPoint", "value": bd.tournoi.limitPoint}));
            }

            var monter = MH.makeButton({
                type: "click",
                func: monterContrainte.bind(this, i)
            }, "monter");
            monter.classList.add("btn-secondary");
            if (i == 0) monter.classList.add("disabled");
            contrainteDom.appendChild(monter);
            var descendre = MH.makeButton({
                type: "click",
                func: descendreContrainte.bind(this, i)
            }, "descendre");
            descendre.classList.add("btn-secondary");
            if (i == bd.tournoi.contraintes.length - 1) descendre.classList.add("disabled");
            contrainteDom.appendChild(descendre);

            break;
    }
    return contrainteDom;
}

function buildListJoueur(){
    var listJoueurs = MH.makeDiv("listJoueurs");
    var divJoueurs = MH.makeDiv(null, "divJoueurs");
    var divJoueur;
    if (currentPage == pages.MODIFICATION_JOUEUR){
        if (currentEditionId == -1){
            divJoueur = buildJoueur(new Joueur(), currentEditionId);
            divJoueur.classList.add("homme");
        }else{
            divJoueur = buildJoueur(bd.joueurs[currentEditionId], currentEditionId);
            divJoueur.classList.add("modificationJoueur");
        }
        divJoueurs.appendChild(divJoueur);
    }else{
        if (currentPage == pages.ACCUEIL) {
            listJoueurs.appendChild(buildHeaderJoueur());
            divJoueurs.classList.add("accueil");
        } else if (currentPage == pages.SELECTION_JOUEUR){
            var newId = MH.getNewId();
            var divSelectAll = MH.makeElt("label", null, "joueur allSelect");
            divSelectAll.setAttribute("for", newId);
            var selectAllInput = MH.makeInput("checkbox", {"id": newId});
            selectAllInput.classList.add("checkInclude");
            MH.addNewEvent(newId, "click", selectAll.bind(this, selectAllInput));
            divSelectAll.appendChild(selectAllInput);
            divSelectAll.appendChild(MH.makeSpan("Tout sélectionner", "nomJoueur"));
            listJoueurs.appendChild(divSelectAll);

            listJoueurs.appendChild(buildHeaderJoueur());
        }
        if (bd.joueurs.length == 0){
            divJoueur = MH.makeSpan("Aucun joueur", "noData");
            divJoueurs.appendChild(divJoueur);
        }else{
            var flag = false;
            var compt = 0;
            for (var i = 0; i < bd.joueurs.length; i++){
                switch (currentPage){
                    case pages.ACCUEIL:
                        if (bd.joueurs[i].selected){
                            divJoueur = buildJoueur(bd.joueurs[i], i);
                            divJoueur.classList.add("accueil");
                            divJoueur.classList.add(bd.joueurs[i].genre.value == bd.tournoi.genreListe.HOMME.value ? "homme" : "femme");
                            divJoueurs.appendChild(divJoueur);
                            flag = true;
                        }
                        break;
                    case pages.SELECTION_JOUEUR:
                        if (bd.joueurs[i].selected) compt++;
                        var newId = MH.getNewId();
                        var divJoueurSelection = MH.makeDiv(newId, "joueurSelection");
                        divJoueur = buildJoueur(bd.joueurs[i], i);
                        divJoueurSelection.classList.add(bd.joueurs[i].genre.value == bd.tournoi.genreListe.HOMME.value ? "homme" : "femme");
                        divJoueurSelection.appendChild(divJoueur);
                        divJoueurSelection.appendChild(MH.makeButton({
                            type: "click",
                            func: editJoueur.bind(this, i)
                        }, "edit"));
                        divJoueurs.appendChild(divJoueurSelection);
                        MH.addNewEvent(newId, "click", selectJoueur.bind(this, divJoueur));
                        flag = true;
                        break;
                }
            }
            if (selectAllInput != undefined) selectAllInput.checked = compt == bd.joueurs.length;
            if (!flag){
                divJoueur = MH.makeSpan("Aucun joueur sélectionné", "noData");
                divJoueurs.appendChild(divJoueur);
            }
        }
    }
    listJoueurs.appendChild(divJoueurs);
    return listJoueurs;
}

function buildJoueur(joueur, i){
    var joueurDom = MH.makeDiv(null, "joueur");
    if (i == -1){
        joueurDom.classList.add("homme");
    }else{
        joueurDom.classList.add(joueur.genre.value == bd.tournoi.genreListe.HOMME.value ? "homme" : "femme");
    }
    switch (currentPage){
        case pages.SELECTION_JOUEUR:
            var check = MH.makeInput("checkbox");
            if (joueur.selected === true) check.setAttribute("checked", "true");
            check.setAttribute("id", "joueur" + i);
            joueurDom.appendChild(check);
            joueurDom.classList.add("selection");
            joueurDom.appendChild(MH.makeSpan(joueur.name, "nomJoueur"));
            joueurDom.appendChild(buildBadgeNiveau(joueur));
            break;
        case pages.ACCUEIL:
        case pages.EXECUTION_TOURNOI:
            joueurDom.classList.add("accueil");
            joueurDom.appendChild(MH.makeSpan(joueur.name, "nomJoueur"));
            joueurDom.appendChild(buildBadgeNiveau(joueur));
            break;
        case pages.MODIFICATION_JOUEUR:
            joueurDom.appendChild(buildPropertyEditor("Nom", "text", {"id": "nomJoueur", value : joueur.name}));
            var elementsGenre = [];
            for (var gen in bd.tournoi.genreListe){
                elementsGenre.push({"id": gen, "name": "genre", "value": bd.tournoi.genreListe[gen].value, "checked": joueur.genre.value === bd.tournoi.genreListe[gen].value})
            }

            joueurDom.appendChild(buildPropertyEditor("Genre", "radio",
                {name: "genre", elements : elementsGenre}));
            MH.addNewEvent("HOMME", "change", changeGenre.bind(this));
            MH.addNewEvent("FEMME", "change", changeGenre.bind(this));
            var elementsNiv = [];
            for (var niv in bd.tournoi.niveauListe){
                elementsNiv.push({"id": niv, "name": "niveau", "value": bd.tournoi.niveauListe[niv].value, "checked": joueur.niveau.value === bd.tournoi.niveauListe[niv].value})
            }
            joueurDom.appendChild(buildPropertyEditor("Niveau", "radio",
                {name: "niveau", elements : elementsNiv}));
            for (var niv in bd.tournoi.niveauListe){
                var nive = joueurDom.querySelector("#" + niv).nextSibling;
                nive.classList.add("badge");
                if (niv[0] == "P"){
                    nive.classList.add("badge-secondary");
                }else if (niv[0] == "D"){
                    nive.classList.add("badge-warning");
                }else if (niv[0] == "R"){
                    nive.classList.add("badge-danger");
                }else if (niv[0] == "N"){
                    nive.classList.add("badge-dark");
                }
            }
            break;
    }
    return joueurDom;
}

function buildBadgeNiveau(joueur){
    var niveau = MH.makeSpan(joueur.niveau.value);
    niveau.classList.add("badge");
    if (joueur.niveau.value[0] == "P"){
        niveau.classList.add("badge-secondary");
    }else if (joueur.niveau.value[0] == "D"){
        niveau.classList.add("badge-warning");
    }else if (joueur.niveau.value[0] == "R"){
        niveau.classList.add("badge-danger");
    }else if (joueur.niveau.value[0] == "N"){
        niveau.classList.add("badge-dark");
    }
    return niveau;
}

function buildPropertyViewer(pKey, pValue){
    var property = MH.makeDiv(null, "property");
    var key = MH.makeLabel(pKey);
    key.classList.add("propertyKey");
    var value = MH.makeSpan(pValue);
    value.classList.add("propertyValue");
    property.appendChild(key);
    property.appendChild(value);
    return property;
}

function buildPropertyEditor(pKey, type, attributes){
    var property = MH.makeDiv(null, "property");
    if (type == "checkbox") property.classList.add("propertyRow");
    var key = MH.makeLabel(pKey);
    key.classList.add("propertyKey");
    key.setAttribute("for", attributes["id"]);
    var value = buildEditor(type, attributes);
    value.classList.add("propertyValue");
    if (attributes["column-reverse"] == true){
        key.classList.add("columnReverse");
        property.appendChild(value);
        if (pKey != null) property.appendChild(key);
    }else{
        if (pKey != null) property.appendChild(key);
        property.appendChild(value);
    }

    return property;
}

function buildEditor(type, attributes){
    switch (type){
        case "radio":
            var divInput, input, label;
            var retour = MH.makeDiv();
            for (var i = 0; i < attributes["elements"].length; i++){
                divInput = MH.makeDiv(null, "divRadio radio" + attributes["name"]);
                input = MH.makeInput("radio", {
                    "id": attributes["elements"][i]["id"],
                    "name": attributes["elements"][i]["name"],
                    "value": attributes["elements"][i]["value"]
                });
                if (attributes["elements"][i]["checked"] === true) input.setAttribute("checked", "true");
                label = MH.makeElt("label", null, "labelCheckbox");
                label.setAttribute("for", attributes["elements"][i]["id"]);
                label.innerHTML = attributes["elements"][i]["value"];
                divInput.appendChild(input);
                divInput.appendChild(label);
                retour.appendChild(divInput);
            }
            return retour;
        case "checkbox":
            var input = MH.makeInput("checkbox");
            if (attributes["value"] === true){
                input.setAttribute("checked", "true");
            }
            input.setAttribute("id", attributes["id"]);
            return input;
        case "number":
            var input = MH.makeInput("number");
            input.setAttribute("min", attributes["min"]);
            input.setAttribute("max", attributes["max"]);
            input.setAttribute("value", attributes["value"]);
            input.setAttribute("id", attributes["id"]);
            return input;
        case "numberSpinner":
            var vertical = attributes["vertical"] == true;
            var divInputNumber = MH.makeDiv(attributes["id"], "numberSpinner" + (vertical ? " vertical" : ""));
            for (var att in attributes){
                divInputNumber.setAttribute(att, attributes[att]);
            }
            var spanNumber = MH.makeSpan(attributes["value"], "numberSpinnerValue");
            divInputNumber.appendChild(spanNumber);

            var buttonMoins = MH.makeButton({
                type: "click",
                func: numberPlusOuMoins.bind(this, false, spanNumber, undefined, )
            });
            buttonMoins.addEventListener('touchstart', preventZoom);
            buttonMoins.innerHTML = "-";
            buttonMoins.classList.add("btn-secondary");
            buttonMoins.classList.add("numberSpinnerPlusMoins");
            buttonMoins.classList.add("numberSpinnerMoins"+ (vertical ? "Vertical" : ""));
            divInputNumber.insertBefore(buttonMoins, spanNumber);

            var buttonPlus = MH.makeButton({
                type: "click",
                func: numberPlusOuMoins.bind(this, true, spanNumber, undefined)
            });
            buttonPlus.addEventListener('touchstart', preventZoom);
            buttonPlus.innerHTML = "+";
            buttonPlus.classList.add("btn-secondary");
            buttonPlus.classList.add("numberSpinnerPlusMoins");
            buttonPlus.classList.add("numberSpinnerPlus"+ (vertical ? "Vertical" : ""));
            divInputNumber.appendChild(buttonPlus);

            return divInputNumber;
        default:
            return MH.makeInput(type, attributes);
    }
}

//interfaces
function buildInterfaceHeaderAccueil(){

    var listIcon = MH.makeIcon("gear");

    var interfaces = [];

    var buttonImport = MH.makeElt("label", null, "btn-file", "margin:0px;");
    var newId = MH.getNewId();
    var input = MH.makeInput("file", {"id": newId, "accept": ".json", "style" : "display:none;"});
    MH.addNewEvent(newId,"change", bd.import.bind(input));
    buttonImport.setAttribute("title", "Importer un tournoi");
    buttonImport.classList.add("btn");
    buttonImport.classList.add("btn-light");
    buttonImport.appendChild(MH.makeSpan("Importer")/*MH.makeIcon("import")*/);
    buttonImport.appendChild(input);
    interfaces.push(buttonImport);

    var exp = MH.makeButton({
        type: "click",
        func: bd.export.bind(bd)
    }/*, "export"*/);
    exp.innerHTML = "Exporter";
    exp.setAttribute("title", "Exporter un tournoi");
    exp.classList.add("bouton");
    exp.style = "margin:0px;";
    interfaces.push(exp);

    var reset = MH.makeButton({
        type: "click",
        func: showModalReset.bind(this)
    }/*, "reset"*/);
    reset.innerHTML = "Reset";
    reset.classList.add("btn-danger");
    reset.style = "margin:0px;";
    interfaces.push(reset);

    return MH.makeDropDown(listIcon.outerHTML, interfaces);
}

//actions
function onKeyDown(evt){
    if (evt.code == "Enter"){
        switch(currentPage){
            case pages.MODIFICATION_JOUEUR:
                validModificationJoueur();
                break;
        }
    }else if (evt.code == "Escape"){
        switch(currentPage){
            case pages.MODIFICATION_JOUEUR:
                cancelModificationJoueur();
                break;
        }
    }
}
function showModalDeleteJoueur(){
    $('#modalDeleteJoueur').modal('show');
}
function showModalReset(){
    $('#modalReset').modal('show');
}
function reset(){
    bd.joueurs = [];
    bd.tournoi = new Tournoi();
    bd.save();
    $('#modalReset').modal('toggle');
    selectPage(pages.ACCUEIL);
}
function preLancerTournoi(){
    if (bd.tournoi.tours.length > 0){
        $('#modalPreLancer').modal('toggle');
    }else{
        lancerTournoi();
    }
}

function afficheInfo(evt){
    $('#modalInfoCredit').modal('toggle');
    document.getElementById("buttonApropos").click();
}

function lancerTournoi(){
    $('#modalPreLancer').modal('hide');

    genereTournoi();
    bd.updateTournoi({"date": new Date()});
    bd.updateTournoi({"currentTour": 0});
    selectPage(pages.EXECUTION_TOURNOI);
}

function showModalFinTournoi(){
    $('#modalFinTournoi').modal('show');
}
function finTournoi(){
    var scoreEquipeA, scoreEquipeB, equipeAGagne, equipeAGagneMoins, equipeBGagneMoins;
    for (var i = 0; i < bd.tournoi.tours.length; i++){
        for (var j = 0; j < bd.tournoi.tours[i].matchs.length; j++){
            scoreEquipeA = bd.tournoi.tours[i].matchs[j].ptsEquipeA;
            scoreEquipeB = bd.tournoi.tours[i].matchs[j].ptsEquipeB;
            egalite = scoreEquipeA == scoreEquipeB;
            equipeAGagne = scoreEquipeA > scoreEquipeB && (scoreEquipeA - scoreEquipeB > 2);
            equipeAGagneMoins = scoreEquipeA > scoreEquipeB && (scoreEquipeA - scoreEquipeB <= 2);
            equipeBGagneMoins = scoreEquipeB > scoreEquipeA && (scoreEquipeB - scoreEquipeA <= 2);
            for (var k = 0; k < bd.tournoi.tours[i].matchs[j].equipeA.length; k++){
                bd.tournoi.tours[i].matchs[j].equipeA[k].points +=
                    egalite ? 4 : (equipeAGagne ? 5 : (equipeAGagneMoins ? 3 : (equipeBGagneMoins ? 2 : 1)));
            }
            for (var m = 0; m < bd.tournoi.tours[i].matchs[j].equipeB.length; m++){
                bd.tournoi.tours[i].matchs[j].equipeB[m].points +=
                    egalite ? 4 : (equipeAGagne ? 1 : (equipeAGagneMoins ? 2 : (equipeBGagneMoins ? 3 : 5)));
            }
        }
    }

    bd.updateTournoi({"currentTour": -1});
    $('#modalFinTournoi').modal('hide');
    selectPage(pages.ACCUEIL);
}
function validTour(){
    var matchsNonTermine = false;
    for (var i = 0; i < bd.tournoi.tours[bd.tournoi.currentTour].matchs.length; i++){
        if (bd.tournoi.tours[bd.tournoi.currentTour].matchs[i].ptsEquipeA < bd.tournoi.nbPoints &&
            bd.tournoi.tours[bd.tournoi.currentTour].matchs[i].ptsEquipeB < bd.tournoi.nbPoints){
            matchsNonTermine = true;
            break;
        }
    }

    if (matchsNonTermine){
        showModalMatchsNonTermine();
        return;
    }
    if (bd.tournoi.currentTour < bd.tournoi.nbTour - 1){
        bd.tournoi.currentTour++;
        bd.save();
        selectPage(pages.EXECUTION_TOURNOI);
        document.body.querySelector("#headerTour" + bd.tournoi.currentTour).scrollIntoView({
            behavior: 'smooth'
        });
        //window.location.href = "#headerTour" + bd.tournoi.currentTour;
    }else{
        finTournoi();
    }
}
function retourModificationPreparation(){
    validModificationPreparation();
}
function retourModificationHandicaps(){
    validModificationHandicaps();
}
function retourModificationContraintes(){
    selectPage(pages.MODIFICATION_PREPARATION);
}

function retourModificationJoueur(){
    cancelModificationJoueur();
}
function retourSelectionJoueur(){
    updateSelectJoueur();
    selectPage(pages.ACCUEIL);
}
function addJoueur(evt){
    editJoueur(-1, evt);
}

function importJoueurs(evt){
    selectPage(pages.IMPORT_JOUEURS);
}
function cancelImportJoueurs(){
    selectPage(pages.SELECTION_JOUEUR);
}
function validImportJoueurs(){
    var list =  document.getElementById("listGroupeJoueur").querySelectorAll("input");
    for (var i = 0; i < list.length; i++){
        if (list[i].checked){
            var listJoueurs = groupeJoueurs[list[i].parentElement.querySelector("span").innerHTML];
            for (var j = 0; j < listJoueurs.length; j++){
                bd.addJoueur(listJoueurs[j]);
            }
        }
    }
    selectPage(pages.SELECTION_JOUEUR);
}
function showModalJoueurExist(nomJoueur){
    $('#modalJoueurExist div.modal-body').html('Le joueur : ' + nomJoueur + ' existe déjà.');
    $('#modalJoueurExist').modal('show');
}
function showModalMatchsNonTermine(nomJoueur){
    $('#modalMatchNonTermine div.modal-body').html('Tous les matchs ne sont pas terminés pour ce tour !');
    $('#modalMatchNonTermine').modal('show');
}

function editPreparation(){
    selectPage(pages.MODIFICATION_PREPARATION);
}
function editContraintes(){
    selectPage(pages.MODIFICATION_CONTRAINTES);
}
function editSelectionJoueurs(){
    selectPage(pages.SELECTION_JOUEUR);
}
function validModificationJoueur(){
    var ok = true;
    var nomJoueur = document.getElementById("nomJoueur").value;
    if (currentEditionId == -1){
        ok = bd.addJoueur(new Joueur(
            nomJoueur,
            bd.tournoi.genreListe[document.body.querySelector("div.radiogenre input:checked").id],
            bd.tournoi.niveauListe[document.body.querySelector("div.radioniveau input:checked").id],
            false,
            0));
    }else{
        ok = bd.updateJoueur(currentEditionId, {
            "name": nomJoueur,
            "niveau": bd.tournoi.niveauListe[document.body.querySelector("div.radioniveau input:checked").id],
            "genre": bd.tournoi.genreListe[document.body.querySelector("div.radiogenre input:checked").id],
        });
    }
    if (ok) selectPage(pages.SELECTION_JOUEUR);
    else showModalJoueurExist(nomJoueur);
}
function cancelModificationJoueur(){
    selectPage(pages.SELECTION_JOUEUR);
}
function validModificationHandicaps(){
    var genreListe = {};
    var handicapGenre = document.body.querySelectorAll(".handicapGenre");
    var inter;
    for (var i = 0; i< handicapGenre.length; i++){
        inter = handicapGenre[i].querySelector(".propertyValue");
        genreListe[inter.id] = {
            "value": handicapGenre[i].children[0].innerHTML,
            "handicap": parseInt(handicapGenre[i].querySelector(".numberSpinnerValue").innerHTML)
        };
    }

    var niveauListe = {};
    var handicapNiveau = document.body.querySelectorAll(".handicapNiveau");
    for (var i = 0; i< handicapNiveau.length; i++){
        inter = handicapNiveau[i].querySelector(".propertyValue");
        niveauListe[inter.id] = {
            "value": handicapNiveau[i].children[0].innerHTML,
            "handicap": parseInt(handicapNiveau[i].querySelector(".numberSpinnerValue").innerHTML)
        };
    }

    bd.updateTournoi({
        "niveauListe": niveauListe,
        "genreListe": genreListe,
        "departMatchNegatif": document.body.querySelector("#departMatchNegatif").checked
    });
    selectPage(pages.MODIFICATION_PREPARATION);
}
function cancelModificationHandicaps(){
    selectPage(pages.MODIFICATION_PREPARATION);
}
function validModificationContraintes(){

    var contraintes = document.body.querySelectorAll(".divContrainte");
    var retourContraintes = [];
    var currentContrainte;
    for (var i = 0; i < contraintes.length; i++){
        currentContrainte = {
            "name": bd.tournoi.contraintes[i].name,
            "title": bd.tournoi.contraintes[i].title,
            "desc": bd.tournoi.contraintes[i].desc,
            "actif": contraintes[i].querySelector("input").checked,
            "disabled": bd.tournoi.contraintes[i].disabled,
        }
        retourContraintes.push(currentContrainte);
        if (currentContrainte.name == "LIMITPOINT") {
            bd.updateTournoi({"limitPoint": contraintes[i].querySelector("#limitPoint").value });
        }
    }
    bd.updateContraintes(retourContraintes);
    selectPage(pages.MODIFICATION_PREPARATION);
}
function cancelModificationContraintes(){
    selectPage(pages.MODIFICATION_PREPARATION);
}
function validModificationPreparation(dontExit){
    bd.updateTournoi({
        "typeTournoi": typeTournoiListe[document.body.querySelector("div.radiotypeTournoi input:checked").id],
        "nbTour": parseInt(document.body.querySelector("#nbTour .numberSpinnerValue").innerHTML),
        "nbTerrain": parseInt(document.body.querySelector("#nbTerrain .numberSpinnerValue").innerHTML),
        "nbPoints": parseInt(document.body.querySelector("#nbPoints .numberSpinnerValue").innerHTML)
    });
    bd.updateContraintes();
    if (dontExit === true) {
        selectPage(pages.MODIFICATION_PREPARATION);
    }else{
        selectPage(pages.ACCUEIL);
    }

}
function cancelModificationPreparation(){
    selectPage(pages.ACCUEIL);
}
function editJoueur(i, evt){
    evt.preventDefault();
    evt.cancelBubble = true;
    currentEditionId = i;
    selectPage(pages.MODIFICATION_JOUEUR);
}
function changeGenre(evt){
    var divJoueur = evt.currentTarget.closest(".joueur");
    if (evt.currentTarget.id == "HOMME"){
        divJoueur.classList.remove("femme");
        divJoueur.classList.add("homme");
    }else{
        divJoueur.classList.remove("homme");
        divJoueur.classList.add("femme");
    }
}
function deleteJoueur(){
    bd.deleteJoueur(currentEditionId);
    $('#modalDeleteJoueur').modal('toggle');
    selectPage(pages.SELECTION_JOUEUR);
}
function updateSelectJoueur(evt){
    var list = document.getElementById("listJoueurs").parentElement.parentElement.querySelectorAll("input[type=checkbox]");
    for (var i = 1; i < list.length; i++){
        bd.updateJoueur(i - 1, {"selected": list[i].checked});
    }
}
function selectJoueur(div){
    var input = div.querySelector("input[type=checkbox]");
    input.checked = !input.checked;
}
function selectGroupe(div){
    var input = div.querySelector("input[type=checkbox]");
    input.checked = !input.checked;
}
function selectAll(input){
    var list = input.parentElement.parentElement.querySelectorAll("input[type=checkbox]");
    var inputChecked = input.checked;
    for (var i = 0; i < list.length; i++){
        list[i].checked = inputChecked;
    }
}
function monterContrainte(i){
    if (i > 0){
        var cDisabled = bd.tournoi.contraintes[i - 1].disabled;
        var movedElt = bd.tournoi.contraintes[i];
        bd.tournoi.contraintes.splice(i, 1);
        bd.tournoi.contraintes.splice(i - 1 - (cDisabled ? 1 : 0), 0, movedElt);
    }
    selectPage(pages.MODIFICATION_CONTRAINTES);
}
function descendreContrainte(i){
    if (i < bd.tournoi.contraintes.length - 1){
        var cDisabled = bd.tournoi.contraintes[i + 1].disabled;
        var movedElt = bd.tournoi.contraintes[i];
        bd.tournoi.contraintes.splice(i, 1);
        bd.tournoi.contraintes.splice(i + 1 + (cDisabled ? 1 : 0), 0, movedElt);
    }
    selectPage(pages.MODIFICATION_CONTRAINTES);
}
function numberPlusOuMoins(sens, span, newValue){
    var retourValue;
    var value =  parseInt(span.innerHTML);
    if (newValue == undefined){
        if (sens){
            var max = parseInt(span.parentElement.getAttribute("max"));
            if (value < max) span.innerHTML = value + 1;
            span.parentElement.setAttribute("value", span.innerHTML);
            retourValue = parseInt(span.innerHTML);
        } else{
            var min = parseInt(span.parentElement.getAttribute("min"));
            if (value > min) span.innerHTML = value - 1;
            span.parentElement.setAttribute("value", span.innerHTML);
            retourValue = parseInt(span.innerHTML);
        }
    }else{
        span.innerHTML = newValue;
        span.parentElement.setAttribute("value", span.innerHTML);
        retourValue = parseInt(span.innerHTML);
    }

    switch (currentPage){
        case pages.EXECUTION_TOURNOI:
            var indexMatch = parseInt(span.parentElement.getAttribute("indexmatch"));
            var indexEquipe = span.parentElement.getAttribute("indexequipe");
            changeScore(indexMatch, indexEquipe, retourValue);
            refreshMatch(span.closest(".match"));
            break;
    }

}
function editHandicaps(){
    selectPage(pages.MODIFICATION_HANDICAPS);
}
function changeScore(indexMatch, indexEquipe, value){
    bd.updateMatch(indexMatch, indexEquipe, value);
}
function victoire(span){
    var match = span.closest(".match");
    var equipes = match.querySelectorAll("div.pointMatch>div.numberSpinner");
    var equipeA = equipes[0];
    var scoreEquipeA = parseInt(equipeA.getAttribute("value"));
    var equipeB = equipes[1];
    var scoreEquipeB = parseInt(equipeB.getAttribute("value"));

    var equipeCurrent = span.closest(".numberSpinner");
    var currentIsEquipeA = equipeCurrent.getAttribute("indexequipe") == "ptsEquipeA";
    var scoreEquipeOppose = currentIsEquipeA ? scoreEquipeB : scoreEquipeA;
    var target;
    if (scoreEquipeOppose <= bd.tournoi.nbPoints -2){
        target = bd.tournoi.nbPoints;
    }else{
        target = scoreEquipeOppose + 2;
    }
    numberPlusOuMoins(null, span, target);
}

function refreshMatch(domMatch, match){
    var equipes = domMatch.querySelectorAll("div.pointMatch>div.numberSpinner");
    var equipeA = equipes[0];
    var scoreEquipeA = parseInt(equipeA.getAttribute("value"));
    var equipeB = equipes[1];
    var scoreEquipeB = parseInt(equipeB.getAttribute("value"));

    if (scoreEquipeA == scoreEquipeB){
        equipeA.classList.remove("perd");
        equipeA.classList.remove("gagne");
        equipeB.classList.remove("perd");
        equipeB.classList.remove("gagne");
        equipeA.classList.add("egalite");
        equipeB.classList.add("egalite");
    }else{
        equipeA.classList.remove("egalite");
        equipeB.classList.remove("egalite");
        equipeA.classList.add(scoreEquipeA > scoreEquipeB ? "gagne" : "perd");
        equipeA.classList.remove(scoreEquipeA > scoreEquipeB ? "perd" : "gagne");
        equipeB.classList.add(scoreEquipeB > scoreEquipeA ? "gagne" : "perd");
        equipeB.classList.remove(scoreEquipeB > scoreEquipeA ? "perd" : "gagne");
    }

}

//***** MAKER HTML */
class MH {
    static idCompt = 0;
    static listEvents = [];
    static getNewId(){
        var newId = "id" + this.idCompt;
        this.idCompt++;
        return newId;
    }
    static makeElt(type, id, className, style){
        var elt = document.createElement(type);
        if (id != undefined) elt.setAttribute("id", id);
        if (className != undefined) elt.setAttribute("class", className);
        if (style != undefined) elt.style = style;
        return elt;
    }
    static makeTh(content, className){var span = this.makeElt("span", undefined, className); span.innerHTML = content; var th = MH.makeElt("th"); th.appendChild(span); return th;};
    static makeTd(content, className){var span = this.makeElt("span", undefined, className); span.innerHTML = content; var td = MH.makeElt("td"); td.appendChild(span); return td;};
    static makeSpan(content, className){var span = this.makeElt("span", undefined, className); span.innerHTML = content; return span;};
    static makeLabel(content, className, forr){var label = this.makeElt("label", undefined, className); label.innerHTML = content; if (forr != undefined) label.setAttribute("for", forr); return label;};
    static makeDiv(id, className, style){return this.makeElt("div", id, className, style)}
    static makeInput(type, attributes){
        var input = MH.makeElt("input");
        input.setAttribute("type", type);
        for (var elt in attributes){
            input.setAttribute(elt, attributes[elt]);
        }
        return input;
    }
    static makeIcon(type, base64, typeImage){
        if (base64 == undefined) base64 = true;
        if (typeImage == undefined) typeImage = "svg+xml";
        var img = MH.makeElt("img");
        var src = base64 ? "data:image/" + typeImage + ";base64, " : "";
        switch (type){
            case "edit":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktcGVuY2lsLWZpbGwiIGZpbGw9ImN1cnJlbnRDb2xvciIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTIuODU0LjE0NmEuNS41IDAgMCAwLS43MDcgMEwxMC41IDEuNzkzIDE0LjIwNyA1LjVsMS42NDctMS42NDZhLjUuNSAwIDAgMCAwLS43MDhsLTMtM3ptLjY0NiA2LjA2MUw5Ljc5MyAyLjUgMy4yOTMgOUgzLjVhLjUuNSAwIDAgMSAuNS41di41aC41YS41LjUgMCAwIDEgLjUuNXYuNWguNWEuNS41IDAgMCAxIC41LjV2LjVoLjVhLjUuNSAwIDAgMSAuNS41di4yMDdsNi41LTYuNXptLTcuNDY4IDcuNDY4QS41LjUgMCAwIDEgNiAxMy41VjEzaC0uNWEuNS41IDAgMCAxLS41LS41VjEyaC0uNWEuNS41IDAgMCAxLS41LS41VjExaC0uNWEuNS41IDAgMCAxLS41LS41VjEwaC0uNWEuNDk5LjQ5OSAwIDAgMS0uMTc1LS4wMzJsLS4xNzkuMTc4YS41LjUgMCAwIDAtLjExLjE2OGwtMiA1YS41LjUgMCAwIDAgLjY1LjY1bDUtMmEuNS41IDAgMCAwIC4xNjgtLjExbC4xNzgtLjE3OHoiLz4NCjwvc3ZnPg==";
                break;
            case "inverse":
                src += "arrow-repeat.svg";
                break;
            case "add":
                src += "plus.svg";
                break;
            case "import":
            case "export":
                src += "box-arrow-down.svg";
                break;
            case "retour":
                src += 'PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktYXJyb3ctbGVmdCIgZmlsbD0iY3VycmVudENvbG9yIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNSA4YS41LjUgMCAwIDAtLjUtLjVIMi43MDdsMy4xNDctMy4xNDZhLjUuNSAwIDEgMC0uNzA4LS43MDhsLTQgNGEuNS41IDAgMCAwIDAgLjcwOGw0IDRhLjUuNSAwIDAgMCAuNzA4LS43MDhMMi43MDcgOC41SDE0LjVBLjUuNSAwIDAgMCAxNSA4eiIvPg0KPC9zdmc+';
                break;
            case "delete":
            case "reset":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktdHJhc2giIGZpbGw9ImN1cnJlbnRDb2xvciIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCiAgPHBhdGggZD0iTTUuNSA1LjVBLjUuNSAwIDAgMSA2IDZ2NmEuNS41IDAgMCAxLTEgMFY2YS41LjUgMCAwIDEgLjUtLjV6bTIuNSAwYS41LjUgMCAwIDEgLjUuNXY2YS41LjUgMCAwIDEtMSAwVjZhLjUuNSAwIDAgMSAuNS0uNXptMyAuNWEuNS41IDAgMCAwLTEgMHY2YS41LjUgMCAwIDAgMSAwVjZ6Ii8+DQogIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTE0LjUgM2ExIDEgMCAwIDEtMSAxSDEzdjlhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJWNGgtLjVhMSAxIDAgMCAxLTEtMVYyYTEgMSAwIDAgMSAxLTFINmExIDEgMCAwIDEgMS0xaDJhMSAxIDAgMCAxIDEgMWgzLjVhMSAxIDAgMCAxIDEgMXYxek00LjExOCA0TDQgNC4wNTlWMTNhMSAxIDAgMCAwIDEgMWg2YTEgMSAwIDAgMCAxLTFWNC4wNTlMMTEuODgyIDRINC4xMTh6TTIuNSAzVjJoMTF2MWgtMTF6Ii8+DQo8L3N2Zz4=";
                break;
            case "list":
                src += "list.svg";
                break;
            case "gear":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktZ2Vhci1maWxsIiBmaWxsPSJjdXJyZW50Q29sb3IiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTkuNDA1IDEuMDVjLS40MTMtMS40LTIuMzk3LTEuNC0yLjgxIDBsLS4xLjM0YTEuNDY0IDEuNDY0IDAgMCAxLTIuMTA1Ljg3MmwtLjMxLS4xN2MtMS4yODMtLjY5OC0yLjY4Ni43MDUtMS45ODcgMS45ODdsLjE2OS4zMTFjLjQ0Ni44Mi4wMjMgMS44NDEtLjg3MiAyLjEwNWwtLjM0LjFjLTEuNC40MTMtMS40IDIuMzk3IDAgMi44MWwuMzQuMWExLjQ2NCAxLjQ2NCAwIDAgMSAuODcyIDIuMTA1bC0uMTcuMzFjLS42OTggMS4yODMuNzA1IDIuNjg2IDEuOTg3IDEuOTg3bC4zMTEtLjE2OWExLjQ2NCAxLjQ2NCAwIDAgMSAyLjEwNS44NzJsLjEuMzRjLjQxMyAxLjQgMi4zOTcgMS40IDIuODEgMGwuMS0uMzRhMS40NjQgMS40NjQgMCAwIDEgMi4xMDUtLjg3MmwuMzEuMTdjMS4yODMuNjk4IDIuNjg2LS43MDUgMS45ODctMS45ODdsLS4xNjktLjMxMWExLjQ2NCAxLjQ2NCAwIDAgMSAuODcyLTIuMTA1bC4zNC0uMWMxLjQtLjQxMyAxLjQtMi4zOTcgMC0yLjgxbC0uMzQtLjFhMS40NjQgMS40NjQgMCAwIDEtLjg3Mi0yLjEwNWwuMTctLjMxYy42OTgtMS4yODMtLjcwNS0yLjY4Ni0xLjk4Ny0xLjk4N2wtLjMxMS4xNjlhMS40NjQgMS40NjQgMCAwIDEtMi4xMDUtLjg3MmwtLjEtLjM0ek04IDEwLjkzYTIuOTI5IDIuOTI5IDAgMSAwIDAtNS44NiAyLjkyOSAyLjkyOSAwIDAgMCAwIDUuODU4eiIvPg0KPC9zdmc+";
                break;
            case "check":
                src += "check.svg";
                break;
            case "monter":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktY2FyZXQtdXAtZmlsbCIgZmlsbD0iY3VycmVudENvbG9yIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPg0KICA8cGF0aCBkPSJNNy4yNDcgNC44NmwtNC43OTYgNS40ODFjLS41NjYuNjQ3LS4xMDYgMS42NTkuNzUzIDEuNjU5aDkuNTkyYTEgMSAwIDAgMCAuNzUzLTEuNjU5bC00Ljc5Ni01LjQ4YTEgMSAwIDAgMC0xLjUwNiAweiIvPg0KPC9zdmc+";
                break;
            case "descendre":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktY2FyZXQtZG93bi1maWxsIiBmaWxsPSJjdXJyZW50Q29sb3IiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxwYXRoIGQ9Ik03LjI0NyAxMS4xNEwyLjQ1MSA1LjY1OEMxLjg4NSA1LjAxMyAyLjM0NSA0IDMuMjA0IDRoOS41OTJhMSAxIDAgMCAxIC43NTMgMS42NTlsLTQuNzk2IDUuNDhhMSAxIDAgMCAxLTEuNTA2IDB6Ii8+DQo8L3N2Zz4=";
                break;
            case "victoire":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktdHJvcGh5LWZpbGwiIGZpbGw9ImN1cnJlbnRDb2xvciIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCiAgPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMi41LjVBLjUuNSAwIDAgMSAzIDBoMTBhLjUuNSAwIDAgMSAuNS41YzAgLjUzOC0uMDEyIDEuMDUtLjAzNCAxLjUzNmEzIDMgMCAxIDEtMS4xMzMgNS44OWMtLjc5IDEuODY1LTEuODc4IDIuNzc3LTIuODMzIDMuMDExdjIuMTczbDEuNDI1LjM1NmMuMTk0LjA0OC4zNzcuMTM1LjUzNy4yNTVMMTMuMyAxNS4xYS41LjUgMCAwIDEtLjMuOUgzYS41LjUgMCAwIDEtLjMtLjlsMS44MzgtMS4zNzljLjE2LS4xMi4zNDMtLjIwNy41MzctLjI1NUw2LjUgMTMuMTF2LTIuMTczYy0uOTU1LS4yMzQtMi4wNDMtMS4xNDYtMi44MzMtMy4wMTJhMyAzIDAgMSAxLTEuMTMyLTUuODlBMzMuMDc2IDMzLjA3NiAwIDAgMSAyLjUuNXptLjA5OSAyLjU0YTIgMiAwIDAgMCAuNzIgMy45MzVjLS4zMzMtMS4wNS0uNTg4LTIuMzQ2LS43Mi0zLjkzNXptMTAuMDgzIDMuOTM1YTIgMiAwIDAgMCAuNzItMy45MzVjLS4xMzMgMS41OS0uMzg4IDIuODg1LS43MiAzLjkzNXoiLz4NCjwvc3ZnPg==";
                break;
            case "logoLigue":
                src += ""
            case "question":
                src += "PHN2ZyB3aWR0aD0iMWVtIiBoZWlnaHQ9IjFlbSIgdmlld0JveD0iMCAwIDE2IDE2IiBjbGFzcz0iYmkgYmktcXVlc3Rpb24tY2lyY2xlIiBmaWxsPSJjdXJyZW50Q29sb3IiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTggMTVBNyA3IDAgMSAwIDggMWE3IDcgMCAwIDAgMCAxNHptMCAxQTggOCAwIDEgMCA4IDBhOCA4IDAgMCAwIDAgMTZ6Ii8+DQogIDxwYXRoIGQ9Ik01LjI1NSA1Ljc4NmEuMjM3LjIzNyAwIDAgMCAuMjQxLjI0N2guODI1Yy4xMzggMCAuMjQ4LS4xMTMuMjY2LS4yNS4wOS0uNjU2LjU0LTEuMTM0IDEuMzQyLTEuMTM0LjY4NiAwIDEuMzE0LjM0MyAxLjMxNCAxLjE2OCAwIC42MzUtLjM3NC45MjctLjk2NSAxLjM3MS0uNjczLjQ4OS0xLjIwNiAxLjA2LTEuMTY4IDEuOTg3bC4wMDMuMjE3YS4yNS4yNSAwIDAgMCAuMjUuMjQ2aC44MTFhLjI1LjI1IDAgMCAwIC4yNS0uMjV2LS4xMDVjMC0uNzE4LjI3My0uOTI3IDEuMDEtMS40ODYuNjA5LS40NjMgMS4yNDQtLjk3NyAxLjI0NC0yLjA1NiAwLTEuNTExLTEuMjc2LTIuMjQxLTIuNjczLTIuMjQxLTEuMjY3IDAtMi42NTUuNTktMi43NSAyLjI4NnptMS41NTcgNS43NjNjMCAuNTMzLjQyNS45MjcgMS4wMS45MjcuNjA5IDAgMS4wMjgtLjM5NCAxLjAyOC0uOTI3IDAtLjU1Mi0uNDItLjk0LTEuMDI5LS45NC0uNTg0IDAtMS4wMDkuMzg4LTEuMDA5Ljk0eiIvPg0KPC9zdmc+";
                break;
            default:
                src += "question.svg";
                break;
        }
        img.setAttribute("src", src);
        img.setAttribute("width", "12");
        img.setAttribute("heigth", "12");
        return img;
    }
    static makeButton(callBack, icon, txt){
        var newId = undefined;
        if (callBack != undefined){
            newId = MH.getNewId();
            this.addNewEvent(newId, callBack.type, callBack.func);
        }
        var button = MH.makeElt("button", newId, "btn");
        if (icon != undefined){
            button.innerHTML = MH.makeIcon(icon).outerHTML;
        }
        if (txt != undefined){
            button.innerHTML += txt;
        }
        return button;
    }

    static makeButtonCancel(callBack){
        var but = this.makeButton(callBack);
        but.classList.add("btn-light");
        but.innerHTML = "Annuler";
        return but;
    }
    static makeButtonValid(callBack){
        var but = this.makeButton(callBack);
        but.classList.add("btn-primary");
        but.innerHTML = "Valider";
        return but;
    }


    static addNewEvent(id, type, func){
        this.listEvents.push({
            "id": id,
            "type": type,
            "function": func
        });
    }
    static loadEvents(){
        var elt;
        for (var i = 0; i < this.listEvents.length; i++){
            elt = document.getElementById(this.listEvents[i]["id"]);
            elt.removeEventListener(
                this.listEvents[i]["type"],
                window);
            elt.addEventListener(
                this.listEvents[i]["type"],
                this.listEvents[i]["function"]);
        }
        this.listEvents = [];
        this.idCompt = 0;
    }

    static makeDropDown = function(titre, interfaces){
        var div = MH.makeElt("div");
        var a = MH.makeElt("a", "navbarDropdownMenuLink", " btn-light nav-link dropdown-toggle");
        a.innerHTML = titre;
        a.setAttribute("data-toggle", "dropdown");
        a.setAttribute("aria-haspopup", "true");
        a.setAttribute("aria-expanded", "false");
        a.setAttribute("href", "#")

        var dropDownMenu = MH.makeElt("div", undefined, "dropdown-menu");
        dropDownMenu.style = "z-index:1030;";
        dropDownMenu.setAttribute("aria-labelledby", "navbarDropdownMenuLink");

        for (var i = 0; i < interfaces.length; i++){
            interfaces[i].classList.add("dropdown-item");
            dropDownMenu.appendChild(interfaces[i]);
        }

        div.appendChild(a);
        div.appendChild(dropDownMenu);
        return div;
    }

}


/********GENERATION DU TOURNOI */
var sac, allMatchs, joueurAttente;
function alea(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
//on met les joueurs dans le sac de façon aléatoire
function mettreJoueursDansSac() {
    sac = [];
    for (var i = 0; i < bd.joueurs.length; i++){
        if (bd.joueurs[i].selected){
            bd.joueurs[i].index = i;
            sac.splice(alea(sac.length), 0, bd.joueurs[i]);
        }
    }
}

//on créé tous les matchs possibles
function populateAllMatchs(){
    allMatchs = [];
    var match, equipeA, equipeB, ptsEquipeA, ptsEquipeB;
    var tournoiSimple = bd.tournoi.typeTournoi == typeTournoiListe.SIMPLE;

    if (tournoiSimple){
        for (var i = 0; i < sac.length; i++){
            for (var j = 0; j < sac.length; j++){
                equipeA = [sac[i]];
                equipeB = [sac[j]];
                if (matchCoherent(equipeA, equipeB)) {
                    allMatchs.push(newMatch(equipeA, equipeB));
                }
            }
        }
    }else{

        //on génére tous les binomes possible
        var binomes = [];
        for (var i = 0; i < sac.length; i++){
            for (var j = 0; j < sac.length; j++){
                if (j > i) {
                    binomes.push([sac[i], sac[j]]);
                }
            }
        }
        //on génére tous les matchs possibles
        for (var i = 0; i < binomes.length; i++){
            for (var j = 0; j < binomes.length; j++){
                equipeA = binomes[i];
                equipeB = binomes[j];
                if (matchCoherent(equipeA, equipeB)) {
                    allMatchs.push(newMatch(equipeA, equipeB));
                }
            }
        }
    }
    return allMatchs;
}

function newMatch(equipeA, equipeB){
    var ptsEquipeA = 0;
    for (var m = 0; m < equipeA.length; m++){
        ptsEquipeA += equipeA[m].getPointsHandicap();
    }
    var ptsEquipeB = 0;
    for (var m = 0; m < equipeB.length; m++){
        ptsEquipeB += equipeB[m].getPointsHandicap();
    }

    //équilibrage des points
    var departNegatif = bd.tournoi.departMatchNegatif;
    if (ptsEquipeA > ptsEquipeB){
        ptsEquipeA -= ptsEquipeB;
        ptsEquipeB = 0;
        if ((departNegatif && ptsEquipeA > 0) ||
            (!departNegatif && ptsEquipeA < 0)){
            ptsEquipeB = ptsEquipeA * (-1);
            ptsEquipeA = 0;
        }
    }else {
        ptsEquipeB -= ptsEquipeA;
        ptsEquipeA = 0;
        if ((departNegatif && ptsEquipeB > 0) ||
            (!departNegatif && ptsEquipeB < 0)){
            ptsEquipeA = ptsEquipeB * (-1);
            ptsEquipeB = 0;
        }
    }

    var max = Math.max(ptsEquipeA, ptsEquipeB);
    if (max > 15){
        ptsEquipeA -= (max - 15);
        ptsEquipeB -= (max - 15);
    }

    return {
        "equipeA": equipeA,
        "equipeB": equipeB,
        "pointContrainte": 0,
        "ptsEquipeA": ptsEquipeA,
        "ptsEquipeB": ptsEquipeB,
        "ptsEquipeADepart": ptsEquipeA,
        "ptsEquipeBDepart": ptsEquipeB
    };
}

function matchCoherent(equipeA, equipeB){
    for (var i = 0; i < equipeA.length; i++){
        for (var j = 0; j < equipeB.length; j++){
            if (equipeA[i] == equipeB[j]) return false;
        }
    }
    return true;
}

function testContraintes(match){
    var facteur = 1;
    for (var index = bd.tournoi.contraintes.length - 1; index >= 0; index--){
        if (bd.tournoi.contraintes[index].actif && !bd.tournoi.contraintes[index].disabled){
            facteur *= 10;
            if (bd.tournoi.contraintes[index].name == "ISOSEXE"){

                var nbHommeEquipeA = 0;
                var nbHommeEquipeB = 0;
                for (var k = 0; k < match["equipeA"].length; k++){
                    if (match["equipeA"][k].genre.value == bd.tournoi.genreListe.HOMME.value)
                        nbHommeEquipeA++;
                }
                for (var k = 0; k < match["equipeB"].length; k++){
                    if (match["equipeB"][k].genre.value == bd.tournoi.genreListe.HOMME.value)
                        nbHommeEquipeB++;
                }
                if (nbHommeEquipeA != nbHommeEquipeB){
                    match.pointContrainte += facteur;
                }
            } else if (bd.tournoi.contraintes[index].name == "MIXTE") {
                let nbHommeEquipeA = 0;
                let nbFemmeEquipeA = 0;
                let nbHommeEquipeB = 0;
                let nbFemmeEquipeB = 0;
                for (var k = 0; k < match["equipeA"].length; k++){
                    if (match["equipeA"][k].genre.value == bd.tournoi.genreListe.HOMME.value) {
                        nbHommeEquipeA++;
                    } else {
                        nbFemmeEquipeA++;
                    }
                }
                for (var k = 0; k < match["equipeB"].length; k++){
                    if (match["equipeB"][k].genre.value == bd.tournoi.genreListe.HOMME.value) {
                        nbHommeEquipeB++;
                    } else {
                        nbFemmeEquipeB++;
                    }
                }
                // If team does not contain at least one men and one women apply penalty
                if (nbHommeEquipeA == 0 || nbFemmeEquipeA == 0 || nbHommeEquipeB == 0 || nbFemmeEquipeB == 0){
                    match.pointContrainte += facteur;
                }
            } else if (bd.tournoi.contraintes[index].name == "LIMITPOINT"){
                if (Math.abs(match["ptsEquipeA"] - match["ptsEquipeB"]) > bd.tournoi.limitPoint){
                    match.pointContrainte += facteur;
                }
            } else if (bd.tournoi.contraintes[index].name == "ADVERSAIRE"){
                var j1, j2;
                for (var k = 0; k < match["equipeA"].length; k++){
                    j1 = match["equipeA"][k];
                    for (var m = 0; m < match["equipeB"].length; m++){
                        j2 = match["equipeB"][m];
                        if (j1.adversaires.includes(j2))
                            match.pointContrainte += facteur;
                        if (j2.adversaires.includes(j1))
                            match.pointContrainte += facteur;
                    }
                }
            }  else if (bd.tournoi.contraintes[index].name == "COEQUIPIER"){
                var j1, j2;
                for (var k = 0; k < match["equipeA"].length; k++){
                    j1 = match["equipeA"][k];
                    for (var m = 0; m < match["equipeA"].length; m++){
                        j2 = match["equipeA"][m];
                        if (j1 != j2 &&
                            (j1.coequipiers.includes(j2)) || j2.coequipiers.includes(j1))
                            match.pointContrainte += facteur;
                    }
                }
                for (var k = 0; k < match["equipeB"].length; k++){
                    j1 = match["equipeB"][k];
                    for (var m = 0; m < match["equipeB"].length; m++){
                        j2 = match["equipeB"][m];
                        if (j1 != j2 &&
                            (j1.coequipiers.includes(j2)) || j2.coequipiers.includes(j1))
                            match.pointContrainte += facteur;
                    }
                }
            } else if (bd.tournoi.contraintes[index].name == "ATTENTE"){
                var j;
                for (var m = 0; m < match["equipeA"].length; m++){
                    j = match["equipeA"][m];
                    if (joueurAttente.filter(joueur => joueur.name == j.name).length > 0){
                        match.pointContrainte -= (facteur * joueurAttente[0]["nb"]);
                    }
                }
                for (var m = 0; m < match["equipeB"].length; m++){
                    j = match["equipeB"][m];
                    if (joueurAttente.filter(joueur => joueur.name == j.name).length > 0){
                        match.pointContrainte -= (facteur * joueurAttente[0]["nb"]);
                    }
                }
            }
        }
    }
}

// A  B  C  D  E
// A  x  1  1  1  1
// B  x  x  1  1  1
// C  x  x  x  1  1
// D  x  x  x  x  1
// E  x  x  x  x  x

function genereTournoi(){

    selecteurMatch = -1;
    bd.tournoi.tours = [];
    joueurAttente = [];

    //init
    for (var i = 0; i < bd.joueurs.length; i++){
        bd.joueurs[i].adversaires = [];
        bd.joueurs[i].coequipiers = [];
        bd.joueurs[i].points = 0;
    }

    var nbMatch;
    for (var i = 0; i < bd.tournoi.nbTour; i++){
        mettreJoueursDansSac(); //on met tous les joueurs dans un sac et on mélange
        populateAllMatchs(); //on génère tous les matchs possibles à partir des joueurs dans le sac

        //nombre de mathc par tour
        nbMatch = Math.min(
            Math.floor(sac.length / (typeTournoiListe.SIMPLE ? 2 : 4)),
            allMatchs.length,
            bd.tournoi.nbTerrain
        );

        //on teste tous les matchs en les priorisant
        for (var j = 0; j < allMatchs.length; j++){
            testContraintes(allMatchs[j]);
        }
        //on tri la liste
        allMatchs.sort((m1, m2) => m1.pointContrainte - m2.pointContrainte);
        var matchs = [];
        var currentMatch;
        for (var j = 0; j < nbMatch; j++){
            if (allMatchs.length == 0) break; //s'il n'y a plus de match dispo on sort
            currentMatch = allMatchs[0];
            matchs.push(currentMatch);
            //attribution adversaires
            for (var k = 0; k < currentMatch["equipeA"].length; k++){
                j1 = currentMatch["equipeA"][k];
                for (var m = 0; m < currentMatch["equipeB"].length; m++){
                    j2 = currentMatch["equipeB"][m];
                    if (!j1.adversaires.includes(j2)) j1.adversaires.push(j2);
                    if (!j2.adversaires.includes(j1)) j2.adversaires.push(j1);
                }
            }
            //et coequipiers equipe A
            var j1, j2;
            for (var k = 0; k < currentMatch["equipeA"].length; k++){
                j1 = currentMatch["equipeA"][k];
                for (var m = 0; m < currentMatch["equipeA"].length; m++){
                    j2 = currentMatch["equipeA"][m];
                    if (j1 != j2){
                        if (!j1.coequipiers.includes(j2)) j1.coequipiers.push(j2);
                        if (!j2.coequipiers.includes(j1)) j2.coequipiers.push(j1);
                    }
                }
            }
            //et coequipiers equipe B
            var j1, j2;
            for (var k = 0; k < currentMatch["equipeB"].length; k++){
                j1 = currentMatch["equipeB"][k];
                for (var m = 0; m < currentMatch["equipeB"].length; m++){
                    j2 = currentMatch["equipeB"][m];
                    if (j1 != j2){
                        if (!j1.coequipiers.includes(j2)) j1.coequipiers.push(j2);
                        if (!j2.coequipiers.includes(j1)) j2.coequipiers.push(j1);
                    }
                }
            }
            //on supprime tous les match ayant des joueurs déjà affecté sur ce tour
            allMatchs = allMatchs.filter(match =>
                match.equipeA.filter(joueur => currentMatch.equipeA.includes(joueur)).length == 0 &&
                match.equipeB.filter(joueur => currentMatch.equipeB.includes(joueur)).length == 0 &&
                match.equipeA.filter(joueur => currentMatch.equipeB.includes(joueur)).length == 0 &&
                match.equipeB.filter(joueur => currentMatch.equipeA.includes(joueur)).length == 0
            );

            //on supprime du sac les joueurs affectés a currentMatch
            var currentIndexOf;
            for (var k = 0; k < currentMatch.equipeA.length; k++){
                currentIndexOf = sac.indexOf(currentMatch.equipeA[k]);
                if (currentIndexOf != -1) sac.splice(currentIndexOf, 1);
            }
            for (var k = 0; k < currentMatch.equipeB.length; k++){
                currentIndexOf = sac.indexOf(currentMatch.equipeB[k]);
                if (currentIndexOf != -1) sac.splice(currentIndexOf, 1);
            }

        }

        //on ajoute dans joueur attente les joueurs restant dans le sac
        var flag;
        for (var k = 0; k < sac.length; k++){
            flag = false;
            for (var m = 0; m < joueurAttente.length; m++) {
                if (joueurAttente[m].name == sac[k].name){
                    joueurAttente[m]["nb"]++;
                    flag = true;
                }
            }
            if (!flag) joueurAttente.push({"name": sac[k].name, "nb": 1});
        }

        bd.tournoi.tours.push({"matchs": matchs, "joueurAttente": sac});
    }

}


