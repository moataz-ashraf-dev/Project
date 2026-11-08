import { useEffect, useMemo, useState } from 'react';
import { Bot, Check, ChevronLeft, ChevronRight, Crown, CreditCard, Gem, Globe2, ShieldCheck, Sparkles, Star, X, Zap, WalletCards } from 'lucide-react';
import type { LanguageCode, TranslationKey } from '@/lib/i18n';
import { PET_CATALOG, profileStore } from '@/lib/profileStore';
import { loadPetCatalog, type CloudPetDefinition } from '@/lib/catalog';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getPetVisual } from '@/lib/petAssets';
import { useAuth } from '@/auth/useAuth';
import { announceCommerce } from '@/lib/notifications';

type Props = { language: LanguageCode; t: (key: TranslationKey) => string };

type PremiumCopy = {
  heroTitle:string; gemTopup:string; gemTopupBody:string; buyGems:string; gemPack:string; gemsLabel:string; priceLabel:string; parentPurchaseNote:string; heroBody:string; subscribe:string; benefits:string; exclusive:string; aiTitle:string; aiBody:string; plan:string; monthly:string; yearly:string; month:string; year:string; bestValue:string; upgrade:string; manage:string; premiumExclusive:string; premiumRequired:string; aiLimit:string; moreAi:string; languages:string; companions:string; skins:string; rewards:string; community:string; adFree:string; secure:string; cancel:string; support:string; unlocked:string; purchaseError:string; signIn:string; currencyCoins:string; currencyGems:string; paymentMethods:string; secureCheckout:string; parentApproval:string; premiumGift:string; welcomeGift:string; allCompanions:string; rarity:Record<string,string>; pets:Record<string,string>;
};

const NAMES: Record<LanguageCode, Record<string,string>> = {
  en: {"sparky":"Sparky","velvet-cat":"Velvet Cat","moon-rabbit":"Moon Rabbit","ember-pup":"Ember Pup","pearl-hamster":"Pearl Hamster","suncrest-parrot":"Suncrest Parrot","ice-penguin":"Ice Penguin","sage-turtle":"Sage Turtle","cobalt-donkey":"Cobalt Donkey","aurora-fox":"Aurora Fox","river-otter":"River Otter","ruby-red-panda":"Ruby Red Panda","mist-raccoon":"Mist Raccoon","willow-deer":"Willow Deer","coral-seal":"Coral Seal","crystal-owl":"Crystal Owl","golden-capybara":"Golden Capybara","shadow-wolf":"Shadow Wolf","snow-leopard":"Snow Leopard","storm-eagle":"Storm Eagle","solar-tiger":"Cosmic Tiger","royal-lion":"Royal Lion","jade-crocodile":"Jade Crocodile","abyss-shark":"Abyss Shark","twilight-manta":"Twilight Manta","jade-griffin":"Jade Griffin","crimson-kitsune":"Crimson Kitsune","starlight-unicorn":"Starlight Unicorn","sky-pegasus":"Sky Pegasus","eternal-phoenix":"Eternal Phoenix","storm-wyvern":"Storm Wyvern","frost-dragon":"Frost Dragon","crystal-dragon":"Crystal Dragon","void-dragon":"Void Dragon","celestial-whale":"Celestial Whale","starfall-leviathan":"Starfall Leviathan","celestial-seraph":"Celestial Seraph","dreamweaver-kirin":"Dreamweaver Kirin","cosmic-serpent":"Cosmic Serpent","chrono-dragon":"Chrono Dragon","frost-raptor":"Frost Raptor","magma-trex":"Magma T-Rex","ember-raptor":"Ember Raptor","azure-drake":"Azure Drake","crimson-phoenix":"Crimson Phoenix","storm-griffin":"Storm Griffin","frost-wolf":"Frost Wolf","jade-triceratops":"Jade Triceratops","lunar-wyvern":"Lunar Wyvern","sunfire-tiger":"Sunfire Tiger"},
  ar: {"sparky":"سباركي","velvet-cat":"قط مخملي","moon-rabbit":"أرنب القمر","ember-pup":"جرو الجمر","pearl-hamster":"هامستر اللؤلؤ","suncrest-parrot":"ببغاء قمة الشمس","ice-penguin":"بطريق الجليد","sage-turtle":"سلحفاة الحكيم","cobalt-donkey":"حمار كوبالت","aurora-fox":"ثعلب الشفق","river-otter":"ثعلب الماء النهري","ruby-red-panda":"باندا حمراء ياقوتية","mist-raccoon":"راكون الضباب","willow-deer":"غزال الصفصاف","coral-seal":"فقمة المرجان","crystal-owl":"بومة الكريستال","golden-capybara":"كابيبارا ذهبية","shadow-wolf":"ذئب الظلال","snow-leopard":"نمر الثلج","storm-eagle":"نسر العاصفة","solar-tiger":"النمر الكوني","royal-lion":"الأسد الملكي","jade-crocodile":"تمساح اليشم","abyss-shark":"قرش الهاوية","twilight-manta":"مانتا الشفق","jade-griffin":"غريفين اليشم","crimson-kitsune":"كيتسوني قرمزي","starlight-unicorn":"وحيد القرن النجمي","sky-pegasus":"بيغاسوس السماء","eternal-phoenix":"عنقاء الخلود","storm-wyvern":"وايفرن العاصفة","frost-dragon":"تنين الصقيع","crystal-dragon":"تنين الكريستال","void-dragon":"تنين الفراغ","celestial-whale":"حوت سماوي","starfall-leviathan":"ليفياثان سقوط النجوم","celestial-seraph":"سيراف سماوي","dreamweaver-kirin":"كيرين ناسج الأحلام","cosmic-serpent":"أفعى كونية","chrono-dragon":"تنين الزمن","frost-raptor":"رابتور الصقيع","magma-trex":"تي-ريكس الحمم","ember-raptor":"رابتور الجمر","azure-drake":"التنين الأزرق","crimson-phoenix":"العنقاء القرمزية","storm-griffin":"غريفين العاصفة","frost-wolf":"ذئب الصقيع","jade-triceratops":"ترايسيراتوبس اليشم","lunar-wyvern":"وايفرن القمر","sunfire-tiger":"نمر نار الشمس"},
  fr: {"sparky":"Sparky","velvet-cat":"Chat Velours","moon-rabbit":"Lapin Lunaire","ember-pup":"Chiot Braise","pearl-hamster":"Hamster Perlé","suncrest-parrot":"Perroquet Soleil","ice-penguin":"Manchot de Glace","sage-turtle":"Tortue Sage","cobalt-donkey":"Âne Cobalt","aurora-fox":"Renard Boréal","river-otter":"Loutre Rivière","ruby-red-panda":"Panda Rouge Rubis","mist-raccoon":"Raton Brumeux","willow-deer":"Cerf Saule","coral-seal":"Phoque Corail","crystal-owl":"Hibou Cristal","golden-capybara":"Capybara Doré","shadow-wolf":"Loup des Ombres","snow-leopard":"Léopard des Neiges","storm-eagle":"Aigle Tempête","solar-tiger":"Tigre Cosmique","royal-lion":"Lion Royal","jade-crocodile":"Crocodile Jade","abyss-shark":"Requin Abyssal","twilight-manta":"Manta du Crépuscule","jade-griffin":"Griffon Jade","crimson-kitsune":"Kitsune Cramoisi","starlight-unicorn":"Licorne Stellaire","sky-pegasus":"Pégase Céleste","eternal-phoenix":"Phénix Éternel","storm-wyvern":"Wyverne Tempête","frost-dragon":"Dragon Givré","crystal-dragon":"Dragon Cristal","void-dragon":"Dragon du Vide","celestial-whale":"Baleine Céleste","starfall-leviathan":"Léviathan Stellaire","celestial-seraph":"Séraphin Céleste","dreamweaver-kirin":"Kirin Tisseur de Rêves","cosmic-serpent":"Serpent Cosmique","chrono-dragon":"Dragon Chrono","frost-raptor":"Raptor de Givre","magma-trex":"T-Rex Magma","ember-raptor":"Raptor de Braise","azure-drake":"Drake Azur","crimson-phoenix":"Phénix Cramoisi","storm-griffin":"Griffon Tempête","frost-wolf":"Loup de Givre","jade-triceratops":"Tricératops Jade","lunar-wyvern":"Wyverne Lunaire","sunfire-tiger":"Tigre Flamme Solaire"},
  de: {"sparky":"Sparky","velvet-cat":"Samt-Katze","moon-rabbit":"Mondhase","ember-pup":"Glutwelpe","pearl-hamster":"Perlenhamster","suncrest-parrot":"Sonnenpapagei","ice-penguin":"Eispinguin","sage-turtle":"Weise Schildkröte","cobalt-donkey":"Kobaltesel","aurora-fox":"Aurorafuchs","river-otter":"Flussotter","ruby-red-panda":"Rubinroter Panda","mist-raccoon":"Nebelwaschbär","willow-deer":"Weidenhirsch","coral-seal":"Korallenrobbe","crystal-owl":"Kristalleule","golden-capybara":"Goldenes Capybara","shadow-wolf":"Schattenwolf","snow-leopard":"Schneeleopard","storm-eagle":"Sturmadler","solar-tiger":"Kosmischer Tiger","royal-lion":"Königslöwe","jade-crocodile":"Jadekrokodil","abyss-shark":"Abyss-Hai","twilight-manta":"Zwielicht-Manta","jade-griffin":"Jadegreif","crimson-kitsune":"Purpur-Kitsune","starlight-unicorn":"Sternenlicht-Einhorn","sky-pegasus":"Himmelspegasus","eternal-phoenix":"Ewiger Phönix","storm-wyvern":"Sturmwyvern","frost-dragon":"Frostdrache","crystal-dragon":"Kristalldrache","void-dragon":"Leeren-Drache","celestial-whale":"Himmelswal","starfall-leviathan":"Sternenfall-Leviathan","celestial-seraph":"Himmlischer Seraph","dreamweaver-kirin":"Traumweber-Kirin","cosmic-serpent":"Kosmische Schlange","chrono-dragon":"Chrono-Drache","frost-raptor":"Frost-Raptor","magma-trex":"Magma-T-Rex","ember-raptor":"Glut-Raptor","azure-drake":"Azur-Drache","crimson-phoenix":"Purpurphönix","storm-griffin":"Sturm-Greif","frost-wolf":"Frostwolf","jade-triceratops":"Jade-Triceratops","lunar-wyvern":"Mondwyvern","sunfire-tiger":"Sonnenfeuer-Tiger"},
  ja: {"sparky":"スパーキー","velvet-cat":"ベルベットキャット","moon-rabbit":"ムーンラビット","ember-pup":"エンバーパップ","pearl-hamster":"パールハムスター","suncrest-parrot":"サンクレストパロット","ice-penguin":"アイスペンギン","sage-turtle":"セージタートル","cobalt-donkey":"コバルトロバ","aurora-fox":"オーロラフォックス","river-otter":"リバーオッター","ruby-red-panda":"ルビーレッサーパンダ","mist-raccoon":"ミストラクーン","willow-deer":"ウィローディア","coral-seal":"コーラルシール","crystal-owl":"クリスタルオウル","golden-capybara":"ゴールデンカピバラ","shadow-wolf":"シャドウウルフ","snow-leopard":"スノーレパード","storm-eagle":"ストームイーグル","solar-tiger":"コズミックタイガー","royal-lion":"ロイヤルライオン","jade-crocodile":"ジェイドクロコダイル","abyss-shark":"アビスシャーク","twilight-manta":"トワイライトマンタ","jade-griffin":"ジェイドグリフォン","crimson-kitsune":"クリムゾンキツネ","starlight-unicorn":"スターライトユニコーン","sky-pegasus":"スカイペガサス","eternal-phoenix":"エターナルフェニックス","storm-wyvern":"ストームワイバーン","frost-dragon":"フロストドラゴン","crystal-dragon":"クリスタルドラゴン","void-dragon":"ヴォイドドラゴン","celestial-whale":"セレスティアルホエール","starfall-leviathan":"スターフォールリヴァイアサン","celestial-seraph":"セレスティアルセラフ","dreamweaver-kirin":"ドリームウィーバーキリン","cosmic-serpent":"コズミックスネーク","chrono-dragon":"クロノドラゴン","frost-raptor":"フロストラプター","magma-trex":"マグマTレックス","ember-raptor":"エンバーラプター","azure-drake":"アズールドレイク","crimson-phoenix":"クリムゾンフェニックス","storm-griffin":"ストームグリフォン","frost-wolf":"フロストウルフ","jade-triceratops":"ジェイドトリケラトプス","lunar-wyvern":"ルナーワイバーン","sunfire-tiger":"サンファイアタイガー"},
};

const COPY: Record<LanguageCode, PremiumCopy> = {
  en:{heroTitle:'Unlock the full StudyQuest experience',gemTopup:'Gem Top-Up',gemTopupBody:'Buy Gems through the same secure checkout used for Premium.',buyGems:'Buy Gems',gemPack:'Gem Pack',gemsLabel:'Gems',priceLabel:'Price',parentPurchaseNote:'For younger students, purchases should be completed with a parent or guardian.',heroBody:'Exclusive companions, premium skins, richer rewards, and a smarter AI planner — while real academic progress always comes from your effort.',subscribe:'Upgrade to Premium',benefits:'Premium benefits',exclusive:'Premium companions',aiTitle:'AI Planner usage',aiBody:'AI organizes your plan; it never decides XP, Coins, Gems, or leaderboard rank.',plan:'Choose your plan',monthly:'Premium Monthly',yearly:'Premium Yearly',month:'/ month',year:'/ year',bestValue:'Best value',upgrade:'Continue',manage:'Manage usage',premiumExclusive:'Premium collection',premiumRequired:'Premium membership is required for these companions.',aiLimit:'100 AI uses / day · 500 with Premium',moreAi:'More AI planning',languages:'Supported languages',companions:'Exclusive companions',skins:'Premium skins',rewards:'More rewards',community:'Community perks',adFree:'Ad-free experience',secure:'Secure payments',cancel:'Cancel anytime',support:'Priority support',unlocked:'Unlocked successfully.',purchaseError:'Purchase could not be completed.',signIn:'Sign in and connect online to purchase.',currencyCoins:'Coins',currencyGems:'Gems',paymentMethods:'Payment methods',secureCheckout:'Secure checkout',parentApproval:'For younger students, purchases should be completed with a parent or guardian.',premiumGift:'Premium gift: 300 Gems monthly · 800 Gems yearly',welcomeGift:'First registration: 300 Coins + 5 Gems',allCompanions:'View all companions',rarity:{Rare:'Rare',Epic:'Epic',Legendary:'Legendary',Mythic:'Mythic'},pets:NAMES.en},
  ar:{heroTitle:'افتح تجربة StudyQuest الكاملة',gemTopup:'شحن الجواهر',gemTopupBody:'اشحن الجواهر من خلال نفس بوابة الدفع الآمنة المستخدمة في Premium.',buyGems:'شحن الجواهر',gemPack:'حزمة جواهر',gemsLabel:'جوهرة',priceLabel:'السعر',parentPurchaseNote:'للطلبة الأصغر سنًا، يُفضّل إتمام المشتريات مع ولي الأمر.',heroBody:'حيوانات حصرية، مظاهر فاخرة، مكافآت أغنى، ومخطط ذكي أقوى — مع بقاء التقدم الدراسي الحقيقي قائمًا على مجهودك.',subscribe:'الترقية إلى Premium',benefits:'مزايا Premium',exclusive:'رفقاء Premium',aiTitle:'استخدام AI Planner',aiBody:'الذكاء الاصطناعي ينظم خطتك فقط؛ ولا يقرر XP أو العملات أو ترتيبك.',plan:'اختر خطتك',monthly:'Premium شهري',yearly:'Premium سنوي',month:'/ شهر',year:'/ سنة',bestValue:'الأفضل قيمة',upgrade:'متابعة',manage:'إدارة الاستخدام',premiumExclusive:'مجموعة Premium',premiumRequired:'هذه الحيوانات تتطلب اشتراك Premium.',aiLimit:'100 استخدام AI يوميًا · 500 مع Premium',moreAi:'تخطيط ذكي أكثر',languages:'اللغات المدعومة',companions:'رفقاء حصريون',skins:'مظاهر Premium',rewards:'مكافآت إضافية',community:'مزايا المجتمع',adFree:'تجربة بلا إعلانات',secure:'دفع آمن',cancel:'إلغاء في أي وقت',support:'دعم مميز',unlocked:'تم فتح العنصر بنجاح.',purchaseError:'تعذر إكمال الشراء.',signIn:'سجّل الدخول واتصل بالإنترنت للشراء.',currencyCoins:'عملات',currencyGems:'جواهر',paymentMethods:'طرق الدفع',secureCheckout:'دفع آمن',parentApproval:'للطلبة الأصغر سنًا، يُفضّل إتمام المشتريات مع ولي الأمر.',premiumGift:'هدية Premium: 300 جوهرة للشهري · 800 جوهرة للسنوي',welcomeGift:'أول تسجيل: 300 عملة + 5 جواهر هدية',allCompanions:'عرض كل الرفقاء',rarity:{Rare:'نادر',Epic:'ملحمي',Legendary:'أسطوري',Mythic:'خرافي'},pets:NAMES.ar},
  de:{heroTitle:'Schalte das volle StudyQuest-Erlebnis frei',gemTopup:'Gems aufladen',gemTopupBody:'Gems über denselben sicheren Checkout wie Premium kaufen.',buyGems:'Gems kaufen',gemPack:'Gem-Paket',gemsLabel:'Gems',priceLabel:'Preis',parentPurchaseNote:'Für jüngere Schüler sollten Käufe mit einem Elternteil oder Erziehungsberechtigten abgeschlossen werden.',heroBody:'Exklusive Begleiter, Premium-Skins, mehr Belohnungen und ein smarter KI-Planer – dein echter Lernfortschritt bleibt deine Leistung.',subscribe:'Premium freischalten',benefits:'Premium-Vorteile',exclusive:'Premium-Begleiter',aiTitle:'AI-Planner-Nutzung',aiBody:'Die KI organisiert deinen Plan; XP, Währungen und Rang werden nicht von ihr bestimmt.',plan:'Wähle deinen Tarif',monthly:'Premium monatlich',yearly:'Premium jährlich',month:'/ Monat',year:'/ Jahr',bestValue:'Bestes Angebot',upgrade:'Weiter',manage:'Nutzung verwalten',premiumExclusive:'Premium-Sammlung',premiumRequired:'Für diese Begleiter ist Premium erforderlich.',aiLimit:'100 KI-Nutzungen / Tag · 500 mit Premium',moreAi:'Mehr KI-Planung',languages:'Unterstützte Sprachen',companions:'Exklusive Begleiter',skins:'Premium-Skins',rewards:'Mehr Belohnungen',community:'Community-Vorteile',adFree:'Werbefreie Erfahrung',secure:'Sichere Zahlung',cancel:'Jederzeit kündbar',support:'Prioritäts-Support',unlocked:'Erfolgreich freigeschaltet.',purchaseError:'Kauf konnte nicht abgeschlossen werden.',signIn:'Anmelden und online verbinden, um zu kaufen.',currencyCoins:'Münzen',currencyGems:'Edelsteine',paymentMethods:'Zahlungsmethoden',secureCheckout:'Sicherer Checkout',parentApproval:'Für jüngere Schüler sollten Käufe mit einem Elternteil oder Erziehungsberechtigten abgeschlossen werden.',premiumGift:'Premium-Geschenk: 300 Gems monatlich · 800 Gems jährlich',welcomeGift:'Erste Registrierung: 300 Münzen + 5 Gems',allCompanions:'Alle Begleiter anzeigen',rarity:{Rare:'Selten',Epic:'Episch',Legendary:'Legendär',Mythic:'Mythisch'},pets:NAMES.de},
  ja:{heroTitle:'StudyQuestのすべてを解放',gemTopup:'ジェムチャージ',gemTopupBody:'Premiumと同じ安全な決済でジェムを購入できます。',buyGems:'ジェムを購入',gemPack:'ジェムパック',gemsLabel:'ジェム',priceLabel:'価格',parentPurchaseNote:'未成年の学生は、購入を保護者と一緒に行ってください。',heroBody:'限定コンパニオン、プレミアムスキン、豊富な報酬、より賢いAIプランナー。学習の成果はあなたの努力で決まります。',subscribe:'Premiumにアップグレード',benefits:'Premiumの特典',exclusive:'Premiumコンパニオン',aiTitle:'AI Plannerの利用状況',aiBody:'AIは計画を整理するだけ。XP、通貨、ランキングはAIが決めません。',plan:'プランを選択',monthly:'Premium 月額',yearly:'Premium 年額',month:'/ 月',year:'/ 年',bestValue:'おすすめ',upgrade:'続ける',manage:'利用状況',premiumExclusive:'Premiumコレクション',premiumRequired:'これらのコンパニオンにはPremium加入が必要です。',aiLimit:'AI利用 1日100回 · Premium 500回',moreAi:'AIプランニングをもっと',languages:'対応言語',companions:'限定コンパニオン',skins:'プレミアムスキン',rewards:'追加報酬',community:'コミュニティ特典',adFree:'広告なし',secure:'安全な決済',cancel:'いつでも解約',support:'優先サポート',unlocked:'正常に解放しました。',purchaseError:'購入を完了できませんでした。',signIn:'購入するにはログインしてオンライン接続してください。',currencyCoins:'コイン',currencyGems:'ジェム',paymentMethods:'支払い方法',secureCheckout:'安全な決済',parentApproval:'未成年の学生は、購入を保護者と一緒に行ってください。',premiumGift:'Premium特典：月額300ジェム · 年額800ジェム',welcomeGift:'初回登録：300コイン + 5ジェム',allCompanions:'すべての仲間を見る',rarity:{Rare:'レア',Epic:'エピック',Legendary:'レジェンド',Mythic:'ミシック'},pets:NAMES.ja},
  fr:{heroTitle:'Débloquez toute l’expérience StudyQuest',gemTopup:'Recharge de gemmes',gemTopupBody:'Achetez des gemmes via le même paiement sécurisé que Premium.',buyGems:'Acheter des gemmes',gemPack:'Pack de gemmes',gemsLabel:'Gemmes',priceLabel:'Prix',parentPurchaseNote:'Pour les jeunes élèves, les achats doivent être effectués avec un parent ou tuteur.',heroBody:'Compagnons exclusifs, skins premium, récompenses enrichies et planification IA plus intelligente — votre progression réelle vient de vos efforts.',subscribe:'Passer à Premium',benefits:'Avantages Premium',exclusive:'Compagnons Premium',aiTitle:'Utilisation de l’AI Planner',aiBody:'L’IA organise votre plan ; elle ne décide ni de vos XP, ni de vos monnaies, ni de votre rang.',plan:'Choisissez votre formule',monthly:'Premium mensuel',yearly:'Premium annuel',month:'/ mois',year:'/ an',bestValue:'Meilleure valeur',upgrade:'Continuer',manage:'Gérer l’utilisation',premiumExclusive:'Collection Premium',premiumRequired:'Un abonnement Premium est requis pour ces compagnons.',aiLimit:'100 utilisations IA / jour · 500 avec Premium',moreAi:'Plus de planification IA',languages:'Langues prises en charge',companions:'Compagnons exclusifs',skins:'Skins premium',rewards:'Plus de récompenses',community:'Avantages communauté',adFree:'Sans publicité',secure:'Paiement sécurisé',cancel:'Annulation à tout moment',support:'Support prioritaire',unlocked:'Débloqué avec succès.',purchaseError:'Impossible de terminer l’achat.',signIn:'Connectez-vous et passez en ligne pour acheter.',currencyCoins:'Pièces',currencyGems:'Gemmes',paymentMethods:'Modes de paiement',secureCheckout:'Paiement sécurisé',parentApproval:'Pour les jeunes élèves, les achats doivent être effectués avec un parent ou tuteur.',premiumGift:'Cadeau Premium : 300 gemmes mensuelles · 800 gemmes annuelles',welcomeGift:'Première inscription : 300 pièces + 5 gemmes',allCompanions:'Voir tous les compagnons',rarity:{Rare:'Rare',Epic:'Épique',Legendary:'Légendaire',Mythic:'Mythique'},pets:NAMES.fr},
};

const PREMIUM_PET_IDS = ['frost-dragon','starlight-unicorn','solar-tiger','magma-trex','storm-eagle','shadow-wolf','frost-raptor','void-dragon','crimson-kitsune','jade-griffin','snow-leopard','chrono-dragon','crystal-dragon','ember-raptor','azure-drake','crimson-phoenix','storm-griffin','frost-wolf','jade-triceratops','lunar-wyvern','sunfire-tiger'];
const PREMIUM_PETS = PREMIUM_PET_IDS.map((id) => PET_CATALOG.find((pet) => pet.id === id)).filter(Boolean) as typeof PET_CATALOG;

type PaymentMethodId = 'cards' | 'apple_pay' | 'google_pay' | 'wallets';
const PAYMENT_METHODS: Array<[PaymentMethodId, string, typeof CreditCard]> = [
  ['cards', 'Visa / Mastercard / Amex', CreditCard],
  ['apple_pay', 'Apple Pay', WalletCards],
  ['google_pay', 'Google Pay', WalletCards],
  ['wallets', 'Mobile Wallets', Globe2],
];
const CHECKOUT_METHODS: Array<[PaymentMethodId, string]> = PAYMENT_METHODS.map(([id, label]) => [id, label]);
const displayMonthlyPrice = String(import.meta.env.VITE_PREMIUM_MONTHLY_DISPLAY_EGP ?? '').trim();
const displayYearlyPrice = String(import.meta.env.VITE_PREMIUM_YEARLY_DISPLAY_EGP ?? '').trim();

const GEM_PACKS = [
  { id: 'gems_120', gems: 120, display: String(import.meta.env.VITE_GEMS_PACK_120_DISPLAY_EGP ?? '49').trim() },
  { id: 'gems_300', gems: 300, display: String(import.meta.env.VITE_GEMS_PACK_300_DISPLAY_EGP ?? '99').trim() },
  { id: 'gems_700', gems: 700, display: String(import.meta.env.VITE_GEMS_PACK_700_DISPLAY_EGP ?? '199').trim() },
  { id: 'gems_1600', gems: 1600, display: String(import.meta.env.VITE_GEMS_PACK_1600_DISPLAY_EGP ?? '399').trim() },
] as const;
type GemPackId = typeof GEM_PACKS[number]['id'];
const formatEgp = (value: string) => value ? `EGP ${value}` : 'EGP —';
const BENEFIT_ITEMS: Array<[typeof Crown, string]> = [
  [Crown, 'companions'],
  [Sparkles, 'skins'],
  [Star, 'rewards'],
  [ShieldCheck, 'adFree'],
];

export default function PremiumPage({ language }: Props) {
  const c = COPY[language];
  const { user } = useAuth();
  const [offset,setOffset]=useState(0);
  const [notice,setNotice]=useState('');
  const [paymentOpen,setPaymentOpen]=useState(false);
  const [method,setMethod]=useState<PaymentMethodId>('cards');
  const [plan,setPlan]=useState<'monthly'|'yearly'>('monthly');
  const [phone,setPhone]=useState('');
  const [checkoutLoading,setCheckoutLoading]=useState(false);
  const [aiUsed,setAiUsed]=useState(0);
  const [aiLimit,setAiLimit]=useState(100);
  const [premiumActive,setPremiumActive]=useState(false);
  const [catalogPets,setCatalogPets]=useState<CloudPetDefinition[]>([]);
  useEffect(() => { let cancelled=false; loadPetCatalog().then(items=>{ if(!cancelled) setCatalogPets(items.filter(p=>p.premiumOnly)); }).catch(()=>undefined); return ()=>{cancelled=true}; }, [user?.id]);
  useEffect(() => {
    if (!isSupabaseConfigured || !user) { setAiUsed(0); setAiLimit(100); setPremiumActive(false); return; }
    let cancelled = false;
    (async () => {
      const [{ data: entitlement }, { data: usage }] = await Promise.all([
        supabase.from('premium_entitlements').select('status,current_period_end').eq('user_id', user.id).maybeSingle(),
        supabase.from('study_assistant_usage').select('request_count').eq('user_id', user.id).eq('usage_date', new Date().toISOString().slice(0,10)).maybeSingle(),
      ]);
      if (cancelled) return;
      const premium = entitlement?.status === 'active' && (!entitlement.current_period_end || new Date(entitlement.current_period_end).getTime() > Date.now());
      setPremiumActive(premium);
      setAiLimit(premium ? 500 : 100);
      setAiUsed(Number(usage?.request_count ?? 0));
    })().catch(() => undefined);
    return () => { cancelled = true; };
  }, [user?.id]);
  const premiumPets: CloudPetDefinition[] = catalogPets.length ? catalogPets : PREMIUM_PETS.map(p=>({...p,premiumOnly:true}));
  const visible=useMemo(()=>Array.from({length:Math.min(6,premiumPets.length)},(_,i)=>premiumPets[(offset+i)%premiumPets.length]).filter(Boolean),[offset,premiumPets]);
  const buyPet=async(id:string, currency:'coins'|'gems')=>{
    const pet=catalogPets.find(x=>x.id===id) ?? PET_CATALOG.find(x=>x.id===id); if(!pet) return;
    if (PREMIUM_PET_IDS.includes(id) && !premiumActive) { setNotice(c.premiumRequired); return; }
    try { await profileStore.purchase('pet',id,currency); const name = c.pets[id] ?? pet.name; setNotice(c.unlocked); announceCommerce(language, 'pet', name); window.dispatchEvent(new CustomEvent('studyquest:economy-updated')); }
    catch(error){ setNotice(error instanceof Error && error.message==='online_account_required'?c.signIn:c.purchaseError); }
  };
  const openCheckout=(selectedPlan:'monthly'|'yearly'='monthly')=>{ setPlan(selectedPlan); setNotice(''); setPaymentOpen(true); };

  useEffect(() => {
    if (!isSupabaseConfigured || !user || typeof window === 'undefined') return undefined;
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'complete') return undefined;
    const orderRef = params.get('order');
    let cancelled = false;
    (async () => {
      try {
        let query = supabase.from('payment_orders').select('status, plan, merchant_reference').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
        if (orderRef) query = query.eq('merchant_reference', orderRef);
        const { data } = await query.maybeSingle();
        if (cancelled) return;
        if (data?.status === 'paid') {
          if (String(data.plan || '').startsWith('gems_')) {
            const pack = GEM_PACKS.find(x => x.id === data.plan);
            setNotice(language === 'ar' ? `تم شحن ${pack?.gems ?? 0} جوهرة بنجاح.` : `Gems charged successfully: +${pack?.gems ?? 0}.`);
            if (pack) announceCommerce(language, 'gems', pack.gems);
            window.dispatchEvent(new CustomEvent('studyquest:economy-updated'));
          } else {
            setNotice(language === 'ar' ? 'تم تأكيد الدفع وتفعيل Premium.' : 'Payment confirmed. Premium is now active.');
            announceCommerce(language, 'premium');
          }
        }
        else if (data?.status === 'pending') setNotice(language === 'ar' ? 'تم استلام الدفع، وجارٍ تأكيده.' : 'Payment received and is being confirmed.');
        else setNotice(c.purchaseError);
      } catch {
        if (!cancelled) setNotice(c.purchaseError);
      } finally {
        const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
        window.history.replaceState({}, '', cleanUrl);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, language, c.purchaseError]);

  const startGemCheckout=async(packId: GemPackId)=>{
    if(!isSupabaseConfigured){ setNotice(language==='ar'?'الحساب السحابي غير متصل بعد.':'Cloud account is not connected yet.'); return; }
    if(!user){ setNotice(c.signIn); return; }
    if(!phone.trim()){ setNotice(language==='ar'?'أدخل رقم الهاتف ثم اضغط شحن الجواهر مرة أخرى.':'Enter your phone number, then press Buy Gems again.'); return; }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-paymob-gem-checkout', { body: { pack: packId, phone: phone.trim(), payment_method: method } });
      if(error) throw error;
      if(!data?.checkoutUrl) throw new Error(String(data?.error || 'checkout_url_missing'));
      window.location.assign(data.checkoutUrl);
    } catch(error) {
      const raw = error instanceof Error ? error.message : '';
      const friendly = /not_authenticated/i.test(raw) ? c.signIn : /payment_not_configured|gem_price_not_configured/i.test(raw) ? (language==='ar'?'شحن الجواهر لم يتم تفعيله على الحساب السحابي بعد.':'Gem top-up payments are not configured on the cloud account yet.') : c.purchaseError;
      setNotice(friendly);
    } finally { setCheckoutLoading(false); }
  };

  const startCheckout=async()=>{
    if(!isSupabaseConfigured){ setNotice(language==='ar'?'الحساب السحابي غير متصل بعد.':'Cloud account is not connected yet.'); return; }
    if(!user){ setPaymentOpen(false); setNotice(c.signIn); return; }
    if(!phone.trim()){ setNotice(language==='ar'?'أدخل رقم الهاتف لإتمام الدفع.':'Enter your phone number to continue.'); return; }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-paymob-checkout', { body: { plan, phone: phone.trim(), payment_method: method } });
      if(error) throw error;
      if(!data?.checkoutUrl) throw new Error(String(data?.error || 'checkout_url_missing'));
      window.location.assign(data.checkoutUrl);
    } catch(error) {
      const raw = error instanceof Error ? error.message : '';
      const friendly = /not_authenticated/i.test(raw) ? c.signIn : /payment_not_configured|premium_price_not_configured/i.test(raw) ? (language==='ar'?'الدفع لم يتم تفعيله على الحساب السحابي بعد.':'Payments are not configured on the cloud account yet.') : c.purchaseError;
      setNotice(friendly);
    } finally { setCheckoutLoading(false); }
  };
  return <div className="premium-page flex flex-col gap-6 animate-fade-in pb-8">
    <section className="relative overflow-hidden rounded-[2rem] sq-shell-card premium-hero min-h-[390px]">
      <div className="absolute inset-0 premium-hero-backdrop" />
      <div className="absolute inset-y-0 right-0 w-[48%] premium-hero-art-wrap"><img src="/pets/premium-hero.png" alt="" className="premium-hero-art" /></div>
      <div className="relative z-10 p-6 md:p-9 lg:p-11 max-w-[66%]">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full premium-gold-chip text-xs font-black"><Crown className="w-4 h-4"/> Premium World</div>
        <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight text-[var(--sq-heading)] leading-tight">{c.heroTitle}</h1>
        <p className="mt-4 max-w-2xl text-sm md:text-base text-[var(--sq-muted-strong)] leading-7">{c.heroBody}</p>
        <button type="button" onClick={()=>openCheckout()} className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl premium-cta font-black"><Crown className="w-5 h-5"/>{c.subscribe}<Zap className="w-4 h-4"/></button>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-2 max-w-3xl">{[[Crown,c.companions],[Sparkles,c.skins],[Star,c.rewards],[Bot,'AI Planner']].map(([I,t],i)=>{const Icon=I as typeof Crown; return <div key={i} className="premium-mini-pill"><Icon className="w-4 h-4"/><span>{t as string}</span></div>})}</div>
      </div>
    </section>

    <section className="flex flex-col gap-5 w-full">
      <div className="rounded-3xl sq-shell-card p-5 md:p-6"><div className="flex items-center justify-between gap-4 mb-5"><div><p className="text-xs uppercase tracking-[.22em] text-neon-cyan font-bold">Premium</p><h2 className="text-xl md:text-2xl font-black text-[var(--sq-heading)] mt-1">{c.benefits}</h2></div><Crown className="w-7 h-7 text-neon-amber"/></div><div className="grid sm:grid-cols-2 gap-3">{BENEFIT_ITEMS.map(([Icon,key],i)=>{const title=c[key as keyof PremiumCopy] as string;return <div key={i} className="premium-benefit"><Icon className="w-5 h-5 text-neon-cyan shrink-0"/><div><h3 className="font-bold text-sm text-[var(--sq-heading)]">{title}</h3><p className="text-xs text-[var(--sq-muted)] mt-1 leading-5">{c.heroBody}</p></div><Check className="w-4 h-4 text-neon-emerald shrink-0"/></div>})}</div></div>
    <div className="premium-plan rounded-3xl p-5 md:p-6"><div className="flex items-center gap-2 text-neon-amber font-bold"><Crown className="w-5 h-5"/>{c.plan}</div><div className="grid grid-cols-2 gap-3 mt-4"><div className="premium-price-card"><div className="text-xs font-bold">{c.monthly}</div><div className="mt-2 text-2xl font-black">{formatEgp(displayMonthlyPrice)}</div><span>{c.month}</span><button onClick={()=>openCheckout('monthly')}>{c.upgrade}</button></div><div className="premium-price-card featured"><div className="text-xs font-bold">{c.yearly}</div><div className="mt-2 text-2xl font-black">{formatEgp(displayYearlyPrice)}</div><span>{c.year}</span><button onClick={()=>openCheckout('yearly')}>{c.upgrade}</button><b>{c.bestValue}</b></div></div><div className="mt-4 space-y-2 text-xs text-[var(--sq-muted-strong)]"><div className="flex gap-2 font-black text-neon-cyan"><Gem className="w-4 h-4 shrink-0"/>{c.premiumGift}</div><div className="flex gap-2 font-bold text-[var(--sq-heading)]"><Sparkles className="w-4 h-4 shrink-0 text-neon-amber"/>{c.welcomeGift}</div>{[c.companions,c.skins,c.aiLimit,c.adFree].map(x=><div key={x} className="flex gap-2"><Check className="w-4 h-4 text-neon-emerald shrink-0"/>{x}</div>)}</div><div className="mt-5 flex items-center gap-2 text-[11px] text-[var(--sq-muted)]"><ShieldCheck className="w-4 h-4"/>{c.secure} · {c.cancel} · {c.support}</div></div>

    <section className="rounded-3xl sq-shell-card p-5 md:p-6">
      <div className="flex items-center justify-between gap-4 mb-2"><div><div className="flex items-center gap-2 text-neon-cyan font-bold"><WalletCards className="w-5 h-5"/><span className="text-xs uppercase tracking-[.2em]">{c.gemTopup}</span></div><h2 className="text-xl md:text-2xl font-black text-[var(--sq-heading)] mt-1">{c.buyGems}</h2><p className="text-xs text-[var(--sq-muted)] mt-1">{c.gemTopupBody}</p></div><Gem className="w-8 h-8 text-neon-cyan"/></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">{GEM_PACKS.map(pack=><article key={pack.id} className="premium-price-card"><div className="text-xs font-bold">{c.gemPack}</div><div className="mt-2 text-2xl font-black flex items-center gap-2">{pack.gems.toLocaleString()} <Gem className="w-5 h-5 text-neon-cyan"/></div><div className="mt-1 text-xs text-[var(--sq-muted)]">{c.priceLabel}: {pack.display} EGP</div><button type="button" onClick={()=>startGemCheckout(pack.id)} disabled={checkoutLoading} className="mt-3 w-full rounded-xl premium-secondary py-2 text-xs font-black disabled:opacity-60">{c.buyGems}</button></article>)}</div>
      <p className="mt-4 text-[11px] text-[var(--sq-muted)]">{c.parentPurchaseNote}</p>
    </section>
    </section>

    <section className="rounded-3xl sq-shell-card p-5 md:p-6 premium-ai-card"><div className="flex items-start gap-4"><div className="premium-icon-box"><Bot className="w-7 h-7"/></div><div className="min-w-0 flex-1"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div><p className="text-xs uppercase tracking-[.22em] text-violet-300 font-bold">AI Planner</p><h2 className="text-xl font-black text-[var(--sq-heading)] mt-1">{c.aiTitle}</h2><p className="text-xs text-[var(--sq-muted)] mt-1">{c.aiBody}</p></div><div className="text-sm font-black text-[var(--sq-heading)]">{aiUsed} / {aiLimit}</div></div><div className="mt-4 h-3 rounded-full bg-black/10 dark:bg-white/5 overflow-hidden border border-black/10 dark:border-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-cyan-400" style={{width:`${aiUsed/aiLimit*100}%`}}/></div><div className="mt-3 flex flex-wrap items-center gap-3"><span className="premium-tag">{c.aiLimit}</span><span className="text-xs text-[var(--sq-muted)]">{c.moreAi}</span><button type="button" onClick={()=>setNotice(c.manage)} className="md:ml-auto px-4 py-2 rounded-xl premium-secondary text-xs font-bold">{c.manage}</button></div></div></div></section>

    <section className="rounded-3xl sq-shell-card p-5 md:p-6 overflow-hidden"><div className="flex items-center justify-between gap-3 mb-5"><div><div className="flex items-center gap-2 text-amber-200"><Crown className="w-5 h-5"/><span className="text-xs uppercase tracking-[.2em] font-bold">{c.exclusive}</span></div><h2 className="text-xl md:text-2xl font-black text-[var(--sq-heading)] mt-1">{c.exclusive}</h2></div><div className="flex gap-2"><button type="button" aria-label="Previous" onClick={()=>setOffset(x=>(x-1+premiumPets.length)%premiumPets.length)} className="premium-arrow"><ChevronLeft className="w-4 h-4"/></button><button type="button" aria-label="Next" onClick={()=>setOffset(x=>(x+1)%premiumPets.length)} className="premium-arrow"><ChevronRight className="w-4 h-4"/></button></div></div><div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">{visible.map((pet)=>{const visual=getPetVisual(pet.id);return <article key={pet.id} className={`premium-pet-card ${'premium-3d-pet'}`} style={{background:`radial-gradient(circle at 50% 20%, ${visual.accent}18, transparent 46%), linear-gradient(145deg, rgba(20,35,60,.9), rgba(4,12,24,.96))`}}><div className="premium-pet-art"><img src={pet.imageUrl || visual.asset} alt={c.pets[pet.id]??pet.name} style={{filter:visual.filter}}/></div><div className="premium-pet-meta"><span className="premium-rarity" style={{color:visual.accent}}>{c.rarity[pet.rarity]}</span><h3>{c.pets[pet.id]??pet.name}</h3><span className="premium-exclusive-badge"><Crown className="w-3 h-3"/>{c.premiumExclusive}</span><div className="grid grid-cols-2 gap-2">{pet.coinPrice>0 && <button type="button" onClick={()=>buyPet(pet.id,'coins')} disabled={!premiumActive} title={!premiumActive ? c.premiumRequired : undefined} className="premium-buy disabled:opacity-60 text-[11px]"><Sparkles className="w-3.5 h-3.5"/>{pet.coinPrice.toLocaleString()} <span>{c.currencyCoins}</span></button>}{pet.gemPrice>0 && <button type="button" onClick={()=>buyPet(pet.id,'gems')} disabled={!premiumActive} title={!premiumActive ? c.premiumRequired : undefined} className="premium-buy disabled:opacity-60 text-[11px]"><Gem className="w-3.5 h-3.5"/>{pet.gemPrice.toLocaleString()} <span>{c.currencyGems}</span></button>}</div></div></article>})}</div></section>

    <section className="rounded-3xl sq-shell-card p-5 md:p-6"><div className="flex items-center gap-3 mb-4"><CreditCard className="w-5 h-5 text-neon-cyan"/><h2 className="text-lg font-black text-[var(--sq-heading)]">{c.paymentMethods}</h2></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{PAYMENT_METHODS.map(([id,label,Icon])=>{const active=method===id;return <button type="button" key={id} onClick={()=>setMethod(id)} className={`payment-method-card ${active?'active':''}`}><Icon className="w-5 h-5"/><span>{label}</span></button>})}</div><div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--sq-muted)]"><span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4"/>{c.secureCheckout}</span><span>{c.parentApproval}</span></div></section>

    <div className="flex flex-wrap justify-center gap-4 text-xs text-[var(--sq-muted)]"><span className="flex items-center gap-1"><Globe2 className="w-4 h-4"/>{c.languages}: English · العربية · Deutsch · 日本語 · Français</span></div>
    {notice && <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90] rounded-2xl px-5 py-3 glass border border-cyan-300/20 text-sm text-[var(--sq-heading)] shadow-2xl">{notice}</div>}
    {paymentOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-md p-4"><div className="w-full max-w-lg rounded-3xl sq-shell-card border border-cyan-300/20 p-6 relative"><button type="button" onClick={()=>setPaymentOpen(false)} className="absolute top-4 right-4 p-2 rounded-xl border border-white/10 text-[var(--sq-muted)]"><X className="w-4 h-4"/></button><div className="flex items-center gap-3"><Crown className="w-6 h-6 text-neon-amber"/><div><h3 className="text-xl font-black text-[var(--sq-heading)]">{c.plan}</h3><p className="text-xs text-[var(--sq-muted)] mt-1">{c.secureCheckout}</p></div></div><label className="mt-5 block text-xs font-bold text-[var(--sq-muted-strong)]">{({ar:'رقم الهاتف',en:'Phone number',de:'Telefonnummer',ja:'電話番号',fr:'Numéro de téléphone'} as Record<LanguageCode,string>)[language]}<input value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" placeholder="+2010..." className="mt-2 w-full rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-[var(--sq-heading)] outline-none focus:border-cyan-300/40" /></label><div className="mt-6 grid grid-cols-2 gap-3">{CHECKOUT_METHODS.map(([id,label])=><button key={id} type="button" onClick={()=>setMethod(id)} className={`payment-method-card ${method===id?'active':''}`}>{label}</button>)}</div><button type="button" disabled={checkoutLoading} onClick={startCheckout} className="mt-5 w-full premium-cta rounded-2xl py-3 font-black disabled:opacity-60">{checkoutLoading ? '...' : c.upgrade}</button><p className="mt-3 text-[11px] leading-5 text-[var(--sq-muted)]">{c.parentApproval}</p></div></div>}
  </div>;
}



