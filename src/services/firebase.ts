import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  onSnapshot,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Helper to determine if a string is a valid Google API key format
function isValidGoogleApiKey(key?: string): boolean {
  return typeof key === 'string' && key.trim().startsWith('AIza') && key.trim().length >= 30;
}

// Helper to sanitize project ID (lowercase alphanumeric and hyphens only)
function sanitizeProjectId(input?: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (/^[a-z0-9-]+$/.test(trimmed) && !trimmed.includes('@')) {
    return trimmed;
  }
  return '';
}

// Helper to sanitize auth domain without credentials or '@'
function sanitizeAuthDomain(input?: string, projectId?: string): string {
  if (!input || typeof input !== 'string') return projectId ? `${projectId}.firebaseapp.com` : '';
  const trimmed = input.trim();
  if (/^[a-z0-9.-]+$/.test(trimmed) && !trimmed.includes('@')) {
    return trimmed;
  }
  return projectId ? `${projectId}.firebaseapp.com` : '';
}

// Helper to sanitize database ID
function sanitizeDatabaseId(input?: string): string | undefined {
  if (!input || typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  if (trimmed === '(default)' || trimmed === 'default' || trimmed === '') {
    return undefined;
  }
  if (/^[a-z0-9-]+$/.test(trimmed) && !trimmed.includes('@')) {
    return trimmed;
  }
  return undefined;
}

const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const appletApiKey = firebaseAppletConfig?.apiKey;
const resolvedApiKey = isValidGoogleApiKey(envApiKey) ? envApiKey.trim() : (appletApiKey || envApiKey || '');

const cleanProjectId = 
  sanitizeProjectId(import.meta.env.VITE_FIREBASE_PROJECT_ID) || 
  sanitizeProjectId(firebaseAppletConfig?.projectId) || 
  '';

const cleanAuthDomain = 
  sanitizeAuthDomain(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, cleanProjectId) || 
  sanitizeAuthDomain(firebaseAppletConfig?.authDomain, cleanProjectId);

const cleanDatabaseId = 
  sanitizeDatabaseId(import.meta.env.VITE_FIREBASE_DATABASE_ID) || 
  sanitizeDatabaseId(firebaseAppletConfig?.firestoreDatabaseId);

const cleanMessagingSenderId = String(
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig?.messagingSenderId || ''
).replace(/[^0-9]/g, '');

const firebaseConfig = {
  apiKey: resolvedApiKey,
  authDomain: cleanAuthDomain,
  projectId: cleanProjectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig?.storageBucket || (cleanProjectId ? `${cleanProjectId}.firebasestorage.app` : ''),
  messagingSenderId: cleanMessagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig?.appId || '',
};

// Initialize Firebase with environment configuration
const app = initializeApp(firebaseConfig);

// Initialize Firestore globally with ignoreUndefinedProperties: true
// This automatically strips or converts undefined values on all writes/batches across the entire SDK.
export const db = cleanDatabaseId 
  ? initializeFirestore(app, { ignoreUndefinedProperties: true }, cleanDatabaseId)
  : initializeFirestore(app, { ignoreUndefinedProperties: true });

/**
 * Universal deep sanitization helper to strip any `undefined` keys or convert them safely.
 */
export function sanitizeFirestorePayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map(item => sanitizeFirestorePayload(item)) as unknown as T;
  }
  if (typeof input === 'object') {
    if (input instanceof Date) {
      return input;
    }
    if (typeof (input as any).toMillis === 'function' || typeof (input as any).isEqual === 'function') {
      return input;
    }
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(input as Record<string, any>)) {
      if (value !== undefined) {
        clean[key] = sanitizeFirestorePayload(value);
      }
    }
    return clean as T;
  }
  return input;
}

// Initialize Auth with session-only persistence (expires when browser/tab is closed)
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.warn('Não foi possível configurar a persistência de sessão do Firebase Auth:', error);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isPermissionError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('permission-denied') ||
    msg.includes('Missing or insufficient permissions') ||
    msg.includes('PERMISSION_DENIED')
  );
}

export function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('resource-exhausted') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota-exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('QUOTA_EXCEEDED') ||
    msg.includes('exceeded its quota')
  );
}

export function getFirestoreFriendlyMessage(error: unknown): string {
  if (isQuotaError(error)) {
    return 'Cota diária do Cloud Firestore excedida. Operando em modo de cache local sincronizado.';
  }
  if (isPermissionError(error)) {
    return 'Erro de permissão no banco de dados. Verifique a autenticação.';
  }
  if (error instanceof Error && (error.message.includes('offline') || error.message.includes('client is offline'))) {
    return 'Conexão offline. Operando em modo de cache local sincronizado.';
  }
  return 'Instabilidade temporária no Cloud Firestore. Dados preservados com segurança no cache local.';
}

export function logFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Log:', JSON.stringify(errInfo));
  return errInfo;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo = logFirestoreError(error, operationType, path);
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is offline or connecting...");
    }
    return false;
  }
}
