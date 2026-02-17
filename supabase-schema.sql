-- =============================================================================
-- LEGAL DOSSIER - SCHEMA SUPABASE (PostgreSQL)
-- Compatible avec prisma/schema.prisma
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE "Pays" AS ENUM ('FRANCE', 'BELGIQUE', 'SUISSE', 'LUXEMBOURG');

CREATE TYPE "DossierStatus" AS ENUM (
  'BROUILLON', 
  'EN_ATTENTE_PAIEMENT', 
  'PAYE', 
  'EN_ANALYSE', 
  'ANALYSE_TERMINEE', 
  'VALIDE', 
  'PURGE'
);

CREATE TYPE "DocumentType" AS ENUM (
  'CARTE_IDENTITE', 
  'ACTE_MARIAGE', 
  'BULLETIN_SALAIRE', 
  'AVIS_IMPOSITION', 
  'RELEVE_BANCAIRE', 
  'TITRE_PROPRIETE', 
  'AUTRE'
);

CREATE TYPE "CodeLegal" AS ENUM (
  'CODE_CIVIL', 
  'CODE_PROCEDURE_CIVILE', 
  'CODE_FAMILLE'
);

-- -----------------------------------------------------------------------------
-- TABLE: AVOCATS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "avocats" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  cabinet TEXT,
  pays "Pays" DEFAULT 'FRANCE',
  barreau TEXT,
  "numeroInscription" TEXT,
  telephone TEXT,
  adresse TEXT,
  ville TEXT,
  "stripeAccountId" TEXT UNIQUE,
  "stripeOnboarded" BOOLEAN DEFAULT false,
  "totpSecret" TEXT,
  "emailVerified" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "avocats_email_idx" ON "avocats"(email);
CREATE INDEX IF NOT EXISTS "avocats_pays_idx" ON "avocats"(pays);

-- -----------------------------------------------------------------------------
-- TABLE: CLIENTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "clients" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  pays "Pays" DEFAULT 'FRANCE',
  "paysDetecte" "Pays",
  "ipAddress" TEXT,
  "dateNaissance" TIMESTAMP,
  adresse TEXT,
  ville TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "clients_email_idx" ON "clients"(email);
CREATE INDEX IF NOT EXISTS "clients_pays_idx" ON "clients"(pays);

-- -----------------------------------------------------------------------------
-- TABLE: DOSSIERS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "dossiers" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  "avocatId" TEXT NOT NULL REFERENCES "avocats"(id) ON DELETE CASCADE,
  "clientId" TEXT NOT NULL REFERENCES "clients"(id) ON DELETE CASCADE,
  statut "DossierStatus" DEFAULT 'BROUILLON',
  pays "Pays" DEFAULT 'FRANCE',
  "typeProcedure" TEXT,
  "dateMariage" TIMESTAMP,
  "nombreEnfants" INTEGER DEFAULT 0,
  "analyseIA" TEXT,
  "syntheseHTML" TEXT,
  "sourcesLegales" TEXT,
  "montantTTC" REAL DEFAULT 149.00,
  "fraisGestion" REAL DEFAULT 30.00,
  "stripePaymentIntent" TEXT UNIQUE,
  "stripePaid" BOOLEAN DEFAULT false,
  "stripePaidAt" TIMESTAMP,
  "datePurge" TIMESTAMP,
  "isPurged" BOOLEAN DEFAULT false,
  "purgedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "dossiers_avocatId_idx" ON "dossiers"("avocatId");
CREATE INDEX IF NOT EXISTS "dossiers_statut_idx" ON "dossiers"(statut);
CREATE INDEX IF NOT EXISTS "dossiers_stripePaid_idx" ON "dossiers"("stripePaid");

-- -----------------------------------------------------------------------------
-- TABLE: DOCUMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "documents" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "dossierId" TEXT NOT NULL REFERENCES "dossiers"(id) ON DELETE CASCADE,
  type "DocumentType" NOT NULL,
  "nomOriginal" TEXT NOT NULL,
  "nomStockage" TEXT NOT NULL UNIQUE,
  "mimeType" TEXT,
  taille INTEGER,
  "cheminStorage" TEXT,
  "texteExtrait" TEXT,
  "donneesExtraites" TEXT,
  "qualiteImage" TEXT,
  "exigeLegal" BOOLEAN DEFAULT false,
  "articleLoi" TEXT,
  "estValide" BOOLEAN DEFAULT false,
  "datePurge" TIMESTAMP NOT NULL,
  "isPurged" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "documents_dossierId_idx" ON "documents"("dossierId");
CREATE INDEX IF NOT EXISTS "documents_type_idx" ON "documents"(type);

-- -----------------------------------------------------------------------------
-- TABLE: TEXTES_LOIS (Base de connaissances juridiques RAG)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "textes_lois" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  pays "Pays" NOT NULL,
  code "CodeLegal" NOT NULL,
  article TEXT NOT NULL,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  embedding TEXT,
  "dateVigueur" TIMESTAMP,
  "estActif" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE(pays, code, article)
);

CREATE INDEX IF NOT EXISTS "textes_lois_pays_code_idx" ON "textes_lois"(pays, code);

-- -----------------------------------------------------------------------------
-- DONNÉES INITIALES - TEXTES LÉGAUX (France)
-- -----------------------------------------------------------------------------

INSERT INTO textes_lois (pays, code, article, titre, contenu) VALUES 
-- Code Civil - Divorce
('FRANCE', 'CODE_CIVIL', '229', 'Divorce par consentement mutuel', 
'Le divorce peut être prononcé par consentement mutuel lorsque les époux répondent conjointement à la demande en divorce. Ils doivent dséposer une convention réglant les conséquences du divorce.'),

('FRANCE', 'CODE_CIVIL', '229-1', 'Convention de divorce', 
'La convention de divorce mentionne les nom, prénom, date et lieu de naissance, profession, domicile des époux, régime matrimonial et les dispositions adoptées pour les enfants.'),

('FRANCE', 'CODE_CIVIL', '229-2', 'Divorce sans consentement mutuel', 
'Lorsque les époux ne peuvent pas consentir mutuellement à leur divorce, le divorce peut être demandé par l''un d''eux pour faits de'altération définitive du lien conjugal.'),

('FRANCE', 'CODE_CIVIL', '230', 'Consentement mutuel extrajudiciaire', 
'À défaut de convention ou en cas de non-respect de celle-ci, l''époux qui refuse le divorce peut demander au juge de prononcer celui-ci aux torts exclusifs de son conjoint.'),

('FRANCE', 'CODE_CIVIL', '231', 'Procédure de divorce', 
'Le divorce est prononcé par le juge. Il statuera sur les modalités de l''exercice de l''autorité parentale, sur la contribution à l''education et à l''entretien des enfants.'),

('FRANCE', 'CODE_CIVIL', '232', 'Effets du divorce', 
'Le jugement de divorce est opposable aux tiers à compter de la date où il devient exécutoire et de son inscription sur les registres de l''état civil.'),

-- Code Civil - Prestation compensatoire
('FRANCE', 'CODE_CIVIL', '270', 'Objet de la prestation compensatoire', 
'La prestation compensatoire a pour objet de compenser, autant qu''il est possible, la disparité que la rupture du mariage crée dans les conditions de vie respectives.'),

('FRANCE', 'CODE_CIVIL', '271', 'Fixation de la prestation compensatoire', 
'Le montant de la prestation compensatoire est fixé par le juge en fonction des besoins de l''époux qui la demande et des ressources de l''époux qui la paie.'),

('FRANCE', 'CODE_CIVIL', '272', 'Évaluation des ressources', 
'Pour la fixation et la révision de la prestation compensatoire, le juge prend en compte les ressources visibles du débiteur. Il peutdockter la contribution à certaines charges.'),

('FRANCE', 'CODE_CIVIL', '273', 'Modalités de paiement', 
'La prestation compensatoire est versée sous forme de capital dont le montant ne peut excéder 30% des ressources du débiteur, sauf circonstances exceptionnelles.'),

('FRANCE', 'CODE_CIVIL', '274', 'Capital et rente', 
'Lorsque le débiteur n''est pas en mesure de verser le capital, le juge peutdotairement convertir la prestation compensatoire en rente viagère.'),

('FRANCE', 'CODE_CIVIL', '275', 'Révision de la rente', 
'Le tribunal peut réviser la rente si les circonstances ont undergoes une modification substantielle de l''un des éléments déterminer sa portée.'),

-- Code Civil - Autorité parentale
('FRANCE', 'CODE_CIVIL', '371-1', 'Principes de l''autorité parentale', 
'L''autorité parentale est un droit et un devoir. Elle appartient aux père et mère jusqu''à la majorité ou l''émancipation de l''enfant.'),

('FRANCE', 'CODE_CIVIL', '371-2', 'Exercice de l''autorité parentale', 
'L''autorité parentale s''exerce ensemble ou铅un d''eux aprèsterminaison de la vie commune. En cas de désaccord, le père ou la mère peut saisir le juge.'),

('FRANCE', 'CODE_CIVIL', '371-4', 'Résidence de l''enfant', 
'La résidence de l''enfant peut être fxée alternativement au domicile de chacun des parents ou au domicile de l''un d''eux seulement.'),

-- Code Civil - Pension alimentaire
('FRANCE', 'CODE_CIVIL', '373-2', 'Contribution à l''entretien et à l''éducation', 
'Chacun des père et mère contribue à l''entretien et à l''éducation des enfants à proportion de ses ressources et de celles de l''autre parent.'),

-- Code Civil - Partage des biens
('FRANCE', 'CODE_CIVIL', '1466', 'Licitation', 
'Lorsque les cohéritiers ne peuvent agree sur le partage des biens, il est procédé à la licitation. Les biens sont vendus aux enchèrtères publiques.'),

-- Code Civil - Régimes matrimoniaux
('FRANCE', 'CODE_CIVIL', '1525', 'Communauté réduite aux acquêts', 
'La communauté réduite aux acquêts comprend les biens acquis pendant le mariage et n''appartenant pas propres à l''un ou l''autre des époux.'),

-- Code Procedure Civile
('FRANCE', 'CODE_PROCEDURE_CIVILE', '1106', 'Requête conjointe', 
'La requête conjointe est présentée par les parties ou leurs avocats. Elle doit contenir l''exposé des motifs du divorce et les pièces justificatives.'),

('FRANCE', 'CODE_PROCEDURE_CIVILE', '1107', 'Notification de la requête', 
'La requête est notifiée à l''autre époux par lettre recommandée avec accusé de réception ou par voie électronique.'),

('FRANCE', 'CODE_PROCEDURE_CIVILE', '1108', 'Ordonnance de non-conciliation', 
'Le juge rend une ordonnance de non-conciliation qui xed les mesures provisoires et autorise les époux à提交 une convention de divorce.'),

-- Code de la Famille
('FRANCE', 'CODE_FAMILLE', 'L213-1', 'Acte de divorce', 
'Le divorce est constaté par un acte reçu en la forme authentique par l''officier de l''état civil ou par une décision judiciaire quiemscription sur les registres.'),

-- -----------------------------------------------------------------------------
-- DONNÉES INITIALES - TEXTES LÉGAUX (Belgique)
-- -----------------------------------------------------------------------------

('BELGIQUE', 'CODE_CIVIL', '229', 'Divorce par consentement mutuel', 
'En Belgique, le divorce par consentement mutuel est régi par les articles 229 et suivants du Code civil. Il requiert l''accord des deux époux.'),

('BELGIQUE', 'CODE_CIVIL', '231', 'Conditions du divorce', 
'Pour divorce par consentement mutuel, les époux doivent être mariés depuis au moins 6 mois et ne pas avoir d''enfants mineurs non émancipés.'),

('BELGIQUE', 'CODE_CIVIL', '1287', 'Convention regulate', 
'Les époux déposent une convention regulate devant le notaire qui constate le divorce et la transcrit sur les registres de l''état civil.'),

('BELGIQUE', 'CODE_CIVIL', '1305', 'Contribution aux charges du mariage', 
'Chacun des époux contribue aux charges du mariage selon ses facultés. En cas de divorce, une pension alimentaire peut être fixée.'),

('BELGIQUE', 'CODE_FAMILLE', '203', 'Droits et devoirs des parents', 
'Les père et mère ont, relativement à leurs enfants mineurs, l''exercice de l''autorité parentale. Ils doivent entretien, éducation et surveillance.'),

-- -----------------------------------------------------------------------------
-- DONNÉES INITIALES - TEXTES LÉGAUX (Suisse)
-- -----------------------------------------------------------------------------

('SUISSE', 'CODE_CIVIL', '111', 'Divorce par consentement mutuel', 
'En Suisse, le divorce par consentement mutuel (art. 111 ss CC) requiert que les époux présentent une demande commune au tribunal.'),

('SUISSE', 'CODE_CIVIL', '114', 'Requête de divorce', 
'La requête de divorce doit contenir une convention sur les effets du divorce, notamment la répartition des biens et la garde des enfants.'),

('SUISSE', 'CODE_CIVIL', '125', 'Contribution d''entretien', 
'Le conjoint débiteur d''une contribution d''entretien en faveur de l''autre doit s''acquitter de cette obligation aussi bien que possible.'),

('SUISSE', 'CODE_CIVIL', '176', 'Autorités parentales', 
'Le tribunal prononçant le divorce attribue l''autorité parentale à l''un des parents ou à tous les deux conjointement.'),

('SUISSE', 'CODE_CIVIL', '296', 'Rapports patrimoniaux', 
'Les biens des époux sont soumis au régime de la séparation des biens. Chaque époux conserve les biens qui lui appartiennent.'),

-- -----------------------------------------------------------------------------
-- DONNÉES INITIALES - TEXTES LÉGAUX (Luxembourg)
-- -----------------------------------------------------------------------------

('LUXEMBOURG', 'CODE_CIVIL', '229', 'Divorce', 
'Au Luxembourg, le divorce peut être prononcé par consentement mutuel ou pour faute. La demande doit être présentée au tribunal.'),

('LUXEMBOURG', 'CODE_CIVIL', '232', 'Consentement mutuel', 
'Le divorce par consentement mutuel est recevable si les époux sont d''accord sur toutes les conséquences du divorce.'),

('LUXEMBOURG', 'CODE_CIVIL', '242', 'Pension alimentaire', 
'Après le divorce, la pension alimentaire est determinada par le tribunal en fonction des besoins et des ressources de chaque partie.'),

('LUXEMBOURG', 'CODE_CIVIL', '303', 'Effets du divorce', 
'Le divorce dissout le mariage. Les époux perdent les droits et devoirs découlant de l''union matrimoniale.'),

('LUXEMBOURG', 'CODE_FAMILLE', '380', 'Autorité parentale', 
'L''autorité parentale comprend le droit de garde, le droit de surveillance et le droit d''éducation des enfants mineurs.'),

-- -----------------------------------------------------------------------------
-- FONCTIONS UTILITAIRES
-- -----------------------------------------------------------------------------

-- Fonction pour générer une référence de dossier unique
CREATE OR REPLACE FUNCTION generate_dossier_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'DOS-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la date de purge (7 jours après création)
CREATE OR REPLACE FUNCTION calculate_purge_date(created_at TIMESTAMP DEFAULT NOW())
RETURNS TIMESTAMP AS $$
BEGIN
  RETURN created_at + INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- POLICIES DE SÉCURITÉ (Row Level Security)
-- -----------------------------------------------------------------------------

-- Activer RLS sur toutes les tables
ALTER TABLE "avocats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dossiers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "textes_lois" ENABLE ROW LEVEL SECURITY;

-- Policy: Avocats peuvent voir leurs dossiers
CREATE POLICY "avocat_see_own_dossiers" ON "dossiers"
  FOR SELECT USING ("avocatId" = current_setting('app.current_avocat_id', true)::TEXT);

-- Policy: Clients peuvent voir leurs dossiers
CREATE POLICY "client_see_own_dossiers" ON "dossiers"
  FOR SELECT USING ("clientId" = current_setting('app.current_client_id', true)::TEXT);

-- Policy: Avocats peuvent voir leurs documents
CREATE POLICY "avocat_see_own_documents" ON "documents"
  FOR SELECT USING ("dossierId" IN (
    SELECT id FROM "dossiers" WHERE "avocatId" = current_setting('app.current_avocat_id', true)::TEXT
  ));

-- -----------------------------------------------------------------------------
-- VERSION
-- -----------------------------------------------------------------------------

COMMENT ON SCHEMA public IS 'Legal Dossier - Schéma PostgreSQL pour plateforme de divorce IA';
COMMENT ON TABLE "avocats" IS 'Table des avocats utilisateurs de la plateforme';
COMMENT ON TABLE "clients" IS 'Table des clients ayant créé des dossiers';
COMMENT ON TABLE "dossiers" IS 'Dossiers de divorce avec analyse IA';
COMMENT ON TABLE "documents" IS 'Documents uploadés par les clients';
COMMENT ON TABLE "textes_lois" IS 'Base de connaissances juridiques pour le RAG';
