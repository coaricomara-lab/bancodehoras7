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
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`);

if (missingFirebaseConfig.length > 0) {
  const message = `Configuração do Firebase incompleta. Preencha no arquivo .env: ${missingFirebaseConfig.join(', ')}`;
  console.error(`[Firebase] ${message}`);
  throw new Error(message);
}

const firebaseDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

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

  if (auth.currentUser && (!email || auth.currentUser.email?.toLowerCase() === email.trim().toLowerCase())) {
    await auth.currentUser.getIdToken();
    return auth.currentUser;
  }

  if (auth.currentUser) {
    await firebaseSignOut(auth);
  }

  if (email && password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') {
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          return result.user;
        } catch (createError: any) {
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
