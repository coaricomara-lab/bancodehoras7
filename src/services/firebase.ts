import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { 
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

// Helper to determine if a string is a valid Google API key format (starts with AIza)
function isValidGoogleApiKey(key?: string): boolean {
  return typeof key === 'string' && key.trim().startsWith('AIza') && key.trim().length >= 30;
}

const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const appletApiKey = firebaseAppletConfig?.apiKey;
const resolvedApiKey = isValidGoogleApiKey(envApiKey) ? envApiKey.trim() : (appletApiKey || envApiKey || '');

const firebaseConfig = {
  apiKey: resolvedApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig?.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig?.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig?.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig?.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig?.appId || '',
};

const firebaseDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseAppletConfig?.firestoreDatabaseId;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use the default database unless a named database is configured for this instance.
export const db = firebaseDatabaseId ? getFirestore(app, firebaseDatabaseId) : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Não foi possível configurar a persistência local do Firebase Auth:', error);
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function ensureFirebaseAdminSession(email?: string, password?: string): Promise<FirebaseUser | null> {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.warn('Persistência do Firebase Auth já estava ativa ou indisponível:', error);
  }

  const cleanEmail = email?.trim().toLowerCase();

  if (auth.currentUser && (!cleanEmail || auth.currentUser.email?.toLowerCase() === cleanEmail)) {
    try {
      await auth.currentUser.getIdToken();
      return auth.currentUser;
    } catch {
      // Token expired, re-auth below
    }
  }

  if (auth.currentUser && cleanEmail && auth.currentUser.email?.toLowerCase() !== cleanEmail) {
    await firebaseSignOut(auth);
  }

  if (cleanEmail && password) {
    try {
      const result = await signInWithEmailAndPassword(auth, cleanEmail, password);
      return result.user;
    } catch (error: any) {
      const errorCode = error?.code || '';
      
      if (errorCode === 'auth/operation-not-allowed') {
        console.info(
          '[Firebase Auth] Provedor de E-mail/Senha ainda não habilitado no console do Firebase. ' +
          'Para habilitar: Firebase Console > Authentication > Sign-in method > Email/Password > Ativar.'
        );
        return null;
      }

      // Firebase Auth returns auth/user-not-found or auth/invalid-credential (when email enumeration protection is on)
      const canAttemptAutoProvision = 
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/invalid-credential' ||
        errorCode === 'auth/invalid-login-credentials';

      if (canAttemptAutoProvision) {
        try {
          const result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          console.log(`[Firebase Auth] Conta administrativa auto-provisionada com sucesso: ${cleanEmail}`);
          return result.user;
        } catch (createError: any) {
          if (createError?.code === 'auth/operation-not-allowed') {
            console.info(
              '[Firebase Auth] Provedor de E-mail/Senha ainda não habilitado no console do Firebase. ' +
              'Para habilitar: Firebase Console > Authentication > Sign-in method > Email/Password > Ativar.'
            );
            return null;
          }
          if (createError?.code === 'auth/email-already-in-use') {
            // User exists in Firebase Auth but wrong password was typed
            throw error;
          }
          console.warn('Falha ao provisionar conta administrativa no Firebase Auth:', createError);
          throw createError;
        }
      }
      throw error;
    }
  }

  return null;
}

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
