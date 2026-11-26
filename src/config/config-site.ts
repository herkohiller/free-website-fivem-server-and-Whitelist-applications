/**
 * CONFIG SITE – Single file for all changeable site text and options.
 *
 * Edit this file to customize:
 * - Site name, server name, header, nav labels
 * - Footer (badge, tagline, description, Discord card, copyright, bottom taglines)
 * - Discord DMs (author name, accepted/rejected templates for whitelist, job, staff)
 * - Whitelist application questions
 * - City businesses (jobs list)
 * - Staff application questions
 */

/** Template for one application status in a Discord DM. */
export type DmStatusTemplate = {
  reasonDefault: string;
  nextSteps: readonly string[];
  footerNote: string;
};

/** DM template for one application type (whitelist, job, staff). */
export type DmApplicationTemplate = {
  accepted: DmStatusTemplate;
  rejected: DmStatusTemplate;
  deviceCheck?: DmStatusTemplate;
};

const CONFIG_SITE = {
  // ─── Site & branding ─────────────────────────────────────────────────────
  /** Display name of the server (DMs, footer, branding) */
  serverName: "Streets of San Andreas",

  /** Site name shown in the header */
  siteName: "Streets of San Andreas",

  /** Icon or short label next to site name in header */
  headerIcon: "RP",

  /** Nav label for the whitelist link (e.g. "Get Whitelisted") */
  whitelistNavLabel: "Taotle Whitelisti",

  /** Nav label for the public store page */
  storeNavLabel: "Pood",

  /** Public Discord invite URL (footer "Connect" button and links) */
  discordInviteUrl: "https://discord.gg",

  /** Discord server ID for the footer widget iframe (leave empty "" to hide the widget) */
  discordWidgetServerId: "1251722749819359272",

  /** Homepage subtitle under the title (use {serverName} to insert the server name) */
  homepageSubtitle:
    "Tere tulemast Streets of San Andreas RP serverisse! Liitu meie Discordiga, täida whitelist-avaldus ja alusta oma lugu.",

  /** Store page title */
  storePageTitle: "Serveri Pood",

  /** Store page description */
  storePageDescription:
    "Sirvi kõiki serveris müüdavaid tooteid. Administraatorid saavad admin-paneelist hallata kategooriaid, hindu, tootenimesid ja pilte.",

  // ─── Top banner / ad bar ────────────────────────────────────────────────────
  /** Show the promotional banner at the very top of the site */
  topBannerEnabled: true,
  /** Label for the banner button (set empty string "" to hide the button) */
  topBannerCtaLabel: "Serveri Pood",
  /** URL opened when clicking the banner button (falls back to discordInviteUrl if empty) */
  topBannerCtaUrl: "https://tebex.io",
  /** Optional: cycle through multiple banner messages */
  topBannerMessages: ["Streets of San Andreas RP on nüüd avatud — liitu linnaga juba täna!"],

  // ─── Footer ───────────────────────────────────────────────────────────────
  /** Small badge text above tagline (e.g. or your brand) */
  footerBadgeLabel: "STREETS OF SAN ANDREAS",

  /** Uppercase tagline under the badge */
  footerTagline: "TÄNAVATELT PÕLVKONDADENI",

  /** Short description paragraph in the footer */
  footerDescription:
    "Koge kaasahaaravat GTA V rollimängu unikaalsete süsteemide, tõsise RP ja ühtehoidva kogukonnaga.",

  /** Discord connect card: button text */
  footerConnectButtonText: "Liitu Discordiga",

  /** Discord connect card: short line above button (use {serverName} for server name) */
  footerConnectBlurb:
    "Liitu {serverName} Discordiga, et saada whitelist, küsida küsimusi ja olla kursis uuendustega.",

  /** Copyright line: "Not affiliated with …" */
  footerCopyrightNote: "Ei ole seotud ettevõtetega Rockstar Games ega Take-Two Interactive.",

  /** Bottom bar left tagline (e.g. "RESPECT THE STREETS") */
  footerBottomTaglineLeft: "AUSTA TÄNAVAID",

  /** Bottom bar right tagline (e.g. "ROLEPLAY • COMMUNITY • STORIES") */
  footerBottomTaglineRight: "ROLLIMÄNG • KOGUKOND • LOOD",

  /** Section heading for footer nav column */
  footerNavHeading: "NAVIGATSIOON",

  /** Section heading for footer Discord card */
  footerConnectHeading: "ÜHENDU",

  /** Discord card inner title (e.g. "DISCORD") */
  footerDiscordCardTitle: "DISCORD",

  // ─── Discord DM (author & templates) ──────────────────────────────────────
  /** Author name on Discord DM embeds (optional; falls back to serverName) */
  discordDmAuthorName: "Streets of San Andreas RP",

  /** Discord DM templates for accepted/rejected messages (whitelist, job, staff) */
  dmTemplates: {
    whitelist: {
      accepted: {
        reasonDefault:
          "Sinu vastused näitasid head arusaama rollimängust ja sobivad sellega, mida me otsime. Kohtumiseni mängus!",
        nextSteps: [
          "Liitu meie Discordiga, kui sa pole veel seal",
          "Tutvu #reeglid kanaliga ja loe juhised läbi",
          "Ühendu serveriga oma whitelistitud kontoga, kui oled valmis",
        ],
        footerNote: "Loe enne mängu sisenemist reeglid läbi. Vajad abi? Küsi julgelt meeskonnalt.",
      },
      rejected: {
        reasonDefault:
          "Kahjuks ei saanud me sinu avaldust praegu kinnitada. Vaata meie reeglid ja juhised uuesti üle ning oled oodatud uuesti kandideerima, kui oled valmis.",
        nextSteps: [
          "Vaata uuesti üle meie serveri reeglid ja kogukonna juhised",
          "Esita uus avaldus, kui tunned, et oled valmis",
          "Küsimuste korral kirjuta meie meeskonnale Discordis",
        ],
        footerNote: "Täname huvi eest! Loodame, et kandideerid peagi uuesti.",
      },
      deviceCheck: {
        reasonDefault:
          "Tere, ootame sind! Kontrollime enne serverisse sisenemist sinu seadet. See on igapäevane rutiin ja serveri turvaprotokoll.",
        nextSteps: [
          "Oota, kuni meeskonnaliige sinuga ühendust võtab",
          "Ole Discordis seadmekontrolliks kättesaadav",
          "Kui kontroll on tehtud, jätkame sinu ligipääsu kinnitamisega",
        ],
        footerNote: "See seadmekontroll on osa meie tavapärasest serveri turvarutiinist.",
      },
    },
    job: {
      accepted: {
        reasonDefault:
          "Sinu avaldus sobis sellele ametikohale suurepäraselt. Edasiste sammude jaoks võta ühendust oma ülemusega.",
        nextSteps: [
          "Liitu meie Discordiga, kui sa pole veel liitunud",
          "Vaata lisainfot töökoha või meeskonna kanalitest",
          "Ühendu mängu ja anna endast ülemusele märku",
        ],
        footerNote: "Küsimusi ameti kohta? Meeskond aitab sind õigesse suunda juhatada.",
      },
      rejected: {
        reasonDefault:
          "Me ei liigu selle avaldusega praegu edasi. Võid proovida teisi vabu töökohti või kandideerida hiljem uuesti.",
        nextSteps: [
          "Vaata teisi vabu töökohti meie veebilehel",
          "Kandideeri uuesti, kui avanevad uued kohad",
          "Küsimuste korral võta Discordis meeskonnaga ühendust",
        ],
        footerNote: "Täname kandideerimast ja soovime edu!",
      },
    },
    staff: {
      accepted: {
        reasonDefault:
          "Sinu oskused ja kogemused sobivad täpselt sellega, mida vajame. Meeskonnajuht võtab sinuga peagi ühendust.",
        nextSteps: [
          "Liitu meie Discordiga, kui sa pole veel seal",
          "Loe läbi meeskonna juhised ja reeglid vastavates kanalites",
          "Meeskonnajuht võtab sinuga ühendust, et anda õigused ja juhised",
        ],
        footerNote:
          "Jäid millegagi hätta? Meeskonnajuht või vanemliikmed aitavad alati. Kohtumiseni tiimis!",
      },
      rejected: {
        reasonDefault:
          "Me ei saa sinu avaldust praegu kinnitada. Võid hiljem uuesti kandideerida, kui olukord muutub.",
        nextSteps: [
          "Tutvu uuesti meie serveri ja meeskonna juhistega",
          "Võid esitada uue meeskonna avalduse, kui oled valmis",
          "Küsimuste korral kirjuta meeskonnale Discordis",
        ],
        footerNote: "Täname, et soovid panustada ja aidata. Hindame seda väga!",
      },
    },
  } as const satisfies Record<string, DmApplicationTemplate>,

  // ─── Whitelist application form questions ─────────────────────────────────
  whitelistApplicationQuestions: [
    { id: "inGameName", label: "Sinu tegelase nimi mängus", type: "text" as const, required: true, placeholder: "Tegelase ees- ja perekonnanimi" },
    { id: "age", label: "Sinu vanus", type: "number" as const, required: true, placeholder: "18" },
    { id: "timezone", label: "Discord ID", type: "text" as const, required: true, placeholder: "Sinu Discord ID" },
    { id: "experience", label: "Miks soovid mängida Streets of San Andreas RP serveris?", type: "textarea" as const, required: true, placeholder: "Selgita, miks soovid just meie serveris mängida" },
    { id: "motivation", label: "Kust kuulsid Streets of San Andreas RP kohta?", type: "textarea" as const, required: true, placeholder: "Nt: Kuulsin sõbralt või nägin TikTokis/Discordis" },
    { id: "characterStory", label: "Kui kaua oled rollimängu (RP) mänginud?", type: "textarea" as const, required: true, placeholder: "Kui kaua oled RP-d mänginud ja mis pani sind alustama?" },
    { id: "additionalInfo", label: "Kas oled serveri reeglid läbi lugenud ja selgeks õppinud?", type: "textarea" as const, required: false, placeholder: "Nt: Jah, olen läbi lugenud ja selgeks õppinud" },
  ] as const,

  // ─── City businesses (jobs list) ───────────────────────────────────────────
  businesses: [
    { id: "hospital", name: "Pillboxi Meditsiinikeskus", category: "MEDITSIIN", description: "Haigla ja kiirabi (EMS)" },
    { id: "lspd", name: "LSPD", category: "PÄÄSTETEENISTUSED", description: "Politsei ja korrakaitse" },
  ] as const,

  // ─── Staff application form questions ──────────────────────────────────────
  staffApplicationQuestions: [
    { id: "role", label: "Mis pani sind tahtma liituda Streets of San Andreas meeskonnaga?", type: "select" as const, required: true, options: ["Tugi (Support)", "Arendus (Development)", "Partnerlus (Partnership)"] },
    { id: "age", label: "Vanus", type: "text" as const, required: true, placeholder: "nt 18" },
    { id: "experience", label: "Kas sul on varasemat meeskonnatöö (staff) kogemust?", type: "textarea" as const, required: false },
    { id: "availability", label: "Mitu tundi päevas saad meeskonnaliikmena aktiivne olla?", type: "text" as const, required: true },
    { id: "why", label: "Kui sul on varasemat kogemust, siis kus täpsemalt?", type: "textarea" as const, required: true },
    { id: "additional", label: "Kui saad meie meeskonda, mis oleks sinu peamine eesmärk?", type: "textarea" as const, required: false },
  ] as const,
} as const;

// Re-export as appConfig so existing imports keep working
export const appConfig = CONFIG_SITE;

export type StaffQuestion = (typeof appConfig.staffApplicationQuestions)[number];
export type WhitelistQuestion = (typeof appConfig.whitelistApplicationQuestions)[number];
export type Business = (typeof appConfig.businesses)[number];
