/**
 * Arabic (Standard) Translations for Nexus
 *
 * This file contains Modern Standard Arabic (MSA) translations.
 * For Kuwait-specific dialect overrides, see ar-kw.ts
 *
 * Arabic has complex pluralization with 6 forms:
 * - zero: 0 items
 * - one: 1 item
 * - two: 2 items
 * - few: 3-10 items
 * - many: 11-99 items
 * - other: 100+ items
 */

import type { TranslationResource } from '../types';

const ar: TranslationResource = {
  // Application metadata
  app: {
    name: 'نيكسوس',
    tagline: 'أتمتة سير العمل بالذكاء الاصطناعي',
    description: 'منصة أتمتة متكاملة تربط تطبيقاتك وتنفذ مهامك تلقائياً',
  },

  // Navigation
  navigation: {
    dashboard: 'لوحة التحكم',
    projects: 'المشاريع',
    workflows: 'سير العمل',
    templates: 'القوالب',
    workflowDemo: 'عرض سير العمل',
    create: 'إنشاء',
    myApps: 'تطبيقاتي',
    integrations: 'التطبيقات المتصلة',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    help: 'المساعدة',
    analytics: 'التحليلات',
    admin: 'لوحة الإدارة',
    home: 'الرئيسية',
    search: 'البحث',
    notifications: 'الإشعارات',
    account: 'الحساب',
  },

  // Common UI labels
  common: {
    // Action buttons
    submit: 'إرسال',
    cancel: 'إلغاء',
    create: 'إنشاء',
    delete: 'حذف',
    save: 'حفظ',
    edit: 'تعديل',
    execute: 'تنفيذ',
    run: 'تشغيل',
    stop: 'إيقاف',
    pause: 'إيقاف مؤقت',
    resume: 'استئناف',
    close: 'إغلاق',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    confirm: 'تأكيد',
    done: 'تم',
    yes: 'نعم',
    no: 'لا',
    ok: 'حسناً',
    apply: 'تطبيق',
    continue: 'متابعة',
    skip: 'تخطي',
    retry: 'إعادة المحاولة',
    reset: 'إعادة تعيين',
    clear: 'مسح',

    // Search and filter
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    refresh: 'تحديث',

    // Loading states
    loading: 'جاري التحميل...',
    saving: 'جاري الحفظ...',
    processing: 'جاري المعالجة...',
    deleting: 'جاري الحذف...',
    updating: 'جاري التحديث...',
    connecting: 'جاري الاتصال...',

    // Selection
    selectAll: 'تحديد الكل',
    deselectAll: 'إلغاء تحديد الكل',
    select: 'اختر',
    selected: 'محدد',

    // View actions
    more: 'المزيد',
    less: 'أقل',
    viewAll: 'عرض الكل',
    seeMore: 'شاهد المزيد',
    showLess: 'عرض أقل',
    viewDetails: 'عرض التفاصيل',
    hideDetails: 'إخفاء التفاصيل',
    expand: 'توسيع',
    collapse: 'طي',

    // CTA labels
    getStarted: 'ابدأ الآن',
    learnMore: 'اعرف المزيد',
    tryNow: 'جرب الآن',
    startTrial: 'ابدأ التجربة',
    upgrade: 'ترقية',
    contactUs: 'تواصل معنا',

    // Status badges
    free: 'مجاني',
    new: 'جديد',
    beta: 'تجريبي',
    soon: 'قريباً',
    popular: 'الأكثر شعبية',
    recommended: 'موصى به',
    featured: 'مميز',
    premium: 'مدفوع',

    // Toggle states
    enabled: 'مُفعّل',
    disabled: 'معطّل',
    active: 'نشط',
    inactive: 'غير نشط',
    on: 'تشغيل',
    off: 'إيقاف',

    // Quantities
    all: 'الكل',
    none: 'لا شيء',
    some: 'بعض',
    any: 'أي',

    // File operations
    copy: 'نسخ',
    share: 'مشاركة',
    download: 'تحميل',
    upload: 'رفع',
    import: 'استيراد',
    export: 'تصدير',
    print: 'طباعة',

    // CRUD operations
    add: 'إضافة',
    remove: 'إزالة',
    update: 'تحديث',
    duplicate: 'نسخ',
    rename: 'إعادة تسمية',
    move: 'نقل',

    // Form labels
    name: 'الاسم',
    description: 'الوصف',
    title: 'العنوان',
    type: 'النوع',
    category: 'الفئة',
    status: 'الحالة',
    date: 'التاريخ',
    time: 'الوقت',
    size: 'الحجم',
    count: 'العدد',
    value: 'القيمة',
    optional: 'اختياري',
    required: 'مطلوب',
  },

  // Authentication
  auth: {
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    signUp: 'إنشاء حساب',
    login: 'دخول',
    logout: 'خروج',
    register: 'تسجيل',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetPassword: 'إعادة تعيين كلمة المرور',
    changePassword: 'تغيير كلمة المرور',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    currentPassword: 'كلمة المرور الحالية',
    newPassword: 'كلمة المرور الجديدة',
    rememberMe: 'تذكرني',
    user: 'المستخدم',
    createAccount: 'إنشاء حساب جديد',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    dontHaveAccount: 'ليس لديك حساب؟',
    continueWith: 'المتابعة باستخدام',
    continueWithGoogle: 'المتابعة باستخدام جوجل',
    continueWithMicrosoft: 'المتابعة باستخدام مايكروسوفت',
    welcomeBack: 'مرحباً بعودتك',
    signInToContinue: 'سجل الدخول للمتابعة',
    joinNexus: 'انضم إلى نيكسوس',
    startFreeToday: 'ابدأ مجاناً اليوم',
    verifyEmail: 'تحقق من بريدك الإلكتروني',
    emailVerified: 'تم التحقق من البريد الإلكتروني',
    resendVerification: 'إعادة إرسال رمز التحقق',
    twoFactorAuth: 'المصادقة الثنائية',
    enterCode: 'أدخل الرمز',
    sessionExpired: 'انتهت الجلسة',
  },

  // Error messages
  errors: {
    general: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    unexpected: 'حدث خطأ غير متوقع.',
    network: 'خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.',
    networkOffline: 'لا يوجد اتصال بالإنترنت.',
    unauthorized: 'غير مصرح لك بتنفيذ هذا الإجراء.',
    forbidden: 'ليس لديك صلاحية للوصول لهذا المحتوى.',
    notFound: 'المورد المطلوب غير موجود.',
    pageNotFound: 'الصفحة غير موجودة.',
    validation: 'يرجى التحقق من المدخلات والمحاولة مرة أخرى.',
    timeout: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.',
    serverError: 'خطأ في الخادم. يرجى المحاولة لاحقاً.',
    serviceUnavailable: 'الخدمة غير متاحة حالياً.',
    maintenance: 'النظام قيد الصيانة. يرجى المحاولة لاحقاً.',

    // Form validation errors
    required: 'هذا الحقل مطلوب.',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح.',
    invalidPhone: 'يرجى إدخال رقم هاتف صحيح.',
    invalidUrl: 'يرجى إدخال رابط صحيح.',
    invalidFormat: 'التنسيق غير صحيح.',
    passwordMismatch: 'كلمات المرور غير متطابقة.',
    passwordTooWeak: 'كلمة المرور ضعيفة جداً.',
    passwordTooShort: 'كلمة المرور قصيرة جداً.',
    tooShort: 'هذا الحقل قصير جداً.',
    tooLong: 'هذا الحقل طويل جداً.',
    minLength: 'يجب أن يحتوي على {{min}} حرف على الأقل.',
    maxLength: 'يجب ألا يتجاوز {{max}} حرف.',
    minValue: 'يجب أن تكون القيمة {{min}} على الأقل.',
    maxValue: 'يجب ألا تتجاوز القيمة {{max}}.',
    invalidNumber: 'يرجى إدخال رقم صحيح.',
    invalidDate: 'يرجى إدخال تاريخ صحيح.',
    dateInPast: 'لا يمكن أن يكون التاريخ في الماضي.',
    dateInFuture: 'لا يمكن أن يكون التاريخ في المستقبل.',
    alreadyExists: 'هذه القيمة موجودة بالفعل.',
    notUnique: 'يجب أن تكون القيمة فريدة.',

    // Operation errors
    loadingFailed: 'فشل في تحميل البيانات.',
    saveFailed: 'فشل في حفظ التغييرات.',
    deleteFailed: 'فشل في حذف العنصر.',
    updateFailed: 'فشل في تحديث البيانات.',
    createFailed: 'فشل في إنشاء العنصر.',
    connectionFailed: 'فشل في الاتصال بالخدمة.',
    uploadFailed: 'فشل في رفع الملف.',
    downloadFailed: 'فشل في تحميل الملف.',
    exportFailed: 'فشل في التصدير.',
    importFailed: 'فشل في الاستيراد.',

    // Auth errors
    invalidCredentials: 'بيانات الدخول غير صحيحة.',
    accountLocked: 'الحساب مقفل. يرجى التواصل مع الدعم.',
    accountDisabled: 'الحساب معطل.',
    emailNotVerified: 'يرجى التحقق من بريدك الإلكتروني أولاً.',
    sessionExpired: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
    tooManyAttempts: 'محاولات كثيرة جداً. يرجى الانتظار قبل المحاولة مرة أخرى.',
    permissionDenied: 'ليس لديك صلاحية للوصول لهذا المحتوى.',

    // File errors
    fileTooLarge: 'الملف كبير جداً. الحد الأقصى {{max}}.',
    invalidFileType: 'نوع الملف غير مدعوم.',
    fileUploadFailed: 'فشل في رفع الملف.',
    noFileSelected: 'لم يتم اختيار ملف.',
  },

  // Success messages
  success: {
    saved: 'تم حفظ التغييرات بنجاح.',
    created: 'تم الإنشاء بنجاح.',
    deleted: 'تم الحذف بنجاح.',
    updated: 'تم التحديث بنجاح.',
    copied: 'تم النسخ إلى الحافظة.',
    executed: 'تم التنفيذ بنجاح.',
    completed: 'اكتمل بنجاح.',
    connected: 'تم الربط بنجاح.',
    disconnected: 'تم إلغاء الربط بنجاح.',
    sent: 'تم الإرسال بنجاح.',
    imported: 'تم الاستيراد بنجاح.',
    exported: 'تم التصدير بنجاح.',
    uploaded: 'تم الرفع بنجاح.',
    downloaded: 'تم التحميل بنجاح.',
    scheduled: 'تم الجدولة بنجاح.',
    cancelled: 'تم الإلغاء بنجاح.',
    enabled: 'تم التفعيل بنجاح.',
    disabled: 'تم التعطيل بنجاح.',
    passwordChanged: 'تم تغيير كلمة المرور بنجاح.',
    profileUpdated: 'تم تحديث الملف الشخصي بنجاح.',
    settingsSaved: 'تم حفظ الإعدادات بنجاح.',
    emailVerified: 'تم التحقق من البريد الإلكتروني بنجاح.',
    loggedIn: 'تم تسجيل الدخول بنجاح.',
    loggedOut: 'تم تسجيل الخروج بنجاح.',
    accountCreated: 'تم إنشاء الحساب بنجاح.',
  },

  // Workflow terminology
  workflow: {
    title: 'سير العمل',
    titlePlural: 'سير العمل',
    create: 'إنشاء سير عمل',
    edit: 'تعديل سير العمل',
    delete: 'حذف سير العمل',
    duplicate: 'نسخ سير العمل',
    execute: 'تنفيذ سير العمل',
    test: 'اختبار سير العمل',
    publish: 'نشر سير العمل',
    unpublish: 'إلغاء نشر سير العمل',
    activate: 'تفعيل سير العمل',
    deactivate: 'تعطيل سير العمل',
    schedule: 'جدولة سير العمل',
    share: 'مشاركة سير العمل',

    // Status
    running: 'قيد التشغيل...',
    completed: 'مكتمل',
    failed: 'فشل',
    pending: 'قيد الانتظار',
    paused: 'متوقف مؤقتاً',
    cancelled: 'ملغي',
    scheduled: 'مجدول',
    queued: 'في قائمة الانتظار',

    // Properties
    name: 'اسم سير العمل',
    description: 'وصف سير العمل',
    trigger: 'المُحفّز',
    triggers: 'المُحفّزات',
    action: 'الإجراء',
    actions: 'الإجراءات',
    node: 'العُقدة',
    nodes: 'العُقد',
    connection: 'الاتصال',
    connections: 'الاتصالات',
    condition: 'الشرط',
    conditions: 'الشروط',
    step: 'الخطوة',
    steps: 'الخطوات',
    input: 'المدخل',
    inputs: 'المدخلات',
    output: 'المخرج',
    outputs: 'المخرجات',

    // Empty states
    noWorkflows: 'لا يوجد سير عمل بعد. أنشئ أول واحد!',
    noWorkflowsFound: 'لم يتم العثور على سير عمل.',

    // Stats
    lastRun: 'آخر تشغيل',
    nextRun: 'التشغيل القادم',
    totalRuns: 'إجمالي التشغيلات',
    successRate: 'معدل النجاح',
    avgDuration: 'متوسط المدة',

    // Builder
    builder: {
      title: 'منشئ سير العمل',
      addNode: 'إضافة عُقدة',
      addTrigger: 'إضافة مُحفّز',
      addAction: 'إضافة إجراء',
      addCondition: 'إضافة شرط',
      addBranch: 'إضافة فرع',
      connectNodes: 'ربط العُقد',
      testWorkflow: 'اختبار سير العمل',
      saveWorkflow: 'حفظ سير العمل',
      publishWorkflow: 'نشر سير العمل',
      canvas: 'لوحة العمل',
      properties: 'الخصائص',
      nodeSettings: 'إعدادات العُقدة',
      inputData: 'بيانات الإدخال',
      outputData: 'بيانات الإخراج',
      dragToConnect: 'اسحب للربط',
      dropHere: 'أفلت هنا',
      zoomIn: 'تكبير',
      zoomOut: 'تصغير',
      fitToScreen: 'ملائمة الشاشة',
      undo: 'تراجع',
      redo: 'إعادة',
    },

    // Triggers
    triggerTypes: {
      schedule: 'جدولة زمنية',
      webhook: 'Webhook',
      email: 'استلام بريد',
      manual: 'يدوي',
      event: 'حدث',
      form: 'نموذج',
      api: 'API',
      cron: 'Cron',
    },

    // Status labels
    status: {
      draft: 'مسودة',
      active: 'نشط',
      inactive: 'غير نشط',
      error: 'خطأ',
      archived: 'مؤرشف',
    },
  },

  // Dashboard terminology
  dashboard: {
    title: 'لوحة التحكم',
    welcome: 'مرحباً بعودتك',
    welcomeUser: 'مرحباً بعودتك، {{name}}',
    welcomeMessage: 'إليك ملخص نشاطك اليوم',
    overview: 'نظرة عامة',
    recentActivity: 'النشاط الأخير',
    quickActions: 'إجراءات سريعة',
    stats: 'الإحصائيات',
    metrics: 'المقاييس',
    performance: 'الأداء',

    // Stats
    timeSaved: 'الوقت الموفر',
    workflowsRun: 'سير العمل المُشغَّل',
    tasksAutomated: 'المهام المؤتمتة',
    activeIntegrations: 'التكاملات النشطة',
    totalWorkflows: 'إجمالي سير العمل',
    successfulRuns: 'التشغيلات الناجحة',
    failedRuns: 'التشغيلات الفاشلة',

    // Sections
    recentWorkflows: 'سير العمل الأخير',
    upcomingSchedules: 'الجداول القادمة',
    notifications: 'الإشعارات',

    // Time periods
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    thisYear: 'هذه السنة',
    allTime: 'كل الوقت',

    // Cards
    createFirst: 'أنشئ أول سير عمل',
    createFirstDesc: 'ابدأ بأتمتة مهامك اليومية',
    connectApps: 'اربط تطبيقاتك',
    connectAppsDesc: 'اربط التطبيقات التي تستخدمها يومياً',
    exploreTemplates: 'استكشف القوالب',
    exploreTemplatesDesc: 'ابدأ بقوالب جاهزة للاستخدام',
  },

  // Forms
  forms: {
    // Labels
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    fullName: 'الاسم الكامل',
    firstName: 'الاسم الأول',
    lastName: 'الاسم الأخير',
    phone: 'رقم الهاتف',
    mobile: 'رقم الجوال',
    company: 'الشركة',
    organization: 'المؤسسة',
    website: 'الموقع الإلكتروني',
    address: 'العنوان',
    city: 'المدينة',
    country: 'الدولة',
    state: 'المحافظة',
    postalCode: 'الرمز البريدي',
    message: 'الرسالة',
    subject: 'الموضوع',
    notes: 'ملاحظات',
    comments: 'تعليقات',

    // Placeholders
    enterEmail: 'أدخل بريدك الإلكتروني',
    enterPassword: 'أدخل كلمة المرور',
    enterName: 'أدخل اسمك',
    enterPhone: 'أدخل رقم هاتفك',
    searchPlaceholder: 'ابحث...',
    selectOption: 'اختر خياراً',
    typeToSearch: 'اكتب للبحث...',

    // Hints
    passwordHint: 'يجب أن تحتوي على 8 أحرف على الأقل',
    emailHint: 'سنستخدم هذا البريد للتواصل معك',
    optionalField: 'هذا الحقل اختياري',
    requiredField: 'هذا الحقل مطلوب',

    // Validation
    invalidEmail: 'البريد الإلكتروني غير صحيح',
    invalidPhone: 'رقم الهاتف غير صحيح',
    fieldRequired: 'هذا الحقل مطلوب',
    passwordsDontMatch: 'كلمات المرور غير متطابقة',
  },

  // Time and dates
  time: {
    justNow: 'الآن',
    ago: 'منذ',
    in: 'خلال',

    // Relative time (singular)
    secondAgo: 'منذ ثانية',
    minuteAgo: 'منذ دقيقة',
    hourAgo: 'منذ ساعة',
    dayAgo: 'منذ يوم',
    weekAgo: 'منذ أسبوع',
    monthAgo: 'منذ شهر',
    yearAgo: 'منذ سنة',

    // Days
    today: 'اليوم',
    yesterday: 'أمس',
    tomorrow: 'غداً',

    // Week
    thisWeek: 'هذا الأسبوع',
    lastWeek: 'الأسبوع الماضي',
    nextWeek: 'الأسبوع القادم',

    // Month
    thisMonth: 'هذا الشهر',
    lastMonth: 'الشهر الماضي',
    nextMonth: 'الشهر القادم',

    // Year
    thisYear: 'هذه السنة',
    lastYear: 'السنة الماضية',
    nextYear: 'السنة القادمة',

    // Days of week
    days: {
      sunday: 'الأحد',
      monday: 'الإثنين',
      tuesday: 'الثلاثاء',
      wednesday: 'الأربعاء',
      thursday: 'الخميس',
      friday: 'الجمعة',
      saturday: 'السبت',
    },

    // Days of week short
    daysShort: {
      sunday: 'أحد',
      monday: 'إثن',
      tuesday: 'ثلا',
      wednesday: 'أرب',
      thursday: 'خمي',
      friday: 'جمع',
      saturday: 'سبت',
    },

    // Months
    months: {
      january: 'يناير',
      february: 'فبراير',
      march: 'مارس',
      april: 'أبريل',
      may: 'مايو',
      june: 'يونيو',
      july: 'يوليو',
      august: 'أغسطس',
      september: 'سبتمبر',
      october: 'أكتوبر',
      november: 'نوفمبر',
      december: 'ديسمبر',
    },

    // Hijri months
    hijriMonths: {
      muharram: 'محرم',
      safar: 'صفر',
      rabiAlAwwal: 'ربيع الأول',
      rabiAlThani: 'ربيع الثاني',
      jumadaAlUla: 'جمادى الأولى',
      jumadaAlThani: 'جمادى الثانية',
      rajab: 'رجب',
      shaban: 'شعبان',
      ramadan: 'رمضان',
      shawwal: 'شوال',
      dhuAlQadah: 'ذو القعدة',
      dhuAlHijjah: 'ذو الحجة',
    },

    // Time periods
    morning: 'الصباح',
    afternoon: 'الظهر',
    evening: 'المساء',
    night: 'الليل',

    // Duration units (for time spans)
    durationSeconds: 'ثوانٍ',
    durationMinutes: 'دقائق',
    durationHours: 'ساعات',
    durationDays: 'أيام',
    durationWeeks: 'أسابيع',
    durationMonths: 'أشهر',
    durationYears: 'سنوات',
  },

  // Pluralization - Arabic has 6 forms
  plurals: {
    // Items (general)
    item_zero: 'لا عناصر',
    item_one: 'عنصر واحد',
    item_two: 'عنصران',
    item_few: '{{count}} عناصر',
    item_many: '{{count}} عنصراً',
    item_other: '{{count}} عنصر',

    // Workflows
    workflow_zero: 'لا يوجد سير عمل',
    workflow_one: 'سير عمل واحد',
    workflow_two: 'سير عمل اثنان',
    workflow_few: '{{count}} سير عمل',
    workflow_many: '{{count}} سير عمل',
    workflow_other: '{{count}} سير عمل',

    // Users
    user_zero: 'لا مستخدمين',
    user_one: 'مستخدم واحد',
    user_two: 'مستخدمان',
    user_few: '{{count}} مستخدمين',
    user_many: '{{count}} مستخدماً',
    user_other: '{{count}} مستخدم',

    // Days
    day_zero: 'لا أيام',
    day_one: 'يوم واحد',
    day_two: 'يومان',
    day_few: '{{count}} أيام',
    day_many: '{{count}} يوماً',
    day_other: '{{count}} يوم',

    // Hours
    hour_zero: 'لا ساعات',
    hour_one: 'ساعة واحدة',
    hour_two: 'ساعتان',
    hour_few: '{{count}} ساعات',
    hour_many: '{{count}} ساعة',
    hour_other: '{{count}} ساعة',

    // Minutes
    minute_zero: 'لا دقائق',
    minute_one: 'دقيقة واحدة',
    minute_two: 'دقيقتان',
    minute_few: '{{count}} دقائق',
    minute_many: '{{count}} دقيقة',
    minute_other: '{{count}} دقيقة',

    // Files
    file_zero: 'لا ملفات',
    file_one: 'ملف واحد',
    file_two: 'ملفان',
    file_few: '{{count}} ملفات',
    file_many: '{{count}} ملفاً',
    file_other: '{{count}} ملف',

    // Messages
    message_zero: 'لا رسائل',
    message_one: 'رسالة واحدة',
    message_two: 'رسالتان',
    message_few: '{{count}} رسائل',
    message_many: '{{count}} رسالة',
    message_other: '{{count}} رسالة',

    // Results
    result_zero: 'لا نتائج',
    result_one: 'نتيجة واحدة',
    result_two: 'نتيجتان',
    result_few: '{{count}} نتائج',
    result_many: '{{count}} نتيجة',
    result_other: '{{count}} نتيجة',
  },

  // Numbers
  numbers: {
    // Ordinals
    first: 'الأول',
    second: 'الثاني',
    third: 'الثالث',
    fourth: 'الرابع',
    fifth: 'الخامس',
    sixth: 'السادس',
    seventh: 'السابع',
    eighth: 'الثامن',
    ninth: 'التاسع',
    tenth: 'العاشر',

    // Currency
    currency: 'عملة',
    price: 'السعر',
    total: 'الإجمالي',
    subtotal: 'المجموع الفرعي',
    tax: 'الضريبة',
    discount: 'الخصم',
    free: 'مجاني',
    perMonth: 'شهرياً',
    perYear: 'سنوياً',

    // Percentages
    percent: 'بالمائة',
    increase: 'زيادة',
    decrease: 'نقصان',
  },

  // Settings
  settings: {
    title: 'الإعدادات',
    subtitle: 'إدارة حسابك وتفضيلاتك',
    profile: 'الملف الشخصي',
    account: 'الحساب',
    notifications: 'الإشعارات',
    security: 'الأمان',
    privacy: 'الخصوصية',
    language: 'اللغة',
    appearance: 'المظهر',
    integrations: 'التكاملات',
    billing: 'الفوترة',
    api: 'مفاتيح API',
    team: 'الفريق',
    advanced: 'متقدم',

    // Language settings
    languageSettings: {
      title: 'اللغة والمنطقة',
      appLanguage: 'لغة التطبيق',
      appLanguageDesc: 'اختر لغتك المفضلة للواجهة',
      currentLanguage: 'اللغة الحالية',
      selectLanguage: 'اختر اللغة',
      rtlSupport: 'دعم RTL',
      rtlSupportDesc: 'يتم تفعيل اتجاه النص من اليمين إلى اليسار تلقائياً للغة العربية',
      dateFormat: 'تنسيق التاريخ',
      timeFormat: 'تنسيق الوقت',
      timezone: 'المنطقة الزمنية',
      calendar: 'التقويم',
      gregorian: 'الميلادي',
      hijri: 'الهجري',
      useEasternNumerals: 'استخدام الأرقام العربية الشرقية',
    },

    saveChanges: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    saved: 'تم حفظ الإعدادات بنجاح!',
    unsavedChanges: 'لديك تغييرات غير محفوظة',
    discardChanges: 'تجاهل التغييرات',
  },

  // Accessibility
  accessibility: {
    skipToContent: 'تخطي إلى المحتوى الرئيسي',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    expandSection: 'توسيع القسم',
    collapseSection: 'طي القسم',
    loading: 'جاري تحميل المحتوى',
    dismiss: 'إغلاق',
    navigateTo: 'الانتقال إلى',
    currentPage: 'الصفحة الحالية',
    newWindow: 'يفتح في نافذة جديدة',
    required: 'مطلوب',
    optional: 'اختياري',
    externalLink: 'رابط خارجي',
    toggleTheme: 'تبديل السمة',
    toggleLanguage: 'تبديل اللغة',
  },
};

export default ar;
