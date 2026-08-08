-- =====================================================================
--  XPARK GMAO - Jeu de donnees de demonstration
-- =====================================================================
--  But : remplir l'application de donnees coherentes et presentables
--  pour les captures d'ecran du rapport de fin d'etudes.
--
--  IDEMPOTENT : toutes les lignes creees par ce script occupent la
--  tranche d'identifiants 500-999. Le script commence par purger cette
--  tranche, il peut donc etre rejoue sans produire de doublons. Les
--  lignes anterieures (identifiants < 500) sont corrigees, jamais
--  supprimees : elles portent l'historique reel des tests.
--
--  Mot de passe : les comptes crees reprennent l'empreinte du compte
--  d'identifiant 1. Aucun mot de passe n'est ecrit en clair ici.
--
--  Lancement :
--    docker exec -i xpark-postgres psql -U xpark_user -d xpark_gmao \
--      < database/seed-demo.sql
-- =====================================================================

\set ON_ERROR_STOP on
BEGIN;

-- =====================================================================
--  0. PURGE DE LA TRANCHE DE DEMONSTRATION (ordre respectant les FK)
-- =====================================================================
DELETE FROM "MessageReactions"        WHERE "IdReaction"      BETWEEN 500 AND 999;
DELETE FROM "ChatMessages"            WHERE "IdMessage"       BETWEEN 500 AND 999;
DELETE FROM "ConversationParticipants" WHERE "IdParticipant"  BETWEEN 500 AND 999;
DELETE FROM "Conversations"           WHERE "IdConversation"  BETWEEN 500 AND 999;
DELETE FROM "InterventionPieces"      WHERE "IdInterventionPiece" BETWEEN 500 AND 999;
DELETE FROM "HistoriqueStatutsOT"     WHERE "Id"              BETWEEN 500 AND 999;
DELETE FROM "Interventions"           WHERE "IdIntervention"  BETWEEN 500 AND 999;
DELETE FROM "OrdresTravail"           WHERE "IdOrdreTravail"  BETWEEN 500 AND 999;
DELETE FROM "Alertes"                 WHERE "IdAlerte"        BETWEEN 500 AND 999;
DELETE FROM "Factures"                WHERE "IdFacture"       BETWEEN 500 AND 999;
DELETE FROM "LivePositions"           WHERE "IdPosition"      BETWEEN 500 AND 999;
DELETE FROM "SupportTickets"          WHERE "IdTicket"        BETWEEN 500 AND 999;
DELETE FROM "Missions"                WHERE "IdMission"       BETWEEN 500 AND 999;
DELETE FROM "TransportRequests"       WHERE "IdTransportRequest" BETWEEN 500 AND 999;
DELETE FROM "Devis"                   WHERE "IdDevis"         BETWEEN 500 AND 999;
DELETE FROM "Carburants"              WHERE "IdCarburant"     BETWEEN 500 AND 999;
DELETE FROM "Assurances"              WHERE "IdAssurance"     BETWEEN 500 AND 999;
DELETE FROM "DocumentsAdministratifs" WHERE "IdDocument"      BETWEEN 500 AND 999;
DELETE FROM "MouvementsEquipements"   WHERE "IdMouvement"     BETWEEN 500 AND 999;
DELETE FROM "Equipements"             WHERE "IdEquipement"    BETWEEN 500 AND 999;
DELETE FROM "PiecesRechange"          WHERE "IdPiece"         BETWEEN 500 AND 999;
DELETE FROM "Sources"                 WHERE "IdSource"        BETWEEN 500 AND 999;
DELETE FROM "Employees"               WHERE "IdEmployee"      BETWEEN 500 AND 999;
DELETE FROM "UserMfaSettings"         WHERE "UserId"          BETWEEN 500 AND 999;
DELETE FROM "UtilisateurStatuts"      WHERE "UtilisateurId"   BETWEEN 500 AND 999;
DELETE FROM "LoginHistory"            WHERE "UserId"          BETWEEN 500 AND 999;
DELETE FROM "Utilisateurs"            WHERE "IdUtilisateur"   BETWEEN 500 AND 999;

-- =====================================================================
--  1. UTILISATEURS
-- =====================================================================
--  1.a Nettoyage des comptes de test qui polluent les captures.
--      Ils ne sont pas supprimes (ils portent des journaux de connexion)
--      mais rendus presentables et sortis des ecrans actifs.
UPDATE "Utilisateurs" SET
    "Prenom" = 'Saber', "Nom" = 'Barhoumi', "Role" = 'ADMIN',
    "Photo" = '/uploads/avatars/demo-saber-barhoumi.png',
    "Ville" = 'Tunis', "Adresse" = '12 rue de Marseille, Lafayette',
    "CodePostal" = '1002', "Pays" = 'Tunisie',
    "EmailConfirmed" = true, "Statut" = 1
WHERE "IdUtilisateur" = 1;

UPDATE "Utilisateurs" SET
    "Prenom" = 'Karim', "Nom" = 'Ben Ali', "Telephone" = '+216 71 234 567',
    "Photo" = '/uploads/avatars/demo-karim-benali.png',
    "Ville" = 'Tunis', "EmailConfirmed" = true, "Statut" = 1
WHERE "IdUtilisateur" = 2;

UPDATE "Utilisateurs" SET
    "Prenom" = 'Mohamed', "Nom" = 'Trabelsi', "Telephone" = '+216 71 234 568',
    "Photo" = '/uploads/avatars/demo-mohamed-trabelsi.png',
    "Ville" = 'Ben Arous', "EmailConfirmed" = true, "Statut" = 1
WHERE "IdUtilisateur" = 3;

UPDATE "Utilisateurs" SET
    "Prenom" = 'Sami', "Nom" = 'Hamdi', "Telephone" = '+216 22 111 001',
    "Photo" = '/uploads/avatars/demo-sami-hamdi.png',
    "NumeroPermis" = 'TN-0451236', "CategoriePermis" = 'CE',
    "DateExpirationPermis" = now() + interval '14 months',
    "Disponibilite" = 'DISPONIBLE', "Evaluation" = 4.6,
    "NombreMissionsEffectuees" = 187, "KilometrageTotal" = 214500,
    "Ville" = 'Tunis', "EmailConfirmed" = true, "Statut" = 1
WHERE "IdUtilisateur" = 7;

UPDATE "Utilisateurs" SET
    "Prenom" = 'Riadh', "Nom" = 'Maaloul', "Telephone" = '+216 22 111 002',
    "Photo" = '/uploads/avatars/demo-riadh-maaloul.png',
    "NumeroPermis" = 'TN-0512874', "CategoriePermis" = 'CE',
    "DateExpirationPermis" = now() + interval '3 months',
    "Disponibilite" = 'EN_MISSION', "Evaluation" = 4.2,
    "NombreMissionsEffectuees" = 143, "KilometrageTotal" = 168300,
    "Ville" = 'Sfax', "EmailConfirmed" = true, "Statut" = 1
WHERE "IdUtilisateur" = 8;

UPDATE "Utilisateurs" SET
    "Prenom" = 'Nizar', "Nom" = 'Gharbi', "Telephone" = '+216 22 111 003',
    "Photo" = '/uploads/avatars/demo-nizar-gharbi.png',
    "NumeroPermis" = 'TN-0489511', "CategoriePermis" = 'C',
    "DateExpirationPermis" = now() + interval '22 months',
    "Disponibilite" = 'DISPONIBLE', "Evaluation" = 4.8,
    "NombreMissionsEffectuees" = 96, "KilometrageTotal" = 112400,
    "Ville" = 'Sousse', "EmailConfirmed" = true, "Statut" = 1
WHERE "IdUtilisateur" = 9;

UPDATE "Utilisateurs" SET
    "Prenom" = 'Mounir', "Nom" = 'Kacem', "Telephone" = '+216 74 400 110',
    "NomSociete" = 'Sfax Industries SARL', "SecteurActivite" = 'Agroalimentaire',
    "EstEntreprise" = true, "NumeroFiscal" = '1284937/A/M/000',
    "Adresse" = 'Zone industrielle Poudriere III', "Ville" = 'Sfax',
    "CodePostal" = '3003', "Pays" = 'Tunisie', "SiteWeb" = 'www.sfax-industries.tn',
    "Photo" = '/uploads/avatars/demo-mounir-kacem.png',
    "EmailConfirmed" = true, "Statut" = 1
WHERE "IdUtilisateur" = 10;

UPDATE "Utilisateurs" SET
    "Prenom" = 'Leila', "Nom" = 'Ben Youssef', "Telephone" = '+216 55 000 002',
    "Photo" = '/uploads/avatars/demo-leila-benyoussef.png',
    "Adresse" = '45 avenue Habib Bourguiba', "Ville" = 'Tunis',
    "CodePostal" = '1001', "Pays" = 'Tunisie', "EstEntreprise" = false,
    "EmailConfirmed" = true, "Statut" = 1
WHERE "IdUtilisateur" = 11;

--  Comptes de test purs : archives pour qu'ils sortent des ecrans actifs
--  tout en restant restaurables (module Archives).
UPDATE "Utilisateurs" SET "Statut" = 4, "Actif" = false,
       "DateModification" = now() - interval '40 days'
WHERE "IdUtilisateur" IN (4, 28, 29, 30, 31, 32, 33, 35, 37, 41, 42, 43, 44);

--  1.b Personnel interne
INSERT INTO "Utilisateurs" (
  "IdUtilisateur","Nom","Prenom","Email","MotDePasse","Telephone","Actif",
  "DateCreation","Role","TypeUtilisateur","Adresse","Ville","CodePostal","Pays",
  "Photo","EmailConfirmed","FailedLoginAttempts","HasPin","IsSessionLocked",
  "Statut","DateApprobation","ApprouvePar","LastLoginAt")
SELECT v."IdUtilisateur", v."Nom", v."Prenom", v."Email",
       (SELECT "MotDePasse" FROM "Utilisateurs" WHERE "IdUtilisateur" = 1),
       v."Telephone", v."Actif", v."DateCreation", v."Role", 'Utilisateur',
       v."Adresse", v."Ville", v."CodePostal", 'Tunisie', v."Photo",
       v."EmailConfirmed", 0, false, false, v."Statut",
       v."DateApprobation", v."ApprouvePar", v."LastLoginAt"
FROM (VALUES
 (500,'Chaabane','Ines','ines.chaabane@xpark.tn','+216 71 900 101',true,
  now()-interval '18 months','GESTIONNAIRE','8 rue Ibn Khaldoun','Tunis','1000',
  '/uploads/avatars/demo-ines-chaabane.png',true,1,now()-interval '18 months',1::bigint,now()-interval '2 hours'),
 (501,'Mejri','Yassine','yassine.mejri@xpark.tn','+216 71 900 102',true,
  now()-interval '15 months','TECHNICIEN','21 rue de Palestine','Ariana','2080',
  '/uploads/avatars/demo-yassine-mejri.png',true,1,now()-interval '15 months',1::bigint,now()-interval '1 day'),
 (502,'Zouari','Hatem','hatem.zouari@xpark.tn','+216 71 900 103',true,
  now()-interval '26 months','TECHNICIEN','3 impasse des Oliviers','Ben Arous','2013',
  '/uploads/avatars/demo-hatem-zouari.png',true,1,now()-interval '26 months',1::bigint,now()-interval '5 hours'),
 (503,'Ferchichi','Nadia','nadia.ferchichi@xpark.tn','+216 71 900 104',true,
  now()-interval '30 months','ADMINISTRATEUR','17 avenue de Carthage','Tunis','1001',
  '/uploads/avatars/demo-nadia-ferchichi.png',true,1,now()-interval '30 months',1::bigint,now()-interval '30 minutes'),
 (504,'Bouazizi','Olfa','olfa.bouazizi@xpark.tn','+216 71 900 105',true,
  now()-interval '3 days','GESTIONNAIRE','9 rue Sidi Bou Said','La Marsa','2070',
  '/uploads/avatars/demo-olfa-bouazizi.png',true,0,NULL::timestamptz,NULL::bigint,NULL::timestamptz),
 (505,'Lakhdar','Tahar','tahar.lakhdar@xpark.tn','+216 71 900 106',true,
  now()-interval '1 day','TECHNICIEN','5 rue Farhat Hached','Megrine','2033',
  '/uploads/avatars/demo-tahar-lakhdar.png',false,0,NULL::timestamptz,NULL::bigint,NULL::timestamptz)
) AS v("IdUtilisateur","Nom","Prenom","Email","Telephone","Actif","DateCreation",
       "Role","Adresse","Ville","CodePostal","Photo","EmailConfirmed","Statut",
       "DateApprobation","ApprouvePar","LastLoginAt");

--  1.c Chauffeurs
INSERT INTO "Utilisateurs" (
  "IdUtilisateur","Nom","Prenom","Email","MotDePasse","Telephone","Actif",
  "DateCreation","Role","TypeUtilisateur","Ville","Pays","Photo","EmailConfirmed",
  "FailedLoginAttempts","HasPin","IsSessionLocked","Statut","NumeroPermis",
  "CategoriePermis","DateExpirationPermis","Disponibilite","Evaluation",
  "NombreMissionsEffectuees","KilometrageTotal","DateDerniereFormation",
  "DateApprobation","ApprouvePar","LastLoginAt")
SELECT v."IdUtilisateur", v."Nom", v."Prenom", v."Email",
       (SELECT "MotDePasse" FROM "Utilisateurs" WHERE "IdUtilisateur" = 1),
       v."Telephone", v."Actif", v."DateCreation", 'CHAUFFEUR', 'Chauffeur',
       v."Ville", 'Tunisie', v."Photo", v."EmailConfirmed", 0, true, false,
       v."Statut", v."NumeroPermis", v."CategoriePermis", v."DateExpirationPermis",
       v."Disponibilite", v."Evaluation", v."Missions", v."Km",
       v."DateFormation", v."DateApprobation", v."ApprouvePar", v."LastLoginAt"
FROM (VALUES
 (510,'Khelifi','Anis','anis.khelifi@xpark.tn','+216 22 111 010',true,
  now()-interval '20 months','Nabeul','/uploads/avatars/demo-anis-khelifi.png',true,1,
  'TN-0523991','CE',now()+interval '19 months','DISPONIBLE',4.7,164,198700.0,
  now()-interval '7 months',now()-interval '20 months',1::bigint,now()-interval '3 hours'),
 (511,'Jendoubi','Bilel','bilel.jendoubi@xpark.tn','+216 22 111 011',true,
  now()-interval '11 months','Bizerte','/uploads/avatars/demo-bilel-jendoubi.png',true,1,
  'TN-0561047','C',now()+interval '8 months','EN_MISSION',4.3,78,91200.0,
  now()-interval '11 months',now()-interval '11 months',1::bigint,now()-interval '1 hour'),
 (512,'Chouchane','Walid','walid.chouchane@xpark.tn','+216 22 111 012',true,
  now()-interval '34 months','Sfax','/uploads/avatars/demo-walid-chouchane.png',true,1,
  'TN-0398215','CE',now()+interval '27 months','EN_MISSION',4.9,241,312800.0,
  now()-interval '4 months',now()-interval '34 months',1::bigint,now()-interval '2 hours'),
 (513,'Amri','Fethi','fethi.amri@xpark.tn','+216 22 111 013',true,
  now()-interval '7 months','Gabes','/uploads/avatars/demo-fethi-amri.png',true,1,
  'TN-0587730','C',now()+interval '31 months','EN_CONGE',4.1,44,52600.0,
  now()-interval '7 months',now()-interval '7 months',1::bigint,now()-interval '9 days'),
 (514,'Slimani','Moez','moez.slimani@xpark.tn','+216 22 111 014',true,
  now()-interval '2 days','Kairouan','/uploads/avatars/demo-moez-slimani.png',true,0,
  'TN-0601442','CE',now()+interval '35 months','INACTIF',0.0,0,0.0,
  NULL::timestamptz,NULL::timestamptz,NULL::bigint,NULL::timestamptz),
 (515,'Fakhfakh','Sonia','sonia.fakhfakh@xpark.tn','+216 22 111 015',false,
  now()-interval '16 months','Monastir','/uploads/avatars/demo-sonia-fakhfakh.png',true,2,
  'TN-0544186','C',now()-interval '2 months','SUSPENDU',3.4,58,67900.0,
  now()-interval '16 months',now()-interval '16 months',1::bigint,now()-interval '68 days')
) AS v("IdUtilisateur","Nom","Prenom","Email","Telephone","Actif","DateCreation",
       "Ville","Photo","EmailConfirmed","Statut","NumeroPermis","CategoriePermis",
       "DateExpirationPermis","Disponibilite","Evaluation","Missions","Km",
       "DateFormation","DateApprobation","ApprouvePar","LastLoginAt");

--  1.d Clients
INSERT INTO "Utilisateurs" (
  "IdUtilisateur","Nom","Prenom","Email","MotDePasse","Telephone","Actif",
  "DateCreation","Role","TypeUtilisateur","NomSociete","SecteurActivite",
  "EstEntreprise","NumeroFiscal","SiteWeb","Adresse","Ville","CodePostal","Pays",
  "Photo","EmailConfirmed","FailedLoginAttempts","HasPin","IsSessionLocked",
  "Statut","DateApprobation","ApprouvePar","LastLoginAt","DateModification")
SELECT v."IdUtilisateur", v."Nom", v."Prenom", v."Email",
       (SELECT "MotDePasse" FROM "Utilisateurs" WHERE "IdUtilisateur" = 1),
       v."Telephone", v."Actif", v."DateCreation", 'CLIENT', 'Client',
       v."Societe", v."Secteur", v."Entreprise", v."Fiscal", v."Web",
       v."Adresse", v."Ville", v."CP", 'Tunisie', v."Photo", true, 0, false, false,
       v."Statut", v."DateApprobation", v."ApprouvePar", v."LastLoginAt", v."DateModification"
FROM (VALUES
 (520,'Ayari','Faten','contact@medina-textile.tn','+216 73 220 340',true,
  now()-interval '22 months','Medina Textile','Textile et habillement',true,
  '0934182/B/N/000','www.medina-textile.tn','Route de Ceinture km 3','Monastir','5000',
  '/uploads/avatars/demo-faten-ayari.png',1,now()-interval '22 months',1::bigint,now()-interval '6 hours',NULL::timestamptz),
 (521,'Bouaziz','Slim','achats@capbon-agrumes.tn','+216 72 448 900',true,
  now()-interval '14 months','Cap Bon Agrumes','Agrumes et primeurs',true,
  '1142509/C/P/000','www.capbon-agrumes.tn','Route de Hammamet km 7','Nabeul','8000',
  '/uploads/avatars/demo-slim-bouaziz.png',1,now()-interval '14 months',1::bigint,now()-interval '2 days',NULL::timestamptz),
 (522,'Nasri','Rim','logistique@carthage-ceramique.tn','+216 71 780 220',true,
  now()-interval '9 months','Carthage Ceramique','Materiaux de construction',true,
  '1287744/D/M/000','www.carthage-ceramique.tn','Zone industrielle Mghira','Fouchana','2082',
  '/uploads/avatars/demo-rim-nasri.png',1,now()-interval '9 months',1::bigint,now()-interval '4 hours',NULL::timestamptz),
 (523,'Dridi','Hichem','contact@djerba-marine.tn','+216 75 610 480',true,
  now()-interval '4 days','Djerba Marine Foods','Produits de la mer',true,
  '1390218/E/P/000','www.djerba-marine.tn','Port de peche de Houmt Souk','Djerba','4180',
  '/uploads/avatars/demo-hichem-dridi.png',0,NULL::timestamptz,NULL::bigint,NULL::timestamptz,NULL::timestamptz),
 (524,'Rekik','Amine','transport@sousse-metal.tn','+216 73 331 770',true,
  now()-interval '31 months','Sousse Metal','Metallurgie',true,
  '0781163/F/N/000','www.sousse-metal.tn','Zone industrielle Sidi Abdelhamid','Sousse','4061',
  '/uploads/avatars/demo-amine-rekik.png',1,now()-interval '31 months',1::bigint,now()-interval '18 hours',NULL::timestamptz),
 (525,'Ouertani','Jalel','contact@gabes-chimie.tn','+216 75 290 110',false,
  now()-interval '38 months','Gabes Chimie','Chimie industrielle',true,
  '0663927/G/M/000','www.gabes-chimie.tn','Zone industrielle de Ghannouch','Gabes','6011',
  '/uploads/avatars/demo-jalel-ouertani.png',4,now()-interval '38 months',1::bigint,now()-interval '9 months',now()-interval '5 months'),
 (526,'Belhaj','Dorra','export@nabeul-poterie.tn','+216 72 275 660',false,
  now()-interval '41 months','Nabeul Poterie Export','Artisanat et ceramique',true,
  '0598431/H/P/000','www.nabeul-poterie.tn','Avenue Habib Thameur','Nabeul','8000',
  '/uploads/avatars/demo-dorra-belhaj.png',4,now()-interval '41 months',1::bigint,now()-interval '13 months',now()-interval '11 months'),
 (527,'Sassi','Kamel','contact@zarzis-agro.tn','+216 75 680 200',false,
  now()-interval '19 months','Zarzis Agro','Huile d olive',true,
  '1055874/I/N/000','www.zarzis-agro.tn','Route de Ben Guerdane km 4','Zarzis','4170',
  '/uploads/avatars/demo-kamel-sassi.png',3,now()-interval '19 months',1::bigint,now()-interval '7 months',now()-interval '3 months'),
 (528,'Gargouri','Ahlem','ahlem.gargouri@gmail.com','+216 98 445 120',true,
  now()-interval '6 months',NULL,NULL,false,NULL,NULL,
  '22 rue Ali Bach Hamba','Sfax','3000',
  '/uploads/avatars/demo-ahlem-gargouri.png',1,now()-interval '6 months',1::bigint,now()-interval '1 day',NULL::timestamptz)
) AS v("IdUtilisateur","Nom","Prenom","Email","Telephone","Actif","DateCreation",
       "Societe","Secteur","Entreprise","Fiscal","Web","Adresse","Ville","CP",
       "Photo","Statut","DateApprobation","ApprouvePar","LastLoginAt","DateModification");

--  1.e Fiches employes (module RH)
INSERT INTO "Employees" ("IdEmployee","Name","Prenom","NumeroMatricule","Post",
  "Service","Statut","Telephone","DateEmbauche","Activ","NumeroPermis",
  "CategoriePermis","DateExpirationPermis","Specialty","Level")
VALUES
 (500,'Chaabane','Ines','MAT-2023-014','GESTIONNAIRE','TRANSPORT','DISPONIBLE',
  '+216 71 900 101',now()-interval '18 months',true,NULL,NULL,NULL,NULL,NULL),
 (501,'Mejri','Yassine','MAT-2024-031','TECHNICIEN','MAINTENANCE','DISPONIBLE',
  '+216 71 900 102',now()-interval '15 months',true,NULL,NULL,NULL,'ELECTRICITE','SENIOR'),
 (502,'Zouari','Hatem','MAT-2022-008','RESPONSABLE_MAINTENANCE','MAINTENANCE','DISPONIBLE',
  '+216 71 900 103',now()-interval '26 months',true,NULL,NULL,NULL,'MECANIQUE','EXPERT'),
 (503,'Ferchichi','Nadia','MAT-2021-002','ADMINISTRATEUR','ADMINISTRATION','DISPONIBLE',
  '+216 71 900 104',now()-interval '30 months',true,NULL,NULL,NULL,NULL,NULL),
 (510,'Khelifi','Anis','MAT-2023-006','CHAUFFEUR','TRANSPORT','DISPONIBLE',
  '+216 22 111 010',now()-interval '20 months',true,'TN-0523991','CE',
  now()+interval '19 months',NULL,NULL),
 (511,'Jendoubi','Bilel','MAT-2024-019','CHAUFFEUR','TRANSPORT','EN_MISSION',
  '+216 22 111 011',now()-interval '11 months',true,'TN-0561047','C',
  now()+interval '8 months',NULL,NULL),
 (512,'Chouchane','Walid','MAT-2021-004','CHAUFFEUR','TRANSPORT','EN_MISSION',
  '+216 22 111 012',now()-interval '34 months',true,'TN-0398215','CE',
  now()+interval '27 months',NULL,NULL),
 (513,'Amri','Fethi','MAT-2024-027','CHAUFFEUR','TRANSPORT','EN_CONGE',
  '+216 22 111 013',now()-interval '7 months',true,'TN-0587730','C',
  now()+interval '31 months',NULL,NULL);

--  1.f Presence pour la messagerie
INSERT INTO "UtilisateurStatuts" ("UtilisateurId","Statut","DerniereActivite","MessageCustom")
VALUES
 (500,'ENLIGNE',now()-interval '2 minutes','Disponible'),
 (501,'OCCUPE',now()-interval '11 minutes','En intervention'),
 (502,'ENLIGNE',now()-interval '1 minute',NULL),
 (503,'ENLIGNE',now()-interval '4 minutes',NULL),
 (510,'ABSENT',now()-interval '2 hours','En route vers Sfax'),
 (512,'ENLIGNE',now()-interval '6 minutes',NULL),
 (520,'HORSLIGNE',now()-interval '6 hours',NULL),
 (524,'ENLIGNE',now()-interval '19 minutes',NULL);

-- =====================================================================
--  2. FLOTTE DE VEHICULES
-- =====================================================================
--  Les 16 vehicules deja presents sont corriges en place : ils sont
--  references par des missions, des ordres de travail et des factures.
--  Le jeu d'origine melangeait les marques et les modeles (« Toyota
--  Grosses », « Peugeot Kangoo », « Mercedes Partner ») et comportait
--  une immatriculation invalide (« 120 »). Chaque couple marque/modele
--  est desormais reel, chaque plaque suit le format tunisien NNN TU NNNN.
WITH src(rn,marque,modele,plaque,vin,annee,carburant,typ,km,statut,couleur,
         places,conso,pf,charge,valeur,mois_acq,photo) AS (VALUES
 (1 ,'Iveco','Daily 35C15','112 TU 4820','ZCFC135A005812441',2021,'DIESEL','CAMION',
     186400.0,'DISPONIBLE','Blanc',3,12.8,11,1450.0,118000.0,52,'iveco-daily'),
 (2 ,'Iveco','Eurocargo 120E','118 TU 5133','ZCFA1LM0202634877',2019,'DIESEL','CAMION',
     341200.0,'EN_MISSION','Blanc',3,22.4,16,6800.0,215000.0,74,'iveco-eurocargo'),
 (3 ,'Mercedes-Benz','Sprinter 315 CDI','124 TU 6041','WDB9066331P412907',2022,'DIESEL','UTILITAIRE',
     94700.0,'DISPONIBLE','Gris argent',3,9.6,9,1320.0,142000.0,34,'mb-sprinter'),
 (4 ,'Mercedes-Benz','Actros 1845','131 TU 7290','WDB9634031L785412',2020,'DIESEL','CAMION',
     412800.0,'EN_MISSION','Blanc',2,28.9,25,18000.0,398000.0,63,'mb-actros'),
 (5 ,'Renault','Master L3H2','137 TU 8115','VF1MAF4CE64129883',2021,'DIESEL','UTILITAIRE',
     158300.0,'EN_MAINTENANCE','Blanc',3,8.9,8,1560.0,96000.0,45,'renault-master'),
 (6 ,'Renault','Trafic','142 TU 2634','VF1FL000X63481227',2023,'DIESEL','VAN',
     47900.0,'DISPONIBLE','Bleu nuit',9,7.4,7,1200.0,88000.0,19,'renault-trafic'),
 (7 ,'Renault','Kangoo Express','148 TU 3907','VF1FW51J158741220',2022,'DIESEL','UTILITAIRE',
     72100.0,'DISPONIBLE','Blanc',2,5.8,5,650.0,54000.0,29,'renault-kangoo'),
 (8 ,'Peugeot','Partner','153 TU 1188','VF37BBHY6K7412885',2020,'DIESEL','UTILITAIRE',
     131600.0,'BESOIN_MAINTENANCE','Blanc',2,6.1,5,750.0,49000.0,58,'peugeot-partner'),
 (9 ,'Peugeot','Boxer 335 L3','159 TU 4472','VF3YD3MFB12447101',2021,'DIESEL','UTILITAIRE',
     167800.0,'EN_MISSION','Blanc',3,9.2,9,1500.0,102000.0,48,'peugeot-boxer'),
 (10,'Volkswagen','Transporter T6','164 TU 5560','WV1ZZZ7HZKH120744',2022,'DIESEL','VAN',
     88400.0,'DISPONIBLE','Gris',9,8.1,8,1150.0,124000.0,33,'vw-transporter'),
 (11,'Volkswagen','Crafter 35','170 TU 6318','WV1ZZZSYZL9012884',2023,'DIESEL','UTILITAIRE',
     39200.0,'DISPONIBLE','Blanc',3,9.8,9,1680.0,151000.0,17,'vw-crafter'),
 (12,'Isuzu','N-Series NPR','176 TU 7745','JAANPR75L87004128',2019,'DIESEL','CAMION',
     287500.0,'EN_MAINTENANCE','Blanc',3,16.7,14,4200.0,132000.0,70,'isuzu-npr'),
 (13,'MAN','TGL 8.180','181 TU 8902','WMAN12ZZ38Y321447',2021,'DIESEL','CAMION',
     221900.0,'DISPONIBLE','Bleu',3,18.3,15,3900.0,186000.0,44,'man-tgl'),
 (14,'DAF','LF 230','187 TU 2057','XLRAE45MC0L412887',2020,'DIESEL','CAMION',
     309400.0,'EN_MISSION','Blanc',2,19.6,16,5600.0,178000.0,61,'daf-lf'),
 (15,'Ford','Transit L3H2','193 TU 3391','WF0EXXTTGEKY12447',2022,'DIESEL','VAN',
     101200.0,'DISPONIBLE','Blanc',3,8.4,8,1290.0,97000.0,31,'ford-transit'),
 (16,'Toyota','Hilux Double Cabine','198 TU 4726','AHTFR22G607412885',2018,'DIESEL','AUTRE',
     224700.0,'HORS_SERVICE','Gris fonce',5,9.1,9,1000.0,72000.0,86,'toyota-hilux')
), cible AS (
  SELECT "IdVehicule", row_number() OVER (ORDER BY "IdVehicule") rn
  FROM "Vehicules" WHERE "IdVehicule" < 500
)
UPDATE "Vehicules" v SET
  "Marque" = s.marque, "Modele" = s.modele, "Immatriculation" = s.plaque,
  "NumeroChassis" = s.vin, "AnneeConstruction" = s.annee,
  "TypeCarburant" = s.carburant, "TypeVehicule" = s.typ,
  "Kilometrage" = s.km, "Statut" = s.statut, "Couleur" = s.couleur,
  "NombrePlaces" = s.places, "ConsommationMoyenne" = s.conso,
  "PuissanceFiscale" = s.pf, "ChargeUtileKg" = s.charge,
  "ValeurAcquisition" = s.valeur,
  "DateAcquisition" = now() - (s.mois_acq || ' months')::interval,
  "DateDerniereRevision" = now() - interval '4 months',
  "DateProchaineRevision" = now() + interval '2 months',
  "KilometrageProchainRevision" = s.km + 15000,
  "Photo" = '/uploads/vehicules/demo-' || s.photo || '.jpg',
  "Actif" = (s.statut <> 'HORS_SERVICE')
FROM src s, cible c
WHERE c."IdVehicule" = v."IdVehicule" AND s.rn = c.rn;

-- =====================================================================
--  3. EQUIPEMENTS, PIECES, CARBURANT, DOCUMENTS
-- =====================================================================
--  3.a Equipements existants corriges : le jeu d'origine portait des
--      noms de saisie de test (« esdssssssss », « sad ») et une URL
--      d'image pointant vers un article de blog.
WITH src(rn,nom,typ,cat,marque,modele,etat,fournisseur,prix,slug) AS (VALUES
 (1,'Extincteur 2 kg poudre ABC','Obligatoire','Securite','Sicli','P2-ABC','Neuf',
    'Sicli Tunisie',78.500,'extincteur'),
 (2,'Triangle de presignalisation','Obligatoire','Securite','Michelin','MT-01','Bon',
    'Auto Plus Tunis',24.000,'triangle'),
 (3,'Gilet haute visibilite classe 2','Obligatoire','Securite','Delta Plus','GILP2','Bon',
    'Delta Plus Maghreb',18.900,'gilet'),
 (4,'Trousse de premiers secours','Obligatoire','Securite','Esculape','TR-15','Neuf',
    'Pharma Equip',96.000,'trousse'),
 (5,'Sangle d arrimage 5 t','Mobile','Outillage','Spanset','SS-5000','Use',
    'Spanset Maghreb',142.000,'sangle'),
 (6,'Cric hydraulique 3 t','Mobile','Outillage','Facom','DL.30','Bon',
    'Facom Tunisie',385.000,'cric'),
 (7,'Cle dynamometrique 40-200 Nm','Mobile','Outillage','Facom','J.306-200','Bon',
    'Facom Tunisie',298.000,'cle-dyna'),
 (8,'Boitier telematique GPS','Fixe','Electronique','Teltonika','FMB920','Neuf',
    'Teltonika Distribution',215.000,'boitier-gps'),
 (9,'Chronotachygraphe numerique','Fixe','Electronique','VDO','DTCO 4.0','Bon',
    'Continental VDO',1240.000,'tachygraphe')
), cible AS (
  SELECT "IdEquipement", row_number() OVER (ORDER BY "IdEquipement") rn
  FROM "Equipements" WHERE "IdEquipement" < 500
)
UPDATE "Equipements" e SET
  "Nom" = s.nom, "Type" = s.typ, "Categorie" = s.cat, "Marque" = s.marque,
  "Modele" = s.modele, "Etat" = s.etat, "Fournisseur" = s.fournisseur,
  "PrixAchat" = s.prix, "ImageUrl" = '/uploads/equipements/demo-' || s.slug || '.jpg',
  "DateAchat" = now() - interval '14 months',
  "DateFinGarantie" = now() + interval '10 months',
  "DateModification" = now() - interval '3 days',
  "NotesGenerales" = 'Controle periodique effectue, conforme.',
  "NumeroSerie" = 'SN-' || lpad((1000 + s.rn * 37)::text, 6, '0')
FROM src s, cible c
WHERE c."IdEquipement" = e."IdEquipement" AND s.rn = c.rn;

--  3.b Nouveaux equipements
INSERT INTO "Equipements" ("IdEquipement","Nom","Type","Categorie","Marque","Modele",
  "Etat","NumeroSerie","CodeInventaire","Fournisseur","PrixAchat","ImageUrl",
  "VehiculeId","NombreUtilisations","HeuresUtilisation","DureeVieTheoriqueEnMois",
  "SeuilUsureUtilisations","SeuilRemplacementUtilisations","Actif",
  "DateAchat","DateFinGarantie","DateCreation","DateModification","NotesGenerales")
SELECT v.id, v.nom, v.typ, v.cat, v.marque, v.modele, v.etat,
       'SN-' || lpad((2000 + v.id % 500)::text, 6, '0'),
       'INV-EQ-' || lpad((v.id % 500)::text, 4, '0'),
       v.fournisseur, v.prix,
       '/uploads/equipements/demo-' || v.slug || '.jpg',
       (SELECT "IdVehicule" FROM "Vehicules" WHERE "IdVehicule" < 500
         ORDER BY "IdVehicule" OFFSET v.rang_vehicule LIMIT 1),
       v.utilisations, v.heures, v.duree, 400, 600, true,
       now() - (d.mois_achat || ' months')::interval,
       now() + (d.mois_garantie || ' months')::interval,
       now() - (d.mois_achat || ' months')::interval,
       now() - interval '2 days', v.notes
FROM (VALUES
 (500,'Camera de recul haute definition','Fixe','Electronique','Brigade','BE-870HD','Neuf',
   'Brigade Electronics',432.000,'camera-recul',2,58,214.5,72,
   'Installee sur le Sprinter, calibrage verifie.'),
 (501,'Hayon elevateur 1500 kg','Fixe','Mecanique','Dhollandia','DH-LM 15','Bon',
   'Dhollandia Maghreb',7850.000,'hayon',1,1142,3860.0,144,
   'Verin gauche a surveiller, jeu leger constate.'),
 (502,'Compresseur portatif 12 V','Mobile','Mecanique','Michelin','MC-12293','Bon',
   'Auto Plus Tunis',124.000,'compresseur',9,213,88.0,60,
   'Affecte au magasin, pret sur demande.'),
 (503,'Terminal mobile durci','Mobile','Informatique','Zebra','TC22','Neuf',
   'Zebra Technologies',1180.000,'terminal',5,89,412.0,48,
   'Affecte aux chauffeurs longue distance.'),
 (504,'Bache de protection 6 x 4 m','Mobile','Autre','Tarpaulin','TP-64','Use',
   'Comptoir de la Bache',186.000,'bache',3,367,0.0,36,
   'Deux oeillets a remplacer avant la prochaine saison.')
) AS v(id,nom,typ,cat,marque,modele,etat,fournisseur,prix,slug,rang_vehicule,
       utilisations,heures,duree,notes)
CROSS JOIN (VALUES (14,20)) AS d(mois_achat,mois_garantie);

--  3.c Pieces de rechange
UPDATE "PiecesRechange" SET
  "ImageUrl" = '/uploads/equipements/demo-compresseur.jpg',
  "DateDernierApprovisionnement" = now() - interval '3 weeks'
WHERE "IdPiece" < 500 AND "ImageUrl" IS NULL;

INSERT INTO "PiecesRechange" ("IdPiece","Reference","Designation","Categorie",
  "StockActuel","StockMinimum","StockMaximum","PrixUnitaire","Fournisseur",
  "ReferenceFournisseur","Emplacement","Description","Actif","DateCreation",
  "DateDernierApprovisionnement")
VALUES
 (500,'FLT-HUI-0142','Filtre a huile Iveco Daily','FILTRATION',4,6,40,38.500,
  'Iveco Pieces Tunisie','2996570','Rayon A-03','Filtre a huile origine, moteur F1A',
  true,now()-interval '9 months',now()-interval '5 weeks'),
 (501,'FRN-PLQ-0288','Plaquettes de frein avant Sprinter','FREINAGE',18,8,50,142.000,
  'Bosch Maghreb','0986494600','Rayon B-01','Jeu de 4 plaquettes, disque ventile',
  true,now()-interval '14 months',now()-interval '2 weeks'),
 (502,'PNE-315-0071','Pneu 315/80 R22.5 Michelin X Multi','PNEUMATIQUE',6,4,24,1285.000,
  'Michelin Tunisie','XMULTI-Z','Zone pneus','Pneu poids lourd, usage mixte',
  true,now()-interval '20 months',now()-interval '1 week'),
 (503,'ELE-BAT-0033','Batterie 12 V 110 Ah','ELECTRICITE',3,4,18,412.000,
  'Assad Batteries','AS-110-EFB','Rayon C-02','Batterie demarrage, technologie EFB',
  true,now()-interval '11 months',now()-interval '7 weeks'),
 (504,'TRN-EMB-0119','Kit embrayage Master L3','TRANSMISSION',2,2,10,986.000,
  'Valeo Distribution','826704','Rayon D-04','Kit complet, disque et mecanisme',
  true,now()-interval '16 months',now()-interval '9 weeks'),
 (505,'SUS-AMO-0205','Amortisseur arriere Boxer','SUSPENSION',9,6,30,268.000,
  'Monroe Maghreb','G7462','Rayon B-05','Amortisseur a gaz, vendu a l unite',
  true,now()-interval '8 months',now()-interval '4 weeks'),
 (506,'ECL-PHA-0088','Phare avant LED Actros','ECLAIRAGE',5,3,15,1740.000,
  'Hella Tunisie','1EX 011 500','Rayon E-01','Optique LED, cote conducteur',
  true,now()-interval '13 months',now()-interval '6 weeks'),
 (507,'MOT-COU-0311','Courroie de distribution Kangoo','MOTEUR',11,6,36,124.500,
  'Gates Maghreb','5559XS','Rayon A-06','Courroie crantee, kit avec galets',
  true,now()-interval '10 months',now()-interval '3 weeks');

--  3.d Sources de carburant
INSERT INTO "Sources" ("IdSource","NomSource","TypeSource","Adresse","Ville",
  "Latitude","Longitude","PrixMoyen","RemiseFiotte","CodeCarte","Actif","DateCreation")
VALUES
 (500,'Agil Charguia II','STATION_EXTERNE','Route de l Aeroport','Tunis',
  36.8342,10.2005,2.525,0.030,NULL,true,now()-interval '24 months'),
 (501,'Shell Sfax Route de Gabes','STATION_EXTERNE','Route de Gabes km 3','Sfax',
  34.7256,10.7382,2.540,0.025,NULL,true,now()-interval '22 months'),
 (502,'Cuve interne depot Megrine','STOCKAGE_PRIVE','Depot central Megrine','Megrine',
  36.7658,10.2361,2.410,0.000,NULL,true,now()-interval '30 months'),
 (503,'Carte carburant Total Flotte','CARTE_CARBURANT',NULL,NULL,
  NULL,NULL,2.560,0.045,'TOTAL-XP-2026-0148',true,now()-interval '18 months');

-- =====================================================================
--  4. DEMANDES DE TRANSPORT, DEVIS, MISSIONS, SUIVI GPS
-- =====================================================================
--  Les vehicules sont designes par leur immatriculation : le script
--  reste valide quels que soient les identifiants en base.

--  4.a Demandes de transport, un exemplaire de chaque statut du workflow
INSERT INTO "TransportRequests" ("IdTransportRequest","ClientIdUtilisateur",
  "ClientNom","DateSouhaitee","VilleDepart","VilleArrivee","CargoDescription",
  "CargoWeightKg","PassengerCount","VehicleTypeRequested","DistanceKm",
  "AiEstimatedPrice","AiPriceRangeMin","AiPriceRangeMax","AiVehicleTypeRecommended",
  "Statut","FinalPrice","PricingMethod","AdminNote","QuotedByUserId","QuotedByName",
  "DateQuotationEnvoyee","ClientRejectionReason","ClientCancelReason",
  "DateClientReponse","DateCreation","DateMaj")
VALUES
 (500,520,'Medina Textile',now()+interval '4 days','Monastir','Tunis',
  'Rouleaux de tissu conditionnes sur palettes',4200,0,'CAMION',162,
  486.400,438.000,535.000,'CAMION','PENDING_QUOTATION',
  NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,
  now()-interval '6 hours',now()-interval '6 hours'),
 (501,521,'Cap Bon Agrumes',now()+interval '2 days','Nabeul','Sfax',
  'Caisses d agrumes, transport refrigere souhaite',6800,0,'CAMION',290,
  812.000,730.000,893.000,'CAMION','PENDING_QUOTATION',
  NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,
  now()-interval '2 hours',now()-interval '2 hours'),
 (502,528,'Ahlem Gargouri',now()+interval '9 days','Sfax','Tunis',
  'Mobilier de bureau, demenagement complet',1400,0,'UTILITAIRE',270,
  392.000,353.000,431.000,'UTILITAIRE','PENDING_QUOTATION',
  NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,
  now()-interval '30 minutes',now()-interval '30 minutes'),
 (503,522,'Carthage Ceramique',now()+interval '6 days','Fouchana','Sousse',
  'Carreaux de faience, 14 palettes filmees',9200,0,'CAMION',131,
  468.000,421.000,515.000,'CAMION','QUOTATION_SENT',
  455.000,'MODIFIED','Remise de 3 pour cent accordee, client fidele.',
  500,'Ines Chaabane',now()-interval '1 day',NULL,NULL,NULL,
  now()-interval '3 days',now()-interval '1 day'),
 (504,524,'Sousse Metal',now()+interval '11 days','Sousse','Gabes',
  'Profiles metalliques, chargement par pont roulant',11500,0,'CAMION',268,
  936.000,842.000,1030.000,'CAMION','QUOTATION_SENT',
  936.000,'AI_PRICE','Prix propose tel que calcule par le moteur.',
  500,'Ines Chaabane',now()-interval '5 hours',NULL,NULL,NULL,
  now()-interval '2 days',now()-interval '5 hours'),
 (505,10,'Sfax Industries SARL',now()-interval '3 days','Sfax','Tunis',
  'Conserves alimentaires, 18 palettes',12000,0,'CAMION',270,
  918.000,826.000,1010.000,'CAMION','ACCEPTED',
  918.000,'AI_PRICE',NULL,500,'Ines Chaabane',
  now()-interval '8 days',NULL,NULL,now()-interval '7 days',
  now()-interval '10 days',now()-interval '7 days'),
 (506,520,'Medina Textile',now()-interval '9 days','Monastir','Bizerte',
  'Vetements finis en cartons',3100,0,'UTILITAIRE',235,
  588.000,529.000,647.000,'UTILITAIRE','ACCEPTED',
  570.000,'MODIFIED','Ajustement commercial.',500,'Ines Chaabane',
  now()-interval '14 days',NULL,NULL,now()-interval '13 days',
  now()-interval '16 days',now()-interval '13 days'),
 (507,522,'Carthage Ceramique',now()-interval '16 days','Fouchana','Sfax',
  'Sanitaires et robinetterie',7400,0,'CAMION',260,
  794.000,715.000,873.000,'CAMION','ACCEPTED',
  794.000,'AI_PRICE',NULL,2,'Karim Ben Ali',
  now()-interval '21 days',NULL,NULL,now()-interval '20 days',
  now()-interval '23 days',now()-interval '20 days'),
 (508,11,'Leila Ben Youssef',now()-interval '22 days','Tunis','Nabeul',
  'Materiel de chantier leger',900,0,'UTILITAIRE',67,
  186.000,167.000,205.000,'UTILITAIRE','ACCEPTED',
  186.000,'AI_PRICE',NULL,2,'Karim Ben Ali',
  now()-interval '26 days',NULL,NULL,now()-interval '25 days',
  now()-interval '28 days',now()-interval '25 days'),
 (509,524,'Sousse Metal',now()-interval '5 days','Sousse','Kasserine',
  'Tubes acier, longueur 6 metres',8600,0,'CAMION',195,
  702.000,632.000,772.000,'CAMION','REJECTED',
  760.000,'MANUAL','Majoration pour chargement hors gabarit.',
  500,'Ines Chaabane',now()-interval '9 days',
  'Tarif superieur a notre budget transport pour ce trimestre.',NULL,
  now()-interval '8 days',now()-interval '11 days',now()-interval '8 days'),
 (510,521,'Cap Bon Agrumes',now()-interval '12 days','Nabeul','Djerba',
  'Agrumes en vrac',5400,0,'CAMION',480,
  1248.000,1123.000,1373.000,'CAMION','CANCELLED',
  NULL,NULL,NULL,NULL,NULL,NULL,NULL,
  'Commande annulee par notre client final.',
  now()-interval '15 days',now()-interval '18 days',now()-interval '15 days'),
 (511,528,'Ahlem Gargouri',now()-interval '30 days','Sfax','Gafsa',
  'Cartons de livres',400,0,'UTILITAIRE',175,
  318.000,286.000,350.000,'UTILITAIRE','CANCELLED',
  NULL,NULL,NULL,NULL,NULL,NULL,NULL,
  'Report a une date ulterieure.',
  now()-interval '33 days',now()-interval '35 days',now()-interval '33 days');

--  4.b Devis du module Finance
INSERT INTO "Devis" ("IdDevis","NumeroDevis","ClientId","DateCreation","DateValidite",
  "MontantHT","MontantTVA","MontantTTC","Statut","Description","Conditions")
VALUES
 (500,'DEV-2026-0041',10,now()-interval '10 days',now()+interval '20 days',
  918.000,174.420,1092.420,'ACCEPTE','Transport Sfax vers Tunis, 18 palettes',
  'Paiement a 30 jours fin de mois. Chargement a la charge du client.'),
 (501,'DEV-2026-0042',520,now()-interval '16 days',now()+interval '14 days',
  570.000,108.300,678.300,'ACCEPTE','Transport Monastir vers Bizerte',
  'Paiement a 30 jours. Assurance marchandise incluse.'),
 (502,'DEV-2026-0043',522,now()-interval '3 days',now()+interval '27 days',
  455.000,86.450,541.450,'ENVOYE','Transport Fouchana vers Sousse, 14 palettes',
  'Devis valable 30 jours. Remise fidelite de 3 pour cent appliquee.'),
 (503,'DEV-2026-0044',524,now()-interval '2 days',now()+interval '28 days',
  936.000,177.840,1113.840,'ENVOYE','Transport Sousse vers Gabes, profiles metalliques',
  'Manutention par pont roulant a prevoir par le client.'),
 (504,'DEV-2026-0045',524,now()-interval '11 days',now()-interval '1 day',
  760.000,144.400,904.400,'REFUSE','Transport Sousse vers Kasserine',
  'Majoration hors gabarit incluse.'),
 (505,'DEV-2026-0046',521,now()-interval '40 days',now()-interval '10 days',
  1248.000,237.120,1485.120,'EXPIRE','Transport Nabeul vers Djerba',
  'Devis non confirme dans le delai imparti.');

--  4.c Missions
INSERT INTO "Missions" ("IdMission","ObjetMission","VilleDepart","VilleArrivee",
  "Destination","DistanceKm","DateDepart","DateRetour","KilometrageDepart",
  "KilometrageRetour","Statut","CoutTotal","CoutEstimeAI","AiVehiculeTypeUsed",
  "VehiculeId","VehiculeImmatriculation","ChauffeurIdUtilisateur","ChauffeurNom",
  "ClientIdUtilisateur","ClientNom","EmployeeId","BonCarburantAccorde",
  "CarteAutorouteRemise","NumeroBonCarburant","VerificationDocuments","DateCreation")
SELECT m.id, m.objet, m.dep, m.arr, m.arr, m.km, m.date_dep, m.date_ret,
       m.km_dep, m.km_ret, m.statut, m.cout, m.cout_ai, 'CAMION',
       (SELECT "IdVehicule" FROM "Vehicules" WHERE "Immatriculation" = m.plaque),
       m.plaque, m.chauffeur_id, m.chauffeur_nom, m.client_id, m.client_nom,
       m.employee_id, m.bon, m.carte, m.num_bon, true, m.date_creation
FROM (VALUES
 (500,'Livraison de conserves alimentaires','Sfax','Tunis',270.0,
   now()-interval '2 days',NULL::timestamptz,412800.0,0.0,'EN_COURS',
   918.000,918.000,'131 TU 7290',512::bigint,'Walid Chouchane',10::bigint,
   'Sfax Industries SARL',512::bigint,true,true,'BC-2026-0412',now()-interval '4 days'),
 (501,'Transport de profiles metalliques','Sousse','Gabes',268.0,
   now()-interval '1 day',NULL::timestamptz,341200.0,0.0,'EN_COURS',
   936.000,936.000,'118 TU 5133',511::bigint,'Bilel Jendoubi',524::bigint,
   'Sousse Metal',511::bigint,true,true,'BC-2026-0413',now()-interval '3 days'),
 (502,'Distribution de carreaux de faience','Fouchana','Sousse',131.0,
   now()-interval '6 hours',NULL::timestamptz,167800.0,0.0,'EN_COURS',
   455.000,468.000,'159 TU 4472',7::bigint,'Sami Hamdi',522::bigint,
   'Carthage Ceramique',NULL::bigint,true,false,'BC-2026-0414',now()-interval '2 days'),
 (503,'Enlevement de tubes acier','Sfax','Kairouan',150.0,
   now()-interval '10 hours',NULL::timestamptz,309400.0,0.0,'EN_COURS',
   540.000,552.000,'187 TU 2057',8::bigint,'Riadh Maaloul',524::bigint,
   'Sousse Metal',NULL::bigint,true,true,'BC-2026-0415',now()-interval '1 day'),
 (504,'Livraison de vetements finis','Monastir','Bizerte',235.0,
   now()-interval '11 days',now()-interval '10 days',186400.0,186635.0,'TERMINEE',
   570.000,588.000,'112 TU 4820',510::bigint,'Anis Khelifi',520::bigint,
   'Medina Textile',510::bigint,true,true,'BC-2026-0388',now()-interval '16 days'),
 (505,'Transport de sanitaires','Fouchana','Sfax',260.0,
   now()-interval '18 days',now()-interval '17 days',287500.0,287760.0,'TERMINEE',
   794.000,794.000,'176 TU 7745',512::bigint,'Walid Chouchane',522::bigint,
   'Carthage Ceramique',512::bigint,true,true,'BC-2026-0371',now()-interval '23 days'),
 (506,'Livraison de materiel de chantier','Tunis','Nabeul',67.0,
   now()-interval '24 days',now()-interval '24 days',72100.0,72167.0,'TERMINEE',
   186.000,186.000,'148 TU 3907',9::bigint,'Nizar Gharbi',11::bigint,
   'Leila Ben Youssef',NULL::bigint,false,false,NULL,now()-interval '28 days'),
 (507,'Rotation hebdomadaire depot Sud','Tunis','Sfax',270.0,
   now()-interval '31 days',now()-interval '30 days',94700.0,94970.0,'TERMINEE',
   880.000,902.000,'124 TU 6041',510::bigint,'Anis Khelifi',10::bigint,
   'Sfax Industries SARL',510::bigint,true,true,'BC-2026-0344',now()-interval '34 days'),
 (508,'Livraison de rouleaux de tissu','Monastir','Tunis',162.0,
   now()-interval '38 days',now()-interval '37 days',221900.0,222062.0,'TERMINEE',
   486.000,486.000,'181 TU 8902',7::bigint,'Sami Hamdi',520::bigint,
   'Medina Textile',NULL::bigint,true,false,'BC-2026-0319',now()-interval '42 days'),
 (509,'Transport d agrumes','Nabeul','Sousse',110.0,
   now()-interval '45 days',now()-interval '45 days',131600.0,131710.0,'TERMINEE',
   308.000,315.000,'153 TU 1188',9::bigint,'Nizar Gharbi',521::bigint,
   'Cap Bon Agrumes',NULL::bigint,false,false,NULL,now()-interval '48 days'),
 (510,'Enlevement palettes zone industrielle','Sousse','Tunis',143.0,
   now()+interval '3 days',NULL::timestamptz,88400.0,0.0,'EN_ATTENTE',
   429.000,429.000,'164 TU 5560',NULL::bigint,NULL,524::bigint,
   'Sousse Metal',NULL::bigint,false,false,NULL,now()-interval '1 day'),
 (511,'Livraison mobilier de bureau','Sfax','Tunis',270.0,
   now()+interval '6 days',NULL::timestamptz,39200.0,0.0,'EN_ATTENTE',
   392.000,392.000,'170 TU 6318',NULL::bigint,NULL,528::bigint,
   'Ahlem Gargouri',NULL::bigint,false,false,NULL,now()-interval '4 hours'),
 (512,'Transport de tubes acier hors gabarit','Sousse','Kasserine',195.0,
   now()-interval '7 days',NULL::timestamptz,101200.0,0.0,'ANNULEE',
   0.000,702.000,'193 TU 3391',NULL::bigint,NULL,524::bigint,
   'Sousse Metal',NULL::bigint,false,false,NULL,now()-interval '11 days'),
 (513,'Transport agrumes vers Djerba','Nabeul','Djerba',480.0,
   now()-interval '14 days',NULL::timestamptz,158300.0,0.0,'ANNULEE',
   0.000,1248.000,'137 TU 8115',NULL::bigint,NULL,521::bigint,
   'Cap Bon Agrumes',NULL::bigint,false,false,NULL,now()-interval '18 days')
) AS m(id,objet,dep,arr,km,date_dep,date_ret,km_dep,km_ret,statut,cout,cout_ai,
       plaque,chauffeur_id,chauffeur_nom,client_id,client_nom,employee_id,
       bon,carte,num_bon,date_creation);

--  Rattachement des demandes acceptees a leur mission
UPDATE "TransportRequests" SET "MissionId" = 500 WHERE "IdTransportRequest" = 505;
UPDATE "TransportRequests" SET "MissionId" = 504 WHERE "IdTransportRequest" = 506;
UPDATE "TransportRequests" SET "MissionId" = 505 WHERE "IdTransportRequest" = 507;
UPDATE "TransportRequests" SET "MissionId" = 506 WHERE "IdTransportRequest" = 508;

--  4.d Traces GPS des quatre missions en cours.
--      Les points sont interpoles entre les coordonnees reelles des deux
--      villes, avec un leger ecart lateral pour que le trace ne soit pas
--      une droite parfaite sur la carte.
INSERT INTO "LivePositions" ("IdPosition","MissionId","DriverId","VehiculeId",
  "Latitude","Longitude","SpeedKmh","Heading","Accuracy","RecordedAt","ReceivedAt")
SELECT 500 + row_number() OVER (ORDER BY t.mission, g.i) - 1,
       t.mission, t.driver,
       (SELECT "IdVehicule" FROM "Vehicules" WHERE "Immatriculation" = t.plaque),
       t.lat1 + (t.lat2 - t.lat1) * (g.i::numeric / t.pts)
             + sin(g.i * 1.7) * 0.018,
       t.lon1 + (t.lon2 - t.lon1) * (g.i::numeric / t.pts)
             + cos(g.i * 1.3) * 0.014,
       62 + (g.i * 7) % 26,
       degrees(atan2(t.lon2 - t.lon1, t.lat2 - t.lat1)),
       4.5 + (g.i % 4),
       now() - ((t.pts - g.i) * t.pas || ' minutes')::interval,
       now() - ((t.pts - g.i) * t.pas || ' minutes')::interval + interval '3 seconds'
FROM (VALUES
 (500,512::bigint,'131 TU 7290',34.7406,10.7603,36.8065,10.1815,12,14),
 (501,511::bigint,'118 TU 5133',35.8256,10.6411,33.8815,10.0982,12,11),
 (502,7::bigint  ,'159 TU 4472',36.7100,10.1750,35.8256,10.6411,10,9),
 (503,8::bigint  ,'187 TU 2057',34.7406,10.7603,35.6781,10.0963,10,7)
) AS t(mission,driver,plaque,lat1,lon1,lat2,lon2,pts,pas)
CROSS JOIN LATERAL generate_series(1, t.pts) AS g(i);

--  4.e Tickets de support
INSERT INTO "SupportTickets" ("IdTicket","ClientIdUtilisateur","ClientNom","Sujet",
  "Categorie","Message","Statut","Reponse","MissionId","DateCreation","DateMaj")
VALUES
 (500,10,'Sfax Industries SARL','Retard sur la livraison du 18 palettes','LIVRAISON',
  'Bonjour, la livraison prevue ce matin n a pas encore ete effectuee. Pouvez-vous nous confirmer l heure d arrivee ?',
  'OUVERT',NULL,500,now()-interval '4 hours',now()-interval '4 hours'),
 (501,520,'Medina Textile','Demande de facture acquittee','FACTURATION',
  'Nous avons besoin de la facture acquittee de la mission Monastir vers Bizerte pour notre comptabilite.',
  'EN_COURS','Votre demande est transmise au service facturation, reponse sous 24 heures.',
  504,now()-interval '2 days',now()-interval '1 day'),
 (502,522,'Carthage Ceramique','Emballage endommage a la reception','RECLAMATION',
  'Deux palettes presentaient un film dechire a la reception. Aucune casse constatee mais nous souhaitons le signaler.',
  'RESOLU','Constat enregistre. Les sangles du vehicule concerne ont ete remplacees.',
  505,now()-interval '15 days',now()-interval '13 days'),
 (503,524,'Sousse Metal','Question sur le devis Kasserine','DEVIS',
  'Pourriez-vous detailler la majoration hors gabarit appliquee sur le devis DEV-2026-0045 ?',
  'RESOLU','La majoration couvre l escorte et le balisage obligatoires pour un chargement de 6 metres.',
  NULL,now()-interval '10 days',now()-interval '9 days'),
 (504,528,'Ahlem Gargouri','Modification de la date d enlevement','PLANIFICATION',
  'Serait-il possible de decaler l enlevement du mobilier de deux jours ?',
  'OUVERT',NULL,511,now()-interval '3 hours',now()-interval '3 hours');

--  4.f Pleins de carburant
INSERT INTO "Carburants" ("IdCarburant","DateRemplissage","Quantite","PrixUnitaire",
  "MontantTotal","Kilometrage","Station","NumeroBon","VehiculeId","ChauffeurId",
  "SourceId","TypeCarburant","DateCreation")
SELECT c.id, c.date_r, c.qte, c.prix, round((c.qte * c.prix)::numeric, 3), c.km,
       c.station, c.bon,
       (SELECT "IdVehicule" FROM "Vehicules" WHERE "Immatriculation" = c.plaque),
       c.chauffeur, c.source, 'DIESEL', c.date_r
FROM (VALUES
 (500,now()-interval '2 days' ,118.4,2.525,412600.0,'Agil Charguia II','BC-2026-0412','131 TU 7290',512::bigint,500::bigint),
 (501,now()-interval '3 days' , 96.2,2.540,341050.0,'Shell Sfax Route de Gabes','BC-2026-0413','118 TU 5133',511::bigint,501::bigint),
 (502,now()-interval '5 days' , 71.8,2.410,167600.0,'Cuve interne depot Megrine','BC-2026-0409','159 TU 4472',7::bigint,502::bigint),
 (503,now()-interval '7 days' , 88.5,2.560,309200.0,'Total Flotte','BC-2026-0405','187 TU 2057',8::bigint,503::bigint),
 (504,now()-interval '10 days', 64.3,2.525,186300.0,'Agil Charguia II','BC-2026-0388','112 TU 4820',510::bigint,500::bigint),
 (505,now()-interval '13 days', 52.7,2.410, 94600.0,'Cuve interne depot Megrine','BC-2026-0380','124 TU 6041',510::bigint,502::bigint),
 (506,now()-interval '17 days', 79.1,2.540,287400.0,'Shell Sfax Route de Gabes','BC-2026-0371','176 TU 7745',512::bigint,501::bigint),
 (507,now()-interval '21 days', 41.9,2.525, 72000.0,'Agil Charguia II','BC-2026-0358','148 TU 3907',9::bigint,500::bigint),
 (508,now()-interval '24 days', 58.6,2.560,221800.0,'Total Flotte','BC-2026-0349','181 TU 8902',7::bigint,503::bigint),
 (509,now()-interval '28 days', 46.2,2.410,131500.0,'Cuve interne depot Megrine','BC-2026-0341','153 TU 1188',9::bigint,502::bigint),
 (510,now()-interval '33 days', 92.8,2.525,158200.0,'Agil Charguia II','BC-2026-0328','137 TU 8115',512::bigint,500::bigint),
 (511,now()-interval '38 days', 68.4,2.540, 88300.0,'Shell Sfax Route de Gabes','BC-2026-0315','164 TU 5560',511::bigint,501::bigint)
) AS c(id,date_r,qte,prix,km,station,bon,plaque,chauffeur,source);

--  4.g Documents administratifs. Les echeances sont volontairement
--      etalees : certaines expirent bientot, ce qui alimente le module
--      Alertes et rend l ecran des echeances demonstratif.
INSERT INTO "DocumentsAdministratifs" ("IdDocument","TypeDocument","NumeroDocument",
  "DateEmission","DateExpiration","Autorite","Observations","VehiculeId","DateCreation")
SELECT d.id, d.typ, d.num, now() - (d.mois_emis || ' months')::interval,
       now() + (d.jours_exp || ' days')::interval, d.autorite, d.obs,
       (SELECT "IdVehicule" FROM "Vehicules" WHERE "Immatriculation" = d.plaque),
       now() - (d.mois_emis || ' months')::interval
FROM (VALUES
 (500,0,'CG-2021-118442','112 TU 4820',52, 900,'Agence Technique des Transports','Carte grise originale au siege.'),
 (501,2,'VT-2026-004417','112 TU 4820', 5,  25,'Centre technique Charguia','Visite a renouveler sous un mois.'),
 (502,1,'VG-2026-771204','112 TU 4820', 7, 148,'Recette des Finances',NULL),
 (503,0,'CG-2019-093117','118 TU 5133',74, 720,'Agence Technique des Transports',NULL),
 (504,2,'VT-2026-004512','118 TU 5133', 2,  11,'Centre technique Sfax','Echeance proche, rendez-vous a prendre.'),
 (505,0,'CG-2022-142880','124 TU 6041',34,1080,'Agence Technique des Transports',NULL),
 (506,2,'VT-2025-003914','124 TU 6041',10, 176,'Centre technique Charguia',NULL),
 (507,0,'CG-2020-104556','131 TU 7290',63, 810,'Agence Technique des Transports',NULL),
 (508,2,'VT-2026-004601','131 TU 7290', 1,  -4,'Centre technique Ben Arous','Visite technique EXPIREE, vehicule a immobiliser.'),
 (509,1,'VG-2026-771388','131 TU 7290', 7, 148,'Recette des Finances',NULL),
 (510,0,'CG-2021-127019','137 TU 8115',45, 930,'Agence Technique des Transports',NULL),
 (511,2,'VT-2026-004388','159 TU 4472', 4,  62,'Centre technique Sousse',NULL),
 (512,3,'PC-2026-000914','176 TU 7745', 6,  38,'Ministere du Transport','Permis de circuler transport de marchandises.'),
 (513,2,'VT-2026-004702','181 TU 8902', 3, 274,'Centre technique Sousse',NULL),
 (514,2,'VT-2025-003722','198 TU 4726',14, -95,'Centre technique Charguia','Vehicule hors service, visite non renouvelee.')
) AS d(id,typ,num,plaque,mois_emis,jours_exp,autorite,obs);

--  4.h Assurances
INSERT INTO "Assurances" ("IdAssurance","Compagnie","NumeroPolice","DateDebut",
  "DateFin","Prime","TypeAssurance","ContactCompagnie","Observations","Actif",
  "VehiculeId","DateCreation")
SELECT a.id, a.compagnie, a.police, now() - (a.mois || ' months')::interval,
       now() + (a.jours || ' days')::interval, a.prime, a.typ, a.contact, a.obs,
       (a.jours > 0),
       (SELECT "IdVehicule" FROM "Vehicules" WHERE "Immatriculation" = a.plaque),
       now() - (a.mois || ' months')::interval
FROM (VALUES
 (500,'STAR Assurances','ST-2025-4471182','112 TU 4820',10, 60,2840.000,'TOUS_RISQUES','+216 71 340 000',NULL),
 (501,'COMAR','CO-2025-9920431','118 TU 5133', 8,120,3420.000,'TOUS_RISQUES','+216 71 340 111',NULL),
 (502,'GAT Assurances','GA-2026-1180294','124 TU 6041', 3,270,2210.000,'TOUS_RISQUES','+216 71 340 222',NULL),
 (503,'STAR Assurances','ST-2026-4472019','131 TU 7290', 5,210,4180.000,'TOUS_RISQUES','+216 71 340 000',NULL),
 (504,'Assurances Maghrebia','MA-2025-7714408','137 TU 8115',11, 18,2160.000,'TIERS','+216 71 340 333','Echeance proche, renouvellement a instruire.'),
 (505,'COMAR','CO-2026-9921177','159 TU 4472', 4,240,2380.000,'TOUS_RISQUES','+216 71 340 111',NULL),
 (506,'GAT Assurances','GA-2025-1179883','176 TU 7745',13,-22,2950.000,'TIERS','+216 71 340 222','Police EXPIREE, vehicule a ne pas engager.'),
 (507,'STAR Assurances','ST-2026-4472488','181 TU 8902', 6,180,3110.000,'TOUS_RISQUES','+216 71 340 000',NULL)
) AS a(id,compagnie,police,plaque,mois,jours,prime,typ,contact,obs);

-- =====================================================================
--  5. MAINTENANCE : ORDRES DE TRAVAIL, INTERVENTIONS, PIECES
-- =====================================================================
--  Le tableau kanban comporte quatre colonnes. Chacune est alimentee,
--  et les quatre niveaux de priorite sont representes.
--  Priorite : 0 BASSE, 1 MOYENNE, 2 HAUTE, 3 URGENT.
INSERT INTO "OrdresTravail" ("IdOrdreTravail","Reference","Description","Statut",
  "Priorite","VehiculeId","TechnicienId","DateCreation","DateDebut","DateFin",
  "CoutReel","Observations","DateValidation","ValideParId","MotifAnnulation")
SELECT o.id, o.ref, o.descr, o.statut, o.prio,
       (SELECT "IdVehicule" FROM "Vehicules" WHERE "Immatriculation" = o.plaque),
       o.technicien, o.creation, o.debut, o.fin, o.cout, o.obs,
       o.validation, o.valide_par, o.motif
FROM (VALUES
 (500,'OT-2026-0118','Remplacement des plaquettes de frein avant et controle des disques',
   'PLANIFIE',3,'137 TU 8115',502::bigint,now()-interval '2 days',
   NULL::timestamptz,NULL::timestamptz,NULL::double precision,
   'Vehicule immobilise au depot Megrine en attente des plaquettes.',
   now()-interval '1 day',503::bigint,NULL),
 (501,'OT-2026-0119','Vidange et remplacement du filtre a huile, echeance 15 000 km',
   'PLANIFIE',1,'112 TU 4820',501::bigint,now()-interval '3 days',
   NULL::timestamptz,NULL::timestamptz,NULL::double precision,
   NULL,now()-interval '2 days',503::bigint,NULL),
 (502,'OT-2026-0120','Controle du systeme de refroidissement, temperature moteur elevee signalee',
   'PLANIFIE',2,'153 TU 1188',502::bigint,now()-interval '1 day',
   NULL::timestamptz,NULL::timestamptz,NULL::double precision,
   'Signalement du chauffeur Nizar Gharbi sur la rotation Nabeul.',
   NULL::timestamptz,NULL::bigint,NULL),
 (503,'OT-2026-0121','Remise en etat du hayon elevateur, jeu sur le verin gauche',
   'PLANIFIE',1,'118 TU 5133',502::bigint,now()-interval '5 hours',
   NULL::timestamptz,NULL::timestamptz,NULL::double precision,
   NULL,NULL::timestamptz,NULL::bigint,NULL),
 (504,'OT-2026-0114','Reparation du circuit electrique, feux arriere intermittents',
   'EN_COURS',2,'176 TU 7745',501::bigint,now()-interval '6 days',
   now()-interval '2 days',NULL::timestamptz,NULL::double precision,
   'Faisceau arriere en cours de depose. Piece commandee chez Hella.',
   now()-interval '5 days',503::bigint,NULL),
 (505,'OT-2026-0115','Remplacement du kit embrayage',
   'EN_COURS',3,'137 TU 8115',502::bigint,now()-interval '8 days',
   now()-interval '3 days',NULL::timestamptz,NULL::double precision,
   'Boite deposee. Kit Valeo monte, essais prevus demain.',
   now()-interval '7 days',503::bigint,NULL),
 (506,'OT-2026-0116','Geometrie et equilibrage des quatre roues',
   'EN_COURS',0,'164 TU 5560',3::bigint,now()-interval '4 days',
   now()-interval '1 day',NULL::timestamptz,NULL::double precision,
   NULL,now()-interval '3 days',503::bigint,NULL),
 (507,'OT-2026-0102','Revision des 200 000 km, ensemble des points constructeur',
   'TERMINE',1,'181 TU 8902',502::bigint,now()-interval '26 days',
   now()-interval '22 days',now()-interval '20 days',1842.500,
   'Revision complete conforme au carnet constructeur. Aucun point bloquant.',
   now()-interval '25 days',503::bigint,NULL),
 (508,'OT-2026-0104','Remplacement des deux pneus arriere gauche',
   'TERMINE',2,'131 TU 7290',501::bigint,now()-interval '19 days',
   now()-interval '17 days',now()-interval '17 days',2678.000,
   'Pneus Michelin X Multi montes, pression et serrage controles.',
   now()-interval '18 days',503::bigint,NULL),
 (509,'OT-2026-0107','Remplacement de la batterie et controle de l alternateur',
   'TERMINE',2,'148 TU 3907',501::bigint,now()-interval '14 days',
   now()-interval '12 days',now()-interval '12 days',486.000,
   'Batterie Assad 110 Ah installee. Alternateur conforme, 14,2 V mesures.',
   now()-interval '13 days',503::bigint,NULL),
 (510,'OT-2026-0110','Remplacement du phare avant conducteur',
   'TERMINE',1,'187 TU 2057',3::bigint,now()-interval '9 days',
   now()-interval '8 days',now()-interval '8 days',1812.000,
   'Optique LED Hella montee et reglee au banc.',
   now()-interval '9 days',503::bigint,NULL),
 (511,'OT-2026-0112','Diagnostic de la boite de vitesses',
   'ANNULE',1,'198 TU 4726',502::bigint,now()-interval '12 days',
   NULL::timestamptz,NULL::timestamptz,NULL::double precision,NULL,
   NULL::timestamptz,NULL::bigint,
   'Vehicule declare hors service, reforme decidee par la direction.')
) AS o(id,ref,descr,statut,prio,plaque,technicien,creation,debut,fin,cout,obs,
       validation,valide_par,motif);

--  5.b Historique des changements de statut
INSERT INTO "HistoriqueStatutsOT" ("Id","OrdreTravailId","AncienStatut",
  "NouveauStatut","Commentaire","UtilisateurId","DateChangement")
VALUES
 (500,504,'PLANIFIE','EN_COURS','Depose du faisceau arriere engagee.',501,now()-interval '2 days'),
 (501,505,'PLANIFIE','EN_COURS','Boite de vitesses deposee.',502,now()-interval '3 days'),
 (502,506,'PLANIFIE','EN_COURS','Vehicule au banc de geometrie.',3,now()-interval '1 day'),
 (503,507,'PLANIFIE','EN_COURS','Debut de la revision des 200 000 km.',502,now()-interval '22 days'),
 (504,507,'EN_COURS','TERMINE','Revision achevee, vehicule rendu a l exploitation.',502,now()-interval '20 days'),
 (505,508,'PLANIFIE','EN_COURS','Demontage des roues arriere.',501,now()-interval '17 days'),
 (506,508,'EN_COURS','TERMINE','Pneus remplaces, controle de serrage effectue.',501,now()-interval '17 days'),
 (507,509,'PLANIFIE','EN_COURS','Depose de la batterie.',501,now()-interval '12 days'),
 (508,509,'EN_COURS','TERMINE','Batterie remplacee, tension de charge conforme.',501,now()-interval '12 days'),
 (509,510,'PLANIFIE','EN_COURS','Depose de l optique avant.',3,now()-interval '8 days'),
 (510,510,'EN_COURS','TERMINE','Optique LED montee et reglee.',3,now()-interval '8 days'),
 (511,511,'PLANIFIE','ANNULE','Vehicule reforme, ordre de travail sans objet.',503,now()-interval '10 days');

--  5.c Interventions
INSERT INTO "Interventions" ("IdIntervention","DateIntervention","DateFinIntervention",
  "TypeIntervention","Description","Cout","CoutMainOeuvre","CoutPieces","Statut",
  "KilometrageIntervention","Observations","Prestataire","VehiculeId","TechnicienId",
  "DateCreation","DureeMinutes","OrdreTravailId","TypePeriodicite")
SELECT i.id, i.date_i, i.date_f, i.typ, i.descr, i.cout, i.mo, i.pieces, i.statut,
       i.km, i.obs, i.prestataire,
       (SELECT "IdVehicule" FROM "Vehicules" WHERE "Immatriculation" = i.plaque),
       i.technicien, i.date_i - interval '1 day', i.duree, i.ot, i.periodicite
FROM (VALUES
 (500,now()-interval '22 days',now()-interval '20 days','PREVENTIVE',
   'Revision des 200 000 km : vidange, filtres, courroies, freins, suspension',
   1842.500,620.000,1222.500,'TERMINEE',221200.0,
   'Tous les points du carnet constructeur ont ete controles.',NULL,'181 TU 8902',
   502::bigint,960,507::bigint,'KM'),
 (501,now()-interval '17 days',now()-interval '17 days','CURATIVE',
   'Remplacement de deux pneus arriere gauche',2678.000,108.000,2570.000,'TERMINEE',
   412100.0,'Pression reglee a 8,5 bars, serrage au couple.',NULL,'131 TU 7290',
   501::bigint,150,508::bigint,NULL),
 (502,now()-interval '12 days',now()-interval '12 days','CURATIVE',
   'Remplacement de la batterie de demarrage',486.000,74.000,412.000,'TERMINEE',
   71900.0,'Alternateur controle : 14,2 V, conforme.',NULL,'148 TU 3907',
   501::bigint,90,509::bigint,NULL),
 (503,now()-interval '8 days',now()-interval '8 days','CURATIVE',
   'Remplacement du phare avant cote conducteur',1812.000,72.000,1740.000,'TERMINEE',
   309100.0,'Reglage du faisceau effectue au banc.',NULL,'187 TU 2057',
   3::bigint,80,510::bigint,NULL),
 (504,now()-interval '2 days',NULL::timestamptz,'CURATIVE',
   'Reparation du faisceau electrique arriere',0.000,0.000,0.000,'EN_COURS',
   287400.0,'Faisceau depose, attente de l optique de remplacement.',NULL,'176 TU 7745',
   501::bigint,NULL,504::bigint,NULL),
 (505,now()-interval '3 days',NULL::timestamptz,'CURATIVE',
   'Remplacement du kit embrayage',986.000,0.000,986.000,'EN_COURS',
   158200.0,'Kit Valeo monte, essais routiers a programmer.',NULL,'137 TU 8115',
   502::bigint,NULL,505::bigint,NULL),
 (506,now()-interval '1 day',NULL::timestamptz,'PREVENTIVE',
   'Geometrie et equilibrage des quatre roues',0.000,0.000,0.000,'EN_COURS',
   88300.0,NULL,'Centre Pneu Express Megrine','164 TU 5560',
   3::bigint,NULL,506::bigint,'KM'),
 (507,now()+interval '2 days',NULL::timestamptz,'CURATIVE',
   'Remplacement des plaquettes de frein avant',0.000,0.000,0.000,'PLANIFIEE',
   158300.0,NULL,NULL,'137 TU 8115',502::bigint,NULL,500::bigint,NULL),
 (508,now()+interval '4 days',NULL::timestamptz,'PREVENTIVE',
   'Vidange moteur et remplacement du filtre a huile',0.000,0.000,0.000,'PLANIFIEE',
   186400.0,NULL,NULL,'112 TU 4820',501::bigint,NULL,501::bigint,'KM'),
 (509,now()+interval '1 day',NULL::timestamptz,'CURATIVE',
   'Diagnostic du circuit de refroidissement',0.000,0.000,0.000,'EN_ATTENTE',
   131600.0,'A rapprocher du signalement du chauffeur.',NULL,'153 TU 1188',
   502::bigint,NULL,502::bigint,NULL),
 (510,now()+interval '6 days',NULL::timestamptz,'CURATIVE',
   'Remise en etat du hayon elevateur',0.000,0.000,0.000,'EN_ATTENTE',
   341200.0,NULL,'Dhollandia Service Tunis','118 TU 5133',
   502::bigint,NULL,503::bigint,NULL),
 (511,now()-interval '10 days',NULL::timestamptz,'CURATIVE',
   'Diagnostic de la boite de vitesses',0.000,0.000,0.000,'ANNULEE',
   224700.0,'Intervention sans objet : vehicule reforme.',NULL,'198 TU 4726',
   502::bigint,NULL,511::bigint,NULL)
) AS i(id,date_i,date_f,typ,descr,cout,mo,pieces,statut,km,obs,prestataire,plaque,
       technicien,duree,ot,periodicite);

--  5.d Pieces consommees par intervention
INSERT INTO "InterventionPieces" ("IdInterventionPiece","InterventionId","PieceId",
  "Quantite","PrixUnitaire","PieceRechangeIdPiece")
SELECT p.id, p.interv, p.piece, p.qte, p.prix, p.piece
FROM (VALUES
 (500,500,500,2, 38.500),
 (501,500,507,1,124.500),
 (502,500,501,1,142.000),
 (503,500,505,2,268.000),
 (504,501,502,2,1285.000),
 (505,502,503,1,412.000),
 (506,503,506,1,1740.000),
 (507,505,504,1,986.000),
 (508,504,506,1,1740.000)
) AS p(id,interv,piece,qte,prix);

-- =====================================================================
--  6. FINANCE, ALERTES, MESSAGERIE
-- =====================================================================
--  6.a Les sept factures existantes portaient toutes le meme montant
--      (1011,5). Elles sont diversifiees pour que l ecran soit lisible.
WITH src(rn,ht,statut,mode,notes,jours_ech,jours_paie) AS (VALUES
 (1, 486.000,'PAYEE'    ,'VIREMENT','Reglement recu, avis de credit archive.',30,-12),
 (2, 918.000,'PAYEE'    ,'CHEQUE'  ,'Cheque encaisse le 12 du mois.'        ,30, -8),
 (3, 794.000,'PAYEE'    ,'VIREMENT',NULL                                   ,30,-15),
 (4, 570.000,'EMISE'    ,NULL      ,'Facture transmise par courriel.'       ,18,NULL),
 (5, 308.000,'EMISE'    ,NULL      ,NULL                                   ,25,NULL),
 (6, 186.000,'EN_RETARD',NULL      ,'Relance telephonique effectuee.'       ,-9,NULL),
 (7, 880.000,'BROUILLON',NULL      ,'En attente de validation du gestionnaire.',NULL,NULL)
), cible AS (
  SELECT "IdFacture", row_number() OVER (ORDER BY "IdFacture") rn
  FROM "Factures" WHERE "IdFacture" < 500
)
UPDATE "Factures" f SET
  "MontantHT" = s.ht,
  "MontantTVA" = round((s.ht * 0.19)::numeric, 3),
  "MontantTTC" = round((s.ht * 1.19)::numeric, 3),
  "TauxTVA" = 19.0, "Statut" = s.statut, "ModePaiement" = s.mode, "Notes" = s.notes,
  "DateEcheance" = CASE WHEN s.jours_ech IS NULL THEN NULL
                        ELSE now() + (s.jours_ech || ' days')::interval END,
  "DatePaiement" = CASE WHEN s.jours_paie IS NULL THEN NULL
                        ELSE now() + (s.jours_paie || ' days')::interval END
FROM src s, cible c
WHERE c."IdFacture" = f."IdFacture" AND s.rn = c.rn;

--  6.b Nouvelles factures adossees aux missions terminees
INSERT INTO "Factures" ("IdFacture","NumeroFacture","DateEmission","DateEcheance",
  "DatePaiement","MontantHT","MontantTVA","MontantTTC","TauxTVA","Statut",
  "ModePaiement","Notes","ClientId","MissionId","DateCreation")
SELECT f.id, f.num, f.emission,
       CASE WHEN f.jours_ech IS NULL THEN NULL ELSE f.emission + (f.jours_ech || ' days')::interval END,
       CASE WHEN f.jours_paie IS NULL THEN NULL ELSE f.emission + (f.jours_paie || ' days')::interval END,
       f.ht, round((f.ht * 0.19)::numeric, 3), round((f.ht * 1.19)::numeric, 3),
       19.0, f.statut, f.mode, f.notes, f.client, f.mission, f.emission
FROM (VALUES
 (500,'FAC-202608-0011',now()-interval '10 days', 30, 6, 570.000,'PAYEE','VIREMENT',
   'Reglement par virement, reference VIR-88412.',520::bigint,504::bigint),
 (501,'FAC-202608-0012',now()-interval '17 days', 30, 11, 794.000,'PAYEE','CHEQUE',
   NULL,522::bigint,505::bigint),
 (502,'FAC-202608-0013',now()-interval '23 days', 30, 19, 186.000,'PAYEE','ESPECES',
   'Reglement au comptant a la livraison.',11::bigint,506::bigint),
 (503,'FAC-202608-0014',now()-interval '30 days', 30, 27, 880.000,'PAYEE','VIREMENT',
   NULL,10::bigint,507::bigint),
 (504,'FAC-202608-0015',now()-interval '37 days', 30, NULL, 486.000,'EN_RETARD',NULL,
   'Deuxieme relance envoyee, echeance depassee de sept jours.',520::bigint,508::bigint),
 (505,'FAC-202608-0016',now()-interval '44 days', 30, 22, 308.000,'PAYEE','VIREMENT',
   NULL,521::bigint,509::bigint),
 (506,'FAC-202609-0017',now()-interval '2 days' , 30, NULL, 918.000,'EMISE',NULL,
   'Facture de la mission en cours Sfax vers Tunis.',10::bigint,500::bigint),
 (507,'FAC-202609-0018',now()-interval '1 day'  , 30, NULL, 936.000,'EMISE',NULL,
   NULL,524::bigint,501::bigint),
 (508,'FAC-202609-0019',now(),                    30, NULL, 455.000,'BROUILLON',NULL,
   'A valider avant emission.',522::bigint,502::bigint),
 (509,'FAC-202607-0009',now()-interval '52 days', 30, NULL, 702.000,'ANNULEE',NULL,
   'Facture annulee, mission Kasserine non realisee.',524::bigint,NULL::bigint)
) AS f(id,num,emission,jours_ech,jours_paie,ht,statut,mode,notes,client,mission);

--  6.c Alertes metier
INSERT INTO "Alertes" ("IdAlerte","TypeAlerte","DateAlerte","DateEcheance","Message",
  "Priorite","Statut","UtilisateurId","VehiculeId","ChauffeurId","EquipementId",
  "MissionId","EntiteReference","EntiteReferenceId")
SELECT a.id, a.typ, a.date_a,
       CASE WHEN a.jours_ech IS NULL THEN NULL ELSE now() + (a.jours_ech || ' days')::interval END,
       a.msg, a.prio, a.statut, NULL::bigint,
       (SELECT "IdVehicule" FROM "Vehicules" WHERE "Immatriculation" = a.plaque),
       a.chauffeur, NULL::bigint, a.mission, a.ref, a.ref_id
FROM (VALUES
 (500,'VISITE_TECHNIQUE',now()-interval '1 day',-4,
  'Visite technique EXPIREE depuis 4 jours pour le vehicule 131 TU 7290 (Mercedes-Benz Actros 1845). Vehicule a immobiliser.',
  'CRITIQUE','ACTIVE','131 TU 7290',NULL::bigint,NULL::bigint,'DocumentAdministratif',508::bigint),
 (501,'ASSURANCE',now()-interval '2 days',-22,
  'Police d assurance EXPIREE pour le vehicule 176 TU 7745 (Isuzu N-Series NPR). Ne pas engager en mission.',
  'CRITIQUE','ACTIVE','176 TU 7745',NULL::bigint,NULL::bigint,'Assurance',506::bigint),
 (502,'VISITE_TECHNIQUE',now()-interval '3 hours',11,
  'Visite technique du vehicule 118 TU 5133 (Iveco Eurocargo 120E) a renouveler sous 11 jours.',
  'HAUTE','ACTIVE','118 TU 5133',NULL::bigint,NULL::bigint,'DocumentAdministratif',504::bigint),
 (503,'ASSURANCE',now()-interval '5 hours',18,
  'Police d assurance du vehicule 137 TU 8115 (Renault Master L3H2) arrivant a echeance dans 18 jours.',
  'HAUTE','ACTIVE','137 TU 8115',NULL::bigint,NULL::bigint,'Assurance',504::bigint),
 (504,'VISITE_TECHNIQUE',now()-interval '8 hours',25,
  'Visite technique du vehicule 112 TU 4820 (Iveco Daily 35C15) a programmer sous 25 jours.',
  'MOYENNE','ACTIVE','112 TU 4820',NULL::bigint,NULL::bigint,'DocumentAdministratif',501::bigint),
 (505,'PERMIS_CONDUIRE',now()-interval '1 day',NULL,
  'Permis de conduire de Riadh Maaloul arrivant a expiration dans moins de trois mois.',
  'HAUTE','ACTIVE',NULL,8::bigint,NULL::bigint,'Utilisateur',8::bigint),
 (506,'PERMIS_CONDUIRE',now()-interval '4 days',NULL,
  'Permis de conduire de Sonia Fakhfakh EXPIRE. Compte suspendu.',
  'CRITIQUE','LUE',NULL,515::bigint,NULL::bigint,'Utilisateur',515::bigint),
 (507,'STOCK_FAIBLE',now()-interval '6 hours',NULL,
  'Stock faible : Filtre a huile Iveco Daily (FLT-HUI-0142), 4 unites restantes pour un minimum de 6.',
  'MOYENNE','ACTIVE',NULL,NULL::bigint,NULL::bigint,'PieceRechange',500::bigint),
 (508,'STOCK_FAIBLE',now()-interval '9 hours',NULL,
  'Stock faible : Batterie 12 V 110 Ah (ELE-BAT-0033), 3 unites restantes pour un minimum de 4.',
  'MOYENNE','ACTIVE',NULL,NULL::bigint,NULL::bigint,'PieceRechange',503::bigint),
 (509,'STOCK_FAIBLE',now()-interval '2 days',NULL,
  'Stock au minimum : Kit embrayage Master L3 (TRN-EMB-0119), 2 unites restantes.',
  'HAUTE','TRAITEE',NULL,NULL::bigint,NULL::bigint,'PieceRechange',504::bigint),
 (510,'MAINTENANCE',now()-interval '12 hours',NULL,
  'Le vehicule 153 TU 1188 (Peugeot Partner) est signale en besoin de maintenance : temperature moteur elevee.',
  'HAUTE','ACTIVE','153 TU 1188',NULL::bigint,NULL::bigint,'Vehicule',NULL::bigint),
 (511,'KILOMETRAGE_MAINTENANCE',now()-interval '1 day',NULL,
  'Le vehicule 131 TU 7290 (Mercedes-Benz Actros 1845) approche de l echeance de revision : 412 800 km.',
  'MOYENNE','ACTIVE','131 TU 7290',NULL::bigint,NULL::bigint,'Vehicule',NULL::bigint),
 (512,'EQUIPEMENT_HORS_SERVICE',now()-interval '3 days',NULL,
  'Bache de protection 6 x 4 m signalee usee : deux oeillets a remplacer.',
  'BASSE','LUE',NULL,NULL::bigint,NULL::bigint,'Equipement',504::bigint),
 (513,'MISSION_EN_RETARD',now()-interval '4 hours',NULL,
  'La mission Sfax vers Tunis (client Sfax Industries SARL) depasse l horaire prevu de deux heures.',
  'HAUTE','ACTIVE','131 TU 7290',NULL::bigint,500::bigint,'Mission',500::bigint),
 (514,'FACTURE_IMPAYEE',now()-interval '2 days',NULL,
  'Facture FAC-202608-0015 (486,000 TND HT) en retard de paiement de sept jours, client Medina Textile.',
  'HAUTE','ACTIVE',NULL,NULL::bigint,NULL::bigint,'Facture',504::bigint),
 (515,'DOCUMENT_EXPIRE',now()-interval '6 days',-95,
  'Visite technique du vehicule 198 TU 4726 (Toyota Hilux) expiree depuis 95 jours. Vehicule hors service.',
  'BASSE','IGNOREE','198 TU 4726',NULL::bigint,NULL::bigint,'DocumentAdministratif',514::bigint)
) AS a(id,typ,date_a,jours_ech,msg,prio,statut,plaque,chauffeur,mission,ref,ref_id);

--  6.d Messagerie : quatre conversations, dont deux groupes de travail
INSERT INTO "Conversations" ("IdConversation","Titre","TypeConversation",
  "DateCreation","DernierMessageDate","CreatedByUserId","ImageGroupe","EstArchivee")
VALUES
 (500,'Exploitation - rotations du jour','GROUPE',now()-interval '40 days',
  now()-interval '12 minutes',500,NULL,false),
 (501,'Atelier maintenance','GROUPE',now()-interval '62 days',
  now()-interval '48 minutes',503,NULL,false),
 (502,NULL,'PRIVEE',now()-interval '9 days',now()-interval '3 hours',500,NULL,false),
 (503,'Suivi client Sfax Industries','GROUPE',now()-interval '21 days',
  now()-interval '1 day',2,NULL,false);

INSERT INTO "ConversationParticipants" ("IdParticipant","ConversationId",
  "UtilisateurId","DateAjout","DerniereLecture","EstAdmin","EstEpingle",
  "NotificationsActivees","Pseudonyme")
VALUES
 (500,500,500,now()-interval '40 days',now()-interval '10 minutes',true ,true ,true ,NULL),
 (501,500,2  ,now()-interval '40 days',now()-interval '25 minutes',false,false,true ,NULL),
 (502,500,510,now()-interval '38 days',now()-interval '2 hours'   ,false,false,true ,NULL),
 (503,500,512,now()-interval '38 days',now()-interval '15 minutes',false,false,true ,NULL),
 (504,500,7  ,now()-interval '30 days',now()-interval '4 hours'   ,false,false,false,NULL),
 (505,501,503,now()-interval '62 days',now()-interval '45 minutes',true ,true ,true ,NULL),
 (506,501,502,now()-interval '62 days',now()-interval '50 minutes',false,false,true ,NULL),
 (507,501,501,now()-interval '60 days',now()-interval '1 hour'    ,false,false,true ,NULL),
 (508,501,3  ,now()-interval '55 days',now()-interval '3 hours'   ,false,false,true ,NULL),
 (509,502,500,now()-interval '9 days' ,now()-interval '3 hours'   ,true ,false,true ,NULL),
 (510,502,503,now()-interval '9 days' ,now()-interval '5 hours'   ,false,false,true ,NULL),
 (511,503,2  ,now()-interval '21 days',now()-interval '1 day'     ,true ,false,true ,NULL),
 (512,503,500,now()-interval '21 days',now()-interval '1 day'     ,false,false,true ,NULL),
 (513,503,10 ,now()-interval '21 days',now()-interval '2 days'    ,false,false,true ,'Sfax Industries');

INSERT INTO "ChatMessages" ("IdMessage","Contenu","DateEnvoi","TypeMessage",
  "ExpediteurId","ConversationId","EstLu","DateLecture","EstSupprime","EstModifie",
  "CheminFichier","NomFichier","TailleFichier","Epingle")
VALUES
 (500,'Bonjour a tous. Point sur les rotations : quatre missions sont en cours ce matin.',
  now()-interval '5 hours','TEXTE',500,500,true,now()-interval '4 hours',false,false,NULL,NULL,NULL,true),
 (501,'Walid est parti de Sfax a 6 h 15 avec l Actros, chargement de 18 palettes conforme.',
  now()-interval '4 hours 40 minutes','TEXTE',500,500,true,now()-interval '4 hours',false,false,NULL,NULL,NULL,false),
 (502,'Bien recu. Je suis sur l autoroute A1, je devrais etre a Tunis vers 10 h 30.',
  now()-interval '4 hours 20 minutes','TEXTE',512,500,true,now()-interval '4 hours',false,false,NULL,NULL,NULL,false),
 (503,'Attention, la mission Sfax vers Tunis vient de basculer en retard de deux heures dans le systeme.',
  now()-interval '3 hours 50 minutes','TEXTE',2,500,true,now()-interval '3 hours',false,false,NULL,NULL,NULL,false),
 (504,'C est un bouchon a hauteur d Enfidha. Je repars, rien de bloquant.',
  now()-interval '3 hours 30 minutes','TEXTE',512,500,true,now()-interval '3 hours',false,false,NULL,NULL,NULL,false),
 (505,'Merci pour l information. Je previens le client.',
  now()-interval '3 hours 10 minutes','TEXTE',500,500,true,now()-interval '3 hours',false,false,NULL,NULL,NULL,false),
 (506,'Anis, tu peux prendre la rotation Monastir vers Tunis de jeudi ? Le Daily est disponible.',
  now()-interval '2 hours','TEXTE',500,500,true,now()-interval '2 hours',false,false,NULL,NULL,NULL,false),
 (507,'Oui c est note, je serai au depot a 5 h 30.',
  now()-interval '1 hour 40 minutes','TEXTE',510,500,true,now()-interval '1 hour',false,false,NULL,NULL,NULL,false),
 (508,'Voici le planning consolide de la semaine.',
  now()-interval '30 minutes','FICHIER',500,500,false,NULL,false,false,
  '/uploads/chat/planning-semaine.pdf','planning-semaine-36.pdf',184320,false),
 (509,'Parfait, je diffuse aux chauffeurs.',
  now()-interval '12 minutes','TEXTE',2,500,false,NULL,false,false,NULL,NULL,NULL,false),
 (510,'Etat de l atelier : deux vehicules immobilises, le Master et l Isuzu.',
  now()-interval '4 hours','TEXTE',503,501,true,now()-interval '3 hours',false,false,NULL,NULL,NULL,true),
 (511,'Le kit embrayage du Master est monte. Il me reste les essais routiers.',
  now()-interval '3 hours 20 minutes','TEXTE',502,501,true,now()-interval '3 hours',false,false,NULL,NULL,NULL,false),
 (512,'Pour l Isuzu, j attends l optique Hella. Le fournisseur annonce jeudi.',
  now()-interval '2 hours 50 minutes','TEXTE',501,501,true,now()-interval '2 hours',false,false,NULL,NULL,NULL,false),
 (513,'Attention, la visite technique de l Actros est expiree depuis quatre jours.',
  now()-interval '2 hours','TEXTE',503,501,true,now()-interval '1 hour',false,false,NULL,NULL,NULL,true),
 (514,'Je bloque le vehicule des son retour a Tunis et je prends rendez-vous au centre.',
  now()-interval '1 hour 30 minutes','TEXTE',502,501,true,now()-interval '1 hour',false,false,NULL,NULL,NULL,false),
 (515,'Le stock de filtres a huile Daily est descendu a quatre unites.',
  now()-interval '55 minutes','TEXTE',501,501,false,NULL,false,false,NULL,NULL,NULL,false),
 (516,'Commande passee chez Iveco Pieces, livraison annoncee sous 48 heures.',
  now()-interval '48 minutes','TEXTE',503,501,false,NULL,false,false,NULL,NULL,NULL,false),
 (517,'Bonjour Nadia, peux-tu valider l ordre de travail OT-2026-0120 ?',
  now()-interval '5 hours','TEXTE',500,502,true,now()-interval '5 hours',false,false,NULL,NULL,NULL,false),
 (518,'Je regarde cela dans la matinee. Le diagnostic est-il documente ?',
  now()-interval '4 hours 30 minutes','TEXTE',503,502,true,now()-interval '4 hours',false,false,NULL,NULL,NULL,false),
 (519,'Oui, le signalement du chauffeur est joint a l ordre de travail.',
  now()-interval '4 hours','TEXTE',500,502,true,now()-interval '3 hours',false,false,NULL,NULL,NULL,false),
 (520,'Valide. J ai aussi approuve le compte de Olfa Bouazizi.',
  now()-interval '3 hours','TEXTE',503,502,true,now()-interval '3 hours',false,false,NULL,NULL,NULL,false),
 (521,'Bonjour, nous confirmons l enlevement de 18 palettes lundi matin.',
  now()-interval '3 days','TEXTE',10,503,true,now()-interval '3 days',false,false,NULL,NULL,NULL,false),
 (522,'Bien recu. Le vehicule sera sur site a 6 heures, chauffeur Walid Chouchane.',
  now()-interval '3 days' + interval '40 minutes','TEXTE',2,503,true,now()-interval '2 days',false,false,NULL,NULL,NULL,false),
 (523,'Merci. Pouvez-vous nous transmettre la facture de la rotation precedente ?',
  now()-interval '2 days','TEXTE',10,503,true,now()-interval '2 days',false,false,NULL,NULL,NULL,false),
 (524,'Voici la facture FAC-202608-0014, acquittee.',
  now()-interval '1 day','FICHIER',500,503,true,now()-interval '1 day',false,false,
  '/uploads/chat/FAC-202608-0014.pdf','FAC-202608-0014.pdf',96256,false);

-- =====================================================================
--  7. RESYNCHRONISATION DES SEQUENCES
-- =====================================================================
--  Les identifiants ont ete fournis explicitement : sans cette etape,
--  la prochaine insertion faite par l application entrerait en conflit.
DO $$
DECLARE
  r record;
  seq text;
  maxi bigint;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.is_identity = 'YES'
  LOOP
    seq := pg_get_serial_sequence(format('%I', r.table_name), r.column_name);
    IF seq IS NOT NULL THEN
      EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', r.column_name, r.table_name)
        INTO maxi;
      PERFORM setval(seq, GREATEST(maxi + 1, 1), false);
    END IF;
  END LOOP;
END $$;

COMMIT;

-- =====================================================================
--  CONTROLE FINAL
-- =====================================================================
SELECT 'Utilisateurs'   AS module, count(*) AS lignes FROM "Utilisateurs"
UNION ALL SELECT 'dont en attente' , count(*) FROM "Utilisateurs" WHERE "Statut" = 0
UNION ALL SELECT 'dont archives'   , count(*) FROM "Utilisateurs" WHERE "Statut" = 4
UNION ALL SELECT 'Vehicules'       , count(*) FROM "Vehicules"
UNION ALL SELECT 'Equipements'     , count(*) FROM "Equipements"
UNION ALL SELECT 'PiecesRechange'  , count(*) FROM "PiecesRechange"
UNION ALL SELECT 'DemandesTransport', count(*) FROM "TransportRequests"
UNION ALL SELECT 'Devis'           , count(*) FROM "Devis"
UNION ALL SELECT 'Missions'        , count(*) FROM "Missions"
UNION ALL SELECT 'PositionsGPS'    , count(*) FROM "LivePositions"
UNION ALL SELECT 'OrdresTravail'   , count(*) FROM "OrdresTravail"
UNION ALL SELECT 'Interventions'   , count(*) FROM "Interventions"
UNION ALL SELECT 'Factures'        , count(*) FROM "Factures"
UNION ALL SELECT 'Alertes'         , count(*) FROM "Alertes"
UNION ALL SELECT 'Conversations'   , count(*) FROM "Conversations"
UNION ALL SELECT 'Messages'        , count(*) FROM "ChatMessages"
UNION ALL SELECT 'Carburants'      , count(*) FROM "Carburants"
UNION ALL SELECT 'Documents'       , count(*) FROM "DocumentsAdministratifs"
UNION ALL SELECT 'Assurances'      , count(*) FROM "Assurances";
