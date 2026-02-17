import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Textes légaux France
  const textesFrance = [
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '229', titre: 'Divorce par consentement mutuel', contenu: 'Le divorce peut être prononcé par consentement mutuel lorsque les époux répondent conjointement à la demande en divorce. Ils doivent déposer une convention réglant les conséquences du divorce.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '229-1', titre: 'Convention de divorce', contenu: 'La convention de divorce mentionne les nom, prénom, date et lieu de naissance, profession, domicile des époux, régime matrimonial et les dispositions adoptées pour les enfants.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '229-2', titre: 'Divorce sans consentement mutuel', contenu: 'Lorsque les époux ne peuvent pas consentir mutuellement à leur divorce, le divorce peut être demandé par lun deux pour faits daltération définitive du lien conjugal.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '230', titre: 'Consentement mutuel extrajudiciaire', contenu: 'À défaut de convention ou en cas de non-respect de celle-ci, lépoux qui refuse le divorce peut demander au juge de prononcer celui-ci aux torts exclusifs de son conjoint.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '231', titre: 'Procédure de divorce', contenu: 'Le divorce est prononcé par le juge. Il statuera sur les modalités de lexercice de lautorité parentale, sur la contribution à léducation et à lentretien des enfants.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '232', titre: 'Effets du divorce', contenu: 'Le jugement de divorce est opposable aux tiers à compter de la date où il devient exécutoire et de son inscription sur les registres de létat civil.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '270', titre: 'Objet de la prestation compensatoire', contenu: 'La prestation compensatoire a pour objet de compenser, autant quil est possible, la disparité que la rupture du mariage crée dans les conditions de vie respectives.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '271', titre: 'Fixation de la prestation compensatoire', contenu: 'Le montant de la prestation compensatoire est fixé par le juge en fonction des besoins de lépoux qui la demande et des ressources de lépoux qui la paie.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '272', titre: 'Évaluation des ressources', contenu: 'Pour la fixation et la révision de la prestation compensatoire, le juge prend en compte les ressources visibles du débiteur.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '273', titre: 'Modalités de paiement', contenu: 'La prestation compensatoire est versée sous forme de capital dont le montant ne peut excéder 30% des ressources du débiteur, sauf circonstances exceptionnelles.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '274', titre: 'Capital et rente', contenu: 'Lorsque le débiteur nest pas en mesure de verser le capital, le juge peutodalité convertir la prestation compensatoire en rente viagère.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '275', titre: 'Révision de la rente', contenu: 'Le tribunal peut réviser la rente si les circonstances ont subi une modification substantielle de lun des éléments déterminants.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '371-1', titre: 'Principes de lautorité parentale', contenu: 'Lautorité parentale est un droit et un devoir. Elle appartient aux père et mère jusquà la majorité ou lémancipation de lenfant.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '371-2', titre: 'Exercice de lautorité parentale', contenu: 'Lautorité parentale sexerce ensemble ou par lun deux après dissolution de la vie commune. En cas de désaccord, le père ou la mère peut saisir le juge.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '371-4', titre: 'Résidence de lenfant', contenu: 'La résidence de lenfant peut être fixée alternativement au domicile de chacun des parents ou au domicile de lun deux seulement.' },
    { pays: 'FRANCE' as const, code: 'CODE_CIVIL' as const, article: '373-2', titre: 'Contribution à lentretien et à léducation', contenu: 'Chacun des père et mère contribue à lentretien et à léducation des enfants à proportion de ses ressources et de celles de lautre parent.' },
  ]

  // Textes légaux Belgique
  const textesBelgique = [
    { pays: 'BELGIQUE' as const, code: 'CODE_CIVIL' as const, article: '229', titre: 'Divorce par consentement mutuel', contenu: 'En Belgique, le divorce par consentement mutuel est régi par les articles 229 et suivants du Code civil. Il requiert laccord des deux époux.' },
    { pays: 'BELGIQUE' as const, code: 'CODE_CIVIL' as const, article: '231', titre: 'Conditions du divorce', contenu: 'Pour divorce par consentement mutuel, les époux doivent être mariés depuis au moins 6 mois.' },
    { pays: 'BELGIQUE' as const, code: 'CODE_CIVIL' as const, article: '1287', titre: 'Convention réglementaire', contenu: 'Les époux déposent une convention réglementaire devant le notaire qui constate le divorce.' },
    { pays: 'BELGIQUE' as const, code: 'CODE_CIVIL' as const, article: '1305', titre: 'Contribution aux charges du mariage', contenu: 'Chacun des époux contribue aux charges du mariage selon ses facultés.' },
    { pays: 'BELGIQUE' as const, code: 'CODE_FAMILLE' as const, article: '203', titre: 'Droits et devoirs des parents', contenu: 'Les père et mère ont, relativement à leurs enfants mineurs, lexercice de lautorité parentale.' },
  ]

  // Textes légaux Suisse
  const textesSuisse = [
    { pays: 'SUISSE' as const, code: 'CODE_CIVIL' as const, article: '111', titre: 'Divorce par consentement mutuel', contenu: 'En Suisse, le divorce par consentement mutuel requiert que les époux présentent une demande commune au tribunal.' },
    { pays: 'SUISSE' as const, code: 'CODE_CIVIL' as const, article: '114', titre: 'Requête de divorce', contenu: 'La requête de divorce doit contenir une convention sur les effets du divorce.' },
    { pays: 'SUISSE' as const, code: 'CODE_CIVIL' as const, article: '125', titre: 'Contribution dentretien', contenu: 'Le conjoint débiteur dune contribution dentretien doit sacquitter de cette obligation.' },
    { pays: 'SUISSE' as const, code: 'CODE_CIVIL' as const, article: '176', titre: 'Autorités parentales', contenu: 'Le tribunal prononçant le divorce attribue lautorité parentale à lun des parents ou à tous les deux.' },
    { pays: 'SUISSE' as const, code: 'CODE_CIVIL' as const, article: '296', titre: 'Rapports patrimoniaux', contenu: 'Les biens des époux sont soumis au régime de la séparation des biens.' },
  ]

  // Textes légaux Luxembourg
  const textesLuxembourg = [
    { pays: 'LUXEMBOURG' as const, code: 'CODE_CIVIL' as const, article: '229', titre: 'Divorce', contenu: 'Au Luxembourg, le divorce peut être prononcé par consentement mutuel ou pour faute.' },
    { pays: 'LUXEMBOURG' as const, code: 'CODE_CIVIL' as const, article: '232', titre: 'Consentement mutuel', contenu: 'Le divorce par consentement mutuel est recevable si les époux sont dun accord sur toutes les conséquences.' },
    { pays: 'LUXEMBOURG' as const, code: 'CODE_CIVIL' as const, article: '242', titre: 'Pension alimentaire', contenu: 'Après le divorce, la pension alimentaire est déterminée par le tribunal.' },
    { pays: 'LUXEMBOURG' as const, code: 'CODE_CIVIL' as const, article: '303', titre: 'Effets du divorce', contenu: 'Le divorce dissout le mariage. Les époux perdent les droits et devoirs découlant de lunion.' },
    { pays: 'LUXEMBOURG' as const, code: 'CODE_FAMILLE' as const, article: '380', titre: 'Autorité parentale', contenu: 'Lautorité parentale comprend le droit de garde, le droit de surveillance et le droit déducation.' },
  ]

  const allTextes = [...textesFrance, ...textesBelgique, ...textesSuisse, ...textesLuxembourg]

  for (const texte of allTextes) {
    await prisma.texteLoi.upsert({
      where: { pays_code_article: { pays: texte.pays, code: texte.code, article: texte.article } },
      update: {},
      create: texte,
    })
  }

  console.log(`✅ Seeded ${allTextes.length} textes légaux`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
