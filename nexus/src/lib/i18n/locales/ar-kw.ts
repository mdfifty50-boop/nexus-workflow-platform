/**
 * Kuwait-Specific Arabic Dialect Translations for Nexus
 *
 * This file contains Kuwaiti Arabic dialect overrides.
 * It extends the base Arabic (MSA) translations with regional variations.
 *
 * The Kuwaiti dialect has unique:
 * - Greetings and expressions
 * - Local business terminology
 * - Government service names
 * - Informal conversational phrases
 */

import type { TranslationResource } from '../types';
import ar from './ar';

/**
 * Deep merge utility to combine base Arabic with Kuwaiti overrides
 */
const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T => {
  const result = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }
  return result;
};

/**
 * Kuwait-specific dialect overrides
 */
const kuwaitiOverrides: Partial<TranslationResource> = {
  // App branding - localized for Kuwait
  app: {
    name: 'نيكسوس',
    tagline: 'أتمتة شغلك بالذكاء الاصطناعي',
    description: 'منصة أتمتة متكاملة تربط تطبيقاتك وتخلص شغلك أوتوماتيك',
  },

  // Common - Kuwaiti dialect variations
  common: {
    // Action buttons - informal Kuwaiti style
    submit: 'رسّل',
    cancel: 'كنسل',
    create: 'سوّي',
    delete: 'امسح',
    save: 'سيف',
    edit: 'عدّل',
    execute: 'شغّل',
    run: 'شغّل',
    stop: 'وقّف',
    pause: 'وقّف شوي',
    resume: 'كمّل',
    close: 'سكّر',
    back: 'ارجع',
    next: 'التالي',
    previous: 'اللي قبل',
    confirm: 'أكّد',
    done: 'خلص',
    yes: 'إي',
    no: 'لا',
    ok: 'أوكي',
    apply: 'طبّق',
    continue: 'كمّل',
    skip: 'خلّ عنك',
    retry: 'حاول مرة ثانية',

    // Loading states - conversational
    loading: 'لحظة...',
    saving: 'يحفظ...',
    processing: 'شغّال عليه...',
    deleting: 'يمسح...',
    updating: 'يحدّث...',
    connecting: 'يتصل...',

    // View actions
    more: 'زيادة',
    less: 'أقل',
    viewAll: 'شوف الكل',
    seeMore: 'شوف زيادة',
    showLess: 'أقل شوي',

    // CTA labels - Kuwaiti style
    getStarted: 'يلا ابدأ',
    learnMore: 'اعرف أكثر',
    tryNow: 'جربه الحين',
    startTrial: 'ابدأ التجربة',
    upgrade: 'أبجريد',
    contactUs: 'كلمنا',

    // Status badges
    soon: 'ياي قريب',

    // Form labels - Kuwaiti style
    name: 'الاسم',
    description: 'الوصف',
    optional: 'اختياري',
    required: 'لازم',
  },

  // Authentication - Kuwaiti style
  auth: {
    signIn: 'ادخل',
    signOut: 'اطلع',
    signUp: 'سجّل',
    login: 'دشّ',
    logout: 'طلّع',
    register: 'سجّل حساب',
    forgotPassword: 'نسيت الباسوورد؟',
    resetPassword: 'غيّر الباسوورد',
    email: 'الإيميل',
    password: 'الباسوورد',
    confirmPassword: 'أكّد الباسوورد',
    rememberMe: 'خلني داخل',
    user: 'اليوزر',
    createAccount: 'سوّي حساب يديد',
    alreadyHaveAccount: 'عندك حساب؟',
    dontHaveAccount: 'ما عندك حساب؟',
    welcomeBack: 'هلا والله',
    signInToContinue: 'دش عشان تكمل',
    joinNexus: 'انضم لنيكسوس',
    startFreeToday: 'ابدأ ببلاش اليوم',
  },

  // Error messages - Kuwaiti conversational style
  errors: {
    general: 'صار شي غلط. حاول مرة ثانية.',
    unexpected: 'صار خطأ غريب.',
    network: 'في مشكلة بالنت. تأكد من اتصالك.',
    networkOffline: 'ما في نت.',
    unauthorized: 'ما تقدر تسوي هالشي.',
    forbidden: 'ممنوع تدخل هني.',
    notFound: 'ما لقيناه.',
    pageNotFound: 'الصفحة مب موجودة.',
    validation: 'تأكد من المعلومات وحاول مرة ثانية.',
    timeout: 'خلص الوقت. حاول مرة ثانية.',
    serverError: 'في مشكلة بالسيرفر. حاول بعدين.',
    serviceUnavailable: 'الخدمة مب شغالة الحين.',

    // Form validation - conversational
    required: 'هالخانة لازم تعبيها.',
    invalidEmail: 'الإيميل مب صحيح.',
    invalidPhone: 'رقم التلفون مب صحيح.',
    passwordMismatch: 'الباسووردات مب متطابقين.',
    passwordTooWeak: 'الباسوورد ضعيف واجد.',
    tooShort: 'قصير واجد.',
    tooLong: 'طويل واجد.',

    // Operation errors
    loadingFailed: 'ما قدرنا نحمّل البيانات.',
    saveFailed: 'ما قدرنا نحفظ.',
    deleteFailed: 'ما قدرنا نمسح.',
    connectionFailed: 'ما قدرنا نتصل بالخدمة.',
    sessionExpired: 'انتهت الجلسة. دش مرة ثانية.',
  },

  // Success messages - Kuwaiti style
  success: {
    saved: 'تم الحفظ!',
    created: 'تم!',
    deleted: 'انمسح!',
    updated: 'تحدّث!',
    copied: 'انسخ!',
    executed: 'اشتغل!',
    completed: 'خلص!',
    connected: 'اتصل!',
    disconnected: 'انفصل!',
    sent: 'انرسل!',
    loggedIn: 'دخلت!',
    loggedOut: 'طلعت!',
  },

  // Workflow - Kuwaiti terminology
  workflow: {
    title: 'سير العمل',
    titlePlural: 'سير العمل',
    create: 'سوّي سير عمل',
    edit: 'عدّل سير العمل',
    delete: 'امسح سير العمل',
    duplicate: 'انسخ سير العمل',
    execute: 'شغّل سير العمل',
    test: 'جرّب سير العمل',

    // Status - conversational
    running: 'شغّال...',
    completed: 'خلص',
    failed: 'ما اشتغل',
    pending: 'ينتظر',
    paused: 'واقف',
    cancelled: 'انكنسل',
    scheduled: 'مجدول',
    queued: 'بالدور',

    // Properties
    name: 'اسم سير العمل',
    description: 'شنو يسوي',
    trigger: 'المحفّز',
    action: 'الأكشن',

    // Empty states
    noWorkflows: 'ما في سير عمل. سوّي واحد يديد!',

    // Builder - conversational
    builder: {
      title: 'منشئ سير العمل',
      addNode: 'زيد عقدة',
      addTrigger: 'زيد محفّز',
      addAction: 'زيد أكشن',
      addCondition: 'زيد شرط',
      testWorkflow: 'جرّب',
      saveWorkflow: 'سيف',
      publishWorkflow: 'انشر',
      dragToConnect: 'اسحب عشان تربط',
      dropHere: 'حطه هني',
    },
  },

  // Dashboard - Kuwaiti style
  dashboard: {
    title: 'لوحة التحكم',
    welcome: 'هلا والله',
    welcomeUser: 'هلا {{name}}',
    welcomeMessage: 'هذا ملخص شغلك اليوم',
    overview: 'نظرة عامة',
    recentActivity: 'شنو صار أخيراً',
    quickActions: 'أكشنات سريعة',
    stats: 'الإحصائيات',

    // Stats
    timeSaved: 'الوقت اللي وفّرته',
    workflowsRun: 'سير العمل اللي اشتغل',
    tasksAutomated: 'المهام اللي تأتمتت',
    activeIntegrations: 'التطبيقات المتصلة',

    // Time periods
    today: 'اليوم',
    thisWeek: 'هالأسبوع',
    thisMonth: 'هالشهر',

    // Cards - conversational
    createFirst: 'سوّي أول سير عمل',
    createFirstDesc: 'ابدأ أتمتة شغلك اليومي',
    connectApps: 'اربط تطبيقاتك',
    connectAppsDesc: 'اربط التطبيقات اللي تستخدمها كل يوم',
    exploreTemplates: 'شوف القوالب',
    exploreTemplatesDesc: 'ابدأ بقوالب جاهزة',
  },

  // Kuwaiti-specific greetings and expressions
  kuwaiti: {
    greetings: {
      hello: 'هلا',
      helloFormal: 'السلام عليكم',
      welcome: 'حياك الله',
      welcomeBack: 'هلا والله رجعت',
      howAreYou: 'شلونك؟',
      howAreYouFormal: 'كيف حالك؟',
      fine: 'زين',
      fineAlhamdulillah: 'زين الحمدلله',
      thanks: 'مشكور',
      thanksALot: 'يعطيك العافية',
      goodbye: 'في أمان الله',
      goodbyeCasual: 'باي',
      seeYou: 'أشوفك',
      goodMorning: 'صباح الخير',
      goodMorningResponse: 'صباح النور',
      goodEvening: 'مساء الخير',
      goodEveningResponse: 'مساء النور',
      goodNight: 'تصبح على خير',
      blessed: 'مبارك',
      congratulations: 'مبروك',
      congratulationsResponse: 'الله يبارك فيك',
    },

    // Common conversational phrases
    expressions: {
      yes: 'إي',
      no: 'لا',
      ok: 'أوكي',
      good: 'زين',
      great: 'حلو',
      bad: 'مب زين',
      notGood: 'مو زين',
      now: 'الحين',
      later: 'بعدين',
      quickly: 'بسرعة',
      wait: 'صبر',
      waitAMoment: 'صبر شوي',
      done: 'خلص',
      finished: 'خلصنا',
      understand: 'فاهم',
      understood: 'فهمت عليك',
      want: 'أبي',
      dontWant: 'ما أبي',
      need: 'محتاج',
      dontNeed: 'مب محتاج',
      what: 'شنو',
      why: 'ليش',
      where: 'وين',
      when: 'متى',
      how: 'شلون',
      who: 'منو',
      which: 'أي واحد',
      maybe: 'يمكن',
      ofCourse: 'أكيد',
      noWorries: 'لا تشيل هم',
      noProblem: 'عادي',
      letMeSee: 'خلني أشوف',
      honestly: 'بصراحة',
      really: 'صج',
      exactly: 'بالضبط',
    },

    // Workflow-related conversational phrases
    workflow: {
      createNew: 'أبي أسوي سير عمل يديد',
      sendEmail: 'رسّل إيميل',
      sendWhatsApp: 'رسّل واتساب',
      sendMessage: 'رسّل مسج',
      everyday: 'كل يوم',
      everyWeek: 'كل أسبوع',
      everyMonth: 'كل شهر',
      morning: 'الصبح',
      evening: 'المسا',
      reminder: 'ذكّرني',
      notifyMe: 'خبّرني',
      whenDone: 'لما يخلص',
      automatically: 'أوتوماتيك',
    },

    // AI assistant responses in Kuwaiti
    responses: {
      understood: 'تمام، فهمت عليك',
      working: 'شغّال عليه الحين',
      done: 'خلص، تم الموضوع',
      error: 'صار في مشكلة، خلني أحاول مرة ثانية',
      confirm: 'أكيد تبي أسوي كذا؟',
      askAgain: 'ممكن تعيد السؤال؟',
      processing: 'جاري العمل عليه...',
      almostDone: 'باقي شوي وخلص',
      success: 'تمام! كل شي اشتغل زين',
      failed: 'ما قدرت أخلصه، نحاول مرة ثانية؟',
      needMoreInfo: 'احتاج معلومات أكثر',
      whatDoYouWant: 'شنو تبي أسوي لك؟',
      howCanIHelp: 'شلون أقدر أساعدك؟',
      anythingElse: 'في شي ثاني؟',
      youreWelcome: 'العفو',
      noWorries: 'لا تشيل هم',
    },

    // Kuwait government services terminology
    government: {
      civilId: 'البطاقة المدنية',
      civilIdNumber: 'رقم البطاقة المدنية',
      passport: 'الجواز',
      residency: 'الإقامة',
      workPermit: 'إذن العمل',
      drivingLicense: 'رخصة القيادة',
      municipality: 'البلدية',
      ministry: 'الوزارة',
      ministryOfInterior: 'وزارة الداخلية',
      ministryOfHealth: 'وزارة الصحة',
      ministryOfEducation: 'وزارة التربية',
      sahel: 'سهل', // Government services app
      kuwaitMobile: 'كويت موبايل',
      paci: 'هيئة المعلومات المدنية',
      customs: 'الجمارك',
      immigration: 'الجوازات',
    },

    // Local business terms
    business: {
      kd: 'دينار كويتي',
      kdAbbrev: 'د.ك',
      fils: 'فلس',
      commercialRegistration: 'السجل التجاري',
      tradeLicense: 'الرخصة التجارية',
      chamber: 'غرفة التجارة',
      bank: 'البنك',
      nbk: 'بنك الكويت الوطني',
      kfh: 'بيت التمويل الكويتي',
      burgan: 'بنك برقان',
      gulf: 'بنك الخليج',
      boubyan: 'بنك بوبيان',
      invoice: 'الفاتورة',
      receipt: 'الوصل',
      contract: 'العقد',
      quotation: 'العرض',
      salary: 'الراتب',
      payment: 'الدفع',
      transfer: 'التحويل',
      cash: 'كاش',
      knet: 'كي-نت',
    },

    // Location-related
    locations: {
      kuwait: 'الكويت',
      kuwaitCity: 'مدينة الكويت',
      salmiya: 'السالمية',
      hawally: 'حولي',
      farwaniya: 'الفروانية',
      jahra: 'الجهراء',
      ahmadi: 'الأحمدي',
      mubarak: 'مبارك الكبير',
      capital: 'العاصمة',
      area: 'المنطقة',
      block: 'القطعة',
      street: 'الشارع',
      building: 'العمارة',
      floor: 'الدور',
      apartment: 'الشقة',
    },
  },

  // Time - Kuwaiti casual style
  time: {
    justNow: 'الحين',
    ago: 'من',
    today: 'اليوم',
    yesterday: 'أمس',
    tomorrow: 'باجر',
    thisWeek: 'هالأسبوع',
    lastWeek: 'الأسبوع اللي طاف',
    nextWeek: 'الأسبوع الياي',
    thisMonth: 'هالشهر',
    lastMonth: 'الشهر اللي طاف',
    nextMonth: 'الشهر الياي',
    morning: 'الصبح',
    afternoon: 'الظهر',
    evening: 'المسا',
    night: 'الليل',
  },

  // Settings - Kuwaiti style
  settings: {
    title: 'الإعدادات',
    subtitle: 'غيّر حسابك وتفضيلاتك',
    profile: 'الملف الشخصي',
    account: 'الحساب',
    notifications: 'التنبيهات',
    security: 'الأمان',
    language: 'اللغة',
    saveChanges: 'سيف التغييرات',
    saving: 'يحفظ...',
    saved: 'انحفظ!',

    languageSettings: {
      title: 'اللغة والمنطقة',
      appLanguage: 'لغة التطبيق',
      appLanguageDesc: 'اختار اللغة اللي تحبها',
      currentLanguage: 'اللغة الحالية',
      selectLanguage: 'اختار اللغة',
      useEasternNumerals: 'استخدم الأرقام العربية',
      calendar: 'التقويم',
      gregorian: 'ميلادي',
      hijri: 'هجري',
    },
  },
};

/**
 * Kuwaiti Arabic translations
 * Merges base Arabic with Kuwaiti dialect overrides
 */
const arKw: TranslationResource = deepMerge(ar, kuwaitiOverrides);

export default arKw;

/**
 * Export Kuwaiti-specific phrases separately for easy access
 */
export const kuwaitiPhrases = kuwaitiOverrides.kuwaiti;
