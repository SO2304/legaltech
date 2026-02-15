// ============================================
// SEED TEXTES DE LOIS - LEGALTECH DIVORCE
// ============================================

import { PrismaClient, Pays, CodeLegal } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// ============================================
// TEXTES DE LOIS FRANÇAIS
// ============================================
const loisFrance = [
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_CIVIL,
    article: '229',
    titre: 'Cas de divorce',
    contenu: `Le divorce peut être prononcé en cas :
1° De consentement mutuel ;
2° D'acceptation du principe de la rupture du mariage ;
3° D'altération définitive du lien conjugal ;
4° De faute.`,
    dateVigueur: new Date('2005-01-01'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_CIVIL,
    article: '230',
    titre: 'Divorce pour acceptation du principe de la rupture',
    contenu: `Le divorce peut être demandé par l'un des époux lorsque le lien conjugal est définitivement altéré. L'altération définitive du lien conjugal résulte de la cessation de la communauté de vie entre les époux, lorsqu'ils vivent séparés depuis deux ans lors de l'assignation en divorce.`,
    dateVigueur: new Date('2005-01-01'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_CIVIL,
    article: '1387',
    titre: 'Régime de la communauté réduite aux acquêts',
    contenu: `La communauté se compose activement des acquêts faits par les époux ensemble ou séparément durant le mariage, et provenant tant de leur industrie personnelle que des économies faites sur les fruits et revenus de leurs biens propres.`,
    dateVigueur: new Date('1966-01-01'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_CIVIL,
    article: '1401',
    titre: 'Biens propres par nature',
    contenu: `Forment des propres, par leur nature, quand même ils auraient été acquis pendant le mariage, les vêtements et linges à l'usage personnel de l'un des époux, les actions en réparation d'un dommage corporel ou moral, les créances et pensions incessibles, et, plus généralement, tous les biens qui ont un caractère personnel et tous les droits exclusivement attachés à la personne.`,
    dateVigueur: new Date('1966-01-01'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_CIVIL,
    article: '1408',
    titre: 'Biens acquis à titre gratuit',
    contenu: `Constituent également des propres, par leur origine, les biens que chacun des époux possédait au jour du mariage ou qu'il acquiert pendant le mariage par succession, donation ou legs.`,
    dateVigueur: new Date('1966-01-01'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_CIVIL,
    article: '242',
    titre: 'Prestation compensatoire',
    contenu: `Le divorce met fin au devoir de secours entre époux. L'un des époux peut être tenu de verser à l'autre une prestation destinée à compenser, autant qu'il est possible, la disparité que la rupture du mariage crée dans les conditions de vie respectives.`,
    dateVigueur: new Date('2005-01-01'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_CIVIL,
    article: '253',
    titre: 'Liquidation du régime matrimonial',
    contenu: `Après le prononcé du divorce, les époux peuvent procéder amiablement à la liquidation et au partage de leur régime matrimonial. À défaut, le juge ordonne d'office le règlement des intérêts patrimoniaux des époux.`,
    dateVigueur: new Date('2005-01-01'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_CIVIL,
    article: '371-2',
    titre: 'Autorité parentale - Principe',
    contenu: `Chacun des parents contribue à l'entretien et à l'éducation des enfants à proportion de ses ressources, de celles de l'autre parent, ainsi que des besoins de l'enfant. Cette obligation ne cesse pas de plein droit lorsque l'enfant est majeur.`,
    dateVigueur: new Date('2002-03-04'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_CIVIL,
    article: '373-2',
    titre: 'Résidence habituelle de l\'enfant',
    contenu: `En cas de séparation entre les parents, ou entre ceux-ci et l'enfant, la résidence habituelle de l'enfant peut être fixée en alternance au domicile de chacun des parents ou au domicile de l'un d'eux. À la demande de l'un des parents ou en cas de désaccord entre eux sur le mode de résidence de l'enfant, le juge peut ordonner une résidence en alternance à titre provisoire.`,
    dateVigueur: new Date('2002-03-04'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_CIVIL,
    article: '373-2-2',
    titre: 'Contribution à l\'entretien et à l\'éducation de l\'enfant',
    contenu: `En cas de séparation entre les parents, ou entre ceux-ci et l'enfant, la contribution à son entretien et à son éducation prend la forme d'une pension alimentaire versée, selon le cas, par l'un des parents à l'autre, ou à la personne à laquelle l'enfant a été confié.`,
    dateVigueur: new Date('2002-03-04'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_PROCEDURE_CIVILE,
    article: '1106',
    titre: 'Requête en divorce par consentement mutuel',
    contenu: `Les époux qui souhaitent divorcer par consentement mutuel déposent une requête conjointe auprès du juge aux affaires familiales. La requête est accompagnée d'une convention réglant l'ensemble des conséquences du divorce.`,
    dateVigueur: new Date('2005-01-01'),
  },
  {
    pays: Pays.FRANCE,
    code: CodeLegal.CODE_PROCEDURE_CIVILE,
    article: '1108',
    titre: 'Contenu de la convention de divorce',
    contenu: `La convention homologuée par le juge règle l'ensemble des conséquences du divorce, notamment :
1° La liquidation et le partage de leurs intérêts patrimoniaux ;
2° Les modalités de la contribution aux charges du mariage et de l'entretien ;
3° L'attribution de la jouissance du logement et du mobilier ;
4° Le sort des avantages matrimoniaux et des donations de biens à venir.`,
    dateVigueur: new Date('2005-01-01'),
  },
]

// ============================================
// FONCTION PRINCIPALE DE SEED
// ============================================
async function main() {
  console.log('🌱 Début du seeding...\n')

  // Supprimer les données existantes
  console.log('🗑️  Suppression des données existantes...')
  await prisma.texteLoi.deleteMany({})

  // Seed textes de lois français
  console.log('📚 Insertion des textes de lois français...')
  for (const loi of loisFrance) {
    await prisma.texteLoi.create({
      data: loi,
    })
    console.log(`  ✅ ${loi.pays} - ${loi.code} - Art. ${loi.article}`)
  }

  console.log(`\n✅ ${loisFrance.length} textes de lois insérés\n`)

  // Créer un avocat de démonstration
  console.log('👤 Création d\'un avocat de démonstration...')
  const hashedPassword = await bcrypt.hash('demo123456', 10)

  await prisma.avocat.upsert({
    where: { email: 'demo@avocat.fr' },
    update: {},
    create: {
      email: 'demo@avocat.fr',
      passwordHash: hashedPassword,
      nom: 'Dupont',
      prenom: 'Marie',
      cabinet: 'Cabinet Dupont & Associés',
      pays: Pays.FRANCE,
      barreau: 'Paris',
      numeroInscription: 'P12345',
    },
  })

  console.log('  ✅ Avocat créé: demo@avocat.fr (mot de passe: demo123456)\n')
  console.log('🎉 Seeding terminé avec succès!')
}

// ============================================
// EXÉCUTION
// ============================================
main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
