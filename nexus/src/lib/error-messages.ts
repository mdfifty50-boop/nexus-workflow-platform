/**
 * User-Friendly Error Messages
 *
 * Maps technical error codes and messages to human-readable text.
 * Designed for localization support with message keys.
 */

// Supported locales
export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'pt' | 'ko'

// Error message structure with localization support
export interface LocalizedErrorMessage {
  key: string // Unique identifier for localization lookup
  title: string
  message: string
  suggestion: string
  actions?: ErrorAction[]
}

// Available error recovery actions
export interface ErrorAction {
  key: string
  label: string
  type: 'retry' | 'redirect' | 'settings' | 'support' | 'dismiss' | 'offline' | 'report'
  href?: string
  primary?: boolean
}

// Error category for grouping similar errors
export type ErrorCategory =
  | 'network'
  | 'auth'
  | 'permission'
  | 'notFound'
  | 'rateLimit'
  | 'server'
  | 'validation'
  | 'workflow'
  | 'integration'
  | 'storage'
  | 'unknown'

// Full error definition
export interface ErrorDefinition {
  category: ErrorCategory
  messages: Record<SupportedLocale, LocalizedErrorMessage>
}

// Common action sets for reuse
const COMMON_ACTIONS = {
  retry: {
    key: 'action.retry',
    label: 'Try Again',
    type: 'retry' as const,
    primary: true,
  },
  goHome: {
    key: 'action.go_home',
    label: 'Go to Dashboard',
    type: 'redirect' as const,
    href: '/dashboard',
  },
  checkSettings: {
    key: 'action.check_settings',
    label: 'Check Settings',
    type: 'settings' as const,
    href: '/settings',
  },
  contactSupport: {
    key: 'action.contact_support',
    label: 'Contact Support',
    type: 'support' as const,
    href: '/help',
  },
  signIn: {
    key: 'action.sign_in',
    label: 'Sign In',
    type: 'redirect' as const,
    href: '/login',
    primary: true,
  },
  offlineMode: {
    key: 'action.offline_mode',
    label: 'Work Offline',
    type: 'offline' as const,
  },
  reportIssue: {
    key: 'action.report_issue',
    label: 'Report Issue',
    type: 'report' as const,
  },
  dismiss: {
    key: 'action.dismiss',
    label: 'Dismiss',
    type: 'dismiss' as const,
  },
}

/**
 * Master error message catalog
 *
 * Keys follow the pattern: ERROR_CATEGORY_SPECIFIC
 * Each error has messages for all supported locales
 */
export const ERROR_CATALOG: Record<string, ErrorDefinition> = {
  // =============================================================================
  // NETWORK ERRORS
  // =============================================================================
  NETWORK_OFFLINE: {
    category: 'network',
    messages: {
      en: {
        key: 'error.network.offline',
        title: 'You\'re Offline',
        message: 'It looks like you\'ve lost your internet connection.',
        suggestion: 'Check your Wi-Fi or mobile data and try again.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      es: {
        key: 'error.network.offline',
        title: 'Sin Conexion',
        message: 'Parece que has perdido la conexion a internet.',
        suggestion: 'Revisa tu Wi-Fi o datos moviles e intenta de nuevo.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      fr: {
        key: 'error.network.offline',
        title: 'Hors Ligne',
        message: 'Il semble que vous ayez perdu votre connexion internet.',
        suggestion: 'Verifiez votre Wi-Fi ou vos donnees mobiles.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      de: {
        key: 'error.network.offline',
        title: 'Offline',
        message: 'Es sieht so aus, als hatten Sie Ihre Internetverbindung verloren.',
        suggestion: 'Prufen Sie Ihr WLAN oder mobile Daten und versuchen Sie es erneut.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      ja: {
        key: 'error.network.offline',
        title: 'オフライン',
        message: 'インターネット接続が切断されているようです。',
        suggestion: 'Wi-Fiまたはモバイルデータを確認して、もう一度お試しください。',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      zh: {
        key: 'error.network.offline',
        title: '离线',
        message: '您似乎已断开互联网连接。',
        suggestion: '请检查您的Wi-Fi或移动数据，然后重试。',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      pt: {
        key: 'error.network.offline',
        title: 'Offline',
        message: 'Parece que voce perdeu sua conexao com a internet.',
        suggestion: 'Verifique seu Wi-Fi ou dados moveis e tente novamente.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      ko: {
        key: 'error.network.offline',
        title: '오프라인',
        message: '인터넷 연결이 끊어진 것 같습니다.',
        suggestion: 'Wi-Fi 또는 모바일 데이터를 확인하고 다시 시도하세요.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
    },
  },

  NETWORK_TIMEOUT: {
    category: 'network',
    messages: {
      en: {
        key: 'error.network.timeout',
        title: 'Request Timed Out',
        message: 'The server is taking too long to respond.',
        suggestion: 'This might be a temporary issue. Please try again.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.contactSupport],
      },
      es: {
        key: 'error.network.timeout',
        title: 'Tiempo de Espera Agotado',
        message: 'El servidor esta tardando demasiado en responder.',
        suggestion: 'Esto podria ser un problema temporal. Por favor, intenta de nuevo.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.contactSupport],
      },
      fr: {
        key: 'error.network.timeout',
        title: 'Delai Depasse',
        message: 'Le serveur met trop de temps a repondre.',
        suggestion: 'Cela pourrait etre temporaire. Veuillez reessayer.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.contactSupport],
      },
      de: {
        key: 'error.network.timeout',
        title: 'Zeituberschreitung',
        message: 'Der Server braucht zu lange zum Antworten.',
        suggestion: 'Dies konnte ein vorubergehendes Problem sein. Bitte versuchen Sie es erneut.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.contactSupport],
      },
      ja: {
        key: 'error.network.timeout',
        title: 'タイムアウト',
        message: 'サーバーの応答に時間がかかりすぎています。',
        suggestion: '一時的な問題かもしれません。もう一度お試しください。',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.contactSupport],
      },
      zh: {
        key: 'error.network.timeout',
        title: '请求超时',
        message: '服务器响应时间过长。',
        suggestion: '这可能是临时问题。请重试。',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.contactSupport],
      },
      pt: {
        key: 'error.network.timeout',
        title: 'Tempo Esgotado',
        message: 'O servidor esta demorando muito para responder.',
        suggestion: 'Isso pode ser um problema temporario. Por favor, tente novamente.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.contactSupport],
      },
      ko: {
        key: 'error.network.timeout',
        title: '요청 시간 초과',
        message: '서버가 응답하는 데 시간이 너무 오래 걸립니다.',
        suggestion: '일시적인 문제일 수 있습니다. 다시 시도해 주세요.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.contactSupport],
      },
    },
  },

  NETWORK_CONNECTION_FAILED: {
    category: 'network',
    messages: {
      en: {
        key: 'error.network.connection_failed',
        title: 'Connection Failed',
        message: 'We couldn\'t connect to our servers.',
        suggestion: 'Check your internet connection and try again.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      es: {
        key: 'error.network.connection_failed',
        title: 'Conexion Fallida',
        message: 'No pudimos conectar con nuestros servidores.',
        suggestion: 'Verifica tu conexion a internet e intenta de nuevo.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      fr: {
        key: 'error.network.connection_failed',
        title: 'Connexion Echouee',
        message: 'Nous n\'avons pas pu nous connecter a nos serveurs.',
        suggestion: 'Verifiez votre connexion internet et reessayez.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      de: {
        key: 'error.network.connection_failed',
        title: 'Verbindung Fehlgeschlagen',
        message: 'Wir konnten keine Verbindung zu unseren Servern herstellen.',
        suggestion: 'Prufen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      ja: {
        key: 'error.network.connection_failed',
        title: '接続に失敗しました',
        message: 'サーバーに接続できませんでした。',
        suggestion: 'インターネット接続を確認して、もう一度お試しください。',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      zh: {
        key: 'error.network.connection_failed',
        title: '连接失败',
        message: '我们无法连接到服务器。',
        suggestion: '请检查您的网络连接并重试。',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      pt: {
        key: 'error.network.connection_failed',
        title: 'Conexao Falhou',
        message: 'Nao conseguimos conectar aos nossos servidores.',
        suggestion: 'Verifique sua conexao com a internet e tente novamente.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
      ko: {
        key: 'error.network.connection_failed',
        title: '연결 실패',
        message: '서버에 연결할 수 없습니다.',
        suggestion: '인터넷 연결을 확인하고 다시 시도하세요.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.offlineMode],
      },
    },
  },

  // =============================================================================
  // AUTHENTICATION ERRORS
  // =============================================================================
  AUTH_SESSION_EXPIRED: {
    category: 'auth',
    messages: {
      en: {
        key: 'error.auth.session_expired',
        title: 'Session Expired',
        message: 'Your login session has expired for security reasons.',
        suggestion: 'Please sign in again to continue.',
        actions: [COMMON_ACTIONS.signIn],
      },
      es: {
        key: 'error.auth.session_expired',
        title: 'Sesion Expirada',
        message: 'Tu sesion ha expirado por razones de seguridad.',
        suggestion: 'Por favor, inicia sesion de nuevo para continuar.',
        actions: [COMMON_ACTIONS.signIn],
      },
      fr: {
        key: 'error.auth.session_expired',
        title: 'Session Expiree',
        message: 'Votre session a expire pour des raisons de securite.',
        suggestion: 'Veuillez vous reconnecter pour continuer.',
        actions: [COMMON_ACTIONS.signIn],
      },
      de: {
        key: 'error.auth.session_expired',
        title: 'Sitzung Abgelaufen',
        message: 'Ihre Sitzung ist aus Sicherheitsgrunden abgelaufen.',
        suggestion: 'Bitte melden Sie sich erneut an, um fortzufahren.',
        actions: [COMMON_ACTIONS.signIn],
      },
      ja: {
        key: 'error.auth.session_expired',
        title: 'セッションの有効期限切れ',
        message: 'セキュリティのため、ログインセッションが期限切れになりました。',
        suggestion: '続行するには、もう一度サインインしてください。',
        actions: [COMMON_ACTIONS.signIn],
      },
      zh: {
        key: 'error.auth.session_expired',
        title: '会话已过期',
        message: '出于安全原因，您的登录会话已过期。',
        suggestion: '请重新登录以继续。',
        actions: [COMMON_ACTIONS.signIn],
      },
      pt: {
        key: 'error.auth.session_expired',
        title: 'Sessao Expirada',
        message: 'Sua sessao expirou por motivos de seguranca.',
        suggestion: 'Por favor, faca login novamente para continuar.',
        actions: [COMMON_ACTIONS.signIn],
      },
      ko: {
        key: 'error.auth.session_expired',
        title: '세션 만료',
        message: '보안상의 이유로 로그인 세션이 만료되었습니다.',
        suggestion: '계속하려면 다시 로그인하세요.',
        actions: [COMMON_ACTIONS.signIn],
      },
    },
  },

  AUTH_INVALID_CREDENTIALS: {
    category: 'auth',
    messages: {
      en: {
        key: 'error.auth.invalid_credentials',
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect.',
        suggestion: 'Please check your credentials and try again.',
        actions: [COMMON_ACTIONS.retry, { ...COMMON_ACTIONS.contactSupport, label: 'Forgot Password?' }],
      },
      es: {
        key: 'error.auth.invalid_credentials',
        title: 'Credenciales Invalidas',
        message: 'El correo o contrasena que ingresaste es incorrecto.',
        suggestion: 'Por favor, verifica tus credenciales e intenta de nuevo.',
        actions: [COMMON_ACTIONS.retry, { ...COMMON_ACTIONS.contactSupport, label: 'Olvidaste tu contrasena?' }],
      },
      fr: {
        key: 'error.auth.invalid_credentials',
        title: 'Identifiants Invalides',
        message: 'L\'email ou le mot de passe que vous avez entre est incorrect.',
        suggestion: 'Veuillez verifier vos identifiants et reessayer.',
        actions: [COMMON_ACTIONS.retry, { ...COMMON_ACTIONS.contactSupport, label: 'Mot de passe oublie?' }],
      },
      de: {
        key: 'error.auth.invalid_credentials',
        title: 'Ungultige Anmeldedaten',
        message: 'Die eingegebene E-Mail oder das Passwort ist falsch.',
        suggestion: 'Bitte uberprufen Sie Ihre Anmeldedaten und versuchen Sie es erneut.',
        actions: [COMMON_ACTIONS.retry, { ...COMMON_ACTIONS.contactSupport, label: 'Passwort vergessen?' }],
      },
      ja: {
        key: 'error.auth.invalid_credentials',
        title: '無効な認証情報',
        message: '入力されたメールアドレスまたはパスワードが正しくありません。',
        suggestion: '認証情報を確認して、もう一度お試しください。',
        actions: [COMMON_ACTIONS.retry, { ...COMMON_ACTIONS.contactSupport, label: 'パスワードをお忘れですか？' }],
      },
      zh: {
        key: 'error.auth.invalid_credentials',
        title: '无效凭据',
        message: '您输入的邮箱或密码不正确。',
        suggestion: '请检查您的凭据并重试。',
        actions: [COMMON_ACTIONS.retry, { ...COMMON_ACTIONS.contactSupport, label: '忘记密码？' }],
      },
      pt: {
        key: 'error.auth.invalid_credentials',
        title: 'Credenciais Invalidas',
        message: 'O email ou senha que voce digitou esta incorreto.',
        suggestion: 'Por favor, verifique suas credenciais e tente novamente.',
        actions: [COMMON_ACTIONS.retry, { ...COMMON_ACTIONS.contactSupport, label: 'Esqueceu a senha?' }],
      },
      ko: {
        key: 'error.auth.invalid_credentials',
        title: '잘못된 자격 증명',
        message: '입력한 이메일 또는 비밀번호가 올바르지 않습니다.',
        suggestion: '자격 증명을 확인하고 다시 시도하세요.',
        actions: [COMMON_ACTIONS.retry, { ...COMMON_ACTIONS.contactSupport, label: '비밀번호를 잊으셨나요?' }],
      },
    },
  },

  // =============================================================================
  // PERMISSION ERRORS
  // =============================================================================
  PERMISSION_DENIED: {
    category: 'permission',
    messages: {
      en: {
        key: 'error.permission.denied',
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        suggestion: 'If you think this is a mistake, contact your administrator.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      es: {
        key: 'error.permission.denied',
        title: 'Acceso Denegado',
        message: 'No tienes permiso para realizar esta accion.',
        suggestion: 'Si crees que esto es un error, contacta a tu administrador.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      fr: {
        key: 'error.permission.denied',
        title: 'Acces Refuse',
        message: 'Vous n\'avez pas la permission d\'effectuer cette action.',
        suggestion: 'Si vous pensez qu\'il s\'agit d\'une erreur, contactez votre administrateur.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      de: {
        key: 'error.permission.denied',
        title: 'Zugriff Verweigert',
        message: 'Sie haben keine Berechtigung, diese Aktion auszufuhren.',
        suggestion: 'Wenn Sie glauben, dass dies ein Fehler ist, wenden Sie sich an Ihren Administrator.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      ja: {
        key: 'error.permission.denied',
        title: 'アクセスが拒否されました',
        message: 'このアクションを実行する権限がありません。',
        suggestion: 'これが間違いだと思われる場合は、管理者にお問い合わせください。',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      zh: {
        key: 'error.permission.denied',
        title: '访问被拒绝',
        message: '您没有执行此操作的权限。',
        suggestion: '如果您认为这是错误的，请联系您的管理员。',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      pt: {
        key: 'error.permission.denied',
        title: 'Acesso Negado',
        message: 'Voce nao tem permissao para realizar esta acao.',
        suggestion: 'Se voce acha que isso e um erro, entre em contato com seu administrador.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      ko: {
        key: 'error.permission.denied',
        title: '접근 거부',
        message: '이 작업을 수행할 권한이 없습니다.',
        suggestion: '이것이 실수라고 생각되면 관리자에게 문의하세요.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
    },
  },

  // =============================================================================
  // NOT FOUND ERRORS
  // =============================================================================
  NOT_FOUND_PAGE: {
    category: 'notFound',
    messages: {
      en: {
        key: 'error.not_found.page',
        title: 'Page Not Found',
        message: 'The page you\'re looking for doesn\'t exist or has been moved.',
        suggestion: 'Check the URL or navigate to a different page.',
        actions: [COMMON_ACTIONS.goHome, { key: 'action.search', label: 'Search', type: 'redirect' as const, href: '/dashboard' }],
      },
      es: {
        key: 'error.not_found.page',
        title: 'Pagina No Encontrada',
        message: 'La pagina que buscas no existe o ha sido movida.',
        suggestion: 'Verifica la URL o navega a una pagina diferente.',
        actions: [COMMON_ACTIONS.goHome, { key: 'action.search', label: 'Buscar', type: 'redirect' as const, href: '/dashboard' }],
      },
      fr: {
        key: 'error.not_found.page',
        title: 'Page Non Trouvee',
        message: 'La page que vous recherchez n\'existe pas ou a ete deplacee.',
        suggestion: 'Verifiez l\'URL ou naviguez vers une autre page.',
        actions: [COMMON_ACTIONS.goHome, { key: 'action.search', label: 'Rechercher', type: 'redirect' as const, href: '/dashboard' }],
      },
      de: {
        key: 'error.not_found.page',
        title: 'Seite Nicht Gefunden',
        message: 'Die gesuchte Seite existiert nicht oder wurde verschoben.',
        suggestion: 'Uberprufen Sie die URL oder navigieren Sie zu einer anderen Seite.',
        actions: [COMMON_ACTIONS.goHome, { key: 'action.search', label: 'Suchen', type: 'redirect' as const, href: '/dashboard' }],
      },
      ja: {
        key: 'error.not_found.page',
        title: 'ページが見つかりません',
        message: 'お探しのページは存在しないか、移動されました。',
        suggestion: 'URLを確認するか、別のページに移動してください。',
        actions: [COMMON_ACTIONS.goHome, { key: 'action.search', label: '検索', type: 'redirect' as const, href: '/dashboard' }],
      },
      zh: {
        key: 'error.not_found.page',
        title: '页面未找到',
        message: '您要查找的页面不存在或已被移动。',
        suggestion: '请检查URL或导航到其他页面。',
        actions: [COMMON_ACTIONS.goHome, { key: 'action.search', label: '搜索', type: 'redirect' as const, href: '/dashboard' }],
      },
      pt: {
        key: 'error.not_found.page',
        title: 'Pagina Nao Encontrada',
        message: 'A pagina que voce esta procurando nao existe ou foi movida.',
        suggestion: 'Verifique a URL ou navegue para outra pagina.',
        actions: [COMMON_ACTIONS.goHome, { key: 'action.search', label: 'Pesquisar', type: 'redirect' as const, href: '/dashboard' }],
      },
      ko: {
        key: 'error.not_found.page',
        title: '페이지를 찾을 수 없습니다',
        message: '찾고 있는 페이지가 존재하지 않거나 이동되었습니다.',
        suggestion: 'URL을 확인하거나 다른 페이지로 이동하세요.',
        actions: [COMMON_ACTIONS.goHome, { key: 'action.search', label: '검색', type: 'redirect' as const, href: '/dashboard' }],
      },
    },
  },

  NOT_FOUND_RESOURCE: {
    category: 'notFound',
    messages: {
      en: {
        key: 'error.not_found.resource',
        title: 'Not Found',
        message: 'The item you\'re looking for doesn\'t exist.',
        suggestion: 'It may have been deleted or moved.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      es: {
        key: 'error.not_found.resource',
        title: 'No Encontrado',
        message: 'El elemento que buscas no existe.',
        suggestion: 'Puede haber sido eliminado o movido.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      fr: {
        key: 'error.not_found.resource',
        title: 'Non Trouve',
        message: 'L\'element que vous recherchez n\'existe pas.',
        suggestion: 'Il a peut-etre ete supprime ou deplace.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      de: {
        key: 'error.not_found.resource',
        title: 'Nicht Gefunden',
        message: 'Das gesuchte Element existiert nicht.',
        suggestion: 'Es wurde moglicherweise geloscht oder verschoben.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      ja: {
        key: 'error.not_found.resource',
        title: '見つかりません',
        message: 'お探しのアイテムは存在しません。',
        suggestion: '削除または移動された可能性があります。',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      zh: {
        key: 'error.not_found.resource',
        title: '未找到',
        message: '您要查找的项目不存在。',
        suggestion: '它可能已被删除或移动。',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      pt: {
        key: 'error.not_found.resource',
        title: 'Nao Encontrado',
        message: 'O item que voce procura nao existe.',
        suggestion: 'Pode ter sido excluido ou movido.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
      ko: {
        key: 'error.not_found.resource',
        title: '찾을 수 없음',
        message: '찾고 있는 항목이 존재하지 않습니다.',
        suggestion: '삭제되었거나 이동되었을 수 있습니다.',
        actions: [COMMON_ACTIONS.goHome, COMMON_ACTIONS.contactSupport],
      },
    },
  },

  // =============================================================================
  // RATE LIMIT ERRORS
  // =============================================================================
  RATE_LIMIT_EXCEEDED: {
    category: 'rateLimit',
    messages: {
      en: {
        key: 'error.rate_limit.exceeded',
        title: 'Too Many Requests',
        message: 'You\'ve made too many requests in a short time.',
        suggestion: 'Please wait a moment before trying again.',
        actions: [
          { ...COMMON_ACTIONS.retry, label: 'Try Again in 30s' },
          { key: 'action.upgrade', label: 'Upgrade Plan', type: 'redirect' as const, href: '/settings/billing' },
        ],
      },
      es: {
        key: 'error.rate_limit.exceeded',
        title: 'Demasiadas Solicitudes',
        message: 'Has realizado demasiadas solicitudes en poco tiempo.',
        suggestion: 'Por favor, espera un momento antes de intentar de nuevo.',
        actions: [
          { ...COMMON_ACTIONS.retry, label: 'Intentar en 30s' },
          { key: 'action.upgrade', label: 'Actualizar Plan', type: 'redirect' as const, href: '/settings/billing' },
        ],
      },
      fr: {
        key: 'error.rate_limit.exceeded',
        title: 'Trop de Requetes',
        message: 'Vous avez fait trop de requetes en peu de temps.',
        suggestion: 'Veuillez patienter avant de reessayer.',
        actions: [
          { ...COMMON_ACTIONS.retry, label: 'Reessayer dans 30s' },
          { key: 'action.upgrade', label: 'Mettre a niveau', type: 'redirect' as const, href: '/settings/billing' },
        ],
      },
      de: {
        key: 'error.rate_limit.exceeded',
        title: 'Zu Viele Anfragen',
        message: 'Sie haben zu viele Anfragen in kurzer Zeit gestellt.',
        suggestion: 'Bitte warten Sie einen Moment, bevor Sie es erneut versuchen.',
        actions: [
          { ...COMMON_ACTIONS.retry, label: 'In 30s erneut versuchen' },
          { key: 'action.upgrade', label: 'Plan upgraden', type: 'redirect' as const, href: '/settings/billing' },
        ],
      },
      ja: {
        key: 'error.rate_limit.exceeded',
        title: 'リクエストが多すぎます',
        message: '短時間に多くのリクエストを行いました。',
        suggestion: 'しばらく待ってからもう一度お試しください。',
        actions: [
          { ...COMMON_ACTIONS.retry, label: '30秒後に再試行' },
          { key: 'action.upgrade', label: 'プランをアップグレード', type: 'redirect' as const, href: '/settings/billing' },
        ],
      },
      zh: {
        key: 'error.rate_limit.exceeded',
        title: '请求过多',
        message: '您在短时间内发送了太多请求。',
        suggestion: '请稍等片刻后再试。',
        actions: [
          { ...COMMON_ACTIONS.retry, label: '30秒后重试' },
          { key: 'action.upgrade', label: '升级计划', type: 'redirect' as const, href: '/settings/billing' },
        ],
      },
      pt: {
        key: 'error.rate_limit.exceeded',
        title: 'Muitas Solicitacoes',
        message: 'Voce fez muitas solicitacoes em pouco tempo.',
        suggestion: 'Por favor, aguarde um momento antes de tentar novamente.',
        actions: [
          { ...COMMON_ACTIONS.retry, label: 'Tentar em 30s' },
          { key: 'action.upgrade', label: 'Atualizar Plano', type: 'redirect' as const, href: '/settings/billing' },
        ],
      },
      ko: {
        key: 'error.rate_limit.exceeded',
        title: '요청이 너무 많습니다',
        message: '짧은 시간에 너무 많은 요청을 하셨습니다.',
        suggestion: '잠시 후 다시 시도하세요.',
        actions: [
          { ...COMMON_ACTIONS.retry, label: '30초 후 재시도' },
          { key: 'action.upgrade', label: '플랜 업그레이드', type: 'redirect' as const, href: '/settings/billing' },
        ],
      },
    },
  },

  // =============================================================================
  // SERVER ERRORS
  // =============================================================================
  SERVER_ERROR: {
    category: 'server',
    messages: {
      en: {
        key: 'error.server.error',
        title: 'Server Error',
        message: 'Something went wrong on our end.',
        suggestion: 'We\'re working on it. Please try again later.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      es: {
        key: 'error.server.error',
        title: 'Error del Servidor',
        message: 'Algo salio mal de nuestro lado.',
        suggestion: 'Estamos trabajando en ello. Por favor, intenta mas tarde.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      fr: {
        key: 'error.server.error',
        title: 'Erreur Serveur',
        message: 'Un probleme est survenu de notre cote.',
        suggestion: 'Nous y travaillons. Veuillez reessayer plus tard.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      de: {
        key: 'error.server.error',
        title: 'Serverfehler',
        message: 'Auf unserer Seite ist etwas schief gelaufen.',
        suggestion: 'Wir arbeiten daran. Bitte versuchen Sie es spater erneut.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      ja: {
        key: 'error.server.error',
        title: 'サーバーエラー',
        message: 'サーバー側で問題が発生しました。',
        suggestion: '対応中です。後でもう一度お試しください。',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      zh: {
        key: 'error.server.error',
        title: '服务器错误',
        message: '我们这边出了问题。',
        suggestion: '我们正在处理中。请稍后重试。',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      pt: {
        key: 'error.server.error',
        title: 'Erro do Servidor',
        message: 'Algo deu errado do nosso lado.',
        suggestion: 'Estamos trabalhando nisso. Por favor, tente novamente mais tarde.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      ko: {
        key: 'error.server.error',
        title: '서버 오류',
        message: '저희 쪽에서 문제가 발생했습니다.',
        suggestion: '문제를 해결 중입니다. 나중에 다시 시도해 주세요.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
    },
  },

  SERVER_MAINTENANCE: {
    category: 'server',
    messages: {
      en: {
        key: 'error.server.maintenance',
        title: 'Under Maintenance',
        message: 'We\'re performing scheduled maintenance.',
        suggestion: 'Please check back in a few minutes.',
        actions: [COMMON_ACTIONS.retry],
      },
      es: {
        key: 'error.server.maintenance',
        title: 'En Mantenimiento',
        message: 'Estamos realizando mantenimiento programado.',
        suggestion: 'Por favor, vuelve en unos minutos.',
        actions: [COMMON_ACTIONS.retry],
      },
      fr: {
        key: 'error.server.maintenance',
        title: 'En Maintenance',
        message: 'Nous effectuons une maintenance programmee.',
        suggestion: 'Veuillez revenir dans quelques minutes.',
        actions: [COMMON_ACTIONS.retry],
      },
      de: {
        key: 'error.server.maintenance',
        title: 'In Wartung',
        message: 'Wir fuhren geplante Wartungsarbeiten durch.',
        suggestion: 'Bitte schauen Sie in ein paar Minuten wieder vorbei.',
        actions: [COMMON_ACTIONS.retry],
      },
      ja: {
        key: 'error.server.maintenance',
        title: 'メンテナンス中',
        message: '定期メンテナンスを実施しています。',
        suggestion: '数分後にもう一度ご確認ください。',
        actions: [COMMON_ACTIONS.retry],
      },
      zh: {
        key: 'error.server.maintenance',
        title: '维护中',
        message: '我们正在进行计划维护。',
        suggestion: '请几分钟后再来查看。',
        actions: [COMMON_ACTIONS.retry],
      },
      pt: {
        key: 'error.server.maintenance',
        title: 'Em Manutencao',
        message: 'Estamos realizando manutencao programada.',
        suggestion: 'Por favor, volte em alguns minutos.',
        actions: [COMMON_ACTIONS.retry],
      },
      ko: {
        key: 'error.server.maintenance',
        title: '점검 중',
        message: '예정된 점검을 진행하고 있습니다.',
        suggestion: '몇 분 후에 다시 확인해 주세요.',
        actions: [COMMON_ACTIONS.retry],
      },
    },
  },

  // =============================================================================
  // WORKFLOW ERRORS
  // =============================================================================
  WORKFLOW_EXECUTION_FAILED: {
    category: 'workflow',
    messages: {
      en: {
        key: 'error.workflow.execution_failed',
        title: 'Workflow Failed',
        message: 'The workflow couldn\'t be completed.',
        suggestion: 'Check the workflow configuration and try again.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.view_logs', label: 'View Logs', type: 'redirect' as const, href: '/workflows' },
          COMMON_ACTIONS.contactSupport,
        ],
      },
      es: {
        key: 'error.workflow.execution_failed',
        title: 'Flujo de Trabajo Fallido',
        message: 'El flujo de trabajo no pudo completarse.',
        suggestion: 'Verifica la configuracion del flujo de trabajo e intenta de nuevo.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.view_logs', label: 'Ver Registros', type: 'redirect' as const, href: '/workflows' },
          COMMON_ACTIONS.contactSupport,
        ],
      },
      fr: {
        key: 'error.workflow.execution_failed',
        title: 'Echec du Flux',
        message: 'Le flux de travail n\'a pas pu etre complete.',
        suggestion: 'Verifiez la configuration du flux et reessayez.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.view_logs', label: 'Voir les Logs', type: 'redirect' as const, href: '/workflows' },
          COMMON_ACTIONS.contactSupport,
        ],
      },
      de: {
        key: 'error.workflow.execution_failed',
        title: 'Workflow Fehlgeschlagen',
        message: 'Der Workflow konnte nicht abgeschlossen werden.',
        suggestion: 'Uberprufen Sie die Workflow-Konfiguration und versuchen Sie es erneut.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.view_logs', label: 'Logs anzeigen', type: 'redirect' as const, href: '/workflows' },
          COMMON_ACTIONS.contactSupport,
        ],
      },
      ja: {
        key: 'error.workflow.execution_failed',
        title: 'ワークフロー失敗',
        message: 'ワークフローを完了できませんでした。',
        suggestion: 'ワークフローの設定を確認して、もう一度お試しください。',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.view_logs', label: 'ログを表示', type: 'redirect' as const, href: '/workflows' },
          COMMON_ACTIONS.contactSupport,
        ],
      },
      zh: {
        key: 'error.workflow.execution_failed',
        title: '工作流失败',
        message: '工作流无法完成。',
        suggestion: '检查工作流配置并重试。',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.view_logs', label: '查看日志', type: 'redirect' as const, href: '/workflows' },
          COMMON_ACTIONS.contactSupport,
        ],
      },
      pt: {
        key: 'error.workflow.execution_failed',
        title: 'Fluxo de Trabalho Falhou',
        message: 'O fluxo de trabalho nao pode ser concluido.',
        suggestion: 'Verifique a configuracao do fluxo de trabalho e tente novamente.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.view_logs', label: 'Ver Logs', type: 'redirect' as const, href: '/workflows' },
          COMMON_ACTIONS.contactSupport,
        ],
      },
      ko: {
        key: 'error.workflow.execution_failed',
        title: '워크플로우 실패',
        message: '워크플로우를 완료할 수 없습니다.',
        suggestion: '워크플로우 구성을 확인하고 다시 시도하세요.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.view_logs', label: '로그 보기', type: 'redirect' as const, href: '/workflows' },
          COMMON_ACTIONS.contactSupport,
        ],
      },
    },
  },

  // =============================================================================
  // INTEGRATION ERRORS
  // =============================================================================
  INTEGRATION_CONNECTION_FAILED: {
    category: 'integration',
    messages: {
      en: {
        key: 'error.integration.connection_failed',
        title: 'Integration Failed',
        message: 'We couldn\'t connect to the external service.',
        suggestion: 'Check your integration settings and reconnect.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.integrations', label: 'Manage Integrations', type: 'redirect' as const, href: '/integrations' },
        ],
      },
      es: {
        key: 'error.integration.connection_failed',
        title: 'Integracion Fallida',
        message: 'No pudimos conectar con el servicio externo.',
        suggestion: 'Verifica la configuracion de integracion y reconecta.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.integrations', label: 'Gestionar Integraciones', type: 'redirect' as const, href: '/integrations' },
        ],
      },
      fr: {
        key: 'error.integration.connection_failed',
        title: 'Integration Echouee',
        message: 'Nous n\'avons pas pu nous connecter au service externe.',
        suggestion: 'Verifiez vos parametres d\'integration et reconnectez.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.integrations', label: 'Gerer les Integrations', type: 'redirect' as const, href: '/integrations' },
        ],
      },
      de: {
        key: 'error.integration.connection_failed',
        title: 'Integration Fehlgeschlagen',
        message: 'Wir konnten keine Verbindung zum externen Dienst herstellen.',
        suggestion: 'Uberprufen Sie Ihre Integrationseinstellungen und verbinden Sie sich erneut.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.integrations', label: 'Integrationen verwalten', type: 'redirect' as const, href: '/integrations' },
        ],
      },
      ja: {
        key: 'error.integration.connection_failed',
        title: '連携に失敗しました',
        message: '外部サービスに接続できませんでした。',
        suggestion: '連携設定を確認して、再接続してください。',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.integrations', label: '連携を管理', type: 'redirect' as const, href: '/integrations' },
        ],
      },
      zh: {
        key: 'error.integration.connection_failed',
        title: '集成失败',
        message: '我们无法连接到外部服务。',
        suggestion: '检查您的集成设置并重新连接。',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.integrations', label: '管理集成', type: 'redirect' as const, href: '/integrations' },
        ],
      },
      pt: {
        key: 'error.integration.connection_failed',
        title: 'Integracao Falhou',
        message: 'Nao foi possivel conectar ao servico externo.',
        suggestion: 'Verifique as configuracoes de integracao e reconecte.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.integrations', label: 'Gerenciar Integracoes', type: 'redirect' as const, href: '/integrations' },
        ],
      },
      ko: {
        key: 'error.integration.connection_failed',
        title: '통합 실패',
        message: '외부 서비스에 연결할 수 없습니다.',
        suggestion: '통합 설정을 확인하고 다시 연결하세요.',
        actions: [
          COMMON_ACTIONS.retry,
          { key: 'action.integrations', label: '통합 관리', type: 'redirect' as const, href: '/integrations' },
        ],
      },
    },
  },

  // =============================================================================
  // STORAGE ERRORS
  // =============================================================================
  STORAGE_QUOTA_EXCEEDED: {
    category: 'storage',
    messages: {
      en: {
        key: 'error.storage.quota_exceeded',
        title: 'Storage Full',
        message: 'You\'ve reached your storage limit.',
        suggestion: 'Delete some files or upgrade your plan for more space.',
        actions: [
          { key: 'action.manage_storage', label: 'Manage Storage', type: 'settings' as const, href: '/settings/storage' },
          { key: 'action.upgrade', label: 'Upgrade Plan', type: 'redirect' as const, href: '/settings/billing', primary: true },
        ],
      },
      es: {
        key: 'error.storage.quota_exceeded',
        title: 'Almacenamiento Lleno',
        message: 'Has alcanzado tu limite de almacenamiento.',
        suggestion: 'Elimina algunos archivos o actualiza tu plan para mas espacio.',
        actions: [
          { key: 'action.manage_storage', label: 'Gestionar Almacenamiento', type: 'settings' as const, href: '/settings/storage' },
          { key: 'action.upgrade', label: 'Actualizar Plan', type: 'redirect' as const, href: '/settings/billing', primary: true },
        ],
      },
      fr: {
        key: 'error.storage.quota_exceeded',
        title: 'Stockage Plein',
        message: 'Vous avez atteint votre limite de stockage.',
        suggestion: 'Supprimez des fichiers ou passez a un plan superieur.',
        actions: [
          { key: 'action.manage_storage', label: 'Gerer le Stockage', type: 'settings' as const, href: '/settings/storage' },
          { key: 'action.upgrade', label: 'Mettre a niveau', type: 'redirect' as const, href: '/settings/billing', primary: true },
        ],
      },
      de: {
        key: 'error.storage.quota_exceeded',
        title: 'Speicher Voll',
        message: 'Sie haben Ihr Speicherlimit erreicht.',
        suggestion: 'Loschen Sie einige Dateien oder upgraden Sie Ihren Plan.',
        actions: [
          { key: 'action.manage_storage', label: 'Speicher verwalten', type: 'settings' as const, href: '/settings/storage' },
          { key: 'action.upgrade', label: 'Plan upgraden', type: 'redirect' as const, href: '/settings/billing', primary: true },
        ],
      },
      ja: {
        key: 'error.storage.quota_exceeded',
        title: 'ストレージがいっぱいです',
        message: 'ストレージの上限に達しました。',
        suggestion: 'ファイルを削除するか、プランをアップグレードしてください。',
        actions: [
          { key: 'action.manage_storage', label: 'ストレージを管理', type: 'settings' as const, href: '/settings/storage' },
          { key: 'action.upgrade', label: 'プランをアップグレード', type: 'redirect' as const, href: '/settings/billing', primary: true },
        ],
      },
      zh: {
        key: 'error.storage.quota_exceeded',
        title: '存储空间已满',
        message: '您已达到存储限制。',
        suggestion: '删除一些文件或升级您的计划以获得更多空间。',
        actions: [
          { key: 'action.manage_storage', label: '管理存储', type: 'settings' as const, href: '/settings/storage' },
          { key: 'action.upgrade', label: '升级计划', type: 'redirect' as const, href: '/settings/billing', primary: true },
        ],
      },
      pt: {
        key: 'error.storage.quota_exceeded',
        title: 'Armazenamento Cheio',
        message: 'Voce atingiu seu limite de armazenamento.',
        suggestion: 'Exclua alguns arquivos ou atualize seu plano para mais espaco.',
        actions: [
          { key: 'action.manage_storage', label: 'Gerenciar Armazenamento', type: 'settings' as const, href: '/settings/storage' },
          { key: 'action.upgrade', label: 'Atualizar Plano', type: 'redirect' as const, href: '/settings/billing', primary: true },
        ],
      },
      ko: {
        key: 'error.storage.quota_exceeded',
        title: '저장 공간 부족',
        message: '저장 공간 한도에 도달했습니다.',
        suggestion: '일부 파일을 삭제하거나 플랜을 업그레이드하세요.',
        actions: [
          { key: 'action.manage_storage', label: '저장 공간 관리', type: 'settings' as const, href: '/settings/storage' },
          { key: 'action.upgrade', label: '플랜 업그레이드', type: 'redirect' as const, href: '/settings/billing', primary: true },
        ],
      },
    },
  },

  // =============================================================================
  // VALIDATION ERRORS
  // =============================================================================
  VALIDATION_FAILED: {
    category: 'validation',
    messages: {
      en: {
        key: 'error.validation.failed',
        title: 'Invalid Input',
        message: 'Some of the information you provided is invalid.',
        suggestion: 'Please check your input and try again.',
        actions: [COMMON_ACTIONS.dismiss],
      },
      es: {
        key: 'error.validation.failed',
        title: 'Entrada Invalida',
        message: 'Parte de la informacion que proporcionaste es invalida.',
        suggestion: 'Por favor, revisa tu entrada e intenta de nuevo.',
        actions: [COMMON_ACTIONS.dismiss],
      },
      fr: {
        key: 'error.validation.failed',
        title: 'Entree Invalide',
        message: 'Certaines informations que vous avez fournies sont invalides.',
        suggestion: 'Veuillez verifier votre saisie et reessayer.',
        actions: [COMMON_ACTIONS.dismiss],
      },
      de: {
        key: 'error.validation.failed',
        title: 'Ungultige Eingabe',
        message: 'Einige der von Ihnen angegebenen Informationen sind ungultig.',
        suggestion: 'Bitte uberprufen Sie Ihre Eingabe und versuchen Sie es erneut.',
        actions: [COMMON_ACTIONS.dismiss],
      },
      ja: {
        key: 'error.validation.failed',
        title: '無効な入力',
        message: '入力された情報の一部が無効です。',
        suggestion: '入力を確認して、もう一度お試しください。',
        actions: [COMMON_ACTIONS.dismiss],
      },
      zh: {
        key: 'error.validation.failed',
        title: '无效输入',
        message: '您提供的部分信息无效。',
        suggestion: '请检查您的输入并重试。',
        actions: [COMMON_ACTIONS.dismiss],
      },
      pt: {
        key: 'error.validation.failed',
        title: 'Entrada Invalida',
        message: 'Algumas informacoes que voce forneceu sao invalidas.',
        suggestion: 'Por favor, verifique sua entrada e tente novamente.',
        actions: [COMMON_ACTIONS.dismiss],
      },
      ko: {
        key: 'error.validation.failed',
        title: '잘못된 입력',
        message: '제공한 정보 중 일부가 유효하지 않습니다.',
        suggestion: '입력을 확인하고 다시 시도하세요.',
        actions: [COMMON_ACTIONS.dismiss],
      },
    },
  },

  // =============================================================================
  // GENERIC UNKNOWN ERROR
  // =============================================================================
  UNKNOWN_ERROR: {
    category: 'unknown',
    messages: {
      en: {
        key: 'error.unknown',
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred.',
        suggestion: 'Please try again or contact support if the problem persists.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      es: {
        key: 'error.unknown',
        title: 'Algo Salio Mal',
        message: 'Ocurrio un error inesperado.',
        suggestion: 'Por favor, intenta de nuevo o contacta soporte si el problema persiste.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      fr: {
        key: 'error.unknown',
        title: 'Un Probleme Est Survenu',
        message: 'Une erreur inattendue s\'est produite.',
        suggestion: 'Veuillez reessayer ou contacter le support si le probleme persiste.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      de: {
        key: 'error.unknown',
        title: 'Etwas Ist Schief Gelaufen',
        message: 'Ein unerwarteter Fehler ist aufgetreten.',
        suggestion: 'Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      ja: {
        key: 'error.unknown',
        title: '問題が発生しました',
        message: '予期しないエラーが発生しました。',
        suggestion: '問題が解決しない場合は、サポートにお問い合わせください。',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      zh: {
        key: 'error.unknown',
        title: '出了点问题',
        message: '发生了意外错误。',
        suggestion: '请重试，如果问题仍然存在，请联系支持。',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      pt: {
        key: 'error.unknown',
        title: 'Algo Deu Errado',
        message: 'Ocorreu um erro inesperado.',
        suggestion: 'Por favor, tente novamente ou entre em contato com o suporte.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
      ko: {
        key: 'error.unknown',
        title: '문제가 발생했습니다',
        message: '예기치 않은 오류가 발생했습니다.',
        suggestion: '다시 시도하거나 문제가 지속되면 지원팀에 문의하세요.',
        actions: [COMMON_ACTIONS.retry, COMMON_ACTIONS.reportIssue, COMMON_ACTIONS.contactSupport],
      },
    },
  },
}

// =============================================================================
// ERROR MATCHING PATTERNS
// =============================================================================

// Pattern-based error detection
interface ErrorPattern {
  pattern: RegExp | string
  errorKey: string
}

const ERROR_PATTERNS: ErrorPattern[] = [
  // Network errors
  { pattern: /failed\s*to\s*fetch/i, errorKey: 'NETWORK_CONNECTION_FAILED' },
  { pattern: /network\s*error/i, errorKey: 'NETWORK_OFFLINE' },
  { pattern: /net::ERR/i, errorKey: 'NETWORK_CONNECTION_FAILED' },
  { pattern: /offline/i, errorKey: 'NETWORK_OFFLINE' },
  { pattern: /timeout/i, errorKey: 'NETWORK_TIMEOUT' },
  { pattern: /timed?\s*out/i, errorKey: 'NETWORK_TIMEOUT' },
  { pattern: /ETIMEDOUT/i, errorKey: 'NETWORK_TIMEOUT' },
  { pattern: /ECONNREFUSED/i, errorKey: 'NETWORK_CONNECTION_FAILED' },
  { pattern: /ENOTFOUND/i, errorKey: 'NETWORK_CONNECTION_FAILED' },

  // Auth errors
  { pattern: /401/i, errorKey: 'AUTH_SESSION_EXPIRED' },
  { pattern: /unauthorized/i, errorKey: 'AUTH_SESSION_EXPIRED' },
  { pattern: /invalid\s*(credentials|password|email)/i, errorKey: 'AUTH_INVALID_CREDENTIALS' },
  { pattern: /session\s*expired/i, errorKey: 'AUTH_SESSION_EXPIRED' },
  { pattern: /token\s*expired/i, errorKey: 'AUTH_SESSION_EXPIRED' },

  // Permission errors
  { pattern: /403/i, errorKey: 'PERMISSION_DENIED' },
  { pattern: /forbidden/i, errorKey: 'PERMISSION_DENIED' },
  { pattern: /access\s*denied/i, errorKey: 'PERMISSION_DENIED' },
  { pattern: /not\s*authorized/i, errorKey: 'PERMISSION_DENIED' },

  // Not found errors
  { pattern: /404/i, errorKey: 'NOT_FOUND_RESOURCE' },
  { pattern: /not\s*found/i, errorKey: 'NOT_FOUND_RESOURCE' },
  { pattern: /does\s*not\s*exist/i, errorKey: 'NOT_FOUND_RESOURCE' },

  // Rate limit errors
  { pattern: /429/i, errorKey: 'RATE_LIMIT_EXCEEDED' },
  { pattern: /rate\s*limit/i, errorKey: 'RATE_LIMIT_EXCEEDED' },
  { pattern: /too\s*many\s*requests/i, errorKey: 'RATE_LIMIT_EXCEEDED' },
  { pattern: /quota\s*exceeded/i, errorKey: 'RATE_LIMIT_EXCEEDED' },

  // Server errors
  { pattern: /500/i, errorKey: 'SERVER_ERROR' },
  { pattern: /502/i, errorKey: 'SERVER_ERROR' },
  { pattern: /503/i, errorKey: 'SERVER_MAINTENANCE' },
  { pattern: /504/i, errorKey: 'NETWORK_TIMEOUT' },
  { pattern: /internal\s*server\s*error/i, errorKey: 'SERVER_ERROR' },
  { pattern: /bad\s*gateway/i, errorKey: 'SERVER_ERROR' },
  { pattern: /service\s*unavailable/i, errorKey: 'SERVER_MAINTENANCE' },
  { pattern: /maintenance/i, errorKey: 'SERVER_MAINTENANCE' },

  // Workflow errors
  { pattern: /workflow\s*(failed|error)/i, errorKey: 'WORKFLOW_EXECUTION_FAILED' },
  { pattern: /execution\s*failed/i, errorKey: 'WORKFLOW_EXECUTION_FAILED' },

  // Integration errors
  { pattern: /integration\s*(failed|error)/i, errorKey: 'INTEGRATION_CONNECTION_FAILED' },
  { pattern: /oauth\s*(failed|error)/i, errorKey: 'INTEGRATION_CONNECTION_FAILED' },
  { pattern: /api\s*key\s*(invalid|expired)/i, errorKey: 'INTEGRATION_CONNECTION_FAILED' },

  // Storage errors
  { pattern: /storage\s*(full|quota|limit)/i, errorKey: 'STORAGE_QUOTA_EXCEEDED' },
  { pattern: /disk\s*space/i, errorKey: 'STORAGE_QUOTA_EXCEEDED' },

  // Validation errors
  { pattern: /validation\s*(failed|error)/i, errorKey: 'VALIDATION_FAILED' },
  { pattern: /invalid\s*input/i, errorKey: 'VALIDATION_FAILED' },
  { pattern: /required\s*field/i, errorKey: 'VALIDATION_FAILED' },
]

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get current locale from browser settings or local storage
 */
export function getCurrentLocale(): SupportedLocale {
  // Check localStorage for user preference
  const stored = localStorage.getItem('nexus_locale')
  if (stored && isValidLocale(stored)) {
    return stored as SupportedLocale
  }

  // Fall back to browser language
  const browserLang = navigator.language.split('-')[0]
  if (isValidLocale(browserLang)) {
    return browserLang as SupportedLocale
  }

  return 'en'
}

/**
 * Check if a locale string is supported
 */
function isValidLocale(locale: string): boolean {
  return ['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'ko'].includes(locale)
}

/**
 * Set the current locale
 */
export function setCurrentLocale(locale: SupportedLocale): void {
  localStorage.setItem('nexus_locale', locale)
}

/**
 * Get error message for a known error key
 */
export function getErrorMessage(
  errorKey: string,
  locale: SupportedLocale = getCurrentLocale()
): LocalizedErrorMessage {
  const errorDef = ERROR_CATALOG[errorKey]
  if (errorDef) {
    return errorDef.messages[locale] || errorDef.messages.en
  }
  return ERROR_CATALOG.UNKNOWN_ERROR.messages[locale] || ERROR_CATALOG.UNKNOWN_ERROR.messages.en
}

/**
 * Get error category for a known error key
 */
export function getErrorCategory(errorKey: string): ErrorCategory {
  return ERROR_CATALOG[errorKey]?.category || 'unknown'
}

/**
 * Match an error string/object to a known error key
 */
export function matchError(error: string | Error | unknown): string {
  const errorString = error instanceof Error ? error.message : String(error)

  for (const { pattern, errorKey } of ERROR_PATTERNS) {
    if (typeof pattern === 'string') {
      if (errorString.toLowerCase().includes(pattern.toLowerCase())) {
        return errorKey
      }
    } else if (pattern.test(errorString)) {
      return errorKey
    }
  }

  return 'UNKNOWN_ERROR'
}

/**
 * Get a user-friendly error message from any error
 * Main entry point for error message lookup
 */
export function getFriendlyErrorMessage(
  error: string | Error | unknown,
  locale: SupportedLocale = getCurrentLocale()
): LocalizedErrorMessage {
  const errorKey = matchError(error)
  return getErrorMessage(errorKey, locale)
}

/**
 * Get all available actions for an error
 */
export function getErrorActions(
  error: string | Error | unknown,
  locale: SupportedLocale = getCurrentLocale()
): ErrorAction[] {
  const message = getFriendlyErrorMessage(error, locale)
  return message.actions || [COMMON_ACTIONS.retry, COMMON_ACTIONS.contactSupport]
}

/**
 * Check if an error is recoverable (has retry action)
 */
export function isRecoverableError(error: string | Error | unknown): boolean {
  const actions = getErrorActions(error)
  return actions.some((action) => action.type === 'retry')
}

/**
 * Check if error requires re-authentication
 */
export function isAuthError(error: string | Error | unknown): boolean {
  const errorKey = matchError(error)
  const category = getErrorCategory(errorKey)
  return category === 'auth'
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: string | Error | unknown): boolean {
  const errorKey = matchError(error)
  const category = getErrorCategory(errorKey)
  return category === 'network'
}

// Export common actions for external use
export { COMMON_ACTIONS }
